# Frontend Architecture Audit

> **Project:** FocusBuddy (AI Study Companion & Academic Assistant)  
> **Scope:** Frontend Application (`fe/`)  
> **Audit Date:** 23/08/2026  
> **Type:** AUDIT + DOCUMENTATION ONLY  

---

## 1. Executive Summary

Frontend của **FocusBuddy** là một Single-Page / Multi-Route Web Application được xây dựng trên nền tảng **Next.js 14 (App Router)** kết hợp với **TypeScript**, **TailwindCSS**, và **Framer Motion**. Ứng dụng cung cấp các phân hệ giao diện bao gồm: Trang chủ/Đăng nhập/Đăng ký, Dashboard tổng quan, Khung chat AI Study Buddy, Quản lý lịch học/nhiệm vụ (Tasks), Bảng điểm học tập (Scores), Mục tiêu cá nhân (Goals), Nhật ký tâm lý (Mental Health), và Cài đặt (Settings).  

Mặc dù tài liệu ban đầu định hướng cấu trúc Feature-based, trên thực tế toàn bộ logic giao diện, xử lý state và gọi API đang được viết tập trung trực tiếp (**Monolithic Page-based**) trong các file `page.tsx` thuộc `fe/src/app/(app)/`. Chưa có thư viện biểu đồ chuyên dụng (Chart.js / Recharts), tính năng xác thực còn ở mức cơ bản (dựa vào `localStorage` và header `x-user-id` không có JWT/middleware guard), và toàn bộ thư mục `features/`, `hooks/`, `stores/` hiện là các placeholder rỗng (`test.tsx`). Dẫu vậy, hệ thống Design System (Glassmorphism), layout khung (Sidebar, TopBar), API Service client (`services.ts`), và Typescript interfaces (`types/index.ts`) đã được định hình vững chắc và hoàn toàn sẵn sàng làm nền tảng để tái sử dụng và mở rộng cho phân hệ **Dashboard & Study Status** tiếp theo.

---

## 2. Technology Stack

| Category | Technology | Evidence (Source / Config) | Status |
|---|---|---|---|
| **Core Framework** | Next.js 14.2.5 (App Router) | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json#L15), [next.config.js](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/next.config.js) | Active |
| **Language** | TypeScript 5.x | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json#L27), [tsconfig.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/tsconfig.json) | Active |
| **UI Library** | React 18.3.1 | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json#L17-L18) | Active |
| **Styling & CSS** | TailwindCSS 3.4.1 + Custom Glassmorphism | [tailwind.config.ts](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/tailwind.config.ts), [globals.css](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/globals.css) | Active |
| **Animation** | Framer Motion 11.3.0 | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json#L13) | Active |
| **Icons** | Lucide React 0.400.0 | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json#L14) | Active |
| **Theme Provider** | next-themes 0.3.0 (Dark/Light mode) | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json#L16), [ThemeProvider.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/components/layout/ThemeProvider.tsx) | Active |
| **HTTP Client** | Axios 1.7.2 | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json#L12), [lib/api.ts](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/lib/api.ts) | Active |
| **State Management** | React Local State (`useState`, `useEffect`) | Source code in all `page.tsx` files | Active (No Zustand/Redux) |
| **Chart / Visualization** | *Chưa tích hợp thư viện chart (Recharts/Chart.js)* | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json) | Not Installed |
| **Form Handling** | React Controlled Inputs | `page.tsx` files | Native |
| **Build & Dev Tool** | Next CLI (`next dev`, `next build`) | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json#L5-L10), [Dockerfile](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/Dockerfile) | Active |
| **Package Manager** | npm (`package-lock.json`) | [package-lock.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package-lock.json) | Active |

---

## 3. Directory Structure

### Cây thư mục logic thực tế của `fe/`:

