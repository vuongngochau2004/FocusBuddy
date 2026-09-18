# THUẬT TOÁN INTENT ROUTER (MAIN SYSTEM)

Tài liệu này giải thích chi tiết về mặt toán học và cơ chế hoạt động của `IntentRouter` - hệ thống phân luồng người dùng siêu tốc độ mà không cần gọi API của các Large Language Model (LLM).

---

## 1. Thuật toán cốt lõi: Vector Embeddings & Cosine Similarity

Thay vì bắt máy tính phải "hiểu" ngữ nghĩa bằng quy tắc ngữ pháp phức tạp hoặc bằng Heuristic/Keyword Match (dễ sai sót), thuật toán này chuyển đổi ngôn ngữ con người thành **Không gian Toán học đa chiều**.https://docs.google.com/spreadsheets/d/1Qt1hapk9emsJdzYrRnJmDIl8tfy1vrefBWuziEiIWzM/edit?gid=0#gid=0

### A. Mô hình Embedding (Trọng số)
- **Model sử dụng:** `paraphrase-multilingual-MiniLM-L12-v2`
- **Cơ chế:** Đây là một mô hình NLP nhỏ (chỉ vài trăm MB) được huấn luyện sẵn bằng hàng tỷ cặp câu đa ngôn ngữ. Khi ta đưa vào 1 câu tiếng Việt, model này sẽ chạy qua 12 lớp Neural Network để chuyển câu đó thành một **Vector gồm 384 chiều (dimensions)**.
- **Ý nghĩa trọng số:** Trọng số (weights) của mô hình này tĩnh, đã được huấn luyện sẵn (Pre-trained) bởi cộng đồng HuggingFace, giúp nó có khả năng phân biệt từ đồng nghĩa cực tốt. Ví dụ, nó biết rằng cụm từ *"mình buồn quá"* và *"tâm trạng tồi tệ"* sẽ sinh ra 2 vector nằm rất sát nhau trong không gian 384 chiều.

### B. Khoảng cách Cosine (Cosine Similarity)
Để biết 2 câu có giống nhau về mặt ngữ nghĩa hay không, thuật toán sử dụng công thức tính góc Cosine giữa 2 vector:

$$ \text{Cosine Similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} $$

- Nếu 2 câu cùng chung ý nghĩa -> Góc giữa 2 vector gần bằng 0 -> Cosine Similarity gần bằng **1**.
- Nếu 2 câu chả liên quan gì -> Cosine Similarity tiến dần về **0**.
- Nếu 2 câu trái ngược hoàn toàn -> Cosine Similarity tiến về **-1**.

---

## 2. Quy trình xử lý tại Backend (`router.py`)

1. **Khởi tạo (Pre-computing - O(1)):** 
   Khi server Backend vừa chạy, `IntentRouter` (sử dụng Singleton Pattern) sẽ được gọi. Nó lấy toàn bộ câu mẫu trong từ điển `INTENT_SAMPLES` và mã hóa thành một ma trận vector lớn lưu sẵn vào RAM.
2. **Suy luận (Inference - O(N)):** 
   Khi nhận được 1 câu chat của User, hệ thống sẽ:
   - Dùng Model nhúng câu chat này thành 1 vector duy nhất.
   - Tính toán Cosine Similarity của vector này với *toàn bộ* ma trận vector mẫu trên RAM bằng phép nhân ma trận (cực kỳ nhanh).
   - Tìm ra câu mẫu nào có điểm (Score) cao nhất.
3. **Phân loại:** Câu mẫu cao nhất đó thuộc nhóm Intent nào (vd: `psychology`) thì Router sẽ trả về Intent đó.

---

## 3. Threshold (Ngưỡng an toàn) & Vấn đề thực tế

Mô hình hiện đang cài đặt một ngưỡng an toàn là: `threshold = 0.4`

**Nghĩa là gì?**
Nếu hệ thống tìm ra câu giống nhất, nhưng Cosine Similarity của nó vẫn **bé hơn 0.4**, hệ thống sẽ cho rằng user đang nói chuyện phiếm hoặc hỏi thứ không nằm trong chuyên môn của 3 Agent còn lại. Nó sẽ tự động kích hoạt chức năng **Fallback** (Phản hồi dự phòng), trả về giá trị `"general"`.

**Phân tích kết quả thực tế:**
Bạn có thể thấy trong kết quả Terminal ở bài kiểm tra, câu *"Lên lịch ôn thi cuối kỳ giúp mình"* lại bị Router nhận diện là `"general"`. 
- **Nguyên nhân:** Điểm số (Score) của câu này với các câu mẫu của mảng `schedule` đang thấp hơn `0.4`. Mô hình MiniLM-L12 hiểu chưa đủ sâu mối liên hệ giữa cụm từ "ôn thi cuối kỳ" và các mẫu hiện tại ("lên lịch học", "tạo to-do list").
- **Cách khắc phục nhanh:** Đưa thêm các từ khóa mới vào mảng `INTENT_SAMPLES` để nới rộng "không gian vector" cho nhóm đó.
  ```python
  "schedule": [
      "lên lịch học cho ngày mai",
      "tạo to-do list giúp mình",
      "lên lịch ôn thi cuối kỳ", # <-- Thêm vào đây
      "chuẩn bị lịch thi"
  ]
  ```

---

## 4. Cách tối ưu và tinh chỉnh Mô hình

Là người quản trị hệ thống Agent này, để tăng độ chính xác bạn không cần phải đụng vào code thuật toán, mà chỉ cần tinh chỉnh 2 thứ:

1. **Tinh chỉnh tập dữ liệu mẫu (`INTENT_SAMPLES`):**
   - Không cần đưa vào hàng ngàn câu. Chỉ cần khoảng 15 - 20 câu đại diện cho mỗi Intent là mô hình đã hoạt động vô cùng xuất sắc.
   - Hãy cố gắng thêm các cụm "từ lóng" mà sinh viên hay dùng vào tập mẫu.
2. **Tinh chỉnh Threshold:**
   - Nếu bạn thấy hệ thống hay phân loại sai (nhầm lẫn giữa Học thuật và Tâm lý), hãy **Tăng Threshold** lên (vd: `0.45`). Khi đó, model sẽ khắt khe hơn và đẩy nhiều tin nhắn lạ về `General` hơn.
   - Nếu bạn thấy hệ thống hay đẩy tin nhắn về `General` mặc dù User đang hỏi việc quan trọng (như lỗi "ôn thi" ở trên), hãy **Giảm Threshold** xuống (vd: `0.35`) hoặc thêm câu mẫu. Mức `0.4` hiện tại là mức độ cân bằng tốt cho mô hình đa ngôn ngữ nhỏ gọn này.
