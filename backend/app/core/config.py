from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Ze: Creatives"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://zeuser:zepass@localhost:5432/zecreatives"

    # JWT
    SECRET_KEY: str = "CHANGE_THIS_TO_A_SECURE_256_BIT_RANDOM_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    INVITATION_TOKEN_EXPIRE_HOURS: int = 72
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Email
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    EMAIL_FROM: str = "noreply@zecreatives.com"
    EMAIL_FROM_NAME: str = "Ze: Creatives"

    # S3-compatible Storage
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "ze-creatives"
    S3_REGION: str = "us-east-1"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Admin seed
    ADMIN_SEED_EMAIL: str = "admin@zecreatives.com"
    ADMIN_SEED_PASSWORD: str = "ChangeThisAdminPassword123!"
    ADMIN_SEED_NAME: str = "Platform Administrator"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # File upload
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    ALLOWED_VIDEO_TYPES: list[str] = ["video/mp4", "video/webm", "video/mov"]
    ALLOWED_DOCUMENT_TYPES: list[str] = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
