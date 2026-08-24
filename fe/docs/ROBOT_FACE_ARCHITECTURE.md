# Kiến Trúc Khuôn Mặt Robot (Robot Face Architecture)

Tài liệu này mô tả kiến trúc nền tảng và đặc tả kỹ thuật cho hệ thống hiển thị và điều phối biểu cảm khuôn mặt của robot trợ lý học tập **FocusBuddy**.

---

## 1. Mục Tiêu của Robot Face

Khuôn mặt robot đóng vai trò là giao diện trực quan cảm xúc (visual emotional interface) giữa FocusBuddy và người học. Robot Face giúp:
* Biểu đạt trực quan trạng thái và cảm xúc của robot một cách sống động, tinh tế qua 8 biểu cảm vector chuyên biệt và hệ thống hiệu ứng phân tầng.
* Tăng tính tương tác sinh động, tạo sự đồng cảm và nâng cao động lực học tập cho người dùng.
* Hoạt động mượt mà trên cả giao diện Web máy tính và màn hình nhúng (Raspberry Pi/màn hình nhỏ) với độ trễ thấp và tài nguyên tối thiểu.

---

## 2. Mô Hình Phân Lớp Kiến Trúc 3 Tầng (3-Tier Architecture)

Hệ thống biểu cảm khuôn mặt robot được phân tách nghiêm ngặt thành 3 tầng độc lập:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. TẦNG SỰ KIỆN NGỮ NGHĨA (Semantic Event Layer - FACE-06 & FACE-07)        │
│ - useRobotFaceEventBridge (Custom Hook)                                     │
│ - Operational State: idle, listening, thinking, speaking                    │
│ - Transient Emotion (7): neutral, happy, encouraging, concerned, excited,   │
│                          sleepy, surprised                                  │
│ - Visual Mapper (mapEmotionToVisual): phân giải cả expression & effects     │
│ - Baseline Restoration Invariant: tự động phục hồi baseline (effects: [])   │
│ - Runtime Validator & Bounded Deduplication Registry (100 events)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ Dispatch RobotFaceCommand (expression, effects, intensity, ...)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. TẦNG ĐIỀU PHỐI (Controller / State Machine Layer - FACE-05 & FACE-07)    │
│ - useRobotFaceController (Custom Hook) & Pure Reducer                       │
│ - Command-Coupled Effects: effect đi cùng active command, tự động đồng bộ   │
│ - Priority rules (Latest-Wins cho cùng priority, ngắt quãng cho cao hơn)    │
│ - Queue FIFO (Tối đa 20 commands, Overflow Eviction)                        │
│ - Timer lifecycle cô lập & Synchronous stateRef admission                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ Cung cấp: { expression, intensity, effects }
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. TẦNG TRÌNH DIỄN (Presentation Layer - FACE-01 đến FACE-04 & FACE-07)     │
│ - <RobotFace expression={...} intensity={...} effects={...} ... />          │
│ - 8 Expression Presets: idle, happy, concerned, thinking, encouraging,      │
│                         excited, sleepy, surprised                          │
│ - 11 Tham số hình học FaceParameters (bổ sung mouthWidth: 14..36px)         │
│ - Smooth Tween Transition (0.32s) & Unified Continuous Mouth (M Q Q Z)      │
│ - Auto Blink đa profile: 'default' (180ms) và 'sleepy' (280ms)              │
│ - Ambient Micro-motion nhịp thở (4.0s, chỉ active khi idle)                 │
│ - Phân tầng Visual Effects: <RobotFaceEffects layer="background"|"foreground"│
│   (blush halo, stars lấp lánh, zzz bồng bềnh, sweat trên thái dương)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cấu Trúc Thư Mục & File

Module được tổ chức chuẩn theo Feature-based architecture trong Next.js:

