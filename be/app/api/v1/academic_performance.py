from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session
from typing import List, Dict
from uuid import UUID

from app.api.dependencies import get_db
from app.schemas.module_2_academic_management.academic_statistic import AcademicStatisticResponse
from app.services.academic_performance_service import AcademicPerformanceService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> AcademicPerformanceService:
    return AcademicPerformanceService(db)

@router.get("", response_model=List[AcademicStatisticResponse])
def get_statistics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: AcademicPerformanceService = Depends(get_service)
):
    return service.get_statistics(x_user_id, skip=skip, limit=limit)

@router.get("/by-term/{term_id}", response_model=AcademicStatisticResponse)
def get_statistic_by_term(
    term_id: UUID,
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: AcademicPerformanceService = Depends(get_service)
):
    return service.get_statistic_by_term(x_user_id, term_id)

@router.get("/basic-statistics")
def get_basic_statistics(
    x_user_id: str = Header(..., alias="X-User-Id"),
    service: AcademicPerformanceService = Depends(get_service)
):
    """
    Returns deterministic basic statistics across all grades of the user.
    """
    return service.calculate_basic_statistics(x_user_id)
