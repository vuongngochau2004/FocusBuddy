# AI & OCR Layer của FocusBuddy

Tài liệu này giới thiệu về AI OCR Service của dự án sau khi refactor.

## 1. Vai trò của AI Layer

Thay vì đóng vai trò làm máy chủ LLM trung gian như trước, AI Layer (`ai/`) hiện tại hoạt động dưới dạng một **Celery Worker** độc lập, chuyên trách cho các tác vụ Document Intelligence (chủ yếu là OCR và trích xuất bảng điểm). Toàn bộ logic LLM Chatbot, Context, và Prompts đã được chuyển sang Backend để tối ưu thời gian phản hồi (Streaming).

## 2. Architecture

Quy trình trích xuất OCR bất đồng bộ (Asynchronous):

```text
User Upload File
        ↓
Backend API (/api/v1/files/upload -> process)
        ↓
Backend đẩy Task vào Redis Queue (ocr_queue)
        ↓
AI Celery Worker (lắng nghe ocr_queue)
        ↓
Tiền xử lý Ảnh (Upscale, Enhance)
        ↓
Vision LLM (Gemini / Custom LLM) hoặc PaddleOCR
        ↓
Trả kết quả JSON về Result Backend (Redis)
        ↓
Backend cập nhật Database
```

## 3. Cấu hình Worker

Worker được cấu hình qua biến môi trường trong Docker:
- `CELERY_BROKER_URL`: Địa chỉ Redis (mặc định `redis://redis:6379/0`).
- `CELERY_RESULT_BACKEND`: Nơi lưu trữ kết quả (mặc định `redis://redis:6379/1`).
- Các biến `LLM_*` cho việc dùng Custom LLM hoặc Gemini OCR.

## 4. Khởi chạy bằng Docker

`ai/` service hiện được chạy thông qua lệnh Celery thay vì uvicorn:
```bash
celery -A app.core.celery_app.celery_app worker -Q ocr_queue --loglevel=info
```
Khởi chạy kèm toàn hệ thống bằng `docker compose up -d`.
