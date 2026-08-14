# API Quản lý Tâm lý & Sức khỏe (Mental & Psychology)

Module này cho phép người dùng ghi nhận và theo dõi trạng thái cảm xúc cũng như sức khỏe tâm lý theo thời gian, bao gồm nhật ký cảm xúc hàng ngày và các bài đánh giá tâm lý định kỳ.

**Lưu ý quan trọng về xác thực:**
Tương tự các module khác, header `X-User-Id` được sử dụng để định danh người dùng. Điều này đảm bảo quyền sở hữu (Ownership) dữ liệu cá nhân chặt chẽ.

## 1. API Nhật ký Cảm xúc (Emotion Logs)

Theo dõi trạng thái cảm xúc, mức độ căng thẳng, động lực và năng lượng hàng ngày.

### `POST /api/v1/emotions`
**Mục đích**: Ghi nhận một nhật ký cảm xúc mới.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "emotion": "HAPPY",
  "stress_level": 2,
  "motivation_level": 8,
  "energy_level": 9,
  "note": "Feeling great today!",
  "recorded_at": "2026-08-14T10:00:00Z"
}
```
**Dữ liệu phản hồi (Response) (201 Created)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "emotion": "HAPPY",
  ...
  "created_at": "datetime"
}
```

### `GET /api/v1/emotions`
**Mục đích**: Lấy lịch sử cảm xúc của người dùng, sắp xếp theo `recorded_at` giảm dần.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `skip` (mặc định 0), `limit` (mặc định 100).

### `GET /api/v1/emotions/{id}`
**Mục đích**: Lấy chi tiết một nhật ký cảm xúc. Trả về 403 nếu không thuộc về người dùng.
**Headers**: `X-User-Id: <user_uuid>`

### `PUT /api/v1/emotions/{id}`
**Mục đích**: Cập nhật một nhật ký cảm xúc đã có.

### `DELETE /api/v1/emotions/{id}`
**Mục đích**: Xóa một nhật ký cảm xúc. Trả về 204 No Content.

---

## 2. API Đánh giá Tâm lý (Mental Assessments)

Theo dõi các bài kiểm tra sức khỏe tâm lý định kỳ (ví dụ: Daily Check, AI Analysis).

### `POST /api/v1/assessments`
**Mục đích**: Nộp một bài đánh giá tâm lý mới.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "assessment_type": "DAILY_CHECK",
  "stress_score": 12.5,
  "anxiety_score": 5.0,
  "burnout_score": 2.0,
  "risk_level": "LOW",
  "summary": "User is doing well.",
  "recommendation": "Keep it up."
}
```

### `GET /api/v1/assessments`
**Mục đích**: Lấy lịch sử bài đánh giá của người dùng, sắp xếp theo `created_at` giảm dần.
**Parameters**: `skip`, `limit`.

### `GET /api/v1/assessments/{id}`
**Mục đích**: Lấy chi tiết một bài đánh giá.

### `PUT /api/v1/assessments/{id}`
**Mục đích**: Cập nhật bài đánh giá.

### `DELETE /api/v1/assessments/{id}`
**Mục đích**: Xóa bài đánh giá.

## Xử lý lỗi (Error Codes)

- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ.
- **403 Forbidden**: Cố gắng truy cập/chỉnh sửa nhật ký hoặc bài đánh giá của người dùng khác.
- **404 Not Found**: Tài nguyên không tồn tại.
- **422 Unprocessable Entity**: Lỗi Pydantic (ví dụ: giá trị Enum không hợp lệ hoặc vượt ngưỡng cho phép).
