# Kế Hoạch Triển Khai FACE-06 (R2): Semantic Event Layer & Event Simulator

> **TRẠNG THÁI HIỆN TẠI:**  
> `STATUS: IMPLEMENTED — AUTOMATED VERIFICATION PASSED`

---

## 1. Revision Notes (Các Điểm Hiệu Chỉnh Trong Phiên Bản R2)

1. **Khắc phục Stale Snapshot trong `ensureBaseline`:** Loại bỏ hoàn toàn việc đọc `controller.activeCommand` hay `controller.queue` từ React render snapshot trong luồng dispatch đồng bộ. `ensureBaseline` luôn gọi trực tiếp `controller.send()` với ID deterministic; controller tự kiểm tra `stateRef.current` đồng bộ và trả về `duplicate-id` (coi là idempotent success) hoặc `accepted: true` (nếu cần xếp lịch mới).
2. **Bảo Toàn Toàn Bộ Baseline Snapshot (`OperationalBaseline`):** Lưu trữ đầy đủ `{ state, expression, intensity, commandId }` trong cả React state và `baselineRef`. Khi kết thúc emotion hoặc nhận neutral, robot phục hồi chính xác cả `expression` và `intensity` tùy chỉnh của baseline (ví dụ: `thinking` với `intensity: 0.5` phục hồi đúng `0.5`, không bị hard-code về `1.0`).
3. **Kiến Trúc Composition Của Bridge Hook:** `useRobotFaceEventBridge()` tự khởi tạo và đóng gói hoàn toàn một instance `useRobotFaceController()` bên trong, đồng thời export đầy đủ read-model (`expression`, `intensity`, `activeCommand`, `queue`, `operationalState`, `baseline`) cho presentation.
4. **Tách Biệt 2 Mode Trên Lab Đúng Chuẩn React Hook Lifecycle:** Tạo 2 sub-component độc lập `SemanticEventSimulator` và `RawControllerSimulator`. Mỗi sub-component sở hữu instance hook riêng, unmount sẽ tự động dọn dẹp timer và không gây ảnh hưởng chéo.
5. **Chuẩn Hóa Result Model Với Trạng Thái `Partial`:** Giới thiệu `status: 'accepted' | 'partial' | 'rejected'`. Trường hợp emotion đã active nhưng `ensureBaseline` thất bại (do queue full) được đánh dấu rõ là `partial` (`accepted: true`, `reason: 'baseline-restore-failed'`), không làm sai lệch trạng thái thực tế đang hiển thị trên khuôn mặt.
6. **Chính Sách Semantic Event ID & Deduplication:** Kiểm tra ID đầu vào (chuỗi tối đa 128 ký tự); lưu trữ bộ nhớ đệm `recentEventIds` (giới hạn 100 ID gần nhất) để từ chối các event trùng lặp từ mạng/caller (`reason: 'duplicate-event-id'`).
7. **Khởi Tạo Bridge Không Gây Side-Effect Trong Strict Mode:** Khởi tạo baseline tĩnh mà không dùng `useEffect` mount để gửi command thừa, tận dụng trạng thái idle mặc định của controller.
8. **Đồng Nhất Hóa `reset()` Qua Semantic Pipeline:** `reset()` được định nghĩa gọi trực tiếp `dispatchEvent({ type: 'reset', id: ... })`, đảm bảo mọi thao tác reset đều được validate, sinh ID, ghi history và trả result đồng nhất.

---

## 2. Audit Chi Tiết Mã Nguồn FACE-05 Hiện Tại (Source Code Audit)

