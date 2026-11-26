
import json
import logging
import os
import re
import sys
import time
import uuid
from collections import Counter

import pymupdf
from dotenv import load_dotenv
from groq import Groq
from pinecone import Pinecone


# ==========================================
# CONFIGURATION
# ==========================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)

log = logging.getLogger("material_pipeline")

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "edution")
NAMESPACE = "__default__"

TEXT_FIELD = "chunk_text"

BATCH_SIZE = 96
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200

LLM_MODEL = "openai/gpt-oss-120b"


# ==========================================
# STEP 1: PDF TEXT EXTRACTION
# ==========================================

def extract_pdf_pages(
    pdf_path: str
) -> tuple[pymupdf.Document, list[dict]]:

    log.info(f"[STEP 1] Opening PDF: {pdf_path}")

    t0 = time.perf_counter()

    doc = pymupdf.open(pdf_path)

    pages = []
    empty_pages = 0
    total_chars = 0

    for i, page in enumerate(doc, start=1):

        text = page.get_text("text").strip()

        total_chars += len(text)

        if len(text) < 30:
            empty_pages += 1

        pages.append({
            "page_number": i,
            "text": text
        })

    log.info(
        f"[STEP 1] Done in {time.perf_counter() - t0:.2f}s | "
        f"Pages: {len(pages)} | "
        f"Total chars: {total_chars} | "
        f"Low-text pages: {empty_pages}"
    )

    return doc, pages


# ==========================================
# STEP 2: HEADING EXTRACTION
# ==========================================

def extract_raw_headings(doc: pymupdf.Document) -> list[str]:

    log.info("[STEP 2] Extracting heading candidates using PDF layout...")

    t0 = time.perf_counter()

    font_sizes = Counter()
    spans_data = []
    repeated_lines = Counter()

    # Common heading numbering:
    # 12.1, 12.1.1, 1., 1.2 etc.

    numbered_heading = re.compile(
        r"^(?:"
        r"\d+(?:\.\d+)*[.)]?"
        r"|[IVXLC]+[.)]"
        r"|[A-Z][.)]"
        r")\s+\S",
        re.IGNORECASE
    )

    for page_num, page in enumerate(doc, start=1):

        page_dict = page.get_text("dict")
        page_height = page.rect.height

        for block in page_dict.get("blocks", []):

            for line in block.get("lines", []):

                spans = line.get("spans", [])

                if not spans:
                    continue

                raw_text = "".join(
                    span["text"] for span in spans
                )

                text = re.sub(
                    r"\s+", " ", raw_text
                ).strip()

                if not text:
                    continue

                if len(text) < 3 or len(text) > 150:
                    continue

                if text.isdigit():
                    continue

                # Ignore likely page headers and footers.
                bbox = line.get("bbox", (0, 0, 0, 0))
                y_position = (bbox[1] + bbox[3]) / 2

                if (
                    y_position < page_height * 0.035
                    or y_position > page_height * 0.965
                ):
                    continue

                # Extract layout information.
                sizes = [
                    round(span["size"], 1)
                    for span in spans
                    if span["text"].strip()
                ]

                if not sizes:
                    continue

                max_size = max(sizes)

                is_bold = any(
                    span.get("flags", 0) & 16
                    for span in spans
                )

                is_upper = (
                    text.isupper()
                    and any(char.isalpha() for char in text)
                )

                has_numbering = bool(
                    numbered_heading.match(text)
                )

                # Body font statistics.
                font_sizes[max_size] += len(text)

                # Track recurring text across pages.
                normalized = text.lower().strip()

                repeated_lines[normalized] += 1

                spans_data.append({
                    "page": page_num,
                    "text": text,
                    "font_size": max_size,
                    "bold": is_bold,
                    "uppercase": is_upper,
                    "numbered": has_numbering,
                    "y_position": y_position
                })

    if not font_sizes:
        log.warning("[STEP 2] No text candidates found.")
        return []

    # Estimate the body font size.
    body_size = font_sizes.most_common(1)[0][0]

    log.info(
        f"[STEP 2] Estimated body font size: {body_size}pt"
    )

    candidates = []

    seen = set()

    for item in spans_data:

        text = item["text"]
        size = item["font_size"]

        # Ignore recurring headers and footers.
        normalized = text.lower().strip()

        if repeated_lines[normalized] >= 4:
            continue

        # Score each heading using multiple signals.
        score = 0

        # Font size.
        if size >= body_size + 2:
            score += 3
        elif size >= body_size + 1:
            score += 2
        elif size > body_size:
            score += 1

        # Bold formatting.
        if item["bold"]:
            score += 2

        # Numbered heading.
        if item["numbered"]:
            score += 3

        # Uppercase formatting.
        if item["uppercase"]:
            score += 1

        # Ignore obvious body sentences.
        if text.endswith((".", ",", ";")):
            score -= 2

        # Candidate threshold.
        if score < 2:
            continue

        # Avoid duplicate candidates.
        unique_key = (
            item["page"],
            normalized
        )

        if unique_key in seen:
            continue

        seen.add(unique_key)

        candidates.append(
            f"[Page {item['page']}] "
            f"[Font {size}pt] "
            f"[Bold {item['bold']}] "
            f"[Numbered {item['numbered']}] "
            f"{text}"
        )

    log.info(
        f"[STEP 2] Extracted {len(candidates)} "
        f"heading candidates in "
        f"{time.perf_counter() - t0:.2f}s"
    )

    for candidate in candidates:
        log.debug(candidate)

    return candidates


