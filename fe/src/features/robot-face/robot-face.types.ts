export type RobotExpression = 'idle' | 'happy' | 'concerned' | 'thinking';

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
  /** Độ hiển thị của má hồng (0: ẩn, 1: rõ nhất) */
  blushOpacity: number;
  /** Cường độ hiệu ứng phát sáng cyan (0..1) */
  glowIntensity: number;
}

export interface RobotFaceProps {
  /** Biểu cảm hiển thị của robot */
  expression?: RobotExpression;
  /** Cường độ biểu cảm từ 0 đến 1 */
  intensity?: number;
  /** Chiều rộng khuôn mặt theo pixel */
  size?: number;
  /** CSS class tùy biến bổ sung */
  className?: string;
}
