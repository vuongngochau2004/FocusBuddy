from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_2_academic_management.curriculum import Curriculum

class CurriculumRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, curriculum_id: UUID) -> Optional[Curriculum]:
        return self.db.query(Curriculum).filter(Curriculum.id == curriculum_id).first()

    def get_all(self, major_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Curriculum], int]:
        query = self.db.query(Curriculum)
        if major_id:
            query = query.filter(Curriculum.major_id == major_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> Curriculum:
        db_obj = Curriculum(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Curriculum, update_data: dict) -> Curriculum:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: Curriculum) -> None:
        self.db.delete(db_obj)
        self.db.commit()
