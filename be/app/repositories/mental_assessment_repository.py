from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_4_mental_health.mental_assessment import MentalAssessment

class MentalAssessmentRepository:
    """
    Repository layer. Trách nhiệm duy nhất: giao tiếp với Database thông qua SQLAlchemy ORM.
    Không chứa Business Logic hay HTTP status codes.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def create(self, assessment: MentalAssessment) -> MentalAssessment:
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment
        
    def get_by_id(self, id: UUID) -> Optional[MentalAssessment]:
        return self.db.query(MentalAssessment).filter(MentalAssessment.id == id).first()
        
    def get_all(self, skip: int = 0, limit: int = 100, user_id: Optional[UUID] = None) -> tuple[List[MentalAssessment], int]:
        query = self.db.query(MentalAssessment)
        if user_id:
            query = query.filter(MentalAssessment.user_id == user_id)
        
        total = query.count()
        items = query.order_by(MentalAssessment.created_at.desc()).offset(skip).limit(limit).all()
        return items, total
        
    def update(self, assessment: MentalAssessment) -> MentalAssessment:
        self.db.commit()
        self.db.refresh(assessment)
        return assessment
        
    def delete(self, assessment: MentalAssessment) -> None:
        self.db.delete(assessment)
        self.db.commit()
