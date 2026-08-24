import { RobotExpression, RobotFaceEffect } from '../robot-face.types';
import { RobotFaceCommand } from '../controller/robot-face-controller.types';

export type RobotOperationalState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking';

export const VALID_OPERATIONAL_STATES: readonly RobotOperationalState[] = [
  'idle',
  'listening',
  'thinking',
  'speaking',
] as const;

export type RobotEmotion =
  | 'neutral'
  | 'happy'
  | 'encouraging'
  | 'concerned'
  | 'excited'
  | 'sleepy'
  | 'surprised';

export const VALID_ROBOT_EMOTIONS: readonly RobotEmotion[] = [
  'neutral',
  'happy',
  'encouraging',
  'concerned',
  'excited',
  'sleepy',
  'surprised',
] as const;

/**
 * Kết quả phân giải trực quan thuần túy từ Semantic Emotion
 */
export interface ResolvedEmotionVisual {
  expression: RobotExpression;
  effects: readonly RobotFaceEffect[];
}

/**
 * Snapshot trạng thái nền tảng đầy đủ cần được bảo toàn
 */
export interface OperationalBaseline {
  state: RobotOperationalState;
  expression: RobotExpression;
  intensity: number;
  effects: readonly RobotFaceEffect[];
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

export type RobotFaceEventStatus = 'accepted' | 'partial' | 'rejected';

/**
 * Kết quả xử lý sự kiện ngữ nghĩa
 */
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

/**
 * Mục lưu trong lịch sử sự kiện (History Inspector)
 */
export interface RobotFaceEventHistoryItem {
  id: string;
  timestamp: number;
  normalizedEvent?: RobotFaceEvent;
  inputSummary: string;
  result: RobotFaceEventResult;
}

/**
 * Giá trị trả về từ custom hook useRobotFaceEventBridge
 */
export interface UseRobotFaceEventBridgeReturn {
  /** Trạng thái vận hành hiện tại */
  operationalState: RobotOperationalState;
  /** Snapshot baseline hiện tại đang được duy trì */
  baseline: OperationalBaseline;

  /** Presentation state phái sinh cho RobotFace */
  expression: RobotExpression;
  intensity: number;
  /** Danh sách hiệu ứng trực quan đang active */
  effects: readonly RobotFaceEffect[];
  activeCommand: RobotFaceCommand | null;
  queue: readonly RobotFaceCommand[];

  /** Gửi sự kiện ngữ nghĩa vào hệ thống (nhận cả typed event hoặc unknown input) */
  dispatchEvent: (input: unknown) => RobotFaceEventResult;
  /** Đặt lại toàn bộ về Idle mặc định qua pipeline event */
  reset: () => RobotFaceEventResult;

  /** Lịch sử tối đa 10 sự kiện gần nhất */
  eventHistory: readonly RobotFaceEventHistoryItem[];
}
