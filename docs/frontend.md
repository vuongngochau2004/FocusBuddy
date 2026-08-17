# Frontend FocusBuddy

Tài liệu này cung cấp cái nhìn tổng quan về công nghệ và cấu hình chạy Frontend.

## 1. Công nghệ sử dụng

- **Framework**: Next.js (Dựa trên React).
- **Package Manager**: `npm`.

## 2. Docker và Lệnh khởi chạy

- **Docker Service**: Chạy dưới service name `frontend`.
- **Cổng giao tiếp (Port)**: Máy chủ phát triển chạy trên cổng `3000`. Cổng này được ánh xạ ra máy host để bạn có thể vào trình duyệt tại `http://localhost:3000`.
- **Dev Command**: Command chính khởi chạy hệ thống trong môi trường phát triển là `npm run dev`. Lệnh này được gọi trực tiếp qua cấu hình `Dockerfile` ở phần frontend.
- **Hot Reload**: Hệ thống thiết lập environment variable `CHOKIDAR_USEPOLLING=true` cùng với `NODE_ENV=development` trong file cấu hình Compose để giám sát thay đổi tập tin, cho phép source code trên máy host được tự động cập nhật trong container mà không cần build lại thủ công.

## 3. Cách Frontend gọi Backend

Trình duyệt của người dùng gửi các API requests. Vì vậy, frontend code hoạt động trên trình duyệt không thể hiểu được tên miền container như `http://backend:8000`. Thay vào đó, API calls phải được cấu hình gửi trực tiếp đến host URL mà máy tính của người dùng nhìn thấy, đó là `http://localhost:8000`.
