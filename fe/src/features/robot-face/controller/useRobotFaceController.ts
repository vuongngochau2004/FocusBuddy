import { useReducer, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  RobotFaceCommandInput,
  RobotFaceCommand,
  RobotFaceSendResult,
  RobotFaceControllerState,
  UseRobotFaceControllerReturn,
  normalizeCommandEffects,
} from './robot-face-controller.types';
import {
  initialControllerState,
  robotFaceControllerReducer,
  applySendCommand,
  activateNextFromQueue,
} from './robot-face-controller.reducer';
import { RobotExpression, RobotFaceEffect } from '../robot-face.types';

/**
 * Chuẩn hóa input do caller truyền vào và kiểm tra hợp lệ
 */
function normalizeCommandInput(
  input: RobotFaceCommandInput,
  currentState: RobotFaceControllerState
): { command?: RobotFaceCommand; error?: 'duplicate-id' | 'invalid-duration' } {
  // 1. Kiểm tra durationMs
  if (input.durationMs !== undefined) {
    if (
      typeof input.durationMs !== 'number' ||
      !Number.isFinite(input.durationMs) ||
      input.durationMs <= 0
    ) {
      return { error: 'invalid-duration' };
    }
  }

  const intensity =
    input.intensity === undefined ? 1.0 : Math.max(0, Math.min(1, input.intensity));
  const priority = input.priority ?? 'normal';
  const effects = normalizeCommandEffects(input.effects);

  // 2. Xử lý ID
  let id = input.id;
  if (id !== undefined && id.trim() !== '') {
    id = id.trim();
    // Trùng ID với active command hoặc bất kỳ command nào trong queue
    if (currentState.activeCommand?.id === id || currentState.queue.some((c) => c.id === id)) {
      return { error: 'duplicate-id' };
    }
  } else {
    // Tự sinh ID duy nhất không trùng lặp
    let attempts = 0;
    do {
      id = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      attempts++;
    } while (
      (currentState.activeCommand?.id === id || currentState.queue.some((c) => c.id === id)) &&
      attempts < 10
    );
  }

  return {
    command: {
      id,
      expression: input.expression,
      intensity,
      durationMs: input.durationMs,
      priority,
      effects,
    },
  };
}

/**
 * Custom Hook điều phối biểu cảm khuôn mặt Robot (Robot Face State Machine)
 * Hỗ trợ priority, interruption, queue, duration timer, synchronous admission và command-coupled effects.
 */
export function useRobotFaceController(): UseRobotFaceControllerReturn {
  const [state, dispatch] = useReducer(robotFaceControllerReducer, initialControllerState);

  // Ref lưu trạng thái logic mới nhất để hỗ trợ synchronous send liên tiếp trong cùng event loop
  const stateRef = useRef<RobotFaceControllerState>(state);
  stateRef.current = state;

  const generationRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentActiveIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Helper dọn dẹp timer và tăng generation token
  const clearActiveTimerAndIncrementGen = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    generationRef.current += 1;
  }, []);

  // 1. Gửi lệnh biểu cảm mới với synchronous admission
  const send = useCallback(
    (input: RobotFaceCommandInput): RobotFaceSendResult => {
      const currentState = stateRef.current;
      const { command, error } = normalizeCommandInput(input, currentState);

      if (error || !command) {
        return {
          accepted: false,
          commandId: input.id ?? '',
          reason: error,
        };
      }

      const { nextState, accepted, reason, isQueueOnly } = applySendCommand(currentState, command);

      if (!accepted) {
        return {
          accepted: false,
          commandId: command.id,
          reason,
        };
      }

      // Nếu active command bị thay đổi (không phải queue-only) -> Invalidate timer của active cũ
      if (!isQueueOnly) {
        clearActiveTimerAndIncrementGen();
      }

      // Cập nhật stateRef đồng bộ ngay lập tức để lần send tiếp theo trong cùng tick thấy state mới
      stateRef.current = nextState;

      // Dispatch action để React đồng bộ state UI
      dispatch({ type: 'SEND_COMMAND', command });

      return {
        accepted: true,
        commandId: command.id,
      };
    },
    [clearActiveTimerAndIncrementGen]
  );

  // 2. Bỏ qua active command hiện tại và lấy lệnh kế tiếp từ queue
  const dismiss = useCallback(() => {
    clearActiveTimerAndIncrementGen();
    const { nextActive, nextQueue } = activateNextFromQueue(stateRef.current.queue);
    stateRef.current = { activeCommand: nextActive, queue: nextQueue };
    dispatch({ type: 'DISMISS_ACTIVE' });
  }, [clearActiveTimerAndIncrementGen]);

  // 3. Xóa sạch active command và queue, trở về idle
  const clear = useCallback(() => {
    clearActiveTimerAndIncrementGen();
    stateRef.current = { activeCommand: null, queue: [] };
    dispatch({ type: 'CLEAR_ALL' });
  }, [clearActiveTimerAndIncrementGen]);

  // 4. Timer Lifecycle: Chỉ theo dõi activeCommand identity (ID & durationMs)
  // Queue-only updates KHÔNG làm trigger effect này, do đó timer active không bao giờ bị reset!
  useEffect(() => {
    isMountedRef.current = true;
    clearActiveTimerAndIncrementGen();

    const active = state.activeCommand;
    if (!active || active.durationMs === undefined || active.durationMs <= 0) {
      currentActiveIdRef.current = active?.id ?? null;
      return;
    }

    const activeId = active.id;
    const duration = active.durationMs;
    const currentGen = generationRef.current;
    currentActiveIdRef.current = activeId;

    timerRef.current = setTimeout(() => {
      if (
        currentGen === generationRef.current &&
        isMountedRef.current &&
        currentActiveIdRef.current === activeId
      ) {
        dispatch({ type: 'COMPLETE_COMMAND', commandId: activeId });
      }
    }, duration);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      generationRef.current += 1;
    };
  }, [state.activeCommand?.id, state.activeCommand?.durationMs, clearActiveTimerAndIncrementGen]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearActiveTimerAndIncrementGen();
    };
  }, [clearActiveTimerAndIncrementGen]);

  // Dữ liệu presentation phái sinh
  const expression: RobotExpression = state.activeCommand?.expression ?? 'idle';
  const intensity: number = state.activeCommand?.intensity ?? 1.0;
  const activeEffects: readonly RobotFaceEffect[] = state.activeCommand?.effects ?? [];

  // Queue read-only
  const readOnlyQueue = useMemo(() => Object.freeze([...state.queue]), [state.queue]);

  return {
    expression,
    intensity,
    activeEffects,
    activeCommand: state.activeCommand,
    queue: readOnlyQueue,
    send,
    dismiss,
    clear,
  };
}
