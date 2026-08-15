from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException
from app.schemas.emotion_log import EmotionLogCreate, EmotionLogUpdate
from app.models.module_4_mental_health.emotion_log import EmotionLog
from app.repositories.emotion_log_repository import EmotionLogRepository

class EmotionLogService:
    """
    Service layer chứa Business Logic (vd: kiểm tra foreign key tồn tại, quyền truy cập, v.v).
    """
    def __init__(self, repository: EmotionLogRepository):
        self.repository = repository
        
    def create(self, user_id: UUID, data: EmotionLogCreate) -> EmotionLog:
        new_log = EmotionLog(**data.model_dump(), user_id=user_id)
        return self.repository.create(new_log)
        
    def get_by_id(self, id: UUID, user_id: UUID) -> EmotionLog:
        log = self.repository.get_by_id(id)
        if not log:
            raise HTTPException(status_code=404, detail="Emotion log not found")
        if log.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this resource")
        return log
        
    def get_all(self, skip: int = 0, limit: int = 100, user_id: Optional[UUID] = None) -> tuple[List[EmotionLog], int]:
        return self.repository.get_all(skip, limit, user_id=user_id)
        
    def update(self, id: UUID, user_id: UUID, data: EmotionLogUpdate) -> EmotionLog:
        log = self.get_by_id(id, user_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(log, key, value)
        return self.repository.update(log)
        
    def delete(self, id: UUID, user_id: UUID) -> None:
        log = self.get_by_id(id, user_id)
        self.repository.delete(log)
