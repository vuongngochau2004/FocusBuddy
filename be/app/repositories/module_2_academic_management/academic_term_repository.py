from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_2_academic_management.academic_term import AcademicTerm

class AcademicTermRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, term_id: UUID) -> Optional[AcademicTerm]:
        return self.db.query(AcademicTerm).filter(AcademicTerm.id == term_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[AcademicTerm], int]:
        query = self.db.query(AcademicTerm)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> AcademicTerm:
        db_obj = AcademicTerm(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: AcademicTerm, update_data: dict) -> AcademicTerm:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: AcademicTerm) -> None:
        self.db.delete(db_obj)
        self.db.commit()
