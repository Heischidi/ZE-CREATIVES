from uuid import UUID
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import DBSession, ClientUser
from app.models import ClientProfile

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
            "first_name": profile.user.first_name,
            "last_name": profile.user.last_name,
            "email": profile.user.email,
        } if profile.user else None,
    }


@router.patch("/me")
async def update_my_client_profile(payload: ClientProfileUpdate, db: DBSession, current_user: ClientUser):
    res = await db.execute(select(ClientProfile).where(ClientProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        profile = ClientProfile(user_id=current_user.id)
        db.add(profile)

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, val)

    await db.flush()
    return {"message": "Client profile updated successfully."}
