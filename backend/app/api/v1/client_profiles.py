from uuid import UUID
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import DBSession, ClientUser
from app.core.enums import NotificationType
from app.models import (
    ClientProfile, CreativeProfile, Job, Conversation,
    ConversationParticipant, Message, Notification
)

router = APIRouter()


class ClientProfileUpdate(BaseModel):
    organisation_name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class InviteCreativeToJobRequest(BaseModel):
    creative_profile_id: UUID
    job_id: Optional[UUID] = None
    message: Optional[str] = None


@router.get("/me")
async def get_my_client_profile(db: DBSession, current_user: ClientUser):
    res = await db.execute(
        select(ClientProfile)
        .where(ClientProfile.user_id == current_user.id)
        .options(selectinload(ClientProfile.user))
    )
    profile = res.scalar_one_or_none()
    if not profile:
        profile = ClientProfile(user_id=current_user.id, organisation_name=f"{current_user.first_name}'s Organisation")
        db.add(profile)
        await db.flush()
        await db.refresh(profile)

    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "organisation_name": profile.organisation_name,
        "industry": profile.industry,
        "company_size": profile.company_size,
        "website_url": profile.website_url,
        "logo_url": profile.logo_url,
        "description": profile.description,
        "location": profile.location,
        "country": profile.country,
        "linkedin_url": profile.linkedin_url,
        "twitter_url": profile.twitter_url,
        "is_verified": profile.is_verified,
        "onboarding_completed": profile.onboarding_completed,
        "user": {
            "id": str(current_user.id),
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "email": current_user.email,
            "phone": current_user.phone,
        },
    }


@router.patch("/me")
@router.put("/me", include_in_schema=False)
async def update_my_client_profile(payload: ClientProfileUpdate, db: DBSession, current_user: ClientUser):
    res = await db.execute(select(ClientProfile).where(ClientProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        profile = ClientProfile(user_id=current_user.id)
        db.add(profile)

    data = payload.model_dump(exclude_unset=True)
    for user_field in ("first_name", "last_name", "phone"):
        if user_field in data:
            val = data.pop(user_field)
            if val is not None:
                setattr(current_user, user_field, val)

    for field, val in data.items():
        setattr(profile, field, val)

    profile.onboarding_completed = True
    await db.flush()
    return {"message": "Client profile updated successfully."}


@router.post("/invite-creative")
async def invite_creative_to_job(
    payload: InviteCreativeToJobRequest,
    db: DBSession,
    current_user: ClientUser,
):
    """Allow a Client to directly invite a vetted Creative to apply or collaborate on a role."""
    client_res = await db.execute(select(ClientProfile).where(ClientProfile.user_id == current_user.id))
    client_profile = client_res.scalar_one_or_none()
    org_name = client_profile.organisation_name if client_profile else f"{current_user.first_name} {current_user.last_name}"

    creative_res = await db.execute(
        select(CreativeProfile)
        .options(selectinload(CreativeProfile.user))
        .where(CreativeProfile.id == payload.creative_profile_id)
    )
    creative_profile = creative_res.scalar_one_or_none()
    if not creative_profile or not creative_profile.user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creative not found.")

    job_title = "Creative Commission / Opportunity"
    if payload.job_id:
        job_obj = await db.scalar(select(Job).where(Job.id == payload.job_id))
        if job_obj:
            job_title = job_obj.title

    subject = f"Invitation from {org_name}: {job_title}"
    body = payload.message or (
        f"Hi {creative_profile.user.first_name}, we reviewed your portfolio on Ze: Creatives and would love to invite you "
        f"to apply or discuss our '{job_title}' opportunity at {org_name}."
    )

    now = datetime.now(timezone.utc)
    conv = Conversation(subject=subject, last_message_at=now)
    db.add(conv)
    await db.flush()

    db.add_all([
        ConversationParticipant(conversation_id=conv.id, user_id=current_user.id),
        ConversationParticipant(conversation_id=conv.id, user_id=creative_profile.user_id),
    ])
    db.add(Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=body,
    ))

    db.add(Notification(
        user_id=creative_profile.user_id,
        type=NotificationType.JOB_MATCH,
        title=f"Direct Role Invitation from {org_name}",
        message=f"{org_name} invited you to consider '{job_title}'. Check your messages to respond.",
        data={
            "job_id": str(payload.job_id) if payload.job_id else None,
            "conversation_id": str(conv.id),
            "organisation_name": org_name,
        },
    ))
    await db.flush()

    return {
        "message": f"Invitation sent to {creative_profile.user.first_name} {creative_profile.user.last_name}.",
        "conversation_id": str(conv.id),
    }
