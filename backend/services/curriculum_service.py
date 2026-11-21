# backend/services/curriculum_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, distinct
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
    stmt = (
        select(
            models.Class,
            func.count(distinct(models.Subject.id)).label("subject_count"),
            func.count(distinct(models.Student.id)).label("student_count"),
        )
        .outerjoin(models.Subject, models.Subject.class_id == models.Class.id)
        .outerjoin(models.Student, models.Student.class_id == models.Class.id)
        .group_by(models.Class.id)
    )
    result = await db.execute(stmt)
    
    classes_with_counts = []
    for cls, subject_count, student_count in result.all():
        classes_with_counts.append({
            "id": cls.id,
            "organization_id": cls.organization_id,
            "name": cls.name,
            "subject_count": subject_count,
            "student_count": student_count,
        })
    return classes_with_counts

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