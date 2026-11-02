"""
Ze: Creatives — Complete Database Models
All 30+ tables with relationships, indexes and constraints.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime, ForeignKey,
    Enum as SAEnum, JSON, UniqueConstraint, Index, func
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.core.enums import (
    UserRole, AccountStatus, ApplicationStatus, CreativeApplicationStatus,
    JobStatus, WorkArrangement, EmploymentType, ExperienceLevel,
    NotificationType, AuditAction, AvailabilityStatus, MediaType,
    SubscriptionStatus, PaymentStatus,
)


def now_utc():
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────
# USERS & AUTH
# ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    status: Mapped[AccountStatus] = mapped_column(
        SAEnum(AccountStatus), nullable=False, default=AccountStatus.PENDING_REVIEW
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    creative_profile: Mapped[Optional["CreativeProfile"]] = relationship(back_populates="user", uselist=False)
    client_profile: Mapped[Optional["ClientProfile"]] = relationship(back_populates="user", uselist=False)
    invitations: Mapped[List["UserInvitation"]] = relationship(back_populates="user", foreign_keys="UserInvitation.user_id")
    sent_messages: Mapped[List["Message"]] = relationship(back_populates="sender", foreign_keys="Message.sender_id")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user")
    audit_logs_performed: Mapped[List["AdminAuditLog"]] = relationship(back_populates="admin_user", foreign_keys="AdminAuditLog.admin_id")

    __table_args__ = (
        Index("ix_users_role_status", "role", "status"),
    )


class UserInvitation(Base):
    __tablename__ = "user_invitations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    invited_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    user: Mapped["User"] = relationship(back_populates="invitations", foreign_keys=[user_id])
    invited_by: Mapped[Optional["User"]] = relationship(foreign_keys=[invited_by_id])


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


# ─────────────────────────────────────────────
# APPLICATIONS (PRE-ACCOUNT)
# ─────────────────────────────────────────────

class CreativeApplication(Base):
    __tablename__ = "creative_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    professional_headline: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    creative_categories: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # list of category IDs
    skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    portfolio_links: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    social_links: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    supporting_documents: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # S3 keys
    additional_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[CreativeApplicationStatus] = mapped_column(
        SAEnum(CreativeApplicationStatus), default=CreativeApplicationStatus.PENDING
    )
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    provisioned_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    reviewed_by: Mapped[Optional["User"]] = relationship(foreign_keys=[reviewed_by_id])
    provisioned_user: Mapped[Optional["User"]] = relationship(foreign_keys=[provisioned_user_id])


class ClientApplication(Base):
    __tablename__ = "client_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    organisation_name: Mapped[str] = mapped_column(String(200), nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    intended_use: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    additional_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[CreativeApplicationStatus] = mapped_column(
        SAEnum(CreativeApplicationStatus), default=CreativeApplicationStatus.PENDING
    )
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    provisioned_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    reviewed_by: Mapped[Optional["User"]] = relationship(foreign_keys=[reviewed_by_id])
    provisioned_user: Mapped[Optional["User"]] = relationship(foreign_keys=[provisioned_user_id])


# ─────────────────────────────────────────────
# TAXONOMY
# ─────────────────────────────────────────────

class CreativeCategory(Base):
    __tablename__ = "creative_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("creative_categories.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    category: Mapped[Optional["CreativeCategory"]] = relationship()


# ─────────────────────────────────────────────
# CREATIVE PROFILE
# ─────────────────────────────────────────────

class CreativeProfile(Base):
    __tablename__ = "creative_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    professional_headline: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hourly_rate_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hourly_rate_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    project_rate_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    project_rate_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    availability: Mapped[AvailabilityStatus] = mapped_column(
        SAEnum(AvailabilityStatus), default=AvailabilityStatus.AVAILABLE
    )
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    profile_views: Mapped[int] = mapped_column(Integer, default=0)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_step: Mapped[int] = mapped_column(Integer, default=1)

    # Social links
    website_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    behance_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instagram_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    twitter_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dribbble_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    youtube_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    other_links: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    user: Mapped["User"] = relationship(back_populates="creative_profile")
    categories: Mapped[List["CreativeProfileCategory"]] = relationship(back_populates="profile")
    skills: Mapped[List["CreativeProfileSkill"]] = relationship(back_populates="profile")
    portfolio_projects: Mapped[List["PortfolioProject"]] = relationship(back_populates="profile")
    work_experiences: Mapped[List["WorkExperience"]] = relationship(back_populates="profile")
    education: Mapped[List["Education"]] = relationship(back_populates="profile")


class CreativeProfileCategory(Base):
    __tablename__ = "creative_profile_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("creative_profiles.id"), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("creative_categories.id"), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    profile: Mapped["CreativeProfile"] = relationship(back_populates="categories")
    category: Mapped["CreativeCategory"] = relationship()

    __table_args__ = (UniqueConstraint("profile_id", "category_id"),)


class CreativeProfileSkill(Base):
    __tablename__ = "creative_profile_skills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("creative_profiles.id"), nullable=False)
    skill_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("skills.id"), nullable=True)
    custom_skill: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    proficiency_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5

    profile: Mapped["CreativeProfile"] = relationship(back_populates="skills")
    skill: Mapped[Optional["Skill"]] = relationship()


class WorkExperience(Base):
    __tablename__ = "work_experiences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("creative_profiles.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    company: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    profile: Mapped["CreativeProfile"] = relationship(back_populates="work_experiences")


class Education(Base):
    __tablename__ = "education"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("creative_profiles.id"), nullable=False)
    institution: Mapped[str] = mapped_column(String(200), nullable=False)
    degree: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    field_of_study: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    start_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    profile: Mapped["CreativeProfile"] = relationship(back_populates="education")


# ─────────────────────────────────────────────
# PORTFOLIO
# ─────────────────────────────────────────────

class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("creative_profiles.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("creative_categories.id"), nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    project_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tools_used: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    completion_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    profile: Mapped["CreativeProfile"] = relationship(back_populates="portfolio_projects")
    category: Mapped[Optional["CreativeCategory"]] = relationship()
    media: Mapped[List["PortfolioMedia"]] = relationship(back_populates="project")


class PortfolioMedia(Base):
    __tablename__ = "portfolio_media"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("portfolio_projects.id"), nullable=False)
    media_type: Mapped[MediaType] = mapped_column(SAEnum(MediaType), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    s3_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    caption: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    project: Mapped["PortfolioProject"] = relationship(back_populates="media")


# ─────────────────────────────────────────────
# CLIENT PROFILE
# ─────────────────────────────────────────────

class ClientProfile(Base):
    __tablename__ = "client_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    organisation_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    twitter_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    user: Mapped["User"] = relationship(back_populates="client_profile")
    jobs: Mapped[List["Job"]] = relationship(back_populates="client")


# ─────────────────────────────────────────────
# JOBS
# ─────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("client_profiles.id"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("creative_categories.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responsibilities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferred_skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    work_arrangement: Mapped[Optional[WorkArrangement]] = mapped_column(SAEnum(WorkArrangement), nullable=True)
    employment_type: Mapped[Optional[EmploymentType]] = mapped_column(SAEnum(EmploymentType), nullable=True)
    experience_level: Mapped[Optional[ExperienceLevel]] = mapped_column(SAEnum(ExperienceLevel), nullable=True)
    salary_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    is_salary_disclosed: Mapped[bool] = mapped_column(Boolean, default=True)
    application_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus), default=JobStatus.DRAFT)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    applications_count: Mapped[int] = mapped_column(Integer, default=0)
    custom_questions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    moderation_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    moderated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    client: Mapped["ClientProfile"] = relationship(back_populates="jobs")
    category: Mapped[Optional["CreativeCategory"]] = relationship()
    skills: Mapped[List["JobSkill"]] = relationship(back_populates="job")
    applications: Mapped[List["JobApplication"]] = relationship(back_populates="job")
    saved_by: Mapped[List["SavedJob"]] = relationship(back_populates="job")
    moderated_by: Mapped[Optional["User"]] = relationship(foreign_keys=[moderated_by_id])

    __table_args__ = (
        Index("ix_jobs_status_published", "status", "published_at"),
        Index("ix_jobs_category", "category_id"),
    )


class JobSkill(Base):
    __tablename__ = "job_skills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"), nullable=False)
    skill_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("skills.id"), nullable=True)
    custom_skill: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)

    job: Mapped["Job"] = relationship(back_populates="skills")
    skill: Mapped[Optional["Skill"]] = relationship()


class JobApplication(Base):
    __tablename__ = "job_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"), nullable=False)
    creative_profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("creative_profiles.id"), nullable=False)
    cover_letter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    portfolio_project_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    supporting_documents: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    custom_answers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED
    )
    client_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_viewed: Mapped[bool] = mapped_column(Boolean, default=False)
    viewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    job: Mapped["Job"] = relationship(back_populates="applications")
    creative_profile: Mapped["CreativeProfile"] = relationship()
    status_history: Mapped[List["ApplicationStatusHistory"]] = relationship(back_populates="application")

    __table_args__ = (UniqueConstraint("job_id", "creative_profile_id"),)


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_applications.id"), nullable=False)
    previous_status: Mapped[Optional[ApplicationStatus]] = mapped_column(SAEnum(ApplicationStatus), nullable=True)
    new_status: Mapped[ApplicationStatus] = mapped_column(SAEnum(ApplicationStatus), nullable=False)
    changed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    application: Mapped["JobApplication"] = relationship(back_populates="status_history")
    changed_by: Mapped[Optional["User"]] = relationship()


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"), nullable=False)
    creative_profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("creative_profiles.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    job: Mapped["Job"] = relationship(back_populates="saved_by")
    creative_profile: Mapped["CreativeProfile"] = relationship()

    __table_args__ = (UniqueConstraint("job_id", "creative_profile_id"),)


# ─────────────────────────────────────────────
# MESSAGING
# ─────────────────────────────────────────────

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_application_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("job_applications.id"), nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    participants: Mapped[List["ConversationParticipant"]] = relationship(back_populates="conversation")
    messages: Mapped[List["Message"]] = relationship(back_populates="conversation")


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    last_read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    conversation: Mapped["Conversation"] = relationship(back_populates="participants")
    user: Mapped["User"] = relationship()

    __table_args__ = (UniqueConstraint("conversation_id", "user_id"),)


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id"), nullable=False)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    is_system_message: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship(back_populates="sent_messages", foreign_keys=[sender_id])

    __table_args__ = (Index("ix_messages_conversation", "conversation_id", "created_at"),)


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[NotificationType] = mapped_column(SAEnum(NotificationType), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    user: Mapped["User"] = relationship(back_populates="notifications")

    __table_args__ = (Index("ix_notifications_user_read", "user_id", "is_read"),)


# ─────────────────────────────────────────────
# SUBSCRIPTIONS & PAYMENTS
# ─────────────────────────────────────────────

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    price_monthly: Mapped[float] = mapped_column(Float, nullable=False)
    price_yearly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    features: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    limits: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subscription_plans.id"), nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(SAEnum(SubscriptionStatus), nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    external_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    plan: Mapped["SubscriptionPlan"] = relationship()


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    subscription_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("subscriptions.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus), nullable=False)
    payment_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    external_payment_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meta_data: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


# ─────────────────────────────────────────────
# PLATFORM MANAGEMENT
# ─────────────────────────────────────────────

class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    target_roles: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    created_by: Mapped["User"] = relationship()


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    reported_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    reported_job_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    reporter: Mapped["User"] = relationship(foreign_keys=[reporter_id])
    reported_user: Mapped[Optional["User"]] = relationship(foreign_keys=[reported_user_id])
    reviewed_by: Mapped[Optional["User"]] = relationship(foreign_keys=[reviewed_by_id])


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[AuditAction] = mapped_column(SAEnum(AuditAction), nullable=False)
    target_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    target_resource_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    target_resource_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meta_data: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    admin_user: Mapped["User"] = relationship(back_populates="audit_logs_performed", foreign_keys=[admin_id])
    target_user: Mapped[Optional["User"]] = relationship(foreign_keys=[target_user_id])

    __table_args__ = (Index("ix_audit_logs_admin_action", "admin_id", "action", "created_at"),)


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    value_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
