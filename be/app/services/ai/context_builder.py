from sqlalchemy.orm import Session
from uuid import UUID

from app.models.module_1_user_management.student_profile import StudentProfile
from app.models.module_2_academic_management.student_course import StudentCourse
from app.models.module_3_learning_activity.learning_goal import LearningGoal

class AIContextBuilder:
    def __init__(self, db: Session, user_id: UUID):
        self.db = db
        self.user_id = user_id

    def build_general_context(self) -> str:
        profile = self.db.query(StudentProfile).filter(StudentProfile.user_id == self.user_id).first()
        if not profile:
            return "Dữ liệu người dùng: Không có thông tin."
        
        context = f"Thông tin sinh viên: MSSV {profile.student_code}, Mục tiêu nghề nghiệp: {profile.career_goal}. "
        
        # Get some grades
        grades = self.db.query(StudentCourse).filter(StudentCourse.student_profile_id == profile.id).limit(5).all()
        if grades:
            context += "Môn học gần đây: "
            for g in grades:
                context += f"Môn ID {g.course_id} - Điểm tổng kết: {g.total_score}. "
                
        # Get goals
        goals = self.db.query(LearningGoal).filter(LearningGoal.user_id == self.user_id).limit(3).all()
        if goals:
            context += "Mục tiêu học tập: "
            for g in goals:
                context += f"{g.title} ({g.status}). "
                
        return context

    def build_academic_context(self) -> str:
        profile = self.db.query(StudentProfile).filter(StudentProfile.user_id == self.user_id).first()
        if not profile:
            return "Dữ liệu học thuật: Không có thông tin."
        
        context = f"Thông tin học thuật: Mục tiêu GPA: {profile.target_gpa}. "
        grades = self.db.query(StudentCourse).filter(StudentCourse.student_profile_id == profile.id).all()
        if grades:
            total = len(grades)
            passed = sum(1 for g in grades if getattr(g, 'status', None) == 'PASSED')
            context += f"Đã học {total} môn, qua môn {passed} môn. "
        return context

    def build_mental_context(self) -> str:
        # In a real scenario, this would query emotion_logs and mental_assessments
        return "Dữ liệu tâm lý: Gần đây không có bất thường tâm lý."
