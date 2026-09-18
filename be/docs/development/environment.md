# Cấu hình Biến môi trường (Environment Variables)

Hệ thống FocusBuddy sử dụng file `.env` nằm ở thư mục root của backend (`/be/.env`).

Dưới đây là danh sách các cấu hình bắt buộc và tùy chọn.

## Core Settings
| Tên Biến | Bắt buộc | Mô tả | Ví dụ |
|---|---|---|---|
| `DATABASE_URL` | Có | Chuỗi kết nối đến PostgreSQL. | `postgresql://user:password@localhost:5432/focusbuddy` |

## AI Configuration (Agent V2)
Hệ thống AI Agent V2 hỗ trợ 2 loại Provider: Ollama (cho Local Qwen) và Remote API (cho Server Gemma).

| Tên Biến | Bắt buộc | Mô tả | Ví dụ |
|---|---|---|---|
| `OLLAMA_BASE_URL` | Không | Địa chỉ API của Ollama chạy local. | `http://localhost:11434` |
| `OLLAMA_MODEL_QWEN` | Không | Model Qwen chạy trên Ollama. | `qwen2.5:7b` |
| `LLM_BASE_URL` | Không | Địa chỉ Server Remote (OpenAI-compatible) cho Gemma. | `http://llm2.dutai.site/v1` |
| `LLM_MODEL` | Không | Model Gemma trên Server Remote. | `ggml-org/gemma-4-e4b-it-GGUF:Q4_0` |
| `LLM_API_KEY` | Không | API Key cho Server Remote (nếu có). | `dummy` |
| `LLM_TIMEOUT` | Không | Thời gian timeout khi gọi LLM (giây). | `60` |
| `LLM_TEMPERATURE` | Không | Độ sáng tạo của LLM (0.0 đến 1.0). | `0.7` |

## Message Queue & Background Workers
Dùng cho Scheduler / Reminder
| Tên Biến | Bắt buộc | Mô tả | Ví dụ |
|---|---|---|---|
| `REDIS_URL` | Không | Kết nối Redis (Celery Broker). | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | Không | Broker cho Celery. | `redis://redis:6379/0` |
| `CELERY_RESULT_BACKEND` | Không | Backend lưu kết quả Celery. | `redis://redis:6379/1` |
