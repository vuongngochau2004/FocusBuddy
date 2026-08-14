import uuid
from datetime import datetime
import enum

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class SenderType(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    AGENT = "AGENT"

class MessageType(str, enum.Enum):
    TEXT = "TEXT"
    FILE = "FILE"
    IMAGE = "IMAGE"
    REPORT = "REPORT"

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> chat_sessions.id
    # This field identifies the parent chat session.
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id"),
        nullable=False,
    )

    sender_type: Mapped[SenderType | None] = mapped_column(
        SQLEnum(SenderType),
        nullable=True,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    message_type: Mapped[MessageType | None] = mapped_column(
        SQLEnum(MessageType),
        nullable=True,
    )

    token_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    metadata_data: Mapped[dict | None] = mapped_column(
        "metadata", # renamed python attribute to avoid conflict with Base.metadata
        JSONB,
        nullable=True,
    )

    # Relationship type: Many-to-One
    # ChatMessage N --- 1 ChatSession
    session = relationship(
        "ChatSession",
        back_populates="messages",
    )
