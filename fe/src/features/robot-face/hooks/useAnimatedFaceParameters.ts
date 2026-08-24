import { useMemo, useEffect, useRef } from 'react';
import {
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
  MotionValue,
} from 'framer-motion';
import { FaceParameters, RobotBlinkProfile } from '../robot-face.types';
import { useAutoBlink } from './useAutoBlink';

/**
 * Giới hạn giá trị trong miền [min, max]
 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Chuẩn hóa và giới hạn các thông số FaceParameters trong miền an toàn
 */
export function clampFaceParameters(p: FaceParameters): FaceParameters {
  return {
    eyeOpen: clamp(p.eyeOpen, 0.08, 1.0),
    eyeCurvature: clamp(p.eyeCurvature, -0.5, 1.0),
    leftEyebrowAngle: clamp(p.leftEyebrowAngle, -30, 30),
    rightEyebrowAngle: clamp(p.rightEyebrowAngle, -30, 30),
    leftEyebrowOffsetY: clamp(p.leftEyebrowOffsetY, -15, 15),
    rightEyebrowOffsetY: clamp(p.rightEyebrowOffsetY, -15, 15),
    mouthCurvature: clamp(p.mouthCurvature, -1.0, 1.0),
    mouthOpen: clamp(p.mouthOpen, 0.0, 1.0),
    mouthWidth: clamp(p.mouthWidth ?? 28, 14, 36),
    blushOpacity: clamp(p.blushOpacity, 0.0, 1.0),
    glowIntensity: clamp(p.glowIntensity, 0.0, 1.0),
  };
}

/**
 * Tạo đường dẫn SVG cho mắt robot
 */
function generateEyePath(cx: number, cy: number, open: number, curvature: number): string {
  const clampedOpen = clamp(open, 0.08, 1.0);
  const halfWidth = 24;
  const halfHeight = 25 * clampedOpen;

  const leftX = cx - halfWidth;
  const rightX = cx + halfWidth;
  const midY = cy;

  const topControlY = cy - halfHeight - curvature * 9;
  const bottomControlY = cy + halfHeight - curvature * 14;

  return `M ${leftX} ${midY} Q ${cx} ${topControlY} ${rightX} ${midY} Q ${cx} ${bottomControlY} ${leftX} ${midY} Z`;
}

/**
 * Tạo đường dẫn SVG miệng dạng Unified Continuous Closed Path (M Q Q Z)
 * Bảo toàn phần curvature cũ và cho phép điều chỉnh mouthWidth (14..36px)
 */
function generateMouthPath(curvature: number, open: number, width: number = 28): string {
  const clampedCurvature = clamp(curvature, -1.0, 1.0);
  const clampedOpen = clamp(open, 0.0, 1.0);
  const clampedWidth = clamp(width, 14, 36);

  const mouthHalfWidth = clampedWidth + Math.abs(clampedCurvature) * 6;
  const leftX = 200 - mouthHalfWidth;
  const rightX = 200 + mouthHalfWidth;
  const baseY = 168 - clampedCurvature * 3;
  const topControlY = 168 + clampedCurvature * 14;

  // Epsilon hình học nhỏ (0.3px) để tránh trùng khít tuyệt đối khi ngậm miệng (mouthOpen = 0)
  const epsilon = 0.3;
  const bottomControlY = 168 + clampedCurvature * 14 + (epsilon + clampedOpen * 22);

  return `M ${leftX} ${baseY} Q 200 ${topControlY} ${rightX} ${baseY} Q 200 ${bottomControlY} ${leftX} ${baseY} Z`;
}

export interface AnimatedFaceValues {
  // MotionValues gốc
  eyeOpen: MotionValue<number>;
  eyeCurvature: MotionValue<number>;
  leftEyebrowAngle: MotionValue<number>;
  rightEyebrowAngle: MotionValue<number>;
  leftEyebrowOffsetY: MotionValue<number>;
  rightEyebrowOffsetY: MotionValue<number>;
  mouthCurvature: MotionValue<number>;
  mouthOpen: MotionValue<number>;
  mouthWidth: MotionValue<number>;
  blushOpacity: MotionValue<number>;
  glowIntensity: MotionValue<number>;

  // Auto Blink MotionValues
  blinkFactor: MotionValue<number>;
  effectiveEyeOpen: MotionValue<number>;

