import uuid
from datetime import datetime
import enum

from sqlalchemy import Integer, SmallInteger, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class StudyMethod(str, enum.Enum):
    POMODORO = "POMODORO"
    DEEP_WORK = "DEEP_WORK"
    NORMAL = "NORMAL"

class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> users.id
    # This field identifies the user who owns this study session.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    study_method: Mapped[StudyMethod | None] = mapped_column(
        SQLEnum(StudyMethod),
        nullable=True,
    )

    focus_score: Mapped[int | None] = mapped_column(
        SmallInteger,
        nullable=True,
    )

    note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    # Relationship type: One-to-Many
    # StudySession 1 --- N StudySessionCourse
    session_courses = relationship(
        "StudySessionCourse",
        back_populates="study_session",
    )
