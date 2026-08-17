from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.university_repository import UniversityRepository
from app.schemas.university import UniversityCreate, UniversityUpdate
from app.models.module_1_user_management.university import University

class UniversityService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UniversityRepository(db)

    def get_by_id(self, item_id: UUID) -> University:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="University not found"
            )
        return item

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[University], int]:
        return self.repo.get_all(skip=skip, limit=limit)

    def create(self, data_in: UniversityCreate) -> University:
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create university. Data might be invalid or conflict."
            )

    def update(self, item_id: UUID, data_in: UniversityUpdate) -> University:
        item = self.get_by_id(item_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update university."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete university. It might be referenced by other entities."
            )
