# backend/routes/students.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
import schemas
from services import student_service

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.post("/", response_model=schemas.StudentResponse)
async def create_student(student: schemas.StudentCreate, db: AsyncSession = Depends(get_db)):
    return await student_service.create_student(db, student)

@router.get("/", response_model=list[schemas.StudentResponse])
async def get_students(db: AsyncSession = Depends(get_db)):
    return await student_service.get_all_students(db)

@router.get("/{student_id}", response_model=schemas.StudentResponse)
async def get_student(student_id: str, db: AsyncSession = Depends(get_db)):
    return await student_service.get_student_by_id(db, student_id)