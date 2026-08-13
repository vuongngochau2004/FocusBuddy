import uuid
from datetime import datetime
import enum

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class CourseType(str, enum.Enum):
    COMPULSORY = "COMPULSORY"
    ELECTIVE = "ELECTIVE"

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> majors.id
    # This field identifies the major this course belongs to.
    major_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("majors.id"),
        nullable=True,
    )

    course_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    course_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    credits: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    course_type: Mapped[CourseType | None] = mapped_column(
        SQLEnum(CourseType),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    # Relationship type: Many-to-One
    # Course N --- 1 Major
    major = relationship(
        "Major",
        back_populates="courses",
    )

    # Relationship type: Self-referencing (Many-to-Many)
    # Course N --- N Course
    # Implemented through association object: CoursePrerequisite
    prerequisites = relationship(
        "CoursePrerequisite",
        foreign_keys="[CoursePrerequisite.course_id]",
        back_populates="course",
    )
    
    is_prerequisite_for = relationship(
        "CoursePrerequisite",
        foreign_keys="[CoursePrerequisite.prerequisite_course_id]",
        back_populates="prerequisite_course",
    )

    # Relationship type: One-to-Many
    # Course 1 --- N StudentCourse
    student_courses = relationship(
        "StudentCourse",
        back_populates="course",
    )

    # Relationship type: One-to-Many
    # Course 1 --- N CurriculumCourse
    curriculum_courses = relationship(
        "CurriculumCourse",
        back_populates="course",
    )
