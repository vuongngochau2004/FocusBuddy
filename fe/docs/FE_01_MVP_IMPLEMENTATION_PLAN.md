# FE-01 — FINAL MVP IMPLEMENTATION PLAN
## FocusBuddy Frontend Architecture & Demo Migration Plan

---

## 1. Executive Summary

### Bối cảnh & Vấn đề hiện tại
- **Backend Authentication (`BE-AUTH-1`) đã hoàn thành**:
  - Backend sử dụng chuẩn **JWT Bearer Token** (`Authorization: Bearer <token>`).
  - Đã đóng hoàn toàn endpoint duyệt danh sách user công khai (`GET /api/v1/users` $\to$ `403 Forbidden`).
  - Hỗ trợ 4 endpoint Auth chuẩn: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`.
- **Frontend hiện tại đang bị lỗi chặn (Blocker)**:
  - `LoginPage` vẫn sử dụng logic cũ: gọi `GET /api/v1/users` để tìm email trong bộ nhớ client $\implies$ **Bị 403 Forbidden, không thể đăng nhập**.
  - `RegisterPage` gọi `POST /api/v1/users` thay vì `POST /api/v1/auth/register` $\implies$ **Không nhận được JWT token**.
  - `fe/src/lib/api.ts` tự động chèn header `x-user-id` thay vì `Authorization: Bearer <token>` $\implies$ **Tất cả các API nghiệp vụ đều bị từ chối (401 Unauthorized)**.
  - Chatbot gửi tin nhắn qua `Axios.post` thông thường trong khi Backend trả về `StreamingResponse (text/event-stream)` $\implies$ **Lỗi nhận phản hồi AI**.

### Mục tiêu của Plan v2
1. **Frontend chạy ổn định 100% cho Demo/MVP**.
2. **Loại bỏ hoàn toàn legacy auth** (`x-user-id`, `GET /users` login) và kết nối mượt mà với Backend Auth mới.
3. **Các trang nghiệp vụ chính** (Dashboard, Lịch học, Điểm số, Mục tiêu, Sức khỏe, Thông báo) hiển thị đúng dữ liệu thực tế từ Backend.
4. **Chatbot** gửi được tin nhắn và hiển thị phản hồi từ AI stream.
5. **Zero Over-engineering**: Không thêm framework quản lý state (Redux/Zustand), không refresh-token rotation, không middleware phức tạp.

---

## 2. MUST HAVE (Bắt buộc cho Demo)

- [ ] **JWT API Client Interceptor**: `fe/src/lib/api.ts` tự động đọc token từ `localStorage` và đính kèm header `Authorization: Bearer <token>` vào mọi request.
- [ ] **Smart 401 Interceptor**: Tự động xóa token và chuyển hướng về `/login` khi token hết hạn trên các API được bảo vệ, nhưng **không** nuốt lỗi 401 khi user nhập sai mật khẩu tại trang Login.
- [ ] **Minimal Auth Service**: Thêm các hàm `register`, `login`, `getMe`, `logout` vào `fe/src/lib/services.ts`.
- [ ] **Minimal Auth State (`AuthContext + useAuth`)**: Cung cấp `{ user, token, isLoading, isAuthenticated, login, register, logout }` cho toàn bộ giao diện.
- [ ] **Login & Register UI Flow**:
  - `LoginPage`: Gọi `login()`, nhận JWT, lưu `localStorage`, chuyển hướng sang `/dashboard`. Hiển thị thông báo lỗi rõ ràng nếu sai tài khoản/mật khẩu.
  - `RegisterPage`: Gọi `register()`, nhận JWT, tự động chuyển hướng sang `/dashboard`.
- [ ] **Session Restore**: F5/refresh trang tự động gọi `GET /api/v1/auth/me` để khôi phục thông tin `user` và giữ trạng thái đăng nhập.
- [ ] **Client Route Guard**: `app/(app)/layout.tsx` kiểm tra nếu chưa đăng nhập thì chuyển hướng về `/login`.
- [ ] **Xóa bỏ `x-user-id`**: Không còn sót lại việc gán header `x-user-id` trong code frontend active.
- [ ] **Chatbot Streaming**: `fe/src/app/(app)/chatbot/page.tsx` đọc response stream từ Backend và hiển thị câu trả lời của AI trên UI.
- [ ] **Verify các trang chính**: Đảm bảo các trang Dashboard, Schedule, Scores, Goals, Mental Health, Notifications tải được dữ liệu từ Backend bằng Bearer Token.

---

## 3. SHOULD HAVE (Nên làm nếu thuận tiện)

- [ ] **Đồng bộ Types cần thiết**: Bổ sung `AuthResponse`, `UserRegisterRequest`, `LoginRequest` trong `fe/src/types/index.ts`.
- [ ] **Cập nhật docs API Contract**: Sửa `fe/docs/FE_BE_API_CONTRACT.md` và `fe/docs/API_FLOWS.md` để bỏ `X-User-Id` và ghi đúng Bearer token.
- [ ] **TopBar Profile**: Hiển thị tên sinh viên lấy trực tiếp từ `useAuth().user?.full_name` thay vì đọc thô từ `localStorage`.

---

## 4. DEFERRED (Hoãn lại sau Demo / Production Hardening)

- ❌ Refresh Token Rotation / Auto-refresh token ngầm.
- ❌ Token Blacklist / Redis Session / Server-side Revocation.
- ❌ Cookie-based Session / Next.js Server-Side Middleware Authentication.
- ❌ Redux Toolkit / Zustand / React Query / Recoil.
- ❌ Tái cấu trúc toàn bộ thư mục sang Feature-Sliced Design.
- ❌ Viết lại toàn bộ hệ thống TypeScript Types không gây lỗi compile.
- ❌ Xóa hàng loạt file rỗng (chỉ dọn dẹp khi chắc chắn không ảnh hưởng đến build).
- ❌ E2E Automation Test Suite (Cypress / Playwright).

---

## 5. Implementation Phases (6 Giai đoạn tinh gọn)

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: JWT API Client & Auth Service Definition           │ (Độ phức tạp: LOW)
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ PHASE 2: Auth State & Login / Register Integration          │ (Độ phức tạp: MEDIUM)
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ PHASE 3: Client Route Guard & Session Persistence           │ (Độ phức tạp: LOW)
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ PHASE 4: Domain APIs Verification                           │ (Độ phức tạp: LOW)
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ PHASE 5: Chatbot Response Streaming Integration             │ (Độ phức tạp: MEDIUM)
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ PHASE 6: Optional Docs Sync & Verification Wrap-up          │ (Độ phức tạp: LOW)
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 1: JWT API Client & Auth Service Definition
- **Mục tiêu**: Cấu hình Axios tự động gửi Bearer token và định nghĩa service Auth.
- **Nội dung thực hiện**:
  1. `fe/src/lib/api.ts`:
     - Sửa Request Interceptor: Lấy `focusbuddy_token` từ `localStorage`, nếu có thì gán `config.headers.Authorization = 'Bearer ' + token`.
     - Bỏ gán `config.headers['x-user-id']`.
     - Thêm Response Interceptor: Nếu gặp `401 Unauthorized` từ các API nghiệp vụ (ngoại trừ URL chứa `/auth/login`), thực hiện xóa token và `window.location.href = '/login'`.
  2. `fe/src/lib/services.ts`:
     - Thêm `authService`:
       - `login: (data) => api.post('/v1/auth/login', data)`
       - `register: (data) => api.post('/v1/auth/register', data)`
       - `getMe: () => api.get('/v1/auth/me')`
       - `logout: () => api.post('/v1/auth/logout')`
     - Loại bỏ việc dùng `userService.getAll` cho mục đích login.
  3. `fe/src/types/index.ts`: Bổ sung DTOs `LoginRequest`, `UserRegisterRequest`, `AuthResponse`.
- **Độ phức tạp**: `LOW`.
- **Verification**: Gửi thử 1 request kiểm tra qua tab Network xem có header `Authorization: Bearer ...` hay không.

---

### PHASE 2: Auth State & Login / Register UI Integration
- **Mục tiêu**: Xây dựng `AuthContext` tối giản và kết nối màn hình Đăng nhập / Đăng ký.
- **Nội dung thực hiện**:
  1. Tạo `fe/src/contexts/AuthContext.tsx`:
     - State tối thiểu: `user` (User | null), `token` (string | null), `isLoading` (boolean), `isAuthenticated` (boolean).
     - Hàm `login(email, password)`: Gọi `authService.login`, lưu token vào `localStorage`, cập nhật state, trả về user.
     - Hàm `register(data)`: Gọi `authService.register`, lưu token vào `localStorage`, cập nhật state.
     - Hàm `logout()`: Gọi `authService.logout().catch()`, xóa token khỏi `localStorage`, reset state, điều hướng về `/login`.
     - `useEffect`: Khi khởi động app, nếu có token thì gọi `authService.getMe()` để gán `user` và set `isAuthenticated = true`. Set `isLoading = false`.
  2. Tạo `fe/src/hooks/useAuth.ts`: Export hook `useAuth = () => useContext(AuthContext)`.
  3. `fe/src/app/layout.tsx`: Bọc cây component bằng `<AuthProvider>`.
  4. `fe/src/app/login/page.tsx`:
     - Thay thế đoạn code `userService.getAll` bằng `await login(email, password)`.
     - Bắt lỗi: Nếu sai mật khẩu hoặc user không tồn tại, hiển thị thông báo lỗi tiếng Việt trên UI, không bị crash hay reload trang.
  5. `fe/src/app/register/page.tsx`:
     - Thay thế `userService.create` bằng `await register(...)`.
     - Đăng ký thành công $\to$ Lưu session và tự động chuyển về `/dashboard`.
  6. `fe/src/components/layout/Sidebar.tsx`:
     - Nút "Đăng xuất" gọi `logout()` từ `useAuth()`.
  7. `fe/src/components/layout/TopBar.tsx`:
     - Hiển thị `user?.full_name` từ `useAuth()` (fallback: "Sinh viên").
- **Độ phức tạp**: `MEDIUM`.
- **Verification**:
  - Đăng ký tài khoản mới $\to$ vào được Dashboard.
  - Đăng xuất $\to$ về trang Login.
  - Đăng nhập với mật khẩu sai $\to$ hiện lỗi "Email hoặc mật khẩu không đúng".
  - Đăng nhập đúng $\to$ vào được Dashboard, TopBar hiển thị đúng tên.

---

### PHASE 3: Client Route Guard & Session Persistence
- **Mục tiêu**: Bảo vệ các trang trong `app/(app)/*` và khôi phục phiên khi reload.
- **Nội dung thực hiện**:
  1. `fe/src/app/(app)/layout.tsx`:
     - Lấy `isLoading` và `isAuthenticated` từ `useAuth()`.
     - Nếu `isLoading`: Render màn hình loading nhẹ (hoặc skeleton).
     - Nếu `!isAuthenticated`: Chuyển hướng `router.replace('/login')` hoặc `window.location.href = '/login'`.
     - Nếu `isAuthenticated`: Render Sidebar, TopBar và nội dung trang bình thường.
  2. `fe/src/app/page.tsx`:
     - Kiểm tra token: nếu có token $\to$ `/dashboard`, nếu không $\to$ `/login`.
- **Độ phức tạp**: `LOW`.
- **Verification**: Mở tab ẩn danh gõ thẳng `http://localhost:3000/dashboard` $\implies$ Tự động chuyển về `/login`.

---

### PHASE 4: Domain APIs Verification
- **Mục tiêu**: Kiểm tra và đảm bảo tất cả các trang chính đang hoạt động ổn định với Bearer token mới.
- **Nội dung thực hiện**:
  1. Kiểm tra các trang:
     - `/dashboard`: Thống kê, KPI, nhiệm vụ gần đây.
     - `/schedule`: Danh sách task học tập, tạo task mới.
     - `/scores`: Xem điểm môn học và thống kê GPA.
     - `/goals`: Danh sách mục tiêu học tập, thêm mục tiêu mới.
     - `/mental-health`: Nhật ký cảm xúc, kết quả đánh giá tâm lý.
     - `TopBar` Notifications: Danh sách thông báo, đánh dấu đã đọc.
  2. Nếu trang nào có lỗi binding field do Backend trả về kiểu dữ liệu khác, chỉnh sửa nhẹ nhàng tại trang đó mà không refactor lớn.
- **Độ phức tạp**: `LOW`.
- **Verification**: Truy cập từng trang trên UI $\to$ không có lỗi 401/403, dữ liệu được tải và hiển thị.

---

### PHASE 5: Chatbot Response Streaming Integration
- **Mục tiêu**: Đảm bảo màn hình `/chatbot` gửi được tin nhắn và nhận được câu trả lời từ AI theo format stream của Backend.
- **Nội dung thực hiện**:
  1. Kiểm tra `be/app/services/module_5_ai_chatbot/chat_service.py`: Backend endpoint `POST /api/v1/chat/sessions/{session_id}/messages` trả về `StreamingResponse (text/event-stream)`.
  2. `fe/src/app/(app)/chatbot/page.tsx`:
     - Cập nhật hàm `handleSend`: Dùng `fetch` với `Authorization: Bearer <token>` để nhận `ReadableStream`.
     - Dùng `TextDecoder` đọc từng chunk text và cập nhật trực tiếp vào tin nhắn của Bot trên giao diện theo thời gian thực (real-time stream).
     - Nếu AI backend trả về lỗi, hiển thị thông báo lỗi thân thiện mà không crash giao diện.
- **Độ phức tạp**: `MEDIUM`.
- **Verification**: Tạo đoạn chat mới $\to$ nhập câu hỏi $\to$ thấy chữ phản hồi của bot xuất hiện mượt mà.

---

### PHASE 6: Optional Docs Sync & Verification Wrap-up
- **Mục tiêu**: Cập nhật tài liệu khớp với code thực tế và kiểm tra tổng thể.
- **Nội dung thực hiện**:
  1. Cập nhật `fe/docs/FE_BE_API_CONTRACT.md` và `fe/docs/API_FLOWS.md` để loại bỏ các mô tả cũ về `X-User-Id` và `GET /users`.
  2. Chạy thử toàn bộ flow demo từ đầu đến cuối: Đăng ký $\to$ Đăng nhập $\to$ Tạo Task $\to$ Tạo Mục tiêu $\to$ Ghi cảm xúc $\to$ Chat AI $\to$ Đăng xuất.
- **Độ phức tạp**: `LOW`.
- **Verification**: Toàn bộ luồng demo chạy thông suốt, không có lỗi console nghiêm trọng.

---

## 6. Files to Modify

| File Path | Phase | Lý do sửa đổi |
| :--- | :--- | :--- |
| `fe/src/lib/api.ts` | Phase 1 | Đổi interceptor sang `Authorization: Bearer <token>`, thêm xử lý 401 |
| `fe/src/lib/services.ts` | Phase 1 | Thêm `authService`, bỏ gọi `userService.getAll` |
| `fe/src/types/index.ts` | Phase 1 | Thêm types cho Auth DTOs (`LoginRequest`, `UserRegisterRequest`, `AuthResponse`) |
| `fe/src/app/layout.tsx` | Phase 2 | Wrap `AuthProvider` vào ứng dụng |
| `fe/src/app/login/page.tsx` | Phase 2 | Tích hợp hàm `login()` từ `useAuth()`, hiển thị lỗi |
| `fe/src/app/register/page.tsx` | Phase 2 | Tích hợp hàm `register()` từ `useAuth()` |
| `fe/src/components/layout/Sidebar.tsx` | Phase 2 | Tích hợp hàm `logout()` từ `useAuth()` |
| `fe/src/components/layout/TopBar.tsx` | Phase 2 | Hiển thị tên user từ `useAuth()` |
| `fe/src/app/(app)/layout.tsx` | Phase 3 | Thêm client-side guard kiểm tra `isAuthenticated` |
| `fe/src/app/page.tsx` | Phase 3 | Redirect thông minh theo trạng thái session |
| `fe/src/app/(app)/chatbot/page.tsx` | Phase 5 | Đọc SSE stream từ endpoint Chat message |
| `fe/docs/FE_BE_API_CONTRACT.md` | Phase 6 | *(Optional)* Cập nhật tài liệu khớp với JWT |
| `fe/docs/API_FLOWS.md` | Phase 6 | *(Optional)* Cập nhật luồng Auth |

---

## 7. Files to Create

| File Path | Phase | Mục đích |
| :--- | :--- | :--- |
| `fe/src/contexts/AuthContext.tsx` | Phase 2 | Lưu trữ session state tối giản cho toàn bộ ứng dụng |
| `fe/src/hooks/useAuth.ts` | Phase 2 | Hook tiện ích để truy cập `AuthContext` |

---

## 8. Files to Delete

*Không xóa bất kỳ file nào trong giai đoạn này để đảm bảo an toàn tuyệt đối cho demo (DEFERRED).*

---

## 9. Verification Matrix

| Hạng mục kiểm tra | Thao tác thực tế | Kết quả mong đợi |
| :--- | :--- | :--- |
| **1. Đăng ký tài khoản** | Vào `/register`, điền tên, email, mật khẩu $\to$ bấm Đăng ký | Tài khoản được tạo trên BE, nhận JWT, tự vào `/dashboard` |
| **2. Đăng xuất** | Bấm "Đăng xuất" ở Sidebar | Xóa token, chuyển hướng về `/login` |
| **3. Đăng nhập sai** | Nhập mật khẩu sai ở `/login` | Hiện thông báo lỗi rõ ràng, không reload hay crash |
| **4. Đăng nhập đúng** | Nhập đúng email và mật khẩu vừa đăng ký | Nhận JWT, vào `/dashboard`, TopBar hiện đúng tên |
| **5. Bảo vệ Route** | Mở cửa sổ ẩn danh truy cập thẳng `/dashboard` | Tự động bị đẩy về `/login` |
| **6. Khôi phục Session** | Nhấn F5 tại `/dashboard` | Vẫn giữ đăng nhập, gọi `/auth/me` nạp lại thông tin |
| **7. API Lịch học** | Vào `/schedule`, tạo 1 task mới | Task được lưu vào BE và hiển thị trên danh sách |
| **8. API Mục tiêu** | Vào `/goals`, xem danh sách | Dữ liệu tải về thành công với Bearer token |
| **9. Chatbot AI** | Vào `/chatbot`, gửi tin nhắn | AI phản hồi dạng stream mượt mà, lưu vào session |

---

## 10. Definition of Done (Cho MVP Demo)

Frontend hoàn thành mục tiêu MVP khi:
1. **User có thể Đăng ký và Đăng nhập thành công với Backend thực tế**.
2. **JWT token được lưu trữ và tự động gắn vào header `Authorization: Bearer <token>`**.
3. **Các trang trong `app/(app)/*` được bảo vệ** (chưa đăng nhập không vào được).
4. **Không còn bất kỳ request nào gửi header `x-user-id` hoặc gọi `GET /users` để login**.
5. **Các trang chính (Dashboard, Schedule, Scores, Goals, Mental Health) hiển thị dữ liệu bình thường**.
6. **Chatbot gửi được tin nhắn và hiển thị câu trả lời dạng stream**.
7. **Không có lỗi runtime hoặc console blocking nào xảy ra trong quá trình demo**.

---

## 11. Thứ tự Implementation & Ước lượng độ phức tạp

| Thứ tự | Phase | Tên Phase | Độ phức tạp |
| :---: | :---: | :--- | :---: |
| **1** | **Phase 1** | JWT API Client & Auth Service Definition | **LOW** |
| **2** | **Phase 2** | Minimal Auth State & Login/Register UI Integration | **MEDIUM** |
| **3** | **Phase 3** | Client Route Guard & Session Persistence | **LOW** |
| **4** | **Phase 4** | Domain APIs Verification | **LOW** |
| **5** | **Phase 5** | Chatbot Response Streaming Integration | **MEDIUM** |
| **6** | **Phase 6** | Optional Docs Sync & Final Demo Walkthrough | **LOW** |

---

## 12. Implementation Status

```
STATUS: PLAN ONLY — NOT IMPLEMENTED
STATE: AUDIT & FINAL MVP IMPLEMENTATION PLAN v2 READY FOR REVIEW
```
