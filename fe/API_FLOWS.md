# Tài liệu Kiến trúc Frontend & Luồng API Hệ thống (FocusBuddy)

Tài liệu này giải thích chi tiết về cách tổ chức mã nguồn bên Frontend (Next.js) và luồng hoạt động của từng API bên Backend (FastAPI).

---

## I. Bố cục Code của Frontend (`fe`)

Thư mục Frontend được xây dựng dựa trên framework **Next.js (App Router)** và tổ chức theo mô hình **Feature-based Architecture** (Kiến trúc theo tính năng) kết hợp với các folder tiện ích dùng chung. Cấu trúc cụ thể dưới thư mục `fe/src` như sau:

### 1. `fe/src/app/` (Next.js Routing & Layouts)
Quản lý các trang (pages) và đường dẫn URL của ứng dụng.
* **`layout.tsx` & `globals.css`**: Layout gốc và định hình CSS toàn cục (TailwindCSS).
* **`page.tsx`**: Trang chủ (Landing page / Home).
* **`login/` & `register/`**: Các trang chức năng đăng nhập và đăng ký tài khoản.
* **`(app)/` (Route Group)**: Nhóm các trang được bảo vệ bằng xác thực (Dashboard/Workspace). Sử dụng ký hiệu `(app)` để dùng chung layout thanh menu/sidebar mà không hiển thị tên thư mục trên đường dẫn URL.
  * `(app)/layout.tsx`: Chứa layout Sidebar, Topbar điều hướng.
  * `(app)/dashboard/`: Trang thống kê & tổng quan.
  * `(app)/chatbot/`: Giao diện trò chuyện với AI Study Buddy.
  * `(app)/goals/`: Trang thiết lập mục tiêu học tập.
  * `(app)/mental-health/`: Trang theo dõi cảm xúc và khảo sát tâm lý.
  * `(app)/schedule/`: Trang thời khóa biểu & lịch học.
  * `(app)/scores/`: Trang theo dõi điểm số, GPA và tiến độ học tập.
  * `(app)/settings/`: Trang cài đặt cá nhân.

### 2. `fe/src/features/` (Mô-đun Tính năng)
Nơi chứa tất cả logic, component con, hook và state dành riêng cho từng tính năng để tránh làm phình to thư mục dùng chung.
* **`auth/`**: Các components xử lý đăng nhập, form đăng ký, hook quản lý token.
* **`chatbot/`**: Component khung chat, bong bóng chat, xử lý gửi/nhận tin nhắn.
* **`dashboard/`**: Các widget hiển thị biểu đồ học tập, tiến độ công việc hôm nay.
* **`schedule/`**: Bộ lịch (Calendar), quản lý session học tập, đồng hồ Pomodoro.
* **`scores/`**: Bảng điểm học phần, biểu đồ GPA tích lũy.

### 3. `fe/src/components/` (Components Dùng Chung)
Các UI components dùng lại ở nhiều tính năng khác nhau.
* Các nút bấm (Buttons), thẻ (Cards), hộp thoại (Modals), Input.
* **`layout/`**: Các layout khung cơ bản.
* **`ThemeProvider.tsx`**: Quản lý giao diện Sáng/Tối (Light/Dark mode) toàn hệ thống.

### 4. `fe/src/lib/` (Thư viện & Dịch vụ kết nối API)
* **`api.ts`**: Cấu hình Axios Client. Tự động chèn header `x-user-id` (lấy từ `localStorage`) vào mỗi Request gửi lên Backend.
* **`services.ts`**: Tập hợp các hàm gọi API (GET, POST, PUT, DELETE) trực tiếp đến Backend.

### 5. `fe/src/hooks/` (Hooks React Tùy Biến)
Chứa các hook dùng chung cho toàn dự án như kiểm tra kích thước màn hình, quản lý debounce, check quyền đăng nhập.

