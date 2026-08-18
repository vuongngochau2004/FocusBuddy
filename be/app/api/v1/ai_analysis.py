from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.dependencies import get_db
from app.schemas.ai_analysis import AIAnalysisRequest, AIAnalysisResponse
from app.schemas.recommendation import RecommendationResponse
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

def get_user_id(x_user_id: UUID = Header(...)) -> UUID:
    return x_user_id

@router.post("/analyze")
async def generate_ai_analysis(
    request: AIAnalysisRequest,
    user_id: UUID = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    try:
        report = await ai_service.generate_analysis(db, user_id, request)
        return {
            "message": "Phân tích thành công",
            "report_id": report.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports", response_model=List[AIAnalysisResponse])
def get_user_reports(
    skip: int = 0, limit: int = 100,
    user_id: UUID = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    return ai_service.get_user_reports(db, user_id, skip, limit)

@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_user_recommendations(
    skip: int = 0, limit: int = 100,
    user_id: UUID = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    return ai_service.get_user_recommendations(db, user_id, skip, limit)
