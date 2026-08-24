# Kế Hoạch Triển Khai FACE-04: Vi Chuyển Động Nền (Ambient Micro-Animations)

> **TRẠNG THÁI HIỆN TẠI:**  
> `STATUS: IMPLEMENTED — WAITING FOR VERIFICATION`

---

## 1. Current State Audit (Khảo Sát Hiện Trạng Codebase)

1. **Kiến trúc MotionValue & Animation sau FACE-02 & FACE-03:**
   * `RobotFace.tsx` quản lý 9 logical SVG layers.
   * `useAnimatedFaceParameters.ts` quản lý 10 `MotionValue` cơ sở, tính toán `effectiveEyeOpen` kết hợp `useAutoBlink` (`blinkFactor`), và cung cấp derived transforms cho mắt, miệng, lông mày, má hồng và phát sáng glow.
   * Chuyển cảnh sử dụng Smooth Tween (`duration: 0.32s`, `ease: [0.22, 1, 0.36, 1]`).
   * Tự động chớp mắt (`useAutoBlink.ts`) hoạt động độc lập bằng recursive `setTimeout` (2.5s–6.0s), có generation token chống race condition và Page Visibility API.
2. **Cấu trúc Layer trong SVG:**
   * Layer 1 (`screen-visor`): Nền kính tối màu bo góc `rx="36"` + viền sáng trên.
   * Layer 2 (`ambient-glow`): `<motion.ellipse>` phát sáng cyan nền.
   * Layers 3–9 (`left-eyebrow`, `right-eyebrow`, `left-eye`, `right-eye`, `mouth`, `left-blush`, `right-blush`): Toàn bộ chi tiết ngũ quan của khuôn mặt robot.
3. **Đánh giá tương thích:**
   * Hệ thống MotionValue hoạt động độc lập hoàn toàn với React component render loop (0 state update per-frame).
   * Việc bổ sung vi chuyển động nền (`ambient-motion`) dưới dạng wrapper group `<motion.g id="facial-content">` và bộ nhân phát sáng (`glowMultiplier`) là hoàn toàn phân lớp, không phá vỡ bất kỳ logic nào của FACE-02 hay FACE-03.

---

## 2. Mục Tiêu và Non-Goals

### 2.1 Mục tiêu (In-Scope)
* Xây dựng vi chuyển động thở nhẹ tự nhiên (Idle Breathing Micro-motion) khi robot ở trạng thái `idle`.
* Nhịp chuyển động cực nhẹ, chậm rãi, chu kỳ $\approx 4.0\text{s}$, không gây mất tập trung hay biến dạng biểu cảm.
* Đồng bộ nhịp nâng/hạ nhẹ ($\text{translateY} \approx \pm 1.2\text{px}$), co giãn vi mô ($\text{scale} \approx 1.005$), và quầng sáng cyan tỏa nhẹ theo nhịp thở ($\text{glowMultiplier} \approx \pm 6\%$).
* Thêm prop tùy chọn `ambientMotion?: boolean` (mặc định: `true`) trong `RobotFaceProps`.
* Cung cấp toggle `Ambient Motion` trên trang Robot Face Lab để kiểm thử trực quan.
* Quản lý vòng đời chặt chẽ: Dừng và reset về trạng thái tĩnh trung tính khi chuyển sang biểu cảm khác, khi tab bị ẩn (`document.visibilityState !== 'visible'`), khi `animated = false` hoặc khi bật `prefers-reduced-motion`.

### 2.2 Non-Goals (Tuyệt đối không triển khai trong FACE-04)
* ❌ Chưa triển khai máy trạng thái cảm xúc (Emotion State Machine / Queue / Priority / Duration).
* ❌ Chưa triển khai theo dõi ánh nhìn theo chuột/camera (Eye tracking / pupil gaze).
* ❌ Chưa triển khai cử động môi khi nói (Lip sync / speaking animation).
* ❌ Chưa thêm các hiệu ứng hạt đồ họa (Stars, tears, Zzz sleeping, sweating).
* ❌ Chưa kết nối WebSocket, Backend API, hoặc phần cứng Raspberry Pi.
* ❌ Không cài thêm bất kỳ thư viện ngoài nào.

---

## 3. Quyết Định Về Public API (Public API Decision)

### 3.1 Cập nhật Interface `RobotFaceProps`
```typescript
export interface RobotFaceProps {
  expression?: RobotExpression;
  intensity?: number;
  size?: number;
  className?: string;
  animated?: boolean;
  autoBlink?: boolean;
  /** Bật/tắt vi chuyển động nền / nhịp thở khi ở trạng thái idle (mặc định: true) */
  ambientMotion?: boolean;
}
```

