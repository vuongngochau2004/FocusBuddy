import uuid
from datetime import date, datetime
import enum

from sqlalchemy import String, DECIMAL, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class StatisticPeriodType(str, enum.Enum):
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"

class MentalHealthStatistic(Base):
    __tablename__ = "mental_health_statistics"

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

    period_type: Mapped[StatisticPeriodType | None] = mapped_column(
        SQLEnum(StatisticPeriodType),
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

    average_stress_score: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True,
    )

    average_motivation_level: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True,
    )

    average_energy_level: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
