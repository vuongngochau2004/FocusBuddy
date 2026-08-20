from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_1_user_management.major import Major

class MajorRepository:
    """
    Repository layer cho Major entity.
    - Trách nhiệm duy nhất: giao tiếp với Database thông qua SQLAlchemy ORM.
    - Không chứa Business Logic hay HTTP status codes.
    - Cung cấp các hàm CRUD cơ bản và query có filter đặc thù (ví dụ: get_all theo university_id).
    """
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, major_id: UUID) -> Optional[Major]:
        return self.db.query(Major).filter(Major.id == major_id).first()

    def get_all(self, university_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Major], int]:
        query = self.db.query(Major)
        if university_id:
            query = query.filter(Major.university_id == university_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> Major:
        db_obj = Major(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Major, update_data: dict) -> Major:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: Major) -> None:
        self.db.delete(db_obj)
        self.db.commit()
