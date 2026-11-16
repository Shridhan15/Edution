# backend/schemas.py
from pydantic import BaseModel, UUID4
from datetime import date, datetime
from typing import Optional

class StudentBase(BaseModel):
    full_name: str
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    status: str = "ACTIVE"

class StudentCreate(StudentBase):
    organization_id: UUID4

class StudentResponse(StudentBase):
    id: UUID4
    organization_id: UUID4
    joining_date: date
    created_at: datetime

    class Config:
        from_attributes = True # Tells Pydantic to read data even if it is not a dict (like SQLAlchemy models)