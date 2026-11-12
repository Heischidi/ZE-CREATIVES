from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.deps import DBSession, CreativeUser, ActiveUser
from app.core.enums import AvailabilityStatus
from app.models import (
    CreativeProfile, CreativeProfileCategory, CreativeProfileSkill,
    WorkExperience, Education, CreativeCategory, Skill
)

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    professional_headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    years_experience: Optional[int] = None
    hourly_rate_min: Optional[float] = None
    hourly_rate_max: Optional[float] = None
    project_rate_min: Optional[float] = None
    project_rate_max: Optional[float] = None
    currency: Optional[str] = "USD"
    availability: Optional[AvailabilityStatus] = None
    is_public: Optional[bool] = None
    website_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    behance_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None
    dribbble_url: Optional[str] = None
    youtube_url: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    custom_skills: Optional[List[str]] = None


class OnboardingStepRequest(BaseModel):
    step: int = Field(ge=1, le=7)
    data: dict
    is_completed: bool = False


class WorkExperienceCreate(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None


class EducationCreate(BaseModel):
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    is_current: bool = False
    description: Optional[str] = None


def _format_profile(profile: CreativeProfile, detailed: bool = True):
    data = {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "professional_headline": profile.professional_headline,
        "bio": profile.bio,
        "location": profile.location,
        "country": profile.country,
        "years_experience": profile.years_experience,
        "hourly_rate_min": profile.hourly_rate_min,
        "hourly_rate_max": profile.hourly_rate_max,
        "project_rate_min": profile.project_rate_min,
        "project_rate_max": profile.project_rate_max,
        "currency": profile.currency,
        "availability": profile.availability.value if hasattr(profile.availability, "value") else str(profile.availability),
        "is_public": profile.is_public,
        "profile_views": profile.profile_views,
        "onboarding_completed": profile.onboarding_completed,
        "onboarding_step": profile.onboarding_step,
        "social_links": {
            "website": profile.website_url,
            "linkedin": profile.linkedin_url,
            "behance": profile.behance_url,
            "instagram": profile.instagram_url,
            "twitter": profile.twitter_url,
            "github": profile.github_url,
            "dribbble": profile.dribbble_url,
            "youtube": profile.youtube_url,
        },
        "user": {
            "id": str(profile.user.id) if profile.user else "",
            "first_name": profile.user.first_name if profile.user else "",
            "last_name": profile.user.last_name if profile.user else "",
            "email": profile.user.email if profile.user else "",
            "phone": profile.user.phone if profile.user else None,
            "avatar_url": profile.user.avatar_url if profile.user else None,
        } if profile.user else None,
        "categories": [
            {
                "id": str(c.category.id),
                "name": c.category.name,
                "slug": c.category.slug,
                "is_primary": c.is_primary,
            }
            for c in (profile.categories or []) if c.category
        ],
        "skills": [
            {
                "id": str(s.id),
                "name": s.skill.name if s.skill else s.custom_skill,
                "proficiency_level": s.proficiency_level,
            }
            for s in (profile.skills or [])
        ],
    }
    if detailed:
        data["work_experiences"] = [
            {
                "id": str(w.id),
                "title": w.title,
                "company": w.company,
                "location": w.location,
                "employment_type": w.employment_type,
                "is_current": w.is_current,
                "description": w.description,
            }
            for w in (profile.work_experiences or [])
        ]
        data["education"] = [
            {
                "id": str(e.id),
                "institution": e.institution,
                "degree": e.degree,
                "field_of_study": e.field_of_study,
                "start_year": e.start_year,
                "end_year": e.end_year,
                "is_current": e.is_current,
                "description": e.description,
            }
            for e in (profile.education or [])
        ]
    return data


@router.get("/me")
async def get_my_creative_profile(db: DBSession, current_user: CreativeUser):
    res = await db.execute(
        select(CreativeProfile)
        .where(CreativeProfile.user_id == current_user.id)
        .options(
            selectinload(CreativeProfile.user),
            selectinload(CreativeProfile.categories).selectinload(CreativeProfileCategory.category),
            selectinload(CreativeProfile.skills).selectinload(CreativeProfileSkill.skill),
            selectinload(CreativeProfile.work_experiences),
            selectinload(CreativeProfile.education),
        )
    )
    profile = res.scalar_one_or_none()
    if not profile:
        # Auto-create if missing
        profile = CreativeProfile(user_id=current_user.id)
        db.add(profile)
        await db.flush()
        await db.refresh(profile)

    return _format_profile(profile, detailed=True)


@router.patch("/me")
@router.put("/me", include_in_schema=False)
async def update_my_creative_profile(payload: ProfileUpdateRequest, db: DBSession, current_user: CreativeUser):
    res = await db.execute(
        select(CreativeProfile)
        .where(CreativeProfile.user_id == current_user.id)
        .options(
            selectinload(CreativeProfile.user),
            selectinload(CreativeProfile.categories).selectinload(CreativeProfileCategory.category),
            selectinload(CreativeProfile.skills).selectinload(CreativeProfileSkill.skill),
            selectinload(CreativeProfile.work_experiences),
            selectinload(CreativeProfile.education),
        )
    )
    profile = res.scalar_one_or_none()
    if not profile:
        profile = CreativeProfile(user_id=current_user.id)
        db.add(profile)
        await db.flush()

    data = payload.model_dump(exclude_unset=True)
    for user_field in ("first_name", "last_name", "phone"):
        if user_field in data:
            val = data.pop(user_field)
            if val is not None:
                setattr(current_user, user_field, val)

    custom_skills = data.pop("custom_skills", None)
    for field, val in data.items():
        setattr(profile, field, val)

    if custom_skills is not None:
        await db.execute(delete(CreativeProfileSkill).where(CreativeProfileSkill.profile_id == profile.id))
        for sk in custom_skills:
            clean = sk.strip()
            if clean:
                db.add(CreativeProfileSkill(profile_id=profile.id, custom_skill=clean, proficiency_level=5))

    profile.onboarding_completed = True
    await db.flush()

    # Re-fetch with relationships
    refreshed = await db.execute(
        select(CreativeProfile)
        .where(CreativeProfile.id == profile.id)
        .options(
            selectinload(CreativeProfile.user),
            selectinload(CreativeProfile.categories).selectinload(CreativeProfileCategory.category),
            selectinload(CreativeProfile.skills).selectinload(CreativeProfileSkill.skill),
            selectinload(CreativeProfile.work_experiences),
            selectinload(CreativeProfile.education),
        )
    )
    return _format_profile(refreshed.scalar_one(), detailed=True)


@router.post("/me/onboarding")
async def update_onboarding_step(payload: OnboardingStepRequest, db: DBSession, current_user: CreativeUser):
    res = await db.execute(
        select(CreativeProfile).where(CreativeProfile.user_id == current_user.id)
    )
    profile = res.scalar_one_or_none()
    if not profile:
        profile = CreativeProfile(user_id=current_user.id)
        db.add(profile)

    profile.onboarding_step = max(profile.onboarding_step, payload.step + 1)
    if payload.is_completed or payload.step >= 7:
        profile.onboarding_completed = True

    # Apply data updates based on step
    d = payload.data
    if "headline" in d:
        profile.professional_headline = d["headline"]
    if "bio" in d:
        profile.bio = d["bio"]
    if "location" in d:
        profile.location = d["location"]
    if "hourly_rate" in d:
        profile.hourly_rate_min = float(d["hourly_rate"])
    if "availability" in d:
        try:
            profile.availability = AvailabilityStatus(d["availability"])
        except Exception:
            pass

    await db.flush()
    return {
        "message": "Onboarding step saved",
        "onboarding_step": profile.onboarding_step,
        "onboarding_completed": profile.onboarding_completed,
    }


@router.post("/me/categories")
async def set_my_categories(category_ids: List[UUID], db: DBSession, current_user: CreativeUser):
    res = await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Remove existing
    await db.execute(delete(CreativeProfileCategory).where(CreativeProfileCategory.profile_id == profile.id))

    for idx, cid in enumerate(category_ids):
        db.add(CreativeProfileCategory(
            profile_id=profile.id,
            category_id=cid,
            is_primary=(idx == 0),
        ))
    await db.flush()
    return {"message": "Categories updated successfully."}


@router.post("/me/work-experience")
async def add_work_experience(payload: WorkExperienceCreate, db: DBSession, current_user: CreativeUser):
    res = await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    exp = WorkExperience(profile_id=profile.id, **payload.model_dump())
    db.add(exp)
    await db.flush()
    return {"message": "Work experience added.", "id": str(exp.id)}


@router.delete("/me/work-experience/{exp_id}")
async def delete_work_experience(exp_id: UUID, db: DBSession, current_user: CreativeUser):
    res = await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    await db.execute(
        delete(WorkExperience).where(WorkExperience.id == exp_id, WorkExperience.profile_id == profile.id)
    )
    await db.flush()
    return {"message": "Work experience deleted."}


@router.post("/me/education")
async def add_education(payload: EducationCreate, db: DBSession, current_user: CreativeUser):
    res = await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    edu = Education(profile_id=profile.id, **payload.model_dump())
    db.add(edu)
    await db.flush()
    return {"message": "Education added.", "id": str(edu.id)}


@router.delete("/me/education/{edu_id}")
async def delete_education(edu_id: UUID, db: DBSession, current_user: CreativeUser):
    res = await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    await db.execute(
        delete(Education).where(Education.id == edu_id, Education.profile_id == profile.id)
    )
    await db.flush()
    return {"message": "Education deleted."}
