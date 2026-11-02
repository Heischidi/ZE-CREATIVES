"""
Admin API — user management, dashboard stats, audit logs.
All routes require admin or super_admin role.
"""
from uuid import UUID
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func, update
from pydantic import BaseModel, EmailStr, Field

from app.core.deps import DBSession, AdminUser, SuperAdminUser
from app.core.enums import (
    UserRole, AccountStatus, AuditAction, CreativeApplicationStatus
)
from app.core.security import create_invitation_token, invitation_token_expiry
from app.models import (
    User, CreativeProfile, ClientProfile, Job, JobApplication,
    CreativeApplication, ClientApplication, AdminAuditLog, UserInvitation,
    Announcement, PlatformSetting,
)
from app.services.email import email_service

router = APIRouter()


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

@router.get("/dashboard")
async def admin_dashboard(db: DBSession, admin: AdminUser):
    total_users = await db.scalar(select(func.count(User.id)).where(User.deleted_at.is_(None)))
    total_creatives = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.CREATIVE, User.deleted_at.is_(None))
    )
    total_clients = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.CLIENT, User.deleted_at.is_(None))
    )
    pending_creative_apps = await db.scalar(
        select(func.count(CreativeApplication.id)).where(
            CreativeApplication.status == CreativeApplicationStatus.PENDING
        )
    )
    pending_client_apps = await db.scalar(
        select(func.count(ClientApplication.id)).where(
            ClientApplication.status == CreativeApplicationStatus.PENDING
        )
    )
    active_jobs = await db.scalar(
        select(func.count(Job.id)).where(Job.status == "active", Job.deleted_at.is_(None))
    )
    total_applications = await db.scalar(select(func.count(JobApplication.id)))
    suspended_accounts = await db.scalar(
        select(func.count(User.id)).where(User.status == AccountStatus.SUSPENDED)
    )

    return {
        "total_users": total_users,
        "total_creatives": total_creatives,
        "total_clients": total_clients,
        "pending_creative_applications": pending_creative_apps,
        "pending_client_applications": pending_client_apps,
        "active_jobs": active_jobs,
        "total_applications": total_applications,
        "suspended_accounts": suspended_accounts,
    }


# ─── User Management ──────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: Optional[str] = None
    role: UserRole


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(payload: CreateUserRequest, db: DBSession, admin: AdminUser):
    """Admin creates a client or creative account directly, sends invitation."""
    if payload.role in (UserRole.SUPER_ADMIN, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Use the admin creation endpoint to create administrator accounts.",
        )

    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    user = User(
        email=payload.email.lower(),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        role=payload.role,
        status=AccountStatus.INVITATION_SENT,
    )
    db.add(user)
    await db.flush()

    raw_token, token_hash = create_invitation_token()
    invitation = UserInvitation(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=invitation_token_expiry(),
        invited_by_id=admin.id,
    )
    db.add(invitation)

    log = AdminAuditLog(
        admin_id=admin.id,
        action=AuditAction.USER_CREATED,
        target_user_id=user.id,
        description=f"Created {payload.role.value} account for {payload.email}.",
    )
    db.add(log)
    await db.flush()

    await email_service.send_invitation(user.email, user.first_name, raw_token, payload.role.value)

    return {
        "message": f"Account created and invitation sent to {user.email}.",
        "user_id": str(user.id),
    }