# ==========================================
# STEP 2B: STRUCTURE HEADINGS USING GROQ
# ==========================================


def structure_headings_with_llm(
    groq_client: Groq,
    raw_headings: list[str]
) -> list[dict]:

    if not raw_headings:
        return []

    log.info("[STEP 2b] Structuring headings using Groq...")

    prompt = """
You are an expert educational textbook structure extractor.

Your task is to reconstruct the actual chapter hierarchy
from PDF heading candidates.

IMPORTANT RULES:

1. Use only the supplied heading candidates.
2. Do not invent headings or subheadings.
3. Preserve original heading wording.
4. Preserve the original page number.
5. Identify chapter titles, main headings and subheadings.
6. Use numbering patterns such as 12.1 and 12.1.1
   as strong hierarchy signals.
7. Use font size and bold formatting as supporting signals.
8. Do not treat every uppercase heading as a chapter title.
9. Ignore running headers, page numbers and figure captions.
10. If hierarchy is uncertain, prefer a simpler structure.
11. Do not create duplicate headings.
12. Preserve the order in which headings appear.

Return ONLY valid JSON in this format:

{
    "topics": [
        {
            "title": "Ecosystem",
            "page": 1,
            "subtopics": [
                {
                    "title": "Ecosystem - Structure and Function",
                    "page": 2,
                    "subtopics": [
                        {
                            "title": "Components of an Ecosystem",
                            "page": 2,
                            "subtopics": []
                        }
                    ]
                }
            ]
        }
    ]
}

If no reliable headings are available, return:

{
    "topics": []
}

PDF HEADING CANDIDATES:

"""

    prompt += "\n".join(raw_headings)

    response = groq_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={
            "type": "json_object"
        },
        temperature=0
    )

    parsed = json.loads(
        response.choices[0].message.content
    )

    topics = parsed.get("topics", [])

    log.info(
        f"[STEP 2b] Structured into "
        f"{len(topics)} main topics."
    )

    return topics

# ==========================================
# DISPLAY EXTRACTED HEADINGS
# ==========================================


def display_headings(topics: list[dict]):

    print("\n" + "=" * 60)
    print("EXTRACTED CHAPTER OUTLINE")
    print("=" * 60)

    def print_topic(topic, level=0):

        indent = "    " * level

        title = topic.get("title", "Untitled")
        page = topic.get("page")

        page_str = f" (p.{page})" if page else ""

        print(f"{indent}- {title}{page_str}")

        for subtopic in topic.get("subtopics", []):

            if isinstance(subtopic, dict):
                print_topic(subtopic, level + 1)
            else:
                print(f"{indent}    - {subtopic}")

    for topic in topics:
        print_topic(topic)

    print("=" * 60 + "\n")


# ==========================================
# STEP 3: PAGE-AWARE OVERLAPPING CHUNKING
# ==========================================

