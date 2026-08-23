# Frontend - Backend API Contract Audit Matrix

> **Project:** FocusBuddy (AI Study Companion & Academic Assistant)  
> **Scope:** Full System Integration (`fe/` & `be/`)  
> **Last Synchronized:** 23/08/2026 (FE-01 MVP Completed)  
> **Auth Scheme:** Standard JWT Bearer Token (`Authorization: Bearer <token>`)  
> **Status:** FULLY INTEGRATED & SYNCHRONIZED  

---

## 1. Overview & Source of Truth

* **Backend Base URL:** `http://localhost:8000/api`
* **Frontend Base URL:** `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'`
* **Authentication:** Stateless JWT Access Token (HS256, 24h expiration) issued by Backend upon `/api/v1/auth/login` or `/api/v1/auth/register`.
* **Token Transport:** Automatically attached by Axios Request Interceptor in `fe/src/lib/api.ts` as:
  ```http
  Authorization: Bearer <access_token>
  ```
* **Session Persistence:** React `AuthContext` restores the session on browser refresh via `GET /api/v1/auth/me`.

---

## 2. API Contract Matrix

| Domain | FE Service / Method | BE Endpoint | HTTP Method | Request Body / Params | Response Schema | Auth Scheme | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System** | `healthCheck()` | `/api/v1/ping` | `GET` | *None* | `{"ping": "pong!"}` | None (Public) | `MATCHED` |
| **Auth** | `authService.register` | `/api/v1/auth/register` | `POST` | `UserRegisterRequest` (`email, password, full_name, phone_number?, avatar_url?`) | `AuthResponse` (`access_token, token_type, expires_in, user`) | None (Public) | `MATCHED` |
| **Auth** | `authService.login` | `/api/v1/auth/login` | `POST` | `LoginRequest` (`email, password`) | `AuthResponse` (`access_token, token_type, expires_in, user`) | None (Public) | `MATCHED` |
| **Auth** | `authService.getMe` | `/api/v1/auth/me` | `GET` | *None* | `UserResponse` | Bearer JWT | `MATCHED` |
| **Auth** | `authService.logout` | `/api/v1/auth/logout` | `POST` | *None* | `{"message": "Logged out successfully"}` | Bearer JWT | `MATCHED` |
| **User** | `userService.getById` | `/api/v1/users/{id}` | `GET` | `id: UUID` | `UserResponse` | Bearer JWT | `MATCHED` |
| **User** | `userService.update` | `/api/v1/users/{id}` | `PUT` | `id: UUID, data: Partial<User>` | `UserResponse` | Bearer JWT | `MATCHED` |
| **User** | `userService.delete` | `/api/v1/users/{id}` | `DELETE` | `id: UUID` | *204 No Content* | Bearer JWT | `MATCHED` |
| **Academic Terms** | `academicTermService.getAll` | `/api/v1/academic-terms` | `GET` | `skip: int = 0, limit: int = 100` | `AcademicTermListResponse` (`items, total`) | None (Public) | `MATCHED` |
| **Courses** | `courseService.getAll` | `/api/v1/courses` | `GET` | `major_id?: UUID, skip: int, limit: int` | `CourseListResponse` (`items, total`) | None (Public) | `MATCHED` |
| **Grades** | `gradeService.getAll` | `/api/v1/grades` | `GET` | `course_id?: UUID, term_id?: UUID, skip, limit` | `List[StudentCourseResponse]` | Bearer JWT | `MATCHED` |
| **Grades** | `gradeService.create` | `/api/v1/grades` | `POST` | `StudentCourseCreate` | `StudentCourseResponse` | Bearer JWT | `MATCHED` |
| **Grades** | `gradeService.update` | `/api/v1/grades/{id}` | `PUT` | `id: UUID, data: StudentCourseUpdate` | `StudentCourseResponse` | Bearer JWT | `MATCHED` |
| **Grades** | `gradeService.delete` | `/api/v1/grades/{id}` | `DELETE` | `id: UUID` | *204 No Content* | Bearer JWT | `MATCHED` |
| **Performance** | `academicPerformanceService.getStatistics` | `/api/v1/academic-performance` | `GET` | `skip: int, limit: int` | `List[AcademicStatisticResponse]` | Bearer JWT | `MATCHED` |
| **Performance** | `academicPerformanceService.getBasicStatistics` | `/api/v1/academic-performance/basic-statistics` | `GET` | *None* | `AcademicBasicStatisticsResponse` | Bearer JWT | `MATCHED` |
| **Study Tasks** | `studyTaskService.getAll` | `/api/v1/study-tasks` | `GET` | `course_id?: UUID, skip, limit` | `StudyTaskListResponse` (`items, total`) | Bearer JWT | `MATCHED` |
| **Study Tasks** | `studyTaskService.create` | `/api/v1/study-tasks` | `POST` | `StudyTaskCreate` | `StudyTaskResponse` | Bearer JWT | `MATCHED` |
| **Study Tasks** | `studyTaskService.update` | `/api/v1/study-tasks/{id}` | `PUT` | `id: UUID, data: StudyTaskUpdate` | `StudyTaskResponse` | Bearer JWT | `MATCHED` |
| **Study Tasks** | `studyTaskService.delete` | `/api/v1/study-tasks/{id}` | `DELETE` | `id: UUID` | *204 No Content* | Bearer JWT | `MATCHED` |
| **Study Sessions** | `studySessionService.getAll` | `/api/v1/study-sessions` | `GET` | `skip, limit` | `StudySessionListResponse` (`items, total`) | Bearer JWT | `MATCHED` |
| **Study Sessions** | `studySessionService.create` | `/api/v1/study-sessions` | `POST` | `StudySessionCreate` | `StudySessionResponse` | Bearer JWT | `MATCHED` |
| **Learning Goals** | `learningGoalService.getAll` | `/api/v1/learning-goals` | `GET` | `skip, limit` | `LearningGoalListResponse` (`items, total`) | Bearer JWT | `MATCHED` |
| **Learning Goals** | `learningGoalService.create` | `/api/v1/learning-goals` | `POST` | `LearningGoalCreate` | `LearningGoalResponse` | Bearer JWT | `MATCHED` |
| **Learning Goals** | `learningGoalService.update` | `/api/v1/learning-goals/{id}` | `PUT` | `id: UUID, data: LearningGoalUpdate` | `LearningGoalResponse` | Bearer JWT | `MATCHED` |
| **Emotion Logs** | `emotionLogService.getAll` | `/api/v1/emotions` | `GET` | `skip, limit` | `{"items": EmotionLogResponse[], "total": int}` | Bearer JWT | `MATCHED` |
| **Emotion Logs** | `emotionLogService.create` | `/api/v1/emotions` | `POST` | `EmotionLogCreate` | `EmotionLogResponse` | Bearer JWT | `MATCHED` |
| **Assessments** | `mentalAssessmentService.getAll` | `/api/v1/assessments` | `GET` | `skip, limit` | `{"items": MentalAssessmentResponse[], "total": int}` | Bearer JWT | `MATCHED` |
| **Chat Sessions** | `chatService.getSessions` | `/api/v1/chat/sessions` | `GET` | `skip, limit` | `List[ChatSessionResponse]` | Bearer JWT | `MATCHED` |
| **Chat Sessions** | `chatService.createSession` | `/api/v1/chat/sessions` | `POST` | `{"title": string}` | `ChatSessionResponse` | Bearer JWT | `MATCHED` |
| **Chat Messages** | `chatService.getMessages` | `/api/v1/chat/sessions/{id}/messages` | `GET` | `id: UUID, skip, limit` | `List[ChatMessageResponse]` | Bearer JWT | `MATCHED` |
| **Chat Stream** | `handleSend` (fetch) | `/api/v1/chat/sessions/{id}/messages` | `POST` | `ChatMessageCreate` (`content, message_type`) | `StreamingResponse` (`text/event-stream`) | Bearer JWT | `MATCHED` |
| **Notifications** | `notificationService.getAll` | `/api/v1/notifications` | `GET` | `skip, limit` | `NotificationListResponse` (`items, total`) | Bearer JWT | `MATCHED` |
| **Notifications** | `notificationService.markRead` | `/api/v1/notifications/{id}/read` | `PUT` | `id: UUID` | `NotificationResponse` | Bearer JWT | `MATCHED` |
| **Notifications** | `notificationService.markAllRead` | `/api/v1/notifications/read-all` | `POST` | *None* | *204 No Content* | Bearer JWT | `MATCHED` |
