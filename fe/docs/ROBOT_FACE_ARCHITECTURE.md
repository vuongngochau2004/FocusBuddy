# Kiến Trúc Khuôn Mặt Robot (Robot Face Architecture)

Tài liệu này mô tả kiến trúc nền tảng và đặc tả kỹ thuật cho hệ thống hiển thị biểu cảm khuôn mặt của robot trợ lý học tập **FocusBuddy**.

---

## 1. Mục Tiêu của Robot Face

Khuôn mặt robot đóng vai trò là giao diện trực quan cảm xúc (visual emotional interface) giữa FocusBuddy và người học. Robot Face giúp:
* Biểu đạt trực quan trạng thái của robot (sẵn sàng, vui vẻ khi hoàn thành nhiệm vụ, lo lắng khi mất tập trung, suy nghĩ khi xử lý thông tin).
* Tăng tính tương tác sinh động, tạo sự đồng cảm và nâng cao động lực học tập cho người dùng.
* Hoạt động mượt mà trên cả giao diện Web máy tính và màn hình nhúng (Raspberry Pi/màn hình nhỏ) với độ trễ thấp và tài nguyên tối thiểu.

---

## 2. Lý Do Chọn SVG (Scalable Vector Graphics)

Thay vì sử dụng Canvas 2D, Three.js (3D nặng nề), Lottie hay ảnh động GIF/Video, FocusBuddy chọn **SVG thuần kết hợp React**:

1. **Độ sắc nét tuyệt đối (Resolution Independence):** SVG là đồ họa vector, cho phép co giãn tự do theo kích thước màn hình bất kỳ (từ màn hình nhỏ trên mạch nhúng đến màn hình Retina độ phân giải cao) mà không bị vỡ hạt hay mờ nét.
2. **Hiệu năng & Tài nguyên nhẹ:** DOM SVG cực kỳ nhẹ, không yêu cầu GPU chuyên dụng như WebGL/Three.js, phù hợp cho các thiết bị phần cứng giới hạn như Raspberry Pi.
3. **Khả năng kiểm soát hình học (Declarative Parametric Control):** Từng điểm điều khiển (control point), độ mở mắt, độ cong miệng, góc xoay lông mày được tham số hóa thành các giá trị số học (`FaceParameters`), cho phép can thiệp và nội suy toán học chính xác mà không phụ thuộc vào chuỗi khung hình cố định.
4. **Khả năng animate linh hoạt ở các giai đoạn sau:** Từng bộ phận được phân nhóm trong các thẻ `<g>` độc lập, sẵn sàng để tích hợp hiệu ứng chuyển động mượt mà ở FACE-02.
5. **Tiêu chuẩn Accessibility & Thân thiện với React:** Dễ dàng khai báo thuộc tính `role="img"`, `aria-label` và quản lý trạng thái qua React Props tiêu chuẩn.

---

## 3. Cấu Trúc Thư Mục & File

Cấu trúc module được tổ chức chuẩn theo Feature-based architecture trong Next.js:

```text
fe/
├── src/
│   ├── features/
│   │   └── robot-face/
│   │       ├── components/
│   │       │   └── RobotFace.tsx         # SVG Renderer hiển thị khuôn mặt
│   │       ├── expression-presets.ts     # Dữ liệu preset biểu cảm & hàm nội suy lerp
│   │       ├── robot-face.types.ts       # TypeScript definitions (Types & Interfaces)
│   │       └── index.ts                  # Barrel export
│   └── app/
│       └── robot-face-lab/
│           └── page.tsx                  # Màn hình kiểm thử/preview biểu cảm độc lập
└── docs/
    └── ROBOT_FACE_ARCHITECTURE.md        # Tài liệu kiến trúc này
```

---

## 4. Trách Nhiệm Của Từng Thành Phần

### 4.1 `robot-face.types.ts`
* Định nghĩa tập hợp các biểu cảm được hỗ trợ qua type `RobotExpression` (`idle`, `happy`, `concerned`, `thinking`).
* Định nghĩa cấu trúc thông số hình học `FaceParameters` (độ mở mắt, độ cong mí, góc xoay/độ lệch lông mày, độ cong/độ mở miệng, độ hiển thị má hồng, cường độ glow).
* Định nghĩa props của component `RobotFaceProps` (`expression`, `intensity`, `size`, `className`).

### 4.2 `expression-presets.ts`
* Lưu trữ trạng thái cơ sở `idleFace` và bảng preset chuẩn `expressionPresets` cho từng biểu cảm dưới dạng dữ liệu tĩnh thuần túy (Data-driven).
* Cung cấp hàm toán học `lerp(start, end, t)` và hàm `interpolateFaceParameters(base, target, intensity)` để tính toán thông số tức thời giữa trạng thái Idle và biểu cảm mục tiêu dựa trên `intensity` (0..1).

