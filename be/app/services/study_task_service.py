from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.study_task_repository import StudyTaskRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.study_task import StudyTaskCreate, StudyTaskUpdate
from app.models.module_3_learning_activity.study_task import StudyTask
from app.repositories.user_repository import UserRepository

class StudyTaskService:
    """
    Service layer chứa Business Logic (vd: kiểm tra foreign key tồn tại, quyền truy cập, v.v).
    """
    def __init__(self, db: Session):
        self.db = db
        self.repo = StudyTaskRepository(db)
        self.user_repo = UserRepository(db)
        self.course_repo = CourseRepository(db)

    def _check_user(self, user_id: UUID):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

    def _check_course(self, course_id: UUID):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

    def _get_and_check_ownership(self, item_id: UUID, user_id: UUID) -> StudyTask:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="StudyTask not found"
            )
        if item.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this resource"
            )
        return item

    def get_by_id(self, item_id: UUID, user_id: UUID) -> StudyTask:
        return self._get_and_check_ownership(item_id, user_id)

    def get_all(self, user_id: UUID, course_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[StudyTask], int]:
        self._check_user(user_id)
        return self.repo.get_all(user_id=user_id, course_id=course_id, skip=skip, limit=limit)

    def create(self, user_id: UUID, data_in: StudyTaskCreate) -> StudyTask:
        self._check_user(user_id)
        if data_in.course_id:
            self._check_course(data_in.course_id)

        data_dict = data_in.model_dump()
        data_dict["user_id"] = user_id
        try:
            return self.repo.create(data_dict)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create study task."
            )

    def update(self, item_id: UUID, user_id: UUID, data_in: StudyTaskUpdate) -> StudyTask:
        item = self._get_and_check_ownership(item_id, user_id)
        if data_in.course_id is not None:
            self._check_course(data_in.course_id)
            
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update study task."
            )

    def delete(self, item_id: UUID, user_id: UUID) -> None:
        item = self._get_and_check_ownership(item_id, user_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete study task."
            )
