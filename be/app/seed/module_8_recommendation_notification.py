import random
from sqlalchemy.orm import Session
from app.seed.utils import fake, logger
from app.models.module_8_recommendation_notification.recommendation import Recommendation
from app.models.module_8_recommendation_notification.notification import Notification

def seed_recommendations_notifications(session: Session, users):
    logger.info(f"  [>] Seeding recommendations and notifications...")
    
    for user in users:
        # 1. Recommendations
        for _ in range(random.randint(2, 5)):
            rec = Recommendation(
                user_id=user.id,
                category=random.choice(["ACADEMIC", "LEARNING_HABIT", "MENTAL_HEALTH", "TIME_MANAGEMENT", "GENERAL"]),
                title=fake.catch_phrase(),
                content=fake.sentence(),
                priority=random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
                user_action_status=random.choice(["PENDING", "IN_PROGRESS", "COMPLETED", "DISMISSED"])
            )
            session.add(rec)
            
        # 2. Notifications
        for _ in range(random.randint(5, 15)):
            is_read = random.choice([True, False])
            noti = Notification(
                user_id=user.id,
                notification_type=random.choice(["SYSTEM", "RECOMMENDATION", "REMINDER", "ACADEMIC", "MENTAL_HEALTH"]),
                title=fake.catch_phrase(),
                content=fake.sentence(),
                is_read=is_read,
                read_at=fake.date_time_this_month() if is_read else None
            )
            session.add(noti)

def run_module_8_seed(session: Session, users):
    logger.info("\n[8/8] Seeding Recommendations & Notifications (Module 8)...")
    try:
        seed_recommendations_notifications(session, users)
        session.commit()
        logger.info("  ✓ Module 8 seeded successfully.")
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Module 8 seed failed: {e}")
        raise
