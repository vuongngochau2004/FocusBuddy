# MODEL IMPLEMENTATION NOTES

## 1. Danh sách module đã implement
Hệ thống FocusBuddy gồm 8 module theo thiết kế đã được implement bằng SQLAlchemy ORM Models:
- Module 1: User Management (`module_1_user_management`)
- Module 2: Academic Management (`module_2_academic_management`)
- Module 3: Learning Activity (`module_3_learning_activity`)
- Module 4: Mental Health (`module_4_mental_health`)
- Module 5: AI Chatbot (`module_5_ai_chatbot`)
- Module 6: AI Analysis (`module_6_ai_analysis`)
- Module 7: File Processing (`module_7_file_processing`)
- Module 8: Recommendation & Notification (`module_8_recommendation_notification`)

## 2. Danh sách model trong từng module
- **Module 1**: `User`, `University`, `Major`, `StudentProfile`, `UserPreference`
- **Module 2**: `AcademicTerm`, `Course`, `CoursePrerequisite`, `StudentCourse`, `AcademicStatistic`, `Curriculum`, `DegreeProgress`, `CurriculumCourse`
- **Module 3**: `StudySession`, `StudySessionCourse`, `StudyTask`, `LearningGoal`, `LearningStatistic`
- **Module 4**: `EmotionLog`, `MentalAssessment`, `PsychologicalSurvey`, `MentalHealthStatistic`
- **Module 5**: `ChatSession`, `ChatMessage`
- **Module 6**: `AIAgent`, `AgentExecution`, `AIAnalysisReport`, `AIModelLog`
- **Module 7**: `UploadedFile`, `FileExtraction`
- **Module 8**: `Recommendation`, `Notification`

Tổng cộng đã ánh xạ thành công 32 bảng vào SQLAlchemy Base.metadata.

## 3. Các relationship đặc biệt
- **Self-referencing Relationship (N-N)**: Môn học tiên quyết (`CoursePrerequisite`). Model này trỏ 2 khóa ngoại về cùng bảng `Course` (`course_id` và `prerequisite_course_id`). Trên model `Course` đã cấu hình `foreign_keys` rõ ràng để SQLAlchemy không bị nhầm lẫn.
- **Many-to-Many qua Association Table**: Phiên học và môn học (`StudySessionCourse`). Model này đại diện cho quan hệ N-N giữa `StudySession` và `Course`, kèm thêm thuộc tính `time_spent_minutes` theo đúng thiết kế, thay vì dùng thuộc tính `secondary` của SQLAlchemy.
- **One-to-One**: `User` với `StudentProfile`, `User` với `UserPreference`. Đã được implement với thuộc tính `uselist=False` trên relationship để đảm bảo logic 1-1.

## 4. Các điểm cần chú ý khi chạy Alembic
- Toàn bộ các model đã được export từ các module về file `app/models/__init__.py`. Khi setup Alembic ở file `env.py`, chỉ cần import `Base` từ `app.models` (ví dụ: `from app.models import Base`) để `target_metadata = Base.metadata` có thể quét được trọn vẹn 32 bảng.
- Alembic hỗ trợ type ENUM của PostgreSQL, nhưng đôi khi có thể xảy ra lỗi khi tự động tạo/update schema ENUM trong các lần migration tiếp theo nếu giá trị Enum bị thay đổi. Cần review kỹ file migration mà Alembic auto-generate ra để đảm bảo file migration tạo type ENUM chính xác.
- Kiểu dữ liệu `JSONB` từ `sqlalchemy.dialects.postgresql` được sử dụng rất nhiều (nhất là ở Module 6 và 7). Đảm bảo database driver được cấu hình kết nối tới PostgreSQL 9.4+ (có hỗ trợ JSONB).

## 5. Các điểm trong database design chưa đủ rõ (TODOs)
- Bảng `degree_progress`: Tài liệu có nhắc "xem xét bỏ, thay thế bằng curriculum_courses vì có thể query được nên ko cần lưu nhưng hơi phức tạp và với dữ liệu lớn thì query nặng". Do vậy, agent quyết định vẫn giữ lại và implement model `DegreeProgress` để tối ưu performance cho các truy vấn dashboard.
- Kiểu của một số ENUM chưa định nghĩa giá trị cụ thể trong tài liệu (ví dụ: `course_type` của bảng `courses`, `study_method` của bảng `study_sessions`, `goal_type` của bảng `learning_goals`). Agent đã dùng các giá trị dự đoán (ví dụ: COMPULSORY/ELECTIVE cho course_type, POMODORO/DEEP_WORK/NORMAL cho study_method) dựa theo tên ENUM. Cần điều chỉnh nếu sai lệch với business logic.
- Một số field ENUM ở document thiếu danh sách. (ví dụ: `PeriodType` trong `LearningStatistic` được đoán là `WEEKLY`, `MONTHLY`).

## 6. Những chỗ Agent phải lựa chọn cách implement
- Do project có rất nhiều table liên kết vòng hoặc reference qua lại giữa các module (ví dụ Module 1 liên kết Module 3, Module 5 liên kết Module 6, ...), thay vì import trực tiếp object, agent đã sử dụng **String-based relationship** (ví dụ `relationship("Course")`) để giải quyết hoàn toàn rủi ro Circular Import. Điều này giúp source code an toàn và dễ maintain hơn.
- Tại model `ChatMessage`, field tên là `metadata` trong database đã được map với biến `metadata_data` ở Python bằng cách cấu hình tên cột `mapped_column("metadata", JSONB, ...)`. Điều này là bắt buộc vì `metadata` là một reserved attribute của class SQLAlchemy `Base` (`Base.metadata`), nếu để trùng sẽ gây lỗi cực kỳ nghiêm trọng.
- File model `User` bị lỗi cú pháp nhỏ ở file gốc (`default=uuid.uuid64` và import sai `Datetime` thành `DateTime`). Agent đã fix lỗi syntax này.

## 7. Các thay đổi hoặc deviation
- **No intentional deviation from detailed database design.** Toàn bộ PK, FK, type, column name được map 1-1 chính xác với document.

## Potential Improvements
- Hiện tại các model Enum đang sử dụng `sqlalchemy.Enum`. Đối với PostgreSQL, có thể cân nhắc sử dụng type `postgresql.ENUM(create_type=False)` nếu như ENUM type đã được apply tay trước để dễ quản lý state migration của Enum.
- Các String length hiện được fix cứng ở 255/100/50. Khi có validation ở tầng API (Pydantic), hãy đảm bảo chiều dài của Pydantic schema khớp với constraint của Database để tránh lỗi `DataError`.
