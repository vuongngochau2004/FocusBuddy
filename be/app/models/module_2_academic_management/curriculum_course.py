import uuid
from datetime import datetime
import enum

from sqlalchemy import Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class CourseCategory(str, enum.Enum):
    GENERAL = "GENERAL"
    MAJOR = "MAJOR"
    FOUNDATION = "FOUNDATION"

class CurriculumCourse(Base):
    __tablename__ = "curriculum_courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> curriculums.id
    # This field identifies the curriculum.
    curriculum_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("curriculums.id"),
        nullable=False,
    )

    # FK -> courses.id
    # This field identifies the course in the curriculum.
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id"),
        nullable=False,
    )

    semester_order: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    course_category: Mapped[CourseCategory] = mapped_column(
        SQLEnum(CourseCategory),
        nullable=False,
    )

    is_required: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default='true',
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    # Relationship type: Many-to-One
    # CurriculumCourse N --- 1 Curriculum
    curriculum = relationship(
        "Curriculum",
        back_populates="curriculum_courses",
    )

    # Relationship type: Many-to-One
    # CurriculumCourse N --- 1 Course
    course = relationship(
        "Course",
        back_populates="curriculum_courses",
    )
