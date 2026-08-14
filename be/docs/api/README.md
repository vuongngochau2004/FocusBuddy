# FocusBuddy API Documentation

Chào mừng đến với tài liệu API của FocusBuddy. Hệ thống backend này tuân theo một kiến trúc phân tầng chuẩn mực (Router -> Schema -> Service -> Repository -> Model -> DB).

## Các Module (Modules)

1. [Quản lý Người dùng (User Management)](user-api.md)
   API dành cho việc quản lý người dùng, đăng ký, hồ sơ học sinh và các cài đặt ưu tiên.

2. [Quản lý Học thuật (Academic Management)](academic-api.md)
   API dành cho việc quản lý các dữ liệu tham chiếu nền tảng học vấn như Trường Đại học, Chuyên ngành, Chương trình đào tạo, Môn học và Học kỳ.

3. [Quản lý Hoạt động Học tập (Learning Activity Management)](learning-api.md)
   API hỗ trợ quản lý quá trình học tập của người dùng, bao gồm Phiên học, Nhiệm vụ và Mục tiêu học tập.

4. [Quản lý Tâm lý & Sức khỏe (Mental & Psychology Management)](mental-api.md)
   API để theo dõi sức khỏe tâm lý của người dùng, ghi lại lịch sử cảm xúc và thực hiện các bài đánh giá tâm lý.

5. [Quản lý và Xử lý File (File Management & Processing)](file-api.md)
   API hỗ trợ tải lên (upload), lưu trữ (storage) và trích xuất dữ liệu (extraction) từ các file văn bản và bảng tính.

## Kiến trúc & Database (Architecture & Database)

- [Kiến trúc Backend (Backend Architecture)](../architecture/backend-architecture.md)
- [Migration cơ sở dữ liệu (Database Migrations)](../database/migrations.md)
