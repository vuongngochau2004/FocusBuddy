# TOOL SAFETY & SECURITY

Khả năng sử dụng Tool của LLM mang lại sự mạnh mẽ nhưng cũng tiềm ẩn rủi ro rất lớn. Hệ thống tuân thủ các nguyên tắc an toàn sau:

## 1. Schema Validation
LLM thường xuyên gặp hiện tượng "ảo giác" (hallucination) và sinh ra các JSON arguments sai định dạng. `ToolExecutor` bắt buộc phải sử dụng Pydantic hoặc thư viện tương đương để validate kiểu dữ liệu (ví dụ: ép kiểu `start_time` thành định dạng datetime ISO-8601). Nếu lỗi, trả về chuỗi báo lỗi để LLM tự gọi lại (Self-Correction).

## 2. Authorization
Tool không nhận tham số `user_id` từ LLM để tránh việc LLM tự ý đoán mã sinh viên của người khác. `user_id` luôn được lấy cứng từ Session Auth của Backend và tự động tiêm (inject) vào hàm thực thi.

## 3. Timeout & Retries
External Services (như Google Calendar API) có thể bị treo. Mọi hàm `execute` trong Tool phải cài đặt Timeout (vd: 5 giây). Nếu timeout, báo lại cho LLM biết hệ thống tạm bận.

## 4. Destructive Action Confirmation
Các thao tác mang tính phá hủy như `calendar_delete_event` hoặc `drop_course` tuyệt đối không được thực thi ngay lập tức. 
**Quy trình:**
1. LLM gọi `delete_event`.
2. Tool không xóa thật, mà đẩy một "Yêu cầu xác nhận" lên giao diện UI của User.
3. User bấm "Đồng ý" -> Backend mới thực thi.

## 5. Audit Logging & Idempotency
- Ghi log 100% các Tool Call (Input, Output, Thời gian chạy, Agent gọi).
- Code hàm Tool đảm bảo tính Idempotency (gọi 1 lần hay 10 lần đều ra chung 1 kết quả, tránh việc LLM bị ngáo gọi tạo 10 sự kiện trùng nhau).
