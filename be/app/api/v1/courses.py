from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseListResponse
from app.services.course_service import CourseService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> CourseService:
    return CourseService(db)

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    *,
    service: CourseService = Depends(get_service),
    data_in: CourseCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=CourseListResponse)
def read_courses(
    major_id: Optional[UUID] = Query(None, description="Filter by Major ID"),
    skip: int = 0,
    limit: int = 100,
    service: CourseService = Depends(get_service),
) -> Any:
    items, total = service.get_all(major_id=major_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=CourseResponse)
def read_course(
    *,
    item_id: UUID,
    service: CourseService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=CourseResponse)
def update_course(
    *,
    item_id: UUID,
    data_in: CourseUpdate,
    service: CourseService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    *,
    item_id: UUID,
    service: CourseService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
