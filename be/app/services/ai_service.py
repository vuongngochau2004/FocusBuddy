from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas.ai_analysis import AIAnalysisRequest
from app.services.ai.orchestrator import AgentOrchestrator
from app.repositories.ai_analysis_repository import AIAnalysisRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.models.module_6_ai_analysis.ai_analysis_report import AIAnalysisReport

class AIService:
    def __init__(self):
        self.report_repo = AIAnalysisRepository()
        self.rec_repo = RecommendationRepository()

    def generate_analysis(self, db: Session, user_id: UUID, request: AIAnalysisRequest) -> AIAnalysisReport:
        orchestrator = AgentOrchestrator(db, user_id)
        
        # Run AI Analysis through Orchestrator
        ai_result = orchestrator.run_analysis(
            report_type=request.report_type,
            additional_context=request.additional_context or ""
        )
        
        # Build Report Data
        report_data = {
            "user_id": user_id,
            "report_type": request.report_type,
            "summary": ai_result.get("summary"),
            "academic_analysis": ai_result.get("academic_analysis"),
            "mental_analysis": ai_result.get("mental_analysis"),
            "overall_status": ai_result.get("overall_status")
        }
        
        # Save Report
        report = self.report_repo.create_report(db, report_data)
        
        # Save Recommendations if any
        recommendations = ai_result.get("recommendations", [])
        for rec in recommendations:
            rec_data = {
                "user_id": user_id,
                "report_id": report.id,
                "category": rec.get("category"),
                "priority": rec.get("priority"),
                "title": rec.get("title"),
                "content": rec.get("content")
            }
            self.rec_repo.create_recommendation(db, rec_data)
            
        return report

    def get_user_reports(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100):
        return self.report_repo.get_reports_by_user(db, user_id, skip, limit)

    def get_user_recommendations(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100):
        return self.rec_repo.get_recommendations_by_user(db, user_id, skip, limit)