```text
fe/
├── src/
│   ├── features/
│   │   └── robot-face/
│   │       ├── events/                              # TẦNG SỰ KIỆN NGỮ NGHĨA (FACE-06, FACE-07)
│   │       │   ├── robot-face-event.types.ts        # Semantic types (7 emotions), Baseline, Results
│   │       │   ├── robot-face-event.validation.ts   # Runtime validator nhận unknown (7 emotions)
│   │       │   ├── robot-face-event.mapper.ts       # Pure mapper (mapEmotionToVisual -> { expression, effects })
│   │       │   └── useRobotFaceEventBridge.ts       # Bridge Hook quản lý baseline invariant & clean effects
│   │       ├── controller/                          # TẦNG ĐIỀU PHỐI / STATE MACHINE (FACE-05, FACE-07)
│   │       │   ├── robot-face-controller.types.ts   # Command types kèm effects, Priority, State
│   │       │   ├── robot-face-controller.reducer.ts # Pure Reducer không side-effect (FIFO & Eviction)
│   │       │   └── useRobotFaceController.ts        # Hook quản lý timer lifecycle & activeEffects
│   │       ├── components/                          # TẦNG TRÌNH DIỄN (FACE-01 đến FACE-04, FACE-07)
│   │       │   ├── RobotFace.tsx                    # SVG Presentation Component chính
│   │       │   └── RobotFaceEffects.tsx             # Component render vector SVG cho visual effects
│   │       ├── hooks/
│   │       │   ├── useAnimatedFaceParameters.ts     # Hook quản lý 11 MotionValues & Derived Transforms
│   │       │   ├── useAutoBlink.ts                  # Hook Auto Blink đa profile ('default' | 'sleepy')
│   │       │   └── useAmbientFaceMotion.ts          # Hook vi chuyển động thở Ambient Breathing Motion
│   │       ├── blink-utils.ts                       # Utility timing constants & BLINK_PROFILES
│   │       ├── expression-presets.ts                # Dữ liệu 8 preset biểu cảm & hàm nội suy lerp
│   │       ├── robot-face.types.ts                  # TypeScript definitions (8 expressions, 4 effects)
│   │       └── index.ts                             # Public Barrel export
│   └── app/
│       └── robot-face-lab/
│           └── page.tsx                             # Màn hình kiểm thử toàn diện 3 chế độ (Lab Tester)
└── docs/
    ├── ROBOT_FACE_ARCHITECTURE.md                   # Tài liệu kiến trúc này
    ├── FACE_02_IMPLEMENTATION_PLAN.md               # Kế hoạch triển khai FACE-02
    ├── TASK_FACE_02_STATUS_REPORT.md                # Báo cáo tổng kết FACE-02
    ├── FACE_03_IMPLEMENTATION_PLAN.md               # Kế hoạch triển khai FACE-03
    ├── TASK_FACE_03_STATUS_REPORT.md                # Báo cáo tổng kết FACE-03
    ├── FACE_04_IMPLEMENTATION_PLAN.md               # Kế hoạch triển khai FACE-04
    ├── TASK_FACE_04_STATUS_REPORT.md                # Báo cáo tổng kết FACE-04
    ├── FACE_05_IMPLEMENTATION_PLAN.md               # Kế hoạch triển khai FACE-05
    ├── TASK_FACE_05_STATUS_REPORT.md                # Báo cáo tổng kết FACE-05
    ├── FACE_06_IMPLEMENTATION_PLAN.md               # Kế hoạch triển khai FACE-06
    ├── TASK_FACE_06_STATUS_REPORT.md                # Báo cáo tổng kết FACE-06
    ├── FACE_07_IMPLEMENTATION_PLAN.md               # Kế hoạch triển khai FACE-07 (R1)
    └── TASK_FACE_07_STATUS_REPORT.md                # Báo cáo tổng kết FACE-07
```

---

## 4. Danh Sách 8 Biểu Cảm Vector & 7 Cảm Xúc Ngữ Nghĩa

### 4.1 Bảng 8 Biểu Cảm Vector (`RobotExpression`)
| Expression | Ý nghĩa trải nghiệm | Mắt | Lông mày | Miệng | Má hồng | Glow |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `idle` | Nghỉ ngơi, bình tĩnh | Mở $0.85$ | Ngang $0^\circ$ | Khép $0.08$ | $0.15$ | $0.60$ |
| `happy` | Vui vẻ, hoàn thành tốt | Cong cười $0.85$ | Nhướng $+12^\circ$ | Cười tươi $0.90$ | $0.85$ | $0.95$ |
| `concerned` | Lo lắng, mất tập trung | Cụp $-0.35$ | Xụp $-18^\circ$ | Mếu $-0.65$ | $0.05$ | $0.50$ |
| `thinking` | Đang suy nghĩ, tư duy | Hơi nheo $0.70$ | Lệch $+22^\circ / -10^\circ$ | Lệch nhẹ $-0.20$ | $0.20$ | $0.75$ |
| `encouraging` | Cổ vũ, động viên ấm áp | Mở cong $0.55$ | Nhướng $+8^\circ$ | Cười nhẹ $0.65$ | $0.60$ | $0.80$ |
| `excited` | Hào hứng, ăn mừng lớn | Mở to cười $0.90$ | Nhướng cao $+16^\circ$ | Cười lớn $0.95$ | $0.95$ | $1.00$ |
| `sleepy` | Buồn ngủ, mí mắt nặng | Khép sụp $0.38$ | Thả lỏng $-8^\circ$ | Ngáp nhỏ $-0.10$ | $0.10$ | $0.35$ |
| `surprised` | Ngạc nhiên, bất ngờ | Tròn to $1.00$ | Nhướng cao $0^\circ$ | Chữ O $-0.25$ | $0.00$ | $0.90$ |

