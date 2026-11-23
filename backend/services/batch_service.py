from fastapi import HTTPException
from sqlalchemy import func, distinct, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
import models
import schemas
from services.student_service import get_default_organization

async def create_batch(db: AsyncSession, batch_data: schemas.BatchCreate):
    org = await get_default_organization(db)
    new_batch = models.Batch(**batch_data.model_dump(), organization_id=org.id)
    db.add(new_batch)
    await db.commit()
    await db.refresh(new_batch)
    return {
        "id": new_batch.id,
        "organization_id": new_batch.organization_id,
        "class_id": new_batch.class_id,
        "name": new_batch.name,
        "start_time": new_batch.start_time,
        "end_time": new_batch.end_time,
        "days_of_week": new_batch.days_of_week or [],
        "student_count": 0,
    }

async def get_batches(db: AsyncSession):
    stmt = (
        select(
            models.Batch,
            func.count(distinct(models.BatchStudent.student_id)).label("student_count"),
        )
        .outerjoin(models.BatchStudent, models.BatchStudent.batch_id == models.Batch.id)
        .group_by(models.Batch.id)
        .order_by(models.Batch.start_time)
    )
    result = await db.execute(stmt)

    batches = []
    for batch, student_count in result.all():
        batches.append({
            "id": batch.id,
            "organization_id": batch.organization_id,
            "class_id": batch.class_id,
            "name": batch.name,
            "start_time": batch.start_time,
            "end_time": batch.end_time,
            "days_of_week": batch.days_of_week or [],
            "student_count": student_count,
        })
    return batches

async def get_batch_detail(db: AsyncSession, batch_id: str):
    result = await db.execute(select(models.Batch).where(models.Batch.id == batch_id))
    batch = result.scalars().first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    students_stmt = (
        select(models.Student)
        .join(models.BatchStudent, models.BatchStudent.student_id == models.Student.id)
        .where(models.BatchStudent.batch_id == batch_id)
        .order_by(models.Student.full_name)
    )
    students_result = await db.execute(students_stmt)
    students = students_result.scalars().all()

    return {
        "id": batch.id,
        "organization_id": batch.organization_id,
        "class_id": batch.class_id,
        "name": batch.name,
        "start_time": batch.start_time,
        "end_time": batch.end_time,
        "days_of_week": batch.days_of_week or [],
        "student_count": len(students),
        "students": students,
    }

async def delete_batch(db: AsyncSession, batch_id: str):
    result = await db.execute(select(models.Batch).where(models.Batch.id == batch_id))
    batch = result.scalars().first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    await db.delete(batch)
    await db.commit()

async def add_students_to_batch(db: AsyncSession, batch_id: str, student_ids: list):
    # Verify batch exists
    result = await db.execute(select(models.Batch).where(models.Batch.id == batch_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Batch not found")

    if student_ids:
        rows = [{"batch_id": batch_id, "student_id": sid} for sid in student_ids]
        stmt = pg_insert(models.BatchStudent).values(rows).on_conflict_do_nothing()
        await db.execute(stmt)
        await db.commit()

    return await get_batch_detail(db, batch_id)

async def remove_student_from_batch(db: AsyncSession, batch_id: str, student_id: str):
    stmt = delete(models.BatchStudent).where(
        models.BatchStudent.batch_id == batch_id,
        models.BatchStudent.student_id == student_id,
    )
    await db.execute(stmt)
    await db.commit()