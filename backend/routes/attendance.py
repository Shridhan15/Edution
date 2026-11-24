from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
import schemas
from services import attendance_service

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

@router.post("/bulk", response_model=List[schemas.AttendanceResponse])
async def mark_attendance(
    payload: schemas.AttendanceBulkCreate,
    db: AsyncSession = Depends(get_db),
):
    return await attendance_service.mark_batch_attendance(db, payload)

@router.get("/batch/{batch_id}", response_model=List[schemas.AttendanceResponse])
async def get_batch_attendance(
    batch_id: str,
    target_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    return await attendance_service.get_batch_attendance(
        db, batch_id, target_date or date.today()
    )

@router.get("/student/{student_id}", response_model=schemas.StudentAttendanceSummary)
async def get_student_attendance(
    student_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await attendance_service.get_student_attendance(db, student_id)