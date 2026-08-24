# Kế Hoạch Triển Khai FACE-07 (R1): Extended Robot Emotions & Layered Visual Effects

> **TRẠNG THÁI HIỆN TẠI:**  
> `STATUS: IMPLEMENTED — AUTOMATED VERIFICATION PASSED`

---

## 1. Revision Notes R1 (Các Điểm Hiệu Chỉnh Trong Phiên Bản R1)

1. **Gắn Kết Vòng Đời Effect Vào Command (Command-Coupled Effect Lifecycle):**
   * Mở rộng `RobotFaceCommandInput` và `RobotFaceCommand` thêm trường optional `effects?: readonly RobotFaceEffect[]` (mặc định `[]`).
   * Effect đi cùng với active command trong controller: khi command hết hạn, bị ngắt quãng hoặc khôi phục baseline, effect tự động chuyển đổi đồng bộ theo command mà không cần bộ đếm timer riêng.
2. **Pure Visual Mapper Trả Về Cả Expression & Effects:**
   * Thiết kế `ResolvedEmotionVisual = { expression: RobotExpression; effects: readonly RobotFaceEffect[] }`.
   * Semantic Bridge gửi cả `expression` và `effects` vào command; `OperationalBaseline` lưu `effects: []` để đảm bảo sau khi emotion kết thúc, khuôn mặt luôn trở về trạng thái vận hành sạch sẽ.
3. **Quy Tắc Rõ Ràng Cho `RobotFace` Effects Prop:**
   * `RobotFace` là presentation component thuần túy: không tự động suy đoán ngầm effect nếu caller không truyền.
   * Các call site cũ `<RobotFace expression="happy" intensity={1} />` giữ nguyên 100% hình ảnh ban đầu (không tự ý thêm overlay).
   * Caller (như Bridge hoặc Lab Gallery) chủ động truyền `effects` để hiển thị hiệu ứng mong muốn.
4. **Chuẩn Hóa Hành Vi Reduced Motion Duy Nhất:**
   * Khi `prefers-reduced-motion`: dừng toàn bộ vòng lặp (translate/rotate/pulse), giữ một frame SVG tĩnh đại diện (opacity `0.85`), không gây nhấp nháy, transition nhanh `0.01s`.
5. **Audit Chính Xác Công Thức Auto Blink & Cấu Hình Sleepy Profile:**
   * Xác minh công thức thực tế: $\text{effectiveEyeOpen} = \text{clamp}(\text{baseEyeOpen} \times \text{blinkFactor}, 0.08, 1.0)$.
   * Khi ở `sleepy` ($\text{baseEyeOpen} = 0.38$), mắt khép từ $0.38$ về giá trị chặn dưới $0.08$ một cách tự nhiên.
   * Bổ sung `RobotBlinkProfile = 'default' | 'sleepy'` giúp `sleepy` chớp mắt chậm rãi hơn ($0.28\text{s}$ thay vì $0.18\text{s}$).
6. **Audit Hình Học Miệng & Bổ Sung `mouthWidth` Cho Biểu Cảm `surprised`:**
   * Phân tích công thức `generateMouthPath`: `mouthCurvature = 0` tạo đáy cong nhưng đỉnh phẳng ngang.
   * Để tạo hình chữ O ngạc nhiên tròn trịa, mở rộng `FaceParameters` thêm `mouthWidth` (mặc định $28\text{px}$ cho 4 biểu cảm cũ để giữ nguyên hình học, $18\text{px}$ cho `surprised`).
7. **Phân Biệt Rõ Ràng Base Cheek Blush và Blush Enhancement Effect:**
   * `blushOpacity` trong preset: độ đỏ nền cơ sở của má.
   * `RobotFaceEffect = 'blush'`: quầng sáng phát quang tỏa rộng (halo) tăng cường cảm xúc.
8. **Phân Lớp SVG Render Hợp Lý:**
   * Tách effect layer thành background effect (Zzz bay bên ngoài) và foreground/facial effect (sao lấp lánh bám theo ngũ quan trong `facial-content`).

---

## 2. Source Audit Chi Tiết Mã Nguồn Hiện Tại

