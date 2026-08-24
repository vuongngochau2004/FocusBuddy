import { RobotExpression } from '../robot-face.types';
import {
  RobotOperationalState,
  RobotEmotion,
  RobotFaceEvent,
  RobotStateEvent,
  RobotEmotionEvent,
  RobotResetEvent,
  OperationalBaseline,
  ResolvedEmotionVisual,
} from './robot-face-event.types';

/**
 * Ánh xạ trạng thái vận hành sang biểu cảm vector (Pure mapping function)
 */
export function mapOperationalStateToExpression(
  state: RobotOperationalState
): RobotExpression {
  switch (state) {
    case 'idle':
      return 'idle';
    case 'listening':
      return 'idle';
    case 'thinking':
      return 'thinking';
    case 'speaking':
      return 'idle';
    default:
      return 'idle';
  }
}

/**
 * Ánh xạ toàn diện cảm xúc sang biểu cảm và hiệu ứng trực quan tương ứng (Pure visual mapping)
 */
export function mapEmotionToVisual(
  emotion: RobotEmotion,
  currentBaseline: OperationalBaseline
): ResolvedEmotionVisual {
  switch (emotion) {
    case 'neutral':
      return {
        expression: currentBaseline.expression,
        effects: [],
      };
    case 'happy':
      return {
        expression: 'happy',
        effects: ['blush'],
      };
    case 'encouraging':
      return {
        expression: 'encouraging',
        effects: ['blush'],
      };
    case 'concerned':
      return {
        expression: 'concerned',
        effects: ['sweat'],
      };
    case 'excited':
      return {
        expression: 'excited',
        effects: ['stars'],
      };
    case 'sleepy':
      return {
        expression: 'sleepy',
        effects: ['zzz'],
      };
    case 'surprised':
      return {
        expression: 'surprised',
        effects: [],
      };
    default:
      return {
        expression: currentBaseline.expression,
        effects: [],
      };
  }
}

/**
 * Ánh xạ cảm xúc sang biểu cảm vector (Helper thuần túy)
 */
export function mapEmotionToExpression(
  emotion: RobotEmotion,
  currentBaseline: OperationalBaseline
): RobotExpression {
  return mapEmotionToVisual(emotion, currentBaseline).expression;
}

/**
 * Chuẩn hóa sự kiện đầu vào đã qua bước validate (Pure Normalizer tạo object mới)
 */
export function normalizeRobotFaceEvent(raw: unknown): RobotFaceEvent {
  const obj = raw as Record<string, unknown>;

  // Chuẩn hóa ID
  let id: string;
  if (typeof obj.id === 'string' && obj.id.trim() !== '') {
    id = obj.id.trim();
  } else {
    id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  // Chuẩn hóa intensity
  let intensity = 1.0;
  if (typeof obj.intensity === 'number' && Number.isFinite(obj.intensity)) {
    intensity = Math.max(0, Math.min(1, obj.intensity));
  }

  if (obj.type === 'state') {
    const stateEvent: RobotStateEvent = {
      id,
      type: 'state',
      state: obj.state as RobotOperationalState,
      intensity,
    };
    return stateEvent;
  }

  if (obj.type === 'emotion') {
    let durationMs = 3000;
    if (typeof obj.durationMs === 'number' && Number.isFinite(obj.durationMs) && obj.durationMs > 0) {
      durationMs = obj.durationMs;
    }

    const emotionEvent: RobotEmotionEvent = {
      id,
      type: 'emotion',
      emotion: obj.emotion as RobotEmotion,
      intensity,
      durationMs,
    };
    return emotionEvent;
  }

  const resetEvent: RobotResetEvent = {
    id,
    type: 'reset',
  };
  return resetEvent;
}
