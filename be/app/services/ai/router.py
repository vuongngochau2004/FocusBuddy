import os
from sentence_transformers import SentenceTransformer, util

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
    
    # Sử dụng Singleton pattern để model chỉ được load 1 lần duy nhất vào RAM
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(IntentRouter, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
        
    def _initialize(self):
        # Sử dụng model siêu nhẹ, hỗ trợ đa ngôn ngữ (bao gồm tiếng Việt)
        model_name = os.getenv("ROUTER_EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
        print(f"Loading embedding model '{model_name}' for Intent Router...")
        self.model = SentenceTransformer(model_name)
        
        # Flatten dữ liệu để tính toán vector dễ hơn
        self.sentences = []
        self.labels = []
        for intent, samples in INTENT_SAMPLES.items():
            for text in samples:
                self.sentences.append(text)
                self.labels.append(intent)
                
        # Tiền tính toán toàn bộ vector của các câu mẫu lưu sẵn vào RAM
        print("Pre-computing embeddings for intent samples...")
        self.corpus_embeddings = self.model.encode(self.sentences, convert_to_tensor=True)
        print("Intent Router initialized successfully.")

    def classify_intent(self, user_message: str, threshold: float = 0.4) -> str:
        """
        Nhận vào tin nhắn của user, trả về loại Agent phù hợp nhất.
        Nếu độ tin cậy < threshold, trả về general.
        """
        # Chuyển tin nhắn mới thành vector
        query_embedding = self.model.encode(user_message, convert_to_tensor=True)
        
        # Tính toán độ tương đồng Cosine giữa tin nhắn mới và các câu mẫu
        cos_scores = util.cos_sim(query_embedding, self.corpus_embeddings)[0]
        
        # Lấy ra index của câu mẫu giống nhất
        best_idx = cos_scores.argmax().item()
        best_score = cos_scores[best_idx].item()
        
        if best_score < threshold:
            return "general"
            
        return self.labels[best_idx]

# Để dễ test khi chạy trực tiếp file này
if __name__ == "__main__":
    router = IntentRouter()
    
    test_cases = [
        "Mình đang bị khủng hoảng tâm lý vì rớt môn C++",
        "Chỉ mình cách giải phương trình bậc 2 này với",
        "Lên lịch ôn thi cuối kỳ giúp mình",
        "Xin chào"
    ]
    
    for case in test_cases:
        intent = router.classify_intent(case)
        print(f"Message: '{case}' -> Intent: {intent}")