### 3.2 Phạm vi hoạt động (Expression Scope)
* **Quyết định:** Ambient Micro-motion **chỉ kích hoạt khi `expression === "idle"`**.
* **Lý do kỹ thuật:** Khi robot chuyển sang các trạng thái cảm xúc chủ động (`happy`, `concerned`, `thinking`), robot đang giao tiếp hoặc phản hồi trực tiếp với người học, việc giữ nhịp thở idle có thể làm loãng thông điệp cảm xúc. Khi robot quay trở về `idle`, nhịp thở vi mô sẽ nhẹ nhàng bắt đầu lại.

### 3.3 Ma trận ưu tiên (Precedence Matrix)
```text
IF ambientMotion === false OR animated === false:
    → Dừng ambient loop, reset translateY = 0, scale = 1, glowMultiplier = 1
ELSE IF prefers-reduced-motion === true:
    → Dừng ambient loop, reset translateY = 0, scale = 1, glowMultiplier = 1
ELSE IF document.visibilityState !== "visible":
    → Tạm dừng ambient loop, reset translateY = 0, scale = 1, glowMultiplier = 1
ELSE IF expression !== "idle":
    → Dừng ambient loop, reset translateY = 0, scale = 1, glowMultiplier = 1
ELSE:
    → Ambient micro-motion hoạt động lặp liên tục (chu kỳ 4.0s)
```

---

## 4. Kiến Trúc Ambient Motion (Ambient Motion Architecture)

### 4.1 Mô hình phân lớp tiếp biến (Layered Pipeline)
```text
[Expression: 'idle' & Props]
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ useAmbientFaceMotion(isActive)                         │
│ - ambientProgress: MotionValue (0.0 -> 1.0 -> 0.0)     │
│ - animate() với repeat: Infinity, ease: 'easeInOut'    │
│ - Derived MotionValues:                                │
│   * translateY = [0, -1.2px]                           │
│   * scale = [1.0, 1.005]                               │
│   * glowMultiplier = [1.0, 1.06]                       │
└────────────────────────────────────────────────────────┘
             │
             ├───────────────────────────────────────────┐
             ▼                                           ▼
┌───────────────────────────────────────┐   ┌───────────────────────────┐
│ <motion.g id="facial-content">        │   │ Layer 2: <motion.ellipse> │
│ - style={{ y, scale, transformOrigin }}│   │ - opacity = base * mult   │
│ - Chứa: Mắt, Lông mày, Miệng, Má      │   │ - Quầng sáng nền cyan     │
└───────────────────────────────────────┘   └───────────────────────────┘
```

### 4.2 Lợi thế kiến trúc
1. **Toàn vẹn bố cục:** Mặt kính (`screen-visor`) giữ nguyên 100% độ cố định. Nhóm ngũ quan di chuyển đồng bộ quanh tâm `transformOrigin: "200px 125px"`.
2. **Không xung đột với Auto Blink:** `useAutoBlink` điều biến mí mắt bên trong `leftEyePath`/`rightEyePath`, trong khi `facial-content` nâng hạ toàn bộ nhóm mắt. Hai chuyển động độc lập về mặt toán học và lồng ghép tự nhiên.
3. **Zero React Re-render:** Toàn bộ chu kỳ lặp vô tận diễn ra trên GPU/Framer Motion MotionValue mà không kích hoạt re-render React.

---

## 5. Quyết Định Phân Phối Layer SVG (SVG Layer Decision)

* **Phần tử tĩnh tuyệt đối (Stationary):**
  * `<g id="screen-visor">`: Khung mặt kính tối màu bo góc cố định để tạo cảm giác màn hình robot kiên cố.
  * `<defs>`: Toàn bộ gradients và filters được giữ tĩnh.
* **Phần tử vi chuyển động hình học (Geometric Motion):**
  * Gom Layers 3 đến 9 vào thẻ nhóm `<motion.g id="facial-content">`:
    * Lông mày trái / phải
    * Mắt trái / phải (bao gồm cả đốm phản quang)
    * Khuôn miệng
    * Má hồng trái / phải
  * Thiết lập tâm biến đổi chuẩn: `transformOrigin: "200px 125px"` (tâm hình học của cụm ngũ quan).
* **Phần tử vi chuyển động phát sáng (Glow Modulation):**
  * `<g id="ambient-glow">`: Quầng sáng nền cyan tỏa nhẹ theo nhịp thở.

