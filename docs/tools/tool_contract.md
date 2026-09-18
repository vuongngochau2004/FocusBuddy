# TOOL CONTRACT & EXAMPLES

Đặc tả giao diện lập trình cho BaseTool và các công cụ mẫu.

## 1. BaseTool Interface
Mọi Tool trong hệ thống phải kế thừa từ `BaseTool`.

```python
from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseTool(ABC):
    name: str
    description: str
    input_schema: Dict[str, Any]
    
    @abstractmethod
    async def validate(self, input_data: Dict[str, Any]) -> bool:
        """Xác thực tham số đầu vào từ LLM."""
        pass
        
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> str:
        """Thực thi logic backend và trả về chuỗi kết quả cho LLM."""
        pass
```

## 2. Tool Examples

### A. Academic
- `grade_analysis(student_id: str, term: str)`: Truy vấn điểm số trung bình.
- `curriculum_lookup(course_code: str)`: Tra cứu học phần.

### B. Schedule
- `calendar_create_event(title: str, start_time: str, end_time: str)`: Tạo sự kiện mới.
- `calendar_delete_event(event_id: str)`: (Cần cấu hình rủi ro) Xóa sự kiện.
- `todo_create(task_name: str, deadline: str)`: Thêm task vào To-do list.

### C. Psychology
- `user_context(student_id: str)`: Tra cứu lịch sử tâm lý của học sinh.

### D. Utility
- `calculator(expression: str)`: Tính toán biểu thức toán học.
