# ARCHITECTURE COMPLIANCE AUDIT V2

**Trạng thái:** DRAFT / AUDIT COMPLETE
**Mục tiêu:** Đánh giá độ tuân thủ kiến trúc V2 của hệ thống Agent trong FocusBuddy.

## 1. Executive Summary
Sau khi kiểm tra sâu vào mã nguồn (Static Trace & Code Review), kết luận đưa ra là implementation hiện tại **CHỈ ĐẠT MỘT PHẦN (PARTIALLY COMPLIANT)** so với thiết kế V2. 
Mặc dù các file mang tên V2 (`registry.py`, `runtime.py`, `supervisor.py`) đã được tạo và chứa logic tốt, nhưng hệ thống vẫn dính chặt với các code cũ (V1). Nếu chạy thực tế, **hệ thống sẽ crash ngay lập tức** do lỗi bất đồng bộ interface (TypeError, AttributeError).

## 2. Current Architecture vs 3. Target Architecture
- **Mục tiêu (Target):** Kiến trúc tách biệt hoàn toàn LLM quyết định (WHAT) và Backend thực thi (HOW) thông qua Tool Loop. Agent không dùng kế thừa (Subclass). Model có thể swap nóng qua config.
- **Hiện tại (Current):** Code cũ (`agents.py` chứa Subclass) vẫn tồn tại. Vòng lặp Tool Loop trong `AgentRuntime` chỉ là "lời hứa" (comments). Tính năng Model Swap thất bại do `AIProvider` chặn tham số.

## 4. Compliance Matrix

| ID | Component | Requirement | Evidence | Status | Severity |
|----|-----------|-------------|----------|--------|----------|
| 1 | Dynamic Agent | Không dùng Subclass | File `agents.py` vẫn còn `StudyStatusAgent`, `PsychologyAgent` với prompt fix cứng. | FAIL | CRITICAL |
| 2 | Agent Registry | Load Config từ DB | `registry.py:17` `AgentRegistry.get_config()` gọi repo lấy config thành công. | PASS | LOW |
| 3 | Model Abstraction | Swap Model Runtime | `provider.py:61` Hàm `generate_chat_response_stream` không nhận tham số `model`, gây lỗi TypeError khi Runtime gọi. Hardcode `gpt-3.5-turbo`. | FAIL | CRITICAL |
| 4 | Context System | Dynamic Context Policy | `context_builder.py` vẫn dùng hàm cứng `build_academic_context`. Hàm `build_context(strategy=...)` bị thiếu, gây AttributeError. | FAIL | CRITICAL |
| 5 | Prompt System | PromptBuilder Class | KHÔNG tồn tại `prompt_builder.py`. `AgentRuntime` tự nối chuỗi (Vi phạm Separation of Concerns). `SYSTEM_PROMPT` vẫn fix cứng ở `prompts/system.py`. | FAIL | HIGH |
| 6 | Tool System | Tool Calling Loop | `runtime.py:64` Không hề gọi `ToolExecutor`. Chỉ có comment "// This is a conceptual implementation". | FAIL | CRITICAL |
| 7 | Supervisor | Routing by Embeddings | `supervisor.py:46` Tính Cosine Similarity chuẩn xác. | PASS | LOW |

## 5. Critical Findings
1. **CRASH ở ContextBuilder:** `AgentRuntime` (line 34) gọi `context_builder.build_context(strategy=self.config.context_strategy)` nhưng class này không hề có phương thức đó.
2. **CRASH ở Model Swap:** `AgentRuntime` (line 76) truyền `model=self.config.model_name` vào `provider.generate_chat_response_stream`, nhưng hàm này trong `AIProvider` không chấp nhận kwargs `model`.
3. **Missing Tool Loop:** LLM không có cửa nào để thực thi Tool vì `AgentRuntime` chỉ đùn thẳng Stream về User.

## 6. High Severity Findings
- **Tàn dư V1 (Ghost Code):** Các file `agents.py`, `orchestrator.py` vẫn nằm chình ình trong `services/ai/`.
- **Hardcode Prompt:** `app/services/ai/prompts/system.py` vẫn lưu System Prompt cứng, đi ngược lại triết lý "Prompt in DB".

