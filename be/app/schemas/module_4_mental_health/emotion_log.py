from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.module_4_mental_health.emotion_log import EmotionType

class EmotionLogBase(BaseModel):
    """
    Schema dùng để validate Data Transfer Object (DTO) giữa client và server.
    """
    emotion: EmotionType
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    motivation_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    note: Optional[str] = None
    recorded_at: datetime

class EmotionLogCreate(EmotionLogBase):
    pass

class EmotionLogUpdate(BaseModel):
    emotion: Optional[EmotionType] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    motivation_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    note: Optional[str] = None
    recorded_at: Optional[datetime] = None

class EmotionLogResponse(EmotionLogBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