```
fe/
├── public/                     # Static assets (nếu có)
├── src/
│   ├── app/                    # Next.js App Router (Routing & Pages)
│   │   ├── (app)/              # Route Group (được bảo vệ bằng layout chung)
│   │   │   ├── layout.tsx      # Authenticated layout (Sidebar + TopBar + Main container)
│   │   │   ├── chatbot/page.tsx       # Màn hình AI Chatbot
│   │   │   ├── dashboard/page.tsx     # Màn hình Dashboard tổng quan
│   │   │   ├── goals/page.tsx         # Màn hình Mục tiêu học tập
│   │   │   ├── mental-health/page.tsx # Màn hình Sức khỏe tinh thần & Cảm xúc
│   │   │   ├── schedule/page.tsx      # Màn hình Lịch học & Nhiệm vụ
│   │   │   ├── scores/page.tsx        # Màn hình Quản lý Điểm số & GPA
│   │   │   └── settings/page.tsx      # Màn hình Cài đặt
│   │   ├── login/page.tsx      # Màn hình Đăng nhập
│   │   ├── register/page.tsx   # Màn hình Đăng ký
│   │   ├── globals.css         # Hệ thống CSS Design tokens & Glassmorphism styles
│   │   ├── layout.tsx          # Root Layout (bọc ThemeProvider & Mesh background)
│   │   └── page.tsx            # Root Landing / Redirect Controller (dẫn tới /dashboard hoặc /login)
│   ├── components/             # Reusable UI & Layout Components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     # Sidebar điều hướng chính (desktop & mobile drawer)
│   │   │   ├── TopBar.tsx      # TopBar hiển thị lời chào, Theme Toggle, Notification dropdown
│   │   │   ├── ThemeProvider.tsx # Wrapper next-themes
│   │   │   └── test.tsx        # Placeholder (0 bytes)
│   │   ├── common/
│   │   │   └── test.tsx        # Placeholder (0 bytes)
│   │   └── ui/
│   │       └── test.tsx        # Placeholder (0 bytes)
│   ├── features/               # Feature-based folder (Đang là placeholder)
│   │   ├── auth/test.tsx       # Placeholder (0 bytes)
│   │   ├── chatbot/test.tsx    # Placeholder (0 bytes)
│   │   ├── dashboard/test.tsx  # Placeholder (0 bytes)
│   │   ├── schedule/test.tsx   # Placeholder (0 bytes)
│   │   └── scores/test.tsx     # Placeholder (0 bytes)
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useAuth.ts          # Placeholder (0 bytes)
│   │   └── useScores.ts        # Placeholder (0 bytes)
│   ├── lib/                    # Core Utilities & API Client
│   │   ├── api.ts              # Cấu hình Axios Instance & Interceptors (tự inject x-user-id)
│   │   ├── services.ts         # Tập hợp toàn bộ Service Functions gọi Backend API
│   │   ├── constants.ts        # Placeholder (0 bytes)
│   │   ├── utils.ts            # Placeholder (0 bytes)
│   │   └── api/                # Subdirectory API (Placeholder)
│   │       ├── auth.ts         # (0 bytes)
│   │       ├── client.ts       # (0 bytes)
│   │       ├── schedule.ts     # (0 bytes)
│   │       └── scores.ts       # (0 bytes)
│   ├── stores/                 # State stores (Zustand placeholder)
│   │   └── auth-store.ts       # Placeholder (0 bytes)
│   └── types/                  # TypeScript Definitions
│       ├── index.ts            # Chứa toàn bộ Data Models & Response Schemas
│       ├── schedule.ts         # (0 bytes)
│       ├── score.ts            # (0 bytes)
│       └── user.ts             # (0 bytes)
├── Dockerfile                  # Container build config
├── next.config.js              # Cấu hình Next.js (output: 'standalone')
├── package.json                # Dependencies và NPM Scripts
├── tailwind.config.ts          # Cấu hình màu sắc, animation, Glassmorphism tokens
└── tsconfig.json               # Cấu hình TypeScript compiler
```

### Trách nhiệm các thư mục quan trọng:
- **`fe/src/app/(app)/`**: Nơi chứa giao diện và logic tương tác thực tế của từng trang ứng dụng. Mỗi trang tự quản lý vòng đời lấy dữ liệu từ Backend thông qua `services.ts`.
- **`fe/src/components/layout/`**: Cung cấp khung giao diện đồng nhất (`Sidebar`, `TopBar`, `ThemeProvider`), quản lý menu điều hướng, thông báo, và chuyển đổi Dark/Light mode.
- **`fe/src/lib/api.ts`**: Đóng vai trò làm cổng giao tiếp HTTP duy nhất (Axios instance), tự động đính kèm `x-user-id` lấy từ `localStorage` vào mọi request.
- **`fe/src/lib/services.ts`**: Đóng vai trò là API SDK tập trung của ứng dụng, ánh xạ các thao tác CRUD và AI endpoint.
- **`fe/src/types/index.ts`**: Trung tâm định nghĩa kiểu dữ liệu (Interfaces/Types) cho toàn bộ entities (User, Task, Session, Goal, Emotion, Assessment, Chat, Grade, Notification, Stats).

---

## 4. Documentation Review

Dưới đây là bảng đối chiếu giữa các tài liệu kiến trúc hiện có trong repository và mã nguồn thực tế:

