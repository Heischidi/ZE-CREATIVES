"""
Admin API — user management, dashboard stats, audit logs.
All routes require admin or super_admin role.
"""
from uuid import UUID
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr, Field

from app.core.deps import DBSession, AdminUser, SuperAdminUser
from app.core.config import settings
from app.core.enums import (
    UserRole, AccountStatus, AuditAction, CreativeApplicationStatus,
    JobStatus, AvailabilityStatus,
)
from app.core.security import create_invitation_token, invitation_token_expiry
from app.models import (
    User, CreativeProfile, ClientProfile, Job, JobApplication,
    CreativeApplication, ClientApplication, AdminAuditLog, UserInvitation,
    Announcement, PlatformSetting, PortfolioProject, CreativeCategory,
)
from app.services.email import email_service

router = APIRouter()


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

@router.get("/dashboard")
async def admin_dashboard(db: DBSession, admin: AdminUser):
    total_users = await db.scalar(select(func.count(User.id)).where(User.deleted_at.is_(None))) or 0
    total_creatives = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.CREATIVE, User.deleted_at.is_(None))
    ) or 0
    total_clients = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.CLIENT, User.deleted_at.is_(None))
    ) or 0
    total_admins = await db.scalar(
        select(func.count(User.id)).where(
            User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
            User.deleted_at.is_(None),
        )
    ) or 0
    pending_creative_apps = await db.scalar(
        select(func.count(CreativeApplication.id)).where(
            CreativeApplication.status.in_([
                CreativeApplicationStatus.PENDING,
                CreativeApplicationStatus.UNDER_REVIEW,
                CreativeApplicationStatus.MORE_INFO_REQUESTED,
            ])
        )
    ) or 0
    total_creative_apps = await db.scalar(select(func.count(CreativeApplication.id))) or 0
    approved_creative_apps = await db.scalar(
        select(func.count(CreativeApplication.id)).where(
            CreativeApplication.status == CreativeApplicationStatus.APPROVED
        )
    ) or 0
    pending_client_apps = await db.scalar(
        select(func.count(ClientApplication.id)).where(
            ClientApplication.status.in_([
                CreativeApplicationStatus.PENDING,
                CreativeApplicationStatus.UNDER_REVIEW,
                CreativeApplicationStatus.MORE_INFO_REQUESTED,
            ])
        )
    ) or 0
    total_client_apps = await db.scalar(select(func.count(ClientApplication.id))) or 0
    active_jobs = await db.scalar(
        select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE, Job.deleted_at.is_(None))
    ) or 0
    total_jobs = await db.scalar(
        select(func.count(Job.id)).where(Job.deleted_at.is_(None))
    ) or 0
    total_applications = await db.scalar(select(func.count(JobApplication.id))) or 0
    suspended_accounts = await db.scalar(
        select(func.count(User.id)).where(User.status == AccountStatus.SUSPENDED)
    ) or 0
    invited_accounts = await db.scalar(
        select(func.count(User.id)).where(User.status == AccountStatus.INVITATION_SENT)
    ) or 0
    total_categories = await db.scalar(select(func.count(CreativeCategory.id))) or 0

    acceptance_rate = (
        round((approved_creative_apps / total_creative_apps) * 100, 1)
        if total_creative_apps > 0
        else 14.2
    )

    return {
        "total_users": total_users,
        "total_creatives": total_creatives,
        "total_clients": total_clients,
        "total_admins": total_admins,
        "pending_creative_applications": pending_creative_apps,
        "total_creative_applications": total_creative_apps,
        "pending_client_applications": pending_client_apps,
        "total_client_applications": total_client_apps,
        "active_jobs": active_jobs,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
        "suspended_accounts": suspended_accounts,
        "invited_accounts": invited_accounts,
        "total_categories": total_categories,
        "acceptance_rate": acceptance_rate,
    }


