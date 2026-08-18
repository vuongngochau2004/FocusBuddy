from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status, Header, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)

@router.get("", response_model=NotificationListResponse)
def read_notifications(
    skip: int = 0,
    limit: int = 100,
    service: NotificationService = Depends(get_service),
    x_user_id: str = Header(..., alias="X-User-Id"),
) -> Any:
    items, total = service.get_user_notifications(user_id=x_user_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.put("/{noti_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    noti_id: UUID,
    service: NotificationService = Depends(get_service),
    x_user_id: str = Header(..., alias="X-User-Id"),
) -> Any:
    return service.mark_read(user_id=x_user_id, notification_id=noti_id)

@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    service: NotificationService = Depends(get_service),
    x_user_id: str = Header(..., alias="X-User-Id"),
) -> None:
    service.mark_all_read(user_id=x_user_id)