| Tài liệu | Mục đích | Thông tin chính | Tính hợp lệ hiện tại | Xung đột với Code thực tế (Conflicts) |
|---|---|---|---|---|
| [API_FLOWS.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/API_FLOWS.md) | Mô tả kiến trúc mã nguồn FE và luồng đi của các API BE | Mô tả cấu trúc Feature-based (`features/`, `stores/`, `hooks/`) và danh sách 11 cụm API Backend. | **PARTIALLY IMPLEMENTED / OUTDATED** | - **Cấu trúc FE:** Docs nói code phân chia theo `features/`, `hooks/`, `stores/`, nhưng thực tế code tập trung trong `app/(app)/*` và các thư mục kia là file `test.tsx` (0 byte).<br>- **Chatbot API:** Docs ghi nhận POST message qua Axios thông thường nhưng Backend dùng SSE streaming.<br>- **Store:** Chưa dùng Zustand như tài liệu đề cập. |
| [docs/infrastructure/frontend.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/docs/infrastructure/frontend.md) | Tổng quan cấu hình Docker & Runtime cho Frontend | Chạy `npm run dev` trên cổng `3000`, API kết nối tới host `http://localhost:8000`. | **IMPLEMENTED** | Khớp 100% với `Dockerfile`, `docker-compose.yml` và `api.ts`. |
| [be/docs/api/frontend-integration.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/docs/api/frontend-integration.md) | Hướng dẫn kết nối FE với BE | Cơ chế xác thực qua Header `X-User-Id` (Development UUID), API Chatbot tại `/api/v1/chat/message`. | **PARTIALLY IMPLEMENTED** | - FE đang dùng `x-user-id` (khớp).<br>- FE đang gọi `/v1/chat/sessions/{id}/messages` thay vì endpoint đơn lẻ `/api/v1/chat/message`. |
| [docs/audit/API_CONNECTION_AUDIT.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/docs/audit/API_CONNECTION_AUDIT.md) | Báo cáo kiểm toán kết nối API ngày 21/08/2026 | Chỉ ra lỗi giao thức Chatbot (SSE vs Axios), tính năng OCR bảng điểm đang bị mock, thiếu giao diện AI Report/Recommendations. | **DOCUMENTED & ACCURATE** | Báo cáo hoàn toàn phản ánh chính xác tình trạng code hiện tại trong `scores/page.tsx` và `chatbot/page.tsx`. |
| [docs/architecture/chat_box_analysis.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/docs/architecture/chat_box_analysis.md) | Phân tích chi tiết tích hợp Chat Box SSE | Đề xuất giải pháp dùng Web Streams API (`fetch` + `ReadableStream`) thay Axios trong `chatbot/page.tsx`. | **DOCUMENTED BUT NOT IMPLEMENTED** | Giải pháp đã được viết rất chi tiết trong tài liệu nhưng mã nguồn `fe/src/app/(app)/chatbot/page.tsx` vẫn chưa được cập nhật (vẫn đang dùng Axios `api.post`). |

---

## 5. Routing Architecture

| Route | File Implementation | Mục đích | Component chính | API sử dụng | Auth Requirement | Trạng thái (Status) |
|---|---|---|---|---|---|---|
| `/` | [app/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/page.tsx) | Điều hướng trang chủ dựa theo session | Redirect Handler | Không | Không | **Complete** |
| `/login` | [app/login/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/login/page.tsx) | Đăng nhập tài khoản | `LoginPage`, Glass Card, ThemeToggle | `userService.getAll()` | Không | **Complete (Demo Auth)** |
| `/register` | [app/register/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/register/page.tsx) | Đăng ký tài khoản mới | `RegisterPage`, Register Form | `userService.create()` | Không | **Complete** |
| `/dashboard` | [app/(app)/dashboard/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/dashboard/page.tsx) | Tổng quan hoạt động học tập, thống kê giờ học, chuỗi streak, nhiệm vụ gần đây | Stat Cards, Recent Tasks, Quick Actions | `healthCheck`, `studyTaskService.getAll`, `learningGoalService.getAll`, `studySessionService.getAll`, `academicPerformanceService.getStatistics` | `x-user-id` | **Complete** |
| `/chatbot` | [app/(app)/chatbot/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/chatbot/page.tsx) | Trò chuyện cùng trợ lý học tập AI | Session Sidebar, Message List, Chat Bubble, Input | `chatService.getSessions`, `chatService.createSession`, `chatService.getMessages`, `chatService.sendMessage` | `x-user-id` | **Partial (Streaming Mismatch)** |
| `/schedule` | [app/(app)/schedule/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/schedule/page.tsx) | Quản lý nhiệm vụ học tập, to-do list theo trạng thái | Filter Tabs, Add Task Modal, Task List Items | `studyTaskService.getAll`, `studyTaskService.create` | `x-user-id` | **Complete** |
| `/scores` | [app/(app)/scores/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/scores/page.tsx) | Xem điểm số, tính GPA tích lũy, nhập điểm thủ công, upload bảng điểm | GPA Summary Cards, Semester Collapsible, Manual Input Modal | `gradeService.getAll`, `courseService.getAll`, `academicTermService.getAll`, `academicPerformanceService.getStatistics`, `courseService.create`, `gradeService.create` | `x-user-id` | **Partial (Upload OCR is Mocked)** |
| `/goals` | [app/(app)/goals/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/goals/page.tsx) | Đặt và theo dõi mục tiêu học tập | Stat Cards, Add Goal Modal, Goal Grid | `learningGoalService.getAll`, `learningGoalService.create` | `x-user-id` | **Complete** |
| `/mental-health` | [app/(app)/mental-health/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/mental-health/page.tsx) | Ghi nhận cảm xúc hàng ngày & xem kết quả đánh giá tâm lý | Emotion Picker, Level Sliders, History List, Assessment Cards | `emotionLogService.getAll`, `emotionLogService.create`, `mentalAssessmentService.getAll` | `x-user-id` | **Complete (Read-only Assessment)** |
| `/settings` | [app/(app)/settings/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/settings/page.tsx) | Cài đặt tài khoản & giao diện | Profile Form, Notification Toggles, Theme Selector | `localStorage` only (No API call) | `x-user-id` | **Partial / Placeholder UI** |

