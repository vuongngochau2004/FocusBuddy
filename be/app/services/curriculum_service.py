from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.curriculum_repository import CurriculumRepository
from app.repositories.major_repository import MajorRepository
from app.schemas.curriculum import CurriculumCreate, CurriculumUpdate
from app.models.module_2_academic_management.curriculum import Curriculum

class CurriculumService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CurriculumRepository(db)
        self.major_repo = MajorRepository(db)

    def get_by_id(self, item_id: UUID) -> Curriculum:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curriculum not found"
            )
        return item

    def get_all(self, major_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Curriculum], int]:
        return self.repo.get_all(major_id=major_id, skip=skip, limit=limit)

    def _check_major(self, major_id: UUID):
        major = self.major_repo.get_by_id(major_id)
        if not major:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Major not found"
            )

    def create(self, data_in: CurriculumCreate) -> Curriculum:
        self._check_major(data_in.major_id)
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create curriculum."
            )

    def update(self, item_id: UUID, data_in: CurriculumUpdate) -> Curriculum:
        item = self.get_by_id(item_id)
        if data_in.major_id is not None:
            self._check_major(data_in.major_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update curriculum."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete curriculum. It might be referenced by other entities."
            )
