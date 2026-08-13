import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Major(Base):
    __tablename__ = "majors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> universities.id
    # This field identifies the university that offers this major.
    university_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("universities.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    code: Mapped[str | None] = mapped_column(
        String(50),
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
    # Major N --- 1 University
    university = relationship(
        "University",
        back_populates="majors",
    )

    # Relationship type: One-to-Many
    # Major 1 --- N StudentProfile
    student_profiles = relationship(
        "StudentProfile",
        back_populates="major",
    )
    
    # Relationship type: One-to-Many
    # Major 1 --- N Curriculum
    curriculums = relationship(
        "Curriculum",
        back_populates="major",
    )
    
    # Relationship type: One-to-Many
    # Major 1 --- N Course
    courses = relationship(
        "Course",
        back_populates="major",
    )
