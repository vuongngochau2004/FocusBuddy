from sqlalchemy.orm import Session
from uuid import UUID

from app.services.user_service import UserService
from app.services.academic_performance_service import AcademicPerformanceService
from app.services.learning_goal_service import LearningGoalService

class AIContextBuilder:
    """
    Chịu trách nhiệm xây dựng ngữ cảnh (Context) dựa trên strategy.
    Sử dụng các Service nội bộ để lấy dữ liệu, KHÔNG query DB trực tiếp bằng SQLAlchemy.
    """
    def __init__(self, db: Session, user_id: UUID):
        self.db = db
        self.user_id = user_id
        
        self.user_service = UserService(db)
        self.academic_service = AcademicPerformanceService(db)
        self.goal_service = LearningGoalService(db)

    def build_context(self, strategy: str) -> str:
        """
        Định tuyến lấy dữ liệu ngữ cảnh tùy thuộc vào cấu hình strategy của Agent.
        """
        if not strategy:
            return ""
            
        strategy = strategy.lower()
        if strategy == "academic":
            return self._build_academic_context()
        elif strategy == "mental_health":
            return self._build_mental_context()
        elif strategy == "general":
            return self._build_general_context()
        
        return ""

    def _build_general_context(self) -> str:
        try:
            user = self.user_service.get_user(self.user_id)
            profile = user.student_profile
            
            context = f"Thông tin sinh viên: MSSV {profile.student_code if profile else 'N/A'}, "
            context += f"Mục tiêu nghề nghiệp: {profile.career_goal if profile else 'N/A'}. "
            
            stats = self.academic_service.calculate_basic_statistics(str(self.user_id))
            context += f"Đã học {stats.get('total_courses', 0)} môn. Điểm trung bình: {stats.get('average_score', 0)}. "
            
            goals, _ = self.goal_service.get_all(self.user_id, skip=0, limit=3)
            if goals:
                context += "Mục tiêu học tập: "
                for g in goals:
                    context += f"{g.title} ({g.status}). "
                    
            return context
        except Exception as e:
            return f"Dữ liệu người dùng: Không thể tải ngữ cảnh (Lỗi: {str(e)})"

    def _build_academic_context(self) -> str:
        try:
            user = self.user_service.get_user(self.user_id)
            profile = user.student_profile
            
            context = f"Thông tin học thuật: Mục tiêu GPA: {profile.target_gpa if profile else 'N/A'}. "
            
            stats = self.academic_service.calculate_basic_statistics(str(self.user_id))
            context += f"Tổng số môn: {stats.get('total_courses', 0)}, "
            context += f"Qua môn: {stats.get('completed_courses', 0)}, "
            context += f"Trượt: {stats.get('failed_courses', 0)}. "
            context += f"Điểm cao nhất: {stats.get('highest_score', 0)}, Thấp nhất: {stats.get('lowest_score', 0)}. "
            
            return context
        except Exception as e:
            return f"Dữ liệu học thuật: Không thể tải ngữ cảnh (Lỗi: {str(e)})"

    def _build_mental_context(self) -> str:
        return "Dữ liệu tâm lý: Gần đây không có bất thường tâm lý."