---

## 6. Component Architecture

### Hierarchy tổng thể:
```
RootLayout (app/layout.tsx)
  ├── ThemeProvider (components/layout/ThemeProvider.tsx)
  │     ├── Mesh Background (.mesh-gradient)
  │     └── [Route Children]
  │           ├── Landing / Public Pages: (app/page.tsx, app/login/page.tsx, app/register/page.tsx)
  │           └── Authenticated Pages: (app/(app)/layout.tsx)
  │                 ├── Sidebar (components/layout/Sidebar.tsx)
  │                 │     ├── Logo & Brand
  │                 │     ├── Navigation Links (Dashboard, Chatbot, Schedule, Scores, Goals, Mental Health)
  │                 │     └── Settings / Logout Button
  │                 └── Main Wrapper
  │                       ├── TopBar (components/layout/TopBar.tsx)
  │                       │     ├── Greeting & User Name
  │                       │     ├── Global Search Input (UI)
  │                       │     ├── Theme Toggle Button
  │                       │     ├── Notification Dropdown & Badges
  │                       │     └── User Profile Avatar
  │                       └── [Page Component] (e.g. DashboardPage, ScoresPage, ...)
```

### Đánh giá kiến trúc Component:
1. **Layout Components (`Sidebar`, `TopBar`, `ThemeProvider`)**: Được thiết kế đồng bộ, hỗ trợ responsive (mobile menu drawer với overlay), theme switching mượt mà, và notification dropdown có logic đánh dấu đã đọc (`markRead`, `markAllRead`).
2. **Page Components**: Có mức độ coupling cao (**High Coupling**). Các màn hình như `ScoresPage` (~820 dòng) và `DashboardPage` (~360 dòng) trực tiếp quản lý form states, modal open/close, table calculations, và API fetch requests mà không tách ra các feature/sub-components nhỏ hơn.
3. **Shared UI / Primitives**: Chưa có các reusable UI primitives dạng Atomic Design (`Button`, `Card`, `Modal`, `Badge`, `Input`) dưới dạng component độc lập trong `src/components/ui/`; thay vào đó, ứng dụng sử dụng các CSS utility classes viết sẵn trong `globals.css` (ví dụ: `.glass`, `.glass-strong`, `.glass-btn`, `.glass-btn-primary`, `.glass-input`, `.stat-card`, `.chat-bubble-user`, `.chat-bubble-ai`).

---

## 7. API Architecture

### Luồng gọi API:
```
UI Component (page.tsx)
     ↓ (gọi trực tiếp)
Service Layer (fe/src/lib/services.ts)
     ↓ (sử dụng instance api)
Axios Client Instance (fe/src/lib/api.ts)
     ↓ (Interceptor: gắn header `x-user-id` từ localStorage)
Backend API (FastAPI @ http://localhost:8000/api)
```

### Cấu hình Client (`fe/src/lib/api.ts`):
- **Base URL:** `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'`
- **Timeout:** `15000ms`
- **Request Interceptor:** Tự động kiểm tra `localStorage.getItem('focusbuddy_user_id')`, nếu có thì inject header `x-user-id`.
- **Response Interceptor:** Log lỗi API ra console và `Promise.reject(error)`.

### Mapping chi tiết các Endpoint đang được sử dụng:

| Module | Service Function | HTTP Method & Endpoint | Payload / Params | Component sử dụng |
|---|---|---|---|---|
| **Health** | `healthCheck()` | `GET /v1/ping` | None | `DashboardPage` |
| **User** | `userService.create()` | `POST /v1/users` | `UserCreate` (email, full_name, password, phone) | `RegisterPage` |
| | `userService.getAll()` | `GET /v1/users` | `params: { skip, limit }` | `LoginPage` (để match email) |
| | `userService.getById()` | `GET /v1/users/{id}` | Path param `id` | Sẵn sàng trong `services.ts` |
| | `userService.update()` | `PUT /v1/users/{id}` | `Partial<User>` | Sẵn sàng trong `services.ts` |
| **Tasks** | `studyTaskService.getAll()` | `GET /v1/study-tasks` | `params: { skip, limit }` | `DashboardPage`, `SchedulePage` |
| | `studyTaskService.create()` | `POST /v1/study-tasks` | `StudyTaskCreate` (title, deadline, priority, ...) | `SchedulePage` |
| | `studyTaskService.update()` | `PUT /v1/study-tasks/{id}` | `Partial<StudyTask>` | Sẵn sàng trong `services.ts` |
| | `studyTaskService.delete()` | `DELETE /v1/study-tasks/{id}`| Path param `id` | Sẵn sàng trong `services.ts` |
| **Sessions**| `studySessionService.getAll()` | `GET /v1/study-sessions` | `params: { skip, limit }` | `DashboardPage` (tính giờ học & streak) |
| | `studySessionService.create()` | `POST /v1/study-sessions` | `Partial<StudySession>` | Sẵn sàng trong `services.ts` |
| **Goals** | `learningGoalService.getAll()` | `GET /v1/learning-goals` | `params: { skip, limit }` | `DashboardPage`, `GoalsPage` |
| | `learningGoalService.create()` | `POST /v1/learning-goals` | `Partial<LearningGoal>` | `GoalsPage` |
| **Emotions**| `emotionLogService.getAll()` | `GET /v1/emotions` | `params: { skip, limit }` | `MentalHealthPage` |
| | `emotionLogService.create()` | `POST /v1/emotions` | `Partial<EmotionLog>` | `MentalHealthPage` |
| **Assessments**| `mentalAssessmentService.getAll()` | `GET /v1/assessments` | `params: { skip, limit }` | `MentalHealthPage` |
| **Grades** | `gradeService.getAll()` | `GET /v1/grades` | `params: { skip, limit }` | `ScoresPage` |
| | `gradeService.create()` | `POST /v1/grades` | Grade payload (score, weights, term, course) | `ScoresPage` (Lưu bảng điểm) |
| **Academic Meta** | `courseService.getAll()` | `GET /v1/courses` | `params: { skip, limit }` | `ScoresPage` |
| | `courseService.create()` | `POST /v1/courses` | `{ course_code, course_name, credits }` | `ScoresPage` |
| | `academicTermService.getAll()`| `GET /v1/academic-terms` | `params: { skip, limit }` | `ScoresPage` |
| | `academicTermService.create()`| `POST /v1/academic-terms` | `{ display_name, academic_year, semester_type }` | `ScoresPage` |
| **Performance** | `academicPerformanceService.getStatistics()` | `GET /v1/academic-performance` | `params: { skip, limit }` | `DashboardPage`, `ScoresPage` |
| | `academicPerformanceService.getBasicStatistics()` | `GET /v1/academic-performance/basic-statistics` | None | Sẵn sàng trong `services.ts` |
| **Chatbot**| `chatService.getSessions()` | `GET /v1/chat/sessions` | `params: { skip, limit }` | `ChatbotPage` |
| | `chatService.createSession()` | `POST /v1/chat/sessions` | `{ title }` | `ChatbotPage` |
| | `chatService.getMessages()` | `GET /v1/chat/sessions/{id}/messages` | Path param `id` | `ChatbotPage` |
| | `chatService.sendMessage()` | `POST /v1/chat/sessions/{id}/messages` | `ChatMessageCreate` | `ChatbotPage` *(Cần refactor sang fetch/SSE)* |
| **Notifications** | `notificationService.getAll()` | `GET /v1/notifications` | `params: { skip, limit }` | `TopBar` |
| | `notificationService.markRead()`| `PUT /v1/notifications/{id}/read` | Path param `id` | `TopBar` |
| | `notificationService.markAllRead()`| `POST /v1/notifications/read-all` | None | `TopBar` |

---

## 8. State Management

### Phân tích hiện trạng các tầng State:
1. **Local UI State:** Chiếm 95% state toàn ứng dụng. Mỗi page tự khai báo `useState` cho modal visibility, form inputs, loading status, tabs, filter criteria.
2. **Global State:** Chưa có Global State store (chưa dùng Zustand/Redux). Dữ liệu chung (tên user, user ID) được lưu trữ tại `localStorage` và đọc trực tiếp trong `useEffect`. Trạng thái Dark/Light mode được quản lý qua `next-themes` (`useTheme`).
3. **Server State / Cache:** Chưa dùng thư viện quản lý Server State (như React Query / SWR / RTK Query). Dữ liệu sau khi mutate (thêm task, thêm goal, thêm grade) được refetch thủ công bằng cách gọi lại hàm `load...Data()`.
4. **Authentication State:** Nằm phân tán giữa `localStorage` ('focusbuddy_user_id', 'focusbuddy_user_name') và state cục bộ của `TopBar` / `LoginPage`.
5. **Form State:** Viết bằng React controlled components (`useState`).