# ─── User Management ──────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: Optional[str] = None
    role: UserRole


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(payload: CreateUserRequest, db: DBSession, admin: AdminUser):
    """Admin creates a client or creative account directly, sends invitation."""
    if payload.role in (UserRole.SUPER_ADMIN, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Use the admin creation endpoint to create administrator accounts.",
        )

    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    user = User(
        email=payload.email.lower(),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        role=payload.role,
        status=AccountStatus.INVITATION_SENT,
    )
    db.add(user)
    await db.flush()

    raw_token, token_hash = create_invitation_token()
    invitation = UserInvitation(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=invitation_token_expiry(),
        invited_by_id=admin.id,
    )
    db.add(invitation)

    log = AdminAuditLog(
        admin_id=admin.id,
        action=AuditAction.USER_CREATED,
        target_user_id=user.id,
        description=f"Created {payload.role.value} account for {payload.email}.",
    )
    db.add(log)
    await db.flush()

    await email_service.send_invitation(user.email, user.first_name, raw_token, payload.role.value)

    if payload.role == UserRole.CREATIVE:
        db.add(CreativeProfile(user_id=user.id, is_public=True))
    elif payload.role == UserRole.CLIENT:
        db.add(ClientProfile(user_id=user.id, organisation_name=f"{user.first_name} {user.last_name}", is_verified=True))

    return {
        "message": f"Account created and invitation sent to {user.email}.",
        "user_id": str(user.id),
        "activation_url": f"{settings.frontend_url}/activate?token={raw_token}",
    }


@router.get("/users")
async def list_users(
    db: DBSession,
    admin: AdminUser,
    role: Optional[UserRole] = None,
    account_status: Optional[AccountStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(User).where(User.deleted_at.is_(None))
    if role:
        query = query.where(User.role == role)
    if account_status:
        query = query.where(User.status == account_status)
    if search:
        query = query.where(
            User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
        )

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(
        query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    users = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [_format_user(u) for u in users],
    }


@router.get("/users/{user_id}")
async def get_user(user_id: UUID, db: DBSession, admin: AdminUser):
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return _format_user(user, detailed=True)


class UpdateUserStatusRequest(BaseModel):
    action: str  # "suspend", "reactivate", "deactivate"
    reason: Optional[str] = None


@router.post("/users/{user_id}/status")
async def update_user_status(
    user_id: UUID,
    payload: UpdateUserStatusRequest,
    db: DBSession,
    admin: AdminUser,
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    action_map = {
        "suspend": (AccountStatus.SUSPENDED, AuditAction.USER_SUSPENDED),
        "reactivate": (AccountStatus.ACTIVE, AuditAction.USER_REACTIVATED),
        "deactivate": (AccountStatus.DEACTIVATED, AuditAction.USER_DEACTIVATED),
    }
    if payload.action not in action_map:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action.")

    new_status, audit_action = action_map[payload.action]
    user.status = new_status

    log = AdminAuditLog(
        admin_id=admin.id,
        action=audit_action,
        target_user_id=user.id,
        description=f"{payload.action.capitalize()} user {user.email}. Reason: {payload.reason or 'N/A'}",
    )
    db.add(log)

    return {"message": f"User status updated to {new_status.value}."}


@router.post("/users/{user_id}/resend-invitation")
async def resend_invitation(user_id: UUID, db: DBSession, admin: AdminUser):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.status != AccountStatus.INVITATION_SENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or not in invitation_sent state.",
        )

    raw_token, token_hash = create_invitation_token()
    invitation = UserInvitation(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=invitation_token_expiry(),
        invited_by_id=admin.id,
    )
    db.add(invitation)
    await db.flush()

    await email_service.send_invitation(user.email, user.first_name, raw_token, user.role.value)
    return {
        "message": f"New invitation sent to {user.email}.",
        "activation_url": f"{settings.frontend_url}/activate?token={raw_token}",
    }


# ─── Admin Creation (super admin only) ───────────────────────────────────────

class CreateAdminRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    is_super_admin: bool = False


@router.post("/admins", status_code=status.HTTP_201_CREATED)
async def create_admin(payload: CreateAdminRequest, db: DBSession, super_admin: SuperAdminUser):
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    role = UserRole.SUPER_ADMIN if payload.is_super_admin else UserRole.ADMIN
    user = User(
        email=payload.email.lower(),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=role,
        status=AccountStatus.INVITATION_SENT,
    )
    db.add(user)
    await db.flush()

    raw_token, token_hash = create_invitation_token()
    invitation = UserInvitation(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=invitation_token_expiry(),
        invited_by_id=super_admin.id,
    )
    db.add(invitation)

    log = AdminAuditLog(
        admin_id=super_admin.id,
        action=AuditAction.ADMIN_CREATED,
        target_user_id=user.id,
        description=f"Created {role.value} account for {payload.email}.",
    )
    db.add(log)
    await db.flush()

    await email_service.send_invitation(user.email, user.first_name, raw_token, role.value)
    return {
        "message": f"Admin account created and invitation sent to {user.email}.",
        "user_id": str(user.id),
        "activation_url": f"{settings.frontend_url}/activate?token={raw_token}",
    }


# ─── Deep Creatives & Clients Roster + Job Moderation ─────────────────────────

@router.get("/creatives")
async def admin_list_creatives(db: DBSession, admin: AdminUser):
    """Full roster of all Creative accounts with profile, portfolio, and activity details."""
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.creative_profile).selectinload(CreativeProfile.portfolio_projects),
            selectinload(User.creative_profile).selectinload(CreativeProfile.work_experiences),
            selectinload(User.creative_profile).selectinload(CreativeProfile.education),
        )
        .where(User.role == UserRole.CREATIVE, User.deleted_at.is_(None))
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    items = []
    for u in users:
        p = u.creative_profile
        apps_count = 0
        if p:
            apps_count = (
                await db.scalar(
                    select(func.count(JobApplication.id)).where(JobApplication.creative_profile_id == p.id)
                )
                or 0
            )
        items.append({
            "user_id": str(u.id),
            "profile_id": str(p.id) if p else None,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "name": f"{u.first_name} {u.last_name}",
            "email": u.email,
            "phone": u.phone,
            "status": u.status.value,
            "is_email_verified": u.is_email_verified,
            "created_at": u.created_at.isoformat(),
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "professional_headline": p.professional_headline if p else None,
            "bio": p.bio if p else None,
            "location": p.location if p else None,
            "country": p.country if p else None,
            "years_experience": p.years_experience if p else None,
            "hourly_rate_min": p.hourly_rate_min if p else None,
            "hourly_rate_max": p.hourly_rate_max if p else None,
            "currency": p.currency if p else "USD",
            "availability": p.availability.value if (p and p.availability) else "available",
            "is_public": p.is_public if p else False,
            "onboarding_completed": p.onboarding_completed if p else False,
            "onboarding_step": p.onboarding_step if p else 1,
            "profile_views": p.profile_views if p else 0,
            "website_url": p.website_url if p else None,
            "dribbble_url": p.dribbble_url if p else None,
            "behance_url": p.behance_url if p else None,
            "linkedin_url": p.linkedin_url if p else None,
            "instagram_url": p.instagram_url if p else None,
            "portfolio_projects_count": len(p.portfolio_projects) if p else 0,
            "portfolio_projects": [
                {
                    "id": str(proj.id),
                    "title": proj.title,
                    "description": proj.description,
                    "project_url": proj.project_url,
                    "cover_image_url": proj.cover_image_url,
                    "is_featured": proj.is_featured,
                }
                for proj in (p.portfolio_projects if p else [])
            ],
            "job_applications_count": apps_count,
        })
    return {"total": len(items), "items": items}


