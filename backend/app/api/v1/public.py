"""
Public endpoints — no authentication required.
Jobs, creative profiles, categories browsing.
"""
from typing import Optional
from fastapi import APIRouter, Query
from sqlalchemy import select, func

from app.core.deps import DBSession
from app.core.enums import JobStatus, AccountStatus, UserRole
from app.models import Job, CreativeProfile, User, CreativeCategory, Skill, SubscriptionPlan

router = APIRouter()


@router.get("/jobs")
async def list_public_jobs(
    db: DBSession,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    work_arrangement: Optional[str] = None,
    employment_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    country: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    from sqlalchemy.orm import selectinload, joinedload
    query = (
        select(Job)
        .where(Job.status == JobStatus.ACTIVE, Job.deleted_at.is_(None))
        .options(joinedload(Job.client), joinedload(Job.category))
    )

    if search:
        query = query.where(Job.title.ilike(f"%{search}%"))
    if category_id:
        query = query.where(Job.category_id == category_id)
    if work_arrangement:
        query = query.where(Job.work_arrangement == work_arrangement)
    if employment_type:
        query = query.where(Job.employment_type == employment_type)
    if experience_level:
        query = query.where(Job.experience_level == experience_level)
    if country:
        query = query.where(Job.country.ilike(f"%{country}%"))

    total_result = await db.execute(
        select(func.count()).select_from(
            select(Job.id).where(Job.status == JobStatus.ACTIVE, Job.deleted_at.is_(None)).subquery()
        )
    )
    total = total_result.scalar()

    result = await db.execute(
        query.order_by(Job.is_featured.desc(), Job.published_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    jobs = result.unique().scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [_format_job(j) for j in jobs],
    }


@router.get("/jobs/{job_id}")
async def get_public_job(job_id: str, db: DBSession):
    from sqlalchemy.orm import joinedload
    result = await db.execute(
        select(Job)
        .where(Job.id == job_id, Job.status == JobStatus.ACTIVE)
        .options(joinedload(Job.client), joinedload(Job.category), joinedload(Job.skills))
    )
    job = result.unique().scalar_one_or_none()
    if not job:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    # Increment view count
    job.views_count = (job.views_count or 0) + 1

    return _format_job(job, detailed=True)


@router.get("/creatives")
async def list_public_creatives(
    db: DBSession,
    category_id: Optional[str] = None,
    availability: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    from sqlalchemy.orm import joinedload
    # Only show profiles of ACTIVE users
    query = (
        select(CreativeProfile)
        .join(User, User.id == CreativeProfile.user_id)
        .where(
            User.status == AccountStatus.ACTIVE,
            User.role == UserRole.CREATIVE,
            CreativeProfile.is_public == True,
        )
        .options(joinedload(CreativeProfile.user), joinedload(CreativeProfile.categories))
    )

    if availability:
        query = query.where(CreativeProfile.availability == availability)
    if search:
        query = query.join(User).where(
            User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
            | CreativeProfile.professional_headline.ilike(f"%{search}%")
        )

    result = await db.execute(
        query.order_by(CreativeProfile.profile_views.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    profiles = result.unique().scalars().all()

    return {
        "total": len(profiles),
        "page": page,
        "per_page": per_page,
        "items": [_format_creative(p) for p in profiles],
    }


@router.get("/creatives/{profile_id}")
async def get_public_creative(profile_id: str, db: DBSession):
    from sqlalchemy.orm import selectinload, joinedload
    from fastapi import HTTPException, status as http_status

    result = await db.execute(
        select(CreativeProfile)
        .join(User, User.id == CreativeProfile.user_id)
        .where(
            CreativeProfile.id == profile_id,
            User.status == AccountStatus.ACTIVE,
            CreativeProfile.is_public == True,
        )
        .options(
            joinedload(CreativeProfile.user),
            selectinload(CreativeProfile.categories),
            selectinload(CreativeProfile.skills),
            selectinload(CreativeProfile.portfolio_projects),
            selectinload(CreativeProfile.work_experiences),
            selectinload(CreativeProfile.education),
        )
    )
    profile = result.unique().scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Creative profile not found.")

    profile.profile_views = (profile.profile_views or 0) + 1
    return _format_creative(profile, detailed=True)


@router.get("/categories")
async def list_categories(db: DBSession):
    result = await db.execute(
        select(CreativeCategory).where(CreativeCategory.is_active == True).order_by(CreativeCategory.sort_order)
    )
    cats = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "slug": c.slug,
            "description": c.description,
            "icon": c.icon,
            "color": c.color,
        }
        for c in cats
    ]


@router.get("/subscription-plans")
async def list_public_plans(db: DBSession):
    result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.sort_order)
    )
    plans = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "slug": p.slug,
            "description": p.description,
            "target_role": p.target_role.value,
            "price_monthly": p.price_monthly,
            "price_yearly": p.price_yearly,
            "currency": p.currency,
            "features": p.features,
            "is_featured": p.is_featured,
        }
        for p in plans
    ]


