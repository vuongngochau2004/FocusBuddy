'use client';

import React from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useRobotFaceFullscreen, UseRobotFaceFullscreenReturn } from '../hooks/useRobotFaceFullscreen';

export interface RobotFaceFullscreenContainerProps {
  /** Nội dung khuôn mặt robot được bao bọc (thường là `<RobotFace />`) */
  children: React.ReactNode;
  /** Tùy biến CSS class cho container ở chế độ bình thường */
  className?: string;
  /** Tùy biến CSS class cho vùng chứa khuôn mặt ở chế độ bình thường */
  contentClassName?: string;
  /** Hook fullscreen bên ngoài nếu muốn chia sẻ state (tùy chọn) */
  fullscreenState?: UseRobotFaceFullscreenReturn;
  /** Có hiển thị nút Fullscreen mặc định hay không (mặc định: true) */
  showFullscreenButton?: boolean;
  /** Tùy chọn vị trí hoặc style cho nút Fullscreen */
  buttonClassName?: string;
  /** Tiêu đề / Tooltip cho nút Fullscreen */
  buttonLabel?: string;
  /** Callback được gọi khi chuyển đổi fullscreen */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

/**
 * RobotFaceFullscreenContainer
 *
 * Wrapper chuyên dụng cho Robot Face Animation:
 * - Cung cấp nút Fullscreen chuẩn UI FocusBuddy với Lucide Icon.
 * - Chuyển sang chế độ toàn màn hình tối ưu cho màn hình robot / Raspberry Pi / Demo laptop.
 * - Tự động scale tỉ lệ 400:240 thông qua `min(viewport width, viewport height)` giữ nguyên tỷ lệ SVG.
 * - Nền tối `#05080f` không scrollbar, không padding/margin rò rỉ từ layout cha.
 * - Nút Exit Fullscreen mờ tinh tế ở góc trên bên phải, hỗ trợ phím ESC và Fullscreen API.
 * - Không làm gián đoạn hay reset animation/emotion state của component con.
 */
export const RobotFaceFullscreenContainer: React.FC<RobotFaceFullscreenContainerProps> = ({
  children,
  className = '',
  contentClassName = '',
  fullscreenState: externalFullscreen,
  showFullscreenButton = true,
  buttonClassName = '',
  buttonLabel = 'Toàn màn hình',
  onFullscreenChange,
}) => {
  const internalFullscreen = useRobotFaceFullscreen();
  const fullscreen = externalFullscreen ?? internalFullscreen;
  const { containerRef, isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen } = fullscreen;

  React.useEffect(() => {
    onFullscreenChange?.(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-[#05080f] flex items-center justify-center overflow-hidden m-0 p-4 sm:p-8 select-none'
          : `relative flex flex-col items-center justify-center ${className}`
      }
      style={isFullscreen ? { margin: 0, padding: '2rem' } : undefined}
    >
      {/* Nút Exit Fullscreen (chỉ hiển thị khi đang Fullscreen) */}
      {isFullscreen && (
        <button
          type="button"
          onClick={exitFullscreen}
          aria-label="Thoát toàn màn hình (ESC)"
          title="Thoát toàn màn hình (ESC)"
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[10000] p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800/90 text-slate-400 hover:text-white border border-slate-700/50 shadow-xl backdrop-blur-md opacity-40 hover:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Vùng hiển thị Robot Face */}
      <div
        className={
          isFullscreen
            ? 'w-full h-full flex items-center justify-center pointer-events-none'
            : contentClassName
        }
        style={
          isFullscreen
            ? {
                maxWidth: 'min(94vw, calc(94vh * (400 / 240)))',
                width: '100%',
                aspectRatio: '400 / 240',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }
            : undefined
        }
      >
        <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-full">
          {children}
        </div>
      </div>

      {/* Nút Fullscreen (ở chế độ thường) */}
      {!isFullscreen && showFullscreenButton && (
        <button
          type="button"
          onClick={enterFullscreen}
          aria-label={buttonLabel}
          title={buttonLabel}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/50 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 shadow-sm ${buttonClassName}`}
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{buttonLabel}</span>
        </button>
      )}
    </div>
  );
};