---

## 6. Hồ Sơ Chuyển Động (Motion Profile)

| Thuộc tính | Khoảng giá trị | Easing | Chu kỳ | Mô tả cảm nhận |
| :--- | :---: | :---: | :---: | :--- |
| **Chu kỳ tổng** | `4.0` giây | — | Lặp vô tận | Tương đương $\approx 15$ nhịp thở/phút của sinh vật sống. |
| **`translateY`** | `0.0px` $\rightarrow$ `-1.2px` $\rightarrow$ `0.0px` | `easeInOut` | $4.0\text{s}$ | Nâng nhẹ khi hít vào, hạ nhẹ khi thở ra. |
| **`scale`** | `1.000` $\rightarrow$ `1.005` $\rightarrow$ `1.000` | `easeInOut` | $4.0\text{s}$ | Co giãn vi mô $+0.5\%$, mắt thường khó nhận biết là zoom mà chỉ cảm thấy sự sống động. |
| **`glowMultiplier`**| `1.00` $\rightarrow$ `1.06` $\rightarrow$ `1.00` | `easeInOut` | $4.0\text{s}$ | Quầng sáng phát quang sáng nhẹ $+6\%$ đồng bộ khi hít vào. |

---

## 7. Phép Kết Hợp Quầng Sáng (Glow Composition)

Để đảm bảo quầng sáng nền không bị đột biến hoặc vượt ngưỡng an toàn:
$$\text{effectiveAmbientGlowOpacity} = \text{clamp}(\text{baseAmbientGlowOpacity} \times \text{glowMultiplier}, 0.0, 1.0)$$
* Khi `glowMultiplier = 1.0`: Quầng sáng giữ nguyên độ mờ do `glowIntensity` của biểu cảm quy định.
* Khi `glowMultiplier` tăng lên `1.06`: Độ mờ tăng thêm $6\%$ một cách dịu nhẹ.
* Phép tính thực hiện qua `useTransform`, không gọi `setState`.

---

## 8. Quản Lý Vòng Đời & Page Visibility (Lifecycle Management)

1. **Khởi tạo & Khởi động Loop:**
   * Sử dụng Framer Motion `animate(ambientProgress, [0, 1, 0], { duration: 4.0, repeat: Infinity, ease: 'easeInOut' })`.
2. **Dừng & Reset (Cleanup / Inactive):**
   * Khi đổi sang biểu cảm khác (`happy`), tắt prop `ambientMotion=false`, unmount hoặc tab bị ẩn:
     * Dừng animation controller: `control.stop()`.
     * Reset mượt mà về trạng thái trung tính: `ambientProgress.set(0)`.
3. **Page Visibility API:**
   * Lắng nghe `visibilitychange`: Tự động dừng animation khi tab ẩn và khởi động lại chu kỳ mới từ `0` khi tab hiển thị lại.
4. **React Strict Mode:**
   * Cơ chế cleanup trong `useEffect` đảm bảo không để lại infinite loop rò rỉ khi component re-mount.

---

## 9. Ma Trận Tương Tác Giữa Các Hệ Thống (Interaction Matrix)

| Tình huống thực tế | Hành vi hệ thống | Kết quả trực quan |
| :--- | :--- | :--- |
| **Idle + Auto Blink** | `facial-content` vẫn chuyển động thở, `useAutoBlink` chớp mắt độc lập. | Robot vừa thở nhẹ vừa chớp mắt cực kỳ sống động và tự nhiên. |
| **Idle $\rightarrow$ Happy** | `useAmbientFaceMotion` dừng và reset `translateY=0`, `scale=1`; transition sang `happy` diễn ra mượt mà trong 0.32s. | Chuyển cảnh dứt khoát sang biểu cảm vui vẻ, không bị lệch vị trí. |
| **Happy $\rightarrow$ Idle** | Transition về `idle` hoàn tất, `useAmbientFaceMotion` phát hiện `expression === 'idle'` và bắt đầu chu kỳ thở mới. | Trở lại trạng thái nghỉ và tiếp tục thở nhẹ nhàng. |
| **Kéo slider `intensity` ở Idle** | `baseParams` cập nhật, nhịp thở `ambientProgress` vẫn duy trì chu kỳ. | Cường độ biểu cảm thay đổi mượt mà mà không làm gián đoạn nhịp thở. |
| **Tắt `ambientMotion=false`** | Dừng loop, reset `y=0, scale=1, glow=1`. | Toàn bộ khuôn mặt đứng yên ở vị trí chuẩn, Auto Blink và transition vẫn hoạt động bình thường. |
| **Ẩn tab trình duyệt** | Dừng animation loop, reset về neutral. | Tiết kiệm tài nguyên máy tính khi người dùng không xem tab. |
| **Bật Reduced Motion** | Vô hiệu hóa `ambientMotion`, reset về neutral. | Đảm bảo tính tiếp cận tuyệt đối. |

