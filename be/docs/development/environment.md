# Cấu hình Biến môi trường (Environment Variables)

Hệ thống FocusBuddy sử dụng file `.env` nằm ở thư mục root của backend (`/be/.env`).

Dưới đây là danh sách các cấu hình bắt buộc và tùy chọn.

## Core Settings
| Tên Biến | Bắt buộc | Mô tả | Ví dụ |
|---|---|---|---|
| `DATABASE_URL` | Có | Chuỗi kết nối đến PostgreSQL. | `postgresql://user:password@localhost:5432/focusbuddy` |

## AI Configuration (Tùy chọn)
Nếu không cung cấp cấu hình AI, hệ thống sẽ sử dụng **Mock Provider** để trả về kết quả giả lập mà không gây lỗi ứng dụng.

| Tên Biến | Bắt buộc | Mô tả | Ví dụ |
|---|---|---|---|
| `AI_PROVIDER` | Không | Provider AI muốn sử dụng (ví dụ: `OPENAI`, `GEMINI`). | `OPENAI` |
| `AI_MODEL` | Không | Tên Model cụ thể. | `gpt-4o-mini` |
| `AI_API_KEY` | Không | Khóa API để gọi LLM. | `sk-xxxx` |
