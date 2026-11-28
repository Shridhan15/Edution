import asyncio
import json
from typing import List, Optional
from pydantic import BaseModel, Field

from services.llm_service import call_llm

# Token budget guards (~4 chars ≈ 1 token)
MAX_CONTEXT_CHARS_FULL_PAPER = 16000   # ~4,000 tokens
MAX_CONTEXT_CHARS_SINGLE_REV = 4800    # ~1,200 tokens


# ---------------------------------------------------------------------------
# 1. Strict Pydantic Schemas for Groq Structured Outputs
# ---------------------------------------------------------------------------

class AIMarkingStep(BaseModel):
    point: str = Field(..., description="Grading criterion / expected step")
    marks: float = Field(..., description="Marks awarded for this step")


class AIGeneratedQuestion(BaseModel):
    section: str = Field(..., description="Section label, e.g., 'Section A'")
    question_order: int = Field(..., description="1-based order within the section")
    question_type: str = Field(
        ..., description="One of: MCQ, SHORT_ANSWER, LONG_ANSWER, FILL_IN_BLANK, TRUE_FALSE"
    )
    question_text: str = Field(..., description="The exam question")
    options: Optional[List[str]] = Field(
        None, description="Exactly 4 options for MCQ, otherwise null"
    )
    correct_answer: str = Field(..., description="Correct option or concise model answer")
    explanation: Optional[str] = Field(
        None, description="1-line rationale (especially for MCQ / True-False)"
    )
    marking_scheme: Optional[List[AIMarkingStep]] = Field(
        None, description="Step-wise rubric for SHORT_ANSWER and LONG_ANSWER; null for objective"
    )
    marks: float = Field(..., description="Total marks for this question")
    topic_tag: str = Field(..., description="Specific chapter/topic from the provided context")
    source_material_id: Optional[str] = Field(
        None, description="The material_id UUID from the context tag"
    )


class AIGeneratedPaper(BaseModel):
    questions: List[AIGeneratedQuestion]


# ---------------------------------------------------------------------------
# 2. Helpers: Strict Schema & Token-Budgeted Context Builder
# ---------------------------------------------------------------------------

def _strict_schema(name: str, model_cls: type[BaseModel]) -> dict:
    schema = model_cls.model_json_schema()

    def _enforce_strict(node):
        if isinstance(node, dict):
            if node.get("type") == "object" and "properties" in node:
                node["additionalProperties"] = False
                node["required"] = list(node["properties"].keys())
            for v in node.values():
                _enforce_strict(v)
        elif isinstance(node, list):
            for item in node:
                _enforce_strict(item)

    _enforce_strict(schema)
    return {"name": name, "strict": True, "schema": schema}


def build_context_from_chunks(chunks: List[dict], max_chars: int) -> str:
    """Deduplicates Pinecone chunks and caps context size to control input tokens."""
    seen_ids = set()
    blocks = []
    total_chars = 0

    for chunk in chunks:
        cid = chunk.get("id")
        if cid and cid in seen_ids:
            continue
        if cid:
            seen_ids.add(cid)

        header = (
            f"[material_id={chunk.get('material_id', '')} | "
            f"source={chunk.get('title', 'Material')} | "
            f"topic={chunk.get('topic', 'General')}]"
        )
        block = f"{header}\n{chunk.get('text', '').strip()}\n"

        if total_chars + len(block) > max_chars:
            break

        blocks.append(block)
        total_chars += len(block)

    return "\n---\n".join(blocks)


# ---------------------------------------------------------------------------
# 3. System Prompt & Generation Calls
# ---------------------------------------------------------------------------

EXAM_SETTER_SYSTEM_PROMPT = """You are an experienced school and coaching-center exam setter.
Create an offline, printable question paper and teacher's answer key strictly grounded in <study_context>.

Rules:
1. Grounding: Use ONLY facts, formulas, and concepts present in <study_context>. Do not introduce out-of-syllabus content.
2. Exact Counts: Match the exact section names, question types, question counts, and marks specified in <blueprint>.
3. Zero Overlap: Never test the same fact or problem in both an objective question (MCQ/True-False) and a subjective question.
4. MCQs: Provide exactly 4 distinct options with plausible distractors. Avoid "All of the above". Include a 1-line explanation.
5. Subjective (SHORT_ANSWER / LONG_ANSWER): Provide a clear model answer AND a step-wise marking_scheme whose step marks sum EXACTLY to the question's total marks.
6. Attribution: Copy the exact `material_id` UUID from the chunk header into `source_material_id` and set a concise `topic_tag`.
"""


async def generate_test_questions(
    *,
    batch_id: str,
    class_name: str,
    difficulty: str,
    sections: List[dict],
    chunks: List[dict],
    additional_notes: Optional[str] = None,
) -> AIGeneratedPaper:
    context_text = build_context_from_chunks(chunks, MAX_CONTEXT_CHARS_FULL_PAPER)

    section_lines = [
        f"- {s['section']}: {s['count']} × {s['question_type']} ({s['marks_per_question']} marks each)"
        for s in sections
    ]

    user_prompt = f"""<blueprint>
Class Level: {class_name}
Overall Difficulty: {difficulty}
Sections:
{chr(10).join(section_lines)}
</blueprint>

<teacher_instructions>
{additional_notes or "None"}
</teacher_instructions>

<study_context>
{context_text}
</study_context>"""

    raw_json = await asyncio.to_thread(
        call_llm,
        source=f"test_ai_service.generate_test_paper (batch_id={batch_id})",
        system_prompt=EXAM_SETTER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        response_schema=_strict_schema("generated_test_paper", AIGeneratedPaper),
    )
    return AIGeneratedPaper.model_validate_json(raw_json)


async def revise_single_question(
    *,
    test_id: str,
    question_id: str,
    current_question: dict,
    teacher_instruction: str,
    other_questions_summary: List[str],
    chunks: List[dict],
) -> AIGeneratedQuestion:
    context_text = build_context_from_chunks(chunks, MAX_CONTEXT_CHARS_SINGLE_REV)
    existing_block = "\n".join(f"- {q}" for q in other_questions_summary[:25])

    user_prompt = f"""Revise ONLY the target question below according to the teacher's instruction.
Keep the same section, question_order, question_type, and marks unless the teacher explicitly asks to change them.
Do NOT duplicate any question listed in <other_questions>.

<target_question>
{json.dumps(current_question, indent=2)}
</target_question>

<teacher_instruction>
{teacher_instruction}
</teacher_instruction>

<other_questions>
{existing_block or "None"}
</other_questions>

<study_context>
{context_text}
</study_context>"""

    raw_json = await asyncio.to_thread(
        call_llm,
        source=f"test_ai_service.revise_question (test_id={test_id}, question_id={question_id})",
        system_prompt=EXAM_SETTER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.35,
        response_schema=_strict_schema("revised_test_question", AIGeneratedQuestion),
    )
    return AIGeneratedQuestion.model_validate_json(raw_json)