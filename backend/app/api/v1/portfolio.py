from uuid import UUID
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.deps import DBSession, CreativeUser
from app.core.enums import MediaType
from app.models import PortfolioProject, PortfolioMedia, CreativeProfile

router = APIRouter()


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    cover_image_url: Optional[str] = None
    project_url: Optional[str] = None
    video_url: Optional[str] = None
    tools_used: Optional[list[str]] = None
    is_featured: bool = False
    is_public: bool = True


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    cover_image_url: Optional[str] = None
    project_url: Optional[str] = None
    video_url: Optional[str] = None
    tools_used: Optional[list[str]] = None
    is_featured: Optional[bool] = None
    is_public: Optional[bool] = None


class MediaCreate(BaseModel):
    media_type: MediaType
    url: str
    caption: Optional[str] = None
    filename: Optional[str] = None
    sort_order: int = 0


@router.get("/")
async def list_my_projects(db: DBSession, current_user: CreativeUser):
    prof_res = await db.execute(select(CreativeProfile.id).where(CreativeProfile.user_id == current_user.id))
    profile_id = prof_res.scalar_one_or_none()
    if not profile_id:
        return []

    res = await db.execute(
        select(PortfolioProject)
        .where(PortfolioProject.profile_id == profile_id)
        .options(selectinload(PortfolioProject.media), selectinload(PortfolioProject.category))
        .order_by(PortfolioProject.sort_order.asc(), PortfolioProject.created_at.desc())
    )
    projects = res.scalars().all()
    return [
        {
            "id": str(p.id),
            "title": p.title,
            "description": p.description,
            "category_id": str(p.category_id) if p.category_id else None,
            "category_name": p.category.name if p.category else None,
            "cover_image_url": p.cover_image_url,
            "project_url": p.project_url,
            "video_url": p.video_url,
            "tools_used": p.tools_used or [],
            "is_featured": p.is_featured,
            "is_public": p.is_public,
            "media": [
                {
                    "id": str(m.id),
                    "media_type": m.media_type.value if hasattr(m.media_type, "value") else str(m.media_type),
                    "url": m.url,
                    "caption": m.caption,
                }
                for m in p.media
            ],
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, db: DBSession, current_user: CreativeUser):
    prof_res = await db.execute(select(CreativeProfile).where(CreativeProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        profile = CreativeProfile(user_id=current_user.id)
        db.add(profile)
        await db.flush()

    project = PortfolioProject(profile_id=profile.id, **payload.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return {"message": "Project created.", "id": str(project.id)}


@router.patch("/{project_id}")
async def update_project(project_id: UUID, payload: ProjectUpdate, db: DBSession, current_user: CreativeUser):
    prof_res = await db.execute(select(CreativeProfile.id).where(CreativeProfile.user_id == current_user.id))
    profile_id = prof_res.scalar_one_or_none()
    if not profile_id:
        raise HTTPException(status_code=404, detail="Profile not found.")

    res = await db.execute(
        select(PortfolioProject).where(
            PortfolioProject.id == project_id, PortfolioProject.profile_id == profile_id
        )
    )
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, val)

    await db.flush()
    return {"message": "Project updated successfully."}


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: UUID, db: DBSession, current_user: CreativeUser):
    prof_res = await db.execute(select(CreativeProfile.id).where(CreativeProfile.user_id == current_user.id))
    profile_id = prof_res.scalar_one_or_none()
    if not profile_id:
        raise HTTPException(status_code=404, detail="Profile not found.")

    res = await db.execute(
        select(PortfolioProject).where(
            PortfolioProject.id == project_id, PortfolioProject.profile_id == profile_id
        )
    )
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    await db.delete(project)
    await db.flush()
    return None


@router.post("/{project_id}/media", status_code=status.HTTP_201_CREATED)
async def add_project_media(project_id: UUID, payload: MediaCreate, db: DBSession, current_user: CreativeUser):
    prof_res = await db.execute(select(CreativeProfile.id).where(CreativeProfile.user_id == current_user.id))
    profile_id = prof_res.scalar_one_or_none()
    if not profile_id:
        raise HTTPException(status_code=404, detail="Profile not found.")

    res = await db.execute(
        select(PortfolioProject).where(
            PortfolioProject.id == project_id, PortfolioProject.profile_id == profile_id
        )
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found.")

    media = PortfolioMedia(project_id=project_id, **payload.model_dump())
    db.add(media)
    await db.flush()
    return {"message": "Media added.", "id": str(media.id)}
