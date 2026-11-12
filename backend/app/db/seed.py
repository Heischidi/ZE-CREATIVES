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
    CreativeApplicationStatus, AuditAction, ApplicationStatus
)
from app.models import (
    User, CreativeCategory, Skill, SubscriptionPlan,
    CreativeProfile, CreativeProfileSkill, ClientProfile, Job,
    JobApplication, ApplicationStatusHistory,
    CreativeApplication, ClientApplication, PortfolioProject,
    Conversation, ConversationParticipant, Message,
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

                existing_elena_skill = await db.scalar(
                    select(CreativeProfileSkill).where(CreativeProfileSkill.profile_id == elena_profile.id)
                )
                if not existing_elena_skill:
                    for sk_name in ["Figma", "Design Systems", "Brand Architecture", "Typography", "Cinema 4D"]:
                        db.add(CreativeProfileSkill(profile_id=elena_profile.id, custom_skill=sk_name, proficiency_level=5))

        # ─── Seed Second Active Creative (Liam Takahashi) ───────────────────
        liam_user = await db.scalar(select(User).where(User.email == "liam@zecreatives.com"))
        if not liam_user:
            liam_user = User(
                email="liam@zecreatives.com",
                hashed_password=get_password_hash("CreativeZe2026!"),
                first_name="Liam",
                last_name="Takahashi",
                role=UserRole.CREATIVE,
                status=AccountStatus.ACTIVE,
                is_email_verified=True,
            )
            db.add(liam_user)
            await db.flush()

            liam_profile = CreativeProfile(
                user_id=liam_user.id,
                professional_headline="Principal 3D Motion Artist & Creative Technologist",
                bio="9+ years building procedural Houdini simulations, real-time Unreal Engine 5 visuals, and kinetic product reveal films for global hardware and automotive brands.",
                location="Tokyo, Japan (Remote)",
                country="Japan",
                years_experience=9,
                hourly_rate_min=110.0,
                hourly_rate_max=165.0,
                currency="USD",
                availability=AvailabilityStatus.AVAILABLE,
                is_public=True,
                onboarding_completed=True,
                onboarding_step=7,
                website_url="https://liamtakahashi.studio",
                behance_url="https://behance.net/liamtakahashi",
            )
            db.add(liam_profile)
            await db.flush()

            for sk_name in ["Houdini", "Cinema 4D", "Redshift", "Unreal Engine 5", "After Effects"]:
                db.add(CreativeProfileSkill(profile_id=liam_profile.id, custom_skill=sk_name, proficiency_level=5))

            db.add(
                PortfolioProject(
                    profile_id=liam_profile.id,
                    title="Kuroshio — Procedural 3D Launch Film & Shader System",
                    description="Houdini fluid and rigid-body simulation pipeline for a flagship luxury chronograph global launch.",
                    cover_image_url="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
                    project_url="https://liamtakahashi.studio/kuroshio",
                    tools_used=["Houdini", "Redshift", "Nuke"],
                    is_featured=True,
                    is_public=True,
                    sort_order=1,
                )
            )
            logger.info("✅ Second verified Creative seeded: liam@zecreatives.com")

        # ─── Ensure Client has Second Job, Applications & Conversation ──────
        client_user_obj = await db.scalar(select(User).where(User.email == "client@zecreatives.com"))
        if client_user_obj:
            client_prof = await db.scalar(select(ClientProfile).where(ClientProfile.user_id == client_user_obj.id))
            if client_prof:
                client_jobs = (await db.execute(select(Job).where(Job.client_id == client_prof.id))).scalars().all()
                motion_cat = await db.scalar(
                    select(CreativeCategory).where(CreativeCategory.slug == "animation-motion-graphics")
                )
                if len(client_jobs) < 2:
                    second_job = Job(
                        client_id=client_prof.id,
                        category_id=motion_cat.id if motion_cat else None,
                        title="Senior 3D Motion & Houdini Visualist",
                        description="We are looking for a master 3D motion director to craft hero product reveal sequences, procedural simulations, and kinetic brand identities for our flagship technology clients.",
                        responsibilities="Direct and execute 3D launch films; Build procedural setups in Houdini and Cinema 4D; Partner with sound designers and brand directors.",
                        requirements="6+ years in high-end motion studios; Deep mastery of Houdini, Cinema 4D, and Redshift/Octane; Strong reel demonstrating lighting and kinetic pacing.",
                        preferred_skills="Houdini, Cinema 4D, Redshift, Octane, Unreal Engine 5, After Effects",
                        location="Remote / New York, NY",
                        country="United States",
                        work_arrangement=WorkArrangement.REMOTE,
                        employment_type=EmploymentType.CONTRACT,
                        experience_level=ExperienceLevel.SENIOR,
                        salary_min=125000.0,
                        salary_max=155000.0,
                        currency="USD",
                        is_salary_disclosed=True,
                        status=JobStatus.ACTIVE,
                        is_featured=False,
                        views_count=184,
                        custom_questions=[
                            "Share a link to your primary 3D/motion showreel with timecodes.",
                            "Which render engines and simulation tools are in your daily pipeline?",
                        ],
                    )
                    db.add(second_job)
                    await db.flush()
                    client_jobs.append(second_job)

                # Seed sample JobApplications from Elena & Liam
                primary_job = client_jobs[0] if client_jobs else None
                secondary_job = client_jobs[1] if len(client_jobs) > 1 else primary_job
                elena_prof = await db.scalar(select(CreativeProfile).where(CreativeProfile.user_id == elena_user.id)) if elena_user else None
                liam_prof = await db.scalar(select(CreativeProfile).where(CreativeProfile.user_id == liam_user.id)) if liam_user else None

                if primary_job and elena_prof:
                    existing_ja1 = await db.scalar(
                        select(JobApplication).where(
                            JobApplication.job_id == primary_job.id,
                            JobApplication.creative_profile_id == elena_prof.id,
                        )
                    )
                    if not existing_ja1:
                        ja1 = JobApplication(
                            job_id=primary_job.id,
                            creative_profile_id=elena_prof.id,
                            cover_letter="I have spent the last 8 years leading multi-product design systems and kinetic brand architectures for high-growth ventures. My recent Aether OS and Vespera systems align directly with Apex's vision.",
                            custom_answers={
                                "Design System Scale": "Architected 420+ component multi-brand token library across web, iOS, and spatial computing.",
                                "Availability": "Available to start immediately for full-time or lead retainer.",
                            },
                            status=ApplicationStatus.SHORTLISTED,
                            client_notes="Exceptional typography and systems portfolio. Top candidate for the Lead role.",
                            is_viewed=True,
                        )
                        db.add(ja1)
                        primary_job.applications_count = (primary_job.applications_count or 0) + 1
                        primary_job.views_count = max(primary_job.views_count or 0, 312)

                if secondary_job and liam_prof:
                    existing_ja2 = await db.scalar(
                        select(JobApplication).where(
                            JobApplication.job_id == secondary_job.id,
                            JobApplication.creative_profile_id == liam_prof.id,
                        )
                    )
                    if not existing_ja2:
                        ja2 = JobApplication(
                            job_id=secondary_job.id,
                            creative_profile_id=liam_prof.id,
                            cover_letter="My Houdini + Redshift pipeline is built specifically for tactile luxury and hardware reveal films. Excited to bring procedural R&D to Apex Creative & Motion Studio.",
                            custom_answers={
                                "Showreel": "https://liamtakahashi.studio/kuroshio (00:15 - 01:40 procedural fluid & rigid body shots)",
                                "Pipeline": "Houdini 20.5, Cinema 4D, Redshift, Unreal Engine 5.4, Nuke",
                            },
                            status=ApplicationStatus.SUBMITTED,
                            is_viewed=False,
                        )
                        db.add(ja2)
                        secondary_job.applications_count = (secondary_job.applications_count or 0) + 1

                # Seed sample Conversation between Marcus (Client) and Elena (Creative)
                if elena_user:
                    existing_conv = await db.scalar(select(Conversation))
                    if not existing_conv:
                        conv = Conversation(
                            subject="Shortlisted: Lead Product & Brand Systems Designer",
                        )
                        db.add(conv)
                        await db.flush()
                        db.add_all([
                            ConversationParticipant(conversation_id=conv.id, user_id=client_user_obj.id),
                            ConversationParticipant(conversation_id=conv.id, user_id=elena_user.id),
                        ])
                        db.add_all([
                            Message(
                                conversation_id=conv.id,
                                sender_id=client_user_obj.id,
                                content="Hi Elena — we loved your Aether OS and Vespera case studies. We have shortlisted you for the Lead Product & Brand Systems Designer role at Apex. Are you free Thursday for a 30-minute portfolio walkthrough?",
                            ),
                            Message(
                                conversation_id=conv.id,
                                sender_id=elena_user.id,
                                content="Thank you Marcus! Thursday afternoon works great for me. I will bring the live Figma token architecture and 3D motion guidelines to walk through with the team.",
                            ),
                        ])
                        logger.info("✅ Sample Client <-> Creative conversation seeded.")

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
