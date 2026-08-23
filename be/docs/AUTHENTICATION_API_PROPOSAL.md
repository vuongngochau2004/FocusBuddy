# Authentication API Architecture Proposal & Implementation Plan (Final)

> **Project:** FocusBuddy Backend (`be/`)  
> **Status:** `REVISED PROPOSAL — NOT IMPLEMENTED`  
> **Author:** Senior Backend Architect  
> **Date:** 23/08/2026  
> **Scope:** Identity, Authentication, Boundary Separation with User Management, and Granular Migration  

---

## 1. Executive Summary & Context

Hệ thống FocusBuddy Backend hiện hoạt động trên kiến trúc **FastAPI 3-Tier** (`routers/` $\to$ `services/` $\to$ `repositories/` $\to$ PostgreSQL) kết hợp **Agent System V2**.

Cơ chế định danh hiện tại dựa vào HTTP Header `X-User-Id` (hoặc `x-user-id`) truyền chuỗi UUID từ client mà không có lớp bảo vệ xác thực hay kiểm tra quyền sở hữu. 

Tài liệu này là bản **Kế hoạch Thiết kế và Triển khai Hoàn chỉnh (Final Implementation Plan)** giải quyết triệt để các ranh giới kiến trúc:
1. **Phân định rõ ranh giới Trách nhiệm:** Tách biệt tuyệt đối giữa **Authentication Module** (Đăng ký, Đăng nhập, Token, Current User Read-Only, Logout) và **User/Profile Management Module** (Xem/Cập nhật thông tin profile, tùy biến giao diện).
2. **Khóa chặt Auth API Contract:** Chỉ gồm đúng 4 endpoints (`POST /auth/register`, `POST /auth/login`, `GET /auth/me` [READ-ONLY], `POST /auth/logout`). Tuyệt đối **không đưa `PUT /auth/me` hay `POST /auth/token`** vào Auth API.
3. **Xác minh Vòng đời Entity khi Đăng ký:** Tạo `User`, `StudentProfile`, `UserPreference` trong **1 Atomic DB Transaction** do các module học thuật và chatbot phụ thuộc chặt vào quan hệ 1-1 này.
4. **Minh định ngữ nghĩa Logout & Refresh Token:** Stateless JWT MVP $\implies$ Client-side token removal. Quyết định có chủ đích **loại bỏ Refresh Token khỏi MVP** (sử dụng Access Token 24h).
5. **Bất biến Môi trường Production:** Fallback `X-User-Id` **BỊ CẤM TUYỆT ĐỐI** trên môi trường Production, bất kể cấu hình.
6. **Ranh giới Xác thực (Authentication) vs Quyền sở hữu (Ownership):** Ma trận kiểm soát quyền sở hữu chi tiết cấp endpoint dựa trên quan hệ thực tế của Model (ví dụ: `Grade` $\to$ `StudentProfile` $\to$ `User`).
7. **Xử lý User CRUD APIs:** Khóa API danh sách người dùng công khai, bảo vệ endpoint `users/{user_id}` theo quyền sở hữu, không giả định vai trò Admin khi chưa có RBAC.
8. **Chia nhỏ Kế hoạch Di trú:** Tách bước di trú 11 routers thành 5 bước độc lập (`AUTH-06A` $\to$ `AUTH-06E`) có tính cô lập cao, dễ kiểm thử và an toàn rollback.

> [!IMPORTANT]
> **Quy tắc thi hành:** Tài liệu này là **Thiết kế Kiến trúc (Design Only)**. Tuyệt đối **KHÔNG** thực hiện thay đổi mã nguồn hoặc migration database trước khi được phê duyệt chính thức.

---

## 2. Authentication vs User/Profile Responsibility Boundary

Hệ thống phân tách nghiêm ngặt hai miền trách nhiệm:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION MODULE (app.api.v1.auth, AuthService)      │
│ - Đăng ký tài khoản (Register)                              │
│ - Đăng nhập & Xác thực thông tin đăng nhập (Login)          │
│ - Cấp phát & Giải mã Authentication Token (JWT Access Token)│
│ - Xác thực danh tính phiên hiện tại (Resolve Current User)  │
│ - Trả về thông tin danh tính hiện tại: GET /auth/me (READ-ONLY)│
│ - Ngữ nghĩa đăng xuất (Logout semantics)                    │
└─────────────────────────────────────────────────────────────┘
                              │ (Độc lập trách nhiệm)
