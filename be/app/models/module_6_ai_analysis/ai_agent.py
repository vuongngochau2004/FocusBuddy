import uuid
from datetime import datetime
import enum

from sqlalchemy import String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class AgentType(str, enum.Enum):
    COORDINATOR = "COORDINATOR"
    STUDY_ANALYST = "STUDY_ANALYST"
    PSYCHOLOGY_ANALYST = "PSYCHOLOGY_ANALYST"
    REPORT_GENERATOR = "REPORT_GENERATOR"

class AIAgent(Base):
    __tablename__ = "ai_agents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    agent_type: Mapped[AgentType] = mapped_column(
        SQLEnum(AgentType),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    model_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    system_prompt: Mapped[str | None] = mapped_column(
        Text,
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

    # Relationship type: One-to-Many
    # AIAgent 1 --- N AgentExecution
    agent_executions = relationship(
        "AgentExecution",
        back_populates="agent",
    )
    
    # Relationship type: One-to-Many
    # AIAgent 1 --- N AIModelLog
    model_logs = relationship(
        "AIModelLog",
        back_populates="agent",
    )
