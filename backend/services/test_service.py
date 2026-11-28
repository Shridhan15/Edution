from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import models
import schemas
from services import test_ai_service


# ---------------------------------------------------------------------------
# 1. Pinecone Retrieval Adapter
# ---------------------------------------------------------------------------

async def _retrieve_chunks_for_materials(
    db: AsyncSession,
    material_selections: List[schemas.MaterialTopicSelection],
    query_pinecone_fn,
) -> List[dict]:
    """
    Retrieves chunks in balanced patches:
    - Focused mode (selected_topics): queries each chosen topic/subtopic (top_k=3).
    - All Topics mode: queries every outline topic across the chapter (top_k=2).
    - Interleaves results round-robin so no single material or topic starves the token budget.
    """
    material_ids = [m.material_id for m in material_selections]
    stmt = select(models.Material).where(models.Material.id.in_(material_ids))
    materials_by_id = {m.id: m for m in (await db.execute(stmt)).scalars().all()}

    # Each bucket holds the ranked chunks for one (material, topic) pair
    topic_buckets: List[List[dict]] = []

    for sel in material_selections:
        mat = materials_by_id.get(sel.material_id)
        if not mat:
            continue

        if sel.selected_topics:
            # Teacher explicitly picked topics/subtopics from the outline
            topics = sel.selected_topics
            top_k = 3
        else:
            # "All Topics": cover the entire outline evenly
            raw_topics = mat.extracted_topics or []
            topics = [
                t.get("title") if isinstance(t, dict) else str(t)
                for t in raw_topics
            ] or [mat.title]
            top_k = 2

        for topic in topics:
            matches = await query_pinecone_fn(
                query_text=f"{mat.title} - {topic}",
                material_id=str(mat.id),
                top_k=top_k,
            )
            bucket = [
                {
                    "id": match.get("id"),
                    "material_id": str(mat.id),
                    "title": mat.title,
                    "topic": topic,
                    "text": match.get("text", ""),
                }
                for match in matches
            ]
            if bucket:
                topic_buckets.append(bucket)

    # Round-robin interleave: 1st chunk from every bucket, then 2nd, then 3rd...
    interleaved: List[dict] = []
    max_depth = max((len(b) for b in topic_buckets), default=0)
    for depth in range(max_depth):
        for bucket in topic_buckets:
            if depth < len(bucket):
                interleaved.append(bucket[depth])

    return interleaved



# ---------------------------------------------------------------------------
# 2. Generate Test Draft (RAG + Groq)
# ---------------------------------------------------------------------------

async def generate_test_draft(
    db: AsyncSession,
    batch_id: UUID,
    payload: schemas.TestGenerateRequest,
    query_pinecone_fn,
) -> models.Test:
    batch = await db.get(models.Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    class_name = "General"
    if getattr(batch, "class_id", None):
        cls = await db.get(models.Class, batch.class_id)
        if cls:
            class_name = cls.name

    chunks = await _retrieve_chunks_for_materials(db, payload.materials, query_pinecone_fn)
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No indexed content found in Pinecone for the selected materials.",
        )

    ai_paper = await test_ai_service.generate_test_questions(
        batch_id=str(batch_id),
        class_name=class_name,
        difficulty=payload.difficulty,
        sections=[s.model_dump() for s in payload.sections],
        chunks=chunks,
        additional_notes=payload.additional_notes,
    )

    valid_material_ids = {str(m.material_id) for m in payload.materials}
    total_marks = sum(q.marks for q in ai_paper.questions)

    test = models.Test(
        batch_id=batch_id,
        title=payload.title,
        test_date=payload.test_date,
        duration_minutes=payload.duration_minutes,
        total_marks=total_marks,
        difficulty=payload.difficulty,
        instructions=payload.instructions,
        source_material_ids=[m.material_id for m in payload.materials],
        blueprint=payload.model_dump(mode="json"),
        status="DRAFT",
    )
    db.add(test)
    await db.flush()

    for q in ai_paper.questions:
        src_mat_id = (
            UUID(q.source_material_id)
            if q.source_material_id in valid_material_ids
            else payload.materials[0].material_id
        )
        db.add(
            models.TestQuestion(
                test_id=test.id,
                section=q.section,
                question_order=q.question_order,
                question_type=q.question_type,
                question_text=q.question_text,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                marking_scheme=(
                    [step.model_dump() for step in q.marking_scheme]
                    if q.marking_scheme
                    else None
                ),
                marks=q.marks,
                topic_tag=q.topic_tag,
                source_material_id=src_mat_id,
            )
        )

    await db.commit()
    return await get_test_detail(db, test.id)


