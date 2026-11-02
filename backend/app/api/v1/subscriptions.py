from uuid import UUID
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.core.deps import DBSession, ActiveUser, AdminUser
from app.core.enums import SubscriptionStatus, PaymentStatus
from app.models import SubscriptionPlan, Subscription, Payment

router = APIRouter()


class SubscribeRequest(BaseModel):
    plan_id: UUID


@router.get("/plans")
async def list_subscription_plans(db: DBSession):
    res = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active.is_(True))
        .order_by(SubscriptionPlan.sort_order.asc(), SubscriptionPlan.price_monthly.asc())
    )
    plans = res.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "slug": p.slug,
            "description": p.description,
            "price_monthly": p.price_monthly,
            "price_yearly": p.price_yearly,
            "currency": p.currency,
            "target_role": p.target_role.value if hasattr(p.target_role, "value") else str(p.target_role),
            "features": p.features or [],
            "limits": p.limits or {},
            "is_featured": p.is_featured,
        }
        for p in plans
    ]


@router.get("/me")
async def get_my_subscription(db: DBSession, current_user: ActiveUser):
    res = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    )
    sub = res.scalars().first()
    if not sub:
        return {"has_subscription": False, "subscription": None}

    return {
        "has_subscription": True,
        "subscription": {
            "id": str(sub.id),
            "plan_id": str(sub.plan_id),
            "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status),
            "starts_at": sub.starts_at.isoformat() if sub.starts_at else None,
            "ends_at": sub.ends_at.isoformat() if sub.ends_at else None,
        },
    }


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_to_plan(payload: SubscribeRequest, db: DBSession, current_user: ActiveUser):
    plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == payload.plan_id))
    plan = plan_res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    now = datetime.now(timezone.utc)
    period_end = now + timedelta(days=30)

    sub = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        status=SubscriptionStatus.ACTIVE,
        starts_at=now,
        ends_at=period_end,
    )
    db.add(sub)
    await db.flush()

    # Record payment
    pmt = Payment(
        subscription_id=sub.id,
        user_id=current_user.id,
        amount=plan.price_monthly,
        currency=plan.currency,
        status=PaymentStatus.PAID,
        payment_provider="stripe_mock",
    )
    db.add(pmt)
    await db.flush()

    return {"message": "Subscribed successfully.", "subscription_id": str(sub.id)}
