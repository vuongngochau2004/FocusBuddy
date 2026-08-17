from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.module_2_academic_management.course import CourseType

class CourseBase(BaseModel):
    major_id: Optional[UUID] = None
    course_code: str = Field(..., max_length=20)
    course_name: str = Field(..., max_length=255)
    credits: int
    course_type: Optional[CourseType] = None
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    major_id: Optional[UUID] = None
    course_code: Optional[str] = Field(None, max_length=20)
    course_name: Optional[str] = Field(None, max_length=255)
    credits: Optional[int] = None
    course_type: Optional[CourseType] = None
    description: Optional[str] = None

class CourseResponse(CourseBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class CourseListResponse(BaseModel):
    items: list[CourseResponse]
    total: int
