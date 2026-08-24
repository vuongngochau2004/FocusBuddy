# Kế Hoạch Triển Khai FACE-05 (R1): Robot Face State Machine & Expression Controller

> **TRẠNG THÁI HIỆN TẠI:**  
> `STATUS: IMPLEMENTED — WAITING FOR VERIFICATION`

---

## 1. Current State Audit (Khảo Sát Hiện Trạng Codebase)

1. **Hệ thống hiển thị Robot Face hiện tại:**
   * `RobotFace.tsx` là presentation component thuần túy: nhận props `expression`, `intensity`, `size`, `className`, `animated`, `autoBlink`, `ambientMotion`.
   * `useAnimatedFaceParameters` quản lý 10 `MotionValue` cơ sở, Smooth Tween (0.32s), và kết hợp với `useAutoBlink` (2.5s–6.0s).
   * `useAmbientFaceMotion` quản lý vi chuyển động thở (4.0s) khi ở `expression === 'idle'`.
2. **Quản lý biểu cảm trong Robot Face Lab hiện tại:**
   * `RobotFaceLabPage` hiện đang quản lý biểu cảm qua React `useState<RobotExpression>('idle')` trực tiếp bằng các nút bấm thủ công. Chưa có cơ chế đặt thời lượng (duration), mức độ ưu tiên (priority), hàng đợi (queue) hay tự động trở về `idle`.
3. **Môi trường Dependencies & Testing:**
   * Dependencies: `next: 14.2.5`, `react: 18.3.1`, `framer-motion: ^11.3.0`, `typescript: ^5`. Không có test framework (Jest/Vitest) cài sẵn. Không cài thêm bất kỳ package nào ngoài danh mục hiện có.
4. **Đánh giá ranh giới kiến trúc:**
   * FACE-01 đến FACE-04 đã hoàn thiện toàn bộ tầng đồ họa hiển thị vector và animation (Presentation Layer).
   * FACE-05 xây dựng tầng điều phối sự kiện và trạng thái biểu cảm (**Controller / State Machine Layer**), tách biệt hoàn toàn với `RobotFace.tsx`.

---

## 2. Mục Tiêu và Non-Goals

### 2.1 Mục tiêu (In-Scope)
* Xây dựng controller điều phối biểu cảm với mô hình **Pure Reducer + Custom Hook**:
  * Giao diện nhận lệnh `send(input)`: chuẩn hóa dữ liệu, kiểm tra hợp lệ và trả về kết quả tiếp nhận `RobotFaceSendResult`.
  * Hỗ trợ thời gian duy trì biểu cảm (`durationMs`), tự động quay về `idle` hoặc kích hoạt lệnh kế tiếp khi hết hạn.
  * Hỗ trợ 4 mức ưu tiên: `low`, `normal`, `high`, `critical`.
  * Cơ chế ngắt quãng (Interruption): lệnh ưu tiên cao hơn hoặc bằng sẽ ngắt lệnh đang active (**Latest-Wins** cho cùng mức ưu tiên).
  * Hàng đợi biểu cảm (Queue): lưu trữ các lệnh ưu tiên thấp hơn (giới hạn tối đa 20 lệnh, giữ thứ tự FIFO theo từng mức ưu tiên).
  * Hỗ trợ lệnh vĩnh viễn (Persistent Command khi `durationMs === undefined`).
  * Các thao tác điều khiển: `dismiss()` (bỏ qua lệnh active để lấy lệnh kế tiếp trong hàng đợi) và `clear()` (xóa sạch hàng đợi và quay về `idle`).
  * Quản lý vòng đời timer chính xác: Timer chỉ được tạo/hủy khi danh tính của `activeCommand` thay đổi. Các thao tác chỉ thêm vào queue (Queue-only updates) không được reset timer hay thay đổi generation của active command.
* Tích hợp Controller vào Robot Face Lab với giao diện điều khiển lệnh, hiển thị active command, thông báo reject đơn giản và inspect hàng đợi.

