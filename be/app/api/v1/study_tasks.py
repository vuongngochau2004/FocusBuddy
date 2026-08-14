from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Header, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.study_task import StudyTaskCreate, StudyTaskUpdate, StudyTaskResponse, StudyTaskListResponse
from app.services.study_task_service import StudyTaskService

router = APIRouter()
"""
Router layer. Không truy cập database trực tiếp mà phải thông qua Dependency Injection (Service).
Xử lý các HTTP Request, routing, parameter parsing.
"""

def get_service(db: Session = Depends(get_db)) -> StudyTaskService:
    return StudyTaskService(db)

@router.post("", response_model=StudyTaskResponse, status_code=status.HTTP_201_CREATED)
def create_study_task(
    *,
    service: StudyTaskService = Depends(get_service),
    data_in: StudyTaskCreate,
    x_user_id: UUID = Header(...),
) -> Any:
    return service.create(user_id=x_user_id, data_in=data_in)

@router.get("", response_model=StudyTaskListResponse)
def read_study_tasks(
    course_id: Optional[UUID] = Query(None, description="Filter by Course ID"),
    skip: int = 0,
    limit: int = 100,
    service: StudyTaskService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    items, total = service.get_all(user_id=x_user_id, course_id=course_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=StudyTaskResponse)
def read_study_task(
    *,
    item_id: UUID,
    service: StudyTaskService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    return service.get_by_id(item_id=item_id, user_id=x_user_id)

@router.put("/{item_id}", response_model=StudyTaskResponse)
def update_study_task(
    *,
    item_id: UUID,
    data_in: StudyTaskUpdate,
    service: StudyTaskService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    return service.update(item_id=item_id, user_id=x_user_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_task(
    *,
    item_id: UUID,
    service: StudyTaskService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> None:
    service.delete(item_id=item_id, user_id=x_user_id)
