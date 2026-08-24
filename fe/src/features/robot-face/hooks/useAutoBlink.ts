import { useEffect, useRef } from 'react';
import { useMotionValue, animate, useReducedMotion, MotionValue, AnimationPlaybackControls } from 'framer-motion';
import { RobotBlinkProfile } from '../robot-face.types';
import {
  getRandomBlinkDelay,
  BLINK_PROFILES,
} from '../blink-utils';

/**
 * Custom hook nội bộ quản lý chu kỳ tự động chớp mắt (Auto Blink)
 * Hỗ trợ các profile nhịp chớp khác nhau (default, sleepy)
 * Sử dụng recursive setTimeout, generation token chống race-condition,
 * và tích hợp Page Visibility API.
 */
export function useAutoBlink(
  autoBlink: boolean = true,
  animated: boolean = true,
  profile: RobotBlinkProfile = 'default'
): MotionValue<number> {
  const blinkFactor = useMotionValue<number>(1.0);
  const shouldReduceMotion = useReducedMotion();

  const generationRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationControlRef = useRef<AnimationPlaybackControls | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Điều kiện hoạt động theo Precedence
  const isActive = autoBlink && animated && !shouldReduceMotion;
  const timingConfig = BLINK_PROFILES[profile] ?? BLINK_PROFILES.default;

  useEffect(() => {
    isMountedRef.current = true;
    generationRef.current += 1;
    const currentGeneration = generationRef.current;

    // Helper dọn dẹp timer & animation hiện tại
    const cleanupActiveOperations = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (animationControlRef.current !== null) {
        animationControlRef.current.stop();
        animationControlRef.current = null;
      }
      blinkFactor.set(1.0);
    };

    // Nếu không thỏa mãn điều kiện hoạt động -> dọn dẹp và dừng
    if (!isActive) {
      cleanupActiveOperations();
      return;
    }

    // Lập lịch nhịp chớp mắt tiếp theo
    const scheduleNextBlink = (gen: number) => {
      if (
        gen !== generationRef.current ||
        !isMountedRef.current ||
        document.visibilityState !== 'visible'
      ) {
        return;
      }

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const delay = getRandomBlinkDelay(timingConfig.minDelayMs, timingConfig.maxDelayMs);
      timerRef.current = setTimeout(() => {
        if (
          gen !== generationRef.current ||
          !isMountedRef.current ||
          document.visibilityState !== 'visible'
        ) {
          return;
        }

        // Thực hiện 1 nhịp chớp mắt [1 -> 0 -> 1]
        const control = animate(blinkFactor, [1, 0, 1], {
          duration: timingConfig.totalDurationS,
          times: [0, timingConfig.closeFraction, 1],
          ease: ['easeIn', 'easeOut'],
        });

        animationControlRef.current = control;

        control.then(() => {
          if (
            gen === generationRef.current &&
            isMountedRef.current &&
            document.visibilityState === 'visible'
          ) {
            scheduleNextBlink(gen);
          }
        });
      }, delay);
    };

    // Bắt đầu lập lịch nếu tab đang hiển thị
    if (document.visibilityState === 'visible') {
      scheduleNextBlink(currentGeneration);
    }

    // Xử lý khi chuyển đổi trạng thái tab (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab bị ẩn: Hủy timer, dừng animation, reset mắt mở
        generationRef.current += 1;
        cleanupActiveOperations();
      } else if (document.visibilityState === 'visible' && isMountedRef.current) {
        // Tab hiển thị lại: Bắt đầu generation mới và lập lịch delay mới
        generationRef.current += 1;
        const newGen = generationRef.current;
        cleanupActiveOperations();
        scheduleNextBlink(newGen);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      generationRef.current += 1;
      cleanupActiveOperations();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, blinkFactor, timingConfig]);

  return blinkFactor;
}