Dựa trên việc đọc trực tiếp mã nguồn thực tế tại:
* [`fe/src/features/robot-face/robot-face.types.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/robot-face.types.ts)
* [`fe/src/features/robot-face/expression-presets.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/expression-presets.ts)
* [`fe/src/features/robot-face/components/RobotFace.tsx`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/components/RobotFace.tsx)
* [`fe/src/features/robot-face/hooks/useAnimatedFaceParameters.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/hooks/useAnimatedFaceParameters.ts)
* [`fe/src/features/robot-face/hooks/useAutoBlink.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/hooks/useAutoBlink.ts)
* [`fe/src/features/robot-face/controller/robot-face-controller.types.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/controller/robot-face-controller.types.ts)
* [`fe/src/features/robot-face/events/robot-face-event.types.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/events/robot-face-event.types.ts)
* [`fe/src/features/robot-face/events/robot-face-event.mapper.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/events/robot-face-event.mapper.ts)
* [`fe/src/features/robot-face/events/useRobotFaceEventBridge.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/events/useRobotFaceEventBridge.ts)

### Kết quả audit kỹ thuật:
1. **Danh sách Expression hiện có:** `idle`, `happy`, `concerned`, `thinking`.
2. **Schema tham số `FaceParameters` hiện tại:** 10 tham số (`eyeOpen`, `eyeCurvature`, `leftEyebrowAngle`, `rightEyebrowAngle`, `leftEyebrowOffsetY`, `rightEyebrowOffsetY`, `mouthCurvature`, `mouthOpen`, `blushOpacity`, `glowIntensity`).
3. **Topology Miệng hiện tại (`generateMouthPath`):**
   * $\text{mouthHalfWidth} = 28 + |\text{curvature}| \times 6$.
   * $\text{leftX} = 200 - \text{mouthHalfWidth}, \text{rightX} = 200 + \text{mouthHalfWidth}$.
   * $\text{baseY} = 168 - \text{curvature} \times 3, \text{topControlY} = 168 + \text{curvature} \times 14$.
   * $\text{bottomControlY} = 168 + \text{curvature} \times 14 + (0.3 + \text{open} \times 22)$.
   * Khi $\text{curvature} = 0$, đỉnh phẳng ngang. Cần tham số `mouthWidth` để thu hẹp chiều ngang cho miệng ngạc nhiên `surprised`.
4. **Cơ chế Auto Blink hiện tại (`useAutoBlink`):**
   * `blinkFactor` animate $[1 \rightarrow 0 \rightarrow 1]$ trong $0.18\text{s}$ (đóng $80\text{ms}$, mở $100\text{ms}$).
   * $\text{effectiveEyeOpen} = \text{clamp}(\text{baseEyeOpen} \times \text{blinkFactor}, 0.08, 1.0)$.
5. **Controller Command Model hiện tại:**
   * `RobotFaceCommandInput = { id?, expression, intensity?, durationMs?, priority? }`.
   * `RobotFaceCommand = { id, expression, intensity, durationMs?, priority }`.
   * Cần mở rộng thêm `effects?: readonly RobotFaceEffect[]` để gắn kết vòng đời effect vào command.

---

## 3. Mục Tiêu và Non-Goals của FACE-07

### 3.1 Mục tiêu (In-Scope)
* Mở rộng `RobotExpression` từ 4 lên 8 biểu cảm vector hoàn chỉnh:
  * Giữ nguyên 4 biểu cảm cũ: `idle`, `happy`, `concerned`, `thinking`.
  * Thêm 4 biểu cảm mới: `encouraging`, `excited`, `sleepy`, `surprised`.
* Mở rộng `RobotEmotion` thành 7 cảm xúc ngữ nghĩa:
  * `neutral`, `happy`, `encouraging`, `concerned`, `excited`, `sleepy`, `surprised`.
  * Xóa bỏ các fallback tạm thời sang `happy`.
* Thiết kế hệ thống Visual Effects phân tầng (`RobotFaceEffect = 'blush' | 'stars' | 'zzz' | 'sweat'`):
  * Gắn kết lifecycle của effect vào controller command.
  * Tách component `<RobotFaceEffects>` render vector SVG nhẹ.
* Mở rộng `FaceParameters` thêm `mouthWidth` (mặc định $28\text{px}$) để tạo miệng chữ O hoàn hảo cho `surprised`.
* Bổ sung Sleepy Blink Profile cho biểu cảm `sleepy`.
* Nâng cấp toàn diện Robot Face Lab (Expression Gallery 8 mục, Effect Playground, Semantic Simulator).

