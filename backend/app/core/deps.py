from typing import Annotated, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import decode_token
from app.core.enums import UserRole, AccountStatus
from app.db.session import get_db
from app.models import User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise credentials_exception
    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or user.deleted_at is not None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.status != AccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {current_user.status.value}. Access denied.",
        )
    return current_user


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user


async def get_current_super_admin(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super administrator access required.",
        )
    return current_user


async def get_current_creative(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    if current_user.role != UserRole.CREATIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creative account required.",
        )
    return current_user


async def get_current_client(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client account required.",
        )
    return current_user


async def get_optional_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """Returns current user if authenticated, None otherwise. For public endpoints."""
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            return None
        result = await db.execute(select(User).where(User.id == UUID(user_id)))
        user = result.scalar_one_or_none()
        return user
    except JWTError:
        return None


# Type aliases for cleaner route signatures
CurrentUser = Annotated[User, Depends(get_current_user)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]
AdminUser = Annotated[User, Depends(get_current_admin)]
SuperAdminUser = Annotated[User, Depends(get_current_super_admin)]
CreativeUser = Annotated[User, Depends(get_current_creative)]
ClientUser = Annotated[User, Depends(get_current_client)]
OptionalUser = Annotated[Optional[User], Depends(get_optional_user)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
