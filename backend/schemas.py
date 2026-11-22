# backend/schemas.py
from pydantic import BaseModel, UUID4
from datetime import date, datetime
from typing import Optional

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