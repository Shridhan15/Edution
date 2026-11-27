# backend/schemas.py
from pydantic import BaseModel, UUID4
from datetime import date, datetime, time
from typing import List, Literal, Optional

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