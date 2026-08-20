from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.module_8_recommendation_notification.notification import NotificationType

class NotificationBase(BaseModel):
    notification_type: NotificationType
    title: str
    content: str
    recommendation_id: Optional[UUID] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: UUID
    user_id: UUID
    is_read: bool
    sent_at: datetime
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
