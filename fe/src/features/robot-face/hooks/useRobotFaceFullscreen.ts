'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseRobotFaceFullscreenReturn {
  /** Reference gắn vào container cần chuyển đổi fullscreen */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Trạng thái hiện tại có đang ở chế độ Fullscreen hay không */
  isFullscreen: boolean;
  /** Kích hoạt chế độ Fullscreen */
  enterFullscreen: () => Promise<void>;
  /** Thoát chế độ Fullscreen */
  exitFullscreen: () => Promise<void>;
  /** Đảo ngược trạng thái Fullscreen */
  toggleFullscreen: () => Promise<void>;
  /** Trình duyệt có hỗ trợ Fullscreen API hay không */
  isSupported: boolean;
}

/**
 * Custom Hook quản lý chế độ Fullscreen an toàn và đồng bộ cho Robot Face
 *
 * Tính năng:
 * - Tự động đồng bộ với `document.fullscreenElement` qua sự kiện `fullscreenchange`
 * - Fallback sang CSS Fullscreen Overlay khi trình duyệt chặn hoặc không hỗ trợ Fullscreen API
 * - Hỗ trợ phím tắt `Escape`
 * - Dọn dẹp đầy đủ Event Listeners khi unmount
 * - Đảm bảo an toàn SSR (Next.js client-only execution)
 */
export function useRobotFaceFullscreen(): UseRobotFaceFullscreenReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Kiểm tra hỗ trợ Fullscreen API sau khi mount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const supported = Boolean(
      document.fullscreenEnabled ||
        (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
        (document as unknown as { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
        (document as unknown as { msFullscreenEnabled?: boolean }).msFullscreenEnabled
    );
    setIsSupported(supported);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) {
      setIsFullscreen(true);
      return;
    }

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      } else if ((el as unknown as { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
        await (el as unknown as { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
      } else if ((el as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
        await (el as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
      } else {
        // Fallback sang CSS Fullscreen mode nếu API không tồn tại
        setIsFullscreen(true);
      }
    } catch {
      // Fallback sang CSS Fullscreen mode nếu API bị từ chối hoặc lỗi
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        } else if ((document as unknown as { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
          await (document as unknown as { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
        } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
          await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
        }
      }
    } catch {
      // Bỏ qua lỗi nếu exitFullscreen không thành công
    } finally {
      setIsFullscreen(false);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Lắng nghe sự kiện fullscreenchange của trình duyệt
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      const isNativeFullscreen = Boolean(
        document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
          (document as unknown as { mozFullScreenElement?: Element }).mozFullScreenElement ||
          (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
      );

      if (isNativeFullscreen) {
        // Nếu native fullscreen đang kích hoạt cho container này hoặc con của nó
        if (
          containerRef.current &&
          (document.fullscreenElement === containerRef.current ||
            containerRef.current.contains(document.fullscreenElement))
        ) {
          setIsFullscreen(true);
        } else if (!containerRef.current) {
          setIsFullscreen(true);
        }
      } else {
        // Trình duyệt đã thoát native fullscreen
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (isFullscreen) {
          exitFullscreen();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreen]);

  return {
    containerRef,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    isSupported,
  };
}
