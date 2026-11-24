from datetime import date
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
import models
import schemas
from services.student_service import get_default_organization

async def mark_batch_attendance(db: AsyncSession, payload: schemas.AttendanceBulkCreate):
    org = await get_default_organization(db)

    # Verify batch exists
    batch_res = await db.execute(select(models.Batch).where(models.Batch.id == payload.batch_id))
    if not batch_res.scalars().first():
        raise HTTPException(status_code=404, detail="Batch not found")

    if not payload.records:
        return []

    rows = [
        {
            "organization_id": org.id,
            "batch_id": payload.batch_id,
            "student_id": rec.student_id,
            "date": payload.date,
            "status": rec.status,
            "remarks": rec.remarks,
        }
        for rec in payload.records
    ]

    stmt = pg_insert(models.Attendance).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["batch_id", "student_id", "date"],
        set_={
            "status": stmt.excluded.status,
            "remarks": stmt.excluded.remarks,
        },
    )

    await db.execute(stmt)
    await db.commit()

    return await get_batch_attendance(db, str(payload.batch_id), payload.date)


async def get_batch_attendance(db: AsyncSession, batch_id: str, target_date: date):
    stmt = (
        select(models.Attendance)
        .where(
            models.Attendance.batch_id == batch_id,
            models.Attendance.date == target_date,
        )
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_student_attendance(db: AsyncSession, student_id: str):
    stmt = (
        select(models.Attendance)
        .where(models.Attendance.student_id == student_id)
        .order_by(models.Attendance.date.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    total_days = len(records)
    present_days = sum(1 for r in records if r.status == "PRESENT")
    late_days = sum(1 for r in records if r.status == "LATE")
    absent_days = sum(1 for r in records if r.status == "ABSENT")

    # Counting PRESENT + LATE as attended
    attended = present_days + late_days
    percentage = round((attended / total_days) * 100, 1) if total_days > 0 else 0.0

    return {
        "total_days": total_days,
        "present_days": present_days,
        "absent_days": absent_days,
        "late_days": late_days,
        "attendance_percentage": percentage,
        "records": records,
    }