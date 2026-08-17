from sqlalchemy.orm import Session
from uuid import UUID

from app.services.ai.context_builder import AIContextBuilder
from app.services.ai.agents import StudyStatusAgent, GradeAnalysisAgent, PsychologyAgent
from app.services.ai.provider import AIProvider
from app.models.module_6_ai_analysis.ai_analysis_report import ReportType

class AgentOrchestrator:
    def __init__(self, db: Session, user_id: UUID):
        self.context_builder = AIContextBuilder(db, user_id)
        self.provider = AIProvider()

    def run_analysis(self, report_type: ReportType, additional_context: str = "") -> dict:
        if report_type == ReportType.ACADEMIC:
            context = self.context_builder.build_academic_context()
            agent = GradeAnalysisAgent(self.provider)
            return agent.analyze(context, additional_context)
        
        elif report_type == ReportType.MENTAL_HEALTH:
            context = self.context_builder.build_mental_context()
            agent = PsychologyAgent(self.provider)
            return agent.analyze(context, additional_context)
            
        else: # GENERAL or MONTHLY_REVIEW
            context = self.context_builder.build_general_context()
            agent = StudyStatusAgent(self.provider)
            return agent.analyze(context, additional_context)
