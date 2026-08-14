import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DECIMAL, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class AcademicStatistic(Base):
    __tablename__ = "academic_statistics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> student_profiles.id
    # This field identifies the student whose stats are recorded.
    student_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id"),
        nullable=False,
    )

    # FK -> academic_terms.id
    # This field identifies the semester for these statistics.
    semester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("academic_terms.id"),
        nullable=False,
    )

    semester_gpa: Mapped[float | None] = mapped_column(
        DECIMAL(3, 2),
        nullable=True,
    )

    cumulative_gpa: Mapped[float | None] = mapped_column(
        DECIMAL(3, 2),
        nullable=True,
    )

    total_credits: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    completed_credits: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    failed_courses: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    rank: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationship type: Many-to-One
    # AcademicStatistic N --- 1 StudentProfile
    student_profile = relationship(
        "StudentProfile",
        back_populates="academic_statistics",
    )
