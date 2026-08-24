# Kế Hoạch Triển Khai FACE-03: Cơ Chế Tự Động Chớp Mắt (Auto Blink)

> **TRẠNG THÁI HIỆN TẠI:**  
> `STATUS: IMPLEMENTED — WAITING FOR VERIFICATION`

---

## 1. Executive Summary

Tài liệu này đặc tả kế hoạch kỹ thuật cho **Checkpoint FACE-03 (Auto Blink)** của dự án **FocusBuddy**.

Mục tiêu cốt lõi của FACE-03 là bổ sung cơ chế **tự động chớp mắt tự nhiên (Auto Blink)** theo chu kỳ thời gian ngẫu nhiên (2.5s – 6.0s) cho `RobotFace`, hoạt động độc lập và phân lớp (composable) trên nền tảng kiến trúc **Framer Motion MotionValue** đã thiết lập ở FACE-02.

Kế hoạch đảm bảo:
* Zero React state update per frame.
* Không xung đột với transition đổi biểu cảm (Expression Transition).
* Tự động tạm dừng (pause/cancel) khi tab trình duyệt bị ẩn (`document.visibilityState !== 'visible'`).
* Tự động tắt khi bật chế độ `prefers-reduced-motion` hoặc khi `animated = false` / `autoBlink = false`.

---

## 2. FACE-02 Current State Audit (Khảo Sát Hiện Trạng FACE-02)

1. **Kiến trúc MotionValue hiện tại (`useAnimatedFaceParameters.ts`):**
   * Quản lý 10 `MotionValue` số học cơ sở cho `FaceParameters` (`eyeOpen`, `eyeCurvature`, `mouthCurvature`, v.v.).
   * Đường vẽ mắt được tạo bởi `useTransform`:
     ```typescript
     leftEyePath = useTransform([eyeOpen, eyeCurvature], ([open, curv]) =>
       generateEyePath(135, 115, open, curv)
     );
     ```
   * Đốm sáng phản quang trong mắt (`leftPupilOpacity`, `leftPupilRy`, `leftPupilCy`) phụ thuộc trực tiếp vào `eyeOpen`.
