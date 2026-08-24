# Kế Hoạch Triển Khai FACE-02: Animation Chuyển Cảnh Biểu Cảm Robot (Bản R1)

> **TRẠNG THÁI HIỆN TẠI:**  
> `STATUS: IMPLEMENTED — WAITING FOR VERIFICATION`

---

## 1. Executive Summary

Tài liệu này đặc tả kế hoạch kỹ thuật đã qua rà soát kiến trúc (Architecture Review) cho **Checkpoint FACE-02 (FACE-02B)** của dự án **FocusBuddy**.

Mục tiêu cốt lõi của FACE-02 là chuyển đổi trạng thái hình học của khuôn mặt robot (`RobotFace`) từ **cập nhật tĩnh tức thời** sang **chuyển cảnh mượt mà theo thời gian (Smooth Transition Animation)** khi props `expression` hoặc `intensity` thay đổi, sử dụng thư viện `framer-motion` (`^11.3.0`) đã có sẵn trong dự án.

Kế hoạch này loại bỏ hoàn toàn cơ chế re-render React theo từng frame, sử dụng **Framer Motion `MotionValue` & Derived Transforms** để cập nhật trực tiếp DOM SVG, áp dụng mô hình **Smooth Tween** ổn định hình học và chuẩn hóa cấu trúc **Mouth Topology** liên tục.

---

## 2. Current State Audit (Khảo Sát Hiện Trạng)

1. **Môi trường & Thư viện:**
   * Next.js 14.2.5 (App Router), React 18, TypeScript 5, Tailwind CSS 3.4.1.
   * `framer-motion`: `^11.3.0` đã cài đặt sẵn trong `fe/package.json`.
2. **Cấu trúc module hiện tại:**
   * `fe/src/features/robot-face/robot-face.types.ts`: Định nghĩa `RobotExpression`, `FaceParameters` (10 thông số hình học), `RobotFaceProps`.
   * `fe/src/features/robot-face/expression-presets.ts`: Khai báo `idleFace`, `expressionPresets` (4 biểu cảm: `idle`, `happy`, `concerned`, `thinking`), `interpolateFaceParameters`.
   * `fe/src/features/robot-face/components/RobotFace.tsx`: SVG Renderer tĩnh, tính toán trực tiếp `params` từ props và render 9 logical layers vector.
   * `fe/src/app/robot-face-lab/page.tsx`: Màn hình lab tương tác tại URL `/robot-face-lab`.
3. **Hiện tượng hiện tại:**
   * Khi người dùng click chọn giữa các nút biểu cảm (`idle` $\leftrightarrow$ `happy` $\leftrightarrow$ `concerned` $\leftrightarrow$ `thinking`), hình học SVG thay đổi tức thì trong 1 frame, tạo cảm giác giật cục (snapping).

---

## 3. Mục Tiêu và Non-Goals

### 3.1 Mục tiêu (In-Scope)
* Tự động animate chuyển đổi mượt mà giữa các biểu cảm khi prop `expression` thay đổi.
* Tự động animate mượt mà khi prop `intensity` thay đổi (bao gồm cả khi người dùng kéo slider liên tục).
* Cung cấp prop `animated?: boolean` (mặc định `true`) trong `RobotFaceProps`.
* Áp dụng kiến trúc MotionValue hiệu năng cao (Zero React state re-render per frame).
* Chuẩn hóa cấu trúc hình học SVG (đặc biệt là miệng và mắt) để loại bỏ rủi ro vỡ path (topology mismatch).
* Tự động thích ứng chuẩn tiếp cận `prefers-reduced-motion` của hệ thống.
* Đảm bảo cấu trúc vector nhẹ nhàng, sẵn sàng cho định hướng nhúng màn hình nhỏ.

### 3.2 Non-Goals (Tuyệt đối không triển khai trong FACE-02)
* ❌ Chưa triển khai chớp mắt tự động (Auto-blink loop).
* ❌ Chưa triển khai cử động thở vô thức (Idle breathing micro-motion).
* ❌ Chưa triển khai cử động môi khi nói (Lip sync / speaking animation).
* ❌ Chưa triển khai theo dõi mắt (Eye tracking theo chuột/camera).
* ❌ Chưa triển khai máy trạng thái cảm xúc (Emotion State Machine / Emotion Queue / Priority / Duration auto-return).
* ❌ Chưa kết nối WebSocket hoặc Backend API.
* ❌ Không cài thêm bất kỳ thư viện ngoài nào.

