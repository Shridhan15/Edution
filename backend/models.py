# backend/models.py
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey, text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

# backend/models.py

# backend/models.py

class Student(Base):
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    parent_name = Column(String(255), nullable=True)
    parent_phone = Column(String(20), nullable=True)
    status = Column(String(20), default="ACTIVE")
    
    # --- Add this missing column ---
    joining_date = Column(Date, server_default=text("CURRENT_DATE"))
    
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

class AcademicEvent(Base):
    __tablename__ = "academic_events"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_date = Column(Date, server_default=text("CURRENT_DATE"))
    marks_obtained = Column(Numeric(5, 2))
    max_marks = Column(Numeric(5, 2))
    ai_insights = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))



# backend/models.py (Add to the bottom of the file)
from sqlalchemy import Integer # Make sure Integer is imported at the top if it isn't already

class Class(Base):
    __tablename__ = "classes"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    chapter_number = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))