class AdminUpdateCreativeRequest(BaseModel):
    is_public: Optional[bool] = None
    availability: Optional[AvailabilityStatus] = None
    professional_headline: Optional[str] = None
    account_action: Optional[str] = None  # "suspend", "reactivate", "deactivate"


@router.patch("/creatives/{user_id}")
async def admin_update_creative(
    user_id: UUID,
    payload: AdminUpdateCreativeRequest,
    db: DBSession,
    admin: AdminUser,
):
    result = await db.execute(
        select(User).options(selectinload(User.creative_profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.CREATIVE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creative not found.")

    profile = user.creative_profile
    if not profile:
        profile = CreativeProfile(user_id=user.id)
        db.add(profile)
        await db.flush()

    if payload.is_public is not None:
        profile.is_public = payload.is_public
    if payload.availability is not None:
        profile.availability = payload.availability
    if payload.professional_headline is not None:
        profile.professional_headline = payload.professional_headline
    if payload.account_action in ("suspend", "reactivate", "deactivate"):
        status_map = {
            "suspend": AccountStatus.SUSPENDED,
            "reactivate": AccountStatus.ACTIVE,
            "deactivate": AccountStatus.DEACTIVATED,
        }
        user.status = status_map[payload.account_action]

    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action=AuditAction.SETTINGS_UPDATED,
            target_user_id=user.id,
            description=f"Updated creative governance settings for {user.email}.",
        )
    )
    return {"message": "Creative profile governance updated."}


@router.get("/clients")
async def admin_list_clients(db: DBSession, admin: AdminUser):
    """Full roster of all Client accounts with organisation profile and posted jobs."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.client_profile).selectinload(ClientProfile.jobs))
        .where(User.role == UserRole.CLIENT, User.deleted_at.is_(None))
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    items = []
    for u in users:
        c = u.client_profile
        jobs = [j for j in (c.jobs if c else []) if j.deleted_at is None]
        items.append({
            "user_id": str(u.id),
            "profile_id": str(c.id) if c else None,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "contact_name": f"{u.first_name} {u.last_name}",
            "email": u.email,
            "phone": u.phone,
            "status": u.status.value,
            "created_at": u.created_at.isoformat(),
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "organisation_name": c.organisation_name if c else f"{u.first_name} {u.last_name}",
            "industry": c.industry if c else None,
            "company_size": c.company_size if c else None,
            "website_url": c.website_url if c else None,
            "description": c.description if c else None,
            "location": c.location if c else None,
            "country": c.country if c else None,
            "is_verified": c.is_verified if c else False,
            "jobs_count": len(jobs),
            "jobs": [
                {
                    "id": str(j.id),
                    "title": j.title,
                    "status": j.status.value if hasattr(j.status, "value") else str(j.status),
                    "location": j.location,
                    "salary_min": j.salary_min,
                    "salary_max": j.salary_max,
                    "currency": j.currency,
                    "is_featured": j.is_featured,
                    "applications_count": j.applications_count,
                    "created_at": j.created_at.isoformat(),
                }
                for j in jobs
            ],
        })
    return {"total": len(items), "items": items}


class AdminUpdateClientRequest(BaseModel):
    is_verified: Optional[bool] = None
    organisation_name: Optional[str] = None
    industry: Optional[str] = None
    account_action: Optional[str] = None  # "suspend", "reactivate", "deactivate"


@router.patch("/clients/{user_id}")
async def admin_update_client(
    user_id: UUID,
    payload: AdminUpdateClientRequest,
    db: DBSession,
    admin: AdminUser,
):
    result = await db.execute(
        select(User).options(selectinload(User.client_profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.CLIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

    profile = user.client_profile
    if not profile:
        profile = ClientProfile(user_id=user.id, organisation_name=f"{user.first_name} {user.last_name}")
        db.add(profile)
        await db.flush()

    if payload.is_verified is not None:
        profile.is_verified = payload.is_verified
    if payload.organisation_name is not None:
        profile.organisation_name = payload.organisation_name
    if payload.industry is not None:
        profile.industry = payload.industry
    if payload.account_action in ("suspend", "reactivate", "deactivate"):
        status_map = {
            "suspend": AccountStatus.SUSPENDED,
            "reactivate": AccountStatus.ACTIVE,
            "deactivate": AccountStatus.DEACTIVATED,
        }
        user.status = status_map[payload.account_action]

    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action=AuditAction.SETTINGS_UPDATED,
            target_user_id=user.id,
            description=f"Updated client workspace governance for {user.email}.",
        )
    )
    return {"message": "Client workspace governance updated."}


@router.get("/jobs")
async def admin_list_jobs(db: DBSession, admin: AdminUser):
    """List all jobs across the platform for admin moderation."""
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.client).selectinload(ClientProfile.user), selectinload(Job.category))
        .where(Job.deleted_at.is_(None))
        .order_by(Job.created_at.desc())
    )
    jobs = result.scalars().all()
    items = []
    for j in jobs:
        apps_count = (
            await db.scalar(select(func.count(JobApplication.id)).where(JobApplication.job_id == j.id))
            or j.applications_count
            or 0
        )
        items.append({
            "id": str(j.id),
            "title": j.title,
            "description": j.description,
            "responsibilities": j.responsibilities,
            "requirements": j.requirements,
            "preferred_skills": j.preferred_skills,
            "location": j.location,
            "country": j.country,
            "work_arrangement": j.work_arrangement.value if j.work_arrangement else None,
            "employment_type": j.employment_type.value if j.employment_type else None,
            "experience_level": j.experience_level.value if j.experience_level else None,
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "currency": j.currency,
            "status": j.status.value if hasattr(j.status, "value") else str(j.status),
            "is_featured": j.is_featured,
            "views_count": j.views_count,
            "applications_count": apps_count,
            "moderation_notes": j.moderation_notes,
            "category_name": j.category.name if j.category else "Design & Creative",
            "organisation_name": j.client.organisation_name if j.client else "Client Studio",
            "client_email": j.client.user.email if (j.client and j.client.user) else None,
            "created_at": j.created_at.isoformat(),
        })
    return {"total": len(items), "items": items}


class AdminModerateJobRequest(BaseModel):
    status: Optional[JobStatus] = None
    is_featured: Optional[bool] = None
    moderation_notes: Optional[str] = None


@router.patch("/jobs/{job_id}")
async def admin_moderate_job(
    job_id: UUID,
    payload: AdminModerateJobRequest,
    db: DBSession,
    admin: AdminUser,
):
    result = await db.execute(select(Job).where(Job.id == job_id, Job.deleted_at.is_(None)))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if payload.status is not None:
        job.status = payload.status
        if payload.status == JobStatus.ACTIVE and not job.published_at:
            job.published_at = datetime.now(timezone.utc)
    if payload.is_featured is not None:
        job.is_featured = payload.is_featured
    if payload.moderation_notes is not None:
        job.moderation_notes = payload.moderation_notes
    job.moderated_by_id = admin.id

    audit_action = (
        AuditAction.JOB_APPROVED
        if payload.status == JobStatus.ACTIVE
        else AuditAction.JOB_REJECTED
        if payload.status == JobStatus.REJECTED
        else AuditAction.SETTINGS_UPDATED
    )
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action=audit_action,
            target_resource_type="job",
            target_resource_id=str(job.id),
            description=f"Moderated job '{job.title}' (status={job.status.value}, featured={job.is_featured}).",
        )
    )
    return {"message": f"Job '{job.title}' updated."}


# ─── Audit Logs ───────────────────────────────────────────────────────────────

@router.get("/audit-logs")
async def get_audit_logs(
    db: DBSession,
    admin: AdminUser,
    action: Optional[str] = None,
    admin_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    query = select(AdminAuditLog).order_by(AdminAuditLog.created_at.desc())
    if action:
        query = query.where(AdminAuditLog.action == action)
    if admin_id:
        query = query.where(AdminAuditLog.admin_id == admin_id)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    logs = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [
            {
                "id": str(l.id),
                "admin_id": str(l.admin_id),
                "action": l.action.value,
                "target_user_id": str(l.target_user_id) if l.target_user_id else None,
                "description": l.description,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs
        ],
    }


# ─── Announcements ────────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str
    target_roles: Optional[list[str]] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


@router.post("/announcements", status_code=status.HTTP_201_CREATED)
async def create_announcement(payload: AnnouncementCreate, db: DBSession, admin: AdminUser):
    announcement = Announcement(
        title=payload.title,
        content=payload.content,
        target_roles=payload.target_roles,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        created_by_id=admin.id,
    )
    db.add(announcement)
    await db.flush()
    return {"message": "Announcement created.", "id": str(announcement.id)}


@router.get("/announcements")
async def list_announcements(db: DBSession, admin: AdminUser, page: int = Query(1, ge=1), per_page: int = 20):
    result = await db.execute(
        select(Announcement).order_by(Announcement.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    items = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "content": a.content,
            "target_roles": a.target_roles,
            "is_active": a.is_active,
            "starts_at": a.starts_at.isoformat() if a.starts_at else None,
            "ends_at": a.ends_at.isoformat() if a.ends_at else None,
            "created_at": a.created_at.isoformat(),
        }
        for a in items
    ]


# ─── Platform Settings ────────────────────────────────────────────────────────

@router.get("/settings")
async def get_platform_settings(db: DBSession, admin: AdminUser):
    result = await db.execute(select(PlatformSetting))
    settings_list = result.scalars().all()
    return {s.key: {"value": s.value, "value_json": s.value_json, "description": s.description} for s in settings_list}


class SettingUpdate(BaseModel):
    value: Optional[str] = None
    value_json: Optional[dict] = None


@router.put("/settings/{key}")
async def update_platform_setting(key: str, payload: SettingUpdate, db: DBSession, admin: AdminUser):
    result = await db.execute(select(PlatformSetting).where(PlatformSetting.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        setting = PlatformSetting(key=key)
        db.add(setting)

    setting.value = payload.value
    setting.value_json = payload.value_json
    setting.updated_by_id = admin.id
    return {"message": f"Setting '{key}' updated."}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _format_user(user: User, detailed: bool = False) -> dict:
    data = {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "status": user.status.value,
        "avatar_url": user.avatar_url,
        "phone": user.phone,
        "is_email_verified": user.is_email_verified,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "created_at": user.created_at.isoformat(),
    }
    return data
