import uuid
from datetime import date, datetime
import enum

from sqlalchemy import String, Date, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class SemesterType(str, enum.Enum):
    REGULAR = "REGULAR"
    SUMMER = "SUMMER"

class AcademicTerm(Base):
    __tablename__ = "academic_terms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    display_name: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    academic_year: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    semester_type: Mapped[SemesterType] = mapped_column(
        SQLEnum(SemesterType),
        nullable=False,
    )

    start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    # Relationship type: One-to-Many
    # AcademicTerm 1 --- N StudentCourse
    student_courses = relationship(
        "StudentCourse",
        back_populates="academic_term",
    )