def chunk_pages(
    pages: list[dict],
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP
) -> list[dict]:

    log.info(
        f"[STEP 3] Chunking text "
        f"(size={chunk_size}, overlap={overlap})..."
    )

    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError(
            "overlap must be >= 0 and smaller than chunk_size"
        )

    chunks = []

    for page in pages:

        text = page["text"]

        if not text:
            continue

        start = 0

        while start < len(text):

            end = start + chunk_size

            chunk_text = text[start:end].strip()

            if chunk_text:

                chunks.append({
                    "page_number": page["page_number"],
                    "text": chunk_text
                })

            if end >= len(text):
                break

            start += chunk_size - overlap

    log.info(
        f"[STEP 3] Created {len(chunks)} chunks."
    )

    return chunks


# ==========================================
# STEP 4: PINECONE DOCUMENTS API UPSERT
# ==========================================

def upsert_documents(
    index,
    chunks: list[dict],
    material_id: str,
    chapter_id: str
) -> int:

    log.info(
        f"[STEP 4] Upserting {len(chunks)} chunks "
        f"via Documents API..."
    )

    t0 = time.perf_counter()

    for batch_start in range(
        0, len(chunks), BATCH_SIZE
    ):

        batch = chunks[
            batch_start:batch_start + BATCH_SIZE
        ]

        documents = []

        for i, chunk in enumerate(batch):

            document = {
                "_id": (
                    f"{material_id}_chunk_"
                    f"{batch_start + i}"
                ),

                TEXT_FIELD: chunk["text"],

                "material_id": material_id,

                "chapter_id": chapter_id,

                "page_number": chunk["page_number"]
            }

            documents.append(document)

        index.documents.upsert(
            namespace=NAMESPACE,
            documents=documents
        )

        log.info(
            f"[STEP 4] Upserted batch "
            f"{batch_start + 1}-"
            f"{batch_start + len(batch)}"
        )

    log.info(
        f"[STEP 4] All {len(chunks)} documents "
        f"upserted in {time.perf_counter() - t0:.2f}s."
    )

    return len(chunks)


# ==========================================
# STEP 5: SEMANTIC SEARCH + GROUNDED Q&A
# ==========================================

def ask_question(
    index,
    groq_client: Groq | None,
    query: str,
    material_id: str,
    top_k: int = 4
):

    log.info(
        "[STEP 5] Waiting 8s for Pinecone indexing..."
    )

    time.sleep(8)

    log.info(
        f'[STEP 5] Searching Pinecone for: "{query}"'
    )

    t0 = time.perf_counter()

    results = index.documents.search(

        namespace=NAMESPACE,

        top_k=top_k,

        score_by=[
            {
                "type": "embed",
                "fields": [TEXT_FIELD],
                "query": query
            }
        ],

        filter={
            "material_id": {
                "$eq": material_id
            }
        },

        include_fields=[
            TEXT_FIELD,
            "page_number"
        ]
    )

    matches = results.matches

    log.info(
        f"[STEP 5] Retrieved {len(matches)} chunks "
        f"in {time.perf_counter() - t0:.2f}s"
    )

    context_blocks = []

    for rank, match in enumerate(matches, start=1):

        text = getattr(
            match,
            TEXT_FIELD,
            ""
        ) or ""

        page = int(
            getattr(match, "page_number", 0)
        )

        snippet = text[:140].replace("\n", " ")

        log.info(
            f'   #{rank} | Score: {match.score:.4f} '
            f'| Page {page} | "{snippet}..."'
        )

        context_blocks.append(
            f"[Page {page}]\n{text}"
        )

    if not context_blocks:

        log.warning(
            "[STEP 5] No relevant chunks found."
        )

        print("\nNo relevant information found in this material.")

        return

    if not groq_client:

        log.warning(
            "GROQ_API_KEY not set. "
            "Skipping LLM answer generation."
        )

        return

    # STEP 5B: GROUNDED ANSWER GENERATION

    log.info(
        "[STEP 5b] Generating grounded answer via Groq..."
    )

    t1 = time.perf_counter()

    context = "\n\n---\n\n".join(
        context_blocks
    )

    system_prompt = """
You are an intelligent tuition assistant.

Your task is to answer student questions using the
provided textbook excerpts.

Rules:

1. Answer using ONLY the provided context.
2. Do not introduce outside information.
3. Explain concepts in simple, student-friendly English.
4. Organize answers with headings and bullet points
   when appropriate.
5. Cite the relevant textbook page numbers.
6. If the answer is not available in the context,
   clearly say that the provided material does not
   contain enough information.
7. Never invent facts or page numbers.
"""

    response = groq_client.chat.completions.create(

        model=LLM_MODEL,

        messages=[

            {
                "role": "system",
                "content": system_prompt
            },

            {
                "role": "user",
                "content": (
                    f"TEXTBOOK CONTEXT:\n\n"
                    f"{context}\n\n"
                    f"STUDENT QUESTION:\n{query}"
                )
            }

        ],

        temperature=0.2
    )

    answer = response.choices[0].message.content

    log.info(
        f"[STEP 5b] Answer generated in "
        f"{time.perf_counter() - t1:.2f}s."
    )

    print("\n" + "=" * 60)

    print(f"QUESTION: {query}")

    print("=" * 60)

    print(answer)

    print("=" * 60 + "\n")


