from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
import schemas
from services import material_service

router = APIRouter(prefix="/api/curriculum", tags=["Materials"])


@router.post(
    "/chapters/{chapter_id}/materials",
    response_model=schemas.MaterialResponse,
)
async def upload_chapter_material(
    chapter_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    material, pdf_bytes, meta = await material_service.upload_material(
        db, chapter_id, file, title
    )
    background_tasks.add_task(
        material_service.process_material_background,
        material.id,
        pdf_bytes,
        meta["organization_id"],
        meta["class_id"],
        meta["subject_id"],
        meta["chapter_id"],
    )
    return material


@router.get(
    "/chapters/{chapter_id}/materials",
    response_model=List[schemas.MaterialResponse],
)
async def list_chapter_materials(
    chapter_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await material_service.get_chapter_materials(db, chapter_id)


@router.delete("/materials/{material_id}")
async def delete_material(
    material_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await material_service.delete_material(db, material_id)