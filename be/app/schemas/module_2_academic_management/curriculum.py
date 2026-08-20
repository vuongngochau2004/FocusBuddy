from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class CurriculumBase(BaseModel):
    major_id: UUID
    name: str = Field(..., max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    admission_year: int
    total_credits: int
    description: Optional[str] = None

class CurriculumCreate(CurriculumBase):
    pass

class CurriculumUpdate(BaseModel):
    major_id: Optional[UUID] = None
    name: Optional[str] = Field(None, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    admission_year: Optional[int] = None
    total_credits: Optional[int] = None
    description: Optional[str] = None

class CurriculumResponse(CurriculumBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CurriculumListResponse(BaseModel):
    items: list[CurriculumResponse]
    total: int
