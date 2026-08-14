# API Quản lý Học thuật (Academic Management)

Module này cung cấp dữ liệu tham chiếu (Master data) về nền tảng học vấn của người dùng.

## 1. API Trường Đại học (Universities)

### `GET /api/v1/universities`
**Mục đích**: Lấy danh sách tất cả trường đại học.
**Parameters**: `skip`, `limit`.
**Dữ liệu phản hồi (Response) (200 OK)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Test University",
      "short_name": "TU",
      "created_at": "datetime"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/universities`
**Mục đích**: Tạo mới một trường đại học.

### `GET /api/v1/universities/{id}`
**Mục đích**: Lấy chi tiết một trường đại học.

## 2. API Chuyên ngành (Majors)

### `GET /api/v1/majors`
**Mục đích**: Lấy danh sách chuyên ngành.
**Parameters**: 
- `skip`, `limit`
- `university_id`: Lọc chuyên ngành theo trường đại học.
**Dữ liệu phản hồi (Response) (200 OK)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "university_id": "uuid",
      "name": "Computer Science",
      "code": "CS",
      "created_at": "datetime"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/majors`
**Mục đích**: Tạo chuyên ngành (yêu cầu `university_id` hợp lệ).

### `GET /api/v1/majors/{id}`
**Mục đích**: Lấy chi tiết chuyên ngành.

## 3. API Chương trình học (Curriculums)

### `GET /api/v1/curriculums`
**Mục đích**: Lấy danh sách chương trình học.
**Parameters**: `major_id`.

### `POST /api/v1/curriculums`
**Mục đích**: Tạo chương trình học (yêu cầu `major_id` hợp lệ).

## 4. API Môn học (Courses)

### `GET /api/v1/courses`
**Mục đích**: Lấy danh sách môn học.
**Parameters**: `major_id`.

### `POST /api/v1/courses`
**Mục đích**: Tạo môn học (yêu cầu `major_id` hợp lệ).

## 5. API Học kỳ (Academic Terms)

### `GET /api/v1/academic-terms`
**Mục đích**: Lấy danh sách học kỳ (Academic terms).
**Parameters**: `skip`, `limit`.

### `POST /api/v1/academic-terms`
**Mục đích**: Tạo một học kỳ mới.

## Xử lý lỗi (Error Handling)
- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ hoặc lỗi tạo thực thể phụ thuộc.
- **404 Not Found**: Không tìm thấy ID thực thể (VD: tạo Chuyên ngành với Trường đại học không tồn tại).
