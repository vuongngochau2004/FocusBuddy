import logging
from sqlalchemy import text
from app.core.database import SessionLocal
from app.seed.utils import logger

# The exact reverse order of the dependency graph to safely delete rows without violating foreign keys
TABLES_TO_DELETE = [
    "notifications",
    "curriculum_courses",
    "study_tasks",
    "study_session_courses",
    "student_courses",
    "course_prerequisites",
    "degree_progress",
    "academic_statistics",
    "recommendations",
    "curriculums",
    "courses",
    "student_profiles",
    "file_extractions",
    "ai_analysis_reports",
    "agent_executions",
    "chat_messages",
    "ai_model_logs",
    "majors",
    "uploaded_files",
    "chat_sessions",
    "mental_health_statistics",
    "mental_assessments",
    "emotion_logs",
    "learning_statistics",
    "learning_goals",
    "study_sessions",
    "user_preferences",
    "ai_agents",
    "psychological_surveys",
    "academic_terms",
    "universities",
    "users"
]

def reset_database():
    """
    Deletes all records from all tables in reverse dependency order.
    Does not drop tables, just clears data for idempotency.
    """
    logger.info("========================================")
    logger.info("RESETTING FOCUSBUDDY DATABASE")
    logger.info("========================================")
    
    session = SessionLocal()
    try:
        for table in TABLES_TO_DELETE:
            logger.info(f"Clearing table: {table}...")
            # We use text() to execute raw DELETE FROM queries securely mapped to known table names
            session.execute(text(f'DELETE FROM "{table}";'))
        session.commit()
        logger.info("========================================")
        logger.info("DATABASE RESET COMPLETED SUCCESSFULLY")
        logger.info("========================================\n")
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Failed to reset database: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    reset_database()