### 3.2 Non-Goals (Không thuộc phạm vi FACE-07)
* ❌ Chưa kết nối Backend API, WebSocket, Redis, MQTT, hoặc Raspberry Pi.
* ❌ Không dùng Canvas, WebGL, Three.js, Video, hay GIF.
* ❌ Không làm cử động môi theo âm thanh (Lip sync phoneme), Eye tracking camera, hay Audio.
* ❌ Không tạo các biểu cảm ghép cứng kiểu `happy_blush`, `excited_stars`, `sleepy_zzz`.

---

## 4. Danh Sách Expression & Semantic Emotion Sau FACE-07

### 4.1 Danh sách 8 `RobotExpression`
```typescript
export type RobotExpression =
  | 'idle'
  | 'happy'
  | 'concerned'
  | 'thinking'
  | 'encouraging'
  | 'excited'
  | 'sleepy'
  | 'surprised';
```

### 4.2 Danh sách 7 `RobotEmotion` & Bảng Ánh Xạ Visual
```typescript
export type RobotEmotion =
  | 'neutral'
  | 'happy'
  | 'encouraging'
  | 'concerned'
  | 'excited'
  | 'sleepy'
  | 'surprised';

export interface ResolvedEmotionVisual {
  expression: RobotExpression;
  effects: readonly RobotFaceEffect[];
}
```

| Semantic Emotion | Resolved Expression | Default Command Effects | Ý nghĩa trải nghiệm |
| :--- | :---: | :---: | :--- |
| `neutral` | *Current Baseline* | `[]` | Trở về ngay trạng thái vận hành sạch |
| `happy` | `happy` | `['blush']` | Vui vẻ kèm má hồng |
| `encouraging` | `encouraging` | `['blush']` | Nụ cười động viên ấm áp |
| `concerned` | `concerned` | `['sweat']` | Lo lắng kèm giọt mồ hôi trên thái dương |
| `excited` | `excited` | `['stars']` | Phấn khích kèm sao lấp lánh quanh mắt |
| `sleepy` | `sleepy` | `['zzz']` | Buồn ngủ kèm ký hiệu Zzz bồng bềnh |
| `surprised` | `surprised` | `[]` | Mắt tròn to, miệng chữ O bất ngờ |

---

## 5. Đặc Tả Thiết Kế Trực Quan & Ma Trận Tham Số 11 Giá Trị

### 5.1 Bổ sung tham số `mouthWidth` vào `FaceParameters`
```typescript
export interface FaceParameters {
  eyeOpen: number;
  eyeCurvature: number;
  leftEyebrowAngle: number;
  rightEyebrowAngle: number;
  leftEyebrowOffsetY: number;
  rightEyebrowOffsetY: number;
  mouthCurvature: number;
  mouthOpen: number;
  mouthWidth: number; // MỚI: Bán chiều rộng miệng (14..36px, mặc định 28px)
  blushOpacity: number;
  glowIntensity: number;
}
```

### 5.2 Ma Trận Thông Số Preset (`FaceParameters Matrix`)

| Thông số hình học | `idle` | `happy` | `concerned` | `thinking` | `encouraging` | `excited` | `sleepy` | `surprised` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `eyeOpen` | `0.85` | `0.95` | `0.75` | `0.70` | **`0.88`** | **`1.00`** | **`0.38`** | **`1.00`** |
| `eyeCurvature` | `0.00` | `0.85` | `-0.35` | `0.20` | **`0.55`** | **`0.90`** | **`0.05`** | **`0.00`** |
| `leftEyebrowAngle` | `0°` | `12°` | `-18°` | `22°` | **`8°`** | **`16°`** | **`-8°`** | **`0°`** |
| `rightEyebrowAngle` | `0°` | `12°` | `-18°` | `-10°` | **`8°`** | **`16°`** | **`-8°`** | **`0°`** |
| `leftEyebrowOffsetY` | `0px` | `-4px` | `2px` | `-8px` | **`-3px`** | **`-8px`** | **`4px`** | **`-12px`** |
| `rightEyebrowOffsetY` | `0px` | `-4px` | `2px` | `4px` | **`-3px`** | **`-8px`** | **`4px`** | **`-12px`** |
| `mouthCurvature` | `0.08` | `0.90` | `-0.65` | `-0.20` | **`0.65`** | **`0.95`** | **`-0.10`** | **`-0.25`** |
| `mouthOpen` | `0.00` | `0.45` | `0.10` | `0.05` | **`0.15`** | **`0.85`** | **`0.30`** | **`0.95`** |
| `mouthWidth` | `28px` | `28px` | `28px` | `28px` | **`26px`** | **`32px`** | **`22px`** | **`18px`** |
| `blushOpacity` | `0.15` | `0.85` | `0.05` | `0.20` | **`0.60`** | **`0.95`** | **`0.10`** | **`0.00`** |
| `glowIntensity` | `0.60` | `0.95` | `0.50` | `0.75` | **`0.80`** | **`1.00`** | **`0.35`** | **`0.90`** |

