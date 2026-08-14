# Kiến trúc Backend (Backend Architecture)

FocusBuddy sử dụng một Kiến trúc Phân tầng (Layered Architecture) nghiêm ngặt để đảm bảo Phân tách Trách nhiệm (Separation of Concerns) và tính dễ bảo trì.

## Luồng Dữ liệu (The Flow of Data)

```text
HTTP Request
      ↓
API Router      (app/api/v1/)
      ↓
Pydantic Schema (app/schemas/)
      ↓
Service         (app/services/)
      ↓
Repository      (app/repositories/)
      ↓
SQLAlchemy Model(app/models/)
      ↓
PostgreSQL
```

Riêng đối với Module xử lý file (File Processing), hệ thống có thể đi qua một tầng Processor riêng để chuyên môn hóa việc trích xuất (Extraction):
```text
API Router
    ↓
File Service
    ↓
File Processor (TXT, CSV...)
    ↓
Extractor
    ↓
Repository
    ↓
PostgreSQL
```
Việc có thêm tầng File Processor giúp hệ thống chia tách logic đọc nội dung file thô phức tạp khỏi business logic thông thường, dễ dàng mở rộng sang các định dạng phức tạp như PDF, DOCX sau này mà không làm phình to lớp Service.

## Trách nhiệm của các Tầng (Layer Responsibilities)

### 1. Router (`app/api/v1/`)
- Xử lý các HTTP Request và Response.
- Tiêm phụ thuộc (Dependency Injection - ví dụ: lấy Service instance qua `Depends()`).
- Phân tích và validate các HTTP parameters (query, path, headers).
- **Quy tắc**: Routers tuyệt đối không được truy cập trực tiếp vào database hay repository. Chỉ giao tiếp với Services.

### 2. Schema (`app/schemas/`)
- Định nghĩa các đối tượng truyền dữ liệu (DTO - Data Transfer Objects) cho Requests và Responses.
- Được xây dựng bằng Pydantic để tự động validate dữ liệu.
- **Quy tắc**: Schemas phải ẩn đi các thông tin nhạy cảm (như mật khẩu) và ngăn chặn việc lộ trực tiếp các ORM models thô ra client.

### 3. Service (`app/services/`)
- Chứa toàn bộ **Business Logic** (Nghiệp vụ cốt lõi).
- Xử lý quyền sở hữu (Ownership) (ví dụ: đảm bảo user chỉ được cập nhật dữ liệu của chính mình).
- Kiểm tra các ràng buộc khóa ngoại (Foreign Key) theo ngữ cảnh.
- Quản lý transaction (commit, rollback) nếu có nhiều hành động repository xảy ra cùng lúc.
- Ném ra các lỗi HTTP exceptions (`400`, `403`, `404`) nếu vi phạm quy tắc nghiệp vụ.
- **Quy tắc**: Services không được chứa logic liên quan đến HTTP routing.

### 4. Repository (`app/repositories/`)
- Chỉ chịu trách nhiệm về các truy vấn Database thuần túy.
- Dịch các hàm đơn giản (như `get_by_id`, `get_all()`) thành các lệnh truy vấn SQLAlchemy ORM.
- **Quy tắc**: Repositories KHÔNG ĐƯỢC chứa business logic hay ném lỗi HTTP. Chỉ trả về dữ liệu hoặc `None`.

### 5. Model (`app/models/`)
- Bản thiết kế chính thức (Nguồn Sự thật) cho cấu trúc database PostgreSQL.
- Sử dụng cú pháp của SQLAlchemy 2.0 (`Mapped`, `mapped_column`).
- Định nghĩa các mối quan hệ (Relationships) như One-to-Many, Many-to-One.
