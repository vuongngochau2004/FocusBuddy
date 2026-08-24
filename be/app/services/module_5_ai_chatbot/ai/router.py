import os

# Dữ liệu mẫu cực kỳ quan trọng để "dạy" Router
INTENT_SAMPLES = {
    "academic": [
        "giải giúp bài tập toán",
        "hướng dẫn làm bài tập này",
        "tại sao điểm số của mình lại thấp",
        "làm sao để cải thiện gpa",
        "môn học này khó hiểu quá",
        "tư vấn lộ trình học tập",
        "bài toán đạo hàm",
        "làm thế nào để học thuộc từ vựng tiếng anh"
    ],
    "psychology": [
        "mình cảm thấy mệt mỏi quá",
        "áp lực gia đình lớn quá",
        "buồn chán",
        "chẳng có động lực học",
        "stress quá, muốn bỏ cuộc",
        "cảm thấy cô đơn ở trường",
        "bạn bè xa lánh mình",
        "chán nản",
        "tuyệt vọng"
    ],
    "schedule": [
        "lên lịch học cho ngày mai",
        "tạo to-do list giúp mình",
        "nhắc nhở mình làm bài",
        "thiết lập pomodoro",
        "hôm nay mình phải làm gì",
        "thêm sự kiện vào lịch",
        "quản lý thời gian",
        "sắp xếp công việc"
    ],
    "general": [
        "chào bạn",
        "bạn là ai",
        "bạn có thể làm gì",
        "kể chuyện cười đi",
        "hôm nay thời tiết thế nào",
        "cảm ơn",
        "chúc ngủ ngon",
        "hello"
    ]
}

class IntentRouter:
    _instance = None
    
    # Sử dụng Singleton pattern
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(IntentRouter, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
        
    def _initialize(self):
        print("Intent Router initialized successfully (keyword matching mode).")

    def classify_intent(self, user_message: str, threshold: float = 0.4) -> str:
        """
        Nhận vào tin nhắn của user, trả về loại Agent phù hợp nhất.
        Sử dụng so khớp từ khóa đơn giản.
        """
        user_msg_lower = user_message.lower()
        
        # Thử tìm xem có từ khóa nào của các intent khớp với tin nhắn không
        for intent, samples in INTENT_SAMPLES.items():
            for text in samples:
                text_lower = text.lower()
                # Có thể làm logic tìm kiếm mềm hơn, ở đây ta dùng substring đơn giản
                if text_lower in user_msg_lower or user_msg_lower in text_lower:
                    return intent
        
        return "general"

# Để dễ test khi chạy trực tiếp file này
if __name__ == "__main__":
    router = IntentRouter()
    
    test_cases = [
        "Mình đang bị khủng hoảng tâm lý vì rớt môn C++",
        "Chỉ mình cách giải phương trình bậc 2 này với",
        "Lên lịch ôn thi cuối kỳ giúp mình",
        "Xin chào",
        "buồn chán"
    ]
    
    for case in test_cases:
        intent = router.classify_intent(case)
        print(f"Message: '{case}' -> Intent: {intent}")
