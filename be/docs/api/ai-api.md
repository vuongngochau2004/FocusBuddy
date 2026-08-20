# API Trí tuệ Nhân tạo (AI API & Chatbot)

Module này cung cấp các REST API để giao tiếp với hệ thống Agent V2 của FocusBuddy.
Toàn bộ hệ thống được bảo mật thông qua header `X-User-Id` (được trích xuất từ Token/Session trong thực tế).

---

## 1. Giao tiếp Chatbot (AI Chat)

### `POST /api/v1/chat/message`
**Mục đích**: Gửi tin nhắn đến Agent V2 (General, Academic, Mental Health) và nhận phản hồi, kèm theo việc thực thi công cụ tự động.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "message": "Phân tích điểm số học kỳ này giúp mình"
}
```
**Luồng xử lý nội bộ**:
1. `Supervisor` phân tích câu hỏi bằng SentenceTransformers.
2. Tìm `IntentConfig` phù hợp và tải `AgentConfig`.
3. `AgentRuntime` kích hoạt Tool Loop.
4. LLMProvider giao tiếp với Qwen (local qua Ollama) hoặc Gemma (qua Remote API) để sinh phản hồi.
5. `ToolExecutor` tự động gọi các tool nội bộ như `get_academic_performance` để lấy dữ liệu tĩnh.

**Dữ liệu phản hồi (Response)**:
```json
{
  "id": "chat-id-123",
  "content": "Dựa vào dữ liệu, điểm số học kỳ này của bạn là...",
  "role": "assistant"
}
```

---

## 2. Phân tích Học tập (AI Analysis - Báo cáo tổng hợp)
*(Tương lai - Hoạt động tương tự Chat nhưng trả về cấu trúc phân tích sâu hơn)*

### `POST /api/v1/ai/analyze`
**Mục đích**: Kích hoạt tiến trình tổng hợp Context và chạy AI LLM để sinh báo cáo, sau đó lưu báo cáo vào Database.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "report_type": "GENERAL",
  "additional_context": "Dạo này em hơi mệt"
}
```
**Dữ liệu phản hồi (Response)**:
```json
{
  "message": "Phân tích thành công",
  "report_id": "uuid"
}
```

### `GET /api/v1/ai/reports`
**Mục đích**: Truy xuất danh sách báo cáo AI mà sinh viên này từng yêu cầu.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `skip` (mặc định 0), `limit` (mặc định 100).
**Dữ liệu phản hồi (Response)**: Mảng chứa các `AIAnalysisResponse`.

### `GET /api/v1/ai/recommendations`
**Mục đích**: Truy xuất danh sách lời khuyên/hành động (Recommendations) được tạo ra từ kết quả của AI.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `skip`, `limit`.
**Dữ liệu phản hồi (Response)**: Mảng chứa các đối tượng `RecommendationResponse`.

---

## Xử lý lỗi (Error Handling)
- **500 Internal Server Error**: Thường xảy ra khi AI Provider timeout hoặc không thể kết nối tới Ollama/Remote API. Lỗi 500 sẽ mô tả thông điệp lỗi hoặc `ModuleNotFoundError` nếu thiếu dependency hệ thống.
- **403 Forbidden**: Trả về nếu Agent bị chặn quyền tra cứu Tool (`ToolExecutor` cấm General Agent gọi Private Tools).
