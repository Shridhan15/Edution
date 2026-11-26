import asyncio
import json
import logging
import os
import re
import time
import uuid
from collections import Counter
from typing import Optional

import pymupdf
from fastapi import HTTPException, UploadFile
from pinecone import Pinecone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from supabase import create_client, Client

import models
from database import AsyncSessionLocal
from services.llm_service import call_llm
from services.student_service import get_default_organization

log = logging.getLogger("material_service")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
STORAGE_BUCKET = "curriculum-materials"
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "edution")
PINECONE_NAMESPACE = "__default__"
PINECONE_TEXT_FIELD = "chunk_text"
PINECONE_BATCH_SIZE = 96

_supabase: Optional[Client] = None
_pinecone_index = None


def _get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env")
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


def _get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        if not PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY is missing in .env")
        pc = Pinecone(api_key=PINECONE_API_KEY)
        _pinecone_index = pc.index(PINECONE_INDEX_NAME)
    return _pinecone_index


# ==========================================
# PDF Processing Helpers (Run in Thread)
# ==========================================
def extract_raw_headings(doc: pymupdf.Document) -> list[str]:
    log.info("[STEP 2] Extracting heading candidates using PDF layout...")
    t0 = time.perf_counter()
    font_sizes, spans_data, repeated_lines = Counter(), [], Counter()
    numbered_heading = re.compile(r"^(?:\d+(?:\.\d+)*[.)]?|[IVXLC]+[.)]|[A-Z][.)])\s+\S", re.IGNORECASE)

    for page_num, page in enumerate(doc, start=1):
        page_dict, page_height = page.get_text("dict"), page.rect.height
        for block in page_dict.get("blocks", []):
            for line in block.get("lines", []):
                spans = line.get("spans", [])
                if not spans:
                    continue
                text = re.sub(r"\s+", " ", "".join(span["text"] for span in spans)).strip()
                if not text or len(text) < 3 or len(text) > 150 or text.isdigit():
                    continue
                bbox = line.get("bbox", (0, 0, 0, 0))
                y_position = (bbox[1] + bbox[3]) / 2
                if y_position < page_height * 0.035 or y_position > page_height * 0.965:
                    continue
                sizes = [round(span["size"], 1) for span in spans if span["text"].strip()]
                if not sizes:
                    continue
                max_size = max(sizes)
                is_bold = any(span.get("flags", 0) & 16 for span in spans)
                is_upper = text.isupper() and any(char.isalpha() for char in text)
                has_numbering = bool(numbered_heading.match(text))
                font_sizes[max_size] += len(text)
                normalized = text.lower().strip()
                repeated_lines[normalized] += 1
                spans_data.append({
                    "page": page_num,
                    "text": text,
                    "font_size": max_size,
                    "bold": is_bold,
                    "uppercase": is_upper,
                    "numbered": has_numbering,
                    "y_position": y_position,
                })

    if not font_sizes:
        log.warning("[STEP 2] No text candidates found.")
        return []

    body_size = font_sizes.most_common(1)[0][0]
    candidates, seen = [], set()

    for item in spans_data:
        text, size = item["text"], item["font_size"]
        normalized = text.lower().strip()
        if repeated_lines[normalized] >= 4:
            continue
        score = 0
        if size >= body_size + 2:
            score += 3
        elif size >= body_size + 1:
            score += 2
        elif size > body_size:
            score += 1
        if item["bold"]:
            score += 2
        if item["numbered"]:
            score += 3
        if item["uppercase"]:
            score += 1
        if text.endswith((".", ",", ";")):
            score -= 2
        if score < 2:
            continue
        unique_key = (item["page"], normalized)
        if unique_key in seen:
            continue
        seen.add(unique_key)
        candidates.append(
            f"[Page {item['page']}] [Font {size}pt] [Bold {item['bold']}] [Numbered {item['numbered']}] {text}"
        )

    log.info(f"[STEP 2] Extracted {len(candidates)} heading candidates in {time.perf_counter() - t0:.2f}s")
    return candidates


def _structure_headings(raw_headings: list[str], material_id: str) -> list[dict]:
    if not raw_headings:
        return []

    prompt = (
        "Clean this list of raw PDF heading candidates using their font size, bold, and numbering cues. "
        "Remove noise (standalone chapter numbers, running headers, 'EXERCISES', figure/table labels). "
        "Group subheadings under their parent main headings. Return ONLY valid JSON:\n"
        '{"topics": [{"title": "Main Heading", "page": 1, "subtopics": ["Subheading 1", "Subheading 2"]}]}\n\n'
        "Raw candidates:\n" + "\n".join(raw_headings)
    )

    raw_json = call_llm(
        source=f"material_service.structure_headings (material_id={material_id})",
        user_prompt=prompt,
        temperature=0.0,
        json_mode=True,
    )
    parsed = json.loads(raw_json)
    return parsed.get("topics", [])


def _chunk_pages(pages: list[dict], chunk_size: int = 1500, overlap: int = 200) -> list[dict]:
    chunks = []
    for p in pages:
        text = p["text"]
        if not text:
            continue
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append({"page_number": p["page_number"], "text": chunk_text})
            if end >= len(text):
                break
            start += chunk_size - overlap
    return chunks


