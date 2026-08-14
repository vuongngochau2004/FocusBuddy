import random
from datetime import timedelta
from sqlalchemy.orm import Session
from app.seed.utils import fake, logger
from app.models.module_3_learning_activity.study_session import StudySession
from app.models.module_3_learning_activity.study_session_course import StudySessionCourse
from app.models.module_3_learning_activity.study_task import StudyTask
from app.models.module_3_learning_activity.learning_goal import LearningGoal
from app.models.module_3_learning_activity.learning_statistic import LearningStatistic

def seed_learning_activities(session: Session, users, courses):
    logger.info(f"  [>] Seeding learning activities (sessions, tasks, goals, stats)...")
    
    for user in users:
        # 1. Study Sessions & Session Courses
        for _ in range(random.randint(3, 8)):
            start = fake.date_time_between(start_date="-30d", end_date="now")
            duration = random.randint(30, 180)
            end = start + timedelta(minutes=duration)
            
            sess = StudySession(
                user_id=user.id,
                start_time=start,
                end_time=end,
                duration_minutes=duration,
                focus_score=random.randint(50, 100),
                study_method=random.choice(["POMODORO", "DEEP_WORK", "NORMAL"]),
                note=fake.sentence()
            )
            session.add(sess)
            session.flush() # Need sess.id
            
            # Link course to session
            if courses:
                course = random.choice(courses)
                ssc = StudySessionCourse(
                    study_session_id=sess.id,
                    course_id=course.id,
                    time_spent_minutes=duration
                )
                session.add(ssc)
                
        # 2. Study Tasks
        for _ in range(random.randint(2, 5)):
            task = StudyTask(
                user_id=user.id,
                course_id=random.choice(courses).id if courses else None,
                title=f"Làm bài tập {fake.word()}",
                description=fake.text(max_nb_chars=100),
                deadline=fake.date_time_between(start_date="now", end_date="+15d"),
                completed_at=fake.date_time_between(start_date="-15d", end_date="now") if random.choice([True, False]) else None,
                priority=random.choice(["LOW", "MEDIUM", "HIGH"]),
                status=random.choice(["TODO", "IN_PROGRESS", "DONE"])
            )
            session.add(task)
            
        # 3. Learning Goals
        for goal_type in ["HOURS", "SCORE", "TASKS"]:
            goal = LearningGoal(
                user_id=user.id,
                goal_type=goal_type,
                target_value=120 if goal_type == "HOURS" else 10,
                unit="hours" if goal_type == "HOURS" else "tasks",
                start_date=fake.date_this_month(),
                end_date=fake.date_this_month(),
                status=random.choice(["ACTIVE", "ACHIEVED"]),
                title=f"Mục tiêu {goal_type.lower()} của tôi"
            )
            session.add(goal)
            
        # 4. Learning Statistics
        stat = LearningStatistic(
            user_id=user.id,
            period_type="WEEKLY",
            period_start=fake.date_this_month(),
            period_end=fake.date_this_month(),
            total_study_minutes=random.randint(60, 240),
            average_focus_score=round(random.uniform(2.0, 5.0), 2),
            completed_tasks=random.randint(1, 5),
            late_tasks=random.randint(0, 2)
        )
        session.add(stat)
            
    session.flush()

def run_module_3_seed(session: Session, users, courses):
    logger.info("\n[3/8] Seeding Learning Activity (Module 3)...")
    try:
        seed_learning_activities(session, users, courses)
        session.commit()
        logger.info("  ✓ Module 3 seeded successfully.")
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Module 3 seed failed: {e}")
        raise
