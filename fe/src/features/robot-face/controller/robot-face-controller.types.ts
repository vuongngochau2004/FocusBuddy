import { RobotExpression, RobotFaceEffect, normalizeRobotFaceEffects } from '../robot-face.types';

export type RobotFacePriority = 'low' | 'normal' | 'high' | 'critical';

export const PRIORITY_WEIGHTS: Record<RobotFacePriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

export const MAX_QUEUE_SIZE = 20;

/**
 * Dữ liệu đầu vào của lệnh biểu cảm do caller truyền vào
 */
export interface RobotFaceCommandInput {
  /** ID tùy chọn; nếu không truyền hook sẽ tự sinh ID duy nhất */
  id?: string;
  /** Biểu cảm mục tiêu */
  expression: RobotExpression;
  /** Cường độ biểu cảm từ 0 đến 1 (mặc định: 1.0) */
  intensity?: number;
  /** Thời gian duy trì tính bằng ms (> 0: temporary; undefined: persistent; <= 0 hoặc non-finite: reject) */
  durationMs?: number;
  /** Mức độ ưu tiên của lệnh (mặc định: 'normal') */
  priority?: RobotFacePriority;
  /** Danh sách hiệu ứng trực quan đi kèm (tùy chọn, mặc định: []) */
  effects?: readonly RobotFaceEffect[];
}

/**
 * Cấu trúc lệnh biểu cảm chuẩn hóa trong Controller
 */
export interface RobotFaceCommand {
  id: string;
  expression: RobotExpression;
  intensity: number;
  durationMs?: number;
  priority: RobotFacePriority;
  effects: readonly RobotFaceEffect[];
}

/**
 * Helper chuẩn hóa effects cho command
 */
export function normalizeCommandEffects(
  effects?: readonly RobotFaceEffect[]
): readonly RobotFaceEffect[] {
  return normalizeRobotFaceEffects(effects);
}

/**
 * Kết quả đồng bộ trả về khi gọi send()
 */
export interface RobotFaceSendResult {
  accepted: boolean;
  commandId: string;
  reason?: 'duplicate-id' | 'invalid-duration' | 'queue-full';
}

/**
 * Trạng thái của Robot Face Controller
 */
export interface RobotFaceControllerState {
  /** Lệnh đang được kích hoạt và hiển thị (null = Idle mặc định) */
  activeCommand: RobotFaceCommand | null;
  /** Hàng đợi các lệnh đang chờ thực thi theo thứ tự chèn */
  queue: RobotFaceCommand[];
}

/**
 * Actions của Pure Reducer
 */
export type RobotFaceControllerAction =
  | { type: 'SEND_COMMAND'; command: RobotFaceCommand }
  | { type: 'COMPLETE_COMMAND'; commandId: string }
  | { type: 'DISMISS_ACTIVE' }
  | { type: 'CLEAR_ALL' };

/**
 * Giá trị trả về từ custom hook useRobotFaceController
 */
export interface UseRobotFaceControllerReturn {
  /** Biểu cảm hiện tại để truyền vào RobotFace */
  expression: RobotExpression;
  /** Cường độ hiện tại để truyền vào RobotFace */
  intensity: number;
  /** Danh sách hiệu ứng đang active để truyền vào RobotFace */
  activeEffects: readonly RobotFaceEffect[];
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