### 4.2 Bảng Ánh Xạ Semantic Emotion Sang Visual State
| Semantic Emotion | Expression | Default Effects | Ghi chú vòng đời |
| :--- | :---: | :---: | :--- |
| `neutral` | *Current Baseline* | `[]` | Quay về ngay trạng thái vận hành sạch |
| `happy` | `happy` | `['blush']` | Vui vẻ kèm má hồng phát quang |
| `encouraging` | `encouraging` | `['blush']` | Nụ cười động viên kèm má hồng ấm áp |
| `concerned` | `concerned` | `['sweat']` | Lo lắng kèm giọt mồ hôi trên thái dương |
| `excited` | `excited` | `['stars']` | Phấn khích kèm 4 ngôi sao vàng lấp lánh |
| `sleepy` | `sleepy` | `['zzz']` | Buồn ngủ kèm 3 ký hiệu Zzz bồng bềnh |
| `surprised` | `surprised` | `[]` | Mắt tròn xoe, miệng chữ O |

---

## 5. Kiến Trúc Visual Effects & Gắn Kết Vòng Đời Command

* **Gắn kết trực tiếp vào Command:** `RobotFaceCommand` lưu trữ trường `effects: readonly RobotFaceEffect[]`.
* **Đồng bộ vòng đời tự nhiên:**
  * Khi emotion kích hoạt $\rightarrow$ active command mang effects tương ứng $\rightarrow$ UI hiển thị effect.
  * Khi emotion 3.0s kết thúc $\rightarrow$ controller chuyển sang baseline (mang `effects: []`) $\rightarrow$ effect tự động biến mất sạch sẽ.
  * Khi nhận State Event, `neutral`, hoặc `reset` $\rightarrow$ baseline sạch được kích hoạt $\rightarrow$ xóa toàn bộ transient effects.
* **Phân lớp SVG hai tầng:**
  * `layer="background"`: Render ký hiệu `zzz` bay bên ngoài cụm ngũ quan.
  * `layer="foreground"`: Render `stars`, `sweat`, và `blush` halo bám theo cụm ngũ quan trong `<motion.g id="facial-content">`.

---

## 6. Khả Năng Tiếp Cận (Accessibility & Reduced Motion)

* Khi người dùng bật `prefers-reduced-motion`:
  * Transition thời gian giảm về $0.01\text{s}$.
  * Auto Blink và Ambient Breathing Motion tự động tắt.
  * Các loop animation xoay/bay/trượt của `stars`, `zzz`, `sweat`, `blush` dừng hoàn toàn.
  * Giữ một frame SVG tĩnh đại diện rõ ràng với `opacity: 0.85`, không gây nhấp nháy hay mỏi mắt.

---

## 7. Trạng Thái Hiện Tại & Lộ Trình Checkpoint

* **FACE-01 (Hoàn thành):** SVG Baseline Renderer tĩnh & Expression Presets.
* **FACE-02 (Hoàn thành):** Smooth Transition Animation qua Framer Motion MotionValues & Unified Mouth Topology.
* **FACE-03 (Hoàn thành):** Cơ chế tự động chớp mắt ngẫu nhiên (Auto Blink 2.5s–6.0s) & Page Visibility API.
* **FACE-04 (Hoàn thành):** Vi chuyển động thở nhẹ tự nhiên (Ambient Micro-motion chu kỳ 4.0s).
* **FACE-05 (Hoàn thành):** Robot Face State Machine & Expression Controller (`useRobotFaceController`, Priority, Latest-Wins, FIFO Queue 20).
* **FACE-06 (Hoàn thành):** Semantic Event Layer & Simulator (`useRobotFaceEventBridge`, Operational State, Transient Emotion, Baseline Invariant, Deduplication Registry).
* **FACE-07 (Hoàn thành):** Extended Robot Emotions & Layered Visual Effects (8 Expressions, 7 Emotions, `mouthWidth`, Sleepy Blink Profile, Layered Visual Effects: Stars, Zzz, Sweat, Blush).
