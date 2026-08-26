# Lịch Học & Nhiệm Vụ (Schedule Tab) Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Hoàn thiện giao diện tab "Lịch học & Nhiệm vụ" (`/schedule`) với Mock Data ở Frontend, khớp 100% với ảnh chụp thiết kế của FocusBuddy.

**Architecture:** Sử dụng React + Next.js App Router kết hợp Framer Motion cho animation và Mock Service lưu trữ tại `localStorage` để toàn bộ thao tác lọc, đổi trạng thái và thêm mới nhiệm vụ hoạt động mượt mà không cần can thiệp Backend.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Lucide React, Framer Motion.

---

### Task 1: Khởi tạo Mock Data chuẩn cho Tab Lịch Học
**Files:**
- Modify: `fe/src/lib/services.ts`

**Nội dung:**
- Cung cấp sẵn 3 task mẫu:
  1. `Làm bài tập Giải tích 1 (Tuần 1)` - `Bài tập chương 1 về giới hạn dãy số` (TODO - Chưa làm)
  2. `Cài đặt Stack và Queue bằng C++` - `Thực hành môn Cấu trúc dữ liệu` (IN_PROGRESS - Đang làm)
  3. `Đọc slide chương 1 Kỹ thuật lập trình` - `Làm quen với con trỏ trong C/C++` (DONE - Hoàn thành)
- Đảm bảo các hàm `getAll`, `create`, `update`, `delete` của `studyTaskService` hoạt động tức thì trên `localStorage`.

---

### Task 2: Hoàn thiện UI trang Lịch Học (`fe/src/app/(app)/schedule/page.tsx`)
**Files:**
- Modify: `fe/src/app/(app)/schedule/page.tsx`

**Nội dung:**
- Khối tiêu đề: Icon lịch nền xanh nhạt + text "Lịch học & Nhiệm vụ" + "Quản lý các công việc học tập của bạn".
- Bộ filter tabs: "Tất cả (3)", "Chưa làm", "Đang làm", "Hoàn thành" với style pill tím pastel khi active.
- Danh sách Task Cards:
  - Hiển thị đúng 3 icon trạng thái (Xám cho Chưa làm, Vàng cho Đang làm, Xanh lá cho Hoàn thành).
  - Text strikethrough khi trạng thái là `DONE`.
  - Tương tác click icon để chuyển đổi nhanh trạng thái: `TODO` -> `IN_PROGRESS` -> `DONE`.
- Nút "+ Thêm nhiệm vụ" và Form modal thêm task mới nhanh chóng.

---

### Task 3: Xác minh & Kiểm thử giao diện
**Files:**
- Kiểm tra trực quan trên trình duyệt tại `http://localhost:3000/schedule`.
- Kiểm tra tính năng lọc danh sách theo tab, chuyển trạng thái và thêm mới.
