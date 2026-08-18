# FocusBuddy AI Service

Đây là service độc lập chuyên xử lý các tác vụ AI cho hệ thống FocusBuddy, hiện tại cung cấp khả năng tích hợp linh hoạt với bất kỳ Provider nào hỗ trợ OpenAI API.

## 1. Yêu cầu hệ thống
- Python 3.11+
- Các thư viện nằm trong `requirements.txt`

## 2. Cài đặt và Chạy thử local
Nếu bạn muốn chạy service này trực tiếp trên máy thay vì thông qua Docker:

1. Di chuyển vào thư mục `ai`:
   ```bash
   cd ai
   ```
2. Tạo Virtual Environment và cài đặt các gói:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Hoặc `venv\Scripts\activate` trên Windows
   pip install -r requirements.txt
   ```
3. Tạo file `.env` từ `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Lưu ý thay đổi `LLM_BASE_URL` và `LLM_API_KEY` tương ứng với provider của bạn.*

4. Khởi chạy Server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
   ```

## 3. Testing API
Service cung cấp hai route cơ bản. Bạn có thể test thông qua Swagger UI tại: `http://localhost:8100/docs`.

### Health Check
```bash
curl http://localhost:8100/health
```
**Response**: `{"status": "ok"}`

### Chatbot Endpoint
```bash
curl -X POST "http://localhost:8100/api/v1/chat" \
     -H "Content-Type: application/json" \
     -d '{
           "message": "Tôi đang gặp khó khăn với cấu trúc dữ liệu.",
           "conversation": []
         }'
```
**Response**: Các chuẩn phản hồi dạng `LLMResponse`.
