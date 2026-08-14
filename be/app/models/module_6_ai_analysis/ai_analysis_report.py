import uuid
from datetime import datetime
import enum

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class ReportType(str, enum.Enum):
    GENERAL = "GENERAL"
    ACADEMIC = "ACADEMIC"
    MENTAL_HEALTH = "MENTAL_HEALTH"
    MONTHLY_REVIEW = "MONTHLY_REVIEW"

class OverallStatus(str, enum.Enum):
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    NEEDS_IMPROVEMENT = "NEEDS_IMPROVEMENT"
    AT_RISK = "AT_RISK"

class AIAnalysisReport(Base):
    __tablename__ = "ai_analysis_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> users.id
    # This field identifies the user for whom the report is generated.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    # FK -> chat_sessions.id
    # This field identifies the parent chat session if applicable.
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id"),
        nullable=True,
    )

    report_type: Mapped[ReportType | None] = mapped_column(
        SQLEnum(ReportType),
        nullable=True,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    academic_analysis: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    mental_analysis: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    overall_status: Mapped[OverallStatus | None] = mapped_column(
        SQLEnum(OverallStatus),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        onupdate=datetime.utcnow,
        nullable=True,
    )

    # Relationship type: Many-to-One
    # AIAnalysisReport N --- 1 ChatSession
    session = relationship(
        "ChatSession",
        back_populates="ai_analysis_reports",
    )
    
    # Relationship type: One-to-Many
    # AIAnalysisReport 1 --- N Recommendation
    recommendations = relationship(
        "Recommendation",
        back_populates="report",
    )
