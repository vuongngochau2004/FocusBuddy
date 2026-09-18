from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_2_academic_management.course import Course

class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, course_id: UUID) -> Optional[Course]:
        return self.db.query(Course).filter(Course.id == course_id).first()

    def get_all(self, major_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Course], int]:
        query = self.db.query(Course)
        if major_id:
            query = query.filter(Course.major_id == major_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> Course:
        db_obj = Course(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Course, update_data: dict) -> Course:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: Course) -> None:
        self.db.delete(db_obj)
        self.db.commit()
