from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user_id
from app.schemas.module_8_recommendation_notification.notification import NotificationListResponse, NotificationResponse
from app.services.module_8_recommendation_notification.notification_service import NotificationService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)

@router.get("", response_model=NotificationListResponse)
def read_notifications(
    skip: int = 0,
    limit: int = 100,
    service: NotificationService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    items, total = service.get_user_notifications(user_id=str(user_id), skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.put("/{noti_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    noti_id: UUID,
    service: NotificationService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    return service.mark_read(user_id=str(user_id), notification_id=noti_id)

@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    service: NotificationService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> None:
    service.mark_all_read(user_id=str(user_id))
