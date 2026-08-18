from app.services.ai.provider import AIProvider

class BaseAgent:
    def __init__(self, provider: AIProvider):
        self.provider = provider

class StudyStatusAgent(BaseAgent):
    async def analyze(self, context: str, additional_prompt: str = "") -> dict:
        prompt = "Bạn là chuyên gia phân tích trạng thái học tập. " + additional_prompt
        return await self.provider.generate_structured_analysis(prompt, context)

class GradeAnalysisAgent(BaseAgent):
    async def analyze(self, context: str, additional_prompt: str = "") -> dict:
        prompt = "Bạn là chuyên gia tư vấn học thuật và phân tích điểm số. " + additional_prompt
        return await self.provider.generate_structured_analysis(prompt, context)

class PsychologyAgent(BaseAgent):
    async def analyze(self, context: str, additional_prompt: str = "") -> dict:
        prompt = "Bạn là chuyên gia hỗ trợ tâm lý học tập. (Lưu ý: Không chẩn đoán bệnh). " + additional_prompt
        return await self.provider.generate_structured_analysis(prompt, context)
