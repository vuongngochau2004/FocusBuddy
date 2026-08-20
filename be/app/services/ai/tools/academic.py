import json
from typing import Dict, Any

from app.core.database import SessionLocal
from app.services.ai.tools.base import BaseTool
from app.services.academic_performance_service import AcademicPerformanceService
from app.services.learning_goal_service import LearningGoalService

class GetAcademicPerformanceTool(BaseTool):
    name = "get_academic_performance"
    description = "Lấy thông tin tổng quan về kết quả học tập (điểm số, số tín chỉ, môn đã học) của sinh viên hiện tại."
    input_schema = {
        "type": "object",
        "properties": {},
        "required": []
    }

    async def validate(self, input_data: Dict[str, Any]) -> bool:
        return True

    async def execute(self, input_data: Dict[str, Any], user_id: str = None) -> str:
        if not user_id:
            return "Lỗi: Không tìm thấy ID người dùng."
            
        db = SessionLocal()
        try:
            service = AcademicPerformanceService(db)
            stats = service.calculate_basic_statistics(user_id)
            return json.dumps(stats, ensure_ascii=False)
        except Exception as e:
            return f"Không thể lấy dữ liệu học tập: {str(e)}"
        finally:
            db.close()


class GetLearningGoalsTool(BaseTool):
    name = "get_learning_goals"
    description = "Lấy danh sách các mục tiêu học tập (learning goals) của sinh viên hiện tại."
    input_schema = {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "description": "Số lượng mục tiêu cần lấy (mặc định 5)"
            }
        },
        "required": []
    }

    async def validate(self, input_data: Dict[str, Any]) -> bool:
        if "limit" in input_data and not isinstance(input_data["limit"], int):
            raise ValueError("Tham số 'limit' phải là số nguyên.")
        return True

    async def execute(self, input_data: Dict[str, Any], user_id: str = None) -> str:
        if not user_id:
            return "Lỗi: Không tìm thấy ID người dùng."
            
        limit = input_data.get("limit", 5)
        
        db = SessionLocal()
        try:
            service = LearningGoalService(db)
            goals, _ = service.get_all(user_id, skip=0, limit=limit)
            
            if not goals:
                return "Sinh viên chưa có mục tiêu học tập nào."
                
            results = []
            for g in goals:
                results.append({
                    "id": str(g.id),
                    "title": g.title,
                    "target_date": g.target_date.isoformat() if g.target_date else None,
                    "status": g.status,
                    "priority": g.priority
                })
            return json.dumps(results, ensure_ascii=False)
        except Exception as e:
            return f"Không thể lấy danh sách mục tiêu học tập: {str(e)}"
        finally:
            db.close()