### 2.2 Non-Goals (Tuyệt đối không triển khai trong FACE-05)
* ❌ Chưa kết nối Backend API hay WebSocket.
* ❌ Chưa định nghĩa semantic event mapping (để dành cho FACE-06).
* ❌ Chưa triển khai các trạng thái hoạt động `listening`, `speaking`, `sleeping`.
* ❌ Chưa thêm các hiệu ứng đồ họa mới (stars, tears, Zzz, blush particles).
* ❌ Chưa thêm biểu cảm mới ngoài 4 biểu cảm chuẩn (`idle`, `happy`, `concerned`, `thinking`).
* ❌ Chưa triển khai cử động môi khi nói (Lip sync), đảo mắt (Eye tracking), hoặc âm thanh.
* ❌ Chưa lưu trữ hàng đợi vào database hoặc localStorage.
* ❌ Không cài thêm Redux, Zustand, XState hay bất kỳ thư viện ngoài nào.

---

## 3. Ranh Giới Kiến Trúc (Architecture Boundary)

Tách bạch rõ ràng 2 tầng trách nhiệm:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG ĐIỀU PHỐI (Controller Layer)                                           │
│ useRobotFaceController (Hook) + robotFaceControllerReducer (Pure Reducer)    │
│ - Tiếp nhận RobotFaceCommandInput, validate và chuẩn hóa                    │
│ - Quyết định expression & intensity nào đang active                         │
│ - Quản lý priority, interruption, queue, duration timers                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ { expression, intensity }
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG TRÌNH DIỄN (Presentation Layer)                                        │
│ <RobotFace expression={...} intensity={...} animated autoBlink ambientMotion />
│ - Render SVG vector đồ họa                                                  │
│ - Quản lý MotionValues, Smooth Tween (0.32s), Auto Blink, Ambient Motion     │
│ - KHÔNG chứa logic queue, timer, hay priority                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Mô Hình Lệnh Biểu Cảm (Command Model & Types)

### 4.1 Định nghĩa Mức Độ Ưu Tiên (`RobotFacePriority`)
```typescript
export type RobotFacePriority = 'low' | 'normal' | 'high' | 'critical';

export const PRIORITY_WEIGHTS: Record<RobotFacePriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};
```

### 4.2 Tách biệt Input và Normalized Command
```typescript
/** Dữ liệu đầu vào do caller truyền vào send() */
export interface RobotFaceCommandInput {
  /** ID tùy chọn; nếu không truyền hook sẽ tự sinh ID duy nhất */
  id?: string;
  /** Biểu cảm mục tiêu */
  expression: RobotExpression;
  /** Cường độ biểu cảm từ 0 đến 1 (mặc định: 1.0) */
  intensity?: number;
  /** Thời gian duy trì tính bằng ms (> 0: temporary; undefined: persistent; <= 0 hoặc không finite: reject) */
  durationMs?: number;
  /** Mức độ ưu tiên của lệnh (mặc định: 'normal') */
  priority?: RobotFacePriority;
}

/** Cấu trúc lệnh đã được chuẩn hóa trong Controller */
export interface RobotFaceCommand {
  id: string;
  expression: RobotExpression;
  intensity: number;
  durationMs?: number;
  priority: RobotFacePriority;
}
```

*Không sử dụng trường `createdAt` vì hàng đợi dạng mảng tự nhiên bảo toàn thứ tự FIFO theo thứ tự chèn (insertion order).*

### 4.3 Kết Quả Trả Về Khi Gửi Lệnh (`RobotFaceSendResult`)
```typescript
export interface RobotFaceSendResult {
  /** Lệnh có được chấp nhận vào hệ thống (active hoặc queued) hay không */
  accepted: boolean;
  /** ID của command */
  commandId: string;
  /** Lý do bị từ chối nếu accepted === false */
  reason?: 'duplicate-id' | 'invalid-duration' | 'queue-full';
}
```

---

## 5. Quy Tắc Xác Thực ID & Duration (Validation Rules)

