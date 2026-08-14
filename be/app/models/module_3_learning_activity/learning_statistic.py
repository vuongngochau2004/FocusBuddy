import uuid
from datetime import date, datetime
import enum

from sqlalchemy import Integer, DECIMAL, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class PeriodType(str, enum.Enum):
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"

class LearningStatistic(Base):
    __tablename__ = "learning_statistics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> users.id
    # This field identifies the user.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    period_type: Mapped[PeriodType | None] = mapped_column(
        SQLEnum(PeriodType),
        nullable=True,
    )

    period_start: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    period_end: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    total_study_minutes: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    average_focus_score: Mapped[float | None] = mapped_column(
        DECIMAL(3, 2),
        nullable=True,
    )

    completed_tasks: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    late_tasks: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
