from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.models.module_6_ai_analysis.ai_analysis_report import ReportType, OverallStatus

class AIAnalysisRequest(BaseModel):
    report_type: ReportType = ReportType.GENERAL
    # Additional context hints from user
    additional_context: Optional[str] = None
    
class AIAnalysisResponse(BaseModel):
    id: UUID
    user_id: UUID
    session_id: Optional[UUID] = None
    report_type: Optional[ReportType] = None
    summary: Optional[str] = None
    academic_analysis: Optional[Dict[str, Any]] = None
    mental_analysis: Optional[Dict[str, Any]] = None
    overall_status: Optional[OverallStatus] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
