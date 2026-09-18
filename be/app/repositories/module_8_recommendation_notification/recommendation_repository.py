from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.module_8_recommendation_notification.recommendation import Recommendation

class RecommendationRepository:
    def create_recommendation(self, db: Session, recommendation_data: dict) -> Recommendation:
        rec = Recommendation(**recommendation_data)
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec

    def get_recommendation_by_id(self, db: Session, recommendation_id: UUID) -> Optional[Recommendation]:
        return db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()

    def get_recommendations_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Recommendation]:
        return db.query(Recommendation).filter(Recommendation.user_id == user_id).order_by(Recommendation.created_at.desc()).offset(skip).limit(limit).all()