Dựa trên việc đọc trực tiếp mã nguồn thực tế tại:
* [`fe/src/features/robot-face/controller/robot-face-controller.types.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/controller/robot-face-controller.types.ts)
* [`fe/src/features/robot-face/controller/robot-face-controller.reducer.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/controller/robot-face-controller.reducer.ts)
* [`fe/src/features/robot-face/controller/useRobotFaceController.ts`](file:///d:/DUT%20AI%20CLUB/PROJECT/FORCUS_BUDDY/FocusBuddy/fe/src/features/robot-face/controller/useRobotFaceController.ts)

### Các đặc tính kỹ thuật đã xác minh từ mã nguồn:
1. **Chữ ký hàm API thực tế:**
   * `send(input: RobotFaceCommandInput): RobotFaceSendResult`
   * `dismiss(): void`
   * `clear(): void`
2. **Cập nhật đồng bộ qua `stateRef.current`:**
   * `send()`: Đọc `stateRef.current`, tính toán `applySendCommand(currentState, command)`. Nếu `accepted`, cập nhật `stateRef.current = nextState` ngay lập tức trước khi gọi `dispatch({ type: 'SEND_COMMAND', command })`.
   * `clear()`: Hủy timer cũ, tăng generation token, gán `stateRef.current = { activeCommand: null, queue: [] }` ngay lập tức trước khi gọi `dispatch({ type: 'CLEAR_ALL' })`.
3. **Tính an toàn của chuỗi `clear()` + `send()` liên tiếp:**
   * Do `clear()` cập nhật `stateRef.current` đồng bộ về rỗng, lệnh `send()` kế tiếp trong cùng một event handler đọc ngay trạng thái rỗng này $\rightarrow$ `applySendCommand` kích hoạt command mới làm `activeCommand` và cập nhật `stateRef.current` chính xác $\rightarrow$ Chuỗi `clear(); send(baseline)` là **hoàn toàn an toàn, đồng bộ và nhất quán**.
4. **Hành vi Interruption & Latest-Wins:**
   * Khi lệnh mới có priority $\ge$ active priority: Active command cũ bị loại bỏ hoàn toàn (không đưa lại queue), timer cũ bị hủy, lệnh mới trở thành active.
5. **Phát hiện Duplicate ID:**
   * `normalizeCommandInput` và `applySendCommand` kiểm tra trùng lặp với `state.activeCommand?.id` và toàn bộ `state.queue.map(c => c.id)`. Nếu trùng $\rightarrow$ Từ chối với `reason: 'duplicate-id'`.
6. **Chính sách Queue Overflow:**
   * Tối đa 20 commands. Nếu đầy, chỉ chấp nhận lệnh mới nếu có priority cao hơn priority thấp nhất trong queue (loại bỏ lệnh muộn nhất trong nhóm lowest priority để giữ FIFO cho các lệnh cũ hơn).
7. **Cô lập Timer Lifecycle:**
   * `useEffect` chỉ theo dõi `[state.activeCommand?.id, state.activeCommand?.durationMs]`. Queue-only updates không kích hoạt effect và không làm reset timer active.

---

## 3. Mục Tiêu và Non-Goals của FACE-06

### 3.1 Mục tiêu (In-Scope)
* Xây dựng tầng ngữ nghĩa (Semantic Event Contract) phân tách:
  * **Operational State:** `idle`, `listening`, `thinking`, `speaking`.
  * **Transient Emotion:** `neutral`, `happy`, `encouraging`, `concerned`, `excited`.
  * **Reset Event:** Khôi phục trạng thái mặc định.
* Thiết kế bảng ánh xạ thuần túy (**Pure Mapping Table**) từ Semantic Events sang 4 biểu cảm vector hiện có (`idle`, `happy`, `concerned`, `thinking`).
* Đảm bảo cơ chế khôi phục trạng thái nền tảng (**Baseline Restoration Invariant**): Lưu trữ `OperationalBaseline` và tự động khôi phục cả biểu cảm lẫn cường độ ban đầu sau khi transient emotion hoàn thành.
* Xây dựng bộ validator và normalizer thuần túy nhận đầu vào `unknown` (type-safe runtime).
* Xây dựng Bridge Hook `useRobotFaceEventBridge` đóng gói controller và quản lý event history.
* Tách biệt 2 mode trên `/robot-face-lab` bằng các sub-component chuyên biệt (`SemanticEventSimulator` và `RawControllerSimulator`).

### 3.2 Non-Goals (Không thuộc phạm vi FACE-06)
* ❌ Chưa kết nối WebSocket, Backend API, Redis, MQTT, hoặc Raspberry Pi.
* ❌ Chưa thêm biểu cảm mới (`sleepy`, `surprised`) hay visual effects (stars, tears, Zzz, blush particles) — để dành cho FACE-07.
* ❌ Chưa triển khai cử động môi khi nói (Lip sync), đảo mắt (Eye tracking), hoặc âm thanh.
* ❌ Không cài thêm Redux, Zustand, XState, Zod hay bất kỳ package ngoài nào.

---

## 4. Hợp Đồng Sự Kiện Ngữ Nghĩa Thu Hẹp (Strict Semantic Event Contract)

```typescript
export type RobotOperationalState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking';

export type RobotEmotion =
  | 'neutral'
  | 'happy'
  | 'encouraging'
  | 'concerned'
  | 'excited';

/**
 * Snapshot trạng thái nền tảng đầy đủ cần được bảo toàn
 */
export interface OperationalBaseline {
  state: RobotOperationalState;
  expression: RobotExpression;
  intensity: number;
  commandId: string;
}

/**
 * Sự kiện thay đổi trạng thái vận hành nền tảng (Persistent, Priority: Normal)
 */
export interface RobotStateEvent {
  id?: string;
  type: 'state';
  state: RobotOperationalState;
  intensity?: number;
}

/**
 * Sự kiện cảm xúc tạm thời (Transient, Duration: >0, Priority: High)
 */
export interface RobotEmotionEvent {
  id?: string;
  type: 'emotion';
  emotion: RobotEmotion;
  intensity?: number;
  durationMs?: number;
}

/**
 * Sự kiện điều khiển đặt lại toàn bộ hệ thống
 */
export interface RobotResetEvent {
  id?: string;
  type: 'reset';
}

export type RobotFaceEvent =
  | RobotStateEvent
  | RobotEmotionEvent
  | RobotResetEvent;
```

---

## 5. Bảng Ánh Xạ Biểu Cảm Hiện Tại (Mapping Table)

### 5.1 Ánh Xạ Trạng Thái Vận Hành (Operational State Mapping)
| Operational State | Biểu Cảm Vector Hiện Tại | Ghi chú kiến trúc |
| :--- | :---: | :--- |
| `idle` | `idle` | Trạng thái nghỉ bình thường |
| `listening` | `idle` | Tạm thời dùng idle (FACE-07 sẽ thêm hiệu ứng lắng nghe) |
| `thinking` | `thinking` | Lông mày bất đối xứng tập trung suy tư |
| `speaking` | `idle` | Tạm thời dùng idle (FACE-07 sẽ thêm animation khẩu hình) |

### 5.2 Ánh Xạ Cảm Xúc (Emotion Mapping)
| Emotion | Biểu Cảm Vector Hiện Tại | Ghi chú kiến trúc |
| :--- | :---: | :--- |
| `neutral` | *Biểu cảm của Current Baseline* | Trở về ngay trạng thái vận hành nền tảng |
| `happy` | `happy` | Mắt cười cong, má hồng, miệng cười |
| `encouraging` | `happy` | Tạm thời dùng happy (FACE-07 sẽ tách biểu cảm riêng) |
| `concerned` | `concerned` | Mắt cau, khóe miệng trĩu xuống |
| `excited` | `happy` | Tạm thời dùng happy (FACE-07 sẽ thêm hiệu ứng phấn khích) |

---

## 6. Giá Trị Mặc Định & Quy Tắc Khởi Tạo Sự Kiện

| Loại sự kiện | `durationMs` | `priority` | `intensity` mặc định |
| :--- | :---: | :---: | :---: |
| **State Event** | `undefined` (Persistent) | `'normal'` (Cố định) | `1.0` (Clamp `[0, 1]`) |
| **Emotion Event** | `3000ms` (nếu không truyền) | `'high'` (Cố định) | `1.0` (Clamp `[0, 1]`) |
| **Reset Event** | — | — | — |

---

## 7. Ranh Giới Sở Hữu (Ownership Boundary) & Cấu Trúc Simulator Trên Lab

* **Nguyên tắc:** Khi sử dụng `useRobotFaceEventBridge`, Bridge là **Owner duy nhất** của controller instance đó.
* Các component nghiệp vụ hoặc production consumer chỉ tương tác qua `dispatchEvent(event)` và `reset()`. Tuyệt đối không gọi song song `controller.send()` trực tiếp trên cùng một controller instance.
* **Tách biệt trên Robot Face Lab:**
  * Component `SemanticEventSimulator`: Mount và gọi `useRobotFaceEventBridge()`.
  * Component `RawControllerSimulator`: Mount và gọi `useRobotFaceController()` riêng biệt.
  * Việc chuyển đổi giữa 2 tab sẽ mount/unmount component tương ứng, kích hoạt cleanup timer độc lập mà không gây xung đột state.

---

## 8. Cơ Chế `ensureBaseline` Khắc Phục Stale Snapshot & Luồng Xử Lý Sự Kiện

### 8.1 Thuật toán `ensureBaseline` Không Dùng Stale Snapshot
Để tránh lỗi đọc stale snapshot của React render cycle ngay sau khi `controller.send()` được gọi:
```text
FUNCTION ensureBaseline(baselineSnapshot, controller):
    // Luôn gửi baseline command deterministic trực tiếp vào controller
    result = controller.send({
        id: baselineSnapshot.commandId,
        expression: baselineSnapshot.expression,
        intensity: baselineSnapshot.intensity,
        priority: 'normal',
        durationMs: undefined
    })

    // 1. Controller chấp nhận và xếp vào queue -> Thành công
    IF result.accepted:
        RETURN { success: true }

    // 2. Controller từ chối vì trùng ID (baseline đã nằm sẵn trong queue từ trước) -> Idempotent success
    IF result.reason == 'duplicate-id':
        RETURN { success: true }

    // 3. Controller từ chối do nguyên nhân khác (ví dụ: queue-full) -> Thất bại
    RETURN { success: false, controllerReason: result.reason }
```

### 8.2 Luồng xử lý từng loại Event

#### A. State Event:
1. Validate input `unknown` & Normalize `RobotStateEvent`.
2. Kiểm tra trùng lặp `eventId` trong `recentEventIds` (tối đa 100 ID gần nhất). Nếu trùng $\rightarrow$ Reject `duplicate-event-id`.
3. Tạo `OperationalBaseline` mới: `{ state: event.state, expression: mapOperationalStateToExpression(event.state), intensity: event.intensity, commandId: "baseline_" + event.state }`.
4. Cập nhật đồng bộ `baselineRef.current` và React state `setBaseline`.
5. Gọi `controller.clear()` để dọn dẹp emotion/baseline cũ.
6. Gọi `controller.send({ id: newBaseline.commandId, expression: newBaseline.expression, intensity: newBaseline.intensity, priority: 'normal', durationMs: undefined })`.
7. Ghi nhận `eventId` vào `recentEventIds` và thêm mục vào `eventHistory`.

#### B. Transient Emotion Event (khác `neutral`):
1. Validate input `unknown` & Normalize `RobotEmotionEvent`.
2. Kiểm tra `eventId` trong `recentEventIds`. Nếu trùng $\rightarrow$ Reject `duplicate-event-id`.
3. Ánh xạ emotion sang expression mục tiêu: `mapEmotionToExpression(event.emotion, baselineRef.current.state)`.
4. Gửi lệnh emotion: `sendResult = controller.send({ id: eventId + ":emotion", expression: targetExpr, priority: 'high', durationMs: event.durationMs, intensity: event.intensity })`.
5. Nếu `!sendResult.accepted`:
   * Trả về `{ status: 'rejected', accepted: false, eventId, reason: 'controller-rejected', controllerReason: sendResult.reason }`.
6. Nếu `sendResult.accepted`:
   * Gọi `ensureBaseline(baselineRef.current, controller)`.
   * Nếu `ensureBaseline` thành công:
     * Trả về `{ status: 'accepted', accepted: true, eventId }`.
   * Nếu `ensureBaseline` thất bại (ví dụ queue-full):
     * Trả về `{ status: 'partial', accepted: true, eventId, reason: 'baseline-restore-failed', controllerReason: ensureResult.controllerReason }`.
7. Ghi nhận `eventId` vào `recentEventIds` và lưu kết quả vào `eventHistory`.

#### C. Neutral Emotion Event:
1. Validate input `unknown`.
2. Không tạo command `neutral` tạm thời có timer.
3. Gọi `controller.clear()` để kết thúc ngay emotion đang chạy.
4. Gửi lại baseline hiện tại: `controller.send({ id: baselineRef.current.commandId, expression: baselineRef.current.expression, intensity: baselineRef.current.intensity, priority: 'normal', durationMs: undefined })`.
5. Trả về `{ status: 'accepted', accepted: true, eventId }`, ghi nhận history.

#### D. Reset Event:
1. Gọi qua pipeline chung: `dispatchEvent({ type: 'reset', id: `evt_reset_${Date.now()}` })`.
2. Đặt `baselineRef.current = initialBaseline` (`idle`, `1.0`, `baseline_idle`).
3. Cập nhật state `setBaseline`.
4. Gọi `controller.clear()`.
5. Gửi `baseline_idle`: `controller.send({ id: "baseline_idle", expression: 'idle', intensity: 1.0, priority: 'normal', durationMs: undefined })`.
6. Ghi nhận entry Reset vào `eventHistory`.

---

## 9. Kiểm Tra Hợp Lệ & Chuẩn Hóa Dữ Liệu (Validation & Normalization)

### 9.1 Pure Runtime Validator (`robot-face-event.validation.ts`)
Nhận đầu vào kiểu `unknown` (đảm bảo an toàn cho dữ liệu từ API/WebSocket tương lai) và không làm thay đổi (mutate) dữ liệu:
```typescript
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateRobotFaceEvent(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Event must be a non-null object' };
  }

  const raw = input as Record<string, unknown>;
  
  if (raw.id !== undefined) {
    if (typeof raw.id !== 'string' || raw.id.trim() === '' || raw.id.length > 128) {
      return { valid: false, error: 'Event ID must be a non-empty string under 128 characters' };
    }
  }

  if (typeof raw.type !== 'string' || !['state', 'emotion', 'reset'].includes(raw.type)) {
    return { valid: false, error: 'Invalid or missing event type' };
  }

  if (raw.type === 'state') {
    if (typeof raw.state !== 'string' || !['idle', 'listening', 'thinking', 'speaking'].includes(raw.state)) {
      return { valid: false, error: 'Invalid operational state' };
    }
  }

  if (raw.type === 'emotion') {
    if (typeof raw.emotion !== 'string' || !['neutral', 'happy', 'encouraging', 'concerned', 'excited'].includes(raw.emotion)) {
      return { valid: false, error: 'Invalid emotion' };
    }
    if (raw.durationMs !== undefined) {
      if (typeof raw.durationMs !== 'number' || !Number.isFinite(raw.durationMs) || raw.durationMs <= 0) {
        return { valid: false, error: 'Emotion durationMs must be a finite positive number' };
      }
    }
  }

  if (raw.intensity !== undefined) {
    if (typeof raw.intensity !== 'number' || !Number.isFinite(raw.intensity)) {
      return { valid: false, error: 'Intensity must be a finite number' };
    }
  }

  return { valid: true };
}
```

### 9.2 Normalizer (`robot-face-event.mapper.ts`)
Tạo object mới đã được chuẩn hóa:
* `id`: Nếu có thì `id.trim()`, nếu không có thì sinh `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`.
* `intensity`: Clamp vào đoạn `[0.0, 1.0]`, mặc định `1.0`.
* `durationMs` (cho emotion): Mặc định `3000` nếu `undefined`.

---

## 10. Kết Quả Xử Lý Sự Kiện Mở Rộng (`RobotFaceEventResult`)

```typescript
export type RobotFaceEventStatus = 'accepted' | 'partial' | 'rejected';

export interface RobotFaceEventResult {
  /** Trạng thái xử lý 3 mức */
  status: RobotFaceEventStatus;
  /** True nếu primary event đã được thực thi (accepted hoặc partial) */
  accepted: boolean;
  /** ID của sự kiện */
  eventId: string;
  /** Lý do từ chối hoặc cảnh báo */
  reason?:
    | 'invalid-event'
    | 'duplicate-event-id'
    | 'controller-rejected'
    | 'baseline-restore-failed';
  /** Lý do chi tiết từ Controller FACE-05 nếu bị từ chối */
  controllerReason?: 'duplicate-id' | 'invalid-duration' | 'queue-full';
}
```

---

## 11. Public Bridge API & Simulator Trên Robot Face Lab

### 11.1 Public Hook Interface (`useRobotFaceEventBridge`)
```typescript
export interface RobotFaceEventHistoryItem {
  id: string;
  timestamp: number;
  event: RobotFaceEvent;
  result: RobotFaceEventResult;
}

export interface UseRobotFaceEventBridgeReturn {
  /** Trạng thái vận hành hiện tại */
  operationalState: RobotOperationalState;
  /** Snapshot baseline hiện tại đang được duy trì */
  baseline: OperationalBaseline;

  /** Presentation state phái sinh cho RobotFace */
  expression: RobotExpression;
  intensity: number;
  activeCommand: RobotFaceCommand | null;
  queue: readonly RobotFaceCommand[];

  /** Gửi sự kiện ngữ nghĩa vào hệ thống (nhận cả typed event hoặc unknown input) */
  dispatchEvent: (input: unknown) => RobotFaceEventResult;
  /** Đặt lại toàn bộ về Idle mặc định qua pipeline event */
  reset: () => RobotFaceEventResult;

  /** Lịch sử tối đa 10 sự kiện gần nhất */
  eventHistory: readonly RobotFaceEventHistoryItem[];
}
```

### 11.2 Giao diện Event Simulator trên `/robot-face-lab`
1. **Thẻ Semantic Status:**
   * Current Operational State: `thinking` (kèm badge màu).
   * Resolved Baseline: `thinking` (intensity: 50%).
   * Active Presentation: `happy` (đang hiển thị do emotion tạm thời).
   * Active Command ID & Queue Counter.
2. **Bảng phát State Event:** 4 nút bấm chuyển nhanh: `Idle`, `Listening`, `Thinking`, `Speaking` kèm intensity slider cho state.
3. **Bảng phát Emotion Event:** 5 nút bấm cảm xúc: `Neutral`, `Happy`, `Encouraging`, `Concerned`, `Excited` kèm chọn Duration: `2.0s`, `3.0s (Mặc định)`, `5.0s` *(Không có Persistent)*.
4. **Bảng Event History Inspector:** Liệt kê 10 sự kiện gần nhất kèm timestamp, event payload, và tag trạng thái `Accepted` (xanh), `Partial` (vàng), `Rejected` (đỏ).
5. **Nút Reset System:** Kích hoạt `reset()` và cập nhật history.

---

## 12. Ma Trận Kịch Bản Kiểm Thử Xác Thực Mở Rộng (Verification Matrix)

| STT | Kịch bản kiểm thử | Hành động kiểm thử | Kết quả kỳ vọng |
| :---: | :--- | :--- | :--- |
| 1 | **State Event: Idle $\rightarrow$ Listening** | Dispatch `{ type: 'state', state: 'listening' }`. | State chuyển sang `listening`, robot hiển thị `idle` (fallback). |
| 2 | **State Event: Listening $\rightarrow$ Thinking** | Dispatch `{ type: 'state', state: 'thinking' }`. | State chuyển sang `thinking`, robot hiển thị `thinking`. |
| 3 | **Emotion ngắt State rồi tự phục hồi** | Đang ở state `thinking`, dispatch emotion `happy` (3s). | Robot chuyển sang `happy` trong 3s; sau 3s tự phục hồi về `thinking`. |
| 4 | **Bảo toàn Custom Intensity của Baseline** | Set state `thinking` (intensity `0.5`), dispatch `happy` (intensity `1.0`, 3s). | Trong 3s robot hiển thị `happy` 100%, sau 3s trở về `thinking` với đúng intensity `50%`. |
| 5 | **Khắc phục Stale Snapshot** | State `thinking` đang active, dispatch `happy` 3s. | `thinking` baseline lập tức xuất hiện trong queue nội bộ của controller ngay sau lệnh dispatch. |
| 6 | **Hai Emotion liên tiếp trong cùng 1 tick** | Dispatch liên tiếp `happy` 3s và `concerned` 3s trong cùng event handler. | `concerned` active (Latest-Wins), queue chỉ chứa đúng 1 baseline của state hiện tại. |
| 7 | **State Event rồi Emotion Event trong cùng tick** | Dispatch state `speaking` rồi dispatch ngay `happy` 3s. | Emotion `happy` active, baseline trong queue phục hồi về đúng `speaking`. |
| 8 | **Spam nhiều Emotion liên tiếp** | Đang ở `thinking`, gửi liên tiếp 5 emotion `high`. | Emotion cuối cùng active, trong queue chỉ có tối đa 1 `baseline_thinking`. Khi hết hạn phục hồi đúng `thinking`. |
| 9 | **State Event ngắt Emotion đang chạy** | Đang chạy emotion `happy`, dispatch state event `idle`. | Emotion `happy` bị dừng ngay, robot chuyển thẳng về `idle`. |
| 10 | **Phát Neutral Emotion** | Đang chạy emotion `happy`, dispatch emotion `neutral`. | Robot lập tức dừng `happy` và trở về ngay current operational baseline. |
| 11 | **Phát Reset Event** | Đang ở state `thinking` + emotion `happy`, dispatch `{ type: 'reset' }` hoặc gọi `reset()`. | Toàn bộ bị xóa, state về `idle`, robot hiển thị `idle`, history ghi nhận reset entry. |
| 12 | **Từ chối Duplicate Event ID** | Dispatch event với custom ID `evt_01` hai lần liên tiếp. | Lần 2 bị reject với `reason: 'duplicate-event-id'`, `status: 'rejected'`, không làm đổi state. |
| 13 | **Xử lý Partial Failure khi Queue Full** | Giả lập controller queue full và dispatch emotion mới. | Emotion active, kết quả trả về `status: 'partial'`, `reason: 'baseline-restore-failed'`. |
| 14 | **Từ chối Event sai định dạng / Duration $\le 0$ / NaN Intensity** | Dispatch event có payload lỗi. | Trả về `status: 'rejected'`, `reason: 'invalid-event'`, không mutate controller. |
| 15 | **Chuyển đổi 2 Mode trên Lab** | Chuyển qua lại giữa Semantic Simulator và Raw Controller Simulator. | Mode cũ unmount dọn dẹp timer, mode mới mount độc lập không bị ảnh hưởng chéo. |

---

## 13. Cấu Trúc File Dự Kiến

```text
fe/src/features/robot-face/
├── events/
│   ├── robot-face-event.types.ts       # Semantic types, Event discriminated unions, Results, History
│   ├── robot-face-event.mapper.ts      # Pure mapping functions & normalizer
│   ├── robot-face-event.validation.ts  # Pure type guards & validator nhận unknown
│   └── useRobotFaceEventBridge.ts      # Custom Hook Bridge đóng gói controller & baseline invariant
├── controller/
│   ├── robot-face-controller.types.ts
│   ├── robot-face-controller.reducer.ts
│   └── useRobotFaceController.ts
├── components/
│   └── RobotFace.tsx                   # Giữ nguyên presentation component thuần túy
├── hooks/
│   ├── useAnimatedFaceParameters.ts
│   ├── useAutoBlink.ts
│   └── useAmbientFaceMotion.ts
├── blink-utils.ts
├── expression-presets.ts
├── robot-face.types.ts
└── index.ts                            # Export RobotFace, controllers, events & bridge
```

---

## 14. Các Bước Implementation Theo Thứ Tự (Cho FACE-06B)

1. **Bước 1:** Tạo `fe/src/features/robot-face/events/robot-face-event.types.ts`.
2. **Bước 2:** Tạo `fe/src/features/robot-face/events/robot-face-event.validation.ts` với validator nhận `unknown`.
3. **Bước 3:** Tạo `fe/src/features/robot-face/events/robot-face-event.mapper.ts` với mapping functions và normalizer.
4. **Bước 4:** Tạo hook `fe/src/features/robot-face/events/useRobotFaceEventBridge.ts` đóng gói `useRobotFaceController`, quản lý `baselineRef`, deduplication registry, và `ensureBaseline` không dùng stale snapshot.
5. **Bước 5:** Cập nhật `fe/src/features/robot-face/index.ts` export các semantic types và `useRobotFaceEventBridge`.
6. **Bước 6:** Cập nhật trang `fe/src/app/robot-face-lab/page.tsx` tách thành 2 sub-component `SemanticEventSimulator` và `RawControllerSimulator`.
7. **Bước 7:** Chạy toàn bộ Verification Suite (`npx tsc --noEmit`, `npm run build`, runtime checks).
8. **Bước 8:** Cập nhật tài liệu kiến trúc `ROBOT_FACE_ARCHITECTURE.md` và tạo báo cáo `TASK_FACE_06_STATUS_REPORT.md`.

---

## 15. Định Hướng Mở Rộng Cho FACE-07

* **FACE-06:** Hoàn thiện nền tảng Semantic Event Contract, Bridge Hook, Baseline Invariant và Simulator với 4 biểu cảm vector hiện có.
* **FACE-07 (Dự kiến):** Bổ sung đồ họa vector cho các biểu cảm mở rộng:
  * `encouraging` (ánh mắt khích lệ, nụ cười nhẹ).
  * `excited` (mắt sao lấp lánh, miệng cười lớn).
  * `sleepy` (mí mắt rũ, hiệu ứng Zzz).
  * `surprised` (mắt mở to tròn, miệng chữ O).
  * Cập nhật mapper từ fallback sang biểu cảm vector chuyên biệt.

---

## 16. Kế Hoạch Rollback

Nếu phát sinh sự cố trong quá trình triển khai FACE-06B:
1. Xóa thư mục events mới tạo: `fe/src/features/robot-face/events/`.
2. Khôi phục các tệp chỉnh sửa theo danh sách cụ thể:
   * `fe/src/features/robot-face/index.ts`
   * `fe/src/app/robot-face-lab/page.tsx`
   * `fe/docs/ROBOT_FACE_ARCHITECTURE.md`
3. Đưa repository trở lại trạng thái FACE-05 ổn định.

---

## 17. Definition of Done (DoD cho FACE-06)

* [ ] Semantic Event Contract (`RobotStateEvent`, `RobotEmotionEvent`, `RobotResetEvent`) được định nghĩa chặt chẽ.
* [ ] Pure validator kiểm tra hợp lệ dữ liệu runtime nhận `unknown` không mutate đầu vào.
* [ ] Pure mapper ánh xạ chính xác và normalizer gán default đúng quy tắc.
* [ ] Bridge Hook `useRobotFaceEventBridge` đóng gói controller, bảo toàn đầy đủ `OperationalBaseline` (`state`, `expression`, `intensity`).
* [ ] Thuật toán `ensureBaseline` không đọc stale React render snapshot trong luồng đồng bộ, xử lý idempotent qua `duplicate-id`.
* [ ] Hỗ trợ phân loại kết quả 3 mức: `accepted`, `partial`, `rejected`.
* [ ] Hỗ trợ Semantic Event ID Deduplication (bộ nhớ đệm 100 ID gần nhất).
* [ ] Tách biệt 2 mode trên Robot Face Lab thành 2 sub-component độc lập (`SemanticEventSimulator` và `RawControllerSimulator`).
* [ ] `RobotFace.tsx` và `useRobotFaceController` giữ nguyên ranh giới kiến trúc độc lập.
* [ ] `npx tsc --noEmit` và `npm run build` hoàn thành với Exit Code 0.
* [ ] Tài liệu kiến trúc và báo cáo tổng kết được cập nhật đầy đủ.

---

```text
STATUS: IMPLEMENTED — AUTOMATED VERIFICATION PASSED
```
