# Frontend - Backend API Contract Audit Matrix

> **Project:** FocusBuddy (AI Study Companion & Academic Assistant)  
> **Scope:** Full System Audit (`fe/` & `be/`)  
> **Audit Date:** 23/08/2026  
> **Role:** Senior Frontend Architect + API Integration Engineer  
> **Status:** AUDIT COMPLETE — CONTRACT BASELINE ESTABLISHED  

---

## 1. Overview & Source of Truth Hierarchy

Theo nguyên tắc kiểm định:
$$\text{Backend Implementation} > \text{Frontend Implementation} > \text{Legacy Documentation}$$

* **Backend Base URL:** `http://localhost:8000/api` (Root FastAPI mounts `api_router` tại prefix `/api`).
* **Frontend Base URL:** `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'` (Cấu hình tại [fe/src/lib/api.ts](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/lib/api.ts)).
* **Auth Protocol Hiện tại:** Cả 2 phía đang định danh người dùng qua Header `x-user-id` (hoặc `X-User-Id`) dạng UUID được lưu trữ trong `localStorage`. Hệ thống **chưa có JWT/Session Authentication**.

---

## 2. API Contract Matrix

| Domain | FE Usage / Service | BE Endpoint | Method | Request Body / Params | Response Schema | Auth / Header | Protocol | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System** | `healthCheck()` | `/api/v1/ping` | `GET` | *None* | `{"ping": "pong!"}` | None | HTTP REST | `MATCHED` |
| **System** | *None* | `/health` | `GET` | *None* | `{"status": "ok", "message": "..."}` | None | HTTP REST | `FE_MISSING` |
| **Auth / User** | `userService.create` | `/api/v1/users` | `POST` | `UserCreate` (email, full_name, password, avatar_url?, phone_number?) | `UserResponse` | None | HTTP REST | `MATCHED` |
| **Auth / User** | `userService.getAll` | `/api/v1/users` | `GET` | `skip: int = 0, limit: int = 100` | `UserListResponse` (`users: User[], total: int`) | None | HTTP REST | `MATCHED` |
| **Auth / User** | `userService.getById` | `/api/v1/users/{user_id}` | `GET` | `user_id: UUID` (path) | `UserResponse` | None | HTTP REST | `MATCHED` |
| **Auth / User** | `userService.update` | `/api/v1/users/{user_id}` | `PUT` | `UserUpdate` | `UserResponse` | None | HTTP REST | `MATCHED` |
| **Auth / User** | `userService.delete` | `/api/v1/users/{user_id}` | `DELETE` | `user_id: UUID` (path) | *204 No Content* | None | HTTP REST | `MATCHED` |
| **Auth / User** | `LoginPage` (scan email) | *None* | `POST` | `/api/v1/auth/login` | JWT Token / Session | None | HTTP REST | `BE_MISSING` |
| **Academic Terms** | `academicTermService.getAll` | `/api/v1/academic-terms` | `GET` | `skip: int, limit: int` | `AcademicTermListResponse` (`items, total`) | None | HTTP REST | `MATCHED` |
| **Academic Terms** | `academicTermService.create` | `/api/v1/academic-terms` | `POST` | `AcademicTermCreate` | `AcademicTermResponse` | None | HTTP REST | `MATCHED` |
| **Academic Terms** | *None* | `/api/v1/academic-terms/{id}` | `GET` | `item_id: UUID` | `AcademicTermResponse` | None | HTTP REST | `FE_MISSING` |
| **Academic Terms** | *None* | `/api/v1/academic-terms/{id}` | `PUT` | `item_id: UUID`, `AcademicTermUpdate` | `AcademicTermResponse` | None | HTTP REST | `FE_MISSING` |
| **Academic Terms** | *None* | `/api/v1/academic-terms/{id}` | `DELETE` | `item_id: UUID` | *204 No Content* | None | HTTP REST | `FE_MISSING` |
| **Courses** | `courseService.getAll` | `/api/v1/courses` | `GET` | `major_id?: UUID, skip: int, limit: int` | `CourseListResponse` (`items, total`) | None | HTTP REST | `MATCHED` |
| **Courses** | `courseService.create` | `/api/v1/courses` | `POST` | `CourseCreate` | `CourseResponse` | None | HTTP REST | `MATCHED` |
| **Courses** | *None* | `/api/v1/courses/{id}` | `GET` | `item_id: UUID` | `CourseResponse` | None | HTTP REST | `FE_MISSING` |
| **Courses** | *None* | `/api/v1/courses/{id}` | `PUT` | `item_id: UUID`, `CourseUpdate` | `CourseResponse` | None | HTTP REST | `FE_MISSING` |
| **Courses** | *None* | `/api/v1/courses/{id}` | `DELETE` | `item_id: UUID` | *204 No Content* | None | HTTP REST | `FE_MISSING` |
| **Universities** | *None* | `/api/v1/universities` | `GET` | `skip: int, limit: int` | `UniversityListResponse` | None | HTTP REST | `FE_MISSING` |
| **Universities** | *None* | `/api/v1/universities` | `POST` | `UniversityCreate` | `UniversityResponse` | None | HTTP REST | `FE_MISSING` |
| **Majors** | *None* | `/api/v1/majors` | `GET` | `university_id?: UUID, skip: int, limit: int` | `MajorListResponse` | None | HTTP REST | `FE_MISSING` |
| **Majors** | *None* | `/api/v1/majors` | `POST` | `MajorCreate` | `MajorResponse` | None | HTTP REST | `FE_MISSING` |
| **Curriculums** | *None* | `/api/v1/curriculums` | `GET` | `major_id?: UUID, skip: int, limit: int` | `CurriculumListResponse` | None | HTTP REST | `FE_MISSING` |
| **Curriculums** | *None* | `/api/v1/curriculums` | `POST` | `CurriculumCreate` | `CurriculumResponse` | None | HTTP REST | `FE_MISSING` |
| **Grades** | `gradeService.getAll` | `/api/v1/grades` | `GET` | `course_id?: UUID, term_id?: UUID, skip, limit` | `List[StudentCourseResponse]` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Grades** | `gradeService.create` | `/api/v1/grades` | `POST` | `StudentCourseCreate` | `StudentCourseResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Grades** | `gradeService.update` | `/api/v1/grades/{id}` | `PUT` | `id: UUID`, `StudentCourseUpdate` | `StudentCourseResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Grades** | `gradeService.delete` | `/api/v1/grades/{id}` | `DELETE` | `id: UUID` | *204 No Content* | `X-User-Id` | HTTP REST | `MATCHED` |
| **Grades** | *None* | `/api/v1/grades/import` | `POST` | `GradeImportRequest` | `GradeImportResponse` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Performance** | `academicPerformanceService.getStatistics` | `/api/v1/academic-performance` | `GET` | `skip: int, limit: int` | `List[AcademicStatisticResponse]` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Performance** | `academicPerformanceService.getBasicStatistics` | `/api/v1/academic-performance/basic-statistics` | `GET` | *None* | `{total_courses, completed_courses, failed_courses, average_score, highest_score, lowest_score}` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Performance** | *None* | `/api/v1/academic-performance/by-term/{term_id}` | `GET` | `term_id: UUID` | `AcademicStatisticResponse` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Study Tasks** | `studyTaskService.getAll` | `/api/v1/study-tasks` | `GET` | `course_id?: UUID, skip, limit` | `StudyTaskListResponse` (`items, total`) | `X-User-Id` | HTTP REST | `MATCHED` |
| **Study Tasks** | `studyTaskService.create` | `/api/v1/study-tasks` | `POST` | `StudyTaskCreate` | `StudyTaskResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Study Tasks** | `studyTaskService.update` | `/api/v1/study-tasks/{id}` | `PUT` | `id: UUID`, `StudyTaskUpdate` | `StudyTaskResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Study Tasks** | `studyTaskService.delete` | `/api/v1/study-tasks/{id}` | `DELETE` | `id: UUID` | *204 No Content* | `X-User-Id` | HTTP REST | `MATCHED` |
| **Study Sessions** | `studySessionService.getAll` | `/api/v1/study-sessions` | `GET` | `skip, limit` | `StudySessionListResponse` (`items, total`) | `X-User-Id` | HTTP REST | `MATCHED` |
| **Study Sessions** | `studySessionService.create` | `/api/v1/study-sessions` | `POST` | `StudySessionCreate` | `StudySessionResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Study Sessions** | *None* | `/api/v1/study-sessions/{id}` | `PUT` | `id: UUID`, `StudySessionUpdate` | `StudySessionResponse` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Study Sessions** | *None* | `/api/v1/study-sessions/{id}` | `DELETE` | `id: UUID` | *204 No Content* | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Goals** | `learningGoalService.getAll` | `/api/v1/learning-goals` | `GET` | `skip, limit` | `LearningGoalListResponse` (`items, total`) | `X-User-Id` | HTTP REST | `MATCHED` |
| **Goals** | `learningGoalService.create` | `/api/v1/learning-goals` | `POST` | `LearningGoalCreate` | `LearningGoalResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Goals** | `learningGoalService.update` | `/api/v1/learning-goals/{id}` | `PUT` | `id: UUID`, `LearningGoalUpdate` | `LearningGoalResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Goals** | *None* | `/api/v1/learning-goals/{id}` | `DELETE` | `id: UUID` | *204 No Content* | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Emotions** | `emotionLogService.getAll` | `/api/v1/emotions` | `GET` | `skip, limit` | `{"items": EmotionLogResponse[], "total": int}` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Emotions** | `emotionLogService.create` | `/api/v1/emotions` | `POST` | `EmotionLogCreate` | `EmotionLogResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Emotions** | *None* | `/api/v1/emotions/{id}` | `DELETE` | `id: UUID` | *204 No Content* | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Assessments** | `mentalAssessmentService.getAll` | `/api/v1/assessments` | `GET` | `skip, limit` | `{"items": MentalAssessmentResponse[], "total": int}` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Assessments** | *None* | `/api/v1/assessments` | `POST` | `MentalAssessmentCreate` | `MentalAssessmentResponse` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Files** | *None (Mocked in Scores)* | `/api/v1/files/upload` | `POST` | `multipart/form-data` (`file`) | `UploadedFileResponse` | `X-User-Id` | HTTP Form | `FE_MISSING` |
| **Files** | *None* | `/api/v1/files/{id}/extract` | `POST` | `id: UUID` | `UploadedFileResponse` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Files** | *None* | `/api/v1/files` | `GET` | `skip, limit` | `{"items": UploadedFileResponse[], "total": int}` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Files** | *None* | `/api/v1/files/{id}` | `GET` | `id: UUID` | `UploadedFileResponse` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Files** | *None* | `/api/v1/files/{id}/extraction` | `GET` | `id: UUID` | `FileExtractionResponse` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Files** | *None* | `/api/v1/files/{id}` | `DELETE` | `id: UUID` | *204 No Content* | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **AI Analysis** | *None* | `/api/v1/ai/analyze` | `POST` | `AIAnalysisRequest` | `{"message": str, "report_id": UUID}` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **AI Analysis** | *None* | `/api/v1/ai/reports` | `GET` | `skip, limit` | `List[AIAnalysisResponse]` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **AI Analysis** | *None* | `/api/v1/ai/recommendations` | `GET` | `skip, limit` | `List[RecommendationResponse]` | `X-User-Id` | HTTP REST | `FE_MISSING` |
| **Chat** | `chatService.getSessions` | `/api/v1/chat/sessions` | `GET` | `skip, limit` | `List[ChatSessionResponse]` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Chat** | `chatService.createSession` | `/api/v1/chat/sessions` | `POST` | `ChatSessionCreate` (`title?: str`) | `ChatSessionResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Chat** | `chatService.getMessages` | `/api/v1/chat/sessions/{session_id}/messages` | `GET` | `session_id: UUID, skip, limit` | `List[ChatMessageResponse]` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Chat** | `chatService.sendMessage` | `/api/v1/chat/sessions/{session_id}/messages` | `POST` | `ChatMessageCreate` (`content, message_type`) | **`StreamingResponse` (`text/event-stream`)** | `X-User-Id` | **SSE / Streaming** | **`FE_MISMATCH`** |
| **Notifications** | `notificationService.getAll` | `/api/v1/notifications` | `GET` | `skip, limit` | `NotificationListResponse` (`items, total`) | `X-User-Id` | HTTP REST | `MATCHED` |
| **Notifications** | `notificationService.markRead` | `/api/v1/notifications/{noti_id}/read` | `PUT` | `noti_id: UUID` | `NotificationResponse` | `X-User-Id` | HTTP REST | `MATCHED` |
| **Notifications** | `notificationService.markAllRead` | `/api/v1/notifications/read-all` | `POST` | *None* | *204 No Content* | `X-User-Id` | HTTP REST | `MATCHED` |

---

## 3. Special Domain Audits

### 3.1. Authentication
* **Current Mechanism:** 
  * Backend hoàn toàn không có JWT token endpoint (không có `/v1/auth/login`, `/v1/auth/token`).
  * Tất cả các protected routes bên Backend xác thực bằng dependency `x_user_id: UUID = Header(...)` hoặc `Header(..., alias="X-User-Id")`.
  * Frontend lưu `focusbuddy_user_id` vào `localStorage` và tự động gắn vào Request Header thông qua Axios Request Interceptor trong [fe/src/lib/api.ts](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/lib/api.ts).
  * Trang `login/page.tsx` hiện đang dùng cơ chế bypass: Gọi `userService.getAll(0, 100)` để tìm user có email tương ứng rồi gán ID vào `localStorage`.
  * Password đã được hash trong DB (`bcrypt`), nhưng không được verify khi login vì không có API login.
* **Status:** `MATCHED` về mặt cơ chế định danh hiện tại (`x-user-id`), nhưng `BE_MISSING` đối với chuẩn Production Auth (OAuth2 / JWT tokens).

### 3.2. Chatbot & SSE Streaming
* **Backend Implementation:**
  * Endpoint `POST /api/v1/chat/sessions/{session_id}/messages` trả về `StreamingResponse(media_type="text/event-stream")`.
  * Bên trong [chat_service.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/services/module_5_ai_chatbot/chat_service.py) và [runtime.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/services/module_5_ai_chatbot/ai/runtime.py), luồng xử lý AI chạy Agent Runtime V2 (Supervisor -> Intent Routing -> Provider -> Tool Execution Loop -> Streaming chunks).
  * Backend yield trực tiếp chuỗi text thô (`yield chunk.content`).
* **Frontend Implementation:**
  * `chatService.sendMessage` trong [services.ts](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/lib/services.ts) gọi `api.post<ChatMessage>(...)` qua Axios tiêu chuẩn và kỳ vọng trả về JSON Object `ChatMessage`.
  * Màn hình `chatbot/page.tsx` gán `res.data` vào state message.
* **Status:** **`FE_MISMATCH` (CRITICAL)**. Axios standard POST không đọc stream theo thời gian thực (real-time stream consumption) và mong đợi JSON response, trong khi BE trả về text/event-stream raw chunks. Cần tích hợp `fetch` stream / EventSource consumer và hỗ trợ AbortController để cancel stream.

### 3.3. File Upload & OCR Extraction
* **Backend Implementation:**
  * Module [file_service.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/services/module_7_file_processing/file_service.py) hỗ trợ tiếp nhận file qua `POST /api/v1/files/upload` (`multipart/form-data`).
  * `POST /api/v1/files/{id}/extract`:
    * Với TXT -> `TxtProcessor`
    * Với CSV -> `CsvProcessor`
    * Với PDF / Images -> Gửi background task qua Celery worker (`app.workers.ocr_tasks.extract_transcript_task`).
  * `GET /api/v1/files/{id}/extraction` lấy kết quả trích xuất raw text và structured data.
* **Frontend Implementation:**
  * `fe/src/lib/services.ts` hoàn toàn chưa có `fileService`.
  * Trang `scores/page.tsx` đang mock upload bằng `setTimeout` 1.5s và hiển thị thông báo giả lập.
* **Status:** **`FE_MISSING`**. Cần xây dựng `fileService` và tích hợp luồng upload thật vào trang Scores/Transcript.

### 3.4. AI Analysis & Recommendations
* **Backend Implementation:**
  * `POST /api/v1/ai/analyze`: Thu thập dữ liệu tuần của user -> gọi LLM phân tích -> tạo Report và Recommendations.
  * `GET /api/v1/ai/reports` & `GET /api/v1/ai/recommendations`.
* **Frontend Implementation:**
  * Chưa có client service tương ứng trong `services.ts`.
  * Chưa có UI kích hoạt hoặc hiển thị báo cáo AI.
* **Status:** **`FE_MISSING`**.

---

## 4. Documentation Status & Discrepancies

1. **`fe/docs/API_FLOWS.md`**:
   * Mô tả cơ bản đúng các routes chính của FastAPI.
   * Ghi nhận lỗi thời: Tài liệu mô tả login flow tạo user nhưng không làm rõ cơ chế header `x-user-id` thay thế cho token; chưa làm rõ endpoint chat trả về `StreamingResponse` thay vì JSON.
2. **`fe/docs/FRONTEND_ARCHITECTURE_AUDIT.md`**:
   * Ghi nhận chính xác tình trạng Monolithic Page-based và các thư mục placeholder `features/`, `hooks/`, `stores/`.
   * Ghi nhận đúng kiến trúc Glassmorphism và Axios interceptor.
3. **`fe/docs/FE_BE_API_CONTRACT.md` (Tài liệu này)**:
   * Trở thành Canonical Contract Reference duy nhất cho toàn bộ các Task tích hợp tiếp theo.

---

## 5. Summary of Critical Blockers & Action Items for Subsequent Tasks

1. **Blocker 1 (Chatbot Streaming Protocol):**
   * FE đang dùng Axios POST JSON đối với endpoint Streaming SSE `/api/v1/chat/sessions/{session_id}/messages`.
   * **Giải pháp:** Cần triển khai streaming client (dùng Native Fetch API + `ReadableStreamDefaultReader`) để tiêu thụ token theo thời gian thực và render bong bóng chat AI mượt mà.

2. **Blocker 2 (Mocked File Upload in Scores):**
   * FE đang giả lập upload điểm số/bảng điểm.
   * **Giải pháp:** Thêm `fileService` hỗ trợ `multipart/form-data` upload lên `/api/v1/files/upload` và gọi `/api/v1/files/{id}/extract` hoặc `/api/v1/grades/import`.

3. **Blocker 3 (Missing Services for Metadata & AI):**
   * Thiếu service cho University, Major, Curriculum, File, AI Analysis.
   * **Giải pháp:** Bổ sung đầy đủ typed methods vào `fe/src/lib/services.ts`.
