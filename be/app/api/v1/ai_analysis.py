from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.dependencies import get_db, get_current_user_id
from app.schemas.module_6_ai_analysis.ai_analysis import AIAnalysisRequest, AIAnalysisResponse
from app.schemas.module_8_recommendation_notification.recommendation import RecommendationResponse
from app.services.module_5_ai_chatbot.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.post("/analyze")
async def generate_ai_analysis(
    request: AIAnalysisRequest,
    user_id: UUID = Depends(get_current_user_id),
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
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return ai_service.get_user_reports(db, user_id, skip, limit)

@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_user_recommendations(
    skip: int = 0, limit: int = 100,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return ai_service.get_user_recommendations(db, user_id, skip, limit)
