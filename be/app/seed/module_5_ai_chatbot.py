import random
from sqlalchemy.orm import Session
from app.seed.utils import fake, logger
from app.models.module_5_ai_chatbot.chat_session import ChatSession
from app.models.module_5_ai_chatbot.chat_message import ChatMessage

def seed_chatbot_data(session: Session, users):
    logger.info(f"  [>] Seeding chatbot data (sessions & messages)...")
    
    chat_sessions = []
    
    for user in users:
        for _ in range(random.randint(1, 3)):
            chat_sess = ChatSession(
                user_id=user.id,
                title=f"Tư vấn {fake.word()}",
                status=random.choice(["ACTIVE", "COMPLETED", "ARCHIVED"]),
                started_at=fake.date_time_this_month(),
                ended_at=fake.date_time_this_month()
            )
            session.add(chat_sess)
            chat_sessions.append(chat_sess)
            session.flush()
            
            # Create messages for this session
            for _ in range(random.randint(2, 6)):
                msg_user = ChatMessage(
                    session_id=chat_sess.id,
                    sender_type="USER",
                    message_type="TEXT",
                    content=fake.sentence(),
                    created_at=fake.date_time_this_month()
                )
                session.add(msg_user)
                
                msg_ai = ChatMessage(
                    session_id=chat_sess.id,
                    sender_type="ASSISTANT",
                    message_type="TEXT",
                    content=fake.text(max_nb_chars=100),
                    token_count=random.randint(50, 150),
                    created_at=fake.date_time_this_month()
                )
                session.add(msg_ai)
                
    session.flush()
    return chat_sessions

def run_module_5_seed(session: Session, users):
    logger.info("\n[5/8] Seeding AI Chatbot (Module 5)...")
    try:
        chat_sessions = seed_chatbot_data(session, users)
        session.commit()
        logger.info("  ✓ Module 5 seeded successfully.")
        return chat_sessions
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Module 5 seed failed: {e}")
        raise
