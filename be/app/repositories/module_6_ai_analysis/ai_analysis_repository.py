from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.module_6_ai_analysis.ai_analysis_report import AIAnalysisReport

class AIAnalysisRepository:
    def create_report(self, db: Session, report_data: dict) -> AIAnalysisReport:
        report = AIAnalysisReport(**report_data)
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    def get_report_by_id(self, db: Session, report_id: UUID) -> Optional[AIAnalysisReport]:
        return db.query(AIAnalysisReport).filter(AIAnalysisReport.id == report_id).first()

    def get_reports_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[AIAnalysisReport]:
        return db.query(AIAnalysisReport).filter(AIAnalysisReport.user_id == user_id).order_by(AIAnalysisReport.created_at.desc()).offset(skip).limit(limit).all()
