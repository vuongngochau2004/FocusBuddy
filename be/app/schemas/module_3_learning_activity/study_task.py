from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.module_3_learning_activity.study_task import TaskPriority, TaskStatus

class StudyTaskBase(BaseModel):
    """
    Schema dùng để validate Data Transfer Object (DTO) giữa client và server.
    """
    course_id: Optional[UUID] = None
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class StudyTaskCreate(StudyTaskBase):
    pass

class StudyTaskUpdate(BaseModel):
    course_id: Optional[UUID] = None
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class StudyTaskResponse(StudyTaskBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True

class StudyTaskListResponse(BaseModel):
    items: list[StudyTaskResponse]
    total: int
