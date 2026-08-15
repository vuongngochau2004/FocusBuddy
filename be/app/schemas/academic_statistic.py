from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class AcademicStatisticResponse(BaseModel):
    id: UUID
    student_profile_id: UUID
    semester_id: UUID
    semester_gpa: Optional[float] = None
    cumulative_gpa: Optional[float] = None
    total_credits: Optional[int] = None
    completed_credits: Optional[int] = None
    failed_courses: Optional[int] = None
    rank: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
