export type RobotExpression =
  | 'idle'
  | 'happy'
  | 'concerned'
  | 'thinking'
  | 'encouraging'
  | 'excited'
  | 'sleepy'
  | 'surprised';

export const VALID_ROBOT_EXPRESSIONS: readonly RobotExpression[] = [
  'idle',
  'happy',
  'concerned',
  'thinking',
  'encouraging',
  'excited',
  'sleepy',
  'surprised',
] as const;

export type RobotFaceEffect = 'blush' | 'stars' | 'zzz' | 'sweat';

export const VALID_ROBOT_EFFECTS: readonly RobotFaceEffect[] = [
  'blush',
  'stars',
  'zzz',
  'sweat',
] as const;

export type RobotBlinkProfile = 'default' | 'sleepy';

/**
 * Chuẩn hóa danh sách hiệu ứng trực quan: loại bỏ duplicate và giữ thứ tự ổn định
 */
export function normalizeRobotFaceEffects(
  effects?: readonly RobotFaceEffect[]
): readonly RobotFaceEffect[] {
  if (!effects || effects.length === 0) {
    return [];
  }
  const uniqueSet = new Set<RobotFaceEffect>();
  const result: RobotFaceEffect[] = [];
  for (const eff of effects) {
    if (VALID_ROBOT_EFFECTS.includes(eff) && !uniqueSet.has(eff)) {
      uniqueSet.add(eff);
      result.push(eff);
    }
  }
  return result;
}

export interface FaceParameters {
  /** Độ mở của mắt (0: nhắm hoàn toàn, 1: mở to) */
  eyeOpen: number;
  /** Độ cong của mắt (-1: cụp xuống/buồn, 0: chuẩn/trung tính, 1: cong vồng cười) */
  eyeCurvature: number;
  /** Góc nghiêng lông mày bên trái tính theo độ (>0: nhướng lên, <0: xụp xuống) */
  leftEyebrowAngle: number;
  /** Góc nghiêng lông mày bên phải tính theo độ (>0: nhướng lên, <0: xụp xuống) */
  rightEyebrowAngle: number;
  /** Độ nâng/hạ vị trí Y lông mày bên trái (pixel) */
  leftEyebrowOffsetY: number;
  /** Độ nâng/hạ vị trí Y lông mày bên phải (pixel) */
  rightEyebrowOffsetY: number;
  /** Độ cong của khuôn miệng (-1: mếu/buồn, 0: ngang trung tính, 1: cười tươi) */
  mouthCurvature: number;
  /** Độ mở của khuôn miệng (0: khép kín dạng nét đơn, 1: mở to) */
  mouthOpen: number;
  /** Bán chiều rộng cơ sở của khuôn miệng theo pixel (14..36, mặc định 28) */
  mouthWidth: number;
  /** Độ hiển thị của má hồng (0: ẩn, 1: rõ nhất) */
  blushOpacity: number;
  /** Cường độ hiệu ứng phát sáng cyan (0..1) */
  glowIntensity: number;
}

export interface RobotFaceProps {
  /** Biểu cảm hiển thị của robot (mặc định: 'idle') */
  expression?: RobotExpression;
  /** Cường độ biểu cảm từ 0 đến 1 (mặc định: 1) */
  intensity?: number;
  /** Chiều rộng khuôn mặt theo pixel (mặc định: 480) */
  size?: number;
  /** CSS class tùy biến bổ sung */
  className?: string;
  /** Bật/tắt animation chuyển cảnh biểu cảm (mặc định: true) */
  animated?: boolean;
  /** Bật/tắt tính năng tự động chớp mắt ngẫu nhiên (mặc định: true) */
  autoBlink?: boolean;
  /** Bật/tắt vi chuyển động thở khi ở trạng thái idle (mặc định: true) */
  ambientMotion?: boolean;
  /** Danh sách hiệu ứng trực quan trang trí (mặc định: []) */
  effects?: readonly RobotFaceEffect[];
}
