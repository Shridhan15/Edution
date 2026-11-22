# backend/routes/students.py

from sqlalchemy.ext.asyncio import AsyncSession 
from fastapi import APIRouter, Depends, UploadFile, File, status
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

@router.patch("/{student_id}", response_model=schemas.StudentResponse)
async def update_student(
    student_id: str,
    student_update: schemas.StudentUpdate,
    db: AsyncSession = Depends(get_db),
):
    return await student_service.update_student(db, student_id, student_update)




@router.post("/{student_id}/photo", response_model=schemas.StudentResponse)
async def upload_photo(
    student_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    return await student_service.update_student_photo(db, student_id, file)

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(student_id: str, db: AsyncSession = Depends(get_db)):
    await student_service.delete_student(db, student_id)