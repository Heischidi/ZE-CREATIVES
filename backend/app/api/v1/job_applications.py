from uuid import UUID
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload

from app.core.deps import DBSession, CreativeUser, ClientUser, ActiveUser
from app.core.enums import ApplicationStatus, JobStatus, NotificationType
from app.models import (
    JobApplication, Job, CreativeProfile, CreativeProfileSkill,
    ApplicationStatusHistory, ClientProfile, User, Notification
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
    job_res = await db.execute(
        select(Job).options(joinedload(Job.client)).where(Job.id == job_id, Job.status == JobStatus.ACTIVE)
    )
    job = job_res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not active.")

    prof_res = await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        profile = CreativeProfile(user_id=current_user.id)
        db.add(profile)
        await db.flush()

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

    # Notify Client owner
    if job.client and job.client.user_id:
        db.add(Notification(
            user_id=job.client.user_id,
            type=NotificationType.NEW_APPLICATION,
            title=f"New Applicant for {job.title}",
            message=f"{current_user.first_name} {current_user.last_name} applied to '{job.title}'.",
            data={"job_id": str(job.id), "creative_profile_id": str(profile.id)},
        ))

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
            "client_name": a.job.client.organisation_name if a.job and a.job.client else "Client Studio",
            "client_user_id": str(a.job.client.user_id) if a.job and a.job.client and a.job.client.user_id else None,
            "category": a.job.category.name if a.job and a.job.category else "Design & Creative",
            "location": a.job.location if a.job else "Remote",
            "work_arrangement": a.job.work_arrangement.value if a.job and a.job.work_arrangement else "remote",
            "employment_type": a.job.employment_type.value if a.job and a.job.employment_type else "full_time",
            "salary_min": a.job.salary_min if a.job else None,
            "salary_max": a.job.salary_max if a.job else None,
            "currency": a.job.currency if a.job else "USD",
            "is_salary_disclosed": a.job.is_salary_disclosed if a.job else True,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "cover_letter": a.cover_letter,
            "custom_answers": a.custom_answers or {},
            "client_notes": a.client_notes,
            "portfolio_project_ids": a.portfolio_project_ids or [],
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        }
        for a in apps
    ]


def _serialize_client_applicant(a: JobApplication) -> dict:
    cp = a.creative_profile
    u = cp.user if cp else None
    return {
        "id": str(a.id),
        "job_id": str(a.job_id),
        "job_title": a.job.title if a.job else "Role",
        "status": a.status.value if hasattr(a.status, "value") else str(a.status),
        "cover_letter": a.cover_letter,
        "custom_answers": a.custom_answers or {},
        "client_notes": a.client_notes,
        "portfolio_project_ids": a.portfolio_project_ids or [],
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "is_viewed": a.is_viewed,
        "creative": {
            "profile_id": str(cp.id),
            "user_id": str(cp.user_id),
            "first_name": u.first_name if u else "",
            "last_name": u.last_name if u else "",
            "full_name": f"{u.first_name} {u.last_name}" if u else "Creative",
            "email": u.email if u else "",
            "headline": cp.professional_headline,
            "bio": cp.bio,
            "location": cp.location,
            "years_experience": cp.years_experience,
            "hourly_rate_min": cp.hourly_rate_min,
            "hourly_rate_max": cp.hourly_rate_max,
            "currency": cp.currency or "USD",
            "availability": cp.availability.value if hasattr(cp.availability, "value") else str(cp.availability),
            "avatar_url": u.avatar_url if u else None,
            "website_url": cp.website_url,
            "skills": [
                (s.skill.name if s.skill else s.custom_skill)
                for s in (cp.skills or [])
                if (s.skill or s.custom_skill)
            ],
            "portfolio_projects": [
                {
                    "id": str(p.id),
                    "title": p.title,
                    "description": p.description,
                    "cover_image_url": p.cover_image_url,
                    "project_url": p.project_url,
                    "tools_used": p.tools_used or [],
                }
                for p in (cp.portfolio_projects or [])
            ],
        } if cp else None,
    }


@router.get("/client")
async def list_all_client_applicants(
    db: DBSession,
    current_user: ClientUser,
    job_id: Optional[UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """List all applicants across all jobs belonging to the logged-in client."""
    prof_res = await db.execute(select(ClientProfile.id).where(ClientProfile.user_id == current_user.id))
    client_id = prof_res.scalar_one_or_none()
    if not client_id:
        return []

    query = (
        select(JobApplication)
        .join(Job, Job.id == JobApplication.job_id)
        .where(Job.client_id == client_id, Job.deleted_at.is_(None))
        .options(
            joinedload(JobApplication.job),
            selectinload(JobApplication.creative_profile).selectinload(CreativeProfile.user),
            selectinload(JobApplication.creative_profile)
            .selectinload(CreativeProfile.skills)
            .selectinload(CreativeProfileSkill.skill),
            selectinload(JobApplication.creative_profile).selectinload(CreativeProfile.portfolio_projects),
            selectinload(JobApplication.status_history),
        )
        .order_by(JobApplication.created_at.desc())
    )
    if job_id:
        query = query.where(JobApplication.job_id == job_id)
    if status_filter:
        query = query.where(JobApplication.status == status_filter)

    res = await db.execute(query)
    apps = res.unique().scalars().all()
    return [_serialize_client_applicant(a) for a in apps]


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
            joinedload(JobApplication.job),
            selectinload(JobApplication.creative_profile).selectinload(CreativeProfile.user),
            selectinload(JobApplication.creative_profile)
            .selectinload(CreativeProfile.skills)
            .selectinload(CreativeProfileSkill.skill),
            selectinload(JobApplication.creative_profile).selectinload(CreativeProfile.portfolio_projects),
            selectinload(JobApplication.status_history),
        )
        .order_by(JobApplication.created_at.desc())
    )
    apps = res.unique().scalars().all()
    return [_serialize_client_applicant(a) for a in apps]


@router.post("/{application_id}/status")
async def update_application_status(
    application_id: UUID,
    payload: StatusChangeRequest,
    db: DBSession,
    current_user: ClientUser,
):
    prof_res = await db.execute(select(ClientProfile).where(ClientProfile.user_id == current_user.id))
    client_prof = prof_res.scalar_one_or_none()
    if not client_prof:
        raise HTTPException(status_code=403, detail="Client profile not found.")

    res = await db.execute(
        select(JobApplication)
        .join(Job, Job.id == JobApplication.job_id)
        .options(joinedload(JobApplication.job), joinedload(JobApplication.creative_profile))
        .where(JobApplication.id == application_id, Job.client_id == client_prof.id)
    )
    app_obj = res.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized.")

    prev = app_obj.status
    app_obj.status = payload.status
    app_obj.is_viewed = True
    app_obj.viewed_at = datetime.now(timezone.utc)
    if payload.notes is not None:
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

    # Notify the creative user
    if app_obj.creative_profile and app_obj.creative_profile.user_id:
        job_title = app_obj.job.title if app_obj.job else "your job application"
        org_name = client_prof.organisation_name or "Client Studio"
        db.add(Notification(
            user_id=app_obj.creative_profile.user_id,
            type=NotificationType.APPLICATION_UPDATE,
            title=f"Application Update: {job_title}",
            message=f"{org_name} updated your application status for '{job_title}' to {payload.status.value.replace('_', ' ').title()}.",
            data={
                "application_id": str(app_obj.id),
                "job_id": str(app_obj.job_id),
                "new_status": payload.status.value,
            },
        ))

    await db.flush()
    return {"message": "Application status updated.", "new_status": payload.status.value}
