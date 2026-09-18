from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.module_3_learning_activity.study_session import StudyMethod

class StudySessionBase(BaseModel):
    """
    Schema dùng để validate Data Transfer Object (DTO) giữa client và server.
    """
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    study_method: Optional[StudyMethod] = None
    focus_score: Optional[int] = None
    note: Optional[str] = None

class StudySessionCreate(StudySessionBase):
    pass

class StudySessionUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    study_method: Optional[StudyMethod] = None
    focus_score: Optional[int] = None
    note: Optional[str] = None

class StudySessionResponse(StudySessionBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class StudySessionListResponse(BaseModel):
    items: list[StudySessionResponse]
    total: int
