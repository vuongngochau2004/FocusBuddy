from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Any
from app.api.dependencies import get_db
from app.schemas.module_4_mental_health.mental_assessment import MentalAssessmentCreate, MentalAssessmentUpdate, MentalAssessmentResponse
from app.repositories.module_4_mental_health.mental_assessment_repository import MentalAssessmentRepository
from app.services.module_4_mental_health.mental_assessment_service import MentalAssessmentService

router = APIRouter()
"""
Router layer. Không truy cập database trực tiếp mà phải thông qua Dependency Injection (Service).
Xử lý các HTTP Request, routing, parameter parsing.
"""

def get_mental_assessment_service(db: Session = Depends(get_db)) -> MentalAssessmentService:
    repository = MentalAssessmentRepository(db)
    return MentalAssessmentService(repository)

@router.post("", response_model=MentalAssessmentResponse, status_code=201)
def create_assessment(
    data: MentalAssessmentCreate,
    x_user_id: UUID = Header(..., description="User ID"),
    service: MentalAssessmentService = Depends(get_mental_assessment_service)
):
    return service.create(x_user_id, data)

@router.get("")
def get_assessments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    x_user_id: UUID = Header(..., description="User ID"),
    service: MentalAssessmentService = Depends(get_mental_assessment_service)
):
    items, total = service.get_all(skip=skip, limit=limit, user_id=x_user_id)
    return {"items": [MentalAssessmentResponse.model_validate(item) for item in items], "total": total}

@router.get("/{id}", response_model=MentalAssessmentResponse)
def get_assessment(
    id: UUID,
    x_user_id: UUID = Header(..., description="User ID"),
    service: MentalAssessmentService = Depends(get_mental_assessment_service)
):
    return service.get_by_id(id, x_user_id)

@router.put("/{id}", response_model=MentalAssessmentResponse)
def update_assessment(
    id: UUID,
    data: MentalAssessmentUpdate,
    x_user_id: UUID = Header(..., description="User ID"),
    service: MentalAssessmentService = Depends(get_mental_assessment_service)
):
    return service.update(id, x_user_id, data)

@router.delete("/{id}", status_code=204)
def delete_assessment(
    id: UUID,
    x_user_id: UUID = Header(..., description="User ID"),
    service: MentalAssessmentService = Depends(get_mental_assessment_service)
):
    service.delete(id, x_user_id)