*Ghi chú hình học:*
* Ở `surprised`: `mouthWidth: 18px` (thu hẹp từ 28px xuống 18px) kết hợp `mouthCurvature: -0.25` và `mouthOpen: 0.95` biến đổi đỉnh và đáy cong đều nhau $\rightarrow$ Tạo hình oval đứng chữ O hoàn hảo.
* 4 biểu cảm cũ (`idle`, `happy`, `concerned`, `thinking`) đều giữ `mouthWidth: 28px`, đảm bảo giữ nguyên 100% hình dạng miệng cũ.

---

## 6. Kiến Trúc Visual Effects & Gắn Kết Vòng Đời Command

### 6.1 Định nghĩa Types Hiệu Ứng
```typescript
export type RobotFaceEffect = 'blush' | 'stars' | 'zzz' | 'sweat';
```

### 6.2 Mở rộng Command trong Controller (Tương Thích Ngược)
```typescript
export interface RobotFaceCommandInput {
  id?: string;
  expression: RobotExpression;
  intensity?: number;
  durationMs?: number;
  priority?: RobotFacePriority;
  /** Danh sách hiệu ứng đi kèm (MỚI, tùy chọn, mặc định []) */
  effects?: readonly RobotFaceEffect[];
}

export interface RobotFaceCommand {
  id: string;
  expression: RobotExpression;
  intensity: number;
  durationMs?: number;
  priority: RobotFacePriority;
  effects: readonly RobotFaceEffect[];
}
```

### 6.3 Đồng Bộ Vòng Đời Effect Qua Controller & Baseline
* Khi gửi emotion command (ví dụ `excited` kèm `['stars']` trong 3s):
  * Controller lưu `effects: ['stars']` trong `activeCommand`.
  * Hook `useRobotFaceController` trả về `activeEffects: state.activeCommand?.effects ?? []`.
* Khi emotion 3s kết thúc:
  * Controller tự động kích hoạt `baseline` từ queue. Do `baseline.effects = []`, `activeEffects` lập tức chuyển về `[]` $\rightarrow$ Sao lấp lánh biến mất hoàn toàn.
* Khi nhận `state event`, `neutral`, hoặc `reset`:
  * Controller được clear và kích hoạt baseline mới với `effects: []` $\rightarrow$ Toàn bộ transient effects bị xóa sạch ngay lập tức.

---

## 7. Quy Tắc `RobotFace` Effects Prop & Component `<RobotFaceEffects>`

### 7.1 Semantics của `RobotFaceProps`
```typescript
export interface RobotFaceProps {
  expression?: RobotExpression;
  intensity?: number;
  size?: number;
  className?: string;
  animated?: boolean;
  autoBlink?: boolean;
  ambientMotion?: boolean;
  /** Hiệu ứng trực quan trang trí (Mặc định: []) */
  effects?: readonly RobotFaceEffect[];
}
```
* **Quy tắc:** `RobotFace` là component trình diễn thuần túy, render đúng danh sách `effects` được truyền vào sau khi deduplicate. Không tự động suy đoán ngầm effect nếu caller truyền `undefined` hoặc `[]`.
* **Tương thích ngược:** Các call site cũ `<RobotFace expression="happy" intensity={1} />` không truyền `effects` $\rightarrow$ render đúng hình ảnh cũ, không bị chèn overlay ngoài ý muốn.