### Các Anti-patterns & Rủi ro phát hiện:
- **Client-Side Heavy Calculations:** Tại `DashboardPage` ([dashboard/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/dashboard/page.tsx#L98-L142)), chuỗi ngày học liên tục (**Streak**) và tổng số giờ học hôm nay được tính toán bằng vòng lặp Javascript duyệt qua danh sách tất cả `study-sessions` ở client, thay vì lấy từ aggregated endpoint của Backend.
- **Client-Side Grade Computation:** Tại `ScoresPage` ([scores/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/scores/page.tsx#L192-L207)), hàm `computeGradeDetails` tự tính tổng kết điểm và quy đổi thang chữ/điểm hệ 4 ở client.
- **Duplicate Metadata Fetching:** `ScoresPage` và `DashboardPage` gọi độc lập các API metadata mà không có cơ chế caching giữa các lần chuyển trang.

---

## 9. Authentication Flow

### Quy trình xác thực thực tế:

```
[1. User nhập Email / Password]
              ↓
[2. LoginPage: userService.getAll(0, 100)]
              ↓
[3. Client-side tìm user có email trùng khớp]
              ↓
[4. Lưu vào localStorage: 'focusbuddy_user_id' & 'focusbuddy_user_name']
              ↓
[5. window.location.href = '/dashboard']
              ↓
[6. Axios Request Interceptor đọc 'focusbuddy_user_id' -> Gán Header 'x-user-id']
              ↓
[7. Backend nhận 'x-user-id' để lọc dữ liệu của User]
```

### Đánh giá cơ chế Auth:
- **Lưu trữ:** `localStorage` (`focusbuddy_user_id`, `focusbuddy_user_name`).
- **Middleware / Guard:** Chưa có Next.js Route Middleware (`middleware.ts`). Việc bảo vệ route dựa trên logic redirect ở [page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/page.tsx). Nếu người dùng gõ trực tiếp URL `/dashboard`, trang vẫn tải mà không bị redirect nếu thiếu token (chỉ bị lỗi gọi API nếu thiếu `x-user-id`).
- **Logout:** Nút "Đăng xuất" tại `Sidebar` xóa `focusbuddy_user_id` khỏi `localStorage` và chuyển hướng về `/login`.
- **JWT / Refresh Token:** Chưa được triển khai ở Frontend (khớp với hướng dẫn phát triển trong `be/docs/api/frontend-integration.md`).

---

## 10. Data Flow

```
+-------------------------------------------------------------------------+
|                              USER ACTION                                |
|             (Ví dụ: Bấm "Lưu điểm", "Gửi tin nhắn", "Thêm task")        |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                          REACT COMPONENT UI                             |
|          - Cập nhật Local State (`setLoading(true)`, `setForm`)         |
|          - Validate input hợp lệ ở Client                               |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                       SERVICE LAYER (services.ts)                       |
|          - Định dạng payload thành Type an toàn                         |
|          - Gọi Axios Instance `api.post(...)`                           |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                      AXIOS INTERCEPTOR (api.ts)                         |
|          - Trích xuất `focusbuddy_user_id` từ `localStorage`            |
|          - Chèn Header `x-user-id: <UUID>`                              |
+-------------------------------------------------------------------------+
                                     │
                                     ▼ (HTTP Request)
+-------------------------------------------------------------------------+
|                             FASTAPI BACKEND                             |
|          - Router trích xuất `X-User-Id`                                |
|          - Service & Repository xử lý DB / LLM                          |
|          - Trả về JSON Response (hoặc SSE Stream với Chat)              |
+-------------------------------------------------------------------------+
                                     │
                                     ▼ (HTTP Response)
+-------------------------------------------------------------------------+
|                          REACT COMPONENT STATE                          |
|          - Nhận dữ liệu `res.data`                                      |
|          - Cập nhật State danh sách (`setTasks`, `setStats`, ...)       |
|          - Tắt Loading State (`setLoading(false)`)                      |
|          - Hiển thị Toast thông báo / Trigger re-render UI              |
+-------------------------------------------------------------------------+
```

---

## 11. Current Dashboard & Analytics Capability

| Hạng mục dữ liệu / Component | Trạng thái | Chi tiết hiện trạng | Vị trí trong Code |
|---|---|---|---|
| **Giờ học hôm nay (Study time)** | **ĐÃ CÓ** | Tính tổng `duration_minutes` của các session trong ngày từ `studySessionService.getAll()`. | [dashboard/page.tsx:L104](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/dashboard/page.tsx#L104) |
| **Chuỗi học tập (Study streak)** | **ĐÃ CÓ** | Tính số ngày học liên tiếp từ danh sách `start_time` các session. | [dashboard/page.tsx:L109](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/dashboard/page.tsx#L109) |
| **Tiến độ mục tiêu (Goal completion)** | **ĐÃ CÓ** | Đếm tỷ lệ mục tiêu `COMPLETED` / `ACHIEVED` trên tổng số mục tiêu. | [dashboard/page.tsx:L95](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/dashboard/page.tsx#L95) |
| **GPA & Kết quả học tập** | **ĐÃ CÓ** | Hiển thị GPA tích lũy, tổng tín chỉ, xếp loại học lực; phân nhóm theo học kỳ. | [scores/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/scores/page.tsx), [dashboard/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/dashboard/page.tsx#L143) |
| **Nhiệm vụ học tập (Study tasks)** | **ĐÃ CÓ** | Hiển thị danh sách task gần đây, deadline, độ ưu tiên, trạng thái hoàn thành. | [dashboard/page.tsx:L79](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/dashboard/page.tsx#L79), [schedule/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/schedule/page.tsx) |
| **Cảm xúc & Sức khỏe tinh thần** | **ĐÃ CÓ** | Ghi nhận stress, năng lượng, động lực; xem đánh giá rủi ro tâm lý. | [mental-health/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/mental-health/page.tsx) |
| **Biểu đồ trực quan (Charts/Graphs)** | **CHƯA CÓ** | Chưa cài đặt thư viện biểu đồ. Các chỉ số hiện hiển thị dưới dạng Card số liệu và Progress bar HTML/CSS đơn giản. | Chưa có trong `package.json` |
| **Báo cáo AI & Khuyến nghị học tập** | **CHƯA CÓ** | Backend có cụm API `/v1/ai/analyze`, `/v1/ai/reports`, `/v1/ai/recommendations` nhưng Frontend chưa có màn hình hoặc widget để gọi và hiển thị. | Thiếu giao diện kết nối |
| **Đồng hồ Pomodoro / Study Timer** | **CHƯA CÓ (Mock UI)** | Nút "Bắt đầu phiên học" trên Dashboard ghi chú "Đang cập nhật", chưa có bộ đếm giờ Pomodoro tương tác trực tiếp. | [dashboard/page.tsx:L317](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/dashboard/page.tsx#L317) |
| **Trích xuất bảng điểm tự động (OCR)**| **MOCK (Chưa kết nối)** | Nút upload chỉ dùng `setTimeout` 1.5s tạo hiệu ứng giả lập, chưa gửi file lên `/v1/files/upload`. | [scores/page.tsx:L210](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/scores/page.tsx#L210) |

---

## 12. Reusable Assets for Future Dashboard

Những tài nguyên và thành phần có sẵn chất lượng cao, có thể tái sử dụng 100% khi phát triển phân hệ **Dashboard / Study Status / Analytics**:

1. **Design System & CSS Styling Tokens:**
   - Các class Glassmorphism hoàn chỉnh: `.glass`, `.glass-strong`, `.glass-subtle`, `.stat-card`, `.glass-btn`, `.glass-btn-primary`, `.glass-btn-accent`, `.glass-input`.
   - Màu sắcTailwind được tuỳ chỉnh tỉ mỉ: `primary` (Indigo), `accent` (Teal), `surface-dark`, `surface-card`, `glass-border`, và các keyframe animations (`float`, `pulse-slow`, `gradient`, `slide-up`).
   - Dark/Light Theme Provider đã kích hoạt mượt mà trên toàn bộ giao diện.

2. **Khung Layout & Điều hướng (`components/layout/`):**
   - `Sidebar`: Đã có sẵn icon, router highlight cho `/dashboard` và các trang liên quan, hỗ trợ Mobile Drawer toggle.
   - `TopBar`: Đã có sẵn bộ đếm thông báo Realtime (`unreadCount`), chức năng Đọc tất cả thông báo, Avatar, Lời chào theo thời gian trong ngày (`greeting`).

3. **API Service SDK (`fe/src/lib/services.ts`):**
   - `academicPerformanceService.getBasicStatistics()` & `getStatistics()`: Sẵn sàng cung cấp số liệu tổng quan (tổng môn, môn hoàn thành, điểm TB, cao nhất/thấp nhất, GPA tích lũy).
   - `studySessionService.getAll()` & `create()`: Sẵn sàng dùng để hiển thị và ghi nhận các phiên học tập.
   - `studyTaskService.getAll()`: Sẵn sàng lấy danh sách nhiệm vụ theo trạng thái/hạn chót.
   - `learningGoalService.getAll()`: Sẵn sàng lấy tiến độ mục tiêu.
   - `emotionLogService.getAll()` & `mentalAssessmentService.getAll()`: Sẵn sàng lấy dữ liệu cảm xúc để xây dựng biểu đồ tương quan "Tâm lý vs Hiệu suất học tập".

4. **TypeScript Interfaces chuẩn (`fe/src/types/index.ts`):**
   - Đầy đủ types: `User`, `AcademicStatistic`, `Course`, `AcademicTerm`, `Grade`, `StudyTask`, `StudySession`, `LearningGoal`, `EmotionLog`, `MentalAssessment`, `Notification`.

---

## 13. Technical Issues / Risks

| Mức độ (Severity) | Vấn đề kỹ thuật (Issue) | Chi tiết & Tác động | File liên quan |
|---|---|---|---|
| **Critical** | **Chatbot Streaming Protocol Mismatch** | Backend trả về `StreamingResponse` (`text/event-stream`), nhưng Frontend dùng Axios `api.post` dẫn đến không hiển thị chữ dạng gõ thời gian thực và có nguy cơ lỗi parse JSON. | [chatbot/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/chatbot/page.tsx), [services.ts](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/lib/services.ts#L126) |
| **High** | **Xác thực Đăng nhập lỏng lẻo (Client-side user matching)** | `LoginPage` tải toàn bộ 100 users từ Backend về qua `userService.getAll()` rồi tìm user có email trùng khớp ở trình duyệt, không xác thực mật khẩu qua API Login chuyên dụng. Không có route middleware bảo vệ URL. | [login/page.tsx:L30](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/login/page.tsx#L30) |
| **High** | **OCR Bảng điểm đang bị Mock hoàn toàn** | Nút upload bảng điểm dùng `setTimeout` 1.5s giả lập, chưa gọi API `/v1/files/upload` và `/v1/files/{id}/extract`. | [scores/page.tsx:L210](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/scores/page.tsx#L210) |
| **Medium** | **Thiếu thư viện Data Visualization** | Dự án chưa cài đặt bất kỳ thư viện Chart nào (như `recharts` hay `chart.js`), hạn chế khả năng hiển thị biểu đồ xu hướng GPA, phân bổ thời gian học và diễn biến cảm xúc. | [package.json](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/package.json) |
| **Medium** | **Thư mục Feature/Hook/Store bị bỏ trống (Dead Structure)** | Toàn bộ các thư mục `fe/src/features/*`, `fe/src/hooks/*`, `fe/src/stores/*`, `fe/src/components/ui/*` chứa các file `test.tsx` (0 byte). Gây hiểu lầm về mặt kiến trúc. | Toàn bộ các folder con trong `src/` |
| **Low** | **Thiếu kết nối API cho trang Settings** | Trang `/settings` hiện chỉ đọc dữ liệu từ `localStorage`, chưa kết nối API cập nhật thông tin cá nhân (`userService.update`) hay lưu cài đặt người dùng lên cơ sở dữ liệu. | [settings/page.tsx](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/app/%28app%29/settings/page.tsx) |

---

## 14. Recommended Next Step

Dựa trên nguyên tắc **REUSE EXISTING → EXTEND → REFACTOR ONLY IF NECESSARY**, lộ trình triển khai tối ưu cho phân hệ **Dashboard & Study Status** giai đoạn tới như sau:

1. **Bước 1: Tích hợp thư viện biểu đồ trực quan nhẹ (Data Visualization)**
   - Đề xuất cài đặt thư viện nhẹ và tương thích cao với React 18/Next.js App Router (như `recharts` hoặc `chart.js` / `react-chartjs-2`).
   
2. **Bước 2: Mở rộng `fe/src/lib/services.ts` cho AI Analytics & Study Status**
   - Bổ sung các hàm gọi API AI Reports & Recommendations (`/v1/ai/reports`, `/v1/ai/recommendations`, `/v1/ai/analyze`).
   - Tận dụng `academicPerformanceService.getBasicStatistics()` và các endpoint thống kê sẵn có từ Backend.

3. **Bước 3: Nâng cấp Dashboard Hiện Tại (`fe/src/app/(app)/dashboard/page.tsx`)**
   - **Tái sử dụng:** Giữ nguyên cấu trúc Glassmorphism, Stat cards, Layout Sidebar/TopBar hiện tại.
   - **Mở rộng (Study Status & Analytics):**
     - Thêm biểu đồ **Xu hướng học tập theo tuần** (Weekly Study Time Chart) dựa trên dữ liệu `StudySession`.
     - Thêm biểu đồ **Phân bổ tiến độ môn học** (Course Progress / Tasks Breakdown).
     - Thêm widget **AI Study Insights & Khuyến nghị** (kết nối trực tiếp với cụm API `/v1/ai`).
     - Tích hợp **Pomodoro Timer Widget** tương tác thật (bắt đầu/kết thúc phiên học và gọi `studySessionService.create`).

4. **Bước 4: Chuẩn hóa dần các component dùng chung (Refactor nhẹ khi cần)**
   - Tách các Widget của Dashboard thành các component độc lập (ví dụ: `StudyStatusCard.tsx`, `StudyTrendChart.tsx`, `AIInsightWidget.tsx`) để dễ bảo trì mà không làm xáo trộn cấu trúc tổng thể.

---

## 15. Frontend Readiness Assessment

### Đánh giá mức độ sẵn sàng:
⭐⭐⭐⭐☆ **MOSTLY READY (Phần lớn đã sẵn sàng)**

### Lý do chi tiết:
1. **Điểm mạnh:**
   - Bộ khung ứng dụng (Next.js 14 App Router, TypeScript, TailwindCSS Glassmorphism, Responsive Layout) hoạt động rất ổn định và có tính thẩm mỹ cao.
   - Hệ thống định nghĩa kiểu dữ liệu (`types/index.ts`) và API Service (`services.ts`) đã bao phủ gần như toàn bộ các thực thể cần thiết cho một Dashboard học tập thông minh (Điểm số, Giờ học, Phiên học, Nhiệm vụ, Mục tiêu, Tâm lý, Thông báo).
   - Trang `/dashboard` hiện tại đã có sẵn logic cơ bản để tính toán Giờ học hôm nay, Chuỗi học tập (Streak), và Danh sách nhiệm vụ.

2. **Khoảng trống cần bổ sung trước khi hoàn thiện Dashboard chuyên sâu:**
   - Cần cài đặt thêm 1 thư viện biểu đồ (`recharts`) để vẽ các đồ thị trực quan cho Study Status.
   - Cần bổ sung UI kết nối với cụm API Báo cáo & Khuyến nghị AI (`/v1/ai`).
   - Không cần phải đập đi xây lại kiến trúc; hoàn toàn có thể xây dựng trực tiếp trên nền tảng Frontend hiện có.

---
*Báo cáo được khởi tạo tự động bởi Antigravity AI Assistant — 2026.*
