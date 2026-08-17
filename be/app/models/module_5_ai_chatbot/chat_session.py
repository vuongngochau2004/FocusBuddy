import uuid
from datetime import datetime
import enum

from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class SessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> users.id
    # This field identifies the user starting the chat.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    status: Mapped[SessionStatus | None] = mapped_column(
        SQLEnum(SessionStatus),
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # Relationship type: One-to-Many
    # ChatSession 1 --- N ChatMessage
    messages = relationship(
        "ChatMessage",
        back_populates="session",
    )
    
    # Relationship type: One-to-Many
    # ChatSession 1 --- N AgentExecution
    agent_executions = relationship(
        "AgentExecution",
        back_populates="session",
    )
    
    # Relationship type: One-to-Many
    # ChatSession 1 --- N AIAnalysisReport
    ai_analysis_reports = relationship(
        "AIAnalysisReport",
        back_populates="session",
    )
