from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas.ai_analysis import AIAnalysisRequest
from app.services.ai.provider import AIProvider
from app.services.ai.context_builder import AIContextBuilder
from app.repositories.ai_analysis_repository import AIAnalysisRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.models.module_6_ai_analysis.ai_analysis_report import AIAnalysisReport

class AIService:
    def __init__(self):
        self.report_repo = AIAnalysisRepository()
        self.rec_repo = RecommendationRepository()

    async def generate_analysis(self, db: Session, user_id: UUID, request: AIAnalysisRequest) -> AIAnalysisReport:
        context_builder = AIContextBuilder(db, user_id)
        provider = AIProvider()

        if request.report_type == ReportType.ACADEMIC:
            context = context_builder.build_academic_context()
            prompt = "Bạn là chuyên gia tư vấn học thuật và phân tích điểm số. " + (request.additional_context or "")
        elif request.report_type == ReportType.MENTAL_HEALTH:
            context = context_builder.build_mental_context()
            prompt = "Bạn là chuyên gia hỗ trợ tâm lý học tập. (Lưu ý: Không chẩn đoán bệnh). " + (request.additional_context or "")
        else:
            context = context_builder.build_general_context()
            prompt = "Bạn là chuyên gia phân tích trạng thái học tập. " + (request.additional_context or "")

        ai_result = await provider.generate_structured_analysis(prompt, context)
        
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
            saved_rec = self.rec_repo.create_recommendation(db, rec_data)
            
            # Tự động tạo thông báo RECOMMENDATION khi có đề xuất học tập mới từ AI
            from app.repositories.notification_repository import NotificationRepository
            from app.models.module_8_recommendation_notification.notification import NotificationType
            
            noti_repo = NotificationRepository()
            noti_data = {
                "user_id": user_id,
                "recommendation_id": saved_rec.id,
                "notification_type": NotificationType.RECOMMENDATION,
                "title": f"Gợi ý học tập: {saved_rec.title}",
                "content": saved_rec.content,
                "is_read": False
            }
            noti_repo.create_notification(db, noti_data)
            
        return report

    def get_user_reports(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100):
        return self.report_repo.get_reports_by_user(db, user_id, skip, limit)

    def get_user_recommendations(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100):
        return self.rec_repo.get_recommendations_by_user(db, user_id, skip, limit)
