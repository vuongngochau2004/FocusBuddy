# TỔNG QUAN CHIẾN LƯỢC TRIỂN KHAI AI CHO FOCUSBUDDY
**(Dành cho hệ thống có năng lực LLM giới hạn)**

## 1. Đặt vấn đề
Hệ thống FocusBuddy đang chuyển dịch sang kiến trúc **Multi-Agent (Supervisor - Worker)**. Tuy nhiên, rào cản lớn nhất hiện tại là mô hình LLM (Large Language Model) được cung cấp có **năng lực suy luận (reasoning) và trí nhớ ngữ cảnh (context window) khá yếu**.

Nếu áp dụng rập khuôn các kiến trúc Agent hiện đại (vốn được thiết kế cho GPT-4 hoặc Claude 3.5), hệ thống sẽ gặp các rủi ro:
- **Độ trễ cao (High Latency):** Phải đợi LLM phân tích Intent xong mới chuyển tới Agent trả lời.
- **Lỗi Format (Hallucination):** Supervisor LLM sinh ra JSON sai cấu trúc làm sập luồng điều hướng.
- **Mất trí nhớ ngữ cảnh:** Đưa quá nhiều thông tin vào prompt khiến Sub-agent trả lời sai trọng tâm hoặc nhầm lẫn vai trò.

## 2. Hướng tiếp cận giải quyết
Để vượt qua giới hạn của LLM hiện tại, chiến lược tổng thể là **"Bù đắp năng lực AI bằng Kỹ thuật phần mềm (Software Engineering)"**. Cụ thể:

1. **Với Main System (Supervisor/Router):** Giảm thiểu tối đa sự phụ thuộc vào LLM. Chuyển sang sử dụng các thuật toán **NLP truyền thống** hoặc **Embeddings siêu nhẹ**.
2. **Với Sub-agents (Workers):** Dồn toàn bộ sức mạnh LLM cho lớp này, kết hợp với các kỹ thuật **Few-shot Prompting** (Cho ví dụ mẫu) và **Strict Context** (Ép ngữ cảnh hẹp).

---

## 3. Phân tích & Đề xuất phương án cho Supervisor (Main System)

Có 3 phương pháp chính để làm hệ thống phân loại Intent (Router) từ câu chat của người dùng.

| Phương pháp | Tốc độ | Độ chính xác | Tài nguyên phần cứng | Khả năng mở rộng |
| :--- | :--- | :--- | :--- | :--- |
| **1. Keyword & Regex** | Siêu tốc (0s) | Thấp (Dễ bị lừa) | Bằng 0 | Kém (Khó maintain khi nhiều rule) |
| **2. Vector Embeddings** | Cực nhanh (<0.1s)| Khá Cao | Rất thấp (CPU chạy mượt) | Tốt (Chỉ cần thêm câu mẫu) |
| **3. Small LLM (JSON)** | Chậm (~1-2s) | Rất cao | Yêu cầu VRAM/GPU | Tốt |

### Khuyến nghị phương án chốt (Final Decision)
**Ưu tiên số 1: Sử dụng Phương pháp 2 (Vector Embeddings + Cosine Similarity).**
- **Lý do:** Phương pháp này cân bằng hoàn hảo giữa **Tốc độ** và **Sự thông minh**. Thay vì bắt LLM nặng nề ngồi đọc và phân tích, ta chỉ cần chuyển câu chat của học sinh thành một vector số học, và so sánh nó với các "câu mẫu" đã gán sẵn cho từng Sub-agent. Nó chạy được trực tiếp trên RAM/CPU của Backend mà không cần gọi qua server AI, tiết kiệm 100% quota LLM cho các Sub-agent trả lời.
- Chi tiết triển khai xem tại: `01_SUPERVISOR_IMPLEMENTATION.md`

Nếu bắt buộc phải dùng LLM cho Supervisor để linh hoạt hơn trong việc trích xuất Keywords, hãy áp dụng Phương pháp 3 nhưng sử dụng kỹ thuật **Structured Output Constraint** với mô hình 1.5B (Siêu nhẹ).

---

## 4. Phân tích & Đề xuất phương án cho Sub-agents

Sub-agents là nơi bắt buộc phải sử dụng LLM để sinh ra câu trả lời tự nhiên. 

### Khuyến nghị phương án chốt
- **Sử dụng Lượng tử hóa (Quantized GGUF Models):** Vì phần cứng yếu, bắt buộc phải dùng định dạng GGUF (chạy bằng `llama.cpp` hoặc `Ollama`) để nhét vừa các mô hình 7B-9B vào RAM/VRAM mà không bị out-of-memory.
- **Model khuyên dùng:** Qwen2.5-7B-Instruct-GGUF (Vô địch phân khúc 7B hiện tại về tiếng Việt và logic).
- Chi tiết danh sách model, link tải và các kỹ thuật "Hack" prompt cho model yếu xem tại: `02_SUB_AGENTS_IMPLEMENTATION.md`
