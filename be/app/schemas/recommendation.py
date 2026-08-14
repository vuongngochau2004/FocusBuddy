from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.module_8_recommendation_notification.recommendation import RecommendationCategory, RecommendationPriority, RecommendationStatus

class RecommendationResponse(BaseModel):
    id: UUID
    user_id: UUID
    report_id: Optional[UUID] = None
    category: RecommendationCategory
    priority: RecommendationPriority
    title: str
    content: str
    user_action_status: Optional[RecommendationStatus] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
