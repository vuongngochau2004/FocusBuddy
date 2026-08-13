import uuid
from datetime import datetime
import enum

from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class ExecutionTaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AgentExecution(Base):
    __tablename__ = "agent_executions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> chat_sessions.id
    # This field identifies the chat session triggered this execution.
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id"),
        nullable=True,
    )

    # FK -> ai_agents.id
    # This field identifies the executing agent.
    agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_agents.id"),
        nullable=True,
    )

    task_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    input_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    output_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    status: Mapped[ExecutionTaskStatus | None] = mapped_column(
        SQLEnum(ExecutionTaskStatus),
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # Relationship type: Many-to-One
    # AgentExecution N --- 1 ChatSession
    session = relationship(
        "ChatSession",
        back_populates="agent_executions",
    )

    # Relationship type: Many-to-One
    # AgentExecution N --- 1 AIAgent
    agent = relationship(
        "AIAgent",
        back_populates="agent_executions",
    )