### 4.3 `components/RobotFace.tsx`
* Nhận props `expression`, `intensity`, `size`, `className`.
* Thực hiện nội suy thông số hình học.
* Render toàn bộ cấu trúc SVG theo hệ tọa độ chuẩn `viewBox="0 0 400 240"`.
* Phân chia các lớp đồ họa rõ ràng theo thứ tự từ dưới lên trên:
  1. `screen-visor`: Nền kính tối màu bo góc (`rx="36"`).
  2. `ambient-glow`: Ánh sáng cyan tỏa nhẹ nền.
  3. `left-eyebrow`: Lông mày bên trái (hỗ trợ góc xoay và độ dịch Y).
  4. `right-eyebrow`: Lông mày bên phải (hỗ trợ góc xoay đối xứng và độ dịch Y).
  5. `left-eye`: Mắt trái dạng đường cong tham số SVG Path kèm đốm phản quang.
  6. `right-eye`: Mắt phải dạng đường cong tham số SVG Path kèm đốm phản quang.
  7. `mouth`: Khuôn miệng dạng đường cong bậc 2 (khi đóng) hoặc khoang mở (khi mở).
  8. `left-blush` & `right-blush`: Hai bên má hồng nhẹ nhàng.

### 4.4 `app/robot-face-lab/page.tsx`
* Màn hình phòng thí nghiệm Client Component (URL: `/robot-face-lab`).
* Phục vụ kiểm tra trực quan tất cả các biểu cảm, tinh chỉnh slider `intensity` từ `0.0` đến `1.0`, kiểm tra khả năng co giãn kích thước (responsive) mà không cần kết nối backend.

---

## 5. Danh Sách Biểu Cảm Hiện Tại (Checkpoint FACE-01)

| Biểu cảm (`RobotExpression`) | Đặc điểm hình học chính | Cảm xúc truyền tải |
| :--- | :--- | :--- |
| **`idle`** | Mắt mở tự nhiên (0.85), lông mày ngang (0°), miệng cong nhẹ (0.08), má hồng phớt (0.15). | Bình tĩnh, chú ý lắng nghe, sẵn sàng tiếp nhận thông tin. |
| **`happy`** | Mắt cong hình vòng cung (0.85), lông mày nhướng (12°), miệng cười mở tươi (0.9 / 0.45), má hồng rõ nét (0.85), glow rực rỡ. | Vui vẻ, tán thưởng, chúc mừng hoàn thành mục tiêu học tập. |
| **`concerned`** | Mắt cụp nhẹ (-0.35), lông mày dốc cụp vào trong (-18°), khóe miệng trĩu xuống (-0.65), má hồng tắt (0.05). | Lo lắng, nhắc nhở khi học sinh mất tập trung hoặc mệt mỏi. |
| **`thinking`** | Mắt nheo tập trung (0.7), lông mày bất đối xứng (trái +22°, phải -10°), miệng khép mím nhẹ (-0.2). | Đang suy nghĩ, đang truy vấn cơ sở tri thức hoặc phân tích dữ liệu. |

---

## 6. Giới Hạn Của Checkpoint FACE-01

* **Baseline hình học tĩnh:** Checkpoint này tập trung vào thiết lập hệ tọa độ vector chuẩn, cấu trúc layer và thuật toán nội suy tham số.
* **Chưa có chuyển động (Transition Animation):** Thay đổi giữa các expression và intensity diễn ra tức thời qua state re-render, chưa áp dụng chuyển động easing/spring mượt mà.
* **Chưa có vòng lặp chớp mắt tự động (Auto Blink):** Mắt giữ nguyên độ mở theo preset/intensity.
* **Chưa tích hợp WebSocket/Backend API:** Chưa kết nối với dịch vụ phân tích cảm xúc hay mô hình AI của FocusBuddy.
* **Chưa tích hợp phần cứng Raspberry Pi:** Chưa đóng gói dạng stand-alone kiosk view cho màn hình nhúng.

---

## 7. Hướng Phát Triển Tại FACE-02

1. **Hiệu ứng chuyển cảnh mượt mà (Morphing & Transition Animation):** Áp dụng Framer Motion hoặc requestAnimationFrame để làm mịn việc chuyển dịch giữa các thông số `FaceParameters` với spring physics tự nhiên.
2. **Cơ chế chớp mắt tự động (Auto-Blinking Loop):** Bộ đếm thời gian ngẫu nhiên (2-6 giây) kích hoạt nhịp chớp mắt tự nhiên (micro-interaction) mà không làm gián đoạn biểu cảm hiện tại.
3. **Cử động thở nhẹ (Idle Breathing Micro-motion):** Dao động nhẹ nhàng của mắt và khuôn mặt theo chu kỳ giúp robot trông luôn sống động ngay cả ở trạng thái Idle.
4. **Emotion State Machine & Event Dispatcher:** Xây dựng state machine quản lý hàng đợi biểu cảm (queue), độ ưu tiên (priority) và thời gian duy trì trước khi quay về trạng thái Idle.
