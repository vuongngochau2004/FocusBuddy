# KIẾN TRÚC HỆ THỐNG AGENT V2 (SOURCE OF TRUTH)

Tài liệu này xác định kiến trúc chuẩn mực cho FocusBuddy Agent System V2. Mọi quá trình implement code (Task 2 trở đi) bắt buộc phải tuân theo tài liệu này.

## 1. Nguyên Tắc Thiết Kế (Design Principles)

1. **Separation of Data and Code:** Tuyệt đối không hardcode System Prompt, Few-Shot Examples, Tool Permissions hay Context Strategy vào mã nguồn Python. Toàn bộ cấu hình này phải được lưu trong Database (bảng `agent_configs`) và truyền vào dưới dạng data.
2. **Composition over Inheritance:** Agent không phải là một chuỗi các Class thừa kế lẫn nhau (vd: `PsychologyAgent` kế thừa `BaseAgent`). Agent là sự kết hợp (Composition) của: `Configuration + Runtime + Context + Model + Tools`. Do đó, chỉ có một `AgentRuntime` duy nhất đóng vai trò động cơ thực thi.
3. **Model Agnostic:** Hệ thống không phụ thuộc cứng vào bất kỳ mô hình ngôn ngữ (Qwen, Gemma) hay nhà cung cấp nào. Mọi lời gọi tới LLM phải đi qua một `Model Provider Abstraction` (ví dụ: `LLMProvider` -> `OllamaProvider`).
4. **Tool Agnostic:** Runtime không chứa logic code giải toán hay truy vấn Lịch. Nó chỉ biết giao tiếp với `ToolRegistry` và `ToolExecutor`.
5. **Dynamic Agent:** Có thể "đẻ" ra hàng chục loại Agent mới (vd: Chuyên gia Khởi nghiệp, Gia sư Tiếng Anh) chỉ bằng cách cấu hình trên Database (thêm dòng mới vào `agent_configs`) mà không cần đụng 1 dòng code Python nào.
6. **Security (LLM decides WHAT, Code decides HOW):** LLM chỉ được phép trả về một chuỗi JSON yêu cầu "Hãy gọi cho tôi hàm A với tham số B". Backend Code mới là người thực sự cầm quyền thực thi thao tác đó vào Database.

---

## 2. Dòng Chảy Hệ Thống (Data Flow)

```
                USER
                  │
                  ▼
            SUPERVISOR (Intent Router)
                  │
           Intent (e.g. "academic")
                  │
                  ▼
            AGENT REGISTRY
                  │ (Lookup Config from DB)
                  ▼
            AGENT RUNTIME
                  │
   ┌──────────────┼──────────────┐
   ▼              ▼              ▼
 CONFIG         CONTEXT         MODEL
   │              │              │
   └──────────────┼──────────────┘
                  │
                  ▼
             TOOL REGISTRY
                  │
                  ▼
             TOOL EXECUTOR
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
   Database    Calculator   Calendar
                  │
                  ▼
                 LLM (Ollama)
                  │
                  ▼
            STREAMING RESPONSE
```

---

## 3. Trách Nhiệm Các Module Cốt Lõi (Responsibilities)

- **Supervisor / Intent Router:** Sử dụng Embedding (vd: `paraphrase-multilingual-MiniLM-L12-v2`) và Cosine Similarity để nhanh chóng phân loại Intent người dùng (0 latency LLM).
- **Agent Registry:** Module đóng vai trò Factory. Nhận vào `agent_type` (từ Router), gọi Database lấy cấu hình (Prompt, allowed_tools), validate và khởi tạo `AgentRuntime`. Không chứa logic `if/else` thủ công.
- **Agent Runtime:** Trái tim của hệ thống. Nhận lệnh từ Registry, nó lấy Context (từ `ContextBuilder`), đóng gói Prompt, gọi `Model Provider`, đón vòng lặp `Tool Calling` (nếu LLM yêu cầu), gọi `Tool Executor`, nạp lại kết quả và Streaming text cuối cùng về cho User.
- **Context Builder:** Có khả năng tùy chỉnh động. Nó thu thập lịch sử chat (giới hạn bằng `max_history_messages`), thông tin điểm số, trạng thái học tập từ DB và nén chúng lại.
- **Model Provider Abstraction:** Interface bọc lại cách gọi API. Có các hàm chuẩn như `chat_stream()`, `tool_call()`.
