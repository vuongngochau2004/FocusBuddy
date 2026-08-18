from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from typing import List, Tuple

from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationCreate
from app.models.module_8_recommendation_notification.notification import Notification

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository()

    def get_user_notifications(self, user_id: str, skip: int = 0, limit: int = 100) -> Tuple[List[Notification], int]:
        try:
            uid = UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format")

        items = self.repo.get_notifications_by_user(self.db, uid, skip, limit)
        
        from app.models.module_8_recommendation_notification.notification import Notification as NotiModel
        total = self.db.query(NotiModel).filter(NotiModel.user_id == uid).count()
        return items, total

    def mark_read(self, user_id: str, notification_id: UUID) -> Notification:
        try:
            uid = UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format")

        noti = self.repo.get_notification_by_id(self.db, notification_id)
        if not noti or noti.user_id != uid:
            raise HTTPException(status_code=404, detail="Notification not found")

        return self.repo.mark_as_read(self.db, noti)

    def mark_all_read(self, user_id: str):
        try:
            uid = UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format")

        self.repo.mark_all_as_read(self.db, uid)
