from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException
from app.schemas.mental_assessment import MentalAssessmentCreate, MentalAssessmentUpdate
from app.models.module_4_mental_health.mental_assessment import MentalAssessment
from app.repositories.mental_assessment_repository import MentalAssessmentRepository

class MentalAssessmentService:
    """
    Service layer chứa Business Logic (vd: kiểm tra foreign key tồn tại, quyền truy cập, v.v).
    """
    def __init__(self, repository: MentalAssessmentRepository):
        self.repository = repository
        
    def create(self, user_id: UUID, data: MentalAssessmentCreate) -> MentalAssessment:
        new_assessment = MentalAssessment(**data.model_dump(), user_id=user_id)
        return self.repository.create(new_assessment)
        
    def get_by_id(self, id: UUID, user_id: UUID) -> MentalAssessment:
        assessment = self.repository.get_by_id(id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Mental assessment not found")
        if assessment.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this resource")
        return assessment
        
    def get_all(self, skip: int = 0, limit: int = 100, user_id: Optional[UUID] = None) -> tuple[List[MentalAssessment], int]:
        return self.repository.get_all(skip, limit, user_id=user_id)
        
    def update(self, id: UUID, user_id: UUID, data: MentalAssessmentUpdate) -> MentalAssessment:
        assessment = self.get_by_id(id, user_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(assessment, key, value)
        return self.repository.update(assessment)
        
    def delete(self, id: UUID, user_id: UUID) -> None:
        assessment = self.get_by_id(id, user_id)
        self.repository.delete(assessment)
