from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.module_1_user_management.university import UniversityCreate, UniversityUpdate, UniversityResponse, UniversityListResponse
from app.services.module_1_user_management.university_service import UniversityService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> UniversityService:
    return UniversityService(db)

@router.post("", response_model=UniversityResponse, status_code=status.HTTP_201_CREATED)
def create_university(
    *,
    service: UniversityService = Depends(get_service),
    data_in: UniversityCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=UniversityListResponse)
def read_universities(
    skip: int = 0,
    limit: int = 100,
    service: UniversityService = Depends(get_service),
) -> Any:
    items, total = service.get_all(skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=UniversityResponse)
def read_university(
    *,
    item_id: UUID,
    service: UniversityService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=UniversityResponse)
def update_university(
    *,
    item_id: UUID,
    data_in: UniversityUpdate,
    service: UniversityService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_university(
    *,
    item_id: UUID,
    service: UniversityService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
