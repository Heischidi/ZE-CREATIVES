"""
Creative Application Routes
- Public: Submit creative application (no account created)
- Admin: List, review, approve, reject applications
"""
from uuid import UUID
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr, Field

from app.core.deps import DBSession, AdminUser
from app.core.enums import CreativeApplicationStatus, AccountStatus, UserRole, AuditAction, AvailabilityStatus
from app.models import CreativeApplication, CreativeProfile, User, UserInvitation, AdminAuditLog
from app.core.security import create_invitation_token, invitation_token_expiry
from app.core.config import settings
from app.services.email import email_service

router = APIRouter()


# ─── Public Schemas ───────────────────────────────────────────────────────────

class CreativeApplicationCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    professional_headline: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    years_experience: Optional[int] = Field(None, ge=0, le=60)
    creative_categories: Optional[list[str]] = None
    skills: Optional[list[str]] = None
    portfolio_links: Optional[list[str]] = None
    social_links: Optional[dict] = None
    additional_notes: Optional[str] = None


class ReviewApplicationRequest(BaseModel):
    action: str  # "approve", "reject", "request_info"
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None


# ─── Public Endpoints ─────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_creative_application(payload: CreativeApplicationCreate, db: DBSession):
    """
    Public endpoint — anyone can submit a creative application.
    This does NOT create a user account. It creates a pending application.
    """
    # Check for duplicate pending application
    existing = await db.execute(
        select(CreativeApplication).where(
            CreativeApplication.email == payload.email.lower(),
            CreativeApplication.status == CreativeApplicationStatus.PENDING,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An application with this email is already pending review.",
        )

    application = CreativeApplication(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email.lower(),
        phone=payload.phone,
        location=payload.location,
        professional_headline=payload.professional_headline,
        bio=payload.bio,
        years_experience=payload.years_experience,
        creative_categories=payload.creative_categories,
        skills=payload.skills,
        portfolio_links=payload.portfolio_links,
        social_links=payload.social_links,
        additional_notes=payload.additional_notes,
        status=CreativeApplicationStatus.PENDING,
    )
    db.add(application)
    await db.flush()

    # Send acknowledgement email
    await email_service.send_application_received(application.email, application.first_name)

    return {
        "message": "Application submitted successfully. Our team will review it and contact you within 3-5 business days.",
        "application_id": str(application.id),
    }


# ─── Admin Endpoints ──────────────────────────────────────────────────────────

@router.get("/")
async def list_creative_applications(
    db: DBSession,
    admin: AdminUser,
    status_filter: Optional[CreativeApplicationStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(CreativeApplication)
    if status_filter:
        query = query.where(CreativeApplication.status == status_filter)
    if search:
        query = query.where(
            (CreativeApplication.first_name.ilike(f"%{search}%"))
            | (CreativeApplication.last_name.ilike(f"%{search}%"))
            | (CreativeApplication.email.ilike(f"%{search}%"))
        )

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    applications = await db.execute(
        query.order_by(CreativeApplication.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    apps = applications.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [
            {
                "id": str(a.id),
                "first_name": a.first_name,
                "last_name": a.last_name,
                "email": a.email,
                "phone": a.phone,
                "location": a.location,
                "professional_headline": a.professional_headline,
                "bio": a.bio,
                "years_experience": a.years_experience,
                "creative_categories": a.creative_categories or [],
                "skills": a.skills or [],
                "portfolio_links": a.portfolio_links or [],
                "social_links": a.social_links or {},
                "additional_notes": a.additional_notes,
                "review_notes": a.review_notes,
                "rejection_reason": a.rejection_reason,
                "status": a.status.value,
                "created_at": a.created_at.isoformat(),
                "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
            }
            for a in apps
        ],
    }


@router.get("/{application_id}")
async def get_creative_application(application_id: UUID, db: DBSession, admin: AdminUser):
    result = await db.execute(
        select(CreativeApplication).where(CreativeApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return {
        "id": str(app.id),
        "first_name": app.first_name,
        "last_name": app.last_name,
        "email": app.email,
        "phone": app.phone,
        "location": app.location,
        "professional_headline": app.professional_headline,
        "bio": app.bio,
        "years_experience": app.years_experience,
        "creative_categories": app.creative_categories,
        "skills": app.skills,
        "portfolio_links": app.portfolio_links,
        "social_links": app.social_links,
        "supporting_documents": app.supporting_documents,
        "additional_notes": app.additional_notes,
        "status": app.status.value,
        "review_notes": app.review_notes,
        "rejection_reason": app.rejection_reason,
        "reviewed_at": app.reviewed_at.isoformat() if app.reviewed_at else None,
        "created_at": app.created_at.isoformat(),
    }


@router.post("/{application_id}/review")
async def review_creative_application(
    application_id: UUID,
    payload: ReviewApplicationRequest,
    db: DBSession,
    admin: AdminUser,
):
    result = await db.execute(
        select(CreativeApplication).where(CreativeApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    if app.status not in (CreativeApplicationStatus.PENDING, CreativeApplicationStatus.UNDER_REVIEW, CreativeApplicationStatus.MORE_INFO_REQUESTED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application is already {app.status.value}.",
        )

    app.reviewed_by_id = admin.id
    app.reviewed_at = datetime.now(timezone.utc)
    app.review_notes = payload.notes

    if payload.action == "approve":
        app.status = CreativeApplicationStatus.APPROVED
        # Check if user already exists
        existing_user = (
            await db.execute(select(User).where(User.email == app.email.lower()))
        ).scalar_one_or_none()
        if existing_user:
            new_user = existing_user
        else:
            new_user = User(
                email=app.email.lower(),
                first_name=app.first_name,
                last_name=app.last_name,
                phone=app.phone,
                role=UserRole.CREATIVE,
                status=AccountStatus.INVITATION_SENT,
            )
            db.add(new_user)
            await db.flush()

        # Provision initial CreativeProfile if not present
        existing_profile = (
            await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == new_user.id))
        ).scalar_one_or_none()
        if not existing_profile:
            first_link = (app.portfolio_links or [None])[0]
            socials = app.social_links or {}
            profile = CreativeProfile(
                user_id=new_user.id,
                professional_headline=app.professional_headline,
                bio=app.bio,
                location=app.location,
                years_experience=app.years_experience,
                availability=AvailabilityStatus.AVAILABLE,
                is_public=True,
                website_url=first_link or socials.get("website"),
                behance_url=socials.get("behance"),
                dribbble_url=socials.get("dribbble"),
                instagram_url=socials.get("instagram"),
                linkedin_url=socials.get("linkedin"),
            )
            db.add(profile)

        # Create invitation token
        raw_token, token_hash = create_invitation_token()
        invitation = UserInvitation(
            user_id=new_user.id,
            token_hash=token_hash,
            expires_at=invitation_token_expiry(),
            invited_by_id=admin.id,
        )
        db.add(invitation)
        app.provisioned_user_id = new_user.id

        # Audit log
        log = AdminAuditLog(
            admin_id=admin.id,
            action=AuditAction.USER_APPROVED,
            target_user_id=new_user.id,
            target_resource_type="creative_application",
            target_resource_id=str(app.id),
            description=f"Approved creative application for {app.email}. Account provisioned and invitation sent.",
        )
        db.add(log)
        await db.flush()

        # Send emails
        await email_service.send_application_status(app.email, app.first_name, "approved")
        await email_service.send_invitation(app.email, app.first_name, raw_token, "creative")

        activation_url = f"{settings.frontend_url}/activate?token={raw_token}"
        return {
            "message": f"Application approved. Account created and invitation sent to {app.email}.",
            "user_id": str(new_user.id),
            "activation_url": activation_url,
        }

    elif payload.action == "under_review":
        app.status = CreativeApplicationStatus.UNDER_REVIEW
        return {"message": "Application marked as under review."}

    elif payload.action == "reject":
        app.status = CreativeApplicationStatus.REJECTED
        app.rejection_reason = payload.rejection_reason

        log = AdminAuditLog(
            admin_id=admin.id,
            action=AuditAction.USER_REJECTED,
            target_resource_type="creative_application",
            target_resource_id=str(app.id),
            description=f"Rejected creative application for {app.email}.",
        )
        db.add(log)

        await email_service.send_application_status(
            app.email, app.first_name, "rejected", reason=payload.rejection_reason
        )
        return {"message": "Application rejected."}

    elif payload.action == "request_info":
        app.status = CreativeApplicationStatus.MORE_INFO_REQUESTED
        return {"message": "Application marked as needing more information."}

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action.")
