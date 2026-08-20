from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.module_2_academic_management.academic_term_repository import AcademicTermRepository
from app.schemas.module_2_academic_management.academic_term import AcademicTermCreate, AcademicTermUpdate
from app.models.module_2_academic_management.academic_term import AcademicTerm

class AcademicTermService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AcademicTermRepository(db)

    def get_by_id(self, item_id: UUID) -> AcademicTerm:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AcademicTerm not found"
            )
        return item

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[AcademicTerm], int]:
        return self.repo.get_all(skip=skip, limit=limit)

    def create(self, data_in: AcademicTermCreate) -> AcademicTerm:
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create academic term."
            )

    def update(self, item_id: UUID, data_in: AcademicTermUpdate) -> AcademicTerm:
        item = self.get_by_id(item_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update academic term."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete academic term. It might be referenced by other entities."
            )
