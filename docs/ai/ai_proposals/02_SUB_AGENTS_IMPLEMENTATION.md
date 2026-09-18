# CHI TIẾT TRIỂN KHAI SUB-AGENTS (WORKERS)

Lớp Sub-agents là linh hồn của Chatbot, trực tiếp giao tiếp với người dùng bằng tiếng Việt. Mọi mô hình ở đây đều được tối ưu để trả về Streaming (SSE).

---

## 1. Đề xuất Mô hình LLM (Models)

Do server có cấu hình yếu nhưng lại cần văn phong tự nhiên, bắt buộc phải sử dụng các file định dạng lượng tử hóa **GGUF (Q4_0 hoặc Q5_K_M)**. Các file này nén trọng số model xuống 4-bit, giúp 1 model 7B-9B có thể chạy êm ru trên cấu hình 8GB RAM/VRAM.

### Lựa chọn 1: Qwen2.5-7B-Instruct (Ưu tiên Cao Nhất)
Dòng Qwen 2.5 mới ra mắt của Alibaba đang thống trị bảng xếp hạng các mô hình cỡ nhỏ. Khả năng tiếng Việt xuất sắc, ít ảo giác, và cực kỳ giỏi trong việc nhập vai (Roleplay).
- **Link tải:** [bartowski/Qwen2.5-7B-Instruct-GGUF](https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF) *(Tải file `Qwen2.5-7B-Instruct-Q4_K_M.gguf` nặng khoảng 4.3GB)*

### Lựa chọn 2: Gemma-2-9B-It
Mô hình của Google. Tiếng Việt khá tốt, nhưng điểm mạnh nhất là tư duy toán học và logic cực kỳ mạnh. Cực kỳ phù hợp cho **Academic Agent**.
- **Link tải:** [bartowski/gemma-2-9b-it-GGUF](https://huggingface.co/bartowski/gemma-2-9b-it-GGUF) *(Tải file `Q4_K_M.gguf` nặng khoảng 5.4GB)*

### Lựa chọn 3: Vistral-7B-Chat
Mô hình fine-tune bởi người Việt dựa trên Mistral. Hiểu sâu văn hóa Việt Nam và từ lóng của sinh viên. Phù hợp cho **Psychology Agent** hoặc **General Agent**.
- **Link tải:** [Viet-AI/Vistral-7B-Chat-gguf](https://huggingface.co/Viet-AI/Vistral-7B-Chat-gguf)

---

## 2. Các phương pháp cấu hình tránh lỗi (Workarounds) cho Model yếu

Dù dùng model 7B xuất sắc tới đâu, chúng vẫn là model nhỏ, dễ bị quên hoặc rối nếu input quá dài hoặc quá phức tạp. Hãy tuân thủ 2 nguyên tắc sau khi code trong Backend:

### Kỹ thuật 1: Few-Shot Prompting (Rất quan trọng)
Thay vì chỉ viết 1 System Prompt dài dòng mô tả vai trò, bạn **bắt buộc** phải chèn vào 1-2 đoạn hội thoại mẫu (Few-shot) để model "bắt chước" văn phong.

**Ví dụ System Prompt của Psychology Agent:**
```text
Bạn là chuyên gia tư vấn tâm lý học đường của FocusBuddy. Nhiệm vụ của bạn là lắng nghe, an ủi, và khích lệ sinh viên. Đừng phán xét, đừng đưa lời khuyên y tế.

Dưới đây là một số ví dụ về cách bạn nên phản hồi:
[Ví dụ 1]
Học sinh: Mình thi trượt mất rồi, chán nản quá...
Trợ lý: Ôm bạn một cái nhé! Mình biết cảm giác thất vọng này rất khó chịu. Cứ buồn một chút đi không sao đâu. Khi nào bạn sẵn sàng, chúng ta cùng xem lại bài thi để kỳ sau phục thù nhé?

[Ví dụ 2]
Học sinh: Bố mẹ cứ ép mình phải học IT trong khi mình thích kinh tế.
Trợ lý: Mình hiểu sự ngột ngạt của bạn lúc này. Đứng giữa kỳ vọng của gia đình và đam mê cá nhân thực sự là một bài toán khó...

---
Bây giờ hãy trả lời câu hỏi của học sinh. 
Ngữ cảnh học sinh hiện tại: (Chèn thông tin điểm số/tâm trạng nếu có)
```

### Kỹ thuật 2: Strict Context Window (Ép ngữ cảnh hẹp)
Mô hình nhỏ có context window hạn chế (dù Qwen hỗ trợ 128k nhưng càng dài nó càng ngu). 
- **Với Lịch sử chat (Chat History):** Code Backend chỉ được phép Query Database lấy **tối đa 4 tin nhắn gần nhất** (2 lượt trao đổi) để nối vào mảng `messages` đẩy cho LLM. Không đẩy nguyên 50 tin nhắn cũ vào.
- **Với Context Builder:** Nếu User vừa upload 1 bảng điểm, chỉ nén bảng điểm đó thành 1 câu tóm tắt (ví dụ: `Học sinh có điểm Toán: 4, Lý: 7, Hóa: 8`). Đừng truyền toàn bộ chuỗi JSON khổng lồ của OCR vào System prompt.

### Kỹ thuật 3: Roleplay Anchor (Cọc neo vai trò)
Model yếu đôi khi chat một lúc sẽ quên mất mình là ai. Để chống lại việc này, hãy luôn kẹp System Prompt ở cuối sát với tin nhắn mới nhất, hoặc thiết kế mảng `messages` theo chuẩn `[System, History_User, History_Assistant, System_Reminder, Current_User_Message]`. 
Tuy nhiên với thư viện OpenAI/httpx API chuẩn, chỉ cần đảm bảo tin nhắn System luôn nằm ở index 0, và luôn ngắn gọn.
