from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from typing import List

from app.models.module_1_user_management.student_profile import StudentProfile
from app.repositories.module_2_academic_management.academic_statistic_repository import AcademicStatisticRepository
from app.models.module_2_academic_management.academic_statistic import AcademicStatistic
from app.models.module_2_academic_management.student_course import StudentCourse

class AcademicPerformanceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AcademicStatisticRepository(db)

    def _get_student_profile(self, user_id: str) -> StudentProfile:
        try:
            uid = UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format")
            
        profile = self.db.query(StudentProfile).filter(StudentProfile.user_id == uid).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Student Profile not found for this user.")
        return profile

    def get_statistics(self, user_id: str, skip: int = 0, limit: int = 100) -> List[AcademicStatistic]:
        profile = self._get_student_profile(user_id)
        return self.repo.get_list(profile.id, skip=skip, limit=limit)

    def get_statistic_by_term(self, user_id: str, term_id: UUID) -> AcademicStatistic:
        profile = self._get_student_profile(user_id)
        stat = self.repo.get_by_term(profile.id, term_id)
        if not stat:
            raise HTTPException(status_code=404, detail="Academic statistic not found for this term.")
        return stat

    def calculate_basic_statistics(self, user_id: str) -> dict:
        """
        Calculates deterministic basic statistics across all grades of the user.
        E.g. total courses, completed courses, average total score.
        """
        profile = self._get_student_profile(user_id)
        grades = self.db.query(StudentCourse).filter(StudentCourse.student_profile_id == profile.id).all()
        
        total_courses = len(grades)
        completed_courses = sum(1 for g in grades if g.status == "PASSED" or g.letter_grade in ["A", "B", "C", "D", "A+", "B+", "C+", "D+"])
        failed_courses = sum(1 for g in grades if g.status == "FAILED" or g.letter_grade == "F")
        
        valid_scores = [g.total_score for g in grades if g.total_score is not None]
        avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
        max_score = max(valid_scores) if valid_scores else 0.0
        min_score = min(valid_scores) if valid_scores else 0.0

        return {
            "total_courses": total_courses,
            "completed_courses": completed_courses,
            "failed_courses": failed_courses,
            "average_score": round(avg_score, 2),
            "highest_score": round(max_score, 2),
            "lowest_score": round(min_score, 2)
        }
