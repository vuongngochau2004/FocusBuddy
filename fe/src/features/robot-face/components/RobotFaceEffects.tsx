'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RobotFaceEffect } from '../robot-face.types';

export interface RobotFaceEffectsProps {
  /** Danh sách hiệu ứng đang kích hoạt */
  effects: readonly RobotFaceEffect[];
  /** Cường độ biểu cảm từ 0 đến 1 */
  intensity?: number;
  /** Trạng thái reduced-motion */
  reducedMotion?: boolean;
  /** Vị trí phân lớp SVG (background: trước visor/ngoài facial; foreground: trong cụm ngũ quan) */
  layer: 'background' | 'foreground';
}

/**
 * Đường dẫn SVG ngôi sao 4 cánh đối xứng chuẩn (tâm 0, 0)
 */
const STAR_4_PATH = 'M 0 -7 Q 1 -1 7 0 Q 1 1 0 7 Q -1 1 -7 0 Q -1 -1 0 -7 Z';

/**
 * Đường dẫn SVG giọt nước (tâm 0, 0)
 */
const SWEAT_DROP_PATH = 'M 0 -8 C 4 -3 6 1 6 5 C 6 8.5 3.5 11 0 11 C -3.5 11 -6 8.5 -6 5 C -6 1 -4 -3 0 -8 Z';

/**
 * Component trình diễn phân tầng hiệu ứng trực quan (Layered Visual Effects)
 * Render thuần vector SVG nhẹ, không dùng canvas/ảnh bitmap, tuân thủ nghiêm ngặt Reduced Motion.
 */
