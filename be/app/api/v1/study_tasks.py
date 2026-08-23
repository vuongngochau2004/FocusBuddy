from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user_id
from app.schemas.module_3_learning_activity.study_task import StudyTaskCreate, StudyTaskUpdate, StudyTaskResponse, StudyTaskListResponse
from app.services.module_3_learning_activity.study_task_service import StudyTaskService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> StudyTaskService:
    return StudyTaskService(db)

@router.post("", response_model=StudyTaskResponse, status_code=status.HTTP_201_CREATED)
def create_study_task(
    *,
    service: StudyTaskService = Depends(get_service),
    data_in: StudyTaskCreate,
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    return service.create(user_id=user_id, data_in=data_in)

@router.get("", response_model=StudyTaskListResponse)
def read_study_tasks(
    course_id: Optional[UUID] = Query(None, description="Filter by Course ID"),
    skip: int = 0,
    limit: int = 100,
    service: StudyTaskService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    items, total = service.get_all(user_id=user_id, course_id=course_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=StudyTaskResponse)
def read_study_task(
    *,
    item_id: UUID,
    service: StudyTaskService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    return service.get_by_id(item_id=item_id, user_id=user_id)

@router.put("/{item_id}", response_model=StudyTaskResponse)
def update_study_task(
    *,
    item_id: UUID,
    data_in: StudyTaskUpdate,
    service: StudyTaskService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    return service.update(item_id=item_id, user_id=user_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_task(
    *,
    item_id: UUID,
    service: StudyTaskService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> None:
    service.delete(item_id=item_id, user_id=user_id)
