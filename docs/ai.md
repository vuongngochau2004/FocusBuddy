# AI Layer của FocusBuddy

Tài liệu này giới thiệu về AI Service của dự án (Task 3).

## 1. AI Layer là gì?
AI Layer là một service độc lập được viết bằng FastAPI nằm tại thư mục `ai/`. Nó chịu trách nhiệm giao tiếp với LLM Provider, thiết lập System Prompts, giữ context trò chuyện và định dạng (normalize) các response gửi về cho hệ thống. 

AI Layer không tham gia trực tiếp vào việc lấy thông tin hay xác thực user từ Database, mà nhận dữ liệu đã được xử lý qua Backend (Trong tương lai sẽ giao tiếp thông qua Redis).

## 2. Architecture
Quy trình hiện tại của một API Request cho AI Chatbot:

```text
Chat API (/api/v1/chat)
        ↓
Chatbot Service
        ↓
Prompt Builder (System Prompt + History + User Message)
        ↓
LLM Client (OpenAICompatibleProvider)
        ↓
LLM Provider
```

## 3. Environment variables
- `LLM_BASE_URL`: API Base URL của Provider hỗ trợ định dạng OpenAI API (Ví dụ: `http://llm.example.com/v1`).
- `LLM_API_KEY`: Key truy cập nếu có.
- `LLM_MODEL`: Tên của model (Ví dụ: `gpt-4`, `gemma-4-e4b-it`).
- `LLM_TIMEOUT`: Giới hạn thời gian timeout request (mặc định 60s).

## 4. Chạy AI service
AI service được đóng gói trong container và định nghĩa thông qua `docker-compose.yml` (service `ai`). Service hoạt động mặc định ở cổng host `8100`.

## 5. Test API
Trải nghiệm AI service hoàn toàn độc lập thông qua giao diện Swagger UI tại đường dẫn:
```text
http://localhost:8100/docs
```

## 6. Error handling
Tất cả lỗi từ provider đều được map vào HTTPException với HTTP Status tương ứng:
- `401`: Lỗi API Key hoặc chứng thực.
- `429`: Quá giới hạn gọi API (Rate Limit).
- `504`: Yêu cầu gửi bị Timeout.
- `502`: Lỗi chung khi làm việc với LLM Provider.

## 7. Conversation context
Service có khả năng giữ ngữ cảnh (history). Backend sẽ gửi lên mảng các object `conversation`. AI Service sẽ tự động cắt bớt lịch sử (Truncation) thông qua tham số `max_context_messages` (hiện tại là 20) trước khi tạo Prompt để chống tràn token context window.

## 8. Docker
`Dockerfile` độc lập ở `ai/Dockerfile`, sử dụng base `python:3.11-slim`, chạy FastAPI app với `uvicorn` trên `0.0.0.0:8100`.

## 9. Future Redis integration
Trong Task 4 sắp tới, hệ thống sẽ được mở rộng để Backend thay vì gọi trực tiếp tới FastAPI qua HTTP thì sẽ đẩy messages lên kênh Redis Queue và một `Redis Consumer` thuộc AI Layer sẽ lắng nghe, xử lý logic tương tự Chatbot Service, sau đó đẩy response trở lại Result Queue trên Redis.
