from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.models.module_8_recommendation_notification.notification import Notification

class NotificationRepository:
    def create_notification(self, db: Session, notification_data: dict) -> Notification:
        noti = Notification(**notification_data)
        db.add(noti)
        db.commit()
        db.refresh(noti)
        return noti

    def get_notification_by_id(self, db: Session, notification_id: UUID) -> Optional[Notification]:
        return db.query(Notification).filter(Notification.id == notification_id).first()

    def get_notifications_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.sent_at.desc()).offset(skip).limit(limit).all()

    def mark_as_read(self, db: Session, noti: Notification) -> Notification:
        noti.is_read = True
        noti.read_at = datetime.utcnow()
        db.commit()
        db.refresh(noti)
        return noti

    def mark_all_as_read(self, db: Session, user_id: UUID):
        db.query(Notification).filter(
            Notification.user_id == user_id, 
            Notification.is_read == False
        ).update({
            "is_read": True,
            "read_at": datetime.utcnow()
        }, synchronize_session=False)
        db.commit()
