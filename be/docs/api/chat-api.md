# API Chatbot (Chat API)

Module này cung cấp khả năng trò chuyện (Chat) dựa trên Context cá nhân của từng sinh viên. AI sử dụng lịch sử Chat và toàn bộ thông tin (Grade, Profile, Learning Goal) để tư vấn.

---

## 1. Phiên Trò chuyện (Chat Sessions)

### `POST /api/v1/chat/sessions`
**Mục đích**: Khởi tạo một phiên trò chuyện mới.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "title": "Hỏi về cách học Mạng Máy Tính"
}
```
**Dữ liệu phản hồi (Response)**: Trả về đối tượng `ChatSessionResponse` chứa `id`.

### `GET /api/v1/chat/sessions`
**Mục đích**: Lấy lịch sử tất cả các phiên chat của user.
**Headers**: `X-User-Id: <user_uuid>`

---

## 2. Tin nhắn (Chat Messages)

### `POST /api/v1/chat/sessions/{session_id}/messages`
**Mục đích**: Gửi tin nhắn từ User, hệ thống sẽ lưu tin nhắn, build context, gọi AI LLM và lưu/trả về tin nhắn phản hồi của Assistant.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "content": "Làm thế nào để cải thiện điểm số?",
  "message_type": "TEXT"
}
```
**Dữ liệu phản hồi (Response)**: Trả về đối tượng tin nhắn của `ASSISTANT`.

### `GET /api/v1/chat/sessions/{session_id}/messages`
**Mục đích**: Xem lại toàn bộ lịch sử trò chuyện của một phiên cụ thể.
**Headers**: `X-User-Id: <user_uuid>`

---

## Xử lý lỗi
- **404 Not Found**: Xảy ra khi truyền sai `session_id` hoặc truyền `session_id` không thuộc về `user_id`.
