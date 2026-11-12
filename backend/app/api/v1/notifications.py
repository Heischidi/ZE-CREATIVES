from uuid import UUID
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update, func

from app.core.deps import DBSession, ActiveUser
from app.models import Notification

router = APIRouter()


@router.get("")
@router.get("/", include_in_schema=False)
async def list_my_notifications(db: DBSession, current_user: ActiveUser, unread_only: bool = False):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))

    res = await db.execute(query.order_by(Notification.created_at.desc()).limit(50))
    notifications = res.scalars().all()

    return [
        {
            "id": str(n.id),
            "type": n.type.value if hasattr(n.type, "value") else str(n.type),
            "title": n.title,
            "message": n.message,
            "data": n.data or {},
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]


@router.get("/unread-count")
async def get_unread_count(db: DBSession, current_user: ActiveUser):
    res = await db.execute(
        select(func.count()).where(
            Notification.user_id == current_user.id, Notification.is_read.is_(False)
        )
    )
    return {"unread_count": res.scalar() or 0}


@router.post("/{notification_id}/read")
async def mark_notification_read(notification_id: UUID, db: DBSession, current_user: ActiveUser):
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == current_user.id)
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    await db.flush()
    return {"message": "Notification marked as read."}


@router.post("/read-all")
async def mark_all_read(db: DBSession, current_user: ActiveUser):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    await db.flush()
    return {"message": "All notifications marked as read."}
