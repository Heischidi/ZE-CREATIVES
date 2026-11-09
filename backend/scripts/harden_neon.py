"""
One-off hardening of the production (Neon) database after the initial seed.

The first seed created three accounts with passwords that are public in the repo:
  admin@zecreatives.com (password from ADMIN_SEED_PASSWORD), elena@zecreatives.com, client@zecreatives.com.

Usage (from the backend/ folder, with backend/.env pointing at Neon):

  python scripts/harden_neon.py --clean-demo            # DRY RUN: shows what would happen
  python scripts/harden_neon.py --clean-demo --apply    # delete demo data + set new admin password
  python scripts/harden_neon.py --keep-demo --apply     # keep demo accounts, set new passwords for all three

Passwords are typed at a hidden prompt, so they never appear in shell history or chat.
Everything runs in ONE transaction: if anything fails (e.g. a foreign-key problem) nothing is changed.
"""
import argparse
import asyncio
import getpass
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text  # noqa: E402

from app.core.security import get_password_hash  # noqa: E402
from app.db.session import engine  # noqa: E402

logging.disable(logging.CRITICAL)
engine.echo = False

ADMIN_EMAIL = "admin@zecreatives.com"
DEMO_CREATIVE = "elena@zecreatives.com"
DEMO_CLIENT = "client@zecreatives.com"

# Tables whose demo rows are removed explicitly by --clean-demo (in this order).
PROFILE_TABLES = ("creative_profiles", "client_profiles")


def ask_password(label: str) -> str:
    while True:
        pw = getpass.getpass(f"New password for {label} (min 12 chars): ")
        if len(pw) < 12:
            print("  Too short, try again.")
            continue
        if pw != getpass.getpass("  Repeat password: "):
            print("  Passwords do not match, try again.")
            continue
        return pw


async def user_id(conn, email: str):
    return (await conn.execute(text("select id from users where email = :e"), {"e": email})).scalar()


async def set_password(conn, email: str, password: str):
    await conn.execute(
        text("update users set hashed_password = :h where email = :e"),
        {"h": get_password_hash(password), "e": email},
    )
    print(f"  password updated for {email}")


async def fk_columns_to_users(conn):
    q = text(
        """
        select tc.table_name, kcu.column_name
        from information_schema.table_constraints tc
        join information_schema.key_column_usage kcu
          on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
        join information_schema.constraint_column_usage ccu
          on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
        where tc.constraint_type = 'FOREIGN KEY' and ccu.table_name = 'users' and ccu.column_name = 'id'
          and tc.table_schema = 'public'
        order by 1, 2
        """
    )
    return [(r.table_name, r.column_name) for r in (await conn.execute(q)).all()]


async def clean_demo(conn, apply: bool):
    creative_id = await user_id(conn, DEMO_CREATIVE)
    client_id = await user_id(conn, DEMO_CLIENT)
    demo_ids = [i for i in (creative_id, client_id) if i]
    if not demo_ids:
        print("No demo users found, nothing to delete.")
        return

    # Anything pointing at the demo users besides their own profiles means real activity: abort.
    unexpected = []
    for table, col in await fk_columns_to_users(conn):
        if table in PROFILE_TABLES:
            continue
        n = (
            await conn.execute(
                text(f'select count(*) from "{table}" where "{col}" = any(:ids)'), {"ids": demo_ids}
            )
        ).scalar()
        if n:
            unexpected.append(f"{table}.{col}: {n} row(s)")
    if unexpected:
        raise SystemExit("ABORTED: demo users are referenced elsewhere:\n  " + "\n  ".join(unexpected))

    client_profile_ids = (
        await conn.execute(text("select id from client_profiles where user_id = any(:ids)"), {"ids": demo_ids})
    ).scalars().all()
    creative_profile_ids = (
        await conn.execute(text("select id from creative_profiles where user_id = any(:ids)"), {"ids": demo_ids})
    ).scalars().all()
    job_ids = (
        await conn.execute(text("select id from jobs where client_id = any(:ids)"), {"ids": client_profile_ids})
    ).scalars().all()

    print(f"Would delete: {len(job_ids)} job(s), {len(creative_profile_ids)} creative profile(s), "
          f"{len(client_profile_ids)} client profile(s), {len(demo_ids)} user(s).")
    if not apply:
        return

    # Dependents first. Any leftover FK reference makes the transaction fail and roll back.
    for table in ("job_skills", "job_applications", "saved_jobs"):
        await conn.execute(text(f"delete from {table} where job_id = any(:ids)"), {"ids": job_ids})
    await conn.execute(text("delete from jobs where id = any(:ids)"), {"ids": job_ids})
    for table in (
        "creative_profile_skills", "creative_profile_categories", "education",
        "work_experiences", "portfolio_projects",
    ):
        await conn.execute(text(f"delete from {table} where profile_id = any(:ids)"), {"ids": creative_profile_ids})
    await conn.execute(text("delete from creative_profiles where id = any(:ids)"), {"ids": creative_profile_ids})
    await conn.execute(text("delete from client_profiles where id = any(:ids)"), {"ids": client_profile_ids})
    await conn.execute(text("delete from users where id = any(:ids)"), {"ids": demo_ids})
    print("  demo data deleted")


async def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--clean-demo", action="store_true", help="delete demo creative, demo client and sample job")
    mode.add_argument("--keep-demo", action="store_true", help="keep demo accounts but change all passwords")
    parser.add_argument("--apply", action="store_true", help="actually write changes (default is a dry run)")
    args = parser.parse_args()

    async with engine.begin() as conn:
        if not await user_id(conn, ADMIN_EMAIL):
            raise SystemExit(f"Admin {ADMIN_EMAIL} not found in this database.")

        print("DRY RUN (no changes will be written; add --apply to execute)\n" if not args.apply else "APPLYING CHANGES\n")

        if args.clean_demo:
            await clean_demo(conn, args.apply)
        else:
            print("Would keep demo accounts and reset passwords for admin, creative and client.")

        if not args.apply:
            print(f"Would set a new password for {ADMIN_EMAIL}.")
            await conn.rollback()
            return

        await set_password(conn, ADMIN_EMAIL, ask_password(ADMIN_EMAIL))
        if args.keep_demo:
            await set_password(conn, DEMO_CREATIVE, ask_password(DEMO_CREATIVE))
            await set_password(conn, DEMO_CLIENT, ask_password(DEMO_CLIENT))
        print("\nDone. Changes committed.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

