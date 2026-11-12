"""
Database seeder — creates the initial super admin account and default categories.
Run: python -m backend.app.db.seed
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import engine, AsyncSessionLocal, Base
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.enums import (
    UserRole, AccountStatus, AvailabilityStatus, JobStatus,
    WorkArrangement, EmploymentType, ExperienceLevel,
    CreativeApplicationStatus, AuditAction
)
from app.models import (
    User, CreativeCategory, Skill, SubscriptionPlan,
    CreativeProfile, ClientProfile, Job,
    CreativeApplication, ClientApplication, PortfolioProject,
    Announcement, AdminAuditLog
)
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)


DEFAULT_CATEGORIES = [
    {"name": "Graphic Design", "slug": "graphic-design", "icon": "palette", "color": "#7957F5", "sort_order": 1},
    {"name": "UI/UX Design", "slug": "ui-ux-design", "icon": "monitor", "color": "#9B7CF7", "sort_order": 2},
    {"name": "Photography", "slug": "photography", "icon": "camera", "color": "#F8E7F0", "sort_order": 3},
    {"name": "Videography", "slug": "videography", "icon": "video", "color": "#E9DFFF", "sort_order": 4},
    {"name": "Film Production", "slug": "film-production", "icon": "film", "color": "#7957F5", "sort_order": 5},
    {"name": "Animation & Motion Graphics", "slug": "animation-motion-graphics", "icon": "play-circle", "color": "#9B7CF7", "sort_order": 6},
    {"name": "Music & Audio Production", "slug": "music-audio-production", "icon": "music", "color": "#F8E7F0", "sort_order": 7},
    {"name": "Singing & Performing Arts", "slug": "singing-performing-arts", "icon": "mic", "color": "#E9DFFF", "sort_order": 8},
    {"name": "Writing & Content Creation", "slug": "writing-content-creation", "icon": "pen-tool", "color": "#7957F5", "sort_order": 9},
    {"name": "Fashion & Modelling", "slug": "fashion-modelling", "icon": "star", "color": "#9B7CF7", "sort_order": 10},
    {"name": "Fashion Design", "slug": "fashion-design", "icon": "scissors", "color": "#F8E7F0", "sort_order": 11},
    {"name": "Software Development", "slug": "software-development", "icon": "code", "color": "#E9DFFF", "sort_order": 12},
    {"name": "Web Development", "slug": "web-development", "icon": "globe", "color": "#7957F5", "sort_order": 13},
    {"name": "AI & Technology", "slug": "ai-technology", "icon": "cpu", "color": "#9B7CF7", "sort_order": 14},
    {"name": "Illustration & Digital Art", "slug": "illustration-digital-art", "icon": "feather", "color": "#F8E7F0", "sort_order": 15},
    {"name": "Branding & Marketing", "slug": "branding-marketing", "icon": "trending-up", "color": "#E9DFFF", "sort_order": 16},
    {"name": "Social Media Management", "slug": "social-media-management", "icon": "share-2", "color": "#7957F5", "sort_order": 17},
    {"name": "Event Production", "slug": "event-production", "icon": "calendar", "color": "#9B7CF7", "sort_order": 18},
    {"name": "Architecture & Interior Design", "slug": "architecture-interior-design", "icon": "home", "color": "#F8E7F0", "sort_order": 19},
    {"name": "Other Creative Disciplines", "slug": "other-creative", "icon": "more-horizontal", "color": "#777386", "sort_order": 20},
]

DEFAULT_SUBSCRIPTION_PLANS = [
    {
        "name": "Creative Free",
        "slug": "creative-free",
        "description": "Get started as a creative professional on Ze: Creatives.",
        "target_role": UserRole.CREATIVE,
        "price_monthly": 0.0,
        "price_yearly": 0.0,
        "features": ["Create a professional profile", "Apply to 5 jobs per month", "Basic portfolio (3 projects)", "Community access"],
        "limits": {"job_applications_per_month": 5, "portfolio_projects": 3},
        "sort_order": 1,
    },
    {
        "name": "Creative Pro",
        "slug": "creative-pro",
        "description": "Unlock your full creative potential with unlimited access.",
        "target_role": UserRole.CREATIVE,
        "price_monthly": 9.99,
        "price_yearly": 89.99,
        "features": ["Unlimited job applications", "Unlimited portfolio projects", "Featured profile listing", "Priority support", "Analytics dashboard", "Custom URL"],
        "limits": {"job_applications_per_month": -1, "portfolio_projects": -1},
        "sort_order": 2,
        "is_featured": True,
    },
    {
        "name": "Client Starter",
        "slug": "client-starter",
        "description": "Start hiring creative talent for your projects.",
        "target_role": UserRole.CLIENT,
        "price_monthly": 0.0,
        "price_yearly": 0.0,
        "features": ["Post 2 jobs per month", "Access creative directory", "Basic applicant management"],
        "limits": {"jobs_per_month": 2},
        "sort_order": 3,
    },
    {
        "name": "Client Pro",
        "slug": "client-pro",
        "description": "Scale your creative hiring with powerful tools.",
        "target_role": UserRole.CLIENT,
        "price_monthly": 29.99,
        "price_yearly": 269.99,
        "features": ["Unlimited job postings", "Featured job listings", "Advanced applicant filtering", "Priority support", "Team collaboration", "Hiring analytics"],
        "limits": {"jobs_per_month": -1},
        "sort_order": 4,
        "is_featured": True,
    },
]


async def seed():
    """Run database seeding."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # ─── Super Admin ────────────────────────────────────────────────────
        existing_admin = await db.scalar(
            select(User).where(User.email == settings.ADMIN_SEED_EMAIL)
        )
        if not existing_admin:
            admin = User(
                email=settings.ADMIN_SEED_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_SEED_PASSWORD),
                first_name="Platform",
                last_name="Administrator",
                role=UserRole.SUPER_ADMIN,
                status=AccountStatus.ACTIVE,
                is_email_verified=True,
            )
            db.add(admin)
            logger.info(f"✅ Super admin created: {settings.ADMIN_SEED_EMAIL}")
        else:
            logger.info(f"ℹ️  Super admin already exists: {settings.ADMIN_SEED_EMAIL}")

        # ─── Creative Categories ─────────────────────────────────────────────
        for cat_data in DEFAULT_CATEGORIES:
            existing = await db.scalar(
                select(CreativeCategory).where(CreativeCategory.slug == cat_data["slug"])
            )
            if not existing:
                category = CreativeCategory(**cat_data)
                db.add(category)

        logger.info("✅ Creative categories seeded.")

        # ─── Subscription Plans ──────────────────────────────────────────────
        for plan_data in DEFAULT_SUBSCRIPTION_PLANS:
            existing = await db.scalar(
                select(SubscriptionPlan).where(SubscriptionPlan.slug == plan_data["slug"])
            )
            if not existing:
                plan = SubscriptionPlan(**plan_data)
                db.add(plan)

        logger.info("✅ Subscription plans seeded.")

        if not settings.SEED_DEMO_DATA:
            await db.commit()
            logger.info("ℹ️  SEED_DEMO_DATA=false: skipped demo creative, client and sample job.")
            logger.info("🎉 Database seeding complete.")
            return

        # ─── Verified Creative (Elena) ──────────────────────────────────────
        existing_creative = await db.scalar(
            select(User).where(User.email == "elena@zecreatives.com")
        )
        if not existing_creative:
            creative_user = User(
                email="elena@zecreatives.com",
                hashed_password=get_password_hash("CreativeZe2026!"),
                first_name="Elena",
                last_name="Rostova",
                role=UserRole.CREATIVE,
                status=AccountStatus.ACTIVE,
                is_email_verified=True,
            )
            db.add(creative_user)
            await db.flush()

            creative_profile = CreativeProfile(
                user_id=creative_user.id,
                professional_headline="Senior Art & Brand Identity Director",
                bio="Multi-disciplinary art director with 8+ years crafting bespoke brand identities, design systems, and digital experiences for high-growth tech companies and culture brands.",
                location="London, United Kingdom",
                country="United Kingdom",
                years_experience=8,
                hourly_rate_min=95.0,
                hourly_rate_max=150.0,
                currency="USD",
                availability=AvailabilityStatus.AVAILABLE,
                is_public=True,
                onboarding_completed=True,
                onboarding_step=7,
                website_url="https://elenarostova.design",
                dribbble_url="https://dribbble.com",
                behance_url="https://behance.net",
            )
            db.add(creative_profile)
            logger.info("✅ Verified Creative seeded: elena@zecreatives.com")
        else:
            logger.info("ℹ️  Verified Creative already exists: elena@zecreatives.com")

        # ─── Verified Client (Apex Studio) ──────────────────────────────────
        existing_client = await db.scalar(
            select(User).where(User.email == "client@zecreatives.com")
        )
        if not existing_client:
            client_user = User(
                email="client@zecreatives.com",
                hashed_password=get_password_hash("ClientZe2026!"),
                first_name="Marcus",
                last_name="Vance",
                role=UserRole.CLIENT,
                status=AccountStatus.ACTIVE,
                is_email_verified=True,
            )
            db.add(client_user)
            await db.flush()

            client_profile = ClientProfile(
                user_id=client_user.id,
                organisation_name="Apex Creative & Motion Studio",
                industry="Design & Technology",
                company_size="11-50",
                website_url="https://apexcreative.agency",
                description="We design and build iconic brand experiences and interactive storytelling for future-defining ventures.",
                location="New York, NY",
                country="United States",
                is_verified=True,
                onboarding_completed=True,
            )
            db.add(client_profile)
            await db.flush()

            # Seed a sample published job
            design_category = await db.scalar(
                select(CreativeCategory).where(CreativeCategory.slug == "ui-ux-design")
            )
            sample_job = Job(
                client_id=client_profile.id,
                category_id=design_category.id if design_category else None,
                title="Lead Product & Brand Systems Designer",
                description="Apex is seeking a vision-driven Lead Product & Brand Systems Designer to steer our next wave of visual storytelling and digital interface design.",
                responsibilities="Lead design initiatives from concept to production; Build and maintain comprehensive design systems; Collaborate closely with founders and creative directors.",
                requirements="5+ years of senior-level design experience; Exceptional portfolio demonstrating systems thinking and typographic mastery; Proficiency in Figma, Cinema 4D or equivalent 3D tools.",
                preferred_skills="Figma, Design Systems, Typography, 3D Art Direction, Motion Design",
                location="Remote / New York, NY",
                country="United States",
                work_arrangement=WorkArrangement.REMOTE,
                employment_type=EmploymentType.FULL_TIME,
                experience_level=ExperienceLevel.LEAD,
                salary_min=130000.0,
                salary_max=165000.0,
                currency="USD",
                is_salary_disclosed=True,
                status=JobStatus.ACTIVE,
                is_featured=True,
            )
            db.add(sample_job)
            logger.info("✅ Verified Client & sample job seeded: client@zecreatives.com")
        else:
            logger.info("ℹ️  Verified Client already exists: client@zecreatives.com")

        # ─── Ensure Elena has Sample Portfolio Projects ─────────────────────
        elena_user = await db.scalar(select(User).where(User.email == "elena@zecreatives.com"))
        if elena_user:
            elena_profile = await db.scalar(select(CreativeProfile).where(CreativeProfile.user_id == elena_user.id))
            if elena_profile:
                existing_proj = await db.scalar(select(PortfolioProject).where(PortfolioProject.profile_id == elena_profile.id))
                if not existing_proj:
                    db.add_all([
                        PortfolioProject(
                            profile_id=elena_profile.id,
                            title="Aether OS — Spatial Computing Design System",
                            description="End-to-end typographic and spatial UI design system for next-generation AR/VR hardware.",
                            cover_image_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
                            project_url="https://elenarostova.design/aether-os",
                            tools_used=["Figma", "Cinema 4D", "After Effects"],
                            is_featured=True,
                            is_public=True,
                            sort_order=1,
                        ),
                        PortfolioProject(
                            profile_id=elena_profile.id,
                            title="Vespera Global Rebrand & Kinetic Identity",
                            description="Global brand architecture, bespoke variable typeface Direction, and 3D motion guidelines for fintech unicorn Vespera.",
                            cover_image_url="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
                            project_url="https://elenarostova.design/vespera",
                            tools_used=["Illustrator", "Glyphs", "Blender", "Figma"],
                            is_featured=True,
                            is_public=True,
                            sort_order=2,
                        ),
                    ])
                    logger.info("✅ Sample portfolio projects seeded for Elena.")

        # ─── Sample Creative Applications (Vetting Queue) ────────────────────
        sample_creative_apps = [
            {
                "first_name": "Soren",
                "last_name": "Lindqvist",
                "email": "soren@nordicvisuals.io",
                "phone": "+46 70 421 8890",
                "location": "Stockholm, Sweden",
                "professional_headline": "Principal 3D Motion Director & Real-Time Shader Artist",
                "bio": "10+ years directing procedural 3D motion systems, Houdini simulations, and WebGL/Three.js interactive brand worlds for luxury automotive and fashion houses.",
                "years_experience": 10,
                "skills": ["Houdini", "Cinema 4D", "Redshift", "GLSL Shaders", "Unreal Engine 5", "Art Direction"],
                "portfolio_links": ["https://nordicvisuals.io", "https://behance.net/sorenlindqvist"],
                "social_links": {"instagram": "https://instagram.com/soren.motion", "linkedin": "https://linkedin.com/in/sorenlindqvist"},
                "additional_notes": "Previously led 3D brand motion for Polestar and Acne Studios digital showcases.",
                "status": CreativeApplicationStatus.PENDING,
            },
            {
                "first_name": "Maya",
                "last_name": "Patel",
                "email": "maya.patel@studio-k.design",
                "phone": "+44 7700 900412",
                "location": "London, United Kingdom",
                "professional_headline": "Staff Product Designer & Design Systems Architect",
                "bio": "Specializing in multi-brand token architectures, AI-native creative workflows, and zero-to-one fintech and developer tool interfaces.",
                "years_experience": 7,
                "skills": ["Figma", "Design Systems", "React / TypeScript", "Prototyping", "User Research"],
                "portfolio_links": ["https://mayapatel.design", "https://dribbble.com/mayapatel"],
                "social_links": {"github": "https://github.com/mayapatel-ui", "linkedin": "https://linkedin.com/in/mayapatel"},
                "additional_notes": "Speaker at Config and Into Design Systems.",
                "status": CreativeApplicationStatus.UNDER_REVIEW,
                "review_notes": "Strong systems architecture background; verifying live Figma token library sample.",
            },
            {
                "first_name": "Gabriel",
                "last_name": "Santos",
                "email": "gabriel@cinemaverve.com",
                "phone": "+55 11 98821 4401",
                "location": "São Paulo, Brazil",
                "professional_headline": "Commercial Film Director & Colorist",
                "bio": "Award-winning commercial director and DaVinci Resolve senior colorist crafting emotionally resonant campaign films and sonic-visual narratives.",
                "years_experience": 9,
                "skills": ["Directing", "Cinematography", "DaVinci Resolve", "35mm Film", "Sound Design"],
                "portfolio_links": ["https://cinemaverve.com/reels"],
                "social_links": {"vimeo": "https://vimeo.com/gabrielsantos"},
                "additional_notes": "Cannes Lions Shortlist 2025 in Film Craft.",
                "status": CreativeApplicationStatus.PENDING,
            },
        ]
        for app_data in sample_creative_apps:
            existing_app = await db.scalar(
                select(CreativeApplication).where(CreativeApplication.email == app_data["email"])
            )
            if not existing_app:
                db.add(CreativeApplication(**app_data))
        logger.info("✅ Sample Creative vetting applications seeded.")

        # ─── Sample Client Applications (Org Vetting Queue) ──────────────────
        sample_client_apps = [
            {
                "first_name": "Claire",
                "last_name": "Dubois",
                "email": "claire@hyperionrobotics.ai",
                "phone": "+1 415 890 2310",
                "organisation_name": "Hyperion Robotics AI",
                "industry": "AI & Robotics",
                "website": "https://hyperionrobotics.ai",
                "company_size": "51-200",
                "location": "San Francisco, CA",
                "intended_use": "Hiring a fractional Creative Director, 3D industrial visualizers, and a senior UI/UX team for our upcoming humanoid product launch.",
                "additional_notes": "Series B backed ($65M). Immediate budget allocated for Q4 creative retainers.",
                "status": CreativeApplicationStatus.PENDING,
            },
            {
                "first_name": "Henri",
                "last_name": "Laurent",
                "email": "henri@maisonverre.paris",
                "phone": "+33 1 42 68 55 10",
                "organisation_name": "Maison Verre Paris",
                "industry": "Luxury & Editorial Fashion",
                "website": "https://maisonverre.paris",
                "company_size": "11-50",
                "location": "Paris, France",
                "intended_use": "Commissioning editorial photographers, set designers, and digital lookbook art directors for our Autumn/Winter campaign.",
                "additional_notes": "Looking for vetted European and international visual talent.",
                "status": CreativeApplicationStatus.UNDER_REVIEW,
                "review_notes": "Corporate domain and luxury house registry verified.",
            },
            {
                "first_name": "Devon",
                "last_name": "Brooks",
                "email": "devon@aetherlabs.vc",
                "phone": "+1 212 555 0194",
                "organisation_name": "Aether Venture Studio",
                "industry": "Venture Capital & Web3",
                "website": "https://aetherlabs.vc",
                "company_size": "11-50",
                "location": "New York, NY",
                "intended_use": "Recruiting founding brand & product designers across 6 portfolio startups.",
                "additional_notes": "Seeking ongoing access to Ze: Creatives' top 5% product and brand talent pool.",
                "status": CreativeApplicationStatus.PENDING,
            },
        ]
        for capp_data in sample_client_apps:
            existing_capp = await db.scalar(
                select(ClientApplication).where(ClientApplication.email == capp_data["email"])
            )
            if not existing_capp:
                db.add(ClientApplication(**capp_data))
        logger.info("✅ Sample Client organisation vetting applications seeded.")

        # ─── Sample Announcement & Audit Log ─────────────────────────────────
        admin_obj = await db.scalar(select(User).where(User.email == settings.ADMIN_SEED_EMAIL))
        if admin_obj:
            existing_ann = await db.scalar(select(Announcement))
            if not existing_ann:
                db.add(Announcement(
                    title="Ze: Creatives Governance v2.4 — Strict Portfolio & Enterprise Vetting Active",
                    content="All new creative and client applications now pass through our 4-point manual screening matrix before invitation tokens are issued.",
                    target_roles=["creative", "client"],
                    is_active=True,
                    created_by_id=admin_obj.id,
                ))
            existing_log = await db.scalar(select(AdminAuditLog))
            if not existing_log:
                db.add(AdminAuditLog(
                    admin_id=admin_obj.id,
                    action=AuditAction.SETTINGS_UPDATED,
                    target_resource_type="platform_governance",
                    target_resource_id="vetting_matrix_v2",
                    description="Activated strict role isolation and 4-point vetting matrix on Admin Command Center.",
                ))

        await db.commit()
        logger.info("🎉 Database seeding complete.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed())
