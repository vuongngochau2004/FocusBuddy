import { VALID_ROBOT_EMOTIONS, VALID_OPERATIONAL_STATES } from './robot-face-event.types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Kiểm tra hợp lệ dữ liệu sự kiện lúc chạy (Pure runtime validator nhận unknown)
 * Không làm thay đổi (mutate) đối tượng đầu vào.
 */
export function validateRobotFaceEvent(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Event must be a non-null object' };
  }

  const raw = input as Record<string, unknown>;

  // 1. Kiểm tra ID tùy chọn
  if (raw.id !== undefined) {
    if (typeof raw.id !== 'string' || raw.id.trim() === '' || raw.id.length > 128) {
      return {
        valid: false,
        error: 'Event ID must be a non-empty string under 128 characters',
      };
    }
  }

  // 2. Kiểm tra type
  if (typeof raw.type !== 'string' || !['state', 'emotion', 'reset'].includes(raw.type)) {
    return { valid: false, error: 'Invalid or missing event type' };
  }

  // 3. Kiểm tra State Event
  if (raw.type === 'state') {
    if (
      typeof raw.state !== 'string' ||
      !VALID_OPERATIONAL_STATES.includes(raw.state as any)
    ) {
      return { valid: false, error: 'Invalid operational state' };
    }
  }

  // 4. Kiểm tra Emotion Event
  if (raw.type === 'emotion') {
    if (
      typeof raw.emotion !== 'string' ||
      !VALID_ROBOT_EMOTIONS.includes(raw.emotion as any)
    ) {
      return { valid: false, error: 'Invalid emotion' };
    }

    if (raw.durationMs !== undefined) {
      if (
        typeof raw.durationMs !== 'number' ||
        !Number.isFinite(raw.durationMs) ||
        raw.durationMs <= 0
      ) {
        return {
          valid: false,
          error: 'Emotion durationMs must be a finite positive number',
        };
      }
    }
  }

  // 5. Kiểm tra intensity
  if (raw.intensity !== undefined) {
    if (typeof raw.intensity !== 'number' || !Number.isFinite(raw.intensity)) {
      return { valid: false, error: 'Intensity must be a finite number' };
    }
  }

  return { valid: true };
}

/**
 * Tạo chuỗi tóm tắt an toàn cho input bất kỳ (chống crash do circular reference, giới hạn ký tự)
 */
export function createSafeInputSummary(input: unknown): string {
  if (typeof input !== 'object' || input === null) {
    return String(input);
  }

  try {
    const raw = input as Record<string, unknown>;
    if (typeof raw.type === 'string') {
      if (raw.type === 'state') {
        return `State: ${String(raw.state)}${raw.intensity !== undefined ? ` (${raw.intensity})` : ''}`;
      }
      if (raw.type === 'emotion') {
        return `Emotion: ${String(raw.emotion)}${raw.durationMs !== undefined ? ` [${raw.durationMs}ms]` : ''}`;
      }
      if (raw.type === 'reset') {
        return 'Reset';
      }
    }

    // Fallback an toàn với JSON.stringify có giới hạn
    const seen = new WeakSet();
    const str = JSON.stringify(input, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });

    return str.length > 100 ? `${str.substring(0, 97)}...` : str;
  } catch {
    return '[Unserializable Object]';
  }
}
