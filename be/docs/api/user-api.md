# API Quản lý Người dùng (User Management)

Module này xử lý việc đăng ký, xác thực và quản lý hồ sơ người dùng.

## 1. Đăng ký & Xác thực (Registration & Auth)

### `POST /api/v1/users`
**Mục đích**: Đăng ký người dùng mới.
**Dữ liệu yêu cầu (Request)**:
```json
{
  "email": "student@example.com",
  "username": "student1",
  "password": "strongpassword123",
  "full_name": "Student Name"
}
```
**Dữ liệu phản hồi (Response) (201 Created)**:
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "username": "student1",
  "full_name": "Student Name",
  "is_active": true,
  "created_at": "datetime"
}
```

### `POST /api/v1/users/login`
**Mục đích**: Xác thực người dùng và nhận access token (Chuẩn OAuth2 Password Flow).
**Dữ liệu yêu cầu (Request)** (Form Data):
- `username`: Email hoặc tên người dùng.
- `password`: Mật khẩu.
**Dữ liệu phản hồi (Response) (200 OK)**:
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer"
}
```

## 2. Dữ liệu Người dùng (User Data)

### `GET /api/v1/users/me`
**Mục đích**: Lấy thông tin chi tiết của người dùng đang đăng nhập.

### `PUT /api/v1/users/me`
**Mục đích**: Cập nhật hồ sơ của người dùng hiện tại.

### `GET /api/v1/users/{id}`
**Mục đích**: Lấy thông tin chi tiết của một người dùng cụ thể (chỉ dành cho admin).

## Xử lý lỗi (Error Handling)
- **401 Unauthorized**: Sai thông tin đăng nhập hoặc thiếu token.
- **409 Conflict**: Email hoặc username đã tồn tại.
