# Hướng dẫn Tích hợp Frontend (Frontend Integration Guide)

Tài liệu này hướng dẫn cách Frontend (Web/Mobile App hoặc Robot) kết nối an toàn với các API của FocusBuddy Backend.

## 1. Cơ chế Xác thực (Authentication)

Tất cả các API (ngoại trừ các public endpoint như `/health` hoặc login/register) đều yêu cầu Client phải đính kèm thông tin định danh người dùng trong Header của HTTP Request.

### Sử dụng Header `X-User-Id`
Hiện tại, hệ thống hỗ trợ việc truyền trực tiếp định danh người dùng thông qua Header `X-User-Id`. Giá trị này là UUID của sinh viên trong Database.

**Ví dụ Request bằng Fetch API (JavaScript):**
```javascript
const userId = "123e4567-e89b-12d3-a456-426614174000"; // Lấy từ Local Storage sau khi đăng nhập

fetch("http://localhost:1002/api/v1/chat/message", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-Id": userId 
  },
  body: JSON.stringify({
    message: "Tình hình học tập của mình dạo này thế nào?"
  })
})
.then(response => response.json())
.then(data => console.log("AI Trả lời:", data));
```

> [!WARNING]
> Việc sử dụng trực tiếp `X-User-Id` chỉ nên dùng trong môi trường Phát triển (Development) hoặc kết nối nội bộ từ Robot. Trong môi trường Production, hệ thống sẽ sử dụng **JWT Token** qua header `Authorization: Bearer <token>`, và Middleware sẽ tự động giải mã token để trích xuất `user_id`.

## 2. Gọi API Trợ lý Ảo (Agent V2)

### 2.1. Nhắn tin với Chatbot
API `/api/v1/chat/message` là API duy nhất Frontend cần gọi để giao tiếp với AI. 
Hệ thống AI (General, Academic, Mental Health) được định tuyến **tự động** dựa trên nội dung tin nhắn. 

Frontend không cần (và không nên) gọi trực tiếp các API nội bộ (như lấy điểm số) rồi tự đút vào Prompt. AI Agent sẽ tự động sử dụng Tool để tra cứu dữ liệu nếu cần.

### 2.2. Xử lý Trạng thái Trả lời (Loading State)
Quá trình AI xử lý (bao gồm việc phát hiện Intent, gọi Tools, sinh câu trả lời) có thể mất từ 2-5 giây (hoặc lâu hơn nếu gọi qua mạng chậm). Frontend cần hiển thị giao diện "AI đang suy nghĩ..." (Typing indicator) ngay sau khi gửi request.

## 3. Khám phá toàn bộ API

Thay vì viết tài liệu thủ công cho hàng chục Endpoints, hệ thống sử dụng **Swagger UI** (OpenAPI) tự sinh để đảm bảo tài liệu luôn chính xác 100% với code thực tế.

Để xem danh sách toàn bộ các API, các tham số bắt buộc (Query/Body Params), và cấu trúc JSON trả về, hãy truy cập:

- **Swagger UI:** `http://localhost:1002/docs`
- **ReDoc:** `http://localhost:1002/redoc`

Bạn có thể test trực tiếp API trên giao diện Swagger bằng nút **"Try it out"**. Đừng quên cuộn xuống phần Headers để nhập `X-User-Id` trước khi Execute.
