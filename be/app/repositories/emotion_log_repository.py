from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_4_mental_health.emotion_log import EmotionLog

class EmotionLogRepository:
    """
    Repository layer. Trách nhiệm duy nhất: giao tiếp với Database thông qua SQLAlchemy ORM.
    Không chứa Business Logic hay HTTP status codes.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def create(self, emotion_log: EmotionLog) -> EmotionLog:
        self.db.add(emotion_log)
        self.db.commit()
        self.db.refresh(emotion_log)
        return emotion_log
        
    def get_by_id(self, id: UUID) -> Optional[EmotionLog]:
        return self.db.query(EmotionLog).filter(EmotionLog.id == id).first()
        
    def get_all(self, skip: int = 0, limit: int = 100, user_id: Optional[UUID] = None) -> tuple[List[EmotionLog], int]:
        query = self.db.query(EmotionLog)
        if user_id:
            query = query.filter(EmotionLog.user_id == user_id)
        
        total = query.count()
        items = query.order_by(EmotionLog.recorded_at.desc()).offset(skip).limit(limit).all()
        return items, total
        
    def update(self, emotion_log: EmotionLog) -> EmotionLog:
        self.db.commit()
        self.db.refresh(emotion_log)
        return emotion_log
        
    def delete(self, emotion_log: EmotionLog) -> None:
        self.db.delete(emotion_log)
        self.db.commit()
