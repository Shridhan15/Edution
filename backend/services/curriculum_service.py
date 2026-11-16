# backend/services/curriculum_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import models
import schemas
from services.student_service import get_default_organization

# --- CLASSES ---
async def create_class(db: AsyncSession, class_data: schemas.ClassCreate):
    org = await get_default_organization(db)
    new_class = models.Class(**class_data.model_dump(), organization_id=org.id)
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    return new_class

async def get_classes(db: AsyncSession):
    result = await db.execute(select(models.Class))
    return result.scalars().all()

# --- SUBJECTS ---
async def create_subject(db: AsyncSession, subject_data: schemas.SubjectCreate):
    new_subject = models.Subject(**subject_data.model_dump())
    db.add(new_subject)
    await db.commit()
    await db.refresh(new_subject)
    return new_subject

async def get_subjects_by_class(db: AsyncSession, class_id: str):
    result = await db.execute(select(models.Subject).where(models.Subject.class_id == class_id))
    return result.scalars().all()

# --- CHAPTERS ---
async def create_chapter(db: AsyncSession, chapter_data: schemas.ChapterCreate):
    new_chapter = models.Chapter(**chapter_data.model_dump())
    db.add(new_chapter)
    await db.commit()
    await db.refresh(new_chapter)
    return new_chapter

async def get_chapters_by_subject(db: AsyncSession, subject_id: str):
    result = await db.execute(
        select(models.Chapter)
        .where(models.Chapter.subject_id == subject_id)
        .order_by(models.Chapter.chapter_number)
    )
    return result.scalars().all()