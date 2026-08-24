import { FaceParameters, RobotExpression } from './robot-face.types';

/**
 * Trạng thái khuôn mặt cơ sở (Idle / Trung tính)
 */
export const idleFace: FaceParameters = {
  eyeOpen: 0.85,
  eyeCurvature: 0,
  leftEyebrowAngle: 0,
  rightEyebrowAngle: 0,
  leftEyebrowOffsetY: 0,
  rightEyebrowOffsetY: 0,
  mouthCurvature: 0.08,
  mouthOpen: 0,
  mouthWidth: 28,
  blushOpacity: 0.15,
  glowIntensity: 0.6,
};

/**
 * Bảng thông số preset cho toàn bộ 8 biểu cảm của robot
 */
export const expressionPresets: Record<RobotExpression, FaceParameters> = {
  idle: idleFace,
  happy: {
    eyeOpen: 0.95,
    eyeCurvature: 0.85,
    leftEyebrowAngle: 12,
    rightEyebrowAngle: 12,
    leftEyebrowOffsetY: -4,
    rightEyebrowOffsetY: -4,
    mouthCurvature: 0.9,
    mouthOpen: 0.45,
    mouthWidth: 28,
    blushOpacity: 0.85,
    glowIntensity: 0.95,
  },
  concerned: {
    eyeOpen: 0.75,
    eyeCurvature: -0.35,
    leftEyebrowAngle: -18,
    rightEyebrowAngle: -18,
    leftEyebrowOffsetY: 2,
    rightEyebrowOffsetY: 2,
    mouthCurvature: -0.65,
    mouthOpen: 0.1,
    mouthWidth: 28,
    blushOpacity: 0.05,
    glowIntensity: 0.5,
  },
  thinking: {
    eyeOpen: 0.7,
    eyeCurvature: 0.2,
    leftEyebrowAngle: 22,
    rightEyebrowAngle: -10,
    leftEyebrowOffsetY: -8,
    rightEyebrowOffsetY: 4,
    mouthCurvature: -0.2,
    mouthOpen: 0.05,
    mouthWidth: 28,
    blushOpacity: 0.2,
    glowIntensity: 0.75,
  },
  encouraging: {
    eyeOpen: 0.88,
    eyeCurvature: 0.55,
    leftEyebrowAngle: 8,
    rightEyebrowAngle: 8,
    leftEyebrowOffsetY: -3,
    rightEyebrowOffsetY: -3,
    mouthCurvature: 0.65,
    mouthOpen: 0.15,
    mouthWidth: 26,
    blushOpacity: 0.6,
    glowIntensity: 0.8,
  },
  excited: {
    eyeOpen: 1.0,
    eyeCurvature: 0.9,
    leftEyebrowAngle: 16,
    rightEyebrowAngle: 16,
    leftEyebrowOffsetY: -8,
    rightEyebrowOffsetY: -8,
    mouthCurvature: 0.95,
    mouthOpen: 0.85,
    mouthWidth: 32,
    blushOpacity: 0.95,
    glowIntensity: 1.0,
  },
  sleepy: {
    eyeOpen: 0.38,
    eyeCurvature: 0.05,
    leftEyebrowAngle: -8,
    rightEyebrowAngle: -8,
    leftEyebrowOffsetY: 4,
    rightEyebrowOffsetY: 4,
    mouthCurvature: -0.1,
    mouthOpen: 0.3,
    mouthWidth: 22,
    blushOpacity: 0.1,
    glowIntensity: 0.35,
  },
  surprised: {
    eyeOpen: 1.0,
    eyeCurvature: 0.0,
    leftEyebrowAngle: 0,
    rightEyebrowAngle: 0,
    leftEyebrowOffsetY: -12,
    rightEyebrowOffsetY: -12,
    mouthCurvature: -0.25,
    mouthOpen: 0.95,
    mouthWidth: 18,
    blushOpacity: 0.0,
    glowIntensity: 0.9,
  },
};

/**
 * Hàm nội suy tuyến tính (linear interpolation) giữa hai giá trị số
 * @param start Giá trị ban đầu
 * @param end Giá trị đích
 * @param t Hệ số nội suy [0, 1]
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Nội suy thông số khuôn mặt từ trạng thái cơ sở (base) đến trạng thái mục tiêu (target)
 * dựa trên hệ số intensity [0, 1].
 *
 * @param base Thông số khuôn mặt ban đầu (mặc định là idleFace)
 * @param target Thông số biểu cảm mục tiêu
 * @param intensity Cường độ biểu cảm (được chuẩn hóa trong đoạn [0, 1])
 * @returns Thông số khuôn mặt sau khi nội suy
 */
export function interpolateFaceParameters(
  base: FaceParameters,
  target: FaceParameters,
  intensity: number
): FaceParameters {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  return {
    eyeOpen: lerp(base.eyeOpen, target.eyeOpen, clampedIntensity),
    eyeCurvature: lerp(base.eyeCurvature, target.eyeCurvature, clampedIntensity),
    leftEyebrowAngle: lerp(base.leftEyebrowAngle, target.leftEyebrowAngle, clampedIntensity),
    rightEyebrowAngle: lerp(base.rightEyebrowAngle, target.rightEyebrowAngle, clampedIntensity),
    leftEyebrowOffsetY: lerp(base.leftEyebrowOffsetY, target.leftEyebrowOffsetY, clampedIntensity),
    rightEyebrowOffsetY: lerp(base.rightEyebrowOffsetY, target.rightEyebrowOffsetY, clampedIntensity),
    mouthCurvature: lerp(base.mouthCurvature, target.mouthCurvature, clampedIntensity),
    mouthOpen: lerp(base.mouthOpen, target.mouthOpen, clampedIntensity),
    mouthWidth: lerp(base.mouthWidth, target.mouthWidth, clampedIntensity),
    blushOpacity: lerp(base.blushOpacity, target.blushOpacity, clampedIntensity),
    glowIntensity: lerp(base.glowIntensity, target.glowIntensity, clampedIntensity),
  };
}
