from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.module_4_mental_health.mental_assessment import AssessmentType, RiskLevel

class MentalAssessmentBase(BaseModel):
    """
    Schema dùng để validate Data Transfer Object (DTO) giữa client và server.
    """
    assessment_type: Optional[AssessmentType] = None
    stress_score: Optional[float] = Field(None, ge=0.0)
    anxiety_score: Optional[float] = Field(None, ge=0.0)
    burnout_score: Optional[float] = Field(None, ge=0.0)
    risk_level: Optional[RiskLevel] = None
    summary: Optional[str] = None
    recommendation: Optional[str] = None

class MentalAssessmentCreate(MentalAssessmentBase):
    pass

class MentalAssessmentUpdate(MentalAssessmentBase):
    pass

class MentalAssessmentResponse(MentalAssessmentBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