  // Derived MotionValues
  leftEyePath: MotionValue<string>;
  rightEyePath: MotionValue<string>;
  leftPupilOpacity: MotionValue<number>;
  rightPupilOpacity: MotionValue<number>;
  leftPupilRy: MotionValue<number>;
  rightPupilRy: MotionValue<number>;
  leftPupilCy: MotionValue<number>;
  rightPupilCy: MotionValue<number>;

  leftEyebrowTransform: MotionValue<string>;
  leftEyebrowY: MotionValue<number>;
  rightEyebrowTransform: MotionValue<string>;
  rightEyebrowY: MotionValue<number>;

  mouthPath: MotionValue<string>;
  mouthFillOpacity: MotionValue<number>;

  glowStdDev: MotionValue<number>;
  ambientGlowOpacity: MotionValue<number>;
}

/**
 * Custom hook quản lý các MotionValue và animation chuyển cảnh của khuôn mặt robot,
 * tích hợp bộ điều biến Auto Blink độc lập và hỗ trợ mouthWidth cho 8 biểu cảm.
 * Đảm bảo Zero React state re-render mỗi frame.
 */
export function useAnimatedFaceParameters(
  targetParams: FaceParameters,
  animated: boolean = true,
  autoBlink: boolean = true,
  blinkProfile: RobotBlinkProfile = 'default'
): AnimatedFaceValues {
  const initialClamped = useMemo(() => clampFaceParameters(targetParams), []);

  // Khởi tạo các MotionValues số học bằng đúng target ban đầu (tránh lệch SSR và tránh animate từ idle khi mount)
  const eyeOpen = useMotionValue(initialClamped.eyeOpen);
  const eyeCurvature = useMotionValue(initialClamped.eyeCurvature);
  const leftEyebrowAngle = useMotionValue(initialClamped.leftEyebrowAngle);
  const rightEyebrowAngle = useMotionValue(initialClamped.rightEyebrowAngle);
  const leftEyebrowOffsetY = useMotionValue(initialClamped.leftEyebrowOffsetY);
  const rightEyebrowOffsetY = useMotionValue(initialClamped.rightEyebrowOffsetY);
  const mouthCurvature = useMotionValue(initialClamped.mouthCurvature);
  const mouthOpen = useMotionValue(initialClamped.mouthOpen);
  const mouthWidth = useMotionValue(initialClamped.mouthWidth);
  const blushOpacity = useMotionValue(initialClamped.blushOpacity);
  const glowIntensity = useMotionValue(initialClamped.glowIntensity);

  // Hook Auto Blink điều biến độc lập với blink profile
  const blinkFactor = useAutoBlink(autoBlink, animated, blinkProfile);

  const shouldReduceMotion = useReducedMotion();
  const isFirstRender = useRef(true);

  // Cấu hình transition theo quy tắc Precedence
  const transitionConfig = useMemo(() => {
    if (!animated) {
      return { duration: 0 };
    }
    if (shouldReduceMotion) {
      return { duration: 0.01 };
    }
    return {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as const,
    };
  }, [animated, shouldReduceMotion]);

  // Cập nhật và retarget animation khi targetParams hoặc transition thay đổi
  useEffect(() => {
    // Bỏ qua animate ở lần render đầu tiên sau mount nếu giá trị không đổi
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const clamped = clampFaceParameters(targetParams);

    const controls = [
      animate(eyeOpen, clamped.eyeOpen, transitionConfig),
      animate(eyeCurvature, clamped.eyeCurvature, transitionConfig),
      animate(leftEyebrowAngle, clamped.leftEyebrowAngle, transitionConfig),
      animate(rightEyebrowAngle, clamped.rightEyebrowAngle, transitionConfig),
      animate(leftEyebrowOffsetY, clamped.leftEyebrowOffsetY, transitionConfig),
      animate(rightEyebrowOffsetY, clamped.rightEyebrowOffsetY, transitionConfig),
      animate(mouthCurvature, clamped.mouthCurvature, transitionConfig),
      animate(mouthOpen, clamped.mouthOpen, transitionConfig),
      animate(mouthWidth, clamped.mouthWidth, transitionConfig),
      animate(blushOpacity, clamped.blushOpacity, transitionConfig),
      animate(glowIntensity, clamped.glowIntensity, transitionConfig),
    ];

    return () => {
      controls.forEach((control) => control.stop());
    };
  }, [
    targetParams.eyeOpen,
    targetParams.eyeCurvature,
    targetParams.leftEyebrowAngle,
    targetParams.rightEyebrowAngle,
    targetParams.leftEyebrowOffsetY,
    targetParams.rightEyebrowOffsetY,
    targetParams.mouthCurvature,
    targetParams.mouthOpen,
    targetParams.mouthWidth,
    targetParams.blushOpacity,
    targetParams.glowIntensity,
    transitionConfig,
    eyeOpen,
    eyeCurvature,
    leftEyebrowAngle,
    rightEyebrowAngle,
    leftEyebrowOffsetY,
    rightEyebrowOffsetY,
    mouthCurvature,
    mouthOpen,
    mouthWidth,
    blushOpacity,
    glowIntensity,
  ]);

  // 1. Effective Eye Openness (Base Eye Open * Blink Factor)
  const effectiveEyeOpen = useTransform([eyeOpen, blinkFactor], ([baseOpen, factor]) =>
    clamp((baseOpen as number) * (factor as number), 0.08, 1.0)
  );

  // 2. Derived Eye Paths phụ thuộc vào effectiveEyeOpen
  const leftEyePath = useTransform([effectiveEyeOpen, eyeCurvature], ([open, curv]) =>
    generateEyePath(135, 115, open as number, curv as number)
  );

  const rightEyePath = useTransform([effectiveEyeOpen, eyeCurvature], ([open, curv]) =>
    generateEyePath(265, 115, open as number, curv as number)
  );

  // 3. Derived Eye Pupil Highlights (Mờ dần liên tục, không tắt đột ngột)
  const leftPupilOpacity = useTransform(effectiveEyeOpen, [0.08, 0.35, 0.7], [0, 0.2, 0.8]);
  const rightPupilOpacity = useTransform(effectiveEyeOpen, [0.08, 0.35, 0.7], [0, 0.2, 0.8]);
  const leftPupilRy = useTransform(effectiveEyeOpen, (open) => Math.max(0.5, 3.5 * open));
  const rightPupilRy = useTransform(effectiveEyeOpen, (open) => Math.max(0.5, 3.5 * open));
  const leftPupilCy = useTransform(effectiveEyeOpen, (open) => 115 - 10 * open);
  const rightPupilCy = useTransform(effectiveEyeOpen, (open) => 115 - 10 * open);

  // 4. Derived Eyebrows
  const leftEyebrowTransform = useTransform(
    [leftEyebrowAngle, leftEyebrowOffsetY],
    ([angle, offsetY]) => `rotate(${angle as number}, 135, ${68 + (offsetY as number)})`
  );
  const leftEyebrowY = useTransform(leftEyebrowOffsetY, (offsetY) => 68 + offsetY - 3.5);

  const rightEyebrowTransform = useTransform(
    [rightEyebrowAngle, rightEyebrowOffsetY],
    ([angle, offsetY]) => `rotate(${- (angle as number)}, 265, ${68 + (offsetY as number)})`
  );
  const rightEyebrowY = useTransform(rightEyebrowOffsetY, (offsetY) => 68 + offsetY - 3.5);

  // 5. Derived Mouth Path & Fill Opacity (sử dụng mouthWidth MotionValue)
  const mouthPath = useTransform([mouthCurvature, mouthOpen, mouthWidth], ([curv, op, w]) =>
    generateMouthPath(curv as number, op as number, w as number)
  );
  const mouthFillOpacity = useTransform(mouthOpen, (op) => clamp(op / 0.25, 0.0, 1.0));

  // 6. Derived Glow & Ambient
  const glowStdDev = useTransform(glowIntensity, (glow) => 3.5 * glow);
  const ambientGlowOpacity = useTransform(glowIntensity, (glow) => 0.2 * glow);

  return {
    eyeOpen,
    eyeCurvature,
    leftEyebrowAngle,
    rightEyebrowAngle,
    leftEyebrowOffsetY,
    rightEyebrowOffsetY,
    mouthCurvature,
    mouthOpen,
    mouthWidth,
    blushOpacity,
    glowIntensity,

    blinkFactor,
    effectiveEyeOpen,

    leftEyePath,
    rightEyePath,
    leftPupilOpacity,
    rightPupilOpacity,
    leftPupilRy,
    rightPupilRy,
    leftPupilCy,
    rightPupilCy,

    leftEyebrowTransform,
    leftEyebrowY,
    rightEyebrowTransform,
    rightEyebrowY,

    mouthPath,
    mouthFillOpacity,

    glowStdDev,
    ambientGlowOpacity,
  };
}
