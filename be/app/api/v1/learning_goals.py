from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status, Header
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.learning_goal import LearningGoalCreate, LearningGoalUpdate, LearningGoalResponse, LearningGoalListResponse
from app.services.learning_goal_service import LearningGoalService

router = APIRouter()
"""
Router layer. Không truy cập database trực tiếp mà phải thông qua Dependency Injection (Service).
Xử lý các HTTP Request, routing, parameter parsing.
"""

def get_service(db: Session = Depends(get_db)) -> LearningGoalService:
    return LearningGoalService(db)

# Note: Using X-User-Id header as a placeholder for authenticated user ID.
# This makes it easy to integrate with Auth middleware later.
@router.post("", response_model=LearningGoalResponse, status_code=status.HTTP_201_CREATED)
def create_learning_goal(
    *,
    service: LearningGoalService = Depends(get_service),
    data_in: LearningGoalCreate,
    x_user_id: UUID = Header(...),
) -> Any:
    return service.create(user_id=x_user_id, data_in=data_in)

@router.get("", response_model=LearningGoalListResponse)
def read_learning_goals(
    skip: int = 0,
    limit: int = 100,
    service: LearningGoalService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    items, total = service.get_all(user_id=x_user_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=LearningGoalResponse)
def read_learning_goal(
    *,
    item_id: UUID,
    service: LearningGoalService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    return service.get_by_id(item_id=item_id, user_id=x_user_id)

@router.put("/{item_id}", response_model=LearningGoalResponse)
def update_learning_goal(
    *,
    item_id: UUID,
    data_in: LearningGoalUpdate,
    service: LearningGoalService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> Any:
    return service.update(item_id=item_id, user_id=x_user_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_goal(
    *,
    item_id: UUID,
    service: LearningGoalService = Depends(get_service),
    x_user_id: UUID = Header(...),
) -> None:
    service.delete(item_id=item_id, user_id=x_user_id)
