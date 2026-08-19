# Redis trong FocusBuddy

Tài liệu này giải thích cấu hình và vai trò của Redis trong kiến trúc dự án.

## 1. Vai trò

Redis hiện được sử dụng cho:
- **Celery Broker**: Nhận các task từ Backend và đẩy tới cho Celery Worker.
- **Celery Result Backend**: Lưu trữ kết quả trả về của các task đã được thực thi.

Ngoài ra, Redis còn dự kiến được sử dụng cho:
- **Cache**: Đang chờ phát triển (Nếu có nhu cầu thiết lập cơ chế caching cho API).
- **Future AI messaging**: Kênh giao tiếp tốc độ cao để Backend trao đổi bản tin cùng với module AI Service (khi AI Service được triển khai).

## 2. Cấu hình Connection URL

Redis sử dụng URL tĩnh để các ứng dụng khác kết nối. Ví dụ:
```env
REDIS_URL=redis://redis:6379/0
```
Trong cấu hình này:
- `redis://` là protocol.
- `redis` là Docker service name của container Redis. Nhờ có tính năng networking tự động của Docker, các container như `backend` hay `celery_worker` đều có thể phân giải trực tiếp host này mà không cần biết IP thật.
- `6379` là port mặc định của Redis.
- `/0` là chỉ số cơ sở dữ liệu logical database số 0. Tương tự, nếu sử dụng database số 1 có thể khai báo là `/1`.

**Quan trọng**: Không dùng `localhost` thay cho `redis` trong connection URL nội bộ của các container khác. `localhost` bên trong container `backend` sẽ chỉ mạng của chính container `backend` chứ không phải của host chứa Redis.