### 5.1 Quy tắc ID (ID Policy)
1. **Không truyền ID:** Hook tự động sinh chuỗi định danh duy nhất: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`.
2. **Có truyền ID:**
   * Nếu ID trùng với `activeCommand.id` hoặc trùng với bất kỳ command nào đang có trong `queue` $\rightarrow$ **Reject** với `reason: 'duplicate-id'`.
   * Không tự động đổi ID hay ghi đè command cũ.

### 5.2 Quy tắc Duration (Duration Validation)
* `durationMs === undefined`: Lệnh vĩnh viễn (**Persistent**), duy trì cho đến khi có lệnh ngắt hoặc bị dismiss/clear.
* `typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0`: Lệnh tạm thời (**Temporary**), duy trì trong `durationMs`.
* `durationMs <= 0`, `NaN`, `Infinity` hoặc không phải số: **Reject** với `reason: 'invalid-duration'`.
* Controller **không tự động gán default duration** nếu caller truyền `undefined`.

---

## 6. Trạng Thái Của Controller (Controller State)

```typescript
export interface RobotFaceControllerState {
  /** Lệnh đang được kích hoạt và hiển thị trên khuôn mặt (null = đang ở Idle mặc định) */
  activeCommand: RobotFaceCommand | null;
  /** Hàng đợi các lệnh đang chờ thực thi (theo thứ tự chèn) */
  queue: RobotFaceCommand[];
}
```

### Dữ liệu hiển thị phái sinh (Derived Presentation):
```typescript
const currentExpression: RobotExpression = state.activeCommand?.expression ?? 'idle';
const currentIntensity: number = state.activeCommand?.intensity ?? 1.0;
```

---

## 7. Các Hành Động Của Reducer (Reducer Actions)

Pure Reducer `robotFaceControllerReducer` xử lý các action:

```typescript
export type RobotFaceControllerAction =
  | { type: 'SEND_COMMAND'; command: RobotFaceCommand }
  | { type: 'COMPLETE_COMMAND'; commandId: string }
  | { type: 'DISMISS_ACTIVE' }
  | { type: 'CLEAR_ALL' };
```

---

## 8. Quy Tắc Ưu Tiên & Ngắt Quãng (Priority & Interruption Rules)

Khi có một lệnh hợp lệ $C_{\text{new}}$ được dispatch qua `SEND_COMMAND`:

```text
IF state.activeCommand == null:
    → C_new lập tức trở thành activeCommand.
    → queue giữ nguyên.

ELSE (Đang có activeCommand C_curr):
    IF PRIORITY_WEIGHTS[C_new.priority] > PRIORITY_WEIGHTS[C_curr.priority]:
        → Ngắt C_curr: C_new trở thành activeCommand mới.
        → C_curr bị loại bỏ (không đưa lại queue).
        → queue giữ nguyên.

    ELSE IF PRIORITY_WEIGHTS[C_new.priority] == PRIORITY_WEIGHTS[C_curr.priority]:
        → Latest-Wins: C_new ngắt C_curr và trở thành activeCommand mới.
        → C_curr bị loại bỏ (không đưa lại queue).
        → queue giữ nguyên.

    ELSE (PRIORITY_WEIGHTS[C_new.priority] < PRIORITY_WEIGHTS[C_curr.priority]):
        → C_curr tiếp tục là activeCommand (giữ nguyên identity).
        → C_new được đưa vào queue theo chính sách hàng đợi.
