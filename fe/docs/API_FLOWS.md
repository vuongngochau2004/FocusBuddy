# Frontend - Backend API Interaction Flows

> **Project:** FocusBuddy  
> **Auth Architecture:** JWT Bearer Authentication (`Authorization: Bearer <token>`)  
> **Status:** SYNCHRONIZED  

---

## 1. Authentication & Registration Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Sinh viên
    participant FE as Next.js Client
    participant AuthCtx as AuthContext
    participant Axios as lib/api.ts
    participant BE as FastAPI Backend (/api/v1/auth)
    participant DB as PostgreSQL

    %% Registration
    rect rgb(240, 245, 255)
        note over User, DB: Flow 1: Đăng ký tài khoản mới (Atomic Transaction)
        User->>FE: Điền Form tại /register
        FE->>AuthCtx: register(formData)
        AuthCtx->>BE: POST /api/v1/auth/register
        BE->>DB: Tạo User + UserPreference + StudentProfile (Atomic)
        DB-->>BE: Commit OK
        BE-->>AuthCtx: { access_token, token_type: "bearer", expires_in, user }
        AuthCtx->>AuthCtx: Lưu focusbuddy_token vào localStorage & state
        AuthCtx-->>FE: Chuyển hướng sang /dashboard
    end

    %% Login
    rect rgb(245, 255, 240)
        note over User, DB: Flow 2: Đăng nhập (JWT Issuance)
        User->>FE: Điền Email + Mật khẩu tại /login
        FE->>AuthCtx: login(credentials)
        AuthCtx->>BE: POST /api/v1/auth/login
        BE->>DB: Truy vấn User theo email, verify bcrypt hash
        alt Sai mật khẩu / không tìm thấy
            BE-->>AuthCtx: 401 Unauthorized (detail: "Invalid email or password")
            AuthCtx-->>FE: Hiển thị thông báo lỗi trên UI
        else Hợp lệ
            BE-->>AuthCtx: { access_token, token_type: "bearer", expires_in, user }
            AuthCtx->>AuthCtx: Lưu focusbuddy_token vào localStorage & state
            AuthCtx-->>FE: Chuyển hướng sang /dashboard
        end
    end

    %% Session Restore on F5
    rect rgb(255, 250, 240)
        note over User, DB: Flow 3: Khôi phục Session khi F5/Reload
        User->>FE: F5 / Mở lại trang /dashboard
        FE->>AuthCtx: mount AuthProvider
        AuthCtx->>AuthCtx: Đọc localStorage.getItem('focusbuddy_token')
        AuthCtx->>Axios: GET /api/v1/auth/me
        Axios->>BE: GET /api/v1/auth/me (Header Authorization: Bearer <token>)
        BE->>BE: get_current_user giải mã JWT payload
        BE-->>AuthCtx: UserResponse
        AuthCtx->>AuthCtx: set user, isAuthenticated = true, isLoading = false
        AuthCtx-->>FE: Render Dashboard & TopBar với tên sinh viên
    end

    %% Logout
    rect rgb(255, 240, 245)
        note over User, DB: Flow 4: Đăng xuất
        User->>FE: Bấm Đăng xuất tại Sidebar
        FE->>AuthCtx: logout()
        AuthCtx->>BE: POST /api/v1/auth/logout (Bearer Token)
        AuthCtx->>AuthCtx: Xóa sạch focusbuddy_token & reset state
        AuthCtx-->>FE: Chuyển hướng về /login
    end
```

---

## 2. Business APIs & Route Guard Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Sinh viên
    participant FE as Protected Page (e.g. /schedule)
    participant Guard as (app)/layout.tsx Guard
    participant Axios as lib/api.ts Interceptor
    participant BE as FastAPI Domain Router

    User->>FE: Truy cập URL /schedule
    FE->>Guard: Kiểm tra AuthState
    alt Chưa đăng nhập (Không có token)
        Guard-->>FE: Chuyển hướng về /login
    else Đã đăng nhập
        Guard-->>FE: Render Layout
        FE->>Axios: studyTaskService.getAll()
        Axios->>Axios: Gắn Authorization: Bearer <token>
        Axios->>BE: GET /api/v1/study-tasks
        BE->>BE: get_current_user_id(token)
        BE-->>Axios: { items: StudyTask[], total: int }
        Axios-->>FE: Render danh sách nhiệm vụ học tập
    end
```

---

## 3. Chatbot Streaming Interaction Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Sinh viên
    participant ChatUI as /chatbot (page.tsx)
    participant Stream as fetch() Reader (TextDecoder)
    participant BE as /api/v1/chat/sessions/{id}/messages
    participant AI as Agent Runtime & LLM

    User->>ChatUI: Nhập câu hỏi & bấm Gửi
    ChatUI->>ChatUI: Thêm tin nhắn USER và tạo placeholder BOT rỗng
    ChatUI->>BE: POST /api/v1/chat/sessions/{id}/messages (Bearer Token)
    BE->>AI: execute_chat(content)
    AI-->>BE: yield chunk
    BE-->>Stream: StreamingResponse (text/event-stream)
    loop Đọc từng chunk qua reader.read()
        Stream->>Stream: decoder.decode(value)
        Stream->>ChatUI: Cập nhật text lũy kế vào bubble Bot (Real-time)
    end
    Stream-->>ChatUI: Stream hoàn tất (done = true), kết thúc loading
```