# ─── Formatters ───────────────────────────────────────────────────────────────

def _format_job(job: Job, detailed: bool = False) -> dict:
    data = {
        "id": str(job.id),
        "title": job.title,
        "company_name": job.client.organisation_name if job.client else None,
        "company_logo": job.client.logo_url if job.client else None,
        "category": {"id": str(job.category.id), "name": job.category.name} if job.category else None,
        "location": job.location,
        "country": job.country,
        "work_arrangement": job.work_arrangement.value if job.work_arrangement else None,
        "employment_type": job.employment_type.value if job.employment_type else None,
        "experience_level": job.experience_level.value if job.experience_level else None,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "currency": job.currency,
        "is_salary_disclosed": job.is_salary_disclosed,
        "is_featured": job.is_featured,
        "application_deadline": job.application_deadline.isoformat() if job.application_deadline else None,
        "published_at": job.published_at.isoformat() if job.published_at else None,
        "views_count": job.views_count,
        "applications_count": job.applications_count,
    }
    if detailed:
        data.update({
            "description": job.description,
            "responsibilities": job.responsibilities,
            "requirements": job.requirements,
            "preferred_skills": job.preferred_skills,
            "custom_questions": job.custom_questions,
            "skills": [
                {"skill_id": str(s.skill_id) if s.skill_id else None, "custom": s.custom_skill, "required": s.is_required}
                for s in (job.skills or [])
            ],
        })
    return data


def _format_creative(profile: "CreativeProfile", detailed: bool = False) -> dict:
    user = profile.user
    data = {
        "id": str(profile.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "avatar_url": user.avatar_url,
        "professional_headline": profile.professional_headline,
        "location": profile.location,
        "availability": profile.availability.value if profile.availability else None,
        "hourly_rate_min": profile.hourly_rate_min,
        "hourly_rate_max": profile.hourly_rate_max,
        "currency": profile.currency,
        "categories": [
            {"id": str(c.category_id), "is_primary": c.is_primary}
            for c in (profile.categories or [])
        ],
        "profile_views": profile.profile_views,
    }
    if detailed:
        data.update({
            "bio": profile.bio,
            "years_experience": profile.years_experience,
            "skills": [
                {"skill_id": str(s.skill_id) if s.skill_id else None, "custom": s.custom_skill}
                for s in (profile.skills or [])
            ],
            "portfolio_projects": [
                {
                    "id": str(p.id),
                    "title": p.title,
                    "cover_image_url": p.cover_image_url,
                    "description": p.description,
                }
                for p in (profile.portfolio_projects or []) if p.is_public
            ],
            "work_experiences": [
                {
                    "title": w.title,
                    "company": w.company,
                    "start_date": w.start_date.isoformat() if w.start_date else None,
                    "end_date": w.end_date.isoformat() if w.end_date else None,
                    "is_current": w.is_current,
                }
                for w in (profile.work_experiences or [])
            ],
            "website_url": profile.website_url,
            "linkedin_url": profile.linkedin_url,
            "behance_url": profile.behance_url,
            "instagram_url": profile.instagram_url,
            "twitter_url": profile.twitter_url,
            "github_url": profile.github_url,
            "dribbble_url": profile.dribbble_url,
        })
    return data
