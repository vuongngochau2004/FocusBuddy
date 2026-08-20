from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.module_2_academic_management.academic_term import AcademicTermCreate, AcademicTermUpdate, AcademicTermResponse, AcademicTermListResponse
from app.services.module_2_academic_management.academic_term_service import AcademicTermService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> AcademicTermService:
    return AcademicTermService(db)

@router.post("", response_model=AcademicTermResponse, status_code=status.HTTP_201_CREATED)
def create_academic_term(
    *,
    service: AcademicTermService = Depends(get_service),
    data_in: AcademicTermCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=AcademicTermListResponse)
def read_academic_terms(
    skip: int = 0,
    limit: int = 100,
    service: AcademicTermService = Depends(get_service),
) -> Any:
    items, total = service.get_all(skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=AcademicTermResponse)
def read_academic_term(
    *,
    item_id: UUID,
    service: AcademicTermService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=AcademicTermResponse)
def update_academic_term(
    *,
    item_id: UUID,
    data_in: AcademicTermUpdate,
    service: AcademicTermService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_academic_term(
    *,
    item_id: UUID,
    service: AcademicTermService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
