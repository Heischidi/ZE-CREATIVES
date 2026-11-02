from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.deps import DBSession, AdminUser
from app.models import CreativeCategory

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


@router.get("/", response_model=List[CategoryResponse])
async def list_categories(db: DBSession, include_inactive: bool = False):
    """List all categories (active by default)."""
    query = select(CreativeCategory).order_by(CreativeCategory.sort_order.asc(), CreativeCategory.name.asc())
    if not include_inactive:
        query = query.where(CreativeCategory.is_active.is_(True))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: UUID, db: DBSession):
    result = await db.execute(select(CreativeCategory).where(CreativeCategory.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return cat


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(payload: CategoryCreate, db: DBSession, admin: AdminUser):
    # Check uniqueness
    existing = await db.execute(
        select(CreativeCategory).where(
            (CreativeCategory.name == payload.name) | (CreativeCategory.slug == payload.slug)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name or slug already exists.")

    cat = CreativeCategory(**payload.model_dump())
    db.add(cat)
    await db.flush()
    await db.refresh(cat)
    return cat


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: UUID, payload: CategoryUpdate, db: DBSession, admin: AdminUser):
    result = await db.execute(select(CreativeCategory).where(CreativeCategory.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(cat, field, val)

    await db.flush()
    await db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: UUID, db: DBSession, admin: AdminUser):
    result = await db.execute(select(CreativeCategory).where(CreativeCategory.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    await db.delete(cat)
    await db.flush()
    return None
