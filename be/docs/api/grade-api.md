# API Quản lý Điểm & Thống kê Học tập (Grade & Academic Performance)

Module này cung cấp các REST API cho phép sinh viên quản lý điểm số, kiểm tra kết quả học thuật, và nhập điểm tự động (import) từ bảng dữ liệu được xử lý từ file đính kèm.

Hệ thống bảo vệ quyền riêng tư và sở hữu dữ liệu thông qua Header `X-User-Id`. 

---

## 1. API Quản lý Điểm (Grade API)

### `POST /api/v1/grades`
**Mục đích**: Thêm một bản ghi điểm cho khóa học. Ngăn chặn trùng lặp khóa học trong cùng một học kỳ.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "course_id": "uuid",
  "academic_term_id": "uuid",
  "score_process": 8.5,
  "score_midterm": 7.0,
  "score_final": 9.0,
  "total_score": 8.4,
  "letter_grade": "A",
  "grade_point": 3.5,
  "status": "PASSED"
}
```
**Dữ liệu phản hồi (Response) (201 Created)**: Trả về đối tượng `StudentCourse` vừa được khởi tạo.

### `GET /api/v1/grades`
**Mục đích**: Lấy danh sách điểm số. Có thể lọc theo `course_id` và `term_id`.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `course_id` (optional), `term_id` (optional), `skip`, `limit`.

### `GET /api/v1/grades/{id}`
**Mục đích**: Xem chi tiết điểm của một môn học.
**Headers**: `X-User-Id: <user_uuid>`

### `PUT /api/v1/grades/{id}`
**Mục đích**: Cập nhật thông tin điểm số.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**: Các trường điểm số (`score_final`, `total_score`, `letter_grade`...)
**Dữ liệu phản hồi (Response)**: Trả về đối tượng sau khi update.

### `DELETE /api/v1/grades/{id}`
**Mục đích**: Xóa kết quả của một môn học.
**Headers**: `X-User-Id: <user_uuid>`
**Status Code**: `204 No Content`

---

## 2. API Nhập Điểm Hàng Loạt (Grade Import API)

### `POST /api/v1/grades/import`
**Mục đích**: Nhập điểm số hàng loạt từ dữ liệu có cấu trúc đã được trích xuất từ `File Processing Module`. API này đảm bảo tính nhất quán của dữ liệu (Atomic Transaction); nếu bất kỳ bản ghi nào có lỗi, toàn bộ giao dịch sẽ bị rollback.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "file_id": "uuid"
}
```
**Dữ liệu phản hồi (Response)**:
```json
{
  "total_rows": 10,
  "success_rows": 10,
  "failed_rows": 0,
  "errors": []
}
```
*Lưu ý*: Trường hợp lỗi (HTTP 400), danh sách `errors` sẽ mô tả lỗi của từng dòng bị vi phạm.

---

## 3. API Thống kê Học tập (Academic Performance API)

### `GET /api/v1/academic-performance`
**Mục đích**: Lấy danh sách kết quả học tập (Academic Statistics) theo các kỳ học.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `skip`, `limit`.

### `GET /api/v1/academic-performance/by-term/{term_id}`
**Mục đích**: Lấy chi tiết thống kê trong một học kỳ cụ thể.
**Headers**: `X-User-Id: <user_uuid>`

### `GET /api/v1/academic-performance/basic-statistics`
**Mục đích**: Lấy các thống kê cơ bản và tổng quát nhất của sinh viên thông qua các bản ghi điểm số hiện có trong cơ sở dữ liệu.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu phản hồi (Response)**:
```json
{
  "total_courses": 15,
  "completed_courses": 14,
  "failed_courses": 1,
  "average_score": 8.2,
  "highest_score": 9.5,
  "lowest_score": 4.0
}
```

---

## Xử lý lỗi (Error Handling)

- **400 Bad Request**: 
  - Khóa học trùng lặp (`Grade for this course and term already exists.`)
  - Định dạng nhập điểm lỗi hoặc thiếu file dữ liệu cấu trúc.
  - Transaction import thất bại.
- **404 Not Found**: 
  - Điểm/Thống kê không tồn tại.
  - Không tìm thấy người dùng (`Student Profile not found`).
- **500 Internal Server Error**: Lỗi máy chủ hoặc rollback giao dịch không xác định.