# ---------------------------------------------------------------------------
# 3. Read Tests (Batch List & Full Paper Detail)
# ---------------------------------------------------------------------------

async def list_batch_tests(db: AsyncSession, batch_id: UUID) -> List[dict]:
    stmt = (
        select(models.Test)
        .where(models.Test.batch_id == batch_id)
        .options(selectinload(models.Test.questions), selectinload(models.Test.results))
        .order_by(models.Test.created_at.desc())
    )
    tests = (await db.execute(stmt)).scalars().all()

    summaries = []
    for t in tests:
        total_students = len(t.results)
        graded_count = sum(1 for r in t.results if r.status in ("GRADED", "ABSENT"))
        summaries.append(
            {
                "id": t.id,
                "batch_id": t.batch_id,
                "title": t.title,
                "test_date": t.test_date,
                "duration_minutes": t.duration_minutes,
                "total_marks": float(t.total_marks),
                "difficulty": t.difficulty,
                "status": t.status,
                "question_count": len(t.questions),
                "graded_count": graded_count,
                "total_students": total_students,
                "created_at": t.created_at,
            }
        )
    return summaries


async def get_test_detail(db: AsyncSession, test_id: UUID) -> models.Test:
    stmt = (
        select(models.Test)
        .where(models.Test.id == test_id)
        .options(selectinload(models.Test.questions))
    )
    test = (await db.execute(stmt)).scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test


# ---------------------------------------------------------------------------
# 4. Edit, Delete, or AI-Revise a Single Question
# ---------------------------------------------------------------------------

async def _recalculate_total_marks(db: AsyncSession, test_id: UUID) -> None:
    total = (
        await db.execute(
            select(func.coalesce(func.sum(models.TestQuestion.marks), 0)).where(
                models.TestQuestion.test_id == test_id
            )
        )
    ).scalar_one()
    test = await db.get(models.Test, test_id)
    if test:
        test.total_marks = total


async def update_question(
    db: AsyncSession,
    test_id: UUID,
    question_id: UUID,
    payload: schemas.TestQuestionUpdate,
) -> models.TestQuestion:
    q = await db.get(models.TestQuestion, question_id)
    if not q or q.test_id != test_id:
        raise HTTPException(status_code=404, detail="Question not found")

    updates = payload.model_dump(exclude_unset=True)
    if "marking_scheme" in updates and updates["marking_scheme"] is not None:
        updates["marking_scheme"] = [
            s.model_dump() if hasattr(s, "model_dump") else s
            for s in updates["marking_scheme"]
        ]

    for field, value in updates.items():
        setattr(q, field, value)

    await db.flush()
    if "marks" in updates:
        await _recalculate_total_marks(db, test_id)

    await db.commit()
    await db.refresh(q)
    return q


async def delete_question(db: AsyncSession, test_id: UUID, question_id: UUID) -> None:
    q = await db.get(models.TestQuestion, question_id)
    if not q or q.test_id != test_id:
        raise HTTPException(status_code=404, detail="Question not found")

    await db.delete(q)
    await db.flush()
    await _recalculate_total_marks(db, test_id)
    await db.commit()


