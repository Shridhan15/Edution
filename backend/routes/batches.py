from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
import schemas
from services import batch_service

router = APIRouter(prefix="/api/batches", tags=["Batches"])

@router.post("", response_model=schemas.BatchResponse)
async def create_batch(batch_data: schemas.BatchCreate, db: AsyncSession = Depends(get_db)):
    return await batch_service.create_batch(db, batch_data)

@router.get("", response_model=List[schemas.BatchResponse])
async def get_batches(db: AsyncSession = Depends(get_db)):
    return await batch_service.get_batches(db)

@router.get("/{batch_id}", response_model=schemas.BatchDetailResponse)
async def get_batch_detail(batch_id: str, db: AsyncSession = Depends(get_db)):
    return await batch_service.get_batch_detail(db, batch_id)

@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_batch(batch_id: str, db: AsyncSession = Depends(get_db)):
    await batch_service.delete_batch(db, batch_id)

@router.post("/{batch_id}/students", response_model=schemas.BatchDetailResponse)
async def add_students(
    batch_id: str,
    payload: schemas.BatchStudentsAdd,
    db: AsyncSession = Depends(get_db),
):
    return await batch_service.add_students_to_batch(db, batch_id, payload.student_ids)

@router.delete("/{batch_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_student(batch_id: str, student_id: str, db: AsyncSession = Depends(get_db)):
    await batch_service.remove_student_from_batch(db, batch_id, student_id)