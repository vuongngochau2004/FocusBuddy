# Celery Worker trong FocusBuddy

## 1. Celery là gì?

Celery là hệ thống dùng để thực hiện background task (tác vụ chạy nền) dạng hàng đợi phân tán.
Trong FocusBuddy, khi có một tác vụ quá mất thời gian (ví dụ: tạo file báo cáo, xử lý ảnh, gửi mail...), Backend sẽ không làm trực tiếp mà sẽ bàn giao tác vụ đó cho Celery xử lý.

Quy trình hoạt động:
```text
Backend nhận request
      ↓
Đưa task vào Redis (hoạt động như Broker)
      ↓
Celery Worker nhận task từ Redis
      ↓
Xử lý background task
      ↓
Trả kết quả (về Result Backend trên Redis)
```

## 2. Cấu hình Celery

Cấu hình của Celery hiện nằm ở file `be/.env`. Các giá trị environment variables bao gồm:
- `CELERY_BROKER_URL`: Sử dụng Redis làm nơi lưu trữ hàng đợi.
- `CELERY_RESULT_BACKEND`: Nơi Celery lưu trữ kết quả thực thi các task để Backend hoặc hệ thống có thể truy vấn lại.

## 3. Celery trong Docker

Celery Worker được khởi chạy độc lập như một service nằm trong file `docker-compose.yml`.

- **Image**: Worker dùng chung image đã build từ mã nguồn Backend thay vì tạo Dockerfile riêng. Điều này đảm bảo thư viện và code giống hệt Backend.
- **Server**: Worker chỉ nhận và thực thi các background task từ hàng đợi. Nó không có máy chủ HTTP (không chạy `uvicorn`).
- **Phụ thuộc**: Worker cần khởi tạo kết nối thông qua Redis và cũng có khả năng truy cập trực tiếp vào PostgreSQL nếu task đang thực hiện liên quan tới cơ sở dữ liệu.

### Xem log Celery
Để kiểm tra xem Celery worker có đang hoạt động tốt hay không:
```bash
docker compose logs -f celery_worker
```
Lệnh trên cho phép bạn biết các task nào đã được đưa vào hàng đợi, task nào chạy thành công, hoặc gặp lỗi.
