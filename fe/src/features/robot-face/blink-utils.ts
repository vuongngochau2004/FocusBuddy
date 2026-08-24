import { RobotBlinkProfile } from './robot-face.types';

/**
 * Pure utility functions and timing constants for Robot Face Auto Blink
 */

export const BLINK_MIN_DELAY_MS = 2500;
export const BLINK_MAX_DELAY_MS = 6000;
export const BLINK_TOTAL_DURATION_S = 0.18; // 180ms
export const BLINK_CLOSE_FRACTION = 0.44; // 80ms / 180ms ~ 0.44
export const BLINK_MIN_EYE_OPEN = 0.08;

export interface BlinkTimingConfig {
  totalDurationS: number;
  closeFraction: number;
  minDelayMs: number;
  maxDelayMs: number;
}

export const BLINK_PROFILES: Record<RobotBlinkProfile, BlinkTimingConfig> = {
  default: {
    totalDurationS: 0.18,
    closeFraction: 0.44, // 80ms đóng, 100ms mở
    minDelayMs: 2500,
    maxDelayMs: 6000,
  },
  sleepy: {
    totalDurationS: 0.28, // 280ms: chớp chậm hơn, mí mắt nặng
    closeFraction: 0.5, // 140ms đóng, 140ms mở
    minDelayMs: 3500,
    maxDelayMs: 8000,
  },
};

/**
 * Sinh khoảng thời gian ngẫu nhiên (miligiây) trong đoạn [min, max]
 * Đảm bảo kết quả là số nguyên và bảo vệ trường hợp min > max
 */
export function getRandomBlinkDelay(
  min: number = BLINK_MIN_DELAY_MS,
  max: number = BLINK_MAX_DELAY_MS
): number {
  const safeMin = Math.floor(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}
