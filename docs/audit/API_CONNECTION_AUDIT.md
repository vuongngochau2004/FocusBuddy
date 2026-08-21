# BÁO CÁO KIỂM TOÁN TÍCH HỢP API FRONTEND - BACKEND
*(API CONNECTION & INTEGRATION AUDIT)*

**Ngày thực hiện:** 21/08/2026  
**Trạng thái:** HOÀN THÀNH  
**Mục tiêu:** Đánh giá thực trạng kết nối các API từ Backend lên giao diện Frontend (Next.js), xác định các giao thức bị lỗi, các phần code đang bị giả lập (Mock), và các khoảng trống tính năng (feature gaps) chưa được tích hợp.

---

## 1. Bảng Tổng Hợp Trạng Thái Tích Hợp (API Integration Summary)

| Tên Module / Tính Năng | Endpoint Backend | Trạng Thái Trên FE | Đánh Giá Tích Hợp |
| :--- | :--- | :--- | :--- |
| **Hỏi Đáp AI Chatbot** | `POST /v1/chat/sessions/{id}/messages` | Đã có giao diện | **Lỗi Giao Thức (SSE vs Axios)** |
| **Upload Bảng Điểm (OCR)** | `POST /v1/files/upload` <br> `POST /v1/files/{id}/extract` | Đã có giao diện | **Chưa Kết Nối (Đang Giả Lập/Mock)** |
| **Báo Cáo & Khuyến Nghị AI**| `POST /v1/ai/analyze` <br> `GET /v1/ai/reports` <br> `GET /v1/ai/recommendations` | Chưa có giao diện | **Hoàn Toàn Chưa Kết Nối** |
| **Đánh Giá Sức Khỏe Tâm Lý**| `POST /v1/assessments` <br> `PUT /v1/assessments/{id}` <br> `DELETE /v1/assessments/{id}` | Đã có giao diện đọc | **Thiếu Các Chức Năng CRUD (Chỉ Đọc)** |
| **Danh Mục Trường & Ngành**| `/v1/universities` <br> `/v1/majors` <br> `/v1/curriculums` | Chưa có giao diện | **Chưa Kết Nối (Chỉ Có Ở DB Seed)** |
| **Hiệu Suất Theo Học Kỳ** | `GET /v1/academic-performance/by-term/{id}` | Chưa có giao diện | **Chưa Kết Nối** |

---

## 2. Chi Tiết Các Lỗi Tích Hợp Nghiêm Trọng

