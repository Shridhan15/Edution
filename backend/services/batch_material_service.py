from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

import models


def _serialize_material_row(material, chapter, subject, cls, assigned_at=None) -> dict:
    return {
        "id": material.id,
        "chapter_id": chapter.id,
        "chapter_name": chapter.name,
        "chapter_number": getattr(chapter, "chapter_number", None),
        "subject_id": subject.id,
        "subject_name": subject.name,
        "class_id": cls.id,
        "class_name": cls.name,
        "title": material.title,
        "file_name": material.file_name,
        "file_url": material.file_url,
        "file_size_bytes": material.file_size_bytes,
        "page_count": material.page_count,
        "processing_status": material.processing_status,
        "extracted_topics": material.extracted_topics or [],
        "assigned_at": assigned_at,
    }


async def get_batch_materials(db: AsyncSession, batch_id: UUID) -> list[dict]:
    stmt = (
        select(
            models.Material,
            models.Chapter,
            models.Subject,
            models.Class,
            models.BatchMaterial.assigned_at,
        )
        .join(models.BatchMaterial, models.BatchMaterial.material_id == models.Material.id)
        .join(models.Chapter, models.Material.chapter_id == models.Chapter.id)
        .join(models.Subject, models.Chapter.subject_id == models.Subject.id)
        .join(models.Class, models.Subject.class_id == models.Class.id)
        .where(models.BatchMaterial.batch_id == batch_id)
        .order_by(models.BatchMaterial.assigned_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [_serialize_material_row(m, ch, sub, cls, at) for m, ch, sub, cls, at in rows]


async def get_all_ready_materials(db: AsyncSession) -> list[dict]:
    stmt = (
        select(models.Material, models.Chapter, models.Subject, models.Class)
        .join(models.Chapter, models.Material.chapter_id == models.Chapter.id)
        .join(models.Subject, models.Chapter.subject_id == models.Subject.id)
        .join(models.Class, models.Subject.class_id == models.Class.id)
        .where(models.Material.processing_status == "READY")
        .order_by(
            models.Class.name.asc(),
            models.Subject.name.asc(),
            models.Chapter.chapter_number.asc(),
            models.Material.created_at.desc(),
        )
    )
    rows = (await db.execute(stmt)).all()
    return [_serialize_material_row(m, ch, sub, cls) for m, ch, sub, cls in rows]



async def assign_materials_to_batch(
    db: AsyncSession,
    batch_id: UUID,
    material_ids: list[UUID],
) -> list[dict]:
    if not material_ids:
        return await get_batch_materials(db, batch_id)

    batch_res = await db.execute(select(models.Batch).where(models.Batch.id == batch_id))
    if not batch_res.scalars().first():
        raise HTTPException(status_code=404, detail="Batch not found")

    values = [{"batch_id": batch_id, "material_id": mid} for mid in set(material_ids)]
    stmt = (
        pg_insert(models.BatchMaterial)
        .values(values)
        .on_conflict_do_nothing(index_elements=["batch_id", "material_id"])
    )
    await db.execute(stmt)
    await db.commit()

    return await get_batch_materials(db, batch_id)


async def unassign_material_from_batch(
    db: AsyncSession,
    batch_id: UUID,
    material_id: UUID,
) -> dict:
    stmt = (
        delete(models.BatchMaterial)
        .where(
            models.BatchMaterial.batch_id == batch_id,
            models.BatchMaterial.material_id == material_id,
        )
    )
    result = await db.execute(stmt)
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Material assignment not found")
    return {"message": "Material unassigned from batch"}