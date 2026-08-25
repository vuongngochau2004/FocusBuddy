# Kế Hoạch Triển Khai Hệ Thống Mock Data Client-Side

> **Dành cho Antigravity:** QUY TRÌNH BẮT BUỘC: Sử dụng `.agent/workflows/execute-plan.md` để thực thi kế hoạch này ở chế độ đơn dòng (single-flow mode).

**Mục tiêu:** Triển khai hệ thống mock dữ liệu ở phía máy khách (client-side) lưu trữ trong `localStorage` cho tất cả các API backend để ứng dụng chạy độc lập hoàn chỉnh cho mục đích demo.

**Kiến trúc:** Thay thế các yêu cầu gọi Axios và Fetch trong [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts) bằng các hoạt động đọc/ghi đồng bộ hoặc bất đồng bộ trên `localStorage`. Dịch vụ chatbot AI sẽ sử dụng bộ sinh bất đồng bộ (ES6 Async Generator) để mô phỏng luồng stream chữ của AI.

**Công nghệ sử dụng:** Next.js, TypeScript, localStorage API, ES6 Async Generators

---

### Task 1: Thiết Lập Khởi Tạo Database Mock & Các Hàm Tiện Ích

**File cần sửa:**
- [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts#L1-L28)

**Bước 1: Viết các hàm tiện ích**
Triển khai `getMockData`, `setMockData` và `initMockDB` trong `services.ts` để nạp sẵn dữ liệu mặc định cho môn học, nhiệm vụ học tập, mục tiêu, lịch sử chat và điểm số khi ứng dụng tải lần đầu.

**Bước 2: Xác minh biên dịch**
Đảm bảo mã nguồn không có lỗi cú pháp TypeScript.

**Bước 3: Commit**
```bash
git add fe/src/lib/services.ts
git commit -m "mock: add helper functions and init database"
```

---

### Task 2: Mock Dịch Vụ Xác Thực Người Dùng

**File cần sửa:**
- [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts) (khối `userService`)

**Bước 1: Thay thế các phương thức của userService**
- `create`: Thêm người dùng mới đăng ký vào danh sách người dùng mock trong `localStorage`.
- `getAll`: Trả về danh sách người dùng mock.
- `getById`: Lấy thông tin người dùng cụ thể.
- `update`: Hợp nhất thông tin người dùng được cập nhật.

**Bước 2: Xác minh**
Đảm bảo màn hình đăng nhập đăng nhập thành công với tài khoản mặc định `test@gmail.com` hoặc tài khoản mới tự đăng ký.

**Bước 3: Commit**
```bash
git commit -am "mock: implement userService mock"
```

---

### Task 3: Mock Các Dịch Vụ Môn Học, Học Kỳ, Nhiệm Vụ & Mục Tiêu

**File cần sửa:**
- [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts) (các khối `academicTermService`, `courseService`, `studyTaskService`, `studySessionService`, `learningGoalService`)

**Bước 1: Triển khai lưu trữ trạng thái local**
- `academicTermService`: Đọc/ghi thông tin học kỳ.
- `courseService`: Đọc/ghi thông tin môn học.
- `studyTaskService`: Hỗ trợ đầy đủ chức năng CRUD (đọc, thêm mới, sửa trạng thái và xóa nhiệm vụ).
- `studySessionService`: Đọc/ghi thời gian tự học tập trung.
- `learningGoalService`: Đọc/ghi mục tiêu học tập (đang thực hiện, hoàn thành).

**Bước 2: Xác minh**
Mở Dashboard, Nhiệm vụ và Mục tiêu để đảm bảo các thao tác tạo mới và sửa đổi được cập nhật tức thì trên giao diện và lưu trữ vĩnh viễn trên refresh.

**Bước 3: Commit**
```bash
git commit -am "mock: implement task, course, term, session and goal services"
```

---

### Task 4: Mock Ghi Nhận Cảm Xúc & Đánh Giá Tâm Lý

**File cần sửa:**
- [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts) (các khối `emotionLogService`, `mentalAssessmentService`)

**Bước 1: Triển khai nạp dữ liệu local**
- `emotionLogService`: Lưu nhận xét cảm xúc mới vào danh sách.
- `mentalAssessmentService`: Trả về dữ liệu lịch sử đánh giá tâm lý mock.

**Bước 2: Xác minh**
Ghi nhận cảm xúc mới trên trang Sức khỏe tinh thần và xác minh nó hiển thị ngay trong danh sách lịch sử.

**Bước 3: Commit**
```bash
git commit -am "mock: implement emotion and mental assessment services"
```

---

### Task 5: Mock Điểm Số & Hiệu Suất Học Tập

**File cần sửa:**
- [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts) (các khối `gradeService`, `academicPerformanceService`)

**Bước 1: Triển khai Mock Điểm số và Tính toán GPA**
- `gradeService`: Hỗ trợ thêm điểm môn học mới, cập nhật và xóa.
- `academicPerformanceService.getStatistics`: Tự động tính toán GPA học kỳ, tích lũy, số tín chỉ dựa vào điểm thực tế lưu trong `localStorage`.
- `academicPerformanceService.getBasicStatistics`: Trả về tổng GPA và số tín chỉ hoàn thành để hiển thị trên Dashboard.

**Bước 2: Xác minh**
Mở trang Bảng điểm, nhập điểm tay cho một môn học và lưu. Kiểm tra xem biểu đồ GPA và các thẻ thống kê tổng quan có cập nhật lại tương ứng hay không.

**Bước 3: Commit**
```bash
git commit -am "mock: implement grade and academic performance services"
```

---

### Task 6: Mock Trợ Lý AI Chatbot Với Trình Giả Lập Stream

**File cần sửa:**
- [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts) (khối `chatService`)

**Bước 1: Triển khai Lưu lịch sử chat & Tạo luồng chữ chạy**
- `getSessions`: Trả về danh sách phòng chat.
- `createSession`: Tạo phòng chat mới.
- `getMessages`: Trả về danh sách tin nhắn.
- `sendMessageStream`:
  - Lưu tin nhắn người dùng vào danh sách tin nhắn của phòng chat trong `localStorage`.
  - Phân tích từ khóa trong tin nhắn để sinh ra nội dung phản hồi thông minh (VD: phản hồi về stress, về Pomodoro, hoặc lời khuyên học tập).
  - Trả về async generator phát sinh từng mảnh nhỏ của câu trả lời với độ trễ (50ms - 100ms) để giao diện chatbot chạy hiệu ứng gõ chữ trực tiếp.
  - Khi hoàn tất, ghi nhận tin nhắn AI đầy đủ vào `localStorage`.

**Bước 2: Xác minh**
Vào trang Hỏi đáp AI, nhắn tin và theo dõi phản hồi chữ chạy chân thực.

**Bước 3: Commit**
```bash
git commit -am "mock: implement chat sessions and streaming mock AI response"
```

---

### Task 7: Mock Dịch Vụ Thông Báo & Ping Kiểm Tra Hệ Thống

**File cần sửa:**
- [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts) (các khối `notificationService`, `healthCheck`)

**Bước 1: Triển khai Mock Thông báo và Ping**
- `notificationService.getAll`: Trả về danh sách thông báo nhắc nhở làm bài tập, học tập.
- `notificationService.markRead` & `markAllRead`: Đánh dấu đã đọc trong `localStorage`.
- `healthCheck`: Luôn giải quyết thành công `Promise.resolve({ status: 200, data: 'pong' })`.

**Bước 2: Xác minh**
Dashboard không hiển thị lỗi kết nối API và trạng thái hệ thống hiển thị màu xanh lá "Backend API đang hoạt động bình thường".

**Bước 3: Commit**
```bash
git commit -am "mock: implement notifications and healthcheck"
```
