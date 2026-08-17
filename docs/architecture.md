# Kiến trúc FocusBuddy

Tài liệu này mô tả kiến trúc tổng quát của hệ thống FocusBuddy.

## 1. Architecture Hiện tại

Hệ thống hiện tại bao gồm các thành phần chính đang hoạt động để phục vụ trực tiếp cho quá trình xử lý logic cũng như thực thi các tác vụ nền.

```text
                    Frontend
                       │
                       ▼
                    Backend
                  /         \
                 ▼           ▼
            PostgreSQL     Redis
                              │
                              ▼
                        Celery Worker
```

- **Frontend**: Giao diện người dùng.
- **Backend**: Xử lý API, logic kinh doanh.
- **PostgreSQL**: Lưu trữ dữ liệu chính.
- **Redis**: Đóng vai trò làm message broker để Backend giao tiếp và gửi task xuống Celery.
- **Celery Worker**: Nhận và xử lý các background task (tác vụ chạy nền).

## 2. Architecture Tương lai (AI Integration)

Hệ thống đang được nâng cấp để tích hợp trí tuệ nhân tạo (AI Service) thông qua **Task 3** (Phát triển AI Layer độc lập) và **Task 4** (Tích hợp Redis).

**Giai đoạn hiện tại (Hoàn thành Task 3):**
AI Service đã được xây dựng hoàn thiện các interface, prompt và LLM provider liên kết. Service này đang chạy độc lập như một server FastAPI.

**Giai đoạn tiếp theo (Dự kiến Task 4):**
Redis integration giữa Backend và AI sẽ được triển khai.

Sơ đồ quy trình cuối cùng:
```text
Frontend
   │
   ▼
Backend
   │
   ├──────────► PostgreSQL
   │
   └──────────► Redis
                   │
                   ├── Celery Worker
                   │
                   └── Future AI communication

AI
 │
 ▼
LLM Provider
```

### AI Service
Trạng thái: Hoàn thành Task 3 (LLM Core).
AI Service có nhiệm vụ:
- Giao tiếp với LLM Provider qua các format chuẩn (như OpenAI API).
- Quản lý Context người dùng, Chatbot prompt.
- Nhận và trả bản tin qua Redis thay vì HTTP (Task 4).
