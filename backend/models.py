# backend/models.py
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey, text, JSON, Time,UniqueConstraint, Text, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY,JSONB
from sqlalchemy.orm import relationship
from database import Base
import uuid
 

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


class BatchMaterial(Base):
    __tablename__ = "batch_materials"
    __table_args__ = (
        UniqueConstraint("batch_id", "material_id", name="batch_materials_unique"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("extensions.uuid_generate_v4()"))
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    



class Test(Base):
    __tablename__ = "tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    test_date = Column(Date, nullable=True)
    duration_minutes = Column(Integer, default=45)
    total_marks = Column(Numeric(6, 2), nullable=False, default=0)
    difficulty = Column(String(20), nullable=False, default="MEDIUM")
    instructions = Column(Text, nullable=True)
    source_material_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=False, default=list)
    blueprint = Column(JSONB, nullable=False, default=dict)
    status = Column(String(20), nullable=False, default="DRAFT")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    questions = relationship(
        "TestQuestion",
        back_populates="test",
        cascade="all, delete-orphan",
        order_by="(TestQuestion.section, TestQuestion.question_order)",
    )
    results = relationship(
        "TestResult",
        back_populates="test",
        cascade="all, delete-orphan",
    )


class TestQuestion(Base):
    __tablename__ = "test_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    section = Column(String(50), nullable=False)
    question_order = Column(Integer, nullable=False)
    question_type = Column(String(30), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSONB, nullable=True)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    marking_scheme = Column(JSONB, nullable=True)
    marks = Column(Numeric(5, 2), nullable=False, default=1)
    topic_tag = Column(Text, nullable=True)
    source_material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    test = relationship("Test", back_populates="questions")


class TestResult(Base):
    __tablename__ = "test_results"
    __table_args__ = (UniqueConstraint("test_id", "student_id", name="uq_test_student"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    marks_obtained = Column(Numeric(6, 2), nullable=True)
    status = Column(String(20), nullable=False, default="PENDING")
    remarks = Column(Text, nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    test = relationship("Test", back_populates="results")