### 6. `fe/src/stores/` (Quản lý State Toàn Cục)
Các file cấu hình state management (ví dụ: Zustand) để chia sẻ dữ liệu nhanh giữa các trang độc lập (ví dụ: thông tin user, trạng thái mở rộng sidebar).

### 7. `fe/src/types/` (Định nghĩa TypeScript)
Chứa các interface/type khớp với các Schema dữ liệu trả về từ Backend.

---

## II. Luồng Đi của API Backend (FastAPI Architecture)

Backend hoạt động theo mô hình **3 lớp chuẩn (3-tier Architecture)**:

1. **Router/Controller Layer (`be/app/api/v1/`)**: Nhận HTTP request, kiểm tra định dạng dữ liệu (bằng Pydantic Schemas), chiết xuất Header (như `X-User-Id` để nhận biết user) và chuyển vào Service tương ứng.
2. **Service Layer (`be/app/services/`)**: Nơi xử lý toàn bộ logic nghiệp vụ (tính điểm GPA, gửi truy vấn cho OpenAI/Gemini API, tính toán đề xuất học tập).
3. **Repository Layer (`be/app/repositories/`)**: Thực hiện các câu truy vấn database (SQLAlchemy ORM) để lấy, thêm hoặc cập nhật dữ liệu vào DB PostgreSQL.

---

## III. Luồng Chi Tiết của Từng API Endpoint

Dưới đây là sơ đồ luồng dữ liệu của các API chính đang có trong Backend:

### 1. Quản lý Người dùng (`/v1/users`)
Quản lý đăng ký và cập nhật thông tin học viên.
* **`POST /v1/users`**: Tạo tài khoản mới. Nhận `UserCreate` (email, username, password) -> Service mã hóa password -> Lưu Database.
* **`GET /v1/users/{user_id}`**: Lấy chi tiết thông tin người dùng.
* **`PUT /v1/users/{user_id}`**: Cập nhật thông tin profile của học sinh.

### 2. Danh mục Đào tạo (Metadata học thuật)
Các API này cung cấp dữ liệu nền cho việc khai báo thông tin học tập:
* **Trường Đại học (`/v1/universities`)**: Quản lý danh sách các trường đại học toàn quốc.
* **Ngành học (`/v1/majors`)**: Danh sách chuyên ngành học.
* **Chương trình học (`/v1/curriculums`)**: Các chương trình khung của ngành.
* **Môn học (`/v1/courses`)**: Danh mục môn học chi tiết.
* **Học kỳ (`/v1/academic-terms`)**: Quản lý các học kỳ (ví dụ: Học kỳ 1 - 2026).

### 3. Quản lý Điểm & Đăng ký môn (`/v1/grades`)
Lưu giữ điểm số và trạng thái qua môn của sinh viên.
* **`POST /v1/grades`**: Khai báo điểm số môn học cụ thể.
* **`GET /v1/grades`**: Xem bảng điểm cá nhân (có bộ lọc theo `course_id` hoặc `term_id`).
* **`POST /v1/grades/import`**: Nhập bảng điểm hàng loạt từ file Excel/CSV.

### 4. Quản lý Nhiệm vụ học tập (`/v1/study-tasks`)
Lập danh sách công việc cần làm (To-Do List) cho từng môn học.
* **`POST /v1/study-tasks`** (Yêu cầu Header `X-User-Id`): Khởi tạo một nhiệm vụ mới kèm `course_id`, `deadline`, `priority`.
* **`GET /v1/study-tasks`**: Lấy danh sách nhiệm vụ của user, hỗ trợ lọc theo môn học để hiển thị trên Calendar/Task board.

### 5. Phiên học tập Pomodoro/Tập trung (`/v1/study-sessions`)
Theo dõi thời gian tự học thực tế của sinh viên.
* **`POST /v1/study-sessions`**: Bắt đầu một phiên học (chứa `task_id`, thời điểm bắt đầu `start_time`).
* **`PUT /v1/study-sessions/{id}`**: Tạm dừng hoặc kết thúc phiên học (cập nhật `end_time` để tính toán tổng thời gian tập trung thực tế).

