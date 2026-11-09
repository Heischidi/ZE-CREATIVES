from pydantic import model_validator
from pydantic_settings import BaseSettings
from typing import Optional

_DEFAULT_SECRET_KEY = "CHANGE_THIS_TO_A_SECURE_256_BIT_RANDOM_KEY"
_DEFAULT_ADMIN_PASSWORD = "ChangeThisAdminPassword123!"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Ze: Creatives"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://zeuser:zepass@localhost:5432/zecreatives"

    # JWT
    SECRET_KEY: str = _DEFAULT_SECRET_KEY
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
    # Public URL of the frontend (used for CORS and for links in emails).
    FRONTEND_URL: str = "http://localhost:3000"
    # Optional comma-separated extra origins, e.g. preview deployments or a custom domain.
    EXTRA_ALLOWED_ORIGINS: str = ""

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
    ADMIN_SEED_PASSWORD: str = _DEFAULT_ADMIN_PASSWORD
    ADMIN_SEED_NAME: str = "Platform Administrator"
    # Demo accounts/sample job use hardcoded passwords; keep this false in production.
    SEED_DEMO_DATA: bool = True

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

    @property
    def frontend_url(self) -> str:
        return self.FRONTEND_URL.strip().strip("\"'").rstrip("/")

    @property
    def cors_origins(self) -> list[str]:
        """All allowed CORS origins (deduplicated, no trailing slashes)."""
        origins = [*self.ALLOWED_ORIGINS, self.FRONTEND_URL]
        origins += [o for o in self.EXTRA_ALLOWED_ORIGINS.split(",")]
        cleaned: list[str] = []
        for origin in origins:
            origin = origin.strip().strip("\"'").rstrip("/")
            if origin and origin not in cleaned:
                cleaned.append(origin)
        return cleaned

    @model_validator(mode="after")
    def _check_production_settings(self) -> "Settings":
        """Normalize string env vars and refuse to start in production with insecure defaults."""
        for attr in (
            "DATABASE_URL",
            "SECRET_KEY",
            "FRONTEND_URL",
            "EXTRA_ALLOWED_ORIGINS",
            "ENVIRONMENT",
            "SMTP_HOST",
            "SMTP_USER",
            "SMTP_PASSWORD",
            "EMAIL_FROM",
            "S3_ENDPOINT_URL",
            "S3_ACCESS_KEY",
            "S3_SECRET_KEY",
            "S3_BUCKET_NAME",
            "S3_REGION",
        ):
            val = getattr(self, attr, None)
            if isinstance(val, str):
                object.__setattr__(self, attr, val.strip().strip("\"'"))
        if self.ENVIRONMENT.lower() != "production":
            return self
        problems = []
        if self.SECRET_KEY == _DEFAULT_SECRET_KEY or len(self.SECRET_KEY) < 32:
            problems.append("SECRET_KEY must be set to a random value of at least 32 characters")
        if self.DEBUG:
            problems.append("DEBUG must be false")
        if "localhost" in self.FRONTEND_URL or "127.0.0.1" in self.FRONTEND_URL:
            problems.append("FRONTEND_URL must be the public frontend URL, not localhost")
        if "localhost" in self.DATABASE_URL:
            problems.append("DATABASE_URL must point at the production database")
        if problems:
            raise ValueError("Insecure production configuration: " + "; ".join(problems))
        return self


settings = Settings()
