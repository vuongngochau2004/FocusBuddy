'use client';

import React, { useId } from 'react';
import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { RobotFaceProps, normalizeRobotFaceEffects } from '../robot-face.types';
import { expressionPresets, idleFace, interpolateFaceParameters } from '../expression-presets';
import { useAnimatedFaceParameters } from '../hooks/useAnimatedFaceParameters';
import { useAmbientFaceMotion } from '../hooks/useAmbientFaceMotion';
import { RobotFaceEffects } from './RobotFaceEffects';

/**
 * RobotFace SVG Component
 *
 * Hiển thị khuôn mặt robot FocusBuddy dưới dạng vector SVG với chuyển động mượt mà (Framer Motion),
 * hỗ trợ 8 biểu cảm mở rộng, cơ chế Auto Blink đa profile (default / sleepy),
 * vi chuyển động thở (Ambient Micro-motion), và hệ thống hiệu ứng trực quan phân tầng (Visual Effects).
 * Sử dụng kiến trúc Direct MotionValue Updates (Zero React state per frame).
 */
export const RobotFace: React.FC<RobotFaceProps> = ({
  expression = 'idle',
  intensity = 1,
  size = 480,
  className = '',
  animated = true,
  autoBlink = true,
  ambientMotion = true,
  effects = [],
}) => {
  const uniqueId = useId().replace(/:/g, '_');
  const shouldReduceMotion = useReducedMotion();

  // Chuẩn hóa danh sách hiệu ứng trực quan
  const normalizedEffects = normalizeRobotFaceEffects(effects);

  // Xác định Blink Profile dựa trên biểu cảm
  const blinkProfile = expression === 'sleepy' ? 'sleepy' : 'default';

  // Lấy preset mục tiêu và tính toán target parameters
  const targetPreset = expressionPresets[expression] ?? idleFace;
  const targetParams = interpolateFaceParameters(idleFace, targetPreset, intensity);

  // Quản lý animation qua MotionValues, derived transforms và Auto Blink
  const animatedValues = useAnimatedFaceParameters(
    targetParams,
    animated,
    autoBlink,
    blinkProfile
  );

  // Quản lý vi chuyển động thở idle quanh tâm hình học (200, 125)
  const ambientValues = useAmbientFaceMotion(expression, ambientMotion, animated);

  // Quầng sáng nền kết hợp bộ nhân phát quang nhịp thở
  const effectiveAmbientGlowOpacity = useTransform(
    [animatedValues.ambientGlowOpacity, ambientValues.glowMultiplier],
    ([base, mult]) => Math.max(0, Math.min(1, (base as number) * (mult as number)))
  );

  // ID cho gradients và filters
  const visorGradId = `visor-grad-${uniqueId}`;
  const eyeGradId = `eye-grad-${uniqueId}`;
  const blushGradId = `blush-grad-${uniqueId}`;
  const glowFilterId = `cyan-glow-${uniqueId}`;
  const ambientGradId = `ambient-grad-${uniqueId}`;

  // Kích thước co giãn
  const svgHeight =
    typeof size === 'number' ? Math.round((size * 240) / 400) : undefined;
  const isReducedMotionActive = Boolean(shouldReduceMotion || !animated);

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
          <motion.feGaussianBlur stdDeviation={animatedValues.glowStdDev} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient phát sáng nền trung tâm (ambient glow) */}
        <radialGradient id={ambientGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
          <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>

        {/* Gradient má hồng nhẹ */}
        <radialGradient id={blushGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Layer 1: Nền / Mặt kính màu tối bo tròn (Tĩnh tuyệt đối) */}
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

      {/* Layer 2: Ánh sáng nền Cyan (Ambient Glow với Pulse nhẹ) */}
      <g id="ambient-glow" pointerEvents="none">
        <motion.ellipse
          cx="200"
          cy="120"
          rx="140"
          ry="85"
          fill={`url(#${ambientGradId})`}
          opacity={effectiveAmbientGlowOpacity}
        />
      </g>

      {/* Layer 2.5: Background Visual Effects (Zzz bay bên ngoài cụm ngũ quan) */}
      <RobotFaceEffects
        effects={normalizedEffects}
        intensity={intensity}
        reducedMotion={isReducedMotionActive}
        layer="background"
      />

      {/* Cụm ngũ quan chuyển động thở vi mô quanh tâm (200, 125) */}
      <motion.g id="facial-content" transform={ambientValues.facialContentTransform}>
        {/* Layer 3: Lông mày trái */}
        <g id="left-eyebrow">
          <motion.rect
            x={135 - 22}
            y={animatedValues.leftEyebrowY}
            width="44"
            height="7"
            rx="3.5"
            fill="#22d3ee"
            filter={`url(#${glowFilterId})`}
            transform={animatedValues.leftEyebrowTransform}
          />
        </g>

        {/* Layer 4: Lông mày phải */}
        <g id="right-eyebrow">
          <motion.rect
            x={265 - 22}
            y={animatedValues.rightEyebrowY}
            width="44"
            height="7"
            rx="3.5"
            fill="#22d3ee"
            filter={`url(#${glowFilterId})`}
            transform={animatedValues.rightEyebrowTransform}
          />
        </g>

        {/* Layer 5: Mắt trái */}
        <g id="left-eye">
          <motion.path
            d={animatedValues.leftEyePath}
            fill={`url(#${eyeGradId})`}
            filter={`url(#${glowFilterId})`}
          />
          {/* Đốm sáng tạo chiều sâu trong mắt (mờ dần mượt mà khi nhắm) */}
          <motion.ellipse
            cx={135 - 7}
            cy={animatedValues.leftPupilCy}
            rx="4"
            ry={animatedValues.leftPupilRy}
            fill="#ffffff"
            opacity={animatedValues.leftPupilOpacity}
          />
        </g>

        {/* Layer 6: Mắt phải */}
        <g id="right-eye">
          <motion.path
            d={animatedValues.rightEyePath}
            fill={`url(#${eyeGradId})`}
            filter={`url(#${glowFilterId})`}
          />
          {/* Đốm sáng tạo chiều sâu trong mắt (mờ dần mượt mà khi nhắm) */}
          <motion.ellipse
            cx={265 + 7}
            cy={animatedValues.rightPupilCy}
            rx="4"
            ry={animatedValues.rightPupilRy}
            fill="#ffffff"
            opacity={animatedValues.rightPupilOpacity}
          />
        </g>

        {/* Layer 7: Miệng (Unified Continuous Closed Path M Q Q Z) */}
        <g id="mouth">
          <motion.path
            d={animatedValues.mouthPath}
            fill="#083344"
            fillOpacity={animatedValues.mouthFillOpacity}
            stroke="#22d3ee"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowFilterId})`}
          />
        </g>

        {/* Layer 8: Má hồng trái */}
        <g id="left-blush">
          <motion.ellipse
            cx="92"
            cy="146"
            rx="24"
            ry="12"
            fill={`url(#${blushGradId})`}
            opacity={animatedValues.blushOpacity}
          />
        </g>

        {/* Layer 9: Má hồng phải */}
        <g id="right-blush">
          <motion.ellipse
            cx="308"
            cy="146"
            rx="24"
            ry="12"
            fill={`url(#${blushGradId})`}
            opacity={animatedValues.blushOpacity}
          />
        </g>

        {/* Layer 10: Foreground Visual Effects (Stars, Sweat, Blush halo bám theo ngũ quan) */}
        <RobotFaceEffects
          effects={normalizedEffects}
          intensity={intensity}
          reducedMotion={isReducedMotionActive}
          layer="foreground"
        />
      </motion.g>
    </svg>
  );
};