### 7.2 Cấu trúc Component `<RobotFaceEffects>`
Tạo tệp `fe/src/features/robot-face/components/RobotFaceEffects.tsx` nhận:
```typescript
export interface RobotFaceEffectsProps {
  effects: readonly RobotFaceEffect[];
  intensity: number;
  reducedMotion: boolean;
}
```
* **Phân lớp SVG:**
  * **Layer Background (`#effect-background`):** Đặt ký hiệu `zzz` bay ở góc trên phải $(310 \rightarrow 345, 90 \rightarrow 45)$.
  * **Layer Foreground (`#effect-facial`):** Đặt bên trong `<motion.g id="facial-content">` để bám theo chuyển động ngũ quan:
    * `stars`: 4 ngôi sao 4 cánh màu vàng `#fde047` quanh mắt trái $(100, 75)$ và mắt phải $(300, 75)$.
    * `sweat`: 1 giọt mồ hôi màu xanh `#38bdf8` ở thái dương phải $(315, 80)$.
    * `blush`: 2 quầng sáng phát quang phụ trợ quanh má.
* **Tối ưu hóa hiệu năng:** Chỉ animate `transform` và `opacity`. Không animate `cx`, `cy`, `r`. Số lượng phần tử cố định (không random số lượng).

---

## 8. Quy Tắc Auto Blink & Cấu Hình Sleepy Profile

### 8.1 Khảo sát công thức Auto Blink
* Công thức: $\text{effectiveEyeOpen} = \text{clamp}(\text{baseEyeOpen} \times \text{blinkFactor}, 0.08, 1.0)$.
* Ở `sleepy` ($\text{baseEyeOpen} = 0.38$): khi `blinkFactor` chuyển từ $1.0 \rightarrow 0.0 \rightarrow 1.0$, $\text{effectiveEyeOpen}$ chuyển từ $0.38 \rightarrow 0.08 \rightarrow 0.38$.

### 8.2 Cấu hình Blink Profile
```typescript
export type RobotBlinkProfile = 'default' | 'sleepy';

export const BLINK_PROFILES: Record<
  RobotBlinkProfile,
  { totalDurationS: number; closeFraction: number; minDelayMs: number; maxDelayMs: number }
> = {
  default: {
    totalDurationS: 0.18,
    closeFraction: 0.44, // 80ms đóng, 100ms mở
    minDelayMs: 2500,
    maxDelayMs: 6000,
  },
  sleepy: {
    totalDurationS: 0.28, // Chớp mắt chậm rãi, mí mắt nặng
    closeFraction: 0.50, // 140ms đóng, 140ms mở
    minDelayMs: 3500,
    maxDelayMs: 8000,
  },
};
```
* `useAutoBlink(autoBlink, animated, profile = 'default')` tiếp nhận `profile` và tự động dọn dẹp timer khi chuyển đổi profile giữa các expression.

---

## 9. Quy Tắc Reduced Motion Duy Nhất

Khi `prefers-reduced-motion` được bật:
* Thời gian transition chuyển cảnh giảm về `0.01s`.
* Toàn bộ loop animation của effects (`stars` xoay, `zzz` bay, `sweat` trượt) **dừng hoàn toàn**.
* Giữ một frame SVG tĩnh đại diện rõ ràng với `opacity: 0.85`, không nhấp nháy, không giật màn hình.
* Auto Blink và Ambient Motion tự động tắt theo precedence hiện có.

---

## 10. Kế Hoạch Chỉnh Sửa Chi Tiết Theo Từng File (File-by-File Plan)

```text
fe/src/features/robot-face/
├── components/
│   ├── RobotFace.tsx                   # [MODIFY] Thêm mouthWidth, effects prop, nhúng RobotFaceEffects
│   └── RobotFaceEffects.tsx            # [NEW] Vector overlay render cho blush, stars, zzz, sweat
├── expression-presets.ts               # [MODIFY] Bổ sung mouthWidth cho 4 preset cũ, thêm 4 preset mới
├── robot-face.types.ts                 # [MODIFY] RobotExpression (8), FaceParameters (mouthWidth), RobotFaceEffect
├── hooks/
│   ├── useAnimatedFaceParameters.ts    # [MODIFY] Thêm MotionValue mouthWidth, hỗ trợ blinkProfile
│   └── useAutoBlink.ts                 # [MODIFY] Nhận thêm blinkProfile ('default' | 'sleepy')
├── controller/
│   ├── robot-face-controller.types.ts  # [MODIFY] Thêm effects vào RobotFaceCommandInput & Command
│   ├── robot-face-controller.reducer.ts# [MODIFY] Lưu trữ effects trong nextState
│   └── useRobotFaceController.ts       # [MODIFY] Normalizer nhận effects, expose activeEffects
├── events/
│   ├── robot-face-event.types.ts       # [MODIFY] Mở rộng RobotEmotion (7), OperationalBaseline (effects)
│   ├── robot-face-event.mapper.ts      # [MODIFY] mapEmotionToVisual trả về { expression, effects }
│   ├── robot-face-event.validation.ts  # [MODIFY] Chấp nhận sleepy, surprised
│   └── useRobotFaceEventBridge.ts      # [MODIFY] Dispatch command kèm effects, expose effects
└── index.ts                            # [MODIFY] Export 8 expressions, 7 emotions, effects, profiles
```

