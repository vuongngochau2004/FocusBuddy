import uuid
from datetime import datetime

from sqlalchemy import Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class StudySessionCourse(Base):
    __tablename__ = "study_session_courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> study_sessions.id
    # This field identifies the study session.
    study_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("study_sessions.id"),
        nullable=False,
    )

    # FK -> courses.id
    # This field identifies the course studied in this session.
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id"),
        nullable=False,
    )

    time_spent_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    # Relationship type: Many-to-One
    # StudySessionCourse N --- 1 StudySession
    study_session = relationship(
        "StudySession",
        back_populates="session_courses",
    )

    # Relationship type: Many-to-One
    # StudySessionCourse N --- 1 Course
    course = relationship(
        "Course",
    )
