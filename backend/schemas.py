# backend/schemas.py
from pydantic import BaseModel, UUID4
from datetime import date, datetime
from typing import Optional

class StudentBase(BaseModel):
    full_name: str
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    status: str = "ACTIVE"

# Update the StudentCreate class to look like this:
class StudentCreate(StudentBase):
    pass # No organization_id required anymore!

class StudentResponse(StudentBase):
    id: UUID4
    organization_id: UUID4
    joining_date: date
    created_at: datetime

    class Config:
        from_attributes = True # Tells Pydantic to read data even if it is not a dict (like SQLAlchemy models)



# backend/schemas.py
# (Keep your existing Student schemas at the top)

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