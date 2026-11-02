from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.deps import DBSession, AdminUser
from app.models import Skill

router = APIRouter()


class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    category_id: Optional[UUID] = None
    is_active: bool = True


class SkillResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    category_id: Optional[UUID] = None
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[SkillResponse])
async def list_skills(
    db: DBSession,
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
):
    query = select(Skill).where(Skill.is_active.is_(True))
    if category_id:
        query = query.where(Skill.category_id == category_id)
    if search:
        query = query.where(Skill.name.ilike(f"%{search}%"))
    query = query.order_by(Skill.name.asc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(payload: SkillCreate, db: DBSession, admin: AdminUser):
    existing = await db.execute(select(Skill).where(Skill.name.ilike(payload.name)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Skill already exists.")

    skill = Skill(**payload.model_dump())
    db.add(skill)
    await db.flush()
    await db.refresh(skill)
    return skill