### 6. Nhật ký Cảm xúc (`/v1/emotions`)
Theo dõi sức khỏe tinh thần của học sinh hàng ngày.
* **`POST /v1/emotions`**: Ghi nhận tâm trạng (vui, stress, lo lắng, mệt mỏi) kèm mức độ năng lượng.
* **`GET /v1/emotions`**: Lấy lịch sử cảm xúc theo thời gian nhằm hiển thị biểu đồ diễn biến tinh thần trên giao diện Mental Health.

### 7. Khảo sát Sức khỏe tinh thần (`/v1/assessments`)
* **`POST /v1/assessments`**: Học viên gửi câu trả lời cho các bộ câu hỏi khảo sát tâm lý (trầm cảm, lo âu, stress).
* **`GET /v1/assessments`**: Xem lại kết quả phân tích mức độ sức khỏe tinh thần qua các đợt làm khảo sát.

### 8. Upload & Trích xuất file (`/v1/files`)
Dùng để tải lên đề cương môn học (Syllabus) để AI phân tích.
* **`POST /v1/files/upload`**: Upload file tài liệu (.pdf, .docx, .png). File sẽ được lưu vào hệ thống thư mục cục bộ hoặc Cloud.
* **`POST /v1/files/{id}/extract`**: Gửi file đến AI để bóc tách nội dung kiến thức, tự động tạo ra danh sách các đề mục cần học hoặc tự tạo task.
* **`GET /v1/files/{id}/extraction`**: Lấy dữ liệu văn bản đã được trích xuất thành công để hiển thị.

### 9. Thống kê Học tập (`/v1/academic-performance`)
Tính toán chỉ số GPA và kết quả học tập.
* **`GET /v1/academic-performance/basic-statistics`**: Duyệt qua toàn bộ điểm số trong bảng điểm của sinh viên để tính điểm GPA trung bình hệ 4, hệ 10, tổng số tín chỉ đã tích lũy và hiển thị biểu đồ tăng trưởng điểm số.

### 10. Trợ lý ảo & Phân tích AI (`/v1/ai` & `/v1/chat`)
Hai tính năng cốt lõi sử dụng Trí tuệ nhân tạo để làm bạn đồng hành cho sinh viên.
* **Phân tích tổng hợp (`/v1/ai/analyze`)**:
  1. Frontend gửi yêu cầu yêu cầu phân tích tiến độ.
  2. `AIService` thu thập toàn bộ dữ liệu học tập tuần qua của user.
  3. Gửi toàn bộ dữ liệu này tới mô hình LLM (Gemini/OpenAI).
  4. LLM trả về báo cáo đánh giá điểm mạnh, điểm yếu và các đề xuất học tập.
  5. Báo cáo được lưu trữ và hiển thị qua API `/v1/ai/reports` và `/v1/ai/recommendations`.
* **Trò chuyện cùng AI Study Buddy (`/v1/chat`)**:
  * `POST /v1/chat/sessions`: Tạo cuộc trò chuyện mới.
  * `POST /v1/chat/sessions/{session_id}/messages`: Gửi câu hỏi của học sinh. AI Service sẽ truy vấn lịch sử cuộc trò chuyện từ DB, chèn prompt hướng dẫn (System Prompt của Study Buddy), gửi cho LLM để lấy câu trả lời động viên học tập và phản hồi lại cho Frontend.

### 11. Hệ thống Thông báo (`/v1/notifications`)
* **`GET /v1/notifications`**: Nhận các thông báo nhắc nhở deadline nhiệm vụ, lịch học sắp diễn ra, cảnh báo mức độ stress cao.
* **`PUT /v1/notifications/{noti_id}/read`**: Đánh dấu đã đọc một thông báo cụ thể.
