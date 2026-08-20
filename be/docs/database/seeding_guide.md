# Hướng dẫn sử dụng Seed Data (FocusBuddy Backend)

Tài liệu này hướng dẫn cách khởi tạo dữ liệu mẫu (fake data) cho dự án FocusBuddy. Việc sử dụng dữ liệu mẫu giúp toàn bộ team Frontend và Backend dễ dàng kiểm thử API, UI/UX mà không cần phải nhập dữ liệu thủ công.

## Cấu trúc thư mục Seed

Toàn bộ logic tạo dữ liệu mẫu nằm trong thư mục `app/seed/`:

```
app/seed/
├── seed.py                                     # Script chính để chạy toàn bộ quá trình seed
├── reset.py                                    # Logic xóa dữ liệu cũ một cách an toàn (tránh lỗi khóa ngoại)
├── utils.py                                    # Các tiện ích dùng chung (Faker, Logger, hàm băm mật khẩu giả lập)
├── verify.py                                   # Script đếm số lượng record trong database sau khi seed
├── module_1_user_management.py                 # Seed dữ liệu cho Module 1 (Users, StudentProfiles, Preferences)
├── module_2_academic_management.py             # Seed dữ liệu cho Module 2 (Universities, Majors, Courses, Curriculums, v.v.)
├── module_3_learning_activity.py               # Seed dữ liệu cho Module 3 (Study Sessions, Tasks, Learning Goals)
├── module_4_mental_health.py                   # Seed dữ liệu cho Module 4 (Surveys, Assessments, Emotion Logs)
├── module_5_ai_chatbot.py                      # Seed dữ liệu cho Module 5 (Chat Sessions, Messages)
├── module_6_ai_analysis.py                     # Seed dữ liệu cho Module 6 (Logs, Reports)
├── module_7_file_processing.py                 # Seed dữ liệu cho Module 7 (Uploaded Files, Extractions)
├── module_8_recommendation_notification.py     # Seed dữ liệu cho Module 8 (Recommendations, Notifications)
└── seed_agent_v2.py                            # Idempotent seed cho AgentConfig và IntentConfig (Cấu trúc Agent V2)
```

**Lưu ý:** Tuyệt đối KHÔNG xóa các file trong thư mục `app/seed/`. Hãy giữ lại toàn bộ thư mục này trong repository để tất cả các thành viên trong team đều có thể chạy lại seed khi cần thiết.

## Các thư viện bắt buộc

Để chạy được seed data, môi trường (virtual environment) của bạn cần được cài đặt các thư viện sau:

```bash
pip install Faker
```

Ngoài ra hệ thống cũng sử dụng `passlib` và `bcrypt` (tuy nhiên hiện tại đã được cấu hình dùng hàm băm giả lập để tránh lỗi tương thích trên Windows).

## Cách chạy lệnh Seed Data

Để khởi tạo hoặc làm mới toàn bộ database với mock data, mở Terminal tại thư mục `be/` và chạy lệnh sau:

```bash
python -m app.seed.seed --reset
```

### Ý nghĩa của cờ `--reset`:
- Nếu có cờ `--reset`: Hệ thống sẽ tự động gọi hàm xóa toàn bộ dữ liệu trong các bảng (theo thứ tự ngược lại của các khóa ngoại để không bị lỗi Constraint) trước khi seed dữ liệu mới. Quá trình này **không** làm hỏng cấu trúc bảng, nó chỉ chạy lệnh `DELETE FROM ...`.
- Nếu bỏ cờ `--reset`: Hệ thống sẽ chỉ insert thêm data mới vào database. Tuy nhiên, khuyến nghị luôn dùng `--reset` để tránh các lỗi trùng lặp khóa chính (Unique Constraints).

### Quá trình thực thi:
Lệnh trên sẽ in ra log chi tiết quá trình tạo dữ liệu từng module theo thứ tự từ 1 đến 8 (vì Module sau cần dữ liệu của Module trước).

## Kiểm tra dữ liệu sau khi Seed

Để đảm bảo toàn bộ 32 bảng đã được bơm dữ liệu thành công, bạn có thể sử dụng script kiểm tra bằng lệnh:

```bash
python -m app.seed.verify
```

Kết quả in ra sẽ là số lượng records của toàn bộ các bảng trong database. Ví dụ:

```text
========================================
       DATABASE ROW COUNTS        
========================================
users                          | 15
universities                   | 3
majors                         | 9
...
notifications                  | 120
========================================
```

## Các câu hỏi thường gặp (FAQ)

**1. Code tạo file `inspect_models.py` và `get_dependencies.py` có thể xóa không?**
- **Có thể xóa**. Đây là các script tạm thời được sử dụng trong quá trình phân tích cấu trúc models để thiết kế kịch bản seed. Chúng không cần thiết cho quá trình chạy seed sau này. (Các file này đã được xóa khỏi hệ thống).

**2. Password mặc định của các User giả lập là gì?**
- Tất cả các user tạo ra (student1@example.com, student2@example.com, ...) đều sử dụng password mặc định là **`password123`**. Bạn có thể dùng email của bất kỳ user nào trong database để test API Đăng nhập.

**3. Tại sao không dùng `Base.metadata.drop_all()`?**
- Seed data trong dự án thực tế luôn giữ lại Schema được quản lý bởi `Alembic`. Lệnh `seed` chỉ thao tác trên dữ liệu (Data) chứ không thao tác trên cấu trúc bảng (Schema).

**4. Khi nào tôi cần chạy lại lệnh Seed?**
- Bất cứ khi nào bạn thấy database đang quá lộn xộn, có dữ liệu rác sau khi test các API Create/Update/Delete. Việc chạy `python -m app.seed.seed --reset` sẽ làm sạch và trả lại bạn một database mới toanh, đầy đủ dữ liệu mẫu và chuẩn chỉnh.
