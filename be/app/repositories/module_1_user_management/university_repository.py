from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_1_user_management.university import University

class UniversityRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, university_id: UUID) -> Optional[University]:
        return self.db.query(University).filter(University.id == university_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[University], int]:
        query = self.db.query(University)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> University:
        db_obj = University(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: University, update_data: dict) -> University:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: University) -> None:
        self.db.delete(db_obj)
        self.db.commit()
