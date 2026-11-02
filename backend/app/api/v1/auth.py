from datetime import datetime, timezone
from uuid import UUID
from typing import Annotated

from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.deps import DBSession, ActiveUser
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, hash_token,
    password_reset_token_expiry, create_invitation_token,
)
from app.core.enums import AccountStatus
from app.models import User, UserInvitation, PasswordResetToken
from app.schemas.auth import (
    TokenResponse, LoginRequest, RefreshRequest,
    ActivateAccountRequest, PasswordResetRequest, PasswordResetConfirmRequest,
    ChangePasswordRequest,
)
from app.services.email import email_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: DBSession):
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    if user.status == AccountStatus.REJECTED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your application was not approved.")
    if user.status == AccountStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended. Contact support.")
    if user.status == AccountStatus.DEACTIVATED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated.")
    if user.status not in (AccountStatus.ACTIVE,):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not yet active. Please complete account activation.",
        )

    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Update last login
    await db.execute(
        update(User).where(User.id == user.id).values(last_login_at=datetime.now(timezone.utc))
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=str(user.id),
        role=user.role.value,
        status=user.status.value,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        avatar_url=user.avatar_url,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: DBSession):
    from jose import JWTError
    try:
        token_data = decode_token(payload.refresh_token)
        if token_data.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")
        user_id = token_data.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or user.status != AccountStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user_id=str(user.id),
        role=user.role.value,
        status=user.status.value,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        avatar_url=user.avatar_url,
    )


@router.post("/activate")
async def activate_account(payload: ActivateAccountRequest, db: DBSession):
    """Creative/client activates their account using the invitation token."""
    token_hash = hash_token(payload.token)

    result = await db.execute(
        select(UserInvitation).where(
            UserInvitation.token_hash == token_hash,
            UserInvitation.is_used == False,
        )
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired invitation link.")
    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation link has expired.")

    # Get the user
    result = await db.execute(select(User).where(User.id == invitation.user_id))
    user = result.scalar_one_or_none()
    if not user or user.status != AccountStatus.INVITATION_SENT:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invitation state.")

    # Set password and activate
    user.hashed_password = get_password_hash(payload.password)
    user.status = AccountStatus.ACTIVE
    user.is_email_verified = True
    invitation.is_used = True
    invitation.used_at = datetime.now(timezone.utc)

    return {"message": "Account activated successfully. You can now log in."}


@router.post("/forgot-password")
async def forgot_password(payload: PasswordResetRequest, db: DBSession):
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    if user and user.status == AccountStatus.ACTIVE:
        raw_token, token_hash = create_invitation_token()
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=password_reset_token_expiry(),
        )
        db.add(reset_token)
        await email_service.send_password_reset(user.email, user.first_name, raw_token)

    return {"message": "If that email is associated with an active account, you'll receive reset instructions."}


@router.post("/reset-password")
async def reset_password(payload: PasswordResetConfirmRequest, db: DBSession):
    token_hash = hash_token(payload.token)
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.is_used == False,
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token or reset_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link.")

    result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found.")

    user.hashed_password = get_password_hash(payload.new_password)
    reset_token.is_used = True
    reset_token.used_at = datetime.now(timezone.utc)

    return {"message": "Password reset successfully. You can now log in."}


@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest, current_user: ActiveUser, db: DBSession):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    current_user.hashed_password = get_password_hash(payload.new_password)
    return {"message": "Password changed successfully."}


@router.get("/me")
async def get_me(current_user: ActiveUser):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role.value,
        "status": current_user.status.value,
        "avatar_url": current_user.avatar_url,
        "is_email_verified": current_user.is_email_verified,
    }
