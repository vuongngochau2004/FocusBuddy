import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base

class AgentConfig(Base):
    __tablename__ = "agent_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    agent_type: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    system_prompt: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    few_shot_examples: Mapped[list | dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Array of objects: [{'user': '...', 'assistant': '...'}]"
    )

    model_provider: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        default="ollama",
    )

    model_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    max_history_messages: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=6,
    )

    allowed_tools: Mapped[list | dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Array of allowed tool names"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
