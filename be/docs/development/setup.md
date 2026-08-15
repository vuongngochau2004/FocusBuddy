# Hướng dẫn Thiết lập Môi trường (Setup Guide)

Tài liệu này cung cấp các bước để khởi chạy Backend FocusBuddy trên máy cục bộ (Local).

## 1. Yêu cầu Hệ thống
- **Python**: Phiên bản 3.12+
- **PostgreSQL**: Phiên bản 14+
- (Tùy chọn) Docker & Docker Compose để chạy DB nhanh chóng.

## 2. Tạo Môi trường Ảo (Virtual Environment)
```bash
cd be
python -m venv venv

# Kích hoạt trên Windows
.\venv\Scripts\activate

# Kích hoạt trên macOS/Linux
source venv/bin/activate
```

## 3. Cài đặt Thư viện
```bash
pip install -r requirements.txt
```

## 4. Cấu hình Biến môi trường
Sao chép file `.env.example` thành `.env` (hoặc tạo file `.env`) và cấu hình theo file [environment.md](environment.md).

## 5. Chạy Migration (Khởi tạo Database)
```bash
# Đảm bảo PostgreSQL đang chạy và DATABASE_URL trong .env đã chính xác.
alembic upgrade head
```

## 6. Khởi động Server
```bash
uvicorn app.main:app --reload
```
Server sẽ chạy ở địa chỉ `http://localhost:8000`. Bạn có thể truy cập tài liệu Swagger UI tại `http://localhost:8000/docs`.