def _run_ingestion_sync(
    pdf_bytes: bytes,
    material_id: str,
    organization_id: str,
    class_id: str,
    subject_id: str,
    chapter_id: str,
) -> tuple[int, list[dict]]:
    # 1. Extract text & headings with PyMuPDF
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    try:
        pages = [
            {"page_number": i, "text": page.get_text("text").strip()}
            for i, page in enumerate(doc, start=1)
        ]
        page_count = len(pages)
        raw_headings = extract_raw_headings(doc)
    finally:
        doc.close()

    chunks = _chunk_pages(pages)
    if not chunks:
        raise ValueError("No selectable text found in PDF (file may be scanned images).")

    # 2. Structure headings via centralized logged LLM
    topics = _structure_headings(raw_headings, material_id)

    # 3. Upsert chunks to Pinecone Documents API
    index = _get_pinecone_index()
    for batch_start in range(0, len(chunks), PINECONE_BATCH_SIZE):
        batch = chunks[batch_start : batch_start + PINECONE_BATCH_SIZE]
        documents = [
            {
                "_id": f"{material_id}_chunk_{batch_start + i}",
                PINECONE_TEXT_FIELD: chunk["text"],
                "organization_id": organization_id,
                "class_id": class_id,
                "subject_id": subject_id,
                "chapter_id": chapter_id,
                "material_id": material_id,
                "page_number": chunk["page_number"],
            }
            for i, chunk in enumerate(batch)
        ]
        index.documents.upsert(namespace=PINECONE_NAMESPACE, documents=documents)

    return page_count, topics


# ==========================================
# Background Worker (Own DB Session)
# ==========================================
async def process_material_background(
    material_id: uuid.UUID,
    pdf_bytes: bytes,
    organization_id: str,
    class_id: str,
    subject_id: str,
    chapter_id: str,
):
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(models.Material).where(models.Material.id == material_id))
        material = res.scalars().first()
        if not material:
            return

        try:
            page_count, topics = await asyncio.to_thread(
                _run_ingestion_sync,
                pdf_bytes,
                str(material_id),
                organization_id,
                class_id,
                subject_id,
                chapter_id,
            )
            material.page_count = page_count
            material.extracted_topics = topics
            material.processing_status = "READY"
            material.error_message = None
        except Exception as exc:
            log.exception(f"Material processing failed for {material_id}")
            material.processing_status = "FAILED"
            material.error_message = str(exc)[:500]

        await db.commit()


# ==========================================
# Public Service Operations
# ==========================================
async def upload_material(
    db: AsyncSession,
    chapter_id: uuid.UUID,
    file: UploadFile,
    title: Optional[str] = None,
) -> tuple[models.Material, bytes, dict]:
    if file.content_type != "application/pdf" and not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")
    if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="PDF exceeds the 20 MB size limit.")

    # Verify chapter & fetch parent subject/class IDs for Pinecone metadata
    chapter_res = await db.execute(
        select(models.Chapter, models.Subject)
        .join(models.Subject, models.Chapter.subject_id == models.Subject.id)
        .where(models.Chapter.id == chapter_id)
    )
    row = chapter_res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Chapter not found")
    chapter, subject = row

    org = await get_default_organization(db)
    material_id = uuid.uuid4()
    storage_path = f"{chapter_id}/{material_id}.pdf"

    # Upload raw PDF to Supabase Storage
    supabase = _get_supabase()
    await asyncio.to_thread(
        lambda: supabase.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf"},
        )
    )
    file_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)

    clean_title = (title or "").strip() or (file.filename or "Untitled.pdf").rsplit(".", 1)[0]
    material = models.Material(
        id=material_id,
        organization_id=org.id,
        chapter_id=chapter.id,
        title=clean_title,
        file_name=file.filename or f"{material_id}.pdf",
        file_url=file_url,
        file_size_bytes=len(pdf_bytes),
        processing_status="PROCESSING",
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    meta = {
        "organization_id": str(org.id),
        "class_id": str(subject.class_id),
        "subject_id": str(subject.id),
        "chapter_id": str(chapter.id),
    }
    return material, pdf_bytes, meta


async def get_chapter_materials(db: AsyncSession, chapter_id: uuid.UUID):
    stmt = (
        select(models.Material)
        .where(models.Material.chapter_id == chapter_id)
        .order_by(models.Material.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def delete_material(db: AsyncSession, material_id: uuid.UUID):
    res = await db.execute(select(models.Material).where(models.Material.id == material_id))
    material = res.scalars().first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    # 1. Wipe chunks from Pinecone
    try:
        index = _get_pinecone_index()
        await asyncio.to_thread(
            lambda: index.documents.delete(
                namespace=PINECONE_NAMESPACE,
                filter={"material_id": {"$eq": str(material_id)}},
            )
        )
    except Exception as exc:
        log.warning(f"Pinecone cleanup warning for {material_id}: {exc}")

    # 2. Remove raw PDF from Supabase Storage
    try:
        supabase = _get_supabase()
        storage_path = f"{material.chapter_id}/{material.id}.pdf"
        await asyncio.to_thread(
            lambda: supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        )
    except Exception as exc:
        log.warning(f"Supabase storage cleanup warning for {material_id}: {exc}")

    # 3. Delete PostgreSQL record
    await db.delete(material)
    await db.commit()
    return {"message": "Material deleted successfully"}