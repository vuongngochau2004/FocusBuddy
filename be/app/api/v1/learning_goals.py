from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user_id
from app.schemas.module_3_learning_activity.learning_goal import LearningGoalCreate, LearningGoalUpdate, LearningGoalResponse, LearningGoalListResponse
from app.services.module_3_learning_activity.learning_goal_service import LearningGoalService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> LearningGoalService:
    return LearningGoalService(db)

@router.post("", response_model=LearningGoalResponse, status_code=status.HTTP_201_CREATED)
def create_learning_goal(
    *,
    service: LearningGoalService = Depends(get_service),
    data_in: LearningGoalCreate,
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    return service.create(user_id=user_id, data_in=data_in)

@router.get("", response_model=LearningGoalListResponse)
def read_learning_goals(
    skip: int = 0,
    limit: int = 100,
    service: LearningGoalService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    items, total = service.get_all(user_id=user_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=LearningGoalResponse)
def read_learning_goal(
    *,
    item_id: UUID,
    service: LearningGoalService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    return service.get_by_id(item_id=item_id, user_id=user_id)

@router.put("/{item_id}", response_model=LearningGoalResponse)
def update_learning_goal(
    *,
    item_id: UUID,
    data_in: LearningGoalUpdate,
    service: LearningGoalService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> Any:
    return service.update(item_id=item_id, user_id=user_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_goal(
    *,
    item_id: UUID,
    service: LearningGoalService = Depends(get_service),
    user_id: UUID = Depends(get_current_user_id),
) -> None:
    service.delete(item_id=item_id, user_id=user_id)