---

## 11. Nâng Cấp Robot Face Lab (`/robot-face-lab`)

1. **Expression Gallery (8 Biểu cảm):**
   * Hiển thị đầy đủ 8 biểu cảm: `🤖 Idle`, `😄 Happy`, `✨ Encouraging`, `🎉 Excited`, `😟 Concerned`, `🤔 Thinking`, `😴 Sleepy`, `😲 Surprised`.
2. **Effect Playground:**
   * Bảng công tắc thử nghiệm bật/tắt độc lập 4 hiệu ứng: `🌸 Blush`, `⭐ Stars`, `💤 Zzz`, `💧 Sweat`.
3. **Semantic Event Simulator:**
   * Bổ sung nút phát `Sleepy` và `Surprised`.
   * `Encouraging` kích hoạt biểu cảm vector riêng (`encouraging`) + `['blush']`.
   * `Excited` kích hoạt biểu cảm vector riêng (`excited`) + `['stars']`.
   * `Sleepy` kích hoạt `sleepy` + `['zzz']`.
   * `Concerned` kích hoạt `concerned` + `['sweat']`.

---

## 12. Tuyên Bố Tương Thích & Đánh Giá Rủi Ro

* **API Backward Compatibility:** 100% tương thích. Các props mới (`effects`) và command field mới đều là optional.
* **Visual Backward Compatibility:** 4 biểu cảm cũ (`idle`, `happy`, `concerned`, `thinking`) giữ nguyên hình học $100\%$ do `mouthWidth` cố định $28\text{px}$ và không tự động chèn effect overlay nếu caller không truyền.
* **Behavioral & Semantic Compatibility:** Baseline Restoration Invariant tiếp tục hoạt động chính xác, phục hồi đúng state và tự động xóa transient effects khi emotion kết thúc.

---

## 13. Ma Trận Kịch Bản Kiểm Thử Xác Thực Mở Rộng (Verification Matrix)

| STT | Kịch bản kiểm thử | Hành động kiểm thử | Kết quả kỳ vọng |
| :---: | :--- | :--- | :--- |
| 1 | **Hiển thị 8 Expression tĩnh** | Chọn lần lượt từng biểu cảm trong 8 biểu cảm trên Lab. | Cả 8 biểu cảm hiển thị đúng hình học, không méo path. |
| 2 | **Transition mượt giữa 8 biểu cảm** | Chuyển đổi: `idle` $\rightarrow$ `encouraging` $\rightarrow$ `excited` $\rightarrow$ `sleepy` $\rightarrow$ `surprised` $\rightarrow$ `concerned` $\rightarrow$ `idle`. | Chuyển cảnh mượt mà trong 0.32s, miệng khép/mở trơn tru. |
| 3 | **Miệng chữ O trên `surprised`** | Chọn `surprised` ở intensity `0.0`, `0.5`, `1.0`. | Miệng mở oval đứng chữ O tròn trịa, không bị đỉnh phẳng ngang. |
| 4 | **Auto Blink trên `sleepy`** | Ở `sleepy`, quan sát nhịp chớp mắt. | Chớp mắt với nhịp chậm rãi $0.28\text{s}$, khép mắt tự nhiên từ 0.38 về 0.08. |
| 5 | **Semantic Event `encouraging`** | Dispatch `{ type: 'emotion', emotion: 'encouraging' }`. | Robot hiển thị biểu cảm `encouraging` riêng biệt kèm má hồng. |
| 6 | **Semantic Event `excited`** | Dispatch `{ type: 'emotion', emotion: 'excited' }`. | Robot hiển thị `excited` kèm sao lấp lánh `stars`. |
| 7 | **Semantic Event `sleepy`** | Dispatch `{ type: 'emotion', emotion: 'sleepy' }`. | Robot hiển thị `sleepy` kèm ký hiệu `zzz`. |
| 8 | **Semantic Event `surprised`** | Dispatch `{ type: 'emotion', emotion: 'surprised' }`. | Robot hiển thị `surprised` miệng chữ O. |
| 9 | **Baseline Restoration Xóa Transient Effect** | Đang ở State `thinking` (50%), dispatch `excited` (3s). | Trong 3s robot hiển thị `excited` + sao; sau 3s sao biến mất và phục hồi đúng `thinking` (50%). |
| 10 | **Neutral Xóa Transient Effect** | Đang chạy `excited` (5s), dispatch `neutral`. | Sao biến mất ngay lập tức, robot quay về baseline. |
| 11 | **Reset Xóa Transient Effect** | Đang chạy `sleepy` kèm `zzz`, bấm `Reset System`. | Zzz biến mất ngay, robot về `idle` sạch sẽ. |
| 12 | **Khả năng Reduced Motion** | Bật chế độ Reduced Motion trong hệ điều hành/trình duyệt. | Animation loop dừng, effect hiển thị frame tĩnh không nhấp nháy. |

