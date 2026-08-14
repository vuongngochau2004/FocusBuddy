import random
from sqlalchemy.orm import Session
from app.seed.utils import fake, get_password_hash, logger
from app.models.module_1_user_management.user import User
from app.models.module_1_user_management.university import University
from app.models.module_1_user_management.major import Major
from app.models.module_1_user_management.user_preference import UserPreference
from app.models.module_1_user_management.student_profile import StudentProfile

def seed_users(session: Session, count: int = 15):
    logger.info(f"  [>] Seeding {count} users...")
    pwd_hash = get_password_hash("password123")
    users_created = []
    
    for _ in range(count):
        user = User(
            email=fake.unique.email(),
            password_hash=pwd_hash,
            full_name=fake.name(),
            avatar_url=fake.image_url(),
            phone_number=fake.phone_number()[:20],
            is_active=True
        )
        session.add(user)
        users_created.append(user)
    
    session.flush()
    return users_created

def seed_universities(session: Session, count: int = 3):
    logger.info(f"  [>] Seeding {count} universities...")
    universities_created = []
    
    names = [
        ("Đại học Bách Khoa Hà Nội", "HUST"),
        ("Đại học Bách Khoa TP.HCM", "HCMUT"),
        ("Đại học Khoa học Tự nhiên", "HCMUS"),
        ("Đại học Công nghệ thông tin", "UIT"),
        ("Đại học Bách Khoa Đà Nẵng", "DUT")
    ]
    
    for name, short_name in names[:count]:
        uni = University(
            name=name,
            short_name=short_name,
            address=fake.address(),
            website=f"https://{short_name.lower()}.edu.vn"
        )
        session.add(uni)
        universities_created.append(uni)
    
    session.flush()
    return universities_created

def seed_majors(session: Session, universities, count_per_uni: int = 2):
    logger.info(f"  [>] Seeding majors...")
    majors_created = []
    
    major_data = [
        ("Khoa học Máy tính", "CS"),
        ("Kỹ thuật Phần mềm", "SE"),
        ("Hệ thống Thông tin", "IS"),
        ("Trí tuệ Nhân tạo", "AI"),
        ("An toàn Thông tin", "IA")
    ]
    
    for uni in universities:
        selected_majors = random.sample(major_data, count_per_uni)
        for name, code in selected_majors:
            major = Major(
                university_id=uni.id,
                name=name,
                code=f"{uni.short_name}-{code}",
                description=fake.text(max_nb_chars=100)
            )
            session.add(major)
            majors_created.append(major)
            
    session.flush()
    return majors_created

def seed_user_preferences(session: Session, users):
    logger.info(f"  [>] Seeding user preferences for {len(users)} users...")
    
    for user in users:
        pref = UserPreference(
            user_id=user.id,
            language=random.choice(["vi", "en"]),
            theme=random.choice(["light", "dark", "system"]),
            notification_enabled=random.choice([True, False]),
            email_notification=random.choice([True, False])
        )
        session.add(pref)
    
    session.flush()

def seed_student_profiles(session: Session, users, universities, majors):
    logger.info(f"  [>] Seeding student profiles for {len(users)} users...")
    
    for user in users:
        uni = random.choice(universities)
        uni_majors = [m for m in majors if m.university_id == uni.id]
        major = random.choice(uni_majors) if uni_majors else None
        
        enroll_year = random.choice([2020, 2021, 2022, 2023, 2024])
        academic_year = 2024 - enroll_year + 1
        
        profile = StudentProfile(
            user_id=user.id,
            university_id=uni.id,
            major_id=major.id if major else None,
            student_code=str(fake.unique.random_number(digits=9, fix_len=True)),
            academic_year=academic_year,
            enrollment_year=enroll_year,
            target_gpa=round(random.uniform(2.5, 4.0), 2),
            career_goal=fake.job(),
            bio=fake.text(max_nb_chars=150)
        )
        session.add(profile)
        
    session.flush()

def run_module_1_seed(session: Session):
    logger.info("\n[1/8] Seeding User Management (Module 1)...")
    try:
        users = seed_users(session, count=15)
        universities = seed_universities(session, count=3)
        majors = seed_majors(session, universities, count_per_uni=3)
        seed_user_preferences(session, users)
        seed_student_profiles(session, users, universities, majors)
        session.commit()
        logger.info("  ✓ Module 1 seeded successfully.")
        return users, universities, majors
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Module 1 seed failed: {e}")
        raise
