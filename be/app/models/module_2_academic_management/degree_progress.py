import uuid
from datetime import datetime

from sqlalchemy import Integer, DECIMAL, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class DegreeProgress(Base):
    __tablename__ = "degree_progress"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> student_profiles.id
    # This field identifies the student profile for this degree progress.
    student_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id"),
        nullable=False,
    )

    required_credits: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    completed_credits: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    remaining_credits: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    completion_percent: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationship type: Many-to-One
    # DegreeProgress N --- 1 StudentProfile
    student_profile = relationship(
        "StudentProfile",
        back_populates="degree_progresses",
    )
