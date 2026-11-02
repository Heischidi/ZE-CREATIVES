import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    CLIENT = "client"
    CREATIVE = "creative"


class AccountStatus(str, enum.Enum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    INVITATION_SENT = "invitation_sent"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"
    REJECTED = "rejected"


class ApplicationStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    OFFERED = "offered"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class CreativeApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    MORE_INFO_REQUESTED = "more_info_requested"


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    REJECTED = "rejected"
    EXPIRED = "expired"


class WorkArrangement(str, enum.Enum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    ON_SITE = "on_site"


class EmploymentType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    FREELANCE = "freelance"
    INTERNSHIP = "internship"
    COMMISSION = "commission"


class ExperienceLevel(str, enum.Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    EXECUTIVE = "executive"


class NotificationType(str, enum.Enum):
    APPLICATION_RECEIVED = "application_received"
    APPLICATION_VIEWED = "application_viewed"
    APPLICATION_SHORTLISTED = "application_shortlisted"
    APPLICATION_REJECTED = "application_rejected"
    INTERVIEW_INVITED = "interview_invited"
    OFFER_RECEIVED = "offer_received"
    JOB_STATUS_CHANGED = "job_status_changed"
    NEW_MESSAGE = "new_message"
    ACCOUNT_APPROVED = "account_approved"
    ACCOUNT_SUSPENDED = "account_suspended"
    ACCOUNT_DEACTIVATED = "account_deactivated"
    INVITATION_SENT = "invitation_sent"
    ANNOUNCEMENT = "announcement"
    NEW_JOB_MATCH = "new_job_match"


class AuditAction(str, enum.Enum):
    USER_CREATED = "user_created"
    USER_APPROVED = "user_approved"
    USER_REJECTED = "user_rejected"
    USER_SUSPENDED = "user_suspended"
    USER_DEACTIVATED = "user_deactivated"
    USER_REACTIVATED = "user_reactivated"
    ROLE_CHANGED = "role_changed"
    PASSWORD_RESET = "password_reset"
    INVITATION_SENT = "invitation_sent"
    ACCOUNT_ACTIVATED = "account_activated"
    JOB_CREATED = "job_created"
    JOB_APPROVED = "job_approved"
    JOB_REJECTED = "job_rejected"
    JOB_REMOVED = "job_removed"
    APPLICATION_REVIEWED = "application_reviewed"
    SUBSCRIPTION_CHANGED = "subscription_changed"
    PAYMENT_PROCESSED = "payment_processed"
    SETTINGS_UPDATED = "settings_updated"
    ADMIN_CREATED = "admin_created"


class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "available"
    OPEN_TO_OPPORTUNITIES = "open_to_opportunities"
    UNAVAILABLE = "unavailable"


class MediaType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    AUDIO = "audio"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
