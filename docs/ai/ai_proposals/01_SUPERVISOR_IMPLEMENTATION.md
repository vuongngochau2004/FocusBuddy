# CHI TIẾT TRIỂN KHAI MAIN SYSTEM (SUPERVISOR)

Tài liệu này mô tả 3 phương pháp xây dựng hệ thống Router (điều hướng) từ câu chat của User sang đúng Sub-agent, được sắp xếp theo độ ưu tiên khuyến nghị từ cao xuống thấp.

---

## Phương pháp 1: Vector Embeddings (ĐỀ XUẤT SỐ 1)

**Cơ chế:**
Sử dụng một mô hình Embedding siêu nhẹ chuyên để chuyển đổi văn bản thành các vector số. Ta tạo sẵn các "câu mẫu" cho từng Agent. Khi user chat, hệ thống biến câu chat thành vector và dùng công thức toán học (Cosine Similarity) để tìm xem nó giống với mẫu của Agent nào nhất.

**Công nghệ & Mô hình:**
- Thư viện Python: `sentence-transformers`
- Mô hình: **BAAI/bge-m3** hoặc **paraphrase-multilingual-MiniLM-L12-v2** (rất nhẹ, < 500MB).
- Link tải: 
  - [BGE-M3 (HuggingFace)](https://huggingface.co/BAAI/bge-m3)
  - [Multilingual MiniLM (HuggingFace)](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)

**Cách triển khai (Trong Backend `be/`):**
1. Định nghĩa tập dữ liệu mẫu tĩnh (Hardcode Dictionary):
   ```python
   INTENT_SAMPLES = {
       "academic": ["giải bài tập toán", "điểm thấp quá", "làm sao để cải thiện gpa", "hướng dẫn học môn này"],
       "psychology": ["buồn quá", "chán học", "áp lực gia đình", "mệt mỏi, stress"],
       "schedule": ["lên lịch học", "nhắc nhở ngày mai", "tạo to-do list", "pomodoro"]
   }
   ```
2. Dùng `sentence-transformers` embed toàn bộ câu mẫu lúc khởi động Backend.
3. Khi có tin nhắn tới, embed câu chat của user, tính cosine similarity.
4. Trả về tên Agent có điểm tương đồng cao nhất. Nếu điểm quá thấp (vd: < 0.3), chuyển về `General Agent`.

**Ưu điểm:**
- Không gọi LLM -> Không tốn tiền API, không lo đứt mạng.
- Tốc độ cực kỳ nhanh (vài mili-giây trên CPU).
- Hoạt động ổn định 100%, không bao giờ trả về sai định dạng.

**Nhược điểm:**
- Chỉ phân loại được Intent chứ không trích xuất được Keyword phức tạp từ trong câu.

---

## Phương pháp 2: Small LLM + Structured Output Constraints

**Cơ chế:**
Vẫn sử dụng LLM để đọc tin nhắn và sinh ra chuỗi JSON: `{"intent": "...", "keywords": [...]}`. Nhưng để chống việc LLM sinh JSON hỏng, ta ép model chỉ được phép nhả ra đúng cấu trúc đó.

**Công nghệ & Mô hình:**
- Thư viện Python: `instructor` hoặc `outlines` (kết hợp với `Pydantic`).
- Mô hình: **Qwen2.5-1.5B-Instruct** (Chỉ nặng khoảng 1GB VRAM, sinh text cực kỳ bám sát lệnh).
- Link tải: [Qwen2.5-1.5B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF)

**Cách triển khai:**
1. Cấu hình 1 service Ollama / vLLM chạy mô hình Qwen 1.5B riêng biệt với port riêng.
2. Dùng thư viện `instructor` trong Backend:
   ```python
   from pydantic import BaseModel
   import instructor
   from openai import AsyncOpenAI
   
   class IntentExtraction(BaseModel):
       agent_type: Literal["academic", "psychology", "schedule", "general"]
       reason: str
       
   client = instructor.patch(AsyncOpenAI(base_url="http://qwen-1.5b:11434/v1"))
   intent = await client.chat.completions.create(
       model="qwen-1.5b",
       response_model=IntentExtraction,
       messages=[{"role": "user", "content": "Tớ mệt mỏi vì thi trượt môn C++"}]
   )
   ```

**Ưu điểm:**
- Trích xuất được các thông tin phức tạp và giải thích lý do (reasoning).
**Nhược điểm:**
- Phải duy trì thêm 1 model LLM nhỏ trên server. Vẫn có độ trễ (latency khoảng 0.5s - 1s).

---

## Phương pháp 3: Keyword / Regex Matching (Dự phòng)

**Cơ chế:**
Sử dụng câu lệnh `if/else` để dò tìm từ khóa.

**Cách triển khai:**
1. Lập danh sách mảng từ khóa: `psycho_keywords = ["buồn", "nản", "stress", "chán", "áp lực"]`.
2. Kiểm tra `if any(kw in user_msg.lower() for kw in psycho_keywords): return "psychology"`.

**Ưu điểm:** Bằng 0 tài nguyên, dễ code nhất.
**Nhược điểm:** Khá ngốc ngếch. Nếu user nói: "Mình không buồn đâu", hệ thống vẫn bắt chữ "buồn" và gọi Psychology Agent. Không khuyến nghị trừ khi server hoàn toàn kiệt quệ tài nguyên.
