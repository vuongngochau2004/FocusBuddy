import json
from app.core.config import settings
from app.models.module_6_ai_analysis.ai_analysis_report import OverallStatus

class AIProvider:
    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.api_key = settings.AI_API_KEY

    def is_mock(self):
        return not bool(self.api_key)

    def generate_structured_analysis(self, prompt: str, context: str) -> dict:
        if self.is_mock():
            return {
                "summary": "Dựa trên phân tích giả lập (Mock), bạn đang học tập khá tốt.",
                "academic_analysis": {
                    "strengths": ["Toán", "Lập trình"],
                    "weaknesses": ["Thể dục"],
                    "suggestions": ["Cố gắng duy trì điểm trung bình"]
                },
                "mental_analysis": {
                    "status": "Tốt",
                    "note": "Tâm trạng ổn định, có thể tập trung học tập"
                },
                "overall_status": OverallStatus.GOOD.value,
                "recommendations": [
                    {"category": "ACADEMIC", "priority": "MEDIUM", "title": "Ôn tập trước thi", "content": "Bạn nên xem lại kiến thức môn cơ bản."}
                ]
            }
        
        # Real LLM Call would go here
        raise NotImplementedError("Real AI integration is not implemented yet.")

    def generate_chat_response(self, system_prompt: str, history: list, user_message: str) -> str:
        if self.is_mock():
            return f"[MOCK AI REPLY] Cảm ơn bạn đã hỏi '{user_message}'. Đây là phản hồi giả lập từ trợ lý học tập của FocusBuddy!"
            
        raise NotImplementedError("Real AI integration is not implemented yet.")
