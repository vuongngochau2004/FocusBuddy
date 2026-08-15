# API Quản lý và Xử lý File (File Management & Processing)

Module này chịu trách nhiệm quản lý quá trình tải lên (upload), lưu trữ (storage) và trích xuất dữ liệu (extraction) từ các file của người dùng. Hệ thống hiện tại hỗ trợ xử lý trích xuất văn bản từ các file `TXT` và bảng tính dữ liệu có cấu trúc từ file `CSV`.

**Lưu ý quan trọng về xác thực:**
Tương tự các module khác, header `X-User-Id` được sử dụng để định danh người dùng và xác minh quyền sở hữu (Ownership) đối với file.

---

## 1. API Quản lý File (File Management)

### `POST /api/v1/files/upload`
**Mục đích**: Tải lên một file mới. API này sẽ lưu file vào hệ thống lưu trữ cục bộ, kiểm tra kích thước (tối đa 10MB) và lưu metadata vào cơ sở dữ liệu.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)** (Form-Data):
- `file`: File cần tải lên.
**Dữ liệu phản hồi (Response) (201 Created)**:
```json
{
  "file_name": "data.csv",
  "file_type": "CSV",
  "mime_type": "text/csv",
  "file_size": 1024,
  "storage_path": "storage/uploads/user_id/uuid_data.csv",
  "status": "UPLOADED",
  "id": "uuid",
  "user_id": "uuid",
  "uploaded_at": "datetime",
  "created_at": "datetime"
}
```

### `GET /api/v1/files`
**Mục đích**: Lấy danh sách các file do người dùng đã tải lên.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `skip` (mặc định 0), `limit` (mặc định 100).

### `GET /api/v1/files/{id}`
**Mục đích**: Lấy chi tiết metadata của một file.
**Headers**: `X-User-Id: <user_uuid>`

### `DELETE /api/v1/files/{id}`
**Mục đích**: Xóa file khỏi database và xóa file thực tế khỏi hệ thống lưu trữ.
**Headers**: `X-User-Id: <user_uuid>`

---

## 2. API Xử lý File (File Processing & Extraction)

Sau khi file được tải lên, người dùng có thể kích hoạt quá trình xử lý (parsing/extraction).

### `POST /api/v1/files/{id}/extract`
**Mục đích**: Xử lý nội dung file và trích xuất dữ liệu. 
- Đối với `TXT`: Trích xuất thành văn bản thuần (raw text).
- Đối với `CSV`: Trích xuất thành dữ liệu có cấu trúc (structured data - JSON list).
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu phản hồi (Response)**: Trả về thông tin file với trạng thái `PROCESSED` hoặc `FAILED`.

### `GET /api/v1/files/{id}/extraction`
**Mục đích**: Truy xuất kết quả trích xuất dữ liệu của một file đã được xử lý thành công.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu phản hồi (Response)**:
```json
{
  "extraction_method": "CSV_PARSER",
  "raw_text": null,
  "structured_data": [
    {"name": "Alice", "age": "20"},
    {"name": "Bob", "age": "22"}
  ],
  "confidence_score": null,
  "validation_status": "VALID",
  "error_message": null,
  "id": "uuid",
  "file_id": "uuid",
  "processed_at": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

## Xử lý lỗi (Error Codes)

- **400 Bad Request**: File tải lên rỗng (Empty file).
- **403 Forbidden**: Cố gắng truy cập, xóa, hoặc xử lý file thuộc về người dùng khác.
- **404 Not Found**: File ID hoặc bản ghi extraction không tồn tại.
- **413 Request Entity Too Large**: File vượt quá giới hạn dung lượng (10MB).
- **415 Unsupported Media Type**: Định dạng file không được hỗ trợ để upload hoặc xử lý. Chỉ có `TXT` và `CSV` được hỗ trợ do không có các thư viện bên ngoài (dependencies) cài đặt thêm cho PDF/Image.
- **500 Internal Server Error**: Xảy ra lỗi ngoài ý muốn trong quá trình đọc hoặc parse dữ liệu.