---

## 4. Animation Architecture (Kiến Trúc Animation)

### 4.1 Kiến trúc Direct DOM Updates qua MotionValues (Zero React State per Frame)
Để tránh tình trạng giật lag và re-render toàn bộ component React ở mỗi frame (60 FPS), hệ thống **tuyệt đối không dùng `setState` bên trong vòng lặp animation**. Thay vào đó, kiến trúc được tổ chức theo luồng Direct MotionValue:

```text
Props (expression, intensity, animated)
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Tính toán Target FaceParameters tức thời                 │
│    target = interpolateFaceParameters(idle, preset, intens) │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. useAnimatedFaceParameters (Internal Custom Hook)         │
│    - Quản lý 10 MotionValues số học:                        │
│      eyeOpen, eyeCurvature, leftEyebrowAngle,               │
│      rightEyebrowAngle, leftEyebrowOffsetY,                 │
│      rightEyebrowOffsetY, mouthCurvature, mouthOpen,        │
│      blushOpacity, glowIntensity                            │
│    - Khởi tạo MotionValues bằng đúng target ở lần mount đầu │
│    - useEffect: Gọi Framer Motion animate() retarget        │
│      khi target thay đổi mà không re-render React component │
│    - Hủy bỏ (cancel) transition cũ ngay khi nhận target mới │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Derived MotionValues (sử dụng useTransform)              │
│    - leftEyePath = useTransform([eyeOpen, eyeCurv], ...)    │
│    - rightEyePath = useTransform([eyeOpen, eyeCurv], ...)   │
│    - mouthPath = useTransform([mouthCurv, mouthOpen], ...)  │
│    - mouthFillOpacity = useTransform(mouthOpen, [0, 0.45].. │
│    - leftEyebrowTransform = useTransform(...)               │
│    - rightEyebrowTransform = useTransform(...)              │
│    - glowStdDev = useTransform(glowIntensity, g => 3.5 * g) │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SVG Presentation Elements (Framer Motion SVG Components) │
│    - <motion.path d={leftEyePath} />                        │
│    - <motion.path d={rightEyePath} />                       │
│    - <motion.path d={mouthPath} fillOpacity={...} />        │
│    - <motion.rect transform={leftEyebrowTransform} />       │
│    - <motion.ellipse opacity={blushOpacity} />              │
│    - <motion.feGaussianBlur stdDeviation={glowStdDev} />    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Lợi thế kỹ thuật
1. **React Component chỉ render 1 lần duy nhất** khi props thay đổi; toàn bộ chuyển động 60 FPS được Framer Motion cập nhật trực tiếp vào thuộc tính của các phần tử DOM SVG.
2. Không sinh rác bộ nhớ (Garbage Collection) từ các state re-render liên tục.
3. Không bao giờ phát sinh chuỗi SVG Path gãy/hỏng (`NaN`) vì hàm `useTransform` luôn tính toán từ các số thực hợp lệ.

---

## 5. Transition Model & Thứ Tự Ưu Tiên (Precedence)

### 5.1 Lựa chọn mô hình chuyển động: Smooth Tween
FACE-02 chọn **Smooth Tween** làm transition mặc định thay vì Spring Physics.
* **Lý do:** Hình học vector khuôn mặt đòi hỏi sự ổn định tuyệt đối và có thể dự đoán được (predictable). Spring overshoot có thể đẩy các giá trị góc xoay hoặc độ mở mắt vượt ra ngoài biên an toàn trước khi hồi tiếp. Sự dễ thương sẽ được bổ sung qua micro-motion và auto-blink ở các checkpoint sau.
* **Cấu hình Tween chuẩn:**
  * `duration: 0.32` giây (trong khoảng 0.3s – 0.35s).
  * `ease: [0.22, 1, 0.36, 1]` (cubic-bezier làm dịu tự nhiên, phản hồi nhanh ở đầu và mượt dần về đích).

### 5.2 Thứ tự ưu tiên (Precedence Logic)
```text
IF prop animated === false:
    → Cập nhật giá trị tức thời (duration = 0, không chuyển động)
ELSE IF prefers-reduced-motion === true:
    → Cập nhật tức thời hoặc transition cực ngắn (duration <= 0.05s)
ELSE:
    → Áp dụng Smooth Tween mặc định (duration = 0.32s, ease = [0.22, 1, 0.36, 1])
