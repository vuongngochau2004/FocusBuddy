# Docker trong FocusBuddy

## 1. Tổng quan

Docker được sử dụng trong FocusBuddy để chuẩn hóa môi trường phát triển và triển khai hệ thống. Docker đảm nhận chạy các dịch vụ:
- chạy PostgreSQL
- chạy Redis
- chạy Backend
- chạy Celery Worker
- chạy Frontend

Architecture:
```text
Frontend
   ↓
Backend
   ├── PostgreSQL
   └── Redis
          ↓
      Celery Worker
```

## 2. Danh sách Service

| Service       | Container  | Cổng nội bộ |      Cổng máy host | Chức năng            |
| ------------- | ---------- | ----------: | -----------------: | -------------------- |
| db            | PostgreSQL |        5432 | `${POSTGRES_PORT}` | Cơ sở dữ liệu        |
| redis         | Redis      |        6379 |    `${REDIS_PORT}` | Message broker/cache |
| backend       | FastAPI    |        8000 |  `${BACKEND_PORT}` | Backend API          |
| celery_worker | Celery     |           - |                  - | Background task      |
| frontend      | Frontend   |        3000 | `${FRONTEND_PORT}` | Giao diện web        |

## 3. Cấu hình môi trường

Hệ thống được cấu hình qua các file môi trường. Xin lưu ý phân biệt:

- **Root `.env`** (nằm ở thư mục gốc của project):
  Dùng cho Docker Compose configuration. Định nghĩa các port ánh xạ ra ngoài máy host và thiết lập các biến tổng quan.

- **`be/.env`** (nằm ở thư mục backend):
  Dùng cho Backend application configuration. Chứa các connection string tới các container, ví dụ như database url hoặc redis url.

## 4. Docker Networking

Có sự khác nhau cơ bản trong cách giao tiếp giữa các thành phần.

### Container → Container

Khi các container nằm trong cùng một mạng nội bộ Docker giao tiếp với nhau, chúng gọi trực tiếp thông qua service name thay vì `localhost`.
- Backend giao tiếp: `db:5432` và `redis:6379`
- Celery giao tiếp: `db:5432` và `redis:6379`

### Browser → Host

Khi trình duyệt (Browser) thực hiện truy vấn, nó gửi yêu cầu từ phía máy client (máy host thực tế) chứ không nằm trong mạng Docker. Do đó, browser cần truy cập thông qua `localhost`:
- Frontend/browser: `localhost:8000` (để gọi API của Backend)
- Frontend/browser: `localhost:3000` (để truy cập giao diện trang web)

Không thể sử dụng `backend:8000` từ browser vì trình duyệt của người dùng không có khả năng phân giải service name nội bộ `backend` của Docker network.

## 5. Cách chạy project

### Khởi động

Chạy lệnh sau để build và khởi động tất cả container:
```bash
docker compose up --build
```

### Chạy background

Nếu muốn hệ thống chạy ngầm ở chế độ background:
```bash
docker compose up -d
```

### Xem trạng thái

Kiểm tra trạng thái của các container xem có đang running hay healthy không:
```bash
docker compose ps
```

### Xem log hệ thống

Để kiểm tra log theo thời gian thực của từng thành phần:
- Xem log Backend:
  ```bash
  docker compose logs -f backend
  ```
- Xem log Celery:
  ```bash
  docker compose logs -f celery_worker
  ```
- Xem log Redis:
  ```bash
  docker compose logs -f redis
  ```
- Xem log PostgreSQL:
  ```bash
  docker compose logs -f db
  ```

### Dừng hệ thống

Dừng toàn bộ hệ thống:
```bash
docker compose down
```

> **CẢNH BÁO DATABASE VOLUME**: KHÔNG sử dụng `docker compose down -v` nếu không muốn xóa các Docker volumes. Option `-v` sẽ xóa vĩnh viễn các volume như `postgres_data` và `redis_data`, dẫn tới việc mất toàn bộ dữ liệu trong Database và Redis. Chỉ sử dụng lệnh này khi bạn thực sự hiểu mình đang làm gì và muốn làm mới hoàn toàn dữ liệu.
