from typing import Optional
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.module_2_academic_management.academic_term import SemesterType

class AcademicTermBase(BaseModel):
    display_name: str = Field(..., max_length=20)
    academic_year: str = Field(..., max_length=20)
    semester_type: SemesterType
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class AcademicTermCreate(AcademicTermBase):
    pass

class AcademicTermUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=20)
    academic_year: Optional[str] = Field(None, max_length=20)
    semester_type: Optional[SemesterType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class AcademicTermResponse(AcademicTermBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class AcademicTermListResponse(BaseModel):
    items: list[AcademicTermResponse]
    total: int
