# Backend FocusBuddy

Tài liệu này hướng dẫn tổng quát về thành phần Backend của dự án.

## 1. Công nghệ sử dụng

- **Framework**: Backend sử dụng FastAPI.
- **ORM**: SQLAlchemy.
- **Database Migrations**: Alembic.
- **Ngôn ngữ**: Python.

## 2. Docker và Môi trường

- **Docker**:
  - Service chạy dưới dạng container có tên `backend`.
  - Port nội bộ và host là `8000`. Cổng này nhận các API request được gửi từ phía trình duyệt của người dùng.
  - Hỗ trợ hot reload trong quá trình development nhờ tham số `--reload` của `uvicorn`.

## 3. Database

- **Database chính**: PostgreSQL.
- **Cấu hình**: Chuỗi kết nối được thiết lập thông qua environment variable `DATABASE_URL` nằm trong file cấu hình `be/.env`.

## 4. Message Broker / Background Task

- Hệ thống sử dụng **Redis** kết hợp **Celery** để xử lý các background task thay vì thực thi tác vụ tốn thời gian đồng bộ trên API chính.
- Cấu hình kết nối thông qua các environment variables `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`.

## 5. Tài liệu API

Trong quá trình khởi chạy, FastAPI tự động sinh tài liệu Swagger UI và ReDoc. Mọi người có thể xem và thử nghiệm trực tiếp thông qua:
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`
