# ROUTING STRATEGY & CONFIDENCE

Làm sao để Supervisor chắc chắn đưa ra quyết định đúng đắn khi gán nhãn một Intent?

## 1. Threshold (Ngưỡng tự tin)
- **Công thức:** `Similarity Score = Cosine(User_Vector, Intent_Example_Vector)`
- Mỗi `IntentConfig` sẽ có một trường cấu hình `threshold` (Ví dụ: `0.45`).
- Nếu Score cao nhất tìm được vẫn nhỏ hơn `0.45` -> Router kích hoạt Fallback.

## 2. Fallback Strategy
Khi câu nói của User (ví dụ: *"Hôm nay trời đẹp quá, cậu ăn cơm chưa?"*) không khớp với cả Academic, Psychology hay Schedule, Router sẽ:
- Xác định là `Unknown Intent`.
- Route tự động về `GeneralAgent` (Người trò chuyện phiếm).

## 3. Future Extension: Multi-Intent
Trong tương lai, sinh viên có thể gộp nhiều yêu cầu vào một câu:
*"Mình vừa rớt môn Toán cao cấp, buồn quá, cậu giúp mình lên lịch học lại môn này nhé!"*
(Vừa cần Tâm lý an ủi, vừa cần Học thuật phân tích điểm, vừa cần Lên lịch).

- Router sẽ thay đổi từ việc lấy `argmax()` sang việc lấy `Top-K` các Intent vượt Threshold.
- Trả về Array `["psychology", "schedule"]`.
- `AgentRegistry` sẽ có cơ chế khởi tạo chuỗi Pipeline, chạy qua Tâm Lý trước, lấy kết quả truyền sang Schedule sau. (Đây là điểm mạnh bậc nhất của Agent Architecture V2).
