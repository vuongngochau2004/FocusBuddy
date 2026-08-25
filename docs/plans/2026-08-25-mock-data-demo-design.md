# Hệ Thống Mock Data Client-Side cho Bản Demo FocusBuddy

## Ngữ Cảnh & Mục Tiêu
FocusBuddy cần một bản demo giao diện (frontend) hoàn chỉnh và có tính tương tác cao để chạy độc lập mà không cần khởi động server backend. Khi người dùng thực hiện các thao tác (như đăng ký, đăng nhập, tạo mục tiêu, kiểm tra nhiệm vụ, thêm điểm số hoặc chat với AI), frontend sẽ phản hồi động, cập nhật giao diện ngay lập tức và lưu trữ trạng thái này qua các trang hoặc khi tải lại trang (reload).

## Phương Án Đề Xuất (Mock ở Lớp Service)
Chúng ta sẽ thay thế các cuộc gọi Axios và Fetch trong [services.ts](file:///g:/Chat%20Box/fe/src/lib/services.ts) bằng các hàm xử lý dữ liệu động lưu trong `localStorage`.

### Tại sao chọn phương án này?
- **Tính Chân Thực Cao**: Sử dụng `localStorage` giúp dữ liệu có trạng thái (stateful). Khi người dùng thêm một nhiệm vụ, nó xuất hiện ngay lập tức, tồn tại khi chuyển trang và giữ nguyên khi tải lại trang.
- **Hỗ Trợ Streaming Chat**: Thành phần Chatbot Next.js sử dụng ES6 Async Generators (`for await (const chunk of stream)`) bỏ qua Axios và đọc trực tiếp từ luồng `fetch`. Mock ở tầng service cho phép chúng ta trả về các phần nhỏ (chunk) câu trả lời của AI kèm theo độ trễ ngẫu nhiên, tạo cảm giác phản hồi theo thời gian thực (typing indicator và streaming).
- **Không Ảnh Hưởng Đến Component Giao Diện**: Các trang và component giữ nguyên mã nguồn hiện tại, chúng chỉ gọi các hàm từ `services.ts` như bình thường.

## Cấu Trúc Mock Data (trong `localStorage`)
Chúng ta sẽ khởi tạo các khóa mock sau đây nếu chúng chưa tồn tại:
1. `focusbuddy_users`: Danh sách các tài khoản người dùng đã đăng ký hoặc mặc định.
2. `focusbuddy_tasks`: Danh sách nhiệm vụ học tập (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`).
3. `focusbuddy_goals`: Danh sách mục tiêu học tập (`ACTIVE`, `ACHIEVED`, `FAILED`).
4. `focusbuddy_academic_terms`: Danh sách học kỳ.
5. `focusbuddy_courses`: Danh sách môn học.
6. `focusbuddy_grades`: Danh sách bản ghi điểm số.
7. `focusbuddy_emotions`: Lịch sử ghi nhận cảm xúc.
8. `focusbuddy_assessments`: Danh sách đánh giá sức khỏe tinh thần.
9. `focusbuddy_chat_sessions`: Các phiên trò chuyện với AI.
10. `focusbuddy_chat_messages`: Ánh xạ `session_id` -> danh sách tin nhắn.

## Triển Khai Các Dịch Vụ Quan Trọng

### 1. Xác Thực Người Dùng
- `userService.getAll`: Trả về danh sách người dùng mock.
- `userService.create`: Đăng ký người dùng mới và lưu vào `localStorage`.
- Hỗ trợ tự động đăng nhập: nếu backend không hoạt động, màn hình đăng nhập sẽ kiểm tra tài khoản mặc định (`test@gmail.com`).

### 2. Trình Giả Lập Chatbot AI Streaming
- `chatService.sendMessageStream`:
  - Lưu tin nhắn của người dùng vào danh sách tin nhắn của phiên đó.
  - Phân tích nội dung tin nhắn và lấy câu trả lời AI thông minh phù hợp ngữ cảnh.
  - Trả về một async generator tạo ra các mảnh chữ (khoảng 5 ký tự mỗi lần) kèm độ trễ ngẫu nhiên (50ms - 100ms) để mô phỏng AI đang phản hồi.
  - Khi luồng kết thúc, lưu tin nhắn hoàn chỉnh của AI vào `localStorage`.

### 3. Mục Tiêu, Lịch Trình/Nhiệm Vụ & Điểm Số
- Triển khai đầy đủ các thao tác CRUD (thêm, cập nhật trạng thái, xóa) cho nhiệm vụ.
- Hỗ trợ thêm mục tiêu mới.
- Hỗ trợ thêm học kỳ, môn học và điểm số thủ công, tự động tính toán lại GPA tích lũy và cập nhật biểu đồ.

## Kế Hoạch Xác Minh (Test Plan)
1. **Đăng nhập & Đăng ký**: Kiểm tra việc tạo tài khoản chuyển hướng thành công đến Dashboard.
2. **Dashboard**: Xác minh số giờ học hôm nay, chuỗi tập trung (streak), điểm GPA và số lượng mục tiêu hiển thị đúng dữ liệu mock.
3. **Chatbot AI**: Gửi tin nhắn và xem hiệu ứng hiển thị chữ chạy (streaming response).
4. **Mục Tiêu & Lịch Học**: Thêm mục tiêu và nhiệm vụ mới để kiểm tra sự cập nhật tức thì.
5. **Bảng Điểm**: Thêm điểm số thủ công và xác nhận biểu đồ GPA học kỳ thay đổi theo thời gian thực.
