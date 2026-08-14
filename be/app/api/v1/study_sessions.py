from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status, Header
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.study_session import StudySessionCreate, StudySessionUpdate, StudySessionResponse, StudySessionListResponse
from app.services.study_session_service import StudySessionService

router = APIRouter()
"""
Router layer. Không truy cập database trực tiếp mà phải thông qua Dependency Injection (Service).
Xử lý các HTTP Request, routing, parameter parsing.
"""

def get_service(db: Session = Depends(get_db)) -> StudySessionService:
    return StudySessionService(db)

@router.post("", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
def create_study_session(
    *,
    service: StudySessionService = Depends(get_service),
    data_in: StudySessionCreate,
    x_user_id: UUID = Header(...),
) -> Any:
    return service.create(user_id=x_user_id, data_in=data_in)

@router.get("", response_model=StudySessionListResponse)
def read_study_sessions(
    skip: int = 0,
    limit: int = 100,
    service: StudySessionService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    items, total = service.get_all(user_id=x_user_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=StudySessionResponse)
def read_study_session(
    *,
    item_id: UUID,
    service: StudySessionService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    return service.get_by_id(item_id=item_id, user_id=x_user_id)

@router.put("/{item_id}", response_model=StudySessionResponse)
def update_study_session(
    *,
    item_id: UUID,
    data_in: StudySessionUpdate,
    service: StudySessionService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    return service.update(item_id=item_id, user_id=x_user_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_session(
    *,
    item_id: UUID,
    service: StudySessionService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> None:
    service.delete(item_id=item_id, user_id=x_user_id)
