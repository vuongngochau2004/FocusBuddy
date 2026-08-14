# API Trí tuệ Nhân tạo (AI Analysis API)

Module này cung cấp các REST API để chạy luồng Phân tích học tập và xuất Báo cáo tự động thông qua AI Orchestrator và các Specialized Agents (StudyStatusAgent, GradeAnalysisAgent, PsychologyAgent). Mặc định sử dụng Mock Provider cho mục đích kiểm thử.

Tất cả API đều bảo mật bằng header `X-User-Id`.

---

## 1. Phân tích Học tập (AI Analysis)

### `POST /api/v1/ai/analyze`
**Mục đích**: Kích hoạt tiến trình tổng hợp Context và chạy AI LLM để sinh báo cáo, sau đó lưu báo cáo vào Database.
**Headers**: `X-User-Id: <user_uuid>`
**Dữ liệu yêu cầu (Request)**:
```json
{
  "report_type": "GENERAL",
  "additional_context": "Dạo này em hơi mệt"
}
```
**Dữ liệu phản hồi (Response)**:
```json
{
  "message": "Phân tích thành công",
  "report_id": "uuid"
}
```

### `GET /api/v1/ai/reports`
**Mục đích**: Truy xuất danh sách báo cáo AI mà sinh viên này từng yêu cầu.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `skip` (mặc định 0), `limit` (mặc định 100).
**Dữ liệu phản hồi (Response)**: Mảng chứa các `AIAnalysisResponse`.

### `GET /api/v1/ai/recommendations`
**Mục đích**: Truy xuất danh sách lời khuyên/hành động (Recommendations) được tạo ra từ kết quả của AI.
**Headers**: `X-User-Id: <user_uuid>`
**Parameters**: `skip`, `limit`.
**Dữ liệu phản hồi (Response)**: Mảng chứa các đối tượng `RecommendationResponse`.

---

## Xử lý lỗi (Error Handling)
- **500 Internal Server Error**: Thường xảy ra khi AI Provider timeout hoặc provider trả về JSON không hợp lệ (nếu provider bị cấu hình sai). Lỗi 500 sẽ mô tả chuỗi lỗi.
