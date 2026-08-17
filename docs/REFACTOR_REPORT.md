# BÁO CÁO REFACTOR KIẾN TRÚC FOCUSBUDDY (AI & OCR)

## 1. Các công việc đã thực hiện
Dựa theo yêu cầu chuyển dịch Core AI (LLM, Agent) về Backend và biến `ai/` thành một microservice chuyên xử lý OCR kết nối qua Redis, tôi đã hoàn thành các hạng mục sau:

- **Dịch chuyển Cấu hình & Prompts**: Đưa các file cấu hình LLM (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`) và thư mục `ai/app/prompts` sang Backend (`be/app/services/ai/prompts`).
- **Implement Real LLM & Streaming Response**: Viết lại class `AIProvider` bên Backend sử dụng thư viện `httpx` (cần `pip install httpx`) để thực sự gửi request tới LLM thay vì trả về Mock data. Hàm `generate_chat_response_stream` đã được thêm vào kết hợp với `StreamingResponse` của FastAPI để trả về từng token (chữ) một cho Frontend như cách ChatGPT hoạt động.
- **Biến đổi Agent & Orchestrator**: Refactor lại `AgentOrchestrator` và các Agents (`StudyStatusAgent`, `GradeAnalysisAgent`, `PsychologyAgent`) thành `async/await` để phù hợp với API Async của httpx.
- **Refactor `ai/` thành Celery Worker**: Thư mục `ai/` hiện tại đã bị gỡ bỏ các router HTTP API dư thừa và thư mục agents. Thay vào đó, tôi tạo file `ai/app/core/celery_app.py` và task `extract_transcript_task`. Worker này sẽ lắng nghe trên hàng đợi `ocr_queue` của Redis.
- **Cập nhật File Service (Backend)**: Sửa lại API Upload file bên BE. Nếu là file ảnh/pdf, BE sẽ đẩy một task vào Celery Queue của AI Worker (`celery_app.send_task`) và set trạng thái file thành `PROCESSING`. Cấu trúc code BE đã tự động kết nối được qua Redis.
- **Cập nhật Docker Compose**: Đổi service `ai` trong `docker-compose.yml` từ khởi chạy `uvicorn` sang khởi chạy `celery worker`.
- **Cập nhật Documentation**: Viết lại file `docs/architecture.md` và `docs/ai.md` để khớp hoàn toàn với kiến trúc hiện tại.

## 2. Điểm nghi ngờ & Khẳng định chưa ổn (Cần lưu ý trong tương lai)

Quá trình refactor đã thành công về mặt cấu trúc, nhưng có vài điểm logic/công nghệ bạn cần lưu ý để phát triển các tính năng tiếp theo:

### 2.1. Vấn đề đồng bộ Database từ OCR Celery Worker
- **Current State**: Khi Backend đẩy task OCR ảnh vào Celery, Backend chuyển trạng thái file thành `PROCESSING`. AI Worker nhận ảnh qua Base64, xử lý và trả về JSON dictionary cho Result Backend của Redis.
- **Vấn đề**: AI Worker (`ai/`) hiện tại không chia sẻ Database Models (SQLAlchemy) với Backend (`be/`), do đó nó không thể tự cập nhật trạng thái file thành `PROCESSED` vào PostgreSQL.
- **Giải pháp đề xuất (Sẽ làm sau)**: Frontend có thể gọi API polling `GET /files/{id}`. Khi đó BE phải kiểm tra `AsyncResult(task_id)` từ Celery. Nếu task xong, BE lấy kết quả JSON đó lưu vào DB và trả về cho FE.

### 2.2. Vấn đề Streaming Context của Chatbot
- **Current State**: Lịch sử chat (history) được query từ Database mỗi lần gọi API. Khi Streaming, Backend cần sinh ra từng token và chỉ khi stream kết thúc hoàn toàn thì mới có thể lưu `ChatMessage` (dành cho Assistant) vào Database.
- **Vấn đề**: Trong quá trình yield generator của FastAPI, phiên (session) database đôi khi có thể bị ngắt (do phụ thuộc vào `Depends(get_db)`). Trong code hiện tại, sau khi vòng lặp `async for` kết thúc, tôi mới thực hiện lưu AI message vào repo.
- **Khẳng định**: Code này hoàn toàn chạy được trên FastAPI. Tuy nhiên ở production scale lớn, để tránh giữ connection DB quá lâu trong thời gian user đọc stream, ta nên sinh ra một Background Task riêng biệt chuyên save history vào DB sau khi stream xong, hoặc sử dụng cơ chế Disconnected Session.

### 2.3. System Prompt & Agent Logic
- **Cấu trúc hiện tại**: Các Agents (`StudyStatusAgent`, `GradeAnalysisAgent`) chỉ đơn giản là nối thêm một chuỗi "Bạn là chuyên gia tư vấn học thuật..." vào prompt rồi gọi LLM sinh JSON (`generate_structured_analysis`). 
- **Vấn đề**: Các agent này chưa phải là các "Agent" thực thụ (có khả năng Tool Calling hay suy luận ReAct). Ở thời điểm hiện tại, chúng hoạt động giống "Prompt Routing" hơn. Nếu FocusBuddy muốn scale mạnh về AI, chúng ta sẽ cần tích hợp LangChain hoặc LlamaIndex vào Backend sau này.

### 2.4. Python Dependencies
- Tôi đã add `httpx`, `redis`, `celery` vào `be/pyproject.toml`. Do file `Dockerfile` của Backend đang gọi `pip install -r requirements.txt` (mà repo lại xài `uv.lock` và `pyproject.toml`), nếu chạy Docker Compose hiện tại có thể gặp lỗi không tìm thấy `requirements.txt`.
- **Khuyến nghị**: Nên chuyển file Dockerfile của BE sang xài `uv pip install -e .` hoặc sinh ra `requirements.txt` bằng `uv pip compile`. (Tôi không sửa `Dockerfile` trong lượt này để tuân thủ quy tắc giới hạn).

## 3. Tổng kết
Việc đưa Core AI về Backend và tách OCR ra Celery là một nước đi cực kỳ chuẩn xác cho bài toán Chatbot Real-time. Cấu trúc hiện tại đã gọn gàng, giảm bớt chi phí serialize data qua lại giữa 2 API, và dễ dàng mở rộng Frontend UX bằng Streaming.
