from uuid import UUID
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload, joinedload

from app.core.deps import DBSession, ClientUser, ActiveUser
from app.core.enums import JobStatus, WorkArrangement, EmploymentType, ExperienceLevel
from app.models import Job, JobSkill, ClientProfile, CreativeCategory, Skill

router = APIRouter()


class JobCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    preferred_skills: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    work_arrangement: Optional[WorkArrangement] = None
    employment_type: Optional[EmploymentType] = None
    experience_level: Optional[ExperienceLevel] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = "USD"
    is_salary_disclosed: bool = True
    application_deadline: Optional[datetime] = None
    publish_immediately: bool = False
    custom_questions: Optional[list] = None
    skill_ids: Optional[list[UUID]] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    preferred_skills: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    work_arrangement: Optional[WorkArrangement] = None
    employment_type: Optional[EmploymentType] = None
    experience_level: Optional[ExperienceLevel] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    is_salary_disclosed: Optional[bool] = None
    application_deadline: Optional[datetime] = None
    custom_questions: Optional[list] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_job(payload: JobCreate, db: DBSession, current_user: ClientUser):
    prof_res = await db.execute(select(ClientProfile).where(ClientProfile.user_id == current_user.id))
    client_profile = prof_res.scalar_one_or_none()
    if not client_profile:
        client_profile = ClientProfile(user_id=current_user.id, organisation_name="Client")
        db.add(client_profile)
        await db.flush()

    initial_status = JobStatus.ACTIVE if payload.publish_immediately else JobStatus.DRAFT
    now = datetime.now(timezone.utc)

    job_dict = payload.model_dump(exclude={"publish_immediately", "skill_ids"})
    job = Job(
        client_id=client_profile.id,
        status=initial_status,
        published_at=now if payload.publish_immediately else None,
        **job_dict,
    )
    db.add(job)
    await db.flush()

    if payload.skill_ids:
        for sid in payload.skill_ids:
            db.add(JobSkill(job_id=job.id, skill_id=sid))
        await db.flush()

    return {"message": "Job created successfully.", "id": str(job.id), "status": job.status.value}


@router.get("/client")
async def list_my_posted_jobs(
    db: DBSession,
    current_user: ClientUser,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    prof_res = await db.execute(select(ClientProfile.id).where(ClientProfile.user_id == current_user.id))
    client_id = prof_res.scalar_one_or_none()
    if not client_id:
        return {"total": 0, "page": page, "per_page": per_page, "items": []}

    query = (
        select(Job)
        .where(Job.client_id == client_id, Job.deleted_at.is_(None))
        .options(joinedload(Job.category))
    )
    if status_filter:
        query = query.where(Job.status == status_filter)

    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar()

    result = await db.execute(
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    jobs = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [
            {
                "id": str(j.id),
                "title": j.title,
                "status": j.status.value if hasattr(j.status, "value") else str(j.status),
                "category": j.category.name if j.category else None,
                "work_arrangement": j.work_arrangement.value if j.work_arrangement else None,
                "employment_type": j.employment_type.value if j.employment_type else None,
                "views_count": j.views_count,
                "applications_count": j.applications_count,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "published_at": j.published_at.isoformat() if j.published_at else None,
            }
            for j in jobs
        ],
    }


@router.get("/{job_id}")
async def get_job_detail(job_id: UUID, db: DBSession, current_user: ActiveUser):
    res = await db.execute(
        select(Job)
        .where(Job.id == job_id, Job.deleted_at.is_(None))
        .options(
            joinedload(Job.category),
            joinedload(Job.client),
            selectinload(Job.skills).joinedload(JobSkill.skill),
        )
    )
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {
        "id": str(job.id),
        "client_id": str(job.client_id),
        "title": job.title,
        "category_id": str(job.category_id) if job.category_id else None,
        "category_name": job.category.name if job.category else None,
        "description": job.description,
        "responsibilities": job.responsibilities,
        "requirements": job.requirements,
        "preferred_skills": job.preferred_skills,
        "location": job.location,
        "country": job.country,
        "work_arrangement": job.work_arrangement.value if job.work_arrangement else None,
        "employment_type": job.employment_type.value if job.employment_type else None,
        "experience_level": job.experience_level.value if job.experience_level else None,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "currency": job.currency,
        "is_salary_disclosed": job.is_salary_disclosed,
        "application_deadline": job.application_deadline.isoformat() if job.application_deadline else None,
        "status": job.status.value if hasattr(job.status, "value") else str(job.status),
        "views_count": job.views_count,
        "applications_count": job.applications_count,
        "custom_questions": job.custom_questions or [],
        "skills": [
            {"id": str(s.skill.id), "name": s.skill.name}
            for s in job.skills if s.skill
        ],
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


@router.patch("/{job_id}")
async def update_job(job_id: UUID, payload: JobUpdate, db: DBSession, current_user: ClientUser):
    prof_res = await db.execute(select(ClientProfile.id).where(ClientProfile.user_id == current_user.id))
    client_id = prof_res.scalar_one_or_none()
    res = await db.execute(select(Job).where(Job.id == job_id, Job.client_id == client_id))
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, val)

    await db.flush()
    return {"message": "Job updated successfully."}


@router.post("/{job_id}/publish")
async def publish_job(job_id: UUID, db: DBSession, current_user: ClientUser):
    prof_res = await db.execute(select(ClientProfile.id).where(ClientProfile.user_id == current_user.id))
    client_id = prof_res.scalar_one_or_none()
    res = await db.execute(select(Job).where(Job.id == job_id, Job.client_id == client_id))
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    job.status = JobStatus.ACTIVE
    job.published_at = datetime.now(timezone.utc)
    await db.flush()
    return {"message": "Job published successfully.", "status": job.status.value}


@router.post("/{job_id}/close")
async def close_job(job_id: UUID, db: DBSession, current_user: ClientUser):
    prof_res = await db.execute(select(ClientProfile.id).where(ClientProfile.user_id == current_user.id))
    client_id = prof_res.scalar_one_or_none()
    res = await db.execute(select(Job).where(Job.id == job_id, Job.client_id == client_id))
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    job.status = JobStatus.CLOSED
    await db.flush()
    return {"message": "Job closed.", "status": job.status.value}


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: UUID, db: DBSession, current_user: ClientUser):
    prof_res = await db.execute(select(ClientProfile.id).where(ClientProfile.user_id == current_user.id))
    client_id = prof_res.scalar_one_or_none()
    res = await db.execute(select(Job).where(Job.id == job_id, Job.client_id == client_id))
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    job.deleted_at = datetime.now(timezone.utc)
    await db.flush()
    return None
