import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> users.id
    # This field identifies the user who owns this profile.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    # FK -> universities.id
    # This field identifies the university the student attends.
    university_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("universities.id"),
        nullable=True,
    )

    # FK -> majors.id
    # This field identifies the student's major.
    major_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("majors.id"),
        nullable=True,
    )

    student_code: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True,
    )

    academic_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    enrollment_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    target_gpa: Mapped[float | None] = mapped_column(
        DECIMAL(3, 2),
        nullable=True,
    )

    career_goal: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationship type: One-to-One
    # User 1 --- 1 StudentProfile
    user = relationship(
        "User",
        back_populates="student_profile",
    )

    # Relationship type: Many-to-One
    # StudentProfile N --- 1 University
    university = relationship(
        "University",
        back_populates="student_profiles",
    )

    # Relationship type: Many-to-One
    # StudentProfile N --- 1 Major
    major = relationship(
        "Major",
        back_populates="student_profiles",
    )

    # Relationship type: One-to-Many
    # StudentProfile 1 --- N StudentCourse
    student_courses = relationship(
        "StudentCourse",
        back_populates="student_profile",
    )

    # Relationship type: One-to-Many
    # StudentProfile 1 --- N AcademicStatistic
    academic_statistics = relationship(
        "AcademicStatistic",
        back_populates="student_profile",
    )
    
    # Relationship type: One-to-Many
    # StudentProfile 1 --- N DegreeProgress
    degree_progresses = relationship(
        "DegreeProgress",
        back_populates="student_profile",
    )