async def revise_question_with_ai(
    db: AsyncSession,
    test_id: UUID,
    question_id: UUID,
    instruction: str,
    query_pinecone_fn,
) -> models.TestQuestion:
    test = await get_test_detail(db, test_id)
    target = next((q for q in test.questions if q.id == question_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Question not found")

    mat_id = target.source_material_id or (
        test.source_material_ids[0] if test.source_material_ids else None
    )
    chunks = []
    if mat_id:
        mat = await db.get(models.Material, mat_id)
        query_text = f"{target.topic_tag or ''} {instruction}".strip()
        matches = await query_pinecone_fn(
            query_text=query_text,
            material_id=str(mat_id),
            top_k=4,
        )
        chunks = [
            {
                "id": m.get("id"),
                "material_id": str(mat_id),
                "title": mat.title if mat else "Material",
                "topic": target.topic_tag or "General",
                "text": m.get("text", ""),
            }
            for m in matches
        ]

    other_questions = [
        f"[{q.section} Q{q.question_order}] {q.question_text}"
        for q in test.questions
        if q.id != question_id
    ]

    current_q_dict = {
        "section": target.section,
        "question_order": target.question_order,
        "question_type": target.question_type,
        "question_text": target.question_text,
        "options": target.options,
        "correct_answer": target.correct_answer,
        "explanation": target.explanation,
        "marking_scheme": target.marking_scheme,
        "marks": float(target.marks),
        "topic_tag": target.topic_tag,
    }

    revised = await test_ai_service.revise_single_question(
        test_id=str(test_id),
        question_id=str(question_id),
        current_question=current_q_dict,
        teacher_instruction=instruction,
        other_questions_summary=other_questions,
        chunks=chunks,
    )

    target.question_text = revised.question_text
    target.options = revised.options
    target.correct_answer = revised.correct_answer
    target.explanation = revised.explanation
    target.marking_scheme = (
        [step.model_dump() for step in revised.marking_scheme]
        if revised.marking_scheme
        else None
    )
    target.marks = revised.marks
    target.topic_tag = revised.topic_tag

    await db.flush()
    await _recalculate_total_marks(db, test_id)
    await db.commit()
    await db.refresh(target)
    return target


# ---------------------------------------------------------------------------
# 5. Publish Test (Snapshot Roster) & Bulk Marks Entry
# ---------------------------------------------------------------------------

async def publish_test(db: AsyncSession, test_id: UUID) -> models.Test:
    test = await get_test_detail(db, test_id)
    if test.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Test is already published")
    if not test.questions:
        raise HTTPException(status_code=400, detail="Cannot publish a test with no questions")

    # Fetch currently enrolled students for this batch
    # (Adjust `models.BatchStudent` if your enrollment model has a different name)
    stmt = select(models.BatchStudent.student_id).where(
        models.BatchStudent.batch_id == test.batch_id
    )
    student_ids = (await db.execute(stmt)).scalars().all()

    for sid in student_ids:
        db.add(
            models.TestResult(
                test_id=test.id,
                student_id=sid,
                marks_obtained=None,
                status="PENDING",
            )
        )

    test.status = "PUBLISHED"
    await db.commit()
    return await get_test_detail(db, test.id)


async def get_test_results(db: AsyncSession, test_id: UUID) -> List[dict]:
    stmt = (
        select(models.TestResult, models.Student)
        .join(models.Student, models.TestResult.student_id == models.Student.id)
        .where(models.TestResult.test_id == test_id)
        .order_by(models.Student.name.asc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        {
            "id": r.id,
            "test_id": r.test_id,
            "student_id": r.student_id,
            "student_name": s.name,
            "marks_obtained": float(r.marks_obtained) if r.marks_obtained is not None else None,
            "status": r.status,
            "remarks": r.remarks,
            "graded_at": r.graded_at,
        }
        for r, s in rows
    ]


async def update_bulk_marks(
    db: AsyncSession,
    test_id: UUID,
    payload: schemas.BulkMarksUpdateRequest,
) -> List[dict]:
    test = await db.get(models.Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    stmt = select(models.TestResult).where(models.TestResult.test_id == test_id)
    existing = {r.student_id: r for r in (await db.execute(stmt)).scalars().all()}
    now = datetime.now(timezone.utc)

    for entry in payload.results:
        row = existing.get(entry.student_id)
        if not row:
            continue
        row.status = entry.status
        row.marks_obtained = None if entry.status != "GRADED" else entry.marks_obtained
        row.remarks = entry.remarks
        row.graded_at = now if entry.status in ("GRADED", "ABSENT") else None

    await db.flush()

    # Flip test to GRADED once no PENDING rows remain
    all_done = all(r.status in ("GRADED", "ABSENT") for r in existing.values())
    if existing and all_done:
        test.status = "GRADED"

    await db.commit()
    return await get_test_results(db, test_id)


async def delete_test(db: AsyncSession, test_id: UUID) -> None:
    test = await db.get(models.Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    await db.delete(test)
    await db.commit()