2. **Cơ chế render mắt trong `RobotFace.tsx`:**
   * Mắt trái: `<motion.path d={animatedValues.leftEyePath} fill={`url(#eye-grad)`} ... />`
   * Mắt phải: `<motion.path d={animatedValues.rightEyePath} fill={`url(#eye-grad)`} ... />`
3. **Đánh giá tương thích:**
   * FACE-02 đã triển khai đúng 100% kiến trúc Direct MotionValue Updates, `npx tsc --noEmit` và `npm run build` đều pass với 0 lỗi.
   * `eyeOpen` trong `useAnimatedFaceParameters` hiện đại diện cho độ mở cơ sở (Base Eye Openness) của biểu cảm. Việc đưa thêm biến số điều biến chớp mắt (`blinkFactor`) vào công thức tính `effectiveEyeOpen` là hướng đi tự nhiên, hoàn toàn không phá vỡ hay viết đè logic cũ.

---

## 3. Mục Tiêu và Non-Goals

### 3.1 Mục tiêu (In-Scope)
* Thêm prop tùy chọn `autoBlink?: boolean` (mặc định: `true`) vào `RobotFaceProps`.
* Xây dựng bộ điều biến `blinkFactor` (1.0 $\rightarrow$ 0.0 $\rightarrow$ 1.0) qua Framer Motion MotionValue.
* Lập lịch chớp mắt ngẫu nhiên trong khoảng `2500ms – 6000ms` bằng recursive `setTimeout`.
* Thời lượng mỗi lần chớp mắt: $\approx 180\text{ms}$ (nhắm $\approx 80\text{ms}$, mở $\approx 100\text{ms}$).
* Quản lý vòng đời chặt chẽ: Dọn dẹp timer và animation khi unmount, khi chuyển tab hidden (`visibilitychange`), khi tắt prop `autoBlink` hoặc `animated`.
* Cập nhật trang Robot Face Lab với checkbox `autoBlink` để kiểm thử trực quan.

### 3.2 Non-Goals (Tuyệt đối không triển khai trong FACE-03)
* ❌ Chưa triển khai cử động thở vô thức (Idle breathing).
* ❌ Chưa triển khai chuyển động đồng tử / đảo mắt (Eye tracking / pupil gaze).
* ❌ Chưa triển khai nháy mắt một bên (Wink) hay chớp mắt kép (Double blink).
* ❌ Chưa triển khai chớp mắt biến thiên theo cảm xúc (Emotion-based blink pacing).
* ❌ Chưa triển khai cử động môi khi nói (Lip sync / speaking animation).
* ❌ Chưa triển khai máy trạng thái cảm xúc (Emotion State Machine / Queue / Priority).
* ❌ Chưa kết nối WebSocket, Backend API, hoặc Raspberry Pi.
* ❌ Không cài thêm bất kỳ thư viện ngoài nào.

---

## 4. Auto Blink Architecture (Kiến Trúc Tự Động Chớp Mắt)

### 4.1 Mô hình phân lớp (Layered Composition Model)
Chớp mắt không can thiệp vào `targetParams` của biểu cảm, mà được áp dụng như một lớp điều biến toán học (Modulation Layer):

```text
[Expression State / Intensity]
             │
             ▼ (Smooth Tween 0.32s)
   [baseEyeOpen: MotionValue] (ví dụ: 0.85 hoặc 0.95)
             │
             ├────────────────────────────────┐
             ▼                                ▼
[blinkFactor: MotionValue]        [eyeCurvature: MotionValue]
   (1.0 -> 0.0 -> 1.0)                        │
             │                                │
             ▼                                │
┌────────────────────────────────────────┐    │
│ effectiveEyeOpen (Derived MotionValue) │    │
│ = baseEyeOpen * blinkFactor            │    │
└────────────────────────────────────────┘    │
             │                                │
             └────────────────┬───────────────┘
                              ▼
        ┌───────────────────────────────────────────┐
        │ leftEyePath / rightEyePath (useTransform) │
        │ = generateEyePath(cx, cy, effOpen, curv)  │
        └───────────────────────────────────────────┘
                              │
                              ▼
            ┌───────────────────────────────────┐
            │ <motion.path d={leftEyePath} />   │
            │ <motion.path d={rightEyePath} />  │
            └───────────────────────────────────┘
```

### 4.2 Lợi thế kiến trúc
1. **Zero State Collision:** Khi robot đang chớp mắt mà người dùng đổi biểu cảm từ `idle` sang `happy`, `baseEyeOpen` vẫn tween mượt mà từ `0.85` lên `0.95`. Khi chớp mắt xong (`blinkFactor = 1.0`), mắt sẽ mở ra đúng trạng thái của `happy` mà không bị gián đoạn hay nhảy giá trị cũ.
2. **Zero React Re-render:** Toàn bộ chu trình chớp mắt diễn ra trong MotionValue ở 60 FPS mà không kích hoạt re-render React component.

---

## 5. So Sánh Phương Án Kỹ Thuật (Eye Animation Strategy Comparison)

| Tiêu chí | Phương án A: Animate Effective Eye Openness (Khuyến nghị) | Phương án B: ScaleY Layer (`motion.g scaleY`) |
| :--- | :--- | :--- |
| **Bản chất hình học** | Tính toán lại Bézier mí mắt qua hàm tham số `generateEyePath`. | Kéo dãn/ép dẹp ma trận tọa độ SVG của cả nhóm thẻ `<g>`. |
| **Độ chân thực của mắt** | **Rất cao.** Mắt khép lại dọc theo đường cong tự nhiên (đặc biệt mắt cười `happy` khép theo hình vòng cung). | **Thấp.** Bị méo dẹp nhân tạo, biến dạng nét stroke và đốm sáng phản quang. |
| **Phản quang trong mắt** | Đốm sáng phản quang mờ dần và thu nhỏ tự nhiên theo `effectiveEyeOpen`. | Bị ép dẹt thành một vệt mỏng kỳ dị. |
| **Tương thích SVG & Browser**| **100% ổn định.** Không phụ thuộc `transform-origin` (vốn dễ lỗi trên WebKit/màn hình nhúng). | Rủi ro lệch tâm xoay (`transformOrigin`) giữa các viewport khác nhau. |
| **Đồng bộ 2 mắt** | 2 mắt cùng phụ thuộc 1 `blinkFactor` $\rightarrow$ Luôn đồng bộ 100%. | Phải animate đồng thời 2 thẻ `<g>` độc lập. |
| **Tái sử dụng code** | Tận dụng 100% pipeline MotionValue của FACE-02. | Phải cấu trúc lại hệ thống group SVG. |

---

## 6. Chiến Lược Kỹ Thuật Được Lựa Chọn (Selected Strategy)

* **Lựa chọn chính thức:** **Phương án A — Effective Eye Openness via `blinkFactor`**.
* **Định nghĩa `blinkFactor`:** MotionValue số học có miền giá trị `[0.0, 1.0]`.
  * `1.0`: Mắt mở hoàn toàn theo độ mở của biểu cảm hiện tại (`effectiveEyeOpen = baseEyeOpen * 1.0`).
  * `0.0`: Mắt khép kín hoàn toàn (`effectiveEyeOpen = 0.0`, được clamp ở mức tối thiểu an toàn $\approx 0.08$ để giữ đường kẻ mí sắc nét).
* **Đốm sáng phản quang:** Tự động ẩn khi `effectiveEyeOpen \le 0.4`.

---

## 7. Public API & Thứ Tự Ưu Tiên (Precedence)

### 7.1 Cập nhật Interface `RobotFaceProps`
```typescript
export interface RobotFaceProps {
  expression?: RobotExpression;
  intensity?: number;
  size?: number;
  className?: string;
  animated?: boolean;
  /** Bật/tắt tính năng tự động chớp mắt ngẫu nhiên (mặc định: true) */
  autoBlink?: boolean;
}
```

### 7.2 Thứ tự ưu tiên (Precedence Matrix)
```text
IF autoBlink === false:
    → Hủy timer, blinkFactor.set(1.0), không chớp mắt
ELSE IF animated === false:
    → Hủy timer, blinkFactor.set(1.0), không chớp mắt
ELSE IF prefers-reduced-motion === true:
    → Hủy timer, blinkFactor.set(1.0), không chớp mắt
ELSE IF document.visibilityState !== "visible":
    → Hủy timer, dừng animation đang chạy, blinkFactor.set(1.0)
ELSE:
    → Auto Blink Scheduler hoạt động bình thường (2500ms – 6000ms)
```

---

## 8. Scheduler Lifecycle (Vòng Đời Bộ Lập Lịch)

Không sử dụng `setInterval` (để tránh lệch pha và tích lũy timer). Sử dụng **Recursive `setTimeout`** với cấu trúc khép kín:

```text
[Mount / Tab Visible]
         │
         ▼
┌──────────────────────────────────────────────┐
│ scheduleNextBlink()                          │
│ 1. delay = getRandomBlinkDelay(2500, 6000)   │
│ 2. timerRef.current = setTimeout(runBlink)   │
└──────────────────────────────────────────────┘
         │
         ▼ (Sau khoảng delay ngẫu nhiên)
┌──────────────────────────────────────────────┐
│ runBlink()                                   │
│ 1. Kiểm tra điều kiện active (precedence)    │
│ 2. Chạy animate(blinkFactor, [1, 0, 1])      │
│ 3. Khi animate hoàn thành -> gọi lại         │
│    scheduleNextBlink()                       │
└──────────────────────────────────────────────┘
         │
         ▼ (Khi Unmount / Hidden / Disabled)
┌──────────────────────────────────────────────┐
│ Cleanup                                      │
│ 1. clearTimeout(timerRef.current)            │
│ 2. animationControl.stop()                   │
│ 3. blinkFactor.set(1.0)                      │
└──────────────────────────────────────────────┘
```

### Thông số Timing chi tiết:
* **Thời gian nghỉ giữa 2 lần chớp:** Ngẫu nhiên trong đoạn `[2500ms, 6000ms]`.
* **Quỹ đạo chuyển động của 1 nhịp chớp (Single Blink Trajectory):**
  * Tổng thời lượng: `180ms` (0.18s).
  * Giai đoạn 1 (Khép mắt): $1.0 \rightarrow 0.0$ trong `80ms` (`easeIn`).
  * Giai đoạn 2 (Mở mắt): $0.0 \rightarrow 1.0$ trong `100ms` (`easeOut`).
  * Sử dụng animate keyframe của Framer Motion:
    ```typescript
    animate(blinkFactor, [1, 0, 1], {
      duration: 0.18,
      times: [0, 0.44, 1],
      ease: ['easeIn', 'easeOut'],
    });
    ```

---

## 9. MotionValue Lifecycle & Cleanup

* `blinkFactor` được khởi tạo bằng `1.0` trên cả server và client first render.
* Khi animation chớp mắt bị dừng đột ngột (do đổi tab, đổi prop `autoBlink=false` hoặc unmount), gọi hàm `control.stop()` và reset tức thì `blinkFactor.set(1.0)` để mắt không bao giờ bị kẹt ở trạng thái nhắm dở dang.

---

## 10. Page Visibility Lifecycle (`visibilitychange`)

* Lắng nghe sự kiện `document.addEventListener('visibilitychange', handleVisibilityChange)`.
* **Khi `document.visibilityState === 'hidden'` (Người dùng chuyển tab hoặc ẩn trình duyệt):**
  * Hủy bỏ `setTimeout` hiện tại (`clearTimeout`).
  * Dừng animation chớp mắt nếu đang chạy giữa chừng.
  * Reset `blinkFactor.set(1.0)` (đưa mắt về trạng thái mở bình thường).
  * Không tạo lịch chớp mắt mới khi tab đang ẩn (tiết kiệm 100% CPU/pin).
* **Khi `document.visibilityState === 'visible'` (Người dùng quay lại tab):**
  * Lập lịch chớp mắt mới với một khoảng delay ngẫu nhiên mới hoàn toàn (`2500ms – 6000ms`).
  * **Không chớp mắt ngay lập tức** khi vừa mở lại tab để tránh cảm giác robot bị giật mình.

---

## 11. Expression Interaction Matrix (Ma Trận Tương Tác Biểu Cảm)

| Tình huống thực tế | Hành vi của hệ thống | Kết quả trực quan |
| :--- | :--- | :--- |
| **Đổi expression trong lúc mắt đang chớp** | `baseEyeOpen` tween mượt sang target mới, `blinkFactor` tiếp tục mở ra $0 \rightarrow 1$. | Mắt chớp xong sẽ mở ra đúng hình dạng của biểu cảm mới, không gián đoạn. |
| **Kéo slider `intensity` trong lúc chớp** | `baseEyeOpen` cập nhật theo intensity, `effectiveEyeOpen` nhân với `blinkFactor`. | Không có độ trễ, không xung đột. |
| **Tắt `autoBlink=false` trong lúc mắt đang nhắm** | Dừng animation, `blinkFactor.set(1.0)`. | Mắt lập tức mở ra trạng thái biểu cảm chuẩn, scheduler dừng hoàn toàn. |
| **Tắt `animated=false` trong lúc chớp** | Dừng animation, `blinkFactor.set(1.0)`. | Chuyển ngay về trạng thái tĩnh tức thời. |
| **Tab bị ẩn giữa nhịp chớp** | Dừng animation, `blinkFactor.set(1.0)`, hủy timer. | Khi quay lại tab, mắt ở trạng thái mở bình thường và đợi lịch mới. |

---

## 12. Accessibility (Hỗ Trợ Tiếp Cận)

* Khi hệ điều hành hoặc trình duyệt bật chế độ `prefers-reduced-motion: reduce`:
  * `autoBlink` tự động bị vô hiệu hóa hoàn toàn (vì chớp mắt là chuyển động trang trí).
  * Mắt robot giữ nguyên độ mở tĩnh chuẩn xác theo biểu cảm hiện tại.
  * Không phát sinh bất kỳ timer ngầm nào.

---

## 13. Random Delay Utility (`blink-utils.ts`)

Tách hàm sinh số ngẫu nhiên thành pure utility function đơn giản, dễ kiểm thử:

```typescript
/**
 * Trả về khoảng thời gian ngẫu nhiên (ms) trong đoạn [min, max]
 */
export function getRandomBlinkDelay(min: number = 2500, max: number = 6000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

* Hàm thuần túy, không phụ thuộc React, không cần cài thêm thư viện.

---

## 14. Danh Sách File Dự Kiến Thay Đổi

### 14.1 File dự kiến tạo mới
* `fe/src/features/robot-face/hooks/useAutoBlink.ts`: Custom hook nội bộ quản lý `blinkFactor`, scheduler timer và visibility listener.
* `fe/src/features/robot-face/blink-utils.ts`: Pure helper sinh ngẫu nhiên khoảng delay chớp mắt.

### 14.2 File dự kiến chỉnh sửa
* `fe/src/features/robot-face/robot-face.types.ts`: Bổ sung prop `autoBlink?: boolean` vào `RobotFaceProps`.
* `fe/src/features/robot-face/hooks/useAnimatedFaceParameters.ts`: Tích hợp `useAutoBlink` để tính toán `effectiveEyeOpen` trước khi truyền vào `generateEyePath`.
* `fe/src/features/robot-face/components/RobotFace.tsx`: Nhận prop `autoBlink` và truyền vào hook.
* `fe/src/app/robot-face-lab/page.tsx`: Bổ sung checkbox `autoBlink` trong control panel.
* `fe/docs/ROBOT_FACE_ARCHITECTURE.md`: Cập nhật đặc tả kiến trúc FACE-03.
* `fe/docs/FACE_03_IMPLEMENTATION_PLAN.md`: Cập nhật trạng thái sau khi hoàn thành.

### 14.3 File tuyệt đối không được sửa
* ❌ `fe/package.json` và `package-lock.json` (không cài thêm thư viện).
* ❌ Toàn bộ mã nguồn Backend (`be/*`).
* ❌ Toàn bộ module Auth, Chatbot, Schedule, Scores, Mental-health, Goals, Settings.

---

## 15. Các Bước Implementation Theo Thứ Tự (Cho FACE-03B)

1. **Bước 1:** Tạo `fe/src/features/robot-face/blink-utils.ts` với hàm `getRandomBlinkDelay`.
2. **Bước 2:** Tạo hook nội bộ `fe/src/features/robot-face/hooks/useAutoBlink.ts` quản lý `blinkFactor`, recursive timeout và `visibilitychange`.
3. **Bước 3:** Cập nhật `robot-face.types.ts` bổ sung prop `autoBlink?: boolean`.
4. **Bước 4:** Cập nhật `useAnimatedFaceParameters.ts` kết nối `useAutoBlink` để tạo `effectiveEyeOpen`.
5. **Bước 5:** Cập nhật `RobotFace.tsx` tiếp nhận prop `autoBlink`.
6. **Bước 6:** Cập nhật trang `fe/src/app/robot-face-lab/page.tsx` thêm toggle `autoBlink`.
7. **Bước 7:** Chạy toàn bộ Verification (TypeScript, Production Build, Runtime checks).
8. **Bước 8:** Cập nhật tài liệu kiến trúc `ROBOT_FACE_ARCHITECTURE.md` và tạo báo cáo `TASK_FACE_03_STATUS_REPORT.md`.

---

## 16. Verification Plan Bắt Buộc

### 16.1 Automated Checks
* `npm run lint` (nếu script sẵn có).
* `npx tsc --noEmit` (xác thực 0 lỗi TypeScript, không dùng `any`).
* `npm run build` (xác thực Next.js production build pass 100%).

### 16.2 Runtime & Lifecycle Checks
* Xác thực không có lỗi console, không có hydration warning.
* Xác thực không có memory leak (kiểm tra timer được clear khi unmount component).
* Xác thực khi ẩn tab trình duyệt (`visibilitychange`), timer bị hủy và không chạy chớp mắt ngầm.

### 16.3 Visual Checks
* Mắt nhắm và mở đồng bộ 2 bên, nhịp chớp dứt khoát tự nhiên (~180ms), không bị cảm giác buồn ngủ (sleepy/sluggish).
* Đốm sáng phản quang trong mắt ẩn mượt khi nhắm và hiện lại khi mở.
* Kiểm tra đổi biểu cảm liên tục khi đang chớp mắt, xác nhận không bị méo path hay kẹt hình học.

---

## 17. Manual Visual Test Matrix

| STT | Kịch bản kiểm thử | Thao tác thực hiện | Kết quả kỳ vọng |
| :---: | :--- | :--- | :--- |
| 1 | **Nhịp chớp tự nhiên** | Mở `/robot-face-lab`, để yên robot ở biểu cảm `idle`. | Robot tự chớp mắt mỗi 2.5s – 6s, nhịp chớp nhanh (~180ms), 2 mắt đồng bộ. |
| 2 | **Bật/Tắt Auto Blink** | Bỏ chọn checkbox "Auto Blink" trên Lab. | Robot ngừng chớp mắt ngay lập tức, mắt giữ nguyên độ mở biểu cảm. |
| 3 | **Chớp mắt trên các biểu cảm khác** | Chọn lần lượt `happy`, `concerned`, `thinking`. | Mắt tự chớp bình thường trên cả 4 biểu cảm, mắt cong của `happy` khép theo vòng cung tự nhiên. |
| 4 | **Đổi biểu cảm khi đang chớp** | Bấm đổi biểu cảm nhanh khi mắt vừa bắt đầu nhắm. | Mắt mở ra khớp chính xác với biểu cảm mới, không gián đoạn hay giật hình. |
| 5 | **Kiểm tra Page Visibility** | Mở tab khác trong trình duyệt trong 10s rồi quay lại. | Không có chớp mắt ngầm trong lúc ẩn tab; khi quay lại mắt mở bình thường và đợi lịch mới. |
| 6 | **Kiểm tra Reduced Motion** | Bật `prefers-reduced-motion: reduce` trong DevTools Rendering. | Auto Blink tự động tắt hoàn toàn, mắt giữ nguyên độ mở tĩnh. |

---

## 18. Rủi Ro & Biện Pháp Phòng Ngừa

| Rủi ro tiềm ẩn | Mức độ | Biện pháp xử lý |
| :--- | :---: | :--- |
| **Xung đột giữa Expression Transition và Blink** | Thấp | Phân tách rõ ràng: `baseEyeOpen` (Smooth Tween) nhân với `blinkFactor` (Blink Trajectory). |
| **Mắt bị kẹt ở trạng thái nhắm dở dang khi unmount/ẩn tab** | Thấp | Hàm cleanup luôn gọi `blinkFactor.set(1.0)` cưỡng bức đưa mắt về trạng thái mở. |
| **Rò rỉ bộ nhớ timer (Memory Leak)** | Thấp | Dùng `useRef` lưu timer ID và dọn sạch trong `useEffect` cleanup. |

---

## 19. Rollback Strategy

Nếu phát sinh sự cố trong quá trình triển khai FACE-03B:
1. Xóa các file mới tạo:
   * `fe/src/features/robot-face/hooks/useAutoBlink.ts`
   * `fe/src/features/robot-face/blink-utils.ts`
2. Khôi phục các file chỉnh sửa bằng Git có mục tiêu:
   ```powershell
   git checkout -- fe/src/features/robot-face/robot-face.types.ts
   git checkout -- fe/src/features/robot-face/hooks/useAnimatedFaceParameters.ts
   git checkout -- fe/src/features/robot-face/components/RobotFace.tsx
   git checkout -- fe/src/app/robot-face-lab/page.tsx
   git checkout -- fe/docs/ROBOT_FACE_ARCHITECTURE.md
   ```
3. Đưa repository trở lại trạng thái FACE-02 ổn định mà không ảnh hưởng tới bất kỳ phần nào khác.

---

## 20. Documentation Update Plan

Sau khi hoàn thành và xác thực FACE-03B:
1. Cập nhật `fe/docs/ROBOT_FACE_ARCHITECTURE.md` ghi nhận hoàn thành Auto Blink.
2. Cập nhật trạng thái `fe/docs/FACE_03_IMPLEMENTATION_PLAN.md` thành `STATUS: IMPLEMENTED`.
3. Tạo báo cáo chi tiết `fe/docs/TASK_FACE_03_STATUS_REPORT.md`.

---

## 21. Definition of Done (DoD cho FACE-03)

* [ ] Robot tự động chớp mắt ngẫu nhiên sau mỗi 2.5s – 6s khi ở trạng thái rảnh.
* [ ] Thời lượng chớp mắt gọn gàng, tự nhiên (~180ms), 2 mắt đồng bộ hoàn hảo.
* [ ] Có prop `autoBlink?: boolean` (mặc định: `true`) cho phép bật/tắt linh hoạt.
* [ ] Tự động dừng khi tab bị ẩn (`document.visibilityState !== 'visible'`) và khôi phục khi tab active trở lại.
* [ ] Tự động tắt khi `prefers-reduced-motion` được bật hoặc khi `animated = false`.
* [ ] Hoạt động mượt mà không gây xung đột khi đổi biểu cảm hay kéo slider intensity.
* [ ] Zero React state update per frame, zero hydration warning, zero console error.
* [ ] `npx tsc --noEmit` và `npm run build` hoàn thành với Exit Code 0.
* [ ] Tài liệu kiến trúc và báo cáo tổng kết được cập nhật đầy đủ.

---

## 22. Open Questions Cần Người Dùng Xác Nhận

> [!NOTE]
> Kế hoạch đã thiết lập các thông số tối ưu cho trải nghiệm người dùng. Vui lòng xác nhận 2 điểm sau trước khi chuyển sang triển khai FACE-03B:

1. **Thông số nhịp chớp đề xuất:**
   * Khoảng nghỉ ngẫu nhiên: `2.5s – 6.0s`.
   * Thời lượng chớp mắt: `180ms` (nhắm `80ms`, mở `100ms`).
   * *Bạn có đồng ý với thông số timing này không?*
2. **Prop `autoBlink`:**
   * Mặc định bật `true` cho `RobotFaceProps`.
   * *Bạn có đồng ý với thiết lập mặc định này không?*

---

```text
STATUS: IMPLEMENTED — WAITING FOR VERIFICATION
```
