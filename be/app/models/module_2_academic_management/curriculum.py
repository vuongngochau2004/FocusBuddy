import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Curriculum(Base):
    __tablename__ = "curriculums"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> majors.id
    # This field identifies the major this curriculum belongs to.
    major_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("majors.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    code: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True,
    )

    admission_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    total_credits: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
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

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationship type: Many-to-One
    # Curriculum N --- 1 Major
    major = relationship(
        "Major",
        back_populates="curriculums",
    )

    # Relationship type: One-to-Many
    # Curriculum 1 --- N CurriculumCourse
    curriculum_courses = relationship(
        "CurriculumCourse",
        back_populates="curriculum",
    )
