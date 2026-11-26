# backend/models.py
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey, text, JSON, Time,UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY,JSONB
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



class Student(Base):
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="SET NULL"), nullable=True)
    full_name = Column(String(255), nullable=False)
    parent_name = Column(String(255), nullable=True)
    parent_phone = Column(String(20), nullable=True)
    status = Column(String(20), default="ACTIVE")
    photo_url = Column(String, nullable=True)
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


class Batch(Base):
    __tablename__ = "batches"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    days_of_week = Column(ARRAY(String), default=list)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

class BatchStudent(Base):
    __tablename__ = "batch_students"
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), primary_key=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))




class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("batch_id", "student_id", "date", name="uq_attendance_batch_student_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    remarks = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))




class Material(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    page_count = Column(Integer, nullable=True)
    processing_status = Column(String(20), nullable=False, default="PROCESSING")
    extracted_topics = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))