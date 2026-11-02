from fastapi import APIRouter

from app.api.v1 import (
    auth,
    users,
    creative_applications,
    client_applications,
    creative_profiles,
    client_profiles,
    jobs,
    job_applications,
    portfolio,
    messaging,
    notifications,
    admin,
    categories,
    skills,
    subscriptions,
    public,
)

api_router = APIRouter()

# Public endpoints (no auth required)
api_router.include_router(public.router, prefix="/public", tags=["Public"])

# Auth
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Applications (pre-account)
api_router.include_router(
    creative_applications.router, prefix="/creative-applications", tags=["Creative Applications"]
)
api_router.include_router(
    client_applications.router, prefix="/client-applications", tags=["Client Applications"]
)

# Profiles
api_router.include_router(
    creative_profiles.router, prefix="/creative-profiles", tags=["Creative Profiles"]
)
api_router.include_router(
    client_profiles.router, prefix="/client-profiles", tags=["Client Profiles"]
)

# Portfolio
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])

# Jobs
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(job_applications.router, prefix="/job-applications", tags=["Job Applications"])

# Communication
api_router.include_router(messaging.router, prefix="/messaging", tags=["Messaging"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Taxonomy
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])

# Subscriptions
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])

# Admin
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
