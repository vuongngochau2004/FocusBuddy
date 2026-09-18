# Kiến trúc Backend (Backend Architecture)

FocusBuddy sử dụng một Kiến trúc Phân tầng (Layered Architecture) kết hợp với cấu trúc phân rã theo tên miền (Domain-Driven Structure) để đảm bảo Phân tách Trách nhiệm (Separation of Concerns) và tính dễ bảo trì.

## Cấu trúc Thư mục (Domain-Driven Modules)

Kể từ Phase 6.5, các thành phần `schemas`, `repositories`, và `services` được phân rã thành 8 module chính tương đồng với `models`:
- `module_1_user_management/` (Quản lý người dùng, Trường, Ngành)
- `module_2_academic_management/` (Môn học, Khóa học, Kỳ học, Điểm số)
- `module_3_learning_activity/` (Mục tiêu học tập, Phiên học, Task)
- `module_4_mental_health/` (Theo dõi tâm lý, đánh giá)
- `module_5_ai_chatbot/` (Hệ thống AI, Agent V2)
- `module_6_ai_analysis/` (Tổng hợp báo cáo phân tích)
- `module_7_file_processing/` (Xử lý file CSV/TXT)
- `module_8_recommendation_notification/` (Khuyến nghị, Thông báo)

## Luồng Dữ liệu (The Flow of Data)

```text
HTTP Request
      ↓
API Router      (app/api/v1/)
      ↓
Pydantic Schema (app/schemas/module_X_...)
      ↓
Service         (app/services/module_X_...)
      ↓
Repository      (app/repositories/module_X_...)
      ↓
SQLAlchemy Model(app/models/module_X_...)
      ↓
PostgreSQL
```

### Module Xử lý File (File Processing)
```text
API Router
    ↓
File Service
    ↓
File Processor (TXT, CSV)
    ↓
Repository
    ↓
PostgreSQL
```

### Module Trợ lý AI (Agent System V2)
Luồng dữ liệu của AI Agent được thiết kế theo mô hình State Machine an toàn:
```text
API Router (Chat/Analyze)
    ↓
Supervisor (Sử dụng SentenceTransformers cosine similarity để phát hiện Intent)
    ↓
IntentConfig (Lấy AgentConfig tương ứng từ Database)
    ↓
ContextBuilder & PromptBuilder (Lắp ráp Context dựa trên strategy)
    ↓
AgentRuntime (Vòng lặp Tool Loop an toàn)
    ├── LLMProvider (Cô lập hoàn toàn khỏi Ollama/Remote API)
    └── ToolRegistry & ToolExecutor (Gọi Service Nội bộ, giới hạn quyền)
          ↓
      PostgreSQL (Thông qua Services/Repositories)
```
- **Agent V2**: Hệ thống không còn sử dụng các Agent kế thừa tĩnh (như V1). Thay vào đó, một `AgentRuntime` duy nhất sẽ đại diện cho bất kỳ Agent nào (General, Academic, Mental Health) tùy thuộc vào `AgentConfig` tải từ DB.
- **LLMProvider**: Chịu trách nhiệm chuyển đổi interface chung sang API của nhà cung cấp cụ thể. `OllamaProvider` gọi Qwen local, còn `RemoteProvider` có thể gọi Gemma qua API từ xa. Không còn phụ thuộc OpenAI.
- **Tool Loop**: Bị giới hạn bởi `MAX_TOOL_ITERATIONS`. Công cụ nội bộ (Internal Capabilities) truy xuất dữ liệu từ các Services thay vì chọc thẳng vào Database. Việc gọi công cụ được bảo vệ chặt chẽ bằng tham số `user_id` từ Backend context, không tin tưởng nội dung do LLM tạo ra.

### Luồng Giao tiếp Robot
- **Kiến trúc Robot-First**: Raspberry Pi (Robot FocusBuddy) **KHÔNG ĐƯỢC PHÉP** truy cập trực tiếp vào PostgreSQL.
- Tất cả giao tiếp phải thông qua HTTP REST API của Backend (`/api/v1/...`).

### Luồng Nhắc nhở (Reminder/Scheduler)
- Agent chỉ có chức năng đọc/ghi cấu hình hoặc mục tiêu vào Database.
- Việc kích hoạt nhắc nhở định kỳ hoặc báo thức sẽ do một tiến trình Background Worker/Scheduler (như Celery, Cron) độc lập đảm nhiệm, gọi vào hệ thống Notification. Hệ thống AI không tự động giữ kết nối để báo giờ.

## Trách nhiệm của các Tầng (Layer Responsibilities)

### 1. Router (`app/api/v1/`)
- Xử lý các HTTP Request và Response.
- Tiêm phụ thuộc (Dependency Injection).
- **Quy tắc**: Tuyệt đối không truy cập database.

### 2. Schema (`app/schemas/`)
- Pydantic DTO (Data Transfer Objects).
- Ẩn thông tin nhạy cảm.

### 3. Service (`app/services/`)
- Chứa toàn bộ **Business Logic**.
- Xử lý quyền sở hữu (Ownership).
- Quản lý Transaction, ném lỗi HTTP.
- **Quy tắc**: Không chứa logic HTTP routing.

### 4. Repository (`app/repositories/`)
- Dịch các hàm nghiệp vụ thành truy vấn SQLAlchemy.
- **Quy tắc**: Không chứa Business Logic hoặc HTTP Exception.

### 5. Model (`app/models/`)
- Bản thiết kế chính thức cấu trúc database bằng SQLAlchemy 2.0.