# ==========================================
# STEP 6: CLEANUP VIA METADATA FILTER
# ==========================================

def cleanup_documents(
    index,
    material_id: str
):

    log.info(
        f"[STEP 6] Cleaning up test documents "
        f"(material_id={material_id})..."
    )

    index.documents.delete(

        namespace=NAMESPACE,

        filter={
            "material_id": {
                "$eq": material_id
            }
        }
    )

    log.info(
        "[STEP 6] Cleanup request completed."
    )


# ==========================================
# MAIN PIPELINE
# ==========================================

def main():

    # Validate command-line arguments

    if len(sys.argv) < 2:

        print(
            'Usage: python test_material_pipeline.py '
            '<path_to_pdf> ["question to ask"]'
        )

        sys.exit(1)

    pdf_path = sys.argv[1]

    query = (
        sys.argv[2]
        if len(sys.argv) > 2
        else (
            "Explain the ecosystem, its components, "
            "and how energy flows through it."
        )
    )

    # Validate PDF

    if not os.path.isfile(pdf_path):

        log.error(
            f"PDF file not found: {pdf_path}"
        )

        sys.exit(1)

    # Validate API keys

    if not PINECONE_API_KEY:

        log.error(
            "PINECONE_API_KEY is missing in .env"
        )

        sys.exit(1)

    if not GROQ_API_KEY:

        log.error(
            "GROQ_API_KEY is missing in .env"
        )

        sys.exit(1)

    # Generate test identifiers

    material_id = (
        f"test_mat_{uuid.uuid4().hex[:8]}"
    )

    chapter_id = "test_chap_001"

    log.info(
        f"=== Starting Complete Material Pipeline "
        f"(material_id={material_id}) ==="
    )

    # Initialize clients

    try:

        pc = Pinecone(
            api_key=PINECONE_API_KEY
        )

        groq_client = Groq(
            api_key=GROQ_API_KEY
        )

        index = pc.index(INDEX_NAME)

    except Exception:

        log.exception(
            "Failed to initialize API clients."
        )

        sys.exit(1)

    # STEP 1: Extract PDF text and headings

    try:

        doc, pages = extract_pdf_pages(
            pdf_path
        )

        try:

            raw_headings = extract_raw_headings(
                doc
            )

        finally:

            doc.close()

    except Exception:

        log.exception(
            "PDF extraction failed."
        )

        sys.exit(1)

    # STEP 2: Structure headings

    try:

        topics = structure_headings_with_llm(
            groq_client,
            raw_headings
        )

        display_headings(topics)

    except Exception:

        log.exception(
            "Heading structuring failed."
        )

        sys.exit(1)

    # STEP 3: Chunk PDF pages

    chunks = chunk_pages(pages)

    if not chunks:

        log.error(
            "No text chunks extracted. Aborting."
        )

        sys.exit(1)

    # STEP 4: Upsert and STEP 5: Search/Q&A

    upsert_started = False

    try:

        upsert_started = True

        upsert_documents(
            index,
            chunks,
            material_id,
            chapter_id
        )

        ask_question(
            index,
            groq_client,
            query,
            material_id
        )

    except Exception:

        log.exception(
            "Material pipeline failed."
        )

        raise

    finally:

        # Cleanup only this test material

        if upsert_started:

            try:

                cleanup_documents(
                    index,
                    material_id
                )

            except Exception:

                log.exception(
                    "Cleanup failed. "
                    "Test documents may remain in Pinecone."
                )

    log.info(
        "=== Complete Pipeline Test Finished ==="
    )


if __name__ == "__main__":

    main()
