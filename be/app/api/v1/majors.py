from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.major import MajorCreate, MajorUpdate, MajorResponse, MajorListResponse
from app.services.major_service import MajorService

router = APIRouter()
"""
Router layer cho Major entity.
- Không truy cập database trực tiếp mà phải thông qua Dependency Injection (Service).
- Xử lý các HTTP Request, routing, parameter parsing, gọi xuống Service để lấy kết quả.
"""

def get_service(db: Session = Depends(get_db)) -> MajorService:
    return MajorService(db)

@router.post("", response_model=MajorResponse, status_code=status.HTTP_201_CREATED)
def create_major(
    *,
    service: MajorService = Depends(get_service),
    data_in: MajorCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=MajorListResponse)
def read_majors(
    university_id: Optional[UUID] = Query(None, description="Filter by University ID"),
    skip: int = 0,
    limit: int = 100,
    service: MajorService = Depends(get_service),
) -> Any:
    items, total = service.get_all(university_id=university_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=MajorResponse)
def read_major(
    *,
    item_id: UUID,
    service: MajorService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=MajorResponse)
def update_major(
    *,
    item_id: UUID,
    data_in: MajorUpdate,
    service: MajorService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_major(
    *,
    item_id: UUID,
    service: MajorService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