## 7. Medium/Low Findings
- **Thiếu Seed Mechanism:** Không có `seed.py` nào cho AgentConfigs, do DB đang sập nên chưa thể test flow Registry chặn fallback.

## 8. Hardcode Scan
- **VIOLATION:** `gpt-3.5-turbo` hardcode 4 lần (trong `provider.py` và `seed/module_6_ai_analysis.py`).
- **VIOLATION:** `"Bạn là chuyên gia..."` hardcode trong `agents.py`.
- **VIOLATION:** `SYSTEM_PROMPT` trong `prompts/system.py`.

## 9. Dependency Analysis
`AgentRuntime` phụ thuộc trực tiếp vào `AIContextBuilder` cũ thay vì một Interface mới. Code cũ và code mới bị trộn lẫn (Circular logic rải rác).

## 10. Tool Calling Analysis
- Component `ToolRegistry` và `ToolExecutor` được thiết kế rất tốt. (PASS)
- Nhưng **Tool Loop trong Runtime KHÔNG TỒN TẠI**. (FAIL)

## 11. Dynamic Agent Analysis
Registry đã làm tốt việc trả về Config. Nhưng vì tàn dư Subclass (`agents.py`) vẫn còn và ContextBuilder bị gãy, tính năng Dynamic Agent chưa thể chạy.

## 12. Model Provider Analysis
Abstaction của `AIProvider` quá kém, bị trói chặt vào OpenAI / gpt-3.5 và không cho phép Runtime chèn tên Model (Ollama/Qwen/Gemma) tùy ý.

## 13. Database Analysis
Schema thiết kế ở Task 4 (AgentConfig, IntentConfig) hoàn toàn chuẩn chỉ và đáp ứng đúng kiến trúc V2. (PASS)

## 14. Security Analysis
`ToolExecutor` có check `allowed_tools` (PASS), nhưng chưa có bước "Destructive Action Confirmation" (PARTIAL). LLM không tự lấy `user_id` (PASS).

## 15. Documentation Drift
Tài liệu V2 nói rằng "Không có kế thừa" và "Có PromptBuilder", nhưng code thực tế thì Kế thừa vẫn còn đó và PromptBuilder lặn mất tăm. Tỉ lệ Drift: Rất Cao.

## 16. Testability
Việc `ChatService` khởi tạo cứng `Supervisor()` ở `__init__` khiến Unit Test rất khó Mock. Nên dùng Dependency Injection (Depends) của FastAPI.

## 17. Architecture Score
1. Dynamic Agent ........ 10/15 (Tàn dư V1)
2. Agent Runtime ........ 5/10 (Crash lỗi)
3. Agent Registry ....... 10/10
4. Context System ....... 3/10 (Hardcode logic)
5. Prompt System ........ 2/10 (Missing builder)
6. Model Abstraction .... 3/10 (Crash kwargs)
7. Supervisor/Router .... 10/10
8. Tool System .......... 6/10 (No loop)
9. Security ............. 3/5
10. Database Design ..... 5/5
11. Testability ......... 2/5

**TOTAL = 59/100**

## 18. Recommended Fixes & 19. Refactor Order
1. **Xóa Tàn Dư:** Xóa `agents.py`, `orchestrator.py`, `prompts/system.py`.
2. **Sửa Crash:** Refactor `AIProvider` để chấp nhận `model_name`. Viết lại `AIContextBuilder` để tuân thủ `context_strategy`.
3. **Thêm Mới:** Implement `PromptBuilder.py` thực sự.
4. **Hoàn thiện Tool Loop:** Sửa `AgentRuntime` để bắt event Tool Calls từ LLM, gọi `ToolExecutor` và nối kết quả vào vòng lặp.

## 20. Final Verdict
**C — PARTIALLY COMPLIANT**
Hệ thống đã xây dựng được "Bộ khung (Skeleton)" của V2 rất đẹp, nhưng việc thi công bị "ăn bớt" (missing PromptBuilder, missing Tool Loop) và ghép nối cẩu thả với code V1 gây ra Crash. Cần một đợt Refactor dọn rác và hoàn thiện Loop.