---

## 10. Danh Sách Tệp Dự Kiến Thay Đổi

### 10.1 File dự kiến tạo mới
* `fe/src/features/robot-face/hooks/useAmbientFaceMotion.ts`: Custom hook nội bộ quản lý `ambientProgress`, infinite loop, derived transforms (`y`, `scale`, `glowMultiplier`) và visibility lifecycle.

### 10.2 File dự kiến chỉnh sửa
* `fe/src/features/robot-face/robot-face.types.ts`: Bổ sung prop `ambientMotion?: boolean` vào `RobotFaceProps`.
* `fe/src/features/robot-face/components/RobotFace.tsx`: Kết nối `useAmbientFaceMotion`, bọc Layers 3–9 trong `<motion.g id="facial-content">` và áp dụng `glowMultiplier`.
* `fe/src/app/robot-face-lab/page.tsx`: Bổ sung checkbox `ambientMotion` trong control panel.
* `fe/docs/ROBOT_FACE_ARCHITECTURE.md`: Cập nhật đặc tả kiến trúc FACE-04.
* `fe/docs/FACE_04_IMPLEMENTATION_PLAN.md`: Cập nhật trạng thái sau khi hoàn thành.

### 10.3 File tuyệt đối không được sửa
* ❌ `fe/package.json` và `package-lock.json` (không cài thêm thư viện).
* ❌ Toàn bộ mã nguồn Backend (`be/*`).
* ❌ Toàn bộ module Auth, Chatbot, Schedule, Scores, Mental-health, Goals, Settings.

---

## 11. Các Bước Implementation Theo Thứ Tự (Cho FACE-04B)

1. **Bước 1:** Cập nhật `robot-face.types.ts` bổ sung prop `ambientMotion?: boolean`.
2. **Bước 2:** Xây dựng hook nội bộ `useAmbientFaceMotion.ts` với Framer Motion infinite loop và derived MotionValues.
3. **Bước 3:** Cập nhật `RobotFace.tsx` tích hợp hook, nhóm cụm ngũ quan vào `<motion.g id="facial-content">` và điều biến quầng sáng nền.
4. **Bước 4:** Cập nhật trang `fe/src/app/robot-face-lab/page.tsx` thêm toggle `Ambient Motion`.
5. **Bước 5:** Chạy toàn bộ Verification Suite (`npx tsc --noEmit`, `npm run build`, runtime checks).
6. **Bước 6:** Cập nhật tài liệu kiến trúc `ROBOT_FACE_ARCHITECTURE.md` và tạo báo cáo `TASK_FACE_04_STATUS_REPORT.md`.

---

## 12. Kế Hoạch Kiểm Thử Toàn Diện (Verification Plan)

### 12.1 Automated Checks
* `npx tsc --noEmit`: Đảm bảo 0 lỗi TypeScript, tuyệt đối không dùng `any` hay `@ts-ignore`.
* `npm run build`: Đảm bảo Next.js production build pass 100% (15 static routes).

### 12.2 Runtime & Lifecycle Checks
* Xác thực không có lỗi console, không có hydration warning.
* Xác thực không có infinite loop rò rỉ khi chuyển đổi giữa `idle` và các biểu cảm khác.
* Xác thực khi ẩn tab (`visibilitychange`), animation loop tạm dừng và không tiêu tốn tài nguyên nền.

### 12.3 Visual Checks
* Chuyển động thở nhẹ nhàng, êm dịu, không giật khi lặp chu kỳ.
* Mặt kính bên ngoài đứng yên, cụp ngũ quan bên trong nâng hạ đều đặn $\pm 1.2\text{px}$.
* Quầng sáng cyan tỏa nhẹ nhịp nhàng theo nhịp thở.
* Auto Blink chớp mắt trơn tru trong khi khuôn mặt đang thở.
* Kiểm tra responsive trên các kích thước: 320×240, 440×264, 520×312 và desktop.

---

## 13. Rủi Ro & Biện Pháp Phòng Ngừa

