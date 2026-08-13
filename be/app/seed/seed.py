import argparse
from app.core.database import SessionLocal
from app.seed.utils import logger
from app.seed.reset import reset_database
from app.seed.module_1_user_management import run_module_1_seed
from app.seed.module_2_academic_management import run_module_2_seed
from app.seed.module_3_learning_activity import run_module_3_seed
from app.seed.module_4_mental_health import run_module_4_seed
from app.seed.module_5_ai_chatbot import run_module_5_seed
from app.seed.module_6_ai_analysis import run_module_6_seed
from app.seed.module_7_file_processing import run_module_7_seed
from app.seed.module_8_recommendation_notification import run_module_8_seed

def seed_database():
    logger.info("========================================")
    logger.info("       FOCUSBUDDY DATABASE SEED         ")
    logger.info("========================================\n")
    
    session = SessionLocal()
    try:
        # Module 1
        users, universities, majors = run_module_1_seed(session)
        
        # Module 2
        terms, courses, curriculums = run_module_2_seed(session, majors)
        
        # Module 3
        run_module_3_seed(session, users, courses)
        
        # Module 4
        run_module_4_seed(session, users)
        
        # Module 5
        chat_sessions = run_module_5_seed(session, users)
        
        # Module 6
        run_module_6_seed(session, users, chat_sessions)
        
        # Module 7
        run_module_7_seed(session, users)
        
        # Module 8
        run_module_8_seed(session, users)
        
        logger.info("\n========================================")
        logger.info("      SEED COMPLETED SUCCESSFULLY       ")
        logger.info("========================================\n")
    except Exception as e:
        logger.error("\n========================================")
        logger.error("         SEED FAILED WITH ERROR         ")
        logger.error(f"Error: {e}")
        logger.error("========================================\n")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed FocusBuddy database with fake data.")
    parser.add_argument("--reset", action="store_true", help="Reset database before seeding (deletes all data)")
    args = parser.parse_args()
    
    if args.reset:
        reset_database()
        
    seed_database()
