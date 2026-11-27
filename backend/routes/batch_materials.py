from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
import schemas
from services import batch_material_service

router = APIRouter(prefix="/api/batches", tags=["Batch Materials"])


@router.get(
    "/{batch_id}/materials",
    response_model=List[schemas.BatchMaterialResponse],
)
async def list_batch_materials(
    batch_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await batch_material_service.get_batch_materials(db, batch_id)


@router.get(
    "/{batch_id}/available-materials",
    response_model=List[schemas.BatchMaterialResponse],
)


@router.get(
    "/ready-materials",
    response_model=List[schemas.BatchMaterialResponse],
)
async def list_all_ready_materials(
    db: AsyncSession = Depends(get_db),
):
    return await batch_material_service.get_all_ready_materials(db)

@router.post(
    "/{batch_id}/materials",
    response_model=List[schemas.BatchMaterialResponse],
)
async def assign_batch_materials(
    batch_id: UUID,
    payload: schemas.BatchMaterialAssignRequest,
    db: AsyncSession = Depends(get_db),
):
    return await batch_material_service.assign_materials_to_batch(
        db, batch_id, payload.material_ids
    )


@router.delete("/{batch_id}/materials/{material_id}")
async def remove_batch_material(
    batch_id: UUID,
    material_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await batch_material_service.unassign_material_from_batch(
        db, batch_id, material_id
    )