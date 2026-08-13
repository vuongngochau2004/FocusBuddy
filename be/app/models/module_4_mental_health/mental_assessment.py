import uuid
from datetime import datetime
import enum

from sqlalchemy import String, DECIMAL, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class AssessmentType(str, enum.Enum):
    DAILY_CHECK = "DAILY_CHECK"
    WEEKLY_CHECK = "WEEKLY_CHECK"
    MONTHLY_CHECK = "MONTHLY_CHECK"
    AI_ANALYSIS = "AI_ANALYSIS"

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class MentalAssessment(Base):
    __tablename__ = "mental_assessments"

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

    assessment_type: Mapped[AssessmentType | None] = mapped_column(
        SQLEnum(AssessmentType),
        nullable=True,
    )

    stress_score: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True,
    )

    anxiety_score: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True,
    )

    burnout_score: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True,
    )

    risk_level: Mapped[RiskLevel | None] = mapped_column(
        SQLEnum(RiskLevel),
        nullable=True,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recommendation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
