import uuid
from datetime import datetime
import enum

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class RecommendationCategory(str, enum.Enum):
    ACADEMIC = "ACADEMIC"
    LEARNING_HABIT = "LEARNING_HABIT"
    MENTAL_HEALTH = "MENTAL_HEALTH"
    TIME_MANAGEMENT = "TIME_MANAGEMENT"
    GENERAL = "GENERAL"

class RecommendationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RecommendationStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DISMISSED = "DISMISSED"

class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> users.id
    # This field identifies the user who receives the recommendation.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    # FK -> ai_analysis_reports.id
    # This field identifies the report that generated this recommendation (if any).
    report_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_analysis_reports.id"),
        nullable=True,
    )

    category: Mapped[RecommendationCategory] = mapped_column(
        SQLEnum(RecommendationCategory),
        nullable=False,
    )

    priority: Mapped[RecommendationPriority] = mapped_column(
        SQLEnum(RecommendationPriority),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    user_action_status: Mapped[RecommendationStatus | None] = mapped_column(
        SQLEnum(RecommendationStatus),
        default=RecommendationStatus.PENDING,
        server_default='PENDING',
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # Relationship type: Many-to-One
    # Recommendation N --- 1 AIAnalysisReport
    report = relationship(
        "AIAnalysisReport",
        back_populates="recommendations",
    )
    
    # Relationship type: One-to-Many
    # Recommendation 1 --- N Notification
    notifications = relationship(
        "Notification",
        back_populates="recommendation",
    )
