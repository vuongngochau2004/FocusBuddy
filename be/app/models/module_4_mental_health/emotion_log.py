import uuid
from datetime import datetime
import enum

from sqlalchemy import String, SmallInteger, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class EmotionType(str, enum.Enum):
    HAPPY = "HAPPY"
    SAD = "SAD"
    STRESSED = "STRESSED"
    ANXIOUS = "ANXIOUS"
    NEUTRAL = "NEUTRAL"

class EmotionLog(Base):
    __tablename__ = "emotion_logs"

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

    emotion: Mapped[EmotionType] = mapped_column(
        SQLEnum(EmotionType),
        nullable=False,
    )

    stress_level: Mapped[int | None] = mapped_column(
        SmallInteger,
        nullable=True,
    )

    motivation_level: Mapped[int | None] = mapped_column(
        SmallInteger,
        nullable=True,
    )

    energy_level: Mapped[int | None] = mapped_column(
        SmallInteger,
        nullable=True,
    )

    note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
