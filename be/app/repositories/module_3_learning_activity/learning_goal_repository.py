from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_3_learning_activity.learning_goal import LearningGoal

class LearningGoalRepository:
    """
    Repository layer. Trách nhiệm duy nhất: giao tiếp với Database thông qua SQLAlchemy ORM.
    Không chứa Business Logic hay HTTP status codes.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, goal_id: UUID) -> Optional[LearningGoal]:
        return self.db.query(LearningGoal).filter(LearningGoal.id == goal_id).first()

    def get_all(self, user_id: UUID, skip: int = 0, limit: int = 100) -> Tuple[List[LearningGoal], int]:
        query = self.db.query(LearningGoal).filter(LearningGoal.user_id == user_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> LearningGoal:
        db_obj = LearningGoal(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: LearningGoal, update_data: dict) -> LearningGoal:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: LearningGoal) -> None:
        self.db.delete(db_obj)
        self.db.commit()
