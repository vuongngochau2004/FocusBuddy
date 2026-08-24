import React, { useId } from 'react';
import { RobotFaceProps } from '../robot-face.types';
import { expressionPresets, idleFace, interpolateFaceParameters } from '../expression-presets';

/**
 * Tạo đường dẫn SVG path cho mắt robot dựa trên độ mở và độ cong
 */
function generateEyePath(cx: number, cy: number, open: number, curvature: number): string {
  const clampedOpen = Math.max(0.08, open);
  const halfWidth = 24;
  const halfHeight = 25 * clampedOpen;

  const leftX = cx - halfWidth;
  const rightX = cx + halfWidth;
  const midY = cy;

  // Điều chỉnh đỉnh cong mí trên và mí dưới
  const topControlY = cy - halfHeight - curvature * 9;
  const bottomControlY = cy + halfHeight - curvature * 14;

  return `M ${leftX} ${midY} Q ${cx} ${topControlY} ${rightX} ${midY} Q ${cx} ${bottomControlY} ${leftX} ${midY} Z`;
}

/**
 * RobotFace SVG Component
 *
 * Hiển thị khuôn mặt robot FocusBuddy dưới dạng vector SVG thuần túy.
 * Hỗ trợ co giãn theo kích thước (size) và chuyển đổi các biểu cảm thông qua nội suy tuyến tính.
 */
