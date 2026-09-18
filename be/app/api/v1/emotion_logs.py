from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Any
from app.api.dependencies import get_db
from app.schemas.module_4_mental_health.emotion_log import EmotionLogCreate, EmotionLogUpdate, EmotionLogResponse
from app.repositories.module_4_mental_health.emotion_log_repository import EmotionLogRepository
from app.services.module_4_mental_health.emotion_log_service import EmotionLogService

router = APIRouter()
"""
Router layer. Không truy cập database trực tiếp mà phải thông qua Dependency Injection (Service).
Xử lý các HTTP Request, routing, parameter parsing.
"""

def get_emotion_log_service(db: Session = Depends(get_db)) -> EmotionLogService:
    repository = EmotionLogRepository(db)
    return EmotionLogService(repository)

@router.post("", response_model=EmotionLogResponse, status_code=201)
def create_emotion_log(
    data: EmotionLogCreate,
    x_user_id: UUID = Header(..., description="User ID"),
    service: EmotionLogService = Depends(get_emotion_log_service)
):
    return service.create(x_user_id, data)

@router.get("")
def get_emotion_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    x_user_id: UUID = Header(..., description="User ID"),
    service: EmotionLogService = Depends(get_emotion_log_service)
):
    items, total = service.get_all(skip=skip, limit=limit, user_id=x_user_id)
    return {"items": [EmotionLogResponse.model_validate(item) for item in items], "total": total}

@router.get("/{id}", response_model=EmotionLogResponse)
def get_emotion_log(
    id: UUID,
    x_user_id: UUID = Header(..., description="User ID"),
    service: EmotionLogService = Depends(get_emotion_log_service)
):
    return service.get_by_id(id, x_user_id)

@router.put("/{id}", response_model=EmotionLogResponse)
def update_emotion_log(
    id: UUID,
    data: EmotionLogUpdate,
    x_user_id: UUID = Header(..., description="User ID"),
    service: EmotionLogService = Depends(get_emotion_log_service)
):
    return service.update(id, x_user_id, data)

@router.delete("/{id}", status_code=204)
def delete_emotion_log(
    id: UUID,
    x_user_id: UUID = Header(..., description="User ID"),
    service: EmotionLogService = Depends(get_emotion_log_service)
):
    service.delete(id, x_user_id)
