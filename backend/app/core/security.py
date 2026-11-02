from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import hashlib

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def create_invitation_token() -> tuple[str, str]:
    """Returns (raw_token, hashed_token). Store the hash, send the raw token."""
    raw_token = secrets.token_urlsafe(48)
    hashed = hashlib.sha256(raw_token.encode()).hexdigest()
    return raw_token, hashed


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def invitation_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=settings.INVITATION_TOKEN_EXPIRE_HOURS)


def password_reset_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
