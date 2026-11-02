from uuid import UUID
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload

from app.core.deps import DBSession, CreativeUser, ClientUser, ActiveUser
from app.core.enums import ApplicationStatus, JobStatus
from app.models import (
    JobApplication, Job, CreativeProfile, ApplicationStatusHistory,
    ClientProfile, User
)

router = APIRouter()


class ApplyJobRequest(BaseModel):
    cover_letter: Optional[str] = None
    portfolio_project_ids: Optional[list[UUID]] = None
    custom_answers: Optional[dict] = None


class StatusChangeRequest(BaseModel):
    status: ApplicationStatus
    notes: Optional[str] = None


@router.post("/jobs/{job_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_job(job_id: UUID, payload: ApplyJobRequest, db: DBSession, current_user: CreativeUser):
    # Verify active job
    job_res = await db.execute(select(Job).where(Job.id == job_id, Job.status == JobStatus.ACTIVE))
    job = job_res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not active.")

    prof_res = await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete your creative profile first.")

    # Check already applied
    existing = await db.execute(
        select(JobApplication).where(
            JobApplication.job_id == job_id, JobApplication.creative_profile_id == profile.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already applied to this job.")

    app_obj = JobApplication(
        job_id=job_id,
        creative_profile_id=profile.id,
        cover_letter=payload.cover_letter,
        portfolio_project_ids=[str(pid) for pid in (payload.portfolio_project_ids or [])],
        custom_answers=payload.custom_answers,
        status=ApplicationStatus.SUBMITTED,
    )
    db.add(app_obj)

    # Increment job applications count
    job.applications_count = (job.applications_count or 0) + 1

    # Initial history entry
    history = ApplicationStatusHistory(
        application=app_obj,
        new_status=ApplicationStatus.SUBMITTED,
        changed_by_id=current_user.id,
        notes="Application submitted",
    )
    db.add(history)

    await db.flush()
    return {"message": "Application submitted successfully.", "id": str(app_obj.id)}


@router.get("/creative/me")
async def list_my_applications(db: DBSession, current_user: CreativeUser):
    prof_res = await db.execute(select(CreativeProfile.id).where(CreativeProfile.user_id == current_user.id))
    profile_id = prof_res.scalar_one_or_none()
    if not profile_id:
        return []

    res = await db.execute(
        select(JobApplication)
        .where(JobApplication.creative_profile_id == profile_id)
        .options(
            joinedload(JobApplication.job).joinedload(Job.client),
            joinedload(JobApplication.job).joinedload(Job.category),
        )
        .order_by(JobApplication.created_at.desc())
    )
    apps = res.scalars().all()

    return [
        {
            "id": str(a.id),
            "job_id": str(a.job_id),
            "job_title": a.job.title if a.job else "Unknown Job",
            "client_name": a.job.client.organisation_name if a.job and a.job.client else "Client",
            "category": a.job.category.name if a.job and a.job.category else None,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in apps
    ]


@router.get("/job/{job_id}")
async def list_job_applicants(job_id: UUID, db: DBSession, current_user: ClientUser):
    # Verify client owns job
    prof_res = await db.execute(select(ClientProfile.id).where(ClientProfile.user_id == current_user.id))
    client_id = prof_res.scalar_one_or_none()
    job_res = await db.execute(select(Job).where(Job.id == job_id, Job.client_id == client_id))
    if not job_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized to view applicants for this job.")

    res = await db.execute(
        select(JobApplication)
        .where(JobApplication.job_id == job_id)
        .options(
            joinedload(JobApplication.creative_profile).joinedload(CreativeProfile.user),
            selectinload(JobApplication.status_history),
        )
        .order_by(JobApplication.created_at.desc())
    )
    apps = res.scalars().all()

    return [
        {
            "id": str(a.id),
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "cover_letter": a.cover_letter,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "is_viewed": a.is_viewed,
            "creative": {
                "profile_id": str(a.creative_profile.id),
                "first_name": a.creative_profile.user.first_name if a.creative_profile.user else "",
                "last_name": a.creative_profile.user.last_name if a.creative_profile.user else "",
                "headline": a.creative_profile.professional_headline,
                "location": a.creative_profile.location,
                "avatar_url": a.creative_profile.user.avatar_url if a.creative_profile.user else None,
            } if a.creative_profile else None,
        }
        for a in apps
    ]


@router.post("/{application_id}/status")
async def update_application_status(
    application_id: UUID,
    payload: StatusChangeRequest,
    db: DBSession,
    current_user: ClientUser,
):
    prof_res = await db.execute(select(ClientProfile.id).where(ClientProfile.user_id == current_user.id))
    client_id = prof_res.scalar_one_or_none()

    res = await db.execute(
        select(JobApplication)
        .join(Job, Job.id == JobApplication.job_id)
        .where(JobApplication.id == application_id, Job.client_id == client_id)
    )
    app_obj = res.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized.")

    prev = app_obj.status
    app_obj.status = payload.status
    if payload.notes:
        app_obj.client_notes = payload.notes

    # Add to status history
    history = ApplicationStatusHistory(
        application_id=app_obj.id,
        previous_status=prev,
        new_status=payload.status,
        changed_by_id=current_user.id,
        notes=payload.notes,
    )
    db.add(history)
    await db.flush()

    return {"message": "Application status updated.", "new_status": payload.status.value}
