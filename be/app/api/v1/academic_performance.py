from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict
from uuid import UUID

from app.api.dependencies import get_db, get_current_user_id
from app.schemas.module_2_academic_management.academic_statistic import AcademicStatisticResponse
from app.services.academic_performance_service import AcademicPerformanceService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> AcademicPerformanceService:
    return AcademicPerformanceService(db)

@router.get("", response_model=List[AcademicStatisticResponse])
def get_statistics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    user_id: UUID = Depends(get_current_user_id),
    service: AcademicPerformanceService = Depends(get_service)
):
    return service.get_statistics(str(user_id), skip=skip, limit=limit)

@router.get("/by-term/{term_id}", response_model=AcademicStatisticResponse)
def get_statistic_by_term(
    term_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: AcademicPerformanceService = Depends(get_service)
):
    return service.get_statistic_by_term(str(user_id), term_id)

@router.get("/basic-statistics")
def get_basic_statistics(
    user_id: UUID = Depends(get_current_user_id),
    service: AcademicPerformanceService = Depends(get_service)
):
    """
    Returns deterministic basic statistics across all grades of the user.
    """
    return service.calculate_basic_statistics(str(user_id))
