from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.module_3_learning_activity.learning_goal_repository import LearningGoalRepository
from app.schemas.module_3_learning_activity.learning_goal import LearningGoalCreate, LearningGoalUpdate
from app.models.module_3_learning_activity.learning_goal import LearningGoal
from app.repositories.module_1_user_management.user_repository import UserRepository

class LearningGoalService:
    """
    Service layer chứa Business Logic (vd: kiểm tra foreign key tồn tại, quyền truy cập, v.v).
    """
    """
    Service layer cho LearningGoal entity.
    Đảm bảo validate user_id và các logic nghiệp vụ trước khi ghi vào Database.
    """
    def __init__(self, db: Session):
        self.db = db
        self.repo = LearningGoalRepository(db)
        self.user_repo = UserRepository(db)

    def _check_user(self, user_id: UUID):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

    def _get_and_check_ownership(self, item_id: UUID, user_id: UUID) -> LearningGoal:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LearningGoal not found"
            )
        if item.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this resource"
            )
        return item

    def get_by_id(self, item_id: UUID, user_id: UUID) -> LearningGoal:
        return self._get_and_check_ownership(item_id, user_id)

    def get_all(self, user_id: UUID, skip: int = 0, limit: int = 100) -> Tuple[List[LearningGoal], int]:
        self._check_user(user_id)
        return self.repo.get_all(user_id=user_id, skip=skip, limit=limit)

    def create(self, user_id: UUID, data_in: LearningGoalCreate) -> LearningGoal:
        self._check_user(user_id)
        data_dict = data_in.model_dump()
        data_dict["user_id"] = user_id
        try:
            return self.repo.create(data_dict)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create learning goal."
            )

    def update(self, item_id: UUID, user_id: UUID, data_in: LearningGoalUpdate) -> LearningGoal:
        item = self._get_and_check_ownership(item_id, user_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update learning goal."
            )

    def delete(self, item_id: UUID, user_id: UUID) -> None:
        item = self._get_and_check_ownership(item_id, user_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete learning goal."
            )