┌─────────────────────────────▼───────────────────────────────┐
│ 2. USER / PROFILE MODULE (app.api.v1.user, UserService)     │
│ - Quản lý thông tin tài khoản người dùng (User Management)  │
│ - Cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar): PUT /users/{id}│
│ - Quản lý hồ sơ sinh viên (Student Profile: Mã SV, Khoa...) │
│ - Quản lý tùy chọn cá nhân (User Preferences: Theme, Lang)  │
└─────────────────────────────────────────────────────────────┘
```

* **Nguyên tắc bất biến:** Endpoint `GET /api/v1/auth/me` là **READ-ONLY**. Không thêm `PUT /auth/me` hay `PATCH /auth/me` vào Authentication API. Mọi thao tác chỉnh sửa hồ sơ người dùng phải thông qua User Module (`PUT /api/v1/users/{user_id}`).

---

## 3. Final Authentication API Contract

Master router mount tại `/api` ([be/app/main.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/main.py)).  
Auth router mount với prefix `/v1/auth` ([be/app/api/router.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/api/router.py)).  
$\implies$ **Đường dẫn chuẩn: `/api/v1/auth/*`**.

| Method | Full Path | Auth Requirement | Request Body (JSON) | Response Body (Success) | Error Codes | Trách nhiệm & Hành vi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | `UserRegisterRequest` | `201 Created` $\to$ `AuthResponse` | `400, 409, 422` | Tạo tài khoản User + Profiles mặc định trong 1 transaction; Cấp phát JWT token. |
| `POST` | `/api/v1/auth/login` | Public | `LoginRequest` | `200 OK` $\to$ `AuthResponse` | `401, 403, 422` | Xác thực email/password qua `bcrypt`; Cấp phát JWT Access Token (24h). |
| `GET` | `/api/v1/auth/me` | Bearer Token | *None* | `200 OK` $\to$ `UserResponse` | `401, 404` | **READ-ONLY:** Trả về thông tin thực thể User đang đăng nhập. |
| `POST` | `/api/v1/auth/logout` | Bearer Token | *None* | `200 OK` $\to$ `{"message": "Logged out successfully"}` | `401` | Xác nhận đăng xuất phía server; Phía client xóa token. |

---

## 4. Schemas Specification (`app/schemas/module_1_user_management/auth.py`)

```python
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.module_1_user_management.user import UserResponse

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Email đăng nhập của sinh viên", examples=["student@university.edu.vn"])
    password: str = Field(..., min_length=6, description="Mật khẩu tài khoản")

class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Email sinh viên", examples=["student@university.edu.vn"])
    password: str = Field(..., min_length=6, description="Mật khẩu tối thiểu 6 ký tự")
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên sinh viên", examples=["Nguyễn Văn A"])
    phone_number: Optional[str] = Field(None, max_length=20, description="Số điện thoại liên hệ")
    avatar_url: Optional[str] = Field(None, description="URL ảnh đại diện")

class AuthResponse(BaseModel):
    access_token: str = Field(..., description="JWT Access Token")
    token_type: str = Field("bearer", description="Loại token (Bearer)")
    expires_in: int = Field(..., description="Thời gian hiệu lực tính bằng giây (86400s)")
    user: UserResponse = Field(..., description="Thông tin chi tiết người dùng")

class TokenPayload(BaseModel):
    sub: str # User ID (UUID string)
    email: str
    exp: datetime
    iat: datetime
    type: str = "access"
```

![alt text](<Authentication Data Flows.png>)

---

## 5. Verified Entity Lifecycle during Registration

Kiểm chứng từ mã nguồn thực tế tại [user.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/models/module_1_user_management/user.py), [student_profile.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/models/module_1_user_management/student_profile.py), [user_preference.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/models/module_1_user_management/user_preference.py) và [grade_service.py](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/app/services/module_2_academic_management/grade_service.py):

* **Tính bắt buộc của StudentProfile & UserPreference:**
  * `GradeService._get_student_profile()` và `AcademicPerformanceService` truy vấn dữ liệu học thuật qua quan hệ `StudentProfile.user_id`. Nếu không có `StudentProfile`, sinh viên lập tức nhận lỗi `404` khi nhập điểm hoặc tính GPA.
  * Chatbot Agent V2 và hệ thống Notification truy vấn cấu hình cá nhân qua `UserPreference.user_id`.
  * Không có endpoint độc lập tạo rời `StudentProfile` hay `UserPreference`.
* **Ranh giới Transaction (Atomic Transaction Boundary):**
  * Thực thi bên trong `AuthService.register()`:
    ```python
    try:
        # 1. Tạo User
        db_user = User(**user_data)
        db.add(db_user)
        db.flush() # Lấy db_user.id

        # 2. Tạo StudentProfile rỗng liên kết 1-1
        profile = StudentProfile(user_id=db_user.id)
        db.add(profile)

        # 3. Tạo UserPreference mặc định liên kết 1-1
        pref = UserPreference(user_id=db_user.id)
        db.add(pref)

        # 4. Commit toàn bộ
        db.commit()
        db.refresh(db_user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")
    ```
  * Đảm bảo tính toàn vẹn dữ liệu, không bao giờ sinh ra "Orphan User" bị thiếu profile.

---

## 6. Password Security & JWT Architecture

### 6.1. Password Security
* Thuật toán: `bcrypt` thông qua thư viện `passlib[bcrypt]` (hoặc `bcrypt`).
* Băm mật khẩu: Muối ngẫu nhiên (work factor 12).
* Không bao giờ lưu trữ plain-text password.
* Khi đăng nhập thất bại: Trả về thông báo lỗi chung `"Invalid email or password"` để chống tấn công User Enumeration.

### 6.2. JWT Token Architecture
* **Token Type:** Stateless Access Token (Bearer).
* **Signing Algorithm:** `HS256` với `AUTH_SECRET_KEY` tối thiểu 32 ký tự ngẫu nhiên.
* **Thời hạn hiệu lực:** **24 giờ (1440 phút)**.
* **Claims:** `sub` (User UUID string), `email`, `exp`, `iat`, `type="access"`.
* **Refresh Token:** **LOẠI BỎ KHỎI MVP (Intentional Scope Decision)** nhằm giữ hệ thống tinh gọn, ổn định.

### 6.3. Logout Semantics
* Trong MVP Stateless JWT, **Logout là hành vi Client-side Token Removal** (Client xóa token khỏi `localStorage` và hủy auth state).
* Route `POST /api/v1/auth/logout` trả về `200 OK` (xác nhận phía server).
* **Không đưa vào MVP:** Redis token blacklist hay database revocation tables (được xếp vào nhóm *Future Hardening*).

---

## 7. Centralized Dependency & Production Dev-Header Invariant

### 7.1. Bất biến Môi trường Production (Production Invariant)

$$\mathbf{ENVIRONMENT == "production"} \implies \mathbf{ALLOW\_DEV\_HEADER\_AUTH = False\ (HARD\ DISABLED)}$$

Mọi request không có Bearer JWT hợp lệ trên môi trường Production đều bị từ chối với mã lỗi `401 Unauthorized`.

### 7.2. Đặc tả Logic Dependency (`app/api/dependencies.py`)

```python
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
import logging

from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.module_1_user_management.user import User
from app.repositories.module_1_user_management.user_repository import UserRepository

logger = logging.getLogger(__name__)
security_scheme = HTTPBearer(auto_error=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Xác thực qua Bearer JWT Token
    if auth_credentials and auth_credentials.credentials:
        token = auth_credentials.credentials
        payload = decode_access_token(token)
        if payload is None or "sub" not in payload:
            raise credentials_exception
        try:
            user_id = UUID(payload["sub"])
        except ValueError:
            raise credentials_exception

        user = UserRepository(db).get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
        return user

    # 2. Strict Dev Fallback (Chỉ chạy khi không phải production VÀ cờ bật)
    is_production = getattr(settings, "ENVIRONMENT", "development").lower() == "production"
    allow_dev_header = getattr(settings, "ALLOW_DEV_HEADER_AUTH", False) and not is_production

    if allow_dev_header and x_user_id:
        try:
            user_id = UUID(x_user_id)
            user = UserRepository(db).get_by_id(user_id)
            if user:
                if not user.is_active:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
                return user
        except ValueError:
            pass

    # 3. Từ chối nếu không hợp lệ
    raise credentials_exception

def get_current_user_id(current_user: User = Depends(get_current_user)) -> UUID:
    return current_user.id
```

---

## 8. Explicit Ownership & Authorization Matrix

Ma trận xác định đường dẫn sở hữu thực tế của các Model trong cơ sở dữ liệu:

| Domain | Endpoint | Current Identity | Target Identity | Owner Field / Relationship Path | Ownership Required | Enforcement Location | Unauthorized Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Study Tasks** | `POST /api/v1/study-tasks` | `Header(x_user_id)` | `current_user.id` | `StudyTask.user_id` | Auto-assign | Service Layer (`task.user_id = user_id`) | `401` |
| **Study Tasks** | `GET /api/v1/study-tasks` | `Header(x_user_id)` | `current_user.id` | `StudyTask.user_id` | Query Filter | Repository (`WHERE user_id = user_id`) | `401` |
| **Study Tasks** | `GET /api/v1/study-tasks/{id}`| `Header(x_user_id)` | `current_user.id` | `StudyTask.user_id` | Single Check | Service Layer (`if task.user_id != user_id`) | `404 Not Found` |
| **Study Tasks** | `PUT/DELETE /{id}` | `Header(x_user_id)` | `current_user.id` | `StudyTask.user_id` | Single Check | Service Layer (`if task.user_id != user_id`) | `403 Forbidden` |
| **Study Sessions**| `CRUD /api/v1/study-sessions*`| `Header(x_user_id)` | `current_user.id` | `StudySession.user_id` | Filter / Check | Service & Repo Layer | `403/404` |
| **Learning Goals**| `CRUD /api/v1/learning-goals*` | `Header(x_user_id)` | `current_user.id` | `LearningGoal.user_id` | Filter / Check | Service & Repo Layer | `403/404` |
| **Grades** | `POST /api/v1/grades` | `Header(x_user_id)` | `current_user.id` | `StudentCourse.student_profile` $\to$ `StudentProfile.user_id` | Profile Lookup | `GradeService._get_student_profile(user_id)` | `401/404` |
| **Grades** | `GET /api/v1/grades` | `Header(x_user_id)` | `current_user.id` | `StudentCourse.student_profile` $\to$ `StudentProfile.user_id` | Query Filter | `Repo (WHERE student_profile_id = profile.id)` | `401` |
| **Grades** | `PUT/DELETE /grades/{id}` | `Header(x_user_id)` | `current_user.id` | `StudentCourse.student_profile` $\to$ `StudentProfile.user_id` | Single Check | `GradeService (verify grade.student_profile_id == profile.id)` | `403/404` |
| **Academic Stats**| `GET /api/v1/academic-performance*` | `Header(x_user_id)` | `current_user.id` | `AcademicStatistic.student_profile` $\to$ `StudentProfile.user_id` | Profile Lookup | `AcademicPerformanceService (by profile.id)` | `401` |
| **Emotion Logs** | `CRUD /api/v1/emotions*` | `Header(x_user_id)` | `current_user.id` | `EmotionLog.user_id` | Filter / Check | Service Layer (`if log.user_id != user_id`) | `403/404` |
| **Assessments** | `CRUD /api/v1/assessments*` | `Header(x_user_id)` | `current_user.id` | `MentalAssessment.user_id` | Filter / Check | Service Layer (`if item.user_id != user_id`) | `403/404` |
| **Files** | `POST /api/v1/files/upload` | `Header(x_user_id)` | `current_user.id` | `UploadedFile.user_id` | Auto-assign | `FileService (save to storage/uploads/{user_id})` | `401` |
| **Files** | `GET/DELETE /files/{id}*`| `Header(x_user_id)` | `current_user.id` | `UploadedFile.user_id` | Single Check | `FileService.get_file (if file.user_id != user_id: 403)` | `403` |
| **Chatbot** | `CRUD /api/v1/chat/sessions*` | `Header(x_user_id)` | `current_user.id` | `ChatSession.user_id` | Filter / Check | `ChatService (if session.user_id != user_id: 404)` | `404` |
| **Chatbot SSE** | `POST /chat/sessions/{id}/messages` | `Header(x_user_id)` | `current_user.id` | `ChatSession.user_id` | Auth Before Stream | Dependency resolves user TRƯỚC KHI mở SSE stream | `401/404` |
| **AI Analysis** | `POST/GET /api/v1/ai/*` | `Header(x_user_id)` | `current_user.id` | `AIAnalysisReport.user_id`| Filter / Auto | `AIService (scoped to current_user.id)` | `401` |
| **Notifications** | `GET/PUT /api/v1/notifications*` | `Header(x_user_id)` | `current_user.id` | `Notification.user_id` | Filter / Check | `NotificationService (scoped to user_id)` | `403/404` |

---

## 9. User CRUD APIs Fate (No Admin Assumption)

Khảo sát Backend xác nhận: Model `User` **HIỆN TẠI KHÔNG CÓ CỘT `role` HOẶC CƠ CHẾ RBAC/ADMIN**.
Không tự ý tạo cơ chế admin giả định. Quyết định xử lý các API User cũ trong `be/app/api/v1/user.py`:

1. **`GET /api/v1/users` (Lấy danh sách toàn bộ người dùng):**
   * **Quyết định:** **VÔ HIỆU HÓA TRUY CẬP CÔNG KHAI (DISABLED)**.
   * *Hành vi:* Trả về `403 Forbidden` với message `"Public user listing is disabled"`.
   * *Lý do:* Chặn đứng nguy cơ rò rỉ toàn bộ danh sách sinh viên.
2. **`GET /api/v1/users/{user_id}`, `PUT /api/v1/users/{user_id}`, `DELETE /api/v1/users/{user_id}`:**
   * **Quyết định:** **BẮT BUỘC KIỂM TRA QUYỀN SỞ HỮU (OWNERSHIP PROTECTED)**.
   * *Hành vi:* `current_user: User = Depends(get_current_user)`. Nếu `current_user.id != user_id` $\implies$ Trả về `403 Forbidden`.
   * *Profile Updates:* Người dùng cập nhật tên, số điện thoại, avatar thông qua `PUT /api/v1/users/{user_id}` (được xác thực đúng chủ sở hữu). Authentication API không đảm nhận chức năng này.
3. **`POST /api/v1/users`:**
   * **Quyết định:** Đánh dấu Deprecated, chuyển hướng client sang `POST /api/v1/auth/register`.

---

## 10. Granular Implementation Plan

Kế hoạch được chia nhỏ thành các bước độc lập, dễ kiểm thử và an toàn rollback:

### [AUTH-01] Core Security & Configuration Setup
* **Objective:** Cài đặt `PyJWT`, cấu hình biến môi trường và viết hàm tạo/giải mã token JWT trong `app.core`.
* **Files to Modify:**
  * `be/pyproject.toml` (Thêm `pyjwt>=2.8.0`)
  * `be/app/core/config.py` (Thêm `AUTH_SECRET_KEY`, `AUTH_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ALLOW_DEV_HEADER_AUTH`, `ENVIRONMENT`)
  * `be/app/core/security.py` (Thêm `create_access_token`, `decode_access_token`)
* **Database / API Changes:** *None*
* **Security:** `HS256`, secret key tối thiểu 32 ký tự.
* **Risk:** `LOW`
* **Verification:** Unit test `tests/test_auth_jwt.py` (encode, decode, expired, tampered).

---

### [AUTH-02] Auth Schemas Definition
* **Objective:** Định nghĩa các Pydantic Schemas v2 cho request/response của module Auth.
* **Files to Create:**
  * `be/app/schemas/module_1_user_management/auth.py`
* **Database / API Changes:** *None*
* **Risk:** `LOW`
* **Verification:** Pydantic validation tests (email format, password min length).

---

### [AUTH-03] Authentication Service & Transaction Boundary
* **Objective:** Hiện thực `AuthService` với `register` (Atomic Transaction tạo User + StudentProfile + UserPreference), `authenticate`, `get_me` (Read-only).
* **Files to Create:**
  * `be/app/services/module_1_user_management/auth_service.py`
* **Database / API Changes:** *None* (Sử dụng DB models hiện có).
* **Security:** Băm mật khẩu `bcrypt`, trả về lỗi chung `"Invalid email or password"`.
* **Risk:** `LOW`
* **Verification:** Unit test `tests/test_auth_register.py` và `tests/test_auth_login.py` (bao gồm test rollback transaction khi lỗi DB).

---

### [AUTH-04] Authentication API Router & Swagger Integration
* **Objective:** Expose 4 endpoints `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/logout`.
* **Files to Create:**
  * `be/app/api/v1/auth.py`
* **Files to Modify:**
  * `be/app/api/router.py` (Include router `/v1/auth`)
  * `be/app/main.py` (Config OpenAPI HTTPBearer security scheme)
* **API Changes:** 4 endpoints mới tại `/api/v1/auth/*`.
* **Risk:** `LOW`
* **Verification:** Gọi API thực tế qua Swagger UI và pytest.

---

### [AUTH-05] Centralized Dual-Mode Identity Dependency
* **Objective:** Triển khai `get_current_user` và `get_current_user_id` trong `app/api/dependencies.py` có kiểm tra Production Invariant.
* **Files to Modify:**
  * `be/app/api/dependencies.py`
* **Security:** Chặn cứng `X-User-Id` nếu `ENVIRONMENT == "production"`.
* **Risk:** `MEDIUM`
* **Verification:** Test dependency với token hợp lệ, token hết hạn, dev header trong dev mode, và dev header trong prod mode.

---

### [AUTH-06A] Personal Study Management Routers Migration
* **Objective:** Di trú các router quản lý học tập cá nhân: `study_tasks.py`, `study_sessions.py`, `learning_goals.py`.
* **Files to Modify:**
  * `be/app/api/v1/study_tasks.py`
  * `be/app/api/v1/study_sessions.py`
  * `be/app/api/v1/learning_goals.py`
* **Implementation:** Thay `x_user_id: UUID = Header(...)` bằng `user_id: UUID = Depends(get_current_user_id)`.
* **Risk:** `LOW`
* **Verification:** Test User A không thể đọc/sửa/xóa Task, Session, Goal của User B.

---

### [AUTH-06B] Academic & Grades Management Routers Migration
* **Objective:** Di trú các router điểm số và kết quả học tập: `grades.py`, `academic_performance.py`.
* **Files to Modify:**
  * `be/app/api/v1/grades.py`
  * `be/app/api/v1/academic_performance.py`
* **Implementation:** Thay `x_user_id: str = Header(...)` bằng `user_id: UUID = Depends(get_current_user_id)`. Xác thực quyền sở hữu thông qua `StudentProfile.user_id`.
* **Risk:** `LOW`
* **Verification:** Test nhập điểm và tính toán thống kê GPA của User A hoàn toàn cô lập với User B.

---

### [AUTH-06C] Mental Health Routers Migration
* **Objective:** Di trú các router cảm xúc và khảo sát tâm lý: `emotion_logs.py`, `mental_assessments.py`.
* **Files to Modify:**
  * `be/app/api/v1/emotion_logs.py`
  * `be/app/api/v1/mental_assessments.py`
* **Implementation:** Thay `x_user_id: UUID = Header(...)` bằng `user_id: UUID = Depends(get_current_user_id)`.
* **Risk:** `LOW`
* **Verification:** Test ghi log cảm xúc và làm bài test tâm lý với Bearer token.

---

### [AUTH-06D] File Processing Router Migration
* **Objective:** Di trú router upload và trích xuất tài liệu: `files.py`.
* **Files to Modify:**
  * `be/app/api/v1/files.py`
* **Implementation:** Thay `x_user_id: UUID = Header(...)` bằng `user_id: UUID = Depends(get_current_user_id)`.
* **Risk:** `LOW`
* **Verification:** Test upload file lưu đúng thư mục `storage/uploads/{user_id}`, User B không xem được file của User A.

---

### [AUTH-06E] AI Chatbot, Analysis & Notification Routers Migration
* **Objective:** Di trú các router AI trợ lý và thông báo: `chat.py`, `ai_analysis.py`, `notifications.py`.
* **Files to Modify:**
  * `be/app/api/v1/chat.py` (Xóa helper `get_user_id` cục bộ; xác thực danh tính TRƯỚC KHI mở SSE stream)
  * `be/app/api/v1/ai_analysis.py` (Xóa helper `get_user_id` cục bộ)
  * `be/app/api/v1/notifications.py`
* **Implementation:** Thay thế bằng `Depends(get_current_user_id)`.
* **Risk:** `LOW`
* **Verification:** Test chat stream SSE và tạo phân tích AI với Bearer token; chặn unauthenticated stream request.

---

### [AUTH-07] User CRUD Protection & Lockdown
* **Objective:** Khóa API danh sách người dùng công khai và bảo vệ endpoint `users/{user_id}` theo quyền sở hữu.
* **Files to Modify:**
  * `be/app/api/v1/user.py`
* **Implementation:**
  * `GET /api/v1/users` $\to$ Trả về `403 Forbidden`.
  * `GET/PUT/DELETE /api/v1/users/{user_id}` $\to$ `if current_user.id != user_id: raise HTTPException(403)`.
* **Risk:** `LOW`
* **Verification:** Test User A không thể đọc/sửa thông tin User B qua `/users/{user_b_id}`.

---

### [AUTH-08] Full Deprecation & Decommission of Dev Header Fallback
* **Objective:** Xóa bỏ hoàn toàn mã nguồn fallback `X-User-Id` và cấu hình sau khi Frontend hoàn tất chuyển đổi.
* **Files to Modify:**
  * `be/app/core/config.py` (Xóa bỏ hoàn toàn biến cấu hình `ALLOW_DEV_HEADER_AUTH`)
  * `be/app/api/dependencies.py` (Xóa bỏ hoàn toàn tham số `x_user_id: Header(...)` và khối fallback logic)
  * `be/tests/test_auth_dev_fallback.py` (Xóa hoặc cập nhật thành test khẳng định chặn 100% header `X-User-Id`)
* **Risk:** `LOW`
* **Verification:** Request chỉ có `X-User-Id` bị từ chối `401 Unauthorized` 100% trên mọi môi trường.

---

## 11. Comprehensive Testing Strategy

| Suite File | Mục tiêu kiểm thử | Các trường hợp cụ thể |
| :--- | :--- | :--- |
| `tests/test_auth_jwt.py` | Core JWT Functions | Token encode/decode hợp lệ; Token hết hạn (`ExpiredSignatureError`); Token sai secret key; Token thiếu claim `sub`. |
| `tests/test_auth_register.py`| Registration & Lifecycle | Đăng ký thành công $\to$ 201 + Token + tạo đủ 3 bản ghi; Trùng email $\to$ 409; Mật khẩu ngắn $\to$ 422; Giả lập lỗi DB $\to$ Rollback sạch. |
| `tests/test_auth_login.py` | Login & Credentials | Đăng nhập đúng $\to$ 200 + Token; Sai mật khẩu $\to$ 401; Email không tồn tại $\to$ 401; Tài khoản `is_active=False` $\to$ 403. |
| `tests/test_auth_me.py` | Current User Read-Only | `GET /auth/me` có token $\to$ 200; Không có token $\to$ 401; Token hết hạn $\to$ 401. |
| `tests/test_auth_ownership.py`| Cross-User Ownership | User A tạo Task/Grade/File $\to$ User B truy cập $\to$ 403/404; User B update Task của A $\to$ 403; User B xóa Grade của A $\to$ 403. |
| `tests/test_auth_user_crud.py`| User CRUD Lockdown | `GET /users` $\to$ 403; `PUT /users/{other_user_id}` $\to$ 403; `PUT /users/{my_id}` $\to$ 200. |
| `tests/test_auth_dev_fallback.py`| Dev Fallback Invariant | Dev + Enabled $\to$ 200; Dev + Disabled $\to$ 401; **Production + Enabled $\to$ STILL 401**; **Production + Disabled $\to$ STILL 401**. |

---

## 12. Checkpoints & Verification Gates

* **CHECKPOINT 1 (Foundation Ready):** `AUTH-01` & `AUTH-02` hoàn tất $\to$ PyJWT sẵn sàng, JWT unit test pass 100%.
* **CHECKPOINT 2 (Auth API Ready):** `AUTH-03` & `AUTH-04` hoàn tất $\to$ Đăng ký/Đăng nhập lấy token thành công qua Swagger `/docs`.
* **CHECKPOINT 3 (Dependency Ready):** `AUTH-05` hoàn tất $\to$ `get_current_user` verify token chính xác, chặn dev header trên prod.
* **CHECKPOINT 4 (Study & Grades Migrated):** `AUTH-06A` & `AUTH-06B` hoàn tất $\to$ Tasks, Sessions, Goals, Grades hoạt động với Bearer token và pass ownership tests.
* **CHECKPOINT 5 (All Domains Migrated):** `AUTH-06C`, `AUTH-06D`, `AUTH-06E` hoàn tất $\to$ Toàn bộ 11 routers nghiệp vụ chuyển sang JWT.
* **CHECKPOINT 6 (User Security Locked):** `AUTH-07` hoàn tất $\to$ Khóa `/users`, bảo vệ user profile.
* **CHECKPOINT 7 (FE Integration Complete):** Frontend chuyển sang gửi `Authorization: Bearer <token>` thành công.
* **CHECKPOINT 8 (Final Decommission):** `AUTH-08` hoàn tất $\to$ Xóa bỏ hoàn toàn code fallback `X-User-Id`.

---

## 13. Rollback Strategy

| Nhóm Task | Sự cố tiềm ẩn | Cơ chế phát hiện | Phương án Rollback |
| :--- | :--- | :--- | :--- |
| **`AUTH-01` $\to$ `AUTH-04`** | Lỗi config hoặc cú pháp route mới | Pytest fail | Git revert commit của module auth |
| **`AUTH-05`** | Lỗi parse token trong dependency | Integration test fail | Revert `dependencies.py` |
| **`AUTH-06A` $\to$ `AUTH-06E`** | Lỗi ownership check làm gián đoạn router | Test domain fail | Revert từng router riêng lẻ |
| **`AUTH-07`** | Client cũ gọi nhầm `/users` | 403 Forbidden | Điều hướng client sang `/auth/me` (đọc) hoặc `/users/{my_id}` (sửa) |
| **`AUTH-08`** | Tắt fallback khi client dev chưa update xong | 401 trên client dev | Bật lại `ALLOW_DEV_HEADER_AUTH=True` (chỉ trên Dev) |

> [!CAUTION]
> **Quy tắc an toàn bất biến:** Trong mọi tình huống rollback, **KHÔNG BAO GIỜ** được phép kích hoạt fallback `X-User-Id` trên môi trường Production (`ENVIRONMENT=production`).

---

## 14. Documentation Migration Strategy

1. **Tài liệu Canonical Mới:** Tạo tài liệu [be/docs/AUTHENTICATION.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/docs/AUTHENTICATION.md) sau khi hoàn thành triển khai.
2. **Cập nhật Tài liệu Cũ:**
   * [be/docs/api/user-api.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/docs/api/user-api.md) $\implies$ Cập nhật `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`.
   * [be/docs/api/frontend-integration.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/be/docs/api/frontend-integration.md) $\implies$ Đổi hướng dẫn từ `X-User-Id` sang `Authorization: Bearer <token>`.
   * [fe/docs/FE_BE_API_CONTRACT.md](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/docs/FE_BE_API_CONTRACT.md) $\implies$ Đổi trạng thái Authentication thành `MATCHED`.
