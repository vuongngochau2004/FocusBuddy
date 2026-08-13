import random
from datetime import timedelta
from sqlalchemy.orm import Session
from app.seed.utils import fake, logger
from app.models.module_2_academic_management.academic_term import AcademicTerm
from app.models.module_2_academic_management.course import Course
from app.models.module_2_academic_management.curriculum import Curriculum
from app.models.module_2_academic_management.curriculum_course import CurriculumCourse
from app.models.module_2_academic_management.course_prerequisite import CoursePrerequisite
from app.models.module_2_academic_management.student_course import StudentCourse
from app.models.module_2_academic_management.academic_statistic import AcademicStatistic
from app.models.module_2_academic_management.degree_progress import DegreeProgress
from app.models.module_1_user_management.student_profile import StudentProfile

def seed_academic_terms(session: Session, count: int = 4):
    logger.info(f"  [>] Seeding {count} academic terms...")
    terms_created = []
    
    start_date = fake.date_between(start_date='-2y', end_date='today')
    for i in range(count):
        term = AcademicTerm(
            display_name=f"Học kỳ {i%2 + 1} - 202{3 + i//2}",
            academic_year=f"202{3 + i//2}-202{4 + i//2}",
            semester_type="REGULAR" if i%3 != 2 else "SUMMER",
            start_date=start_date,
            end_date=start_date + timedelta(days=120)
        )
        session.add(term)
        terms_created.append(term)
        start_date += timedelta(days=150)
        
    session.flush()
    return terms_created

def seed_courses(session: Session, majors, count_per_major: int = 5):
    logger.info(f"  [>] Seeding courses...")
    courses_created = []
    
    for major in majors:
        for i in range(count_per_major):
            course = Course(
                major_id=major.id,
                course_code=f"{major.code.replace('-', '')}{1000 + i}",
                course_name=f"Môn học {fake.job()} {i}",
                credits=random.choice([2, 3, 4]),
                course_type=random.choice(["COMPULSORY", "ELECTIVE"]),
                description=fake.text(max_nb_chars=100)
            )
            session.add(course)
            courses_created.append(course)
            
    session.flush()
    return courses_created

def seed_curriculums(session: Session, majors):
    logger.info(f"  [>] Seeding curriculums...")
    curriculums_created = []
    
    for major in majors:
        curriculum = Curriculum(
            major_id=major.id,
            name=f"Chương trình chuẩn {major.name}",
            code=f"CT-{major.code}",
            admission_year=random.choice([2021, 2022, 2023]),
            total_credits=120,
            description=fake.text()
        )
        session.add(curriculum)
        curriculums_created.append(curriculum)
        
    session.flush()
    return curriculums_created

def seed_student_academic_records(session: Session, terms, courses, curriculums):
    logger.info(f"  [>] Seeding student academic records (student_courses, stats, progress)...")
    
    # Get all student profiles to seed academic records
    profiles = session.query(StudentProfile).all()
    
    for profile in profiles:
        # 1. Degree Progress
        progress = DegreeProgress(
            student_profile_id=profile.id,
            required_credits=120,
            completed_credits=random.randint(10, 100),
        )
        progress.remaining_credits = progress.required_credits - progress.completed_credits
        session.add(progress)
        
        # 2. Student Courses
        enrolled_courses = random.sample(courses, min(len(courses), random.randint(3, 8)))
        for course in enrolled_courses:
            term = random.choice(terms)
            score_process = round(random.uniform(5.0, 10.0), 1)
            score_midterm = round(random.uniform(4.0, 10.0), 1)
            score_final = round(random.uniform(4.0, 10.0), 1)
            total = (score_process * 0.2) + (score_midterm * 0.3) + (score_final * 0.5)
            
            sc = StudentCourse(
                student_profile_id=profile.id,
                course_id=course.id,
                academic_term_id=term.id,
                score_process=score_process,
                score_midterm=score_midterm,
                score_final=score_final,
                total_score=round(total, 1),
                letter_grade="A" if total >= 8.5 else ("B" if total >= 7.0 else "C"),
                grade_point=4.0 if total >= 8.5 else (3.0 if total >= 7.0 else 2.0),
                status="PASSED" if total >= 4.0 else "FAILED",
                attempt_number=1
            )
            session.add(sc)
            
        # 3. Academic Statistic
        term = random.choice(terms)
        stat = AcademicStatistic(
            student_profile_id=profile.id,
            semester_id=term.id,
            semester_gpa=round(random.uniform(2.5, 4.0), 2),
            cumulative_gpa=round(random.uniform(2.5, 4.0), 2),
            total_credits=random.randint(15, 20),
            completed_credits=random.randint(10, 20),
            failed_courses=random.randint(0, 2),
            rank=random.choice(["Xuất sắc", "Giỏi", "Khá", "Trung bình"])
        )
        session.add(stat)
        
    session.flush()

def run_module_2_seed(session: Session, majors):
    logger.info("\n[2/8] Seeding Academic Management (Module 2)...")
    try:
        terms = seed_academic_terms(session)
        courses = seed_courses(session, majors)
        curriculums = seed_curriculums(session, majors)
        seed_student_academic_records(session, terms, courses, curriculums)
        session.commit()
        logger.info("  ✓ Module 2 seeded successfully.")
        return terms, courses, curriculums
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Module 2 seed failed: {e}")
        raise
