# backend/schemas.py
from pydantic import BaseModel, UUID4, Field, ConfigDict
from datetime import date, datetime, time
from typing import List, Literal, Optional
from uuid import UUID

class StudentBase(BaseModel):
    full_name: str
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    class_id: Optional[UUID4] = None
    status: str = "ACTIVE"

# Update the StudentCreate class to look like this:
class StudentCreate(StudentBase):
    pass # No organization_id required anymore!

class StudentResponse(StudentBase):
    id: UUID4
    organization_id: UUID4
    joining_date: date
    photo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True # Tells Pydantic to read data even if it is not a dict (like SQLAlchemy models)





# --- CLASSES ---
class ClassBase(BaseModel):
    name: str

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: UUID4
    organization_id: UUID4
    
    class Config:
        from_attributes = True

# --- SUBJECTS ---
class SubjectBase(BaseModel):
    name: str
    class_id: UUID4

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: UUID4
    
    class Config:
        from_attributes = True

# --- CHAPTERS ---
class ChapterBase(BaseModel):
    name: str
    chapter_number: Optional[int] = None
    subject_id: UUID4

class ChapterCreate(ChapterBase):
    pass

class ChapterResponse(ChapterBase):
    id: UUID4
    
    class Config:
        from_attributes = True

class ClassResponse(ClassBase):
    id: UUID4
    organization_id: UUID4
    subject_count: int = 0
    student_count: int = 0

    class Config:
        from_attributes = True


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    class_id: Optional[UUID4] = None
    status: Optional[str] = None




# --- BATCHES ---
class BatchBase(BaseModel):
    name: str
    class_id: Optional[UUID4] = None
    start_time: time
    end_time: time
    days_of_week: List[str] = []

class BatchCreate(BatchBase):
    pass

class BatchResponse(BatchBase):
    id: UUID4
    organization_id: UUID4
    student_count: int = 0

    class Config:
        from_attributes = True

class BatchDetailResponse(BatchResponse):
    students: List[StudentResponse] = []

class BatchStudentsAdd(BaseModel):
    student_ids: List[UUID4]



class BatchSummary(BaseModel):
    id: UUID4
    name: str
    start_time: time
    end_time: time

    class Config:
        from_attributes = True

class StudentDetailResponse(StudentResponse):
    batches: List[BatchSummary] = []






class AttendanceRecordInput(BaseModel):
    student_id: UUID4
    status: Literal["PRESENT", "ABSENT", "LATE"]
    remarks: Optional[str] = None

class AttendanceBulkCreate(BaseModel):
    batch_id: UUID4
    date: date
    records: List[AttendanceRecordInput]

class AttendanceResponse(BaseModel):
    id: UUID4
    batch_id: UUID4
    student_id: UUID4
    date: date
    status: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class StudentAttendanceSummary(BaseModel):
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    attendance_percentage: float
    records: List[AttendanceResponse]



# --- MATERIALS ---
class MaterialTopic(BaseModel):
    title: str
    page: Optional[int] = None
    subtopics: List[str] = []

class MaterialResponse(BaseModel):
    id: UUID4
    chapter_id: UUID4
    title: str
    file_name: str
    file_url: str
    file_size_bytes: Optional[int] = None
    page_count: Optional[int] = None
    processing_status: str
    extracted_topics: List[MaterialTopic] = []
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True



# --- BATCH MATERIALS ---
class BatchMaterialAssignRequest(BaseModel):
    material_ids: List[UUID4]


class BatchMaterialResponse(BaseModel):
    id: UUID4  # material_id
    chapter_id: UUID4
    chapter_name: str
    chapter_number: Optional[int] = None
    subject_id: UUID4
    subject_name: str
    class_id: UUID4
    class_name: str
    title: str
    file_name: str
    file_url: str
    file_size_bytes: Optional[int] = None
    page_count: Optional[int] = None
    processing_status: str
    extracted_topics: List[MaterialTopic] = []
    assigned_at: Optional[datetime] = None

    class Config:
        from_attributes = True


QuestionType = Literal["MCQ", "SHORT_ANSWER", "LONG_ANSWER", "FILL_IN_BLANK", "TRUE_FALSE"]
DifficultyLevel = Literal["EASY", "MEDIUM", "HARD", "MIXED"]
TestStatus = Literal["DRAFT", "PUBLISHED", "GRADED"]
ResultStatus = Literal["PENDING", "GRADED", "ABSENT"]

class MaterialTopicSelection(BaseModel):
    material_id: UUID
    selected_topics: List[str] = Field(default_factory=list)  # Empty = All Topics


class SectionBlueprint(BaseModel):
    section: str = Field(..., examples=["Section A"])
    question_type: QuestionType
    count: int = Field(..., ge=1, le=25)
    marks_per_question: float = Field(..., gt=0, le=20)


class TestGenerateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    test_date: Optional[date] = None
    duration_minutes: int = Field(default=45, ge=5, le=300)
    difficulty: DifficultyLevel = "MEDIUM"
    instructions: Optional[str] = None
    additional_notes: Optional[str] = None
    materials: List[MaterialTopicSelection] = Field(..., min_length=1)
    sections: List[SectionBlueprint] = Field(..., min_length=1)


# --- Question Edit & AI Revision Inputs ---

class MarkingSchemeStep(BaseModel):
    point: str
    marks: float = Field(..., gt=0)


class TestQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    marking_scheme: Optional[List[MarkingSchemeStep]] = None
    marks: Optional[float] = Field(default=None, gt=0)
    topic_tag: Optional[str] = None


class TestQuestionReviseRequest(BaseModel):
    instruction: str = Field(..., min_length=3, max_length=500)


# --- Marks Entry Inputs ---

class StudentMarkEntry(BaseModel):
    student_id: UUID
    marks_obtained: Optional[float] = Field(default=None, ge=0)
    status: ResultStatus = "GRADED"
    remarks: Optional[str] = None


class BulkMarksUpdateRequest(BaseModel):
    results: List[StudentMarkEntry]


# --- API Responses ---

class TestQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    test_id: UUID
    section: str
    question_order: int
    question_type: QuestionType
    question_text: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    marking_scheme: Optional[List[MarkingSchemeStep]] = None
    marks: float
    topic_tag: Optional[str] = None
    source_material_id: Optional[UUID] = None


class TestSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    batch_id: UUID
    title: str
    test_date: Optional[date] = None
    duration_minutes: int
    total_marks: float
    difficulty: DifficultyLevel
    status: TestStatus
    question_count: int = 0
    graded_count: int = 0
    total_students: int = 0
    created_at: datetime


class TestDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    batch_id: UUID
    title: str
    test_date: Optional[date] = None
    duration_minutes: int
    total_marks: float
    difficulty: DifficultyLevel
    instructions: Optional[str] = None
    source_material_ids: List[UUID] = Field(default_factory=list)
    blueprint: dict = Field(default_factory=dict)
    status: TestStatus
    questions: List[TestQuestionResponse] = Field(default_factory=list)
    created_at: datetime