export const RobotFaceEffects: React.FC<RobotFaceEffectsProps> = ({
  effects,
  intensity = 1,
  reducedMotion = false,
  layer,
}) => {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  if (!effects || effects.length === 0 || clampedIntensity <= 0) {
    return null;
  }

  // --- 1. Background Layer (Zzz bay bên ngoài cụm ngũ quan) ---
  if (layer === 'background') {
    if (!effects.includes('zzz')) {
      return null;
    }

    const baseOpacity = 0.85 * clampedIntensity;

    return (
      <g id="effect-background-zzz" pointerEvents="none" aria-hidden="true">
        {/* Glyph Zzz 1: Nhỏ nhất */}
        <motion.text
          x="315"
          y="85"
          fill="#c084fc"
          fontSize="11"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={
            reducedMotion
              ? { opacity: baseOpacity, y: 0, scale: 1 }
              : {
                  opacity: [0, baseOpacity, baseOpacity * 0.8, 0],
                  y: [0, -8, -16, -24],
                  scale: [0.8, 1, 1.05, 0.9],
                }
          }
          transition={
            reducedMotion
              ? { duration: 0.01 }
              : {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.2, 0.7, 1],
                  delay: 0,
                }
          }
        >
          Z
        </motion.text>

        {/* Glyph Zzz 2: Trung bình */}
        <motion.text
          x="332"
          y="68"
          fill="#c084fc"
          fontSize="14"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={
            reducedMotion
              ? { opacity: baseOpacity * 0.9, y: 0, scale: 1 }
              : {
                  opacity: [0, baseOpacity * 0.9, baseOpacity * 0.7, 0],
                  y: [0, -9, -18, -26],
                  scale: [0.8, 1, 1.1, 0.9],
                }
          }
          transition={
            reducedMotion
              ? { duration: 0.01 }
              : {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.2, 0.7, 1],
                  delay: 0.7,
                }
          }
        >
          Z
        </motion.text>

        {/* Glyph Zzz 3: Lớn nhất */}
        <motion.text
          x="352"
          y="48"
          fill="#d8b4fe"
          fontSize="17"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={
            reducedMotion
              ? { opacity: baseOpacity, y: 0, scale: 1 }
              : {
                  opacity: [0, baseOpacity, baseOpacity * 0.6, 0],
                  y: [0, -10, -20, -30],
                  scale: [0.8, 1, 1.15, 0.9],
                }
          }
          transition={
            reducedMotion
              ? { duration: 0.01 }
              : {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.2, 0.7, 1],
                  delay: 1.4,
                }
          }
        >
          Z
        </motion.text>
      </g>
    );
  }

  // --- 2. Foreground Layer (Stars, Sweat, Blush bám theo facial-content) ---
  if (layer === 'foreground') {
    const hasStars = effects.includes('stars');
    const hasSweat = effects.includes('sweat');
    const hasBlush = effects.includes('blush');

    if (!hasStars && !hasSweat && !hasBlush) {
      return null;
    }

    const starOpacity = 0.9 * clampedIntensity;
    const sweatOpacity = 0.85 * clampedIntensity;
    const blushHaloOpacity = 0.45 * clampedIntensity;

    return (
      <g id="effect-foreground-layer" pointerEvents="none" aria-hidden="true">
        {/* Blush Luminous Halo Enhancement */}
        {hasBlush && (
          <g id="effect-blush-halo">
            <motion.ellipse
              cx="92"
              cy="146"
              rx="30"
              ry="16"
              fill="#fb7185"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                reducedMotion
                  ? { opacity: blushHaloOpacity, scale: 1 }
                  : {
                      opacity: [blushHaloOpacity * 0.7, blushHaloOpacity, blushHaloOpacity * 0.7],
                      scale: [0.95, 1.05, 0.95],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
              }
            />
            <motion.ellipse
              cx="308"
              cy="146"
              rx="30"
              ry="16"
              fill="#fb7185"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                reducedMotion
                  ? { opacity: blushHaloOpacity, scale: 1 }
                  : {
                      opacity: [blushHaloOpacity * 0.7, blushHaloOpacity, blushHaloOpacity * 0.7],
                      scale: [0.95, 1.05, 0.95],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
              }
            />
          </g>
        )}

        {/* Stars Lấp Lánh Quanh Mắt (4 ngôi sao cố định) */}
        {hasStars && (
          <g id="effect-stars">
            {/* Star 1: Góc trái mắt trái */}
            <motion.path
              d={STAR_4_PATH}
              fill="#fde047"
              transform="translate(98, 88)"
              initial={{ opacity: 0, scale: 0 }}
              animate={
                reducedMotion
                  ? { opacity: starOpacity, scale: 1, rotate: 0 }
                  : {
                      opacity: [starOpacity * 0.3, starOpacity, starOpacity * 0.3],
                      scale: [0.7, 1.1, 0.7],
                      rotate: [0, 45, 90],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0 }
              }
            />

            {/* Star 2: Phía trên mắt trái */}
            <motion.path
              d={STAR_4_PATH}
              fill="#fef08a"
              transform="translate(156, 76) scale(0.75)"
              initial={{ opacity: 0, scale: 0 }}
              animate={
                reducedMotion
                  ? { opacity: starOpacity, scale: 0.75, rotate: 15 }
                  : {
                      opacity: [starOpacity, starOpacity * 0.3, starOpacity],
                      scale: [0.9, 0.5, 0.9],
                      rotate: [15, 60, 105],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }
              }
            />

            {/* Star 3: Phía trên mắt phải */}
            <motion.path
              d={STAR_4_PATH}
              fill="#fef08a"
              transform="translate(244, 76) scale(0.75)"
              initial={{ opacity: 0, scale: 0 }}
              animate={
                reducedMotion
                  ? { opacity: starOpacity, scale: 0.75, rotate: -15 }
                  : {
                      opacity: [starOpacity, starOpacity * 0.3, starOpacity],
                      scale: [0.9, 0.5, 0.9],
                      rotate: [-15, -60, -105],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }
              }
            />

            {/* Star 4: Góc phải mắt phải */}
            <motion.path
              d={STAR_4_PATH}
              fill="#fde047"
              transform="translate(302, 88)"
              initial={{ opacity: 0, scale: 0 }}
              animate={
                reducedMotion
                  ? { opacity: starOpacity, scale: 1, rotate: 0 }
                  : {
                      opacity: [starOpacity * 0.3, starOpacity, starOpacity * 0.3],
                      scale: [0.7, 1.1, 0.7],
                      rotate: [0, -45, -90],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }
              }
            />
          </g>
        )}

        {/* Sweat Giọt Mồ Hôi Lo Lắng Trên Thái Dương Phải */}
        {hasSweat && (
          <g id="effect-sweat">
            <motion.path
              d={SWEAT_DROP_PATH}
              fill="#38bdf8"
              transform="translate(318, 86) rotate(12)"
              initial={{ opacity: 0, y: 0 }}
              animate={
                reducedMotion
                  ? { opacity: sweatOpacity, y: 0 }
                  : {
                      opacity: [0, sweatOpacity, sweatOpacity * 0.9, 0],
                      y: [0, 3, 7, 10],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : {
                      duration: 1.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      times: [0, 0.25, 0.75, 1],
                    }
              }
            />
          </g>
        )}
      </g>
    );
  }

  return null;
};
