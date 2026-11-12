from uuid import UUID
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr, Field

from app.core.deps import DBSession, AdminUser
from app.core.enums import CreativeApplicationStatus, AccountStatus, UserRole, AuditAction
from app.models import ClientApplication, User, UserInvitation, ClientProfile, AdminAuditLog
from app.core.security import create_invitation_token, invitation_token_expiry
from app.core.config import settings
from app.services.email import email_service

router = APIRouter()


class ClientApplicationCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    organisation_name: str = Field(min_length=1, max_length=200)
    industry: Optional[str] = None
    website: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    intended_use: Optional[str] = None
    additional_notes: Optional[str] = None


class ReviewClientApplicationRequest(BaseModel):
    action: str  # "approve", "reject"
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def submit_client_application(payload: ClientApplicationCreate, db: DBSession):
    """
    Public endpoint — clients submit access request.
    Does NOT create an active user account directly.
    """
    existing = await db.execute(
        select(ClientApplication).where(
            ClientApplication.email == payload.email.lower(),
            ClientApplication.status == CreativeApplicationStatus.PENDING,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending application with this email already exists.",
        )

    # Check if active user already exists
    user_exists = await db.execute(select(User).where(User.email == payload.email.lower()))
    if user_exists.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please log in.",
        )

    app_obj = ClientApplication(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email.lower(),
        phone=payload.phone,
        organisation_name=payload.organisation_name,
        industry=payload.industry,
        website=payload.website,
        company_size=payload.company_size,
        location=payload.location,
        intended_use=payload.intended_use,
        additional_notes=payload.additional_notes,
        status=CreativeApplicationStatus.PENDING,
    )
    db.add(app_obj)
    await db.flush()

    return {
        "message": "Client access request submitted successfully. Our team will review your application.",
        "application_id": str(app_obj.id),
    }


@router.get("")
@router.get("/", include_in_schema=False)
async def list_client_applications(
    db: DBSession,
    admin: AdminUser,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(ClientApplication)
    if status_filter:
        query = query.where(ClientApplication.status == status_filter)
    if search:
        query = query.where(
            ClientApplication.email.ilike(f"%{search}%")
            | ClientApplication.organisation_name.ilike(f"%{search}%")
            | ClientApplication.first_name.ilike(f"%{search}%")
            | ClientApplication.last_name.ilike(f"%{search}%")
        )

    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar()

    result = await db.execute(
        query.order_by(ClientApplication.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    items = result.scalars().all()

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
                "organisation_name": a.organisation_name,
                "industry": a.industry,
                "website": a.website,
                "company_size": a.company_size,
                "location": a.location,
                "intended_use": a.intended_use,
                "additional_notes": a.additional_notes,
                "review_notes": a.review_notes,
                "rejection_reason": a.rejection_reason,
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
            }
            for a in items
        ],
    }


@router.get("/{application_id}")
async def get_client_application(application_id: UUID, db: DBSession, admin: AdminUser):
    res = await db.execute(select(ClientApplication).where(ClientApplication.id == application_id))
    app_obj = res.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    return {
        "id": str(app_obj.id),
        "first_name": app_obj.first_name,
        "last_name": app_obj.last_name,
        "email": app_obj.email,
        "phone": app_obj.phone,
        "organisation_name": app_obj.organisation_name,
        "industry": app_obj.industry,
        "website": app_obj.website,
        "company_size": app_obj.company_size,
        "location": app_obj.location,
        "intended_use": app_obj.intended_use,
        "additional_notes": app_obj.additional_notes,
        "status": app_obj.status.value if hasattr(app_obj.status, "value") else str(app_obj.status),
        "review_notes": app_obj.review_notes,
        "rejection_reason": app_obj.rejection_reason,
        "reviewed_at": app_obj.reviewed_at.isoformat() if app_obj.reviewed_at else None,
        "created_at": app_obj.created_at.isoformat() if app_obj.created_at else None,
    }


@router.post("/{application_id}/review")
async def review_client_application(
    application_id: UUID,
    payload: ReviewClientApplicationRequest,
    db: DBSession,
    admin: AdminUser,
):
    res = await db.execute(select(ClientApplication).where(ClientApplication.id == application_id))
    app_obj = res.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    now = datetime.now(timezone.utc)
    app_obj.reviewed_by_id = admin.id
    app_obj.reviewed_at = now
    app_obj.review_notes = payload.notes

    if payload.action == "approve":
        app_obj.status = CreativeApplicationStatus.APPROVED

        existing_user = (
            await db.execute(select(User).where(User.email == app_obj.email.lower()))
        ).scalar_one_or_none()
        if existing_user:
            new_user = existing_user
        else:
            new_user = User(
                email=app_obj.email.lower(),
                first_name=app_obj.first_name,
                last_name=app_obj.last_name,
                phone=app_obj.phone,
                role=UserRole.CLIENT,
                status=AccountStatus.INVITATION_SENT,
            )
            db.add(new_user)
            await db.flush()

        app_obj.provisioned_user_id = new_user.id

        # Create client profile if not present
        existing_profile = (
            await db.execute(select(ClientProfile).where(ClientProfile.user_id == new_user.id))
        ).scalar_one_or_none()
        if not existing_profile:
            client_profile = ClientProfile(
                user_id=new_user.id,
                organisation_name=app_obj.organisation_name,
                industry=app_obj.industry,
                company_size=app_obj.company_size,
                website_url=app_obj.website,
                location=app_obj.location,
                description=app_obj.intended_use,
                is_verified=True,
            )
            db.add(client_profile)

        # Generate invitation token
        raw_token, token_hash = create_invitation_token()
        invitation = UserInvitation(
            user_id=new_user.id,
            token_hash=token_hash,
            expires_at=invitation_token_expiry(),
            invited_by_id=admin.id,
        )
        db.add(invitation)

        # Audit log
        audit = AdminAuditLog(
            admin_id=admin.id,
            action=AuditAction.USER_APPROVED,
            target_user_id=new_user.id,
            target_resource_type="client_application",
            target_resource_id=str(app_obj.id),
            description=f"Approved client application for {app_obj.organisation_name} ({app_obj.email})",
        )
        db.add(audit)
        await db.flush()

        # Send invitation email
        await email_service.send_invitation(
            to_email=new_user.email,
            first_name=new_user.first_name,
            raw_token=raw_token,
            role="client",
        )

        activation_url = f"{settings.frontend_url}/activate?token={raw_token}"
        return {
            "message": "Client application approved and invitation sent.",
            "user_id": str(new_user.id),
            "activation_url": activation_url,
        }

    elif payload.action == "reject":
        app_obj.status = CreativeApplicationStatus.REJECTED
        app_obj.rejection_reason = payload.rejection_reason or "Application did not meet our current requirements."

        audit = AdminAuditLog(
            admin_id=admin.id,
            action=AuditAction.USER_REJECTED,
            target_resource_type="client_application",
            target_resource_id=str(app_obj.id),
            description=f"Rejected client application for {app_obj.organisation_name} ({app_obj.email})",
        )
        db.add(audit)
        await db.flush()

        return {"message": "Client application rejected."}

    elif payload.action == "under_review":
        app_obj.status = CreativeApplicationStatus.UNDER_REVIEW
        return {"message": "Client application marked as under review."}

    elif payload.action == "request_info":
        app_obj.status = CreativeApplicationStatus.MORE_INFO_REQUESTED
        return {"message": "Client application marked as needing more information."}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action.")
