import uuid
from datetime import datetime
import enum

from sqlalchemy import String, Integer, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class SurveyType(str, enum.Enum):
    STRESS = "STRESS"
    BURNOUT = "BURNOUT"
    MOTIVATION = "MOTIVATION"

class PsychologicalSurvey(Base):
    __tablename__ = "psychological_surveys"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    survey_type: Mapped[SurveyType | None] = mapped_column(
        SQLEnum(SurveyType),
        nullable=True,
    )

    total_questions: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    score_range_min: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    score_range_max: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
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