---

## 14. Kế Hoạch Rollback

Nếu phát sinh sự cố trong quá trình triển khai FACE-07B:
1. Xóa tệp component hiệu ứng mới tạo: `fe/src/features/robot-face/components/RobotFaceEffects.tsx`.
2. Khôi phục các tệp chỉnh sửa theo danh sách cụ thể:
   * `fe/src/features/robot-face/robot-face.types.ts`
   * `fe/src/features/robot-face/expression-presets.ts`
   * `fe/src/features/robot-face/components/RobotFace.tsx`
   * `fe/src/features/robot-face/hooks/useAnimatedFaceParameters.ts`
   * `fe/src/features/robot-face/hooks/useAutoBlink.ts`
   * `fe/src/features/robot-face/controller/robot-face-controller.types.ts`
   * `fe/src/features/robot-face/controller/robot-face-controller.reducer.ts`
   * `fe/src/features/robot-face/controller/useRobotFaceController.ts`
   * `fe/src/features/robot-face/events/robot-face-event.types.ts`
   * `fe/src/features/robot-face/events/robot-face-event.mapper.ts`
   * `fe/src/features/robot-face/events/robot-face-event.validation.ts`
   * `fe/src/features/robot-face/events/useRobotFaceEventBridge.ts`
   * `fe/src/features/robot-face/index.ts`
   * `fe/src/app/robot-face-lab/page.tsx`
   * `fe/docs/ROBOT_FACE_ARCHITECTURE.md`
3. Đưa repository trở lại trạng thái FACE-06 ổn định.

---

## 15. Definition of Done (DoD cho FACE-07)

* [ ] `RobotExpression` hỗ trợ đầy đủ 8 biểu cảm: `idle`, `happy`, `concerned`, `thinking`, `encouraging`, `excited`, `sleepy`, `surprised`.
* [ ] `FaceParameters` mở rộng thêm `mouthWidth`, định nghĩa thông số chính xác cho cả 8 biểu cảm.
* [ ] Component `<RobotFaceEffects>` render 4 hiệu ứng vector (`blush`, `stars`, `zzz`, `sweat`) nhẹ nhàng, tối ưu.
* [ ] Controller command lưu trữ `effects`, gắn kết vòng đời effect đồng bộ với active command.
* [ ] `RobotEmotion` hỗ trợ 7 cảm xúc ngữ nghĩa, xóa bỏ các fallback tạm thời.
* [ ] Baseline Restoration Invariant tiếp tục hoạt động hoàn hảo: phục hồi đúng state và xóa sạch transient effects sau khi emotion kết thúc.
* [ ] `useAutoBlink` hỗ trợ `sleepy` profile chớp mắt chậm rãi.
* [ ] Nâng cấp Robot Face Lab với Expression Gallery (8 mục), Effect Playground và Semantic Simulator mở rộng.
* [ ] `npx tsc --noEmit` và `npm run build` hoàn thành với Exit Code 0.
* [ ] Tài liệu kiến trúc và báo cáo tổng kết được cập nhật đầy đủ.

---

```text
STATUS: IMPLEMENTED — AUTOMATED VERIFICATION PASSED
```
