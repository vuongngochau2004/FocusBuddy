# FocusBuddy

## 1. Giới thiệu

FocusBuddy là hệ thống hỗ trợ học tập hiện đại.

## 2. Kiến trúc

Hệ thống được thiết kế theo mô hình client-server, sử dụng cơ sở dữ liệu quan hệ và hệ thống background task qua message broker. 
Cụ thể, ứng dụng bao gồm Frontend giao tiếp với Backend API, được quản lý và xử lý dữ liệu qua PostgreSQL và Redis (với Celery). AI Service đang được triển khai như một module độc lập (Task 3) và sẽ giao tiếp qua Redis (Task 4).

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

## 3. Công nghệ

Dự án hiện đang sử dụng các công nghệ sau:
- **Frontend**: Next.js
- **Backend**: FastAPI
- **Cơ sở dữ liệu**: PostgreSQL
- **Message Broker / Cache**: Redis
- **Background Task**: Celery
- **Containerization**: Docker & Docker Compose

## 4. Yêu cầu

- Docker
- Docker Compose

## 5. Cài đặt

1. Clone kho lưu trữ về máy:
   ```bash
   git clone <repository_url>
   cd FocusBuddy
   ```
2. Copy template biến môi trường (environment variables):
   ```bash
   cp .env.example .env
   ```
3. Chỉnh sửa file `.env` với các cấu hình phù hợp (mật khẩu, port,...).

## 6. Chạy Docker

Khởi động toàn bộ hệ thống bằng Docker Compose:
```bash
docker compose up --build -d
```
Sau đó, bạn có thể truy cập:
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

## 7. Development

Môi trường development đã được cấu hình hot reload cho cả Frontend và Backend khi chạy bằng Docker. Mọi thay đổi trong mã nguồn (trong thư mục `fe/` và `be/`) sẽ tự động được phản ánh mà không cần build lại toàn bộ container (tuỳ thuộc vào file cấu hình `docker-compose.yml`).

## 8. Documentation

Để tìm hiểu chi tiết về từng thành phần, vui lòng xem tài liệu tại thư mục `docs/`:

- [Tài liệu tổng hợp (Documentation Index)](docs/README.md)
- [Kiến trúc (Architecture)](docs/architecture.md)
- [Docker](docs/docker.md)
- [Backend](docs/backend.md)
- [Frontend](docs/frontend.md)
- [Redis](docs/redis.md)
- [Celery](docs/celery.md)
