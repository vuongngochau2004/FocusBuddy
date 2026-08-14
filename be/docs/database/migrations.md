# Hướng dẫn Migration Cơ sở dữ liệu (Database Migrations)

FocusBuddy sử dụng [Alembic](https://alembic.sqlalchemy.org/) kết hợp với SQLAlchemy để quản lý phiên bản (version control) của database schema.

**Nguyên tắc quan trọng:**
Alembic migration **không** phải là nơi để thiết kế Models. Các class SQLAlchemy Model trong thư mục `app/models/` mới là nguồn dữ liệu gốc (Single Source of Truth) cho thiết kế ORM. Alembic chỉ đóng vai trò phát hiện sự thay đổi giữa models và database schema hiện tại, từ đó sinh ra script SQL để đồng bộ.

## Các lệnh thường dùng

### 1. Kiểm tra trạng thái migration hiện tại
Để xem database của bạn đang ở phiên bản nào:
```bash
alembic current
```

### 2. Xem lịch sử migration
Để xem dòng thời gian (timeline) của toàn bộ migrations:
```bash
alembic history
```

### 3. Tạo migration mới
Bất cứ khi nào bạn thay đổi, thêm mới hoặc xóa một SQLAlchemy Model, bạn bắt buộc phải tạo script migration:
```bash
alembic revision --autogenerate -m "Mô tả thay đổi"
```
*Lưu ý: Luôn luôn kiểm tra script được sinh ra tự động trong thư mục `alembic/versions/` trước khi áp dụng. Không chạy lệnh `upgrade head` một cách mù quáng nếu script tự sinh vô tình drop hoặc alter những bảng quan trọng.*

### 4. Áp dụng migrations
Để nâng cấp database lên phiên bản mới nhất:
```bash
alembic upgrade head
```

### 5. Rollback một migration
Nếu bạn cần hoàn tác lại migration vừa chạy:
```bash
alembic downgrade -1
```

## Ghi chú Migration cho Module 3 (Learning), 4 (Mental) và 5 (File)
Trong quá trình triển khai các Module Hoạt động Học tập, Quản lý Tâm lý và Quản lý File, chúng tôi đã xác minh rằng toàn bộ model (`LearningGoal`, `EmotionLog`, `UploadedFile`, v.v.) đều đã được định nghĩa và bao gồm trong bản schema ban đầu (`e324c12bc635_initial_database_schema.py`). Vì vậy, khi chạy lệnh `--autogenerate` cho các module này, script được tạo ra đều trống rỗng và đã được loại bỏ an toàn. Không cần bất kỳ bản cập nhật (revision) database nào mới.

*Lưu ý: Các bạn nhớ check xem port của db đang là 5433 hay 5432 nha*
