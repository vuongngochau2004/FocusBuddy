import { useEffect, useRef } from 'react';
import {
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
  MotionValue,
  AnimationPlaybackControls,
} from 'framer-motion';
import { RobotExpression } from '../robot-face.types';

export interface AmbientMotionValues {
  ambientProgress: MotionValue<number>;
  facialContentTransform: MotionValue<string>;
  glowMultiplier: MotionValue<number>;
  translateY: MotionValue<number>;
  scale: MotionValue<number>;
}

const AMBIENT_CYCLE_DURATION_S = 4.0;
const AMBIENT_MAX_TRANSLATE_Y = -1.2; // Nâng nhẹ 1.2px khi hít vào
const AMBIENT_MAX_SCALE = 1.005; // Co giãn vi mô 0.5%
const AMBIENT_MAX_GLOW_MULT = 1.06; // Quầng sáng phát quang tăng nhẹ 6%

/**
 * Custom hook nội bộ quản lý vi chuyển động thở (Ambient Micro-Animations) khi ở trạng thái idle.
 * Điều khiển transform quanh tâm SVG (200, 125) và điều biến quầng sáng nền.
 */
export function useAmbientFaceMotion(
  expression: RobotExpression = 'idle',
  ambientMotion: boolean = true,
  animated: boolean = true
): AmbientMotionValues {
  const ambientProgress = useMotionValue<number>(0.0);
  const shouldReduceMotion = useReducedMotion();

  const animationControlRef = useRef<AnimationPlaybackControls | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Chỉ kích hoạt khi expression là 'idle' và thỏa mãn mọi điều kiện precedence
  const isActive = ambientMotion && animated && expression === 'idle' && !shouldReduceMotion;

  useEffect(() => {
    isMountedRef.current = true;

    // Helper dừng và reset về trạng thái tĩnh trung tính (neutral)
    const cleanupActiveAnimation = () => {
      if (animationControlRef.current !== null) {
        animationControlRef.current.stop();
        animationControlRef.current = null;
      }
      ambientProgress.set(0.0);
    };

    if (!isActive) {
      cleanupActiveAnimation();
      return;
    }

    const startAmbientLoop = () => {
      if (!isMountedRef.current || document.visibilityState !== 'visible') {
        return;
      }

      cleanupActiveAnimation();

      // Khởi chạy chu kỳ vô tận [0 -> 1 -> 0]
      animationControlRef.current = animate(ambientProgress, [0, 1, 0], {
        duration: AMBIENT_CYCLE_DURATION_S,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    };

    // Bắt đầu loop nếu tab đang hiển thị
    if (document.visibilityState === 'visible') {
      startAmbientLoop();
    }

    // Quản lý khi người dùng chuyển đổi tab (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanupActiveAnimation();
      } else if (document.visibilityState === 'visible' && isMountedRef.current && isActive) {
        startAmbientLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      cleanupActiveAnimation();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, ambientProgress]);

  // 1. Derived translateY: 0 -> -1.2px -> 0
  const translateY = useTransform(ambientProgress, [0, 1], [0, AMBIENT_MAX_TRANSLATE_Y]);

  // 2. Derived scale: 1.0 -> 1.005 -> 1.0
  const scale = useTransform(ambientProgress, [0, 1], [1.0, AMBIENT_MAX_SCALE]);

  // 3. Derived glowMultiplier: 1.0 -> 1.06 -> 1.0
  const glowMultiplier = useTransform(ambientProgress, [0, 1], [1.0, AMBIENT_MAX_GLOW_MULT]);

  // 4. SVG Transform quanh tâm hình học (200, 125):
  // Thứ tự thực thi SVG right-to-left:
  // translate(-200, -125) -> scale(s, s) -> translate(200, 125) -> translate(0, y)
  const facialContentTransform = useTransform(
    [translateY, scale],
    ([y, s]) =>
      `translate(0, ${y as number}) translate(200, 125) scale(${s as number}) translate(-200, -125)`
  );

  return {
    ambientProgress,
    facialContentTransform,
    glowMultiplier,
    translateY,
    scale,
  };
}