export const RobotFace: React.FC<RobotFaceProps> = ({
  expression = 'idle',
  intensity = 1,
  size = 480,
  className = '',
}) => {
  const uniqueId = useId().replace(/:/g, '_');

  // Lấy preset mục tiêu và thực hiện nội suy thông số
  const targetPreset = expressionPresets[expression] ?? idleFace;
  const params = interpolateFaceParameters(idleFace, targetPreset, intensity);

  // Tọa độ hình học cơ sở
  const leftEyeCenter = { x: 135, y: 115 };
  const rightEyeCenter = { x: 265, y: 115 };
  const leftEyebrowPivot = { x: 135, y: 68 + params.leftEyebrowOffsetY };
  const rightEyebrowPivot = { x: 265, y: 68 + params.rightEyebrowOffsetY };
  const mouthCenter = { x: 200, y: 168 };

  // ID cho gradients và filters
  const visorGradId = `visor-grad-${uniqueId}`;
  const eyeGradId = `eye-grad-${uniqueId}`;
  const blushGradId = `blush-grad-${uniqueId}`;
  const glowFilterId = `cyan-glow-${uniqueId}`;
  const ambientGradId = `ambient-grad-${uniqueId}`;

  // Kích thước co giãn
  const svgHeight = Math.round((size * 240) / 400);

  // Tính toán đường vẽ miệng
  const mouthHalfWidth = 28 + Math.abs(params.mouthCurvature) * 6;
  const mouthLeftX = mouthCenter.x - mouthHalfWidth;
  const mouthRightX = mouthCenter.x + mouthHalfWidth;
  const mouthBaseY = mouthCenter.y - params.mouthCurvature * 3;
  const mouthTopControlY = mouthCenter.y + params.mouthCurvature * 14;
  const mouthBottomControlY = mouthCenter.y + params.mouthCurvature * 14 + params.mouthOpen * 22;

  const mouthPath =
    params.mouthOpen > 0.08
      ? `M ${mouthLeftX} ${mouthBaseY} Q ${mouthCenter.x} ${mouthTopControlY} ${mouthRightX} ${mouthBaseY} Q ${mouthCenter.x} ${mouthBottomControlY} ${mouthLeftX} ${mouthBaseY} Z`
      : `M ${mouthLeftX} ${mouthBaseY} Q ${mouthCenter.x} ${mouthTopControlY} ${mouthRightX} ${mouthBaseY}`;

  const leftEyePath = generateEyePath(
    leftEyeCenter.x,
    leftEyeCenter.y,
    params.eyeOpen,
    params.eyeCurvature
  );

  const rightEyePath = generateEyePath(
    rightEyeCenter.x,
    rightEyeCenter.y,
    params.eyeOpen,
    params.eyeCurvature
  );

  return (
    <svg
      role="img"
      aria-label={`Robot face displaying ${expression} expression with intensity ${Math.round(
        Math.max(0, Math.min(1, intensity)) * 100
      )}%`}
      viewBox="0 0 400 240"
      width={size}
      height={svgHeight}
      className={`select-none ${className}`}
      style={{
        maxWidth: '100%',
        height: 'auto',
        aspectRatio: '400 / 240',
      }}
    >
      <defs>
        {/* Nền mặt kính robot tối màu với viền phản quang */}
        <linearGradient id={visorGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#090d16" />
          <stop offset="100%" stopColor="#05080f" />
        </linearGradient>

        {/* Gradient màu mắt cyan kỹ thuật số */}
        <linearGradient id={eyeGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#00e5ff" />
        </linearGradient>

        {/* Hiệu ứng hào quang phát sáng cyan */}
        <filter id={glowFilterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={3.5 * params.glowIntensity} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient phát sáng nền trung tâm (ambient glow) */}
        <radialGradient id={ambientGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2 * params.glowIntensity} />
          <stop offset="70%" stopColor="#06b6d4" stopOpacity={0.04 * params.glowIntensity} />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
        </radialGradient>

        {/* Gradient má hồng nhẹ */}
        <radialGradient id={blushGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Layer 1: Nền / Mặt kính màu tối bo tròn */}
      <g id="screen-visor">
        <rect
          x="12"
          y="12"
          width="376"
          height="216"
          rx="36"
          ry="36"
          fill={`url(#${visorGradId})`}
          stroke="#1e293b"
          strokeWidth="2.5"
        />
        {/* Viền sáng phản chiếu nhẹ góc trên mặt kính */}
        <path
          d="M 32 36 Q 200 24 368 36"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Layer 2: Ánh sáng nền Cyan (Ambient Glow) */}
      <g id="ambient-glow" pointerEvents="none">
        <ellipse cx="200" cy="120" rx="140" ry="85" fill={`url(#${ambientGradId})`} />
      </g>

      {/* Layer 3: Lông mày trái */}
      <g id="left-eyebrow">
        <rect
          x={leftEyebrowPivot.x - 22}
          y={leftEyebrowPivot.y - 3.5}
          width="44"
          height="7"
          rx="3.5"
          fill="#22d3ee"
          filter={`url(#${glowFilterId})`}
          transform={`rotate(${params.leftEyebrowAngle}, ${leftEyebrowPivot.x}, ${leftEyebrowPivot.y})`}
        />
      </g>

      {/* Layer 4: Lông mày phải */}
      <g id="right-eyebrow">
        <rect
          x={rightEyebrowPivot.x - 22}
          y={rightEyebrowPivot.y - 3.5}
          width="44"
          height="7"
          rx="3.5"
          fill="#22d3ee"
          filter={`url(#${glowFilterId})`}
          transform={`rotate(${-params.rightEyebrowAngle}, ${rightEyebrowPivot.x}, ${rightEyebrowPivot.y})`}
        />
      </g>

      {/* Layer 5: Mắt trái */}
      <g id="left-eye">
        <path
          d={leftEyePath}
          fill={`url(#${eyeGradId})`}
          filter={`url(#${glowFilterId})`}
        />
        {/* Đốm sáng tạo chiều sâu trong mắt */}
        {params.eyeOpen > 0.4 && (
          <ellipse
            cx={leftEyeCenter.x - 7}
            cy={leftEyeCenter.y - (10 * params.eyeOpen)}
            rx="4"
            ry={3.5 * params.eyeOpen}
            fill="#ffffff"
            opacity="0.8"
          />
        )}
      </g>

      {/* Layer 6: Mắt phải */}
      <g id="right-eye">
        <path
          d={rightEyePath}
          fill={`url(#${eyeGradId})`}
          filter={`url(#${glowFilterId})`}
        />
        {/* Đốm sáng tạo chiều sâu trong mắt */}
        {params.eyeOpen > 0.4 && (
          <ellipse
            cx={rightEyeCenter.x + 7}
            cy={rightEyeCenter.y - (10 * params.eyeOpen)}
            rx="4"
            ry={3.5 * params.eyeOpen}
            fill="#ffffff"
            opacity="0.8"
          />
        )}
      </g>

      {/* Layer 7: Miệng */}
      <g id="mouth">
        {params.mouthOpen > 0.08 ? (
          <path
            d={mouthPath}
            fill="#083344"
            stroke="#22d3ee"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowFilterId})`}
          />
        ) : (
          <path
            d={mouthPath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="5"
            strokeLinecap="round"
            filter={`url(#${glowFilterId})`}
          />
        )}
      </g>

      {/* Layer 8: Má hồng trái */}
      <g id="left-blush">
        <ellipse
          cx="92"
          cy="146"
          rx="24"
          ry="12"
          fill={`url(#${blushGradId})`}
          opacity={params.blushOpacity}
        />
      </g>

      {/* Layer 9: Má hồng phải */}
      <g id="right-blush">
        <ellipse
          cx="308"
          cy="146"
          rx="24"
          ry="12"
          fill={`url(#${blushGradId})`}
          opacity={params.blushOpacity}
        />
      </g>
    </svg>
  );
};
