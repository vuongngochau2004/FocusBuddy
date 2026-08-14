from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.major_repository import MajorRepository
from app.repositories.university_repository import UniversityRepository
from app.schemas.major import MajorCreate, MajorUpdate
from app.models.module_1_user_management.major import Major

class MajorService:
    """
    Service layer cho Major entity.
    - Service khác Repository ở chỗ: Repository chỉ chứa logic truy vấn DB thuần túy, 
      còn Service chứa Business Logic (vd: kiểm tra foreign key tồn tại, quyền truy cập, v.v).
    - Router gọi Service thay vì gọi thẳng Repository để tách biệt HTTP layer khỏi Business logic.
    """
    def __init__(self, db: Session):
        self.db = db
        self.repo = MajorRepository(db)
        self.univ_repo = UniversityRepository(db)

    def get_by_id(self, item_id: UUID) -> Major:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Major not found"
            )
        return item

    def get_all(self, university_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Major], int]:
        return self.repo.get_all(university_id=university_id, skip=skip, limit=limit)

    def _check_university(self, university_id: UUID):
        univ = self.univ_repo.get_by_id(university_id)
        if not univ:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="University not found"
            )

    def create(self, data_in: MajorCreate) -> Major:
        self._check_university(data_in.university_id)
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create major."
            )

    def update(self, item_id: UUID, data_in: MajorUpdate) -> Major:
        item = self.get_by_id(item_id)
        if data_in.university_id is not None:
            self._check_university(data_in.university_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update major."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete major. It might be referenced by other entities."
            )
