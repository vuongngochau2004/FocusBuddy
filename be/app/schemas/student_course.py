from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from app.models.module_2_academic_management.student_course import CourseStatus

class StudentCourseBase(BaseModel):
    course_id: UUID
    academic_term_id: UUID
    score_process: Optional[float] = Field(None, ge=0, le=10)
    score_midterm: Optional[float] = Field(None, ge=0, le=10)
    score_final: Optional[float] = Field(None, ge=0, le=10)
    total_score: Optional[float] = Field(None, ge=0, le=10)
    letter_grade: Optional[str] = None
    grade_point: Optional[float] = Field(None, ge=0, le=4.0)
    status: Optional[CourseStatus] = None
    attempt_number: Optional[int] = Field(1, ge=1)

class StudentCourseCreate(StudentCourseBase):
    pass

class StudentCourseUpdate(BaseModel):
    score_process: Optional[float] = Field(None, ge=0, le=10)
    score_midterm: Optional[float] = Field(None, ge=0, le=10)
    score_final: Optional[float] = Field(None, ge=0, le=10)
    total_score: Optional[float] = Field(None, ge=0, le=10)
    letter_grade: Optional[str] = None
    grade_point: Optional[float] = Field(None, ge=0, le=4.0)
    status: Optional[CourseStatus] = None
    attempt_number: Optional[int] = Field(None, ge=1)

class StudentCourseResponse(StudentCourseBase):
    id: UUID
    student_profile_id: UUID

    class Config:
        from_attributes = True
