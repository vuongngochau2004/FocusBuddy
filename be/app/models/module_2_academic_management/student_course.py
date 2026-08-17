import uuid
import enum

from sqlalchemy import String, Integer, DECIMAL, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class CourseStatus(str, enum.Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    LEARNING = "LEARNING"

class StudentCourse(Base):
    __tablename__ = "student_courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> student_profiles.id
    # This field identifies the student.
    student_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id"),
        nullable=False,
    )

    # FK -> courses.id
    # This field identifies the course being taken.
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id"),
        nullable=False,
    )

    # FK -> academic_terms.id
    # This field identifies the term in which the course was taken.
    academic_term_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("academic_terms.id"),
        nullable=False,
    )

    score_process: Mapped[float | None] = mapped_column(
        DECIMAL(4, 2),
        nullable=True,
    )

    score_midterm: Mapped[float | None] = mapped_column(
        DECIMAL(4, 2),
        nullable=True,
    )

    score_final: Mapped[float | None] = mapped_column(
        DECIMAL(4, 2),
        nullable=True,
    )

    total_score: Mapped[float | None] = mapped_column(
        DECIMAL(4, 2),
        nullable=True,
    )

    letter_grade: Mapped[str | None] = mapped_column(
        String(2),
        nullable=True,
    )

    grade_point: Mapped[float | None] = mapped_column(
        DECIMAL(2, 1),
        nullable=True,
    )

    status: Mapped[CourseStatus | None] = mapped_column(
        SQLEnum(CourseStatus),
        nullable=True,
    )

    attempt_number: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default='1',
        nullable=False,
    )

    # Relationship type: Many-to-One
    # StudentCourse N --- 1 StudentProfile
    student_profile = relationship(
        "StudentProfile",
        back_populates="student_courses",
    )

    # Relationship type: Many-to-One
    # StudentCourse N --- 1 Course
    course = relationship(
        "Course",
        back_populates="student_courses",
    )

    # Relationship type: Many-to-One
    # StudentCourse N --- 1 AcademicTerm
    academic_term = relationship(
        "AcademicTerm",
        back_populates="student_courses",
    )
