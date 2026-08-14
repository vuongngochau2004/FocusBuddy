from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_3_learning_activity.study_task import StudyTask

class StudyTaskRepository:
    """
    Repository layer. Trách nhiệm duy nhất: giao tiếp với Database thông qua SQLAlchemy ORM.
    Không chứa Business Logic hay HTTP status codes.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, task_id: UUID) -> Optional[StudyTask]:
        return self.db.query(StudyTask).filter(StudyTask.id == task_id).first()

    def get_all(self, user_id: UUID, course_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[StudyTask], int]:
        query = self.db.query(StudyTask).filter(StudyTask.user_id == user_id)
        if course_id:
            query = query.filter(StudyTask.course_id == course_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> StudyTask:
        db_obj = StudyTask(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: StudyTask, update_data: dict) -> StudyTask:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: StudyTask) -> None:
        self.db.delete(db_obj)
        self.db.commit()
