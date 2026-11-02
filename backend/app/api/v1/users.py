from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func, update

from app.core.deps import DBSession, AdminUser, ActiveUser
from app.core.enums import UserRole, AccountStatus, AuditAction
from app.models import User, AdminAuditLog

router = APIRouter()


class UserStatusUpdate(BaseModel):
    status: AccountStatus
    reason: Optional[str] = None


@router.get("/")
async def list_users(
    db: DBSession,
    admin: AdminUser,
    role: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if status_filter:
        query = query.where(User.status == status_filter)
    if search:
        query = query.where(
            User.email.ilike(f"%{search}%")
            | User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
        )

    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar()

    result = await db.execute(
        query.order_by(User.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    users = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role": u.role.value if hasattr(u.role, "value") else str(u.role),
                "status": u.status.value if hasattr(u.status, "value") else str(u.status),
                "avatar_url": u.avatar_url,
                "is_email_verified": u.is_email_verified,
                "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


@router.get("/me")
async def get_current_user_profile(current_user: ActiveUser):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        "status": current_user.status.value if hasattr(current_user.status, "value") else str(current_user.status),
        "avatar_url": current_user.avatar_url,
        "phone": current_user.phone,
    }


@router.patch("/{user_id}/status")
async def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    db: DBSession,
    admin: AdminUser,
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot alter own status.")

    prev = user.status
    user.status = payload.status

    audit = AdminAuditLog(
        admin_id=admin.id,
        action=AuditAction.UPDATE_USER_STATUS,
        target_type="user",
        target_id=user.id,
        description=f"Changed user {user.email} status from {prev} to {payload.status}. Reason: {payload.reason or 'N/A'}",
    )
    db.add(audit)
    await db.flush()

    return {"message": "User status updated successfully.", "status": user.status.value}