@router.get("/users")
async def list_users(
    db: DBSession,
    admin: AdminUser,
    role: Optional[UserRole] = None,
    account_status: Optional[AccountStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(User).where(User.deleted_at.is_(None))
    if role:
        query = query.where(User.role == role)
    if account_status:
        query = query.where(User.status == account_status)
    if search:
        query = query.where(
            User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
        )

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(
        query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    users = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [_format_user(u) for u in users],
    }


@router.get("/users/{user_id}")
async def get_user(user_id: UUID, db: DBSession, admin: AdminUser):
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return _format_user(user, detailed=True)


class UpdateUserStatusRequest(BaseModel):
    action: str  # "suspend", "reactivate", "deactivate"
    reason: Optional[str] = None


@router.post("/users/{user_id}/status")
async def update_user_status(
    user_id: UUID,
    payload: UpdateUserStatusRequest,
    db: DBSession,
    admin: AdminUser,
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    action_map = {
        "suspend": (AccountStatus.SUSPENDED, AuditAction.USER_SUSPENDED),
        "reactivate": (AccountStatus.ACTIVE, AuditAction.USER_REACTIVATED),
        "deactivate": (AccountStatus.DEACTIVATED, AuditAction.USER_DEACTIVATED),
    }
    if payload.action not in action_map:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action.")

    new_status, audit_action = action_map[payload.action]
    user.status = new_status

    log = AdminAuditLog(
        admin_id=admin.id,
        action=audit_action,
        target_user_id=user.id,
        description=f"{payload.action.capitalize()} user {user.email}. Reason: {payload.reason or 'N/A'}",
    )
    db.add(log)

    return {"message": f"User status updated to {new_status.value}."}


@router.post("/users/{user_id}/resend-invitation")
async def resend_invitation(user_id: UUID, db: DBSession, admin: AdminUser):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.status != AccountStatus.INVITATION_SENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or not in invitation_sent state.",
        )

    raw_token, token_hash = create_invitation_token()
    invitation = UserInvitation(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=invitation_token_expiry(),
        invited_by_id=admin.id,
    )
    db.add(invitation)
    await db.flush()

    await email_service.send_invitation(user.email, user.first_name, raw_token, user.role.value)
    return {"message": f"New invitation sent to {user.email}."}


# ─── Admin Creation (super admin only) ───────────────────────────────────────

class CreateAdminRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    is_super_admin: bool = False


@router.post("/admins", status_code=status.HTTP_201_CREATED)
async def create_admin(payload: CreateAdminRequest, db: DBSession, super_admin: SuperAdminUser):
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    role = UserRole.SUPER_ADMIN if payload.is_super_admin else UserRole.ADMIN
    user = User(
        email=payload.email.lower(),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=role,
        status=AccountStatus.INVITATION_SENT,
    )
    db.add(user)
    await db.flush()

    raw_token, token_hash = create_invitation_token()
    invitation = UserInvitation(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=invitation_token_expiry(),
        invited_by_id=super_admin.id,
    )
    db.add(invitation)

    log = AdminAuditLog(
        admin_id=super_admin.id,
        action=AuditAction.ADMIN_CREATED,
        target_user_id=user.id,
        description=f"Created {role.value} account for {payload.email}.",
    )
    db.add(log)
    await db.flush()

    await email_service.send_invitation(user.email, user.first_name, raw_token, role.value)
    return {"message": f"Admin account created and invitation sent to {user.email}.", "user_id": str(user.id)}


# ─── Audit Logs ───────────────────────────────────────────────────────────────

@router.get("/audit-logs")
async def get_audit_logs(
    db: DBSession,
    admin: AdminUser,
    action: Optional[str] = None,
    admin_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    query = select(AdminAuditLog).order_by(AdminAuditLog.created_at.desc())
    if action:
        query = query.where(AdminAuditLog.action == action)
    if admin_id:
        query = query.where(AdminAuditLog.admin_id == admin_id)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    logs = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [
            {
                "id": str(l.id),
                "admin_id": str(l.admin_id),
                "action": l.action.value,
                "target_user_id": str(l.target_user_id) if l.target_user_id else None,
                "description": l.description,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs
        ],
    }


# ─── Announcements ────────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str
    target_roles: Optional[list[str]] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


@router.post("/announcements", status_code=status.HTTP_201_CREATED)
async def create_announcement(payload: AnnouncementCreate, db: DBSession, admin: AdminUser):
    announcement = Announcement(
        title=payload.title,
        content=payload.content,
        target_roles=payload.target_roles,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        created_by_id=admin.id,
    )
    db.add(announcement)
    await db.flush()
    return {"message": "Announcement created.", "id": str(announcement.id)}


@router.get("/announcements")
async def list_announcements(db: DBSession, admin: AdminUser, page: int = Query(1, ge=1), per_page: int = 20):
    result = await db.execute(
        select(Announcement).order_by(Announcement.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    items = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "content": a.content,
            "target_roles": a.target_roles,
            "is_active": a.is_active,
            "starts_at": a.starts_at.isoformat() if a.starts_at else None,
            "ends_at": a.ends_at.isoformat() if a.ends_at else None,
            "created_at": a.created_at.isoformat(),
        }
        for a in items
    ]


# ─── Platform Settings ────────────────────────────────────────────────────────

@router.get("/settings")
async def get_platform_settings(db: DBSession, admin: AdminUser):
    result = await db.execute(select(PlatformSetting))
    settings_list = result.scalars().all()
    return {s.key: {"value": s.value, "value_json": s.value_json, "description": s.description} for s in settings_list}


class SettingUpdate(BaseModel):
    value: Optional[str] = None
    value_json: Optional[dict] = None


@router.put("/settings/{key}")
async def update_platform_setting(key: str, payload: SettingUpdate, db: DBSession, admin: AdminUser):
    result = await db.execute(select(PlatformSetting).where(PlatformSetting.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        setting = PlatformSetting(key=key)
        db.add(setting)

    setting.value = payload.value
    setting.value_json = payload.value_json
    setting.updated_by_id = admin.id
    return {"message": f"Setting '{key}' updated."}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _format_user(user: User, detailed: bool = False) -> dict:
    data = {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "status": user.status.value,
        "avatar_url": user.avatar_url,
        "phone": user.phone,
        "is_email_verified": user.is_email_verified,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "created_at": user.created_at.isoformat(),
    }
    return data