```

---

## 6. Mouth Topology Decision (Chuẩn Hóa Cấu Trúc Miệng)

### 6.1 Vấn đề của FACE-01
Trong FACE-01, miệng đổi cấu trúc bằng câu lệnh rẽ nhánh điều kiện:
`params.mouthOpen > 0.08 ? (khoang kín M Q Q Z) : (đường đơn M Q)`
Khi chuyển đổi giữa biểu cảm ngậm miệng (`idle`) và mở miệng (`happy`), việc thay đổi cấu trúc thẻ/path giữa chừng sẽ làm gãy interpolation hoặc gây lóe fill đột ngột.

### 6.2 Giải pháp Unified Continuous Path & Epsilon Hình Học
Chuẩn hóa cấu trúc miệng thành **1 đường cong khép kín 2 cung Bézier liên tục** (`M Q Q Z`) cho toàn bộ mọi biểu cảm:

$$\text{MouthPath} = M(x_{\text{left}}, y_{\text{base}}) \ Q(x_{\text{center}}, y_{\text{topControl}}) \ (x_{\text{right}}, y_{\text{base}}) \ Q(x_{\text{center}}, y_{\text{botControl}}) \ (x_{\text{left}}, y_{\text{base}}) \ Z$$

* **Xử lý trạng thái ngậm miệng (`mouthOpen = 0`):**
  * Nếu $y_{\text{botControl}}$ trùng tuyệt đối $y_{\text{topControl}}$, 2 cung stroke chồng khít có thể tạo cảm giác nét bị dày gấp đôi hoặc xuất hiện răng cưa subpixel.
  * *Giải pháp:* Thiết lập một epsilon khoảng cách cực nhỏ ($\epsilon \approx 0.3\text{px}$) hoặc đồng nhất hóa phương trình stroke, đồng thời gán `fillOpacity = 0`.
* **Xử lý trạng thái há miệng (`mouthOpen > 0`):**
  * $y_{\text{botControl}} = y_{\text{topControl}} + \text{mouthOpen} \times 22\text{px}$.
  * `fillOpacity` được ánh xạ mượt mà từ `0` (khi `mouthOpen = 0`) lên `1` (khi `mouthOpen \ge 0.25`).
* **Không dùng câu lệnh rẽ nhánh thay đổi loại phần tử SVG trong lúc animation.**

---

## 7. Parameter Domain Safety (Bảng Miền Giá Trị An Toàn)

Mọi thông số truyền vào renderer đều được clamp trong miền giá trị hình học an toàn:

| Tham số (`FaceParameters`) | Miền giá trị chuẩn | Ý nghĩa hình học | Giới hạn an toàn |
| :--- | :---: | :--- | :---: |
| `eyeOpen` | `[0.08, 1.0]` | Độ mở mí mắt | Không để $< 0.05$ tránh đảo ngược hình học mí |
| `eyeCurvature` | `[-0.5, 1.0]` | Độ cong mí mắt (-: buồn, +: cười) | Giới hạn `[-0.5, 1.0]` |
| `leftEyebrowAngle` | `[-30, 30]` (deg) | Góc xoay lông mày trái | Giới hạn xoay tối đa $\pm 30^\circ$ |
| `rightEyebrowAngle` | `[-30, 30]` (deg) | Góc xoay lông mày phải | Giới hạn xoay tối đa $\pm 30^\circ$ |
| `leftEyebrowOffsetY` | `[-15, 15]` (px) | Tịnh tiến trục Y lông mày trái | Giới hạn tránh lông mày đè vào mắt |
| `rightEyebrowOffsetY` | `[-15, 15]` (px) | Tịnh tiến trục Y lông mày phải | Giới hạn tránh lông mày đè vào mắt |
| `mouthCurvature` | `[-1.0, 1.0]` | Độ cong khóe miệng (-: mếu, +: cười) | Giới hạn `[-1.0, 1.0]` |
| `mouthOpen` | `[0.0, 1.0]` | Độ mở khoang miệng | Giới hạn $\ge 0.0$ và $\le 1.0$ |
| `blushOpacity` | `[0.0, 1.0]` | Độ hiển thị má hồng | Clamp chuẩn `[0, 1]` |
| `glowIntensity` | `[0.0, 1.0]` | Cường độ phát sáng cyan | Clamp chuẩn `[0, 1]` |
| `intensity` (prop) | `[0.0, 1.0]` | Cường độ biểu cảm | Clamp chuẩn `[0, 1]` |

---

## 8. Xử Lý Rapid Updates & Hydration Strategy

### 8.1 Xử lý khi thay đổi biểu cảm liên tục (Rapid Expression Switching)
* Khi người dùng bấm liên tục giữa các nút biểu cảm (ví dụ `idle` $\rightarrow$ `happy` $\rightarrow$ `concerned`), Framer Motion tự động dừng transition cũ tại giá trị tức thời hiện tại và chuyển hướng (retarget) tới giá trị đích mới.
* Không tích lũy animation queue; không bắt buộc phải hoàn thành chuyển động về `idle` rồi mới sang biểu cảm tiếp theo; không remount cây SVG DOM.

### 8.2 Xử lý khi kéo slider Intensity liên tục (Rapid Slider Scrubbing)
* Khi kéo slider, target value cập nhật theo từng sự kiện input.
* MotionValues được retarget trực tiếp mà không lưu trữ Promise/controller tích lũy. Chuyển động bám sát ngón tay/chuột của người dùng mà không có độ trễ tích lũy.

### 8.3 Chiến lược Hydration & SSR Khởi Tạo
* Giá trị ban đầu của các `MotionValue` được gán bằng **chính xác target parameters của expression ban đầu** tại thời điểm khởi tạo component (thay vì luôn gán cứng là `idle`).
* Đảm bảo SSR HTML sinh ra trên server và client first render khớp nhau 100%, không bị lỗi hydration mismatch và không tự kích hoạt animation chạy ngoài ý muốn khi vừa mount.

---

## 9. Performance Considerations (Đánh Giá Hiệu Năng)

* **Quy mô DOM:** Toàn bộ khuôn mặt bao gồm 9 logical SVG layers bên trong 1 thẻ `<svg>`.
* **Cơ chế cập nhật:** Do sử dụng Framer Motion `MotionValue` và direct SVG attribute updates, React không tốn chi phí diffing Virtual DOM trong suốt quá trình chuyển động 60 FPS.
* **Tài nguyên phần cứng:** Phương pháp numeric vector animation dự kiến nhẹ hơn đáng kể so với các giải pháp Canvas/3D/Video.
* **Định hướng Raspberry Pi 4:** Hiệu năng thực tế trên phần cứng nhúng (Chromium kiosk) sẽ được đo đạc và benchmark chính thức ở checkpoint triển khai phần cứng.
* **Tiêu chí kiểm tra hiệu năng:**
  * Quan sát tab Rendering/Performance của Chrome DevTools khi test rapid switching.
  * Tuyệt đối không tạo `setInterval`/`setTimeout` timer trong FACE-02.
  * Tuyệt đối không tạo React state update per-frame.

---

## 10. Phạm Vi Thay Đổi Trang Robot Face Lab

* Giữ nguyên các chức năng cốt lõi: 4 nút biểu cảm (`idle`, `happy`, `concerned`, `thinking`), slider `intensity` (0..1), selector kích thước xem trước (320px, 440px, 520px).
* **Bổ sung:** Checkbox bật/tắt `animated` để kiểm thử trực quan prop mới.
* **Không thêm:** Các nút chọn Spring mode, Linear mode hay mô phỏng Reduced Motion giả lập (chuẩn tiếp cận `prefers-reduced-motion` được kiểm thử chuẩn qua DevTools/Hệ điều hành).

---

## 11. Danh Sách File Dự Kiến & Trách Nhiệm

### 11.1 File dự kiến tạo mới
* `fe/src/features/robot-face/hooks/useAnimatedFaceParameters.ts`: Custom hook nội bộ quản lý 10 `MotionValues`, derived transforms và transition tween. *(Lưu ý: Đây là implementation detail nội bộ, không export ra ngoài `index.ts`).*

### 11.2 File dự kiến chỉnh sửa
* `fe/src/features/robot-face/robot-face.types.ts`: Bổ sung prop `animated?: boolean` vào `RobotFaceProps`.
* `fe/src/features/robot-face/components/RobotFace.tsx`: Chuyển đổi sang sử dụng `motion.*` SVG elements kết nối với hook và áp dụng Unified Mouth Topology.
* `fe/src/features/robot-face/index.ts`: Export cập nhật `RobotFaceProps` (giữ nguyên không export hook nội bộ).
* `fe/src/app/robot-face-lab/page.tsx`: Bổ sung checkbox `animated` để kiểm thử.
* `fe/docs/ROBOT_FACE_ARCHITECTURE.md`: Cập nhật đặc tả kiến trúc tương ứng.

### 11.3 File tuyệt đối không được sửa
* ❌ Toàn bộ mã nguồn Backend (`be/*`).
* ❌ Toàn bộ module khác: Auth, Chatbot, Schedule, Scores, Mental-health, Goals, Settings.
* ❌ `fe/package.json` và `package-lock.json` (không cài thêm thư viện).
* ❌ File cấu hình: `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `Dockerfile`.

---

## 12. Kế Hoạch Kiểm Thử Toàn Diện (Verification Plan Cho FACE-02B)

1. **Kiểm tra script & static code:**
   * Chạy `npm run lint` (nếu script sẵn sàng).
   * Chạy `npx tsc --noEmit` (xác thực 0 lỗi TypeScript).
   * Chạy `npm run build` (xác thực Next.js production build pass 100%).
2. **Kiểm tra Initial Mount:**
   * Khởi tạo trang với từng biểu cảm khác nhau (`happy`, `concerned`), đảm bảo không tự động chạy animation từ `idle` khi mount.
3. **Kiểm tra Prop `animated`:**
   * Khi `animated={false}`: Đổi biểu cảm phải nhảy trạng thái tức thì trong 1 frame.
   * Khi `animated={true}`: Chuyển cảnh mượt mà theo đúng cấu hình Smooth Tween (0.32s).
4. **Kiểm tra `prefers-reduced-motion`:**
   * Bật mô phỏng `prefers-reduced-motion: reduce` trong Chrome DevTools (Rendering tab), xác nhận chuyển động rút ngắn tức thì.
5. **Kiểm tra Rapid Switching & Scrubbing:**
   * Click đổi biểu cảm liên tục tốc độ cao, xác nhận không đơ lag, không gián đoạn UI.
   * Kéo slider `intensity` qua lại nhanh liên tục, xác nhận hình học biến đổi bám sát chuột.
6. **Kiểm tra hình học miệng tại các ngưỡng giá trị nhỏ:**
   * Kiểm tra trực quan miệng ở `intensity = 0`, `0.01`, `0.05`, `0.1` trên cả 4 biểu cảm, quan sát không có hiện tượng nét bị dày bất thường, không flicker, không lóe fill.
7. **Kiểm tra Responsive & Viewports:**
   * 320×240 (màn hình nhỏ/nhúng), 480×272, 800×480, desktop full screen.
8. **Kiểm tra Console & Runtime:**
   * Đảm bảo 0 lỗi console, 0 cảnh báo hydration mismatch, không có timer chạy ngầm, không có React state update per-frame.

---

## 13. Kế Hoạch Rollback

Nếu phát sinh lỗi kiến trúc không thể khắc phục trong FACE-02B:
1. Xóa file hook `fe/src/features/robot-face/hooks/useAnimatedFaceParameters.ts`.
2. Sử dụng lệnh Git có mục tiêu:
   ```powershell
   git checkout -- fe/src/features/robot-face/
   git checkout -- fe/src/app/robot-face-lab/
   git checkout -- fe/docs/
   ```
3. Khôi phục hoàn toàn về baseline tĩnh ổn định của FACE-01 mà không làm ảnh hưởng đến bất kỳ file nào khác trong repository.

---

## 14. Chính Sách Quản Lý Tài Liệu

* Khi triển khai FACE-02B, mọi cập nhật về public API (`animated`), kiến trúc MotionValue và Mouth Topology sẽ được cập nhật đồng bộ vào `fe/docs/ROBOT_FACE_ARCHITECTURE.md`.
* Báo cáo `fe/docs/TASK_FACE_02_STATUS_REPORT.md` sẽ chỉ được tạo **sau khi implementation hoàn thành và xác thực thành công 100%**.

---

## 15. Open Questions (Sau Rà Soát Kiến Trúc)

Hai câu hỏi thiết kế trước đó đã được chốt hoàn toàn:
1. **Transition Model:** Smooth Tween (`duration: 0.32s, ease: [0.22, 1, 0.36, 1]`).
2. **Prop `animated`:** Bổ sung `animated?: boolean` (mặc định `true`).

Sau khi khảo sát toàn bộ codebase hiện tại, **không còn câu hỏi mở nào cản trở kỹ thuật**. Toàn bộ kiến trúc và ranh giới đã sẵn sàng để triển khai ngay khi nhận lệnh.

---

```text
STATUS: IMPLEMENTED — WAITING FOR VERIFICATION
```
