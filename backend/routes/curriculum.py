# backend/routes/curriculum.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
import schemas
from services import curriculum_service

router = APIRouter(prefix="/api/curriculum", tags=["Curriculum"])

# Classes
@router.post("/classes", response_model=schemas.ClassResponse)
async def create_class(class_data: schemas.ClassCreate, db: AsyncSession = Depends(get_db)):
    return await curriculum_service.create_class(db, class_data)

@router.get("/classes", response_model=List[schemas.ClassResponse])
async def get_classes(db: AsyncSession = Depends(get_db)):
    return await curriculum_service.get_classes(db)

# Subjects
@router.post("/subjects", response_model=schemas.SubjectResponse)
async def create_subject(subject_data: schemas.SubjectCreate, db: AsyncSession = Depends(get_db)):
    return await curriculum_service.create_subject(db, subject_data)

@router.get("/classes/{class_id}/subjects", response_model=List[schemas.SubjectResponse])
async def get_subjects(class_id: str, db: AsyncSession = Depends(get_db)):
    return await curriculum_service.get_subjects_by_class(db, class_id)

# Chapters
@router.post("/chapters", response_model=schemas.ChapterResponse)
async def create_chapter(chapter_data: schemas.ChapterCreate, db: AsyncSession = Depends(get_db)):
    return await curriculum_service.create_chapter(db, chapter_data)

@router.get("/subjects/{subject_id}/chapters", response_model=List[schemas.ChapterResponse])
async def get_chapters(subject_id: str, db: AsyncSession = Depends(get_db)):
    return await curriculum_service.get_chapters_by_subject(db, subject_id)