| Rủi ro tiềm ẩn | Mức độ | Biện pháp xử lý |
| :--- | :---: | :--- |
| **Chuyển động thở bị giật khi lặp chu kỳ (Loop Stutter)** | Thấp | Sử dụng keyframes đối xứng `[0, 1, 0]` với easing `easeInOut` chuẩn của Framer Motion. |
| **Lệch tâm co giãn khi scale (Scale Origin Offset)** | Thấp | Cố định `transformOrigin: "200px 125px"` khớp với tâm hình học của cụm ngũ quan. |
| **Rò rỉ animation loop khi unmount hoặc đổi biểu cảm** | Thấp | Quản lý animation controller qua `useEffect` cleanup và dừng tức thì khi `isActive === false`. |

---

## 14. Kế Hoạch Rollback

Nếu phát sinh sự cố trong quá trình triển khai FACE-04B:
1. Xóa file mới tạo: `fe/src/features/robot-face/hooks/useAmbientFaceMotion.ts`.
2. Khôi phục các file chỉnh sửa bằng Git có mục tiêu:
   ```powershell
   git checkout -- fe/src/features/robot-face/robot-face.types.ts
   git checkout -- fe/src/features/robot-face/components/RobotFace.tsx
   git checkout -- fe/src/app/robot-face-lab/page.tsx
   git checkout -- fe/docs/ROBOT_FACE_ARCHITECTURE.md
   ```
3. Đưa repository trở lại trạng thái FACE-03 ổn định mà không ảnh hưởng đến bất kỳ module nào khác.

---

## 15. Kế Hoạch Cập Nhật Tài Liệu (Documentation Updates)

Sau khi hoàn thành và xác thực FACE-04B:
1. Cập nhật `fe/docs/ROBOT_FACE_ARCHITECTURE.md` ghi nhận hoàn thành Ambient Micro-Animations.
2. Cập nhật trạng thái `fe/docs/FACE_04_IMPLEMENTATION_PLAN.md` thành `STATUS: IMPLEMENTED`.
3. Tạo báo cáo chi tiết `fe/docs/TASK_FACE_04_STATUS_REPORT.md`.

---

## 16. Definition of Done (DoD cho FACE-04)

* [ ] Khuôn mặt robot có vi chuyển động thở nhẹ tự nhiên (chu kỳ 4.0s) khi ở trạng thái `idle`.
* [ ] Cụm ngũ quan nâng hạ nhẹ $\pm 1.2\text{px}$, co giãn vi mô $1.005$, quầng sáng cyan tỏa nhẹ $+6\%$.
* [ ] Mặt kính ngoài (`screen-visor`) đứng yên vững chắc.
* [ ] Có prop `ambientMotion?: boolean` (mặc định: `true`) cho phép bật/tắt linh hoạt.
* [ ] Tự động dừng và reset về neutral khi chuyển sang biểu cảm khác (`happy`, `concerned`, `thinking`), khi ẩn tab, khi `animated = false` hoặc khi bật `prefers-reduced-motion`.
* [ ] Auto Blink và Smooth Tween hoạt động trơn tru đồng thời mà không xung đột.
* [ ] Zero React state update per frame, zero hydration warning, zero console error.
* [ ] `npx tsc --noEmit` và `npm run build` hoàn thành với Exit Code 0.
* [ ] Tài liệu kiến trúc và báo cáo tổng kết được cập nhật đầy đủ.

---

## 17. Open Questions Cần Người Dùng Xác Nhận

> [!NOTE]
> Kế hoạch đã tối ưu hóa các thông số chuyển động để robot trông tự nhiên nhất. Vui lòng xác nhận 2 điểm sau trước khi chuyển sang triển khai FACE-04B:

1. **Phạm vi biểu cảm của Ambient Motion:**
   * *Đề xuất:* **Chỉ chạy khi `expression === "idle"`** (khi robot ở trạng thái nghỉ, sẵn sàng lắng nghe). Khi chuyển sang `happy`, `concerned`, `thinking`, nhịp thở tạm dừng để tập trung vào cảm xúc chính.
   * *Bạn có đồng ý với thiết lập này không?*
2. **Thông số nhịp thở đề xuất:**
   * Chu kỳ: `4.0s` (hít vào 2s, thở ra 2s).
   * Biên độ: `translateY: -1.2px`, `scale: 1.005`, `glow: +6%`.
   * *Bạn có đồng ý với thông số này không?*

---

```text
STATUS: IMPLEMENTED — WAITING FOR VERIFICATION
```
