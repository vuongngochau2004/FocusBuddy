from fastapi import APIRouter

api_router = APIRouter()

from app.api.v1.auth import router as auth_router
from app.api.v1.user import router as user_router
from app.api.v1.universities import router as university_router
from app.api.v1.majors import router as major_router
from app.api.v1.curriculums import router as curriculum_router
from app.api.v1.courses import router as course_router
from app.api.v1.academic_terms import router as academic_term_router
from app.api.v1.learning_goals import router as learning_goal_router
from app.api.v1.study_sessions import router as study_session_router
from app.api.v1.study_tasks import router as study_task_router
from app.api.v1.emotion_logs import router as emotion_log_router
from app.api.v1.mental_assessments import router as mental_assessment_router
from app.api.v1.files import router as file_router
from app.api.v1.grades import router as grades_router
from app.api.v1.academic_performance import router as academic_performance_router
from app.api.v1.ai_analysis import router as ai_analysis_router
from app.api.v1.chat import router as chat_router
from app.api.v1.notifications import router as notification_router

api_router.include_router(auth_router, prefix="/v1/auth", tags=["Authentication"])
api_router.include_router(user_router, prefix="/v1/users", tags=["Users"])
api_router.include_router(university_router, prefix="/v1/universities", tags=["Universities"])
api_router.include_router(major_router, prefix="/v1/majors", tags=["Majors"])
api_router.include_router(curriculum_router, prefix="/v1/curriculums", tags=["Curriculums"])
api_router.include_router(course_router, prefix="/v1/courses", tags=["Courses"])
api_router.include_router(academic_term_router, prefix="/v1/academic-terms", tags=["Academic Terms"])
api_router.include_router(learning_goal_router, prefix="/v1/learning-goals", tags=["Learning Goals"])
api_router.include_router(study_session_router, prefix="/v1/study-sessions", tags=["Study Sessions"])
api_router.include_router(study_task_router, prefix="/v1/study-tasks", tags=["Study Tasks"])
api_router.include_router(emotion_log_router, prefix="/v1/emotions", tags=["Emotions"])
api_router.include_router(mental_assessment_router, prefix="/v1/assessments", tags=["Assessments"])
api_router.include_router(file_router, prefix="/v1/files", tags=["Files"])
api_router.include_router(grades_router, prefix="/v1/grades", tags=["Grades"])
api_router.include_router(academic_performance_router, prefix="/v1/academic-performance", tags=["Academic Performance"])
api_router.include_router(ai_analysis_router, prefix="/v1/ai", tags=["AI Analysis"])
api_router.include_router(chat_router, prefix="/v1/chat", tags=["Chat"])
api_router.include_router(notification_router, prefix="/v1/notifications", tags=["Notifications"])

@api_router.get("/v1/ping", tags=["Health Check"])
async def ping():
    """
    Basic ping endpoint to check if API routing is working.
    """
    return {"ping": "pong!"}