```

*Lưu ý: Latest-Wins chỉ áp dụng ngắt `activeCommand`. Lệnh mới không tự động xóa các lệnh cùng mức priority đang nằm trong queue.*

---

## 9. Chính Sách Hàng Đợi & Xử Lý Tràn (Queue & Overflow Policy)

### 9.1 Thứ tự lấy lệnh từ Queue (`activateNextFromQueue`)
Khi `activeCommand` hoàn thành hoặc bị dismiss:
1. Quét toàn bộ `state.queue` để tìm mức `priority` cao nhất hiện có.
2. Lấy **phần tử đầu tiên** đạt mức priority cao nhất đó (giữ trọn vẹn thứ tự FIFO theo thứ tự chèn).
3. Loại phần tử đó khỏi `queue` và đưa lên làm `activeCommand` mới.
4. Nếu `queue` rỗng $\rightarrow$ `activeCommand = null` (Robot tự động trở về `idle`).

### 9.2 Giới hạn và Chính sách tràn hàng đợi (Queue Overflow Policy)
* **Dung lượng tối đa:** **20 commands**.
* **Khi hàng đợi chưa đầy (< 20):** Chèn $C_{\text{new}}$ vào cuối mảng `queue`.
* **Khi hàng đợi đã đầy (== 20):**
  1. Quét tìm mức priority thấp nhất trong `queue` ($P_{\text{lowest}}$).
  2. Nếu $\text{PRIORITY\_WEIGHTS}[C_{\text{new}}.\text{priority}] \le \text{PRIORITY\_WEIGHTS}[P_{\text{lowest}}]$:
     * **Từ chối (Reject)** $C_{\text{new}}$ với `reason: 'queue-full'`.
  3. Nếu $\text{PRIORITY\_WEIGHTS}[C_{\text{new}}.\text{priority}] > \text{PRIORITY\_WEIGHTS}[P_{\text{lowest}}]$:
     * Tìm phần tử **được chèn muộn nhất (cuối cùng)** trong nhóm có priority $P_{\text{lowest}}$ và loại bỏ phần tử này (bảo tồn các phần tử cũ hơn trong nhóm đó để giữ FIFO).
     * Chèn $C_{\text{new}}$ vào `queue`.

---

## 10. Quản Lý Vòng Đời Timer Chính Xác (Timer Lifecycle & Race-condition Protection)

### 10.1 Nguyên tắc cách ly Timer Effect
* Timer cho thời gian duy trì của command **chỉ được tạo, hủy hoặc khởi động lại khi danh tính hoặc thời lượng của `activeCommand` thay đổi**.
* Các hành động chỉ cập nhật hàng đợi (Queue-only updates) giữ nguyên `state.activeCommand` và **không được làm khởi động lại timer của active command**.

### 10.2 Luồng điều khiển Timer trong Custom Hook
```typescript
useEffect(() => {
  // 1. Dọn dẹp timer cũ và tăng generation token
  if (timerRef.current !== null) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
  generationRef.current += 1;
  const currentGen = generationRef.current;

  // 2. Nếu không có activeCommand hoặc activeCommand là persistent
  if (!state.activeCommand || state.activeCommand.durationMs === undefined) {
    currentActiveIdRef.current = state.activeCommand?.id ?? null;
    return;
  }

  const activeId = state.activeCommand.id;
  const duration = state.activeCommand.durationMs;
  currentActiveIdRef.current = activeId;

  // 3. Đặt timeout cho temporary command
  timerRef.current = setTimeout(() => {
    if (
      currentGen === generationRef.current &&
      isMountedRef.current &&
      currentActiveIdRef.current === activeId
    ) {
      dispatch({ type: 'COMPLETE_COMMAND', commandId: activeId });
    }
  }, duration);

  return () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    generationRef.current += 1;
  };
}, [state.activeCommand?.id, state.activeCommand?.durationMs]);
```

### 10.3 Lớp bảo vệ bổ sung trong Reducer
Khi nhận action `{ type: 'COMPLETE_COMMAND', commandId }`:
* Reducer kiểm tra `state.activeCommand?.id === action.commandId`. Nếu không trùng khớp (ví dụ command đã bị ngắt trước khi callback kịp chạy), reducer sẽ bỏ qua action mà không làm thay đổi trạng thái.

### 10.4 Lưu ý về Page Visibility và Wall-Clock Time
* Duration được tính theo bộ đếm thời gian kể từ thời điểm command trở thành `active`.
* Trình duyệt có thể làm chậm (throttle) các hàm `setTimeout` khi tab bị ẩn trong nền. Callback khi được kích hoạt sau khi quay lại tab sẽ hoàn thành command hợp lệ. Hệ thống không tạo thêm visibility listener riêng cho controller.

---

## 11. Public Hook API (`useRobotFaceController`)

```typescript
export interface UseRobotFaceControllerReturn {
  /** Biểu cảm hiện tại để truyền vào RobotFace */
  expression: RobotExpression;
  /** Cường độ hiện tại để truyền vào RobotFace */
  intensity: number;
  /** Lệnh đang active (null nếu ở Idle mặc định) */
  activeCommand: RobotFaceCommand | null;
  /** Danh sách các lệnh đang chờ trong hàng đợi (Read-only) */
  queue: readonly RobotFaceCommand[];
  /** Gửi một lệnh biểu cảm mới, trả về kết quả tiếp nhận synchronous */
  send: (input: RobotFaceCommandInput) => RobotFaceSendResult;
  /** Bỏ qua lệnh active hiện tại và lấy lệnh kế tiếp trong queue */
  dismiss: () => void;
  /** Xóa toàn bộ hàng đợi và đưa robot về idle */
  clear: () => void;
}
```

---

## 12. Cấu Trúc File Dự Kiến

Module controller được tổ chức trong thư mục con `controller/`:

```text
fe/src/features/robot-face/
├── controller/
│   ├── robot-face-controller.types.ts   # Command types, Priority weights, State, Actions, SendResult
│   ├── robot-face-controller.reducer.ts # Pure Reducer không side-effect (FIFO scan & Eviction)
│   └── useRobotFaceController.ts        # Custom Hook quản lý timer lifecycle và validation
├── components/
│   └── RobotFace.tsx                    # Giữ nguyên presentation component thuần túy
├── hooks/
│   ├── useAnimatedFaceParameters.ts
│   ├── useAutoBlink.ts
│   └── useAmbientFaceMotion.ts
├── blink-utils.ts
├── expression-presets.ts
├── robot-face.types.ts
└── index.ts                             # Export RobotFace, useRobotFaceController, controller types
```

---

## 13. Tích Hợp Vào Robot Face Lab (`/robot-face-lab`)

Bổ sung một bảng điều khiển **"Expression Controller & Queue Inspector"** trên trang Lab:
1. **Form gửi Command:**
   * Chọn Biểu cảm: `idle`, `happy`, `concerned`, `thinking`.
   * Chọn Priority: `low`, `normal`, `high`, `critical`.
   * Chọn Duration: `2000ms`, `4000ms` (default form), `6000ms`, hoặc `Persistent`.
   * Input ID tùy chọn (để kiểm thử trùng ID).
   * Nút bấm: `Gửi Command (Send)`.
   * Thông báo phản hồi tại chỗ: Hiển thị tag thông báo nhỏ nếu lệnh bị reject (ví dụ: `⚠️ Bị từ chối: Duplicate ID`).
2. **Khu vực hiển thị Trạng thái Controller:**
   * Thẻ **Active Command**: Hiển thị ID, Biểu cảm, Priority, và cấu hình thời lượng (ví dụ: `Duration configured: 4000ms` hoặc `Persistent`). *Không hiển thị số giây đếm ngược countdown liên tục để tránh tạo state timer thừa cho UI.*
   * Danh sách **Queue Inspector**: Liệt kê các lệnh đang chờ theo thứ tự trong hàng đợi kèm tag priority.
3. **Các nút tác vụ nhanh:**
   * `Dismiss Active (Bỏ qua)`: Kết thúc lệnh active ngay lập tức.
   * `Clear All (Xóa hàng đợi)`: Đưa về Idle sạch sẽ.

---

## 14. Các Bước Implementation Theo Thứ Tự (Cho FACE-05B)

1. **Bước 1:** Tạo `fe/src/features/robot-face/controller/robot-face-controller.types.ts`.
2. **Bước 2:** Xây dựng pure reducer `fe/src/features/robot-face/controller/robot-face-controller.reducer.ts` với đầy đủ thuật toán `activateNextFromQueue` và eviction.
3. **Bước 3:** Xây dựng hook `fe/src/features/robot-face/controller/useRobotFaceController.ts` với validation synchronous, generation token và timer cleanup cô lập.
4. **Bước 4:** Cập nhật `fe/src/features/robot-face/index.ts` export `useRobotFaceController` và các public types.
5. **Bước 5:** Cập nhật trang `fe/src/app/robot-face-lab/page.tsx` tích hợp controller và bảng test command/queue.
6. **Bước 6:** Chạy toàn bộ Verification Suite (`npx tsc --noEmit`, `npm run build`, runtime checks).
7. **Bước 7:** Cập nhật tài liệu kiến trúc `ROBOT_FACE_ARCHITECTURE.md` và tạo báo cáo `TASK_FACE_05_STATUS_REPORT.md`.

---

## 15. Kịch Bản Kiểm Thử Xác Thực Mở Rộng (Verification Scenarios)

| STT | Kịch bản kiểm thử | Hành động kiểm thử | Kết quả kỳ vọng |
| :---: | :--- | :--- | :--- |
| 1 | **Kích hoạt từ Idle** | Gửi lệnh `happy` (`normal`, `3000ms`) khi đang ở Idle. | `happy` active ngay lập tức, sau 3s tự quay về `idle`. |
| 2 | **Lệnh ưu tiên cao hơn ngắt active** | Đang chạy `happy` (`normal`), gửi `concerned` (`high`). | `concerned` ngắt `happy` ngay lập tức, `happy` bị loại bỏ. |
| 3 | **Cùng mức ưu tiên (Latest-Wins)** | Đang chạy `happy` (`normal`), gửi `thinking` (`normal`). | `thinking` ngắt `happy` ngay, timer cũ bị hủy, timer mới kích hoạt. |
| 4 | **Lệnh ưu tiên thấp hơn vào queue** | Đang chạy `concerned` (`high`), gửi `happy` (`normal`). | `concerned` tiếp tục chạy, `happy` nằm trong queue chờ. |
| 5 | **Queue-only update không reset active timer** | Đang chạy `concerned` (5s), tại giây thứ 2 gửi 5 lệnh `low` vào queue. | `concerned` vẫn kết thúc đúng tại giây thứ 5, không bị reset thời gian. |
| 6 | **Thực thi hàng đợi theo Priority** | Queue có `happy` (`low`) và `thinking` (`high`). Khi active kết thúc. | `thinking` (`high`) được lấy lên trước `happy` (`low`). |
| 7 | **FIFO cho cùng mức Priority** | Queue có `happy` (`normal`) gửi trước, `concerned` (`normal`) gửi sau. | `happy` được lấy lên trước `concerned`. |
| 8 | **Lệnh vĩnh viễn (Persistent)** | Gửi `thinking` với `durationMs: undefined`. | Lệnh duy trì mãi mãi cho đến khi có lệnh ngắt hoặc bấm `Dismiss`. |
| 9 | **Thao tác `Dismiss Active`** | Đang có active command và queue có 1 lệnh chờ, bấm `Dismiss`. | Lệnh active dừng ngay, lệnh trong queue được kích hoạt. |
| 10 | **Thao tác `Clear All`** | Đang có active command và 3 lệnh trong queue, bấm `Clear All`. | Active command và queue bị xóa sạch, robot trở về `idle`. |
| 11 | **Bỏ qua COMPLETE action với ID cũ** | Lệnh A (5s) bị ngắt bởi Lệnh B (high) tại giây thứ 1. Đợi 4s sau. | Action complete của A bị reducer bỏ qua, không tắt Lệnh B. |
| 12 | **Từ chối Duplicate ID** | Gửi lệnh có `id: "cmd_123"` đang trùng với active command hoặc queued command. | `send()` trả về `accepted: false, reason: 'duplicate-id'`, không làm thay đổi state. |
| 13 | **Từ chối Duration không hợp lệ** | Gửi lệnh với `durationMs: 0`, `-100`, `NaN`, `Infinity`. | `send()` trả về `accepted: false, reason: 'invalid-duration'`, không thêm vào hệ thống. |
| 14 | **Hàng đợi đầy + lệnh mới priority thấp** | Queue đã đủ 20 lệnh, gửi lệnh có priority $\le$ priority thấp nhất trong queue. | `send()` trả về `accepted: false, reason: 'queue-full'`, queue giữ nguyên. |
| 15 | **Hàng đợi đầy + lệnh mới priority cao hơn** | Queue đủ 20 lệnh, gửi lệnh có priority cao hơn priority thấp nhất trong queue. | Lệnh mới được chấp nhận, lệnh muộn nhất trong nhóm priority thấp nhất bị evict. |
| 16 | **Tương thích React Strict Mode** | Mount/unmount trong Strict Mode. | Không nhân đôi timer, không có lỗi cập nhật state sau unmount. |

---

## 16. Rủi Ro & Biện Pháp Phòng Ngừa

| Rủi ro tiềm ẩn | Mức độ | Biện pháp xử lý |
| :--- | :---: | :--- |
| **Callback cũ chạy sau khi đổi command (Stale Timer)** | Trung bình | Kết hợp 3 lớp bảo vệ: `timerRef`, `generationRef` và kiểm tra `commandId` trong Reducer. |
| **Reset timer khi enqueue liên tục (Timer Jitter)** | Trung bình | `useEffect` chỉ phụ thuộc vào `[activeCommand?.id, activeCommand?.durationMs]`, không phụ thuộc vào `queue`. |
| **Tràn hàng đợi khi spam command (Queue Overflow)** | Thấp | Khống chế `MAX_QUEUE_SIZE = 20`, từ chối lệnh ưu tiên thấp khi đầy. |

---

## 17. Kế Hoạch Rollback

Nếu phát sinh sự cố trong quá trình triển khai FACE-05B:
1. Xóa thư mục controller mới tạo:
   * `fe/src/features/robot-face/controller/`
2. Kiểm tra cẩn thận và khôi phục các tệp chỉnh sửa theo danh sách cụ thể:
   * `fe/src/features/robot-face/index.ts`
   * `fe/src/app/robot-face-lab/page.tsx`
   * `fe/docs/ROBOT_FACE_ARCHITECTURE.md`
3. Đưa repository trở lại trạng thái FACE-04 ổn định.

---

## 18. Kế Hoạch Cập Nhật Tài Liệu (Documentation Updates)

Sau khi hoàn thành và xác thực FACE-05B:
1. Cập nhật `fe/docs/ROBOT_FACE_ARCHITECTURE.md` ghi nhận hoàn thành State Machine & Controller.
2. Cập nhật trạng thái `fe/docs/FACE_05_IMPLEMENTATION_PLAN.md` thành `STATUS: IMPLEMENTED`.
3. Tạo báo cáo chi tiết `fe/docs/TASK_FACE_05_STATUS_REPORT.md`.

---

## 19. Definition of Done (DoD cho FACE-05)

* [ ] Pure reducer `robotFaceControllerReducer` xử lý chính xác các action: `SEND_COMMAND`, `COMPLETE_COMMAND`, `DISMISS_ACTIVE`, `CLEAR_ALL`.
* [ ] Thuật toán hàng đợi chọn lệnh theo `priority` cao nhất và bảo toàn FIFO theo thứ tự chèn cho cùng priority.
* [ ] Validation đầu vào chặt chẽ: từ chối duplicate ID, duration không hợp lệ (`<= 0`, `NaN`, `Infinity`), và tràn hàng đợi.
* [ ] Timer lifecycle được cách ly chính xác: chỉ chạy khi `activeCommand` thay đổi, không bị reset khi có queue-only update.
* [ ] Hook `useRobotFaceController` cung cấp API sạch sẽ: `expression`, `intensity`, `activeCommand`, `queue`, `send`, `dismiss`, `clear`.
* [ ] Tích hợp bảng điều khiển gửi lệnh và queue inspector vào Robot Face Lab.
* [ ] `RobotFace.tsx` giữ nguyên là presentation component thuần túy, tương thích với Smooth Tween, Auto Blink, và Ambient Motion.
* [ ] `npx tsc --noEmit` và `npm run build` hoàn thành với Exit Code 0.
* [ ] Tài liệu kiến trúc và báo cáo tổng kết được cập nhật đầy đủ.

---

## 20. Open Questions

Kế hoạch R1 đã giải quyết toàn bộ các yêu cầu kiến trúc và chuẩn hóa validation theo đúng định hướng review. Không còn câu hỏi mở nào tồn tại trước khi chuyển sang triển khai FACE-05B.

---

```text
STATUS: IMPLEMENTED — WAITING FOR VERIFICATION
```
