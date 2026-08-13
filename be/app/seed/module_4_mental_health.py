import random
from sqlalchemy.orm import Session
from app.seed.utils import fake, logger
from app.models.module_4_mental_health.psychological_survey import PsychologicalSurvey
from app.models.module_4_mental_health.emotion_log import EmotionLog
from app.models.module_4_mental_health.mental_assessment import MentalAssessment
from app.models.module_4_mental_health.mental_health_statistic import MentalHealthStatistic

def seed_mental_health_activities(session: Session, users):
    logger.info(f"  [>] Seeding mental health activities...")
    
    # 1. Psychological Surveys
    surveys = []
    survey_data = [
        ("Khảo sát mức độ căng thẳng (DASS-21)", "Đánh giá trầm cảm, lo âu và căng thẳng", 21, 0, 63, "STRESS"),
        ("Đánh giá nguy cơ Burnout", "Đo lường mức độ kiệt sức trong học tập", 15, 15, 75, "BURNOUT")
    ]
    
    for name, desc, q_cnt, min_s, max_s, s_type in survey_data:
        sv = PsychologicalSurvey(
            name=name,
            description=desc,
            survey_type=s_type,
            total_questions=q_cnt,
            score_range_min=min_s,
            score_range_max=max_s,
            is_active=True
        )
        session.add(sv)
        surveys.append(sv)
    
    session.flush()
    
    for user in users:
        # 2. Emotion Logs
        for _ in range(random.randint(5, 10)):
            emotion = EmotionLog(
                user_id=user.id,
                emotion=random.choice(["HAPPY", "SAD", "STRESSED", "ANXIOUS", "NEUTRAL"]),
                stress_level=random.randint(1, 10),
                motivation_level=random.randint(1, 10),
                energy_level=random.randint(1, 10),
                note=fake.sentence(),
                recorded_at=fake.date_time_this_month()
            )
            session.add(emotion)
            
        # 3. Mental Assessments
        for sv in surveys:
            if random.choice([True, False]):
                assessment = MentalAssessment(
                    user_id=user.id,
                    assessment_type=random.choice(["DAILY_CHECK", "WEEKLY_CHECK", "MONTHLY_CHECK", "AI_ANALYSIS"]),
                    stress_score=round(random.uniform(0, 100), 2),
                    anxiety_score=round(random.uniform(0, 100), 2),
                    burnout_score=round(random.uniform(0, 100), 2),
                    risk_level=random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
                    summary="Cần chú ý nghỉ ngơi",
                    recommendation="AI đề xuất phương pháp thư giãn tĩnh tâm."
                )
                session.add(assessment)
                
        # 4. Mental Health Statistics
        stat = MentalHealthStatistic(
            user_id=user.id,
            period_type="MONTHLY",
            period_start=fake.date_this_month(),
            period_end=fake.date_this_month(),
            average_stress_score=round(random.uniform(1.0, 10.0), 2),
            average_motivation_level=round(random.uniform(1.0, 10.0), 2),
            average_energy_level=round(random.uniform(1.0, 10.0), 2)
        )
        session.add(stat)
        
    session.flush()

def run_module_4_seed(session: Session, users):
    logger.info("\n[4/8] Seeding Mental Health (Module 4)...")
    try:
        seed_mental_health_activities(session, users)
        session.commit()
        logger.info("  ✓ Module 4 seeded successfully.")
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Module 4 seed failed: {e}")
        raise