### 2.1. Lỗi Giao Thức Ở AI Chatbot (Protocol Mismatch)
* **Endpoint:** `POST /v1/chat/sessions/{session_id}/messages`
* **File liên quan:** 
  - Backend: [chat.py](file:///g:/Chat%20Box/be/app/api/v1/chat.py), [chat_service.py](file:///g:/Chat%20Box/be/app/services/module_5_ai_chatbot/chat_service.py)
  - Frontend: [page.tsx (Chatbot)](file:///g:/Chat%20Box/fe/src/app/%28app%29/chatbot/page.tsx)
* **Mô tả:** 
  Backend trả về dữ liệu dạng **Streaming Response** (`text/event-stream`) để tạo hiệu ứng gõ chữ thời gian thực. Tuy nhiên, Frontend lại gọi thông qua thư viện Axios (`api.post`) thông thường. 
* **Hậu quả:** 
  Axios bị đứng chờ cho đến khi stream kết thúc mới nhận phản hồi, đồng thời cố gắng parse chuỗi text ghép thành định dạng JSON khiến giao diện bị crash hoặc lỗi render tin nhắn của Bot.
* **Giải pháp khắc phục:** 
  Xem chi tiết giải pháp và mã nguồn sửa đổi sử dụng Web Streams API (`fetch` + `ReadableStream`) tại [chat_box_analysis.md](file:///g:/Chat%20Box/docs/architecture/chat_box_analysis.md).

### 2.2. Chức Năng Upload & Trích Xuất Bảng Điểm Đang Bị Mock
* **Endpoint:** `POST /v1/files/upload` và `POST /v1/files/{id}/extract`
* **File liên quan:**
  - Backend: [files.py](file:///g:/Chat%20Box/be/app/api/v1/files.py)
  - Frontend: [page.tsx (Bảng điểm)](file:///g:/Chat%20Box/fe/src/app/%28app%29/scores/page.tsx)
* **Mô tả:** 
  Trang "Bảng điểm" đã thiết kế nút bấm "Upload ảnh bảng điểm", nhưng sự kiện click `handleUpload` đang sử dụng `setTimeout` giả lập 1.5 giây rồi hiện Toast thông báo ảo. Chưa hề có kết nối gọi HTTP Request lên Backend để lưu file và chạy tiến trình OCR.
* **Hậu quả:** 
  Người dùng không thể tải lên bảng điểm thực tế để hệ thống tự phân tích và điền điểm tự động vào cơ sở dữ liệu.
* **Giải pháp khắc phục:**
  1. Khai báo các API upload trong `services.ts`.
  2. Thay thế hàm `handleUpload` bằng một `FormData` POST request thực tế để tải ảnh lên.
  3. Lắng nghe phản hồi trả về ID của file để kích hoạt tiến trình trích xuất (`/extract`), sau đó tải lại danh sách điểm.

---

## 3. Các Khoảng Trống Tính Năng (Feature Gaps)

### 3.1. Báo Cáo Phân Tích & Khuyến Nghị Học Tập Bằng AI
* **Endpoint:** Các route `/v1/ai/` ở Backend được định nghĩa tại [ai_analysis.py](file:///g:/Chat%20Box/be/app/api/v1/ai_analysis.py).
* **Trạng thái:** 
  Backend đã sẵn sàng logic để sinh các báo cáo phân tích GPA tích lũy, cảnh báo học tập, đề xuất phương pháp học tập cá nhân hóa dựa trên kết quả thi và tâm lý. 
  Tuy nhiên, Frontend hoàn toàn **chưa xây dựng giao diện** để hiển thị các báo cáo và khuyến nghị này (ngoài giao diện chat tự do với Bot).
* **Đề xuất:** 
  Tạo thêm màn hình hoặc tab "Phân Tích AI & Đề Xuất Học Tập" để người dùng nhấn nút "Yêu cầu phân tích" và xem danh sách các báo cáo/lời khuyên hệ thống đã đưa ra.

### 3.2. Thiếu Tính Năng Thao Tác (CRUD) Đánh Giá Sức Khỏe Tâm Lý
* **Endpoint:** `POST /v1/assessments`, `PUT /v1/assessments/{id}`, `DELETE /v1/assessments/{id}`
* **File liên quan:** 
  - Backend: [mental_assessments.py](file:///g:/Chat%20Box/be/app/api/v1/mental_assessments.py)
  - Frontend: [page.tsx (Sức khỏe)](file:///g:/Chat%20Box/fe/src/app/%28app%29/mental-health/page.tsx)
* **Trạng thái:** 
  Giao diện sức khỏe tinh thần hiện tại chỉ mới gọi hàm `mentalAssessmentService.getAll()` để lấy lịch sử các bài đánh giá (Read-only). FE hoàn toàn thiếu các form hoặc nút bấm để người dùng thực hiện tạo mới một bài đánh giá sức khỏe tâm lý hay chỉnh sửa/xóa lịch sử cũ.

### 3.3. Chưa Kết Nối Quản Lý Danh Mục Trường & Ngành Học
* **Endpoint:** Các route `/v1/universities`, `/v1/majors`, `/v1/curriculums`.
* **Trạng thái:** 
  Các bảng này hiện tại mới chỉ được sử dụng cho việc Seeding dữ liệu mẫu hoặc liên kết khóa ngoại ở Backend. Frontend chưa có luồng đăng ký hoặc cấu hình cho phép người dùng chọn Trường học hay Ngành học một cách động từ danh sách API.

---

## 4. Kế Hoạch Tích Hợp Đề Xuất (Integration Roadmap)

1. **Ưu tiên 1 (Critical):** Khắc phục lỗi kết nối Stream của Chatbot tại [chatbot/page.tsx](file:///g:/Chat%20Box/fe/src/app/%28app%29/chatbot/page.tsx) theo giải pháp tại [chat_box_analysis.md](file:///g:/Chat%20Box/docs/architecture/chat_box_analysis.md).
2. **Ưu tiên 2 (High):** Thực hiện kết nối API thật cho tính năng Upload ảnh bảng điểm bằng cách thay thế hàm `handleUpload` giả lập tại [scores/page.tsx](file:///g:/Chat%20Box/fe/src/app/%28app%29/scores/page.tsx).
3. **Ưu tiên 3 (Medium):** Tích hợp chức năng gửi đánh giá sức khỏe tinh thần mới thay vì chỉ hiển thị lịch sử ở chế độ Read-only.
4. **Ưu tiên 4 (Low):** Dựng trang hiển thị báo cáo khuyến nghị học thuật bằng AI kết nối với nhóm API `/v1/ai`.
