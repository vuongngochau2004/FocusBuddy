from typing import Optional
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.module_3_learning_activity.learning_goal import GoalStatus

class LearningGoalBase(BaseModel):
    """
    Schema dùng để validate Data Transfer Object (DTO) giữa client và server.
    """
    title: str = Field(..., max_length=255)
    target_value: Optional[float] = None
    unit: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[GoalStatus] = None

class LearningGoalCreate(LearningGoalBase):
    pass

class LearningGoalUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    target_value: Optional[float] = None
    unit: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[GoalStatus] = None

class LearningGoalResponse(LearningGoalBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class LearningGoalListResponse(BaseModel):
    items: list[LearningGoalResponse]
    total: int
