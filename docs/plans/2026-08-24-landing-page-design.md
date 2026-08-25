# TÀI LIỆU THIẾT KẾ: LANDING PAGE FOCUSBUDDY

**Ngày**: 24-08-2026
**Trạng thái**: Đã phê duyệt
**Tác giả**: Antigravity

## 1. Tổng quan
Landing page FocusBuddy là một trang chủ hiện đại mang phong cách AI SaaS cao cấp, được thiết kế để giới thiệu sản phẩm như một "AI Student Companion" (Người bạn đồng hành học tập AI). Trang web làm nổi bật kiến trúc multi-agent (Supervisor-Worker) bên dưới và cung cấp các tương tác trực quan như giả lập chat, quy trình quét điểm OCR và các hiệu ứng scroll/orbit mượt mà để thu hút người dùng.

## 2. Hệ thống thiết kế & Phong cách
*   **Màu sắc**:
    *   Nền chủ đạo: Trắng kết hợp với lớp phủ oải hương nhạt (`#F8F7FF` đến `#FFFFFF`).
    *   Màu nhấn: Xanh Indigo đậm (`#4F46E5`), Tím Violet (`#7C3AED`), Tím oải hương nhạt (`#EEF2FF`).
    *   Gradient: Gradient tím-xanh chuyển động mượt mà, hiệu ứng phát sáng neon mờ phía sau các phần tử trực quan chính.
*   **Thành phần**: Glassmorphism (`backdrop-blur-md bg-white/70 border border-white/20`), hiệu ứng chuyển đổi mượt mà, bóng đổ mềm.
*   **Typography**: Font chữ không chân hiện đại (phong cách Outfit/Inter) dễ đọc.

## 3. Cấu trúc thư mục & Định tuyến
Chúng ta sẽ tạo một thư mục chuyên biệt song song với `login` và `register` trong `fe/src/app`:
*   `fe/src/app/landing` (định tuyến đến `/landing`)
    *   `page.tsx` (Bố cục chính chứa tất cả các phần thành phần)
    *   `components/Navbar.tsx`
    *   `components/Hero.tsx`
    *   `components/TrustStrip.tsx`
    *   `components/Features.tsx`
    *   `components/ArchitectureAnimation.tsx`
    *   `components/InteractiveAgents.tsx`
    *   `components/Personalization.tsx`
    *   `components/WorkflowOCR.tsx`
    *   `components/StreamingDemo.tsx`
    *   `components/FAQ.tsx`
    *   `components/FinalCTA.tsx`
    *   `components/Footer.tsx`

Để hiển thị landing page làm trang chủ mặc định tại `/`, chúng ta cập nhật `fe/src/app/page.tsx`:
1.  Kiểm tra `focusbuddy_user_id` trong `localStorage` bằng `useEffect`.
2.  Nếu đã đăng nhập, chuyển hướng người dùng đến `/dashboard`.
3.  Nếu chưa đăng nhập, kết xuất trực tiếp thành phần `<LandingPage />` để khách ghé thăm xem nội dung giới thiệu sản phẩm.

## 4. Các phần chính & Tính năng tương tác

1.  **Navbar**: Sticky, làm mờ nền, logo FocusBuddy, các liên kết danh mục, nút Đăng nhập & CTA Bắt đầu miễn phí.
2.  **Hero**: Headline lớn với gradient chữ nổi bật, nút hành động, danh sách social proof, khung điện thoại hiển thị khung chat giả lập cùng robot 3D bay quanh theo quỹ đạo và 4 thẻ sub-agent trôi nổi phản hồi theo con trỏ chuột (Parallax).
3.  **Trust Strip**: Thể hiện các tính năng công nghệ cốt lõi (Bảo mật, SSE Streaming, OCR, đa mô hình).
4.  **Tính năng nổi bật**: Lưới 4 thẻ premium (Academic, Psychology, Schedule, General) phản hồi khi hover.
5.  **Luồng kiến trúc Multi-Agent**: Trực quan hóa đường đi dữ liệu từ User -> Backend API -> Supervisor -> Router -> Sub-Agents với các đường nối động.
6.  **"Một trợ lý — nhiều chuyên gia" (Chat tương tác)**: Khung demo chatbot với các tab chuyển đổi giữa 4 Sub-Agent hiển thị các đoạn hội thoại chuyên sâu mẫu.
7.  **Cá nhân hóa (Context & Memory)**: Mô tả trực quan đầu vào lịch sử chat và học tập để tạo đề xuất cá nhân hóa.
8.  **Quy trình OCR điểm số**: Giả lập quy trình tải lên bảng điểm, hiệu ứng tia quét laser, trích xuất điểm và AI gợi ý cải thiện GPA.
9.  **Giả lập AI Streaming**: Hiệu ứng gõ chữ từng ký tự (token-by-token) thể hiện tính năng phản hồi SSE tức thì.
10. **FAQ**: Accordion danh sách 5 câu hỏi thường gặp.
11. **Final CTA & Footer**: Khung kêu gọi hành động màu tím ấn tượng và footer liên kết.

## 5. Kế hoạch xác thực
*   **Responsive**: Kiểm tra hiển thị trên Desktop, Tablet và Mobile.
*   **Tương tác**: Kiểm tra các liên kết cuộn trang, Accordion FAQ, chuyển đổi tab Agent và quy trình OCR.
*   **Định tuyến**: Đảm bảo truy cập `/` hiển thị landing page cho khách và tự chuyển hướng sinh viên đã đăng nhập đến Dashboard.
