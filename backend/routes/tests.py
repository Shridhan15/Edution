from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

import schemas
from database import get_db
from services import test_service 

from services.material_service import query_material_chunks
router = APIRouter(prefix="/api/tests", tags=["Tests"])





@router.get("/batch/{batch_id}", response_model=List[schemas.TestSummaryResponse])
async def list_batch_tests(batch_id: UUID, db: AsyncSession = Depends(get_db)):
    return await test_service.list_batch_tests(db, batch_id)


@router.post("/batch/{batch_id}/generate", response_model=schemas.TestDetailResponse)
async def generate_test(
    batch_id: UUID,
    payload: schemas.TestGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    return await test_service.generate_test_draft(
        db, batch_id, payload, query_material_chunks
    )

@router.get("/{test_id}", response_model=schemas.TestDetailResponse)
async def get_test(test_id: UUID, db: AsyncSession = Depends(get_db)):
    return await test_service.get_test_detail(db, test_id)


@router.patch("/{test_id}/questions/{question_id}", response_model=schemas.TestQuestionResponse)
async def update_question(
    test_id: UUID,
    question_id: UUID,
    payload: schemas.TestQuestionUpdate,
    db: AsyncSession = Depends(get_db),
):
    return await test_service.update_question(db, test_id, question_id, payload)


@router.post("/{test_id}/questions/{question_id}/revise", response_model=schemas.TestQuestionResponse)
async def revise_question(
    test_id: UUID,
    question_id: UUID,
    payload: schemas.TestQuestionReviseRequest,
    db: AsyncSession = Depends(get_db),
):
    return await test_service.revise_question_with_ai(
        db, test_id, question_id, payload.instruction, query_material_chunks
    )

@router.delete("/{test_id}/questions/{question_id}")
async def delete_question(
    test_id: UUID,
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    await test_service.delete_question(db, test_id, question_id)
    return {"status": "deleted"}


@router.post("/{test_id}/publish", response_model=schemas.TestDetailResponse)
async def publish_test(test_id: UUID, db: AsyncSession = Depends(get_db)):
    return await test_service.publish_test(db, test_id)


@router.get("/{test_id}/results")
async def get_results(test_id: UUID, db: AsyncSession = Depends(get_db)):
    return await test_service.get_test_results(db, test_id)


@router.put("/{test_id}/results")
async def save_results(
    test_id: UUID,
    payload: schemas.BulkMarksUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    return await test_service.update_bulk_marks(db, test_id, payload)


@router.delete("/{test_id}")
async def delete_test(test_id: UUID, db: AsyncSession = Depends(get_db)):
    await test_service.delete_test(db, test_id)
    return {"status": "deleted"}