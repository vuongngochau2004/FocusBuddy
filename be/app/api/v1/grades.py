from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.dependencies import get_db
from app.schemas.module_2_academic_management.student_course import StudentCourseCreate, StudentCourseUpdate, StudentCourseResponse
from app.schemas.grade_import import GradeImportRequest, GradeImportResponse
from app.services.module_2_academic_management.grade_service import GradeService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> GradeService:
    return GradeService(db)

@router.post("", response_model=StudentCourseResponse, status_code=201)
def create_grade(
    data: StudentCourseCreate,
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: GradeService = Depends(get_service)
):
    return service.create_grade(x_user_id, data)

@router.get("", response_model=List[StudentCourseResponse])
def get_grades(
    course_id: Optional[UUID] = Query(None),
    term_id: Optional[UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: GradeService = Depends(get_service)
):
    return service.get_grades(x_user_id, course_id=course_id, term_id=term_id, skip=skip, limit=limit)

@router.get("/{id}", response_model=StudentCourseResponse)
def get_grade(
    id: UUID,
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: GradeService = Depends(get_service)
):
    return service.get_grade(x_user_id, id)

@router.put("/{id}", response_model=StudentCourseResponse)
def update_grade(
    id: UUID,
    data: StudentCourseUpdate,
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: GradeService = Depends(get_service)
):
    return service.update_grade(x_user_id, id, data)

@router.delete("/{id}", status_code=204)
def delete_grade(
    id: UUID,
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: GradeService = Depends(get_service)
):
    service.delete_grade(x_user_id, id)

@router.post("/import", response_model=GradeImportResponse)
def import_grades(
    data: GradeImportRequest,
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: GradeService = Depends(get_service)
):
    return service.import_grades(x_user_id, data)
