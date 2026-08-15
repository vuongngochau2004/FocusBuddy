# API Quản lý Hoạt động Học tập (Learning Activity)

Module này quản lý quá trình học tập của người dùng, chẳng hạn như thiết lập mục tiêu, theo dõi phiên học và sắp xếp công việc.

**Lưu ý quan trọng về xác thực:**
Do tính năng xác thực (Authentication) chỉ mới được triển khai một phần, header `X-User-Id` được sử dụng trong các API này để định danh người dùng. Điều này đảm bảo rằng người dùng chỉ có thể tương tác với dữ liệu học tập của chính họ (Xác minh quyền sở hữu - Ownership).

## 1. API Mục tiêu Học tập (Learning Goals)

Mục tiêu học tập đại diện cho những thành tựu dài hạn mà người dùng muốn đạt được.

### `POST /api/v1/learning-goals`
**Mục đích**: Tạo mục tiêu học tập mới.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "title": "Master Backend",
  "target_value": 100.0,
  "unit": "hours",
  "start_date": "2026-08-01",
  "end_date": "2026-12-31",
  "status": "ACTIVE"
}
```
**Dữ liệu phản hồi (Response) (201 Created)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Master Backend",
  "target_value": 100.0,
  "unit": "hours",
  "start_date": "2026-08-01",
  "end_date": "2026-12-31",
  "status": "ACTIVE",
  "created_at": "datetime"
}
```

### `GET /api/v1/learning-goals`
**Mục đích**: Lấy tất cả mục tiêu học tập của người dùng hiện tại.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `skip` (mặc định 0), `limit` (mặc định 100).
**Dữ liệu phản hồi (Response) (200 OK)**:
```json
{
  "items": [ ... ],
  "total": 1
}
```

### `GET /api/v1/learning-goals/{id}`
**Mục đích**: Lấy một mục tiêu học tập cụ thể. Trả về 403 nếu mục tiêu không thuộc về người dùng.
**Headers**: `X-User-Id: <user_uuid>`

### `PUT /api/v1/learning-goals/{id}`
**Mục đích**: Cập nhật mục tiêu học tập.

### `DELETE /api/v1/learning-goals/{id}`
**Mục đích**: Xóa mục tiêu học tập. Trả về 204 No Content.

---

## 2. API Phiên học (Study Sessions)

Phiên học theo dõi thời gian thực tế dành cho việc học.

### `POST /api/v1/study-sessions`
**Mục đích**: Ghi lại một phiên học mới.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "start_time": "2026-08-14T10:00:00Z",
  "end_time": "2026-08-14T11:00:00Z",
  "duration_minutes": 60,
  "study_method": "POMODORO",
  "focus_score": 8,
  "note": "Great focus today."
}
```
**Dữ liệu phản hồi (Response) (201 Created)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  ...
}
```

### `GET /api/v1/study-sessions`
**Mục đích**: Lấy danh sách phiên học của người dùng. Hỗ trợ phân trang (`skip`, `limit`).

### `GET /api/v1/study-sessions/{id}`
**Mục đích**: Lấy chi tiết phiên học.

### `PUT /api/v1/study-sessions/{id}`
**Mục đích**: Cập nhật phiên học.

### `DELETE /api/v1/study-sessions/{id}`
**Mục đích**: Xóa phiên học.

---

## 3. API Nhiệm vụ Học tập (Study Tasks)

Nhiệm vụ học tập (Study Tasks) là các công việc cụ thể, có thể liên kết với một môn học (Course).

### `POST /api/v1/study-tasks`
**Mục đích**: Tạo một nhiệm vụ mới.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "course_id": "optional-course-uuid",
  "title": "Complete Assignment 3",
  "description": "...",
  "priority": "HIGH",
  "status": "TODO"
}
```

### `GET /api/v1/study-tasks`
**Mục đích**: Lấy danh sách nhiệm vụ của người dùng.
**Parameters**: 
- `skip`, `limit`
- `course_id` (tùy chọn): Lọc nhiệm vụ theo môn học.

### `GET /api/v1/study-tasks/{id}`
**Mục đích**: Lấy chi tiết một nhiệm vụ.

### `PUT /api/v1/study-tasks/{id}`
**Mục đích**: Cập nhật nhiệm vụ. Dùng để đánh dấu hoàn thành (DONE).

### `DELETE /api/v1/study-tasks/{id}`
**Mục đích**: Xóa nhiệm vụ.

## Xử lý lỗi (Error Codes)

- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ.
- **403 Forbidden**: Cố gắng truy cập/chỉnh sửa tài nguyên thuộc về người dùng khác.
- **404 Not Found**: Tài nguyên, người dùng hoặc ID môn học không tồn tại.
- **422 Unprocessable Entity**: Lỗi xác thực Pydantic (ví dụ: giá trị Enum không hợp lệ).
