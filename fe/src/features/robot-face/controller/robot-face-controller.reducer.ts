import {
  RobotFaceCommand,
  RobotFaceControllerAction,
  RobotFaceControllerState,
  MAX_QUEUE_SIZE,
  PRIORITY_WEIGHTS,
} from './robot-face-controller.types';

export const initialControllerState: RobotFaceControllerState = {
  activeCommand: null,
  queue: [],
};

export interface ApplySendCommandResult {
  nextState: RobotFaceControllerState;
  accepted: boolean;
  reason?: 'duplicate-id' | 'invalid-duration' | 'queue-full';
  isQueueOnly: boolean;
}

/**
 * Thuật toán thuần túy tiếp nhận và xếp lịch một command vào controller state
 */
export function applySendCommand(
  state: RobotFaceControllerState,
  command: RobotFaceCommand
): ApplySendCommandResult {
  // 1. Kiểm tra duplicate ID với active command và queue
  if (state.activeCommand?.id === command.id || state.queue.some((c) => c.id === command.id)) {
    return {
      nextState: state,
      accepted: false,
      reason: 'duplicate-id',
      isQueueOnly: true,
    };
  }

  // 2. Nếu không có active command -> Lập tức kích hoạt
  if (state.activeCommand === null) {
    return {
      nextState: {
        activeCommand: command,
        queue: state.queue,
      },
      accepted: true,
      isQueueOnly: false,
    };
  }

  const currentWeight = PRIORITY_WEIGHTS[state.activeCommand.priority];
  const newWeight = PRIORITY_WEIGHTS[command.priority];

  // 3. Nếu priority mới >= priority hiện tại (Latest-Wins cho cùng priority) -> Ngắt active command
  if (newWeight >= currentWeight) {
    return {
      nextState: {
        activeCommand: command,
        queue: state.queue,
      },
      accepted: true,
      isQueueOnly: false,
    };
  }

  // 4. Nếu priority mới < priority hiện tại -> Đưa vào hàng đợi (Queue)
  if (state.queue.length < MAX_QUEUE_SIZE) {
    return {
      nextState: {
        activeCommand: state.activeCommand,
        queue: [...state.queue, command],
      },
      accepted: true,
      isQueueOnly: true,
    };
  }

  // 5. Hàng đợi đã đầy (20 commands) -> Áp dụng chính sách tràn (Overflow Policy)
  const minQueuedWeight = Math.min(...state.queue.map((c) => PRIORITY_WEIGHTS[c.priority]));

  // 5.1 Nếu priority mới không cao hơn priority thấp nhất trong queue -> Reject
  if (newWeight <= minQueuedWeight) {
    return {
      nextState: state,
      accepted: false,
      reason: 'queue-full',
      isQueueOnly: true,
    };
  }

  // 5.2 Nếu priority mới cao hơn -> Loại bỏ command được chèn muộn nhất trong nhóm lowest priority (bảo toàn FIFO)
  let lastLowestIdx = -1;
  for (let i = state.queue.length - 1; i >= 0; i--) {
    if (PRIORITY_WEIGHTS[state.queue[i].priority] === minQueuedWeight) {
      lastLowestIdx = i;
      break;
    }
  }

  const newQueue = [...state.queue];
  if (lastLowestIdx !== -1) {
    newQueue.splice(lastLowestIdx, 1);
  }
  newQueue.push(command);

  return {
    nextState: {
      activeCommand: state.activeCommand,
      queue: newQueue,
    },
    accepted: true,
    isQueueOnly: true,
  };
}

/**
 * Thuật toán thuần túy lấy lệnh tiếp theo từ queue (ưu tiên priority cao nhất, FIFO nếu trùng)
 */
export function activateNextFromQueue(queue: RobotFaceCommand[]): {
  nextActive: RobotFaceCommand | null;
  nextQueue: RobotFaceCommand[];
} {
  if (queue.length === 0) {
    return { nextActive: null, nextQueue: [] };
  }

  // Tìm mức priority cao nhất hiện có trong queue
  const maxWeight = Math.max(...queue.map((c) => PRIORITY_WEIGHTS[c.priority]));

  // Lấy phần tử ĐẦU TIÊN có mức priority cao nhất đó (bảo toàn FIFO)
  const targetIdx = queue.findIndex((c) => PRIORITY_WEIGHTS[c.priority] === maxWeight);

  if (targetIdx === -1) {
    return { nextActive: null, nextQueue: [] };
  }

  const nextActive = queue[targetIdx];
  const nextQueue = [...queue.slice(0, targetIdx), ...queue.slice(targetIdx + 1)];

  return { nextActive, nextQueue };
}

/**
 * Pure Reducer cho Robot Face Controller
 */
export function robotFaceControllerReducer(
  state: RobotFaceControllerState,
  action: RobotFaceControllerAction
): RobotFaceControllerState {
  switch (action.type) {
    case 'SEND_COMMAND': {
      const result = applySendCommand(state, action.command);
      return result.nextState;
    }

    case 'COMPLETE_COMMAND': {
      // Lớp bảo vệ: Bỏ qua action nếu commandId không khớp với active command hiện tại
      if (state.activeCommand?.id !== action.commandId) {
        return state;
      }
      const { nextActive, nextQueue } = activateNextFromQueue(state.queue);
      return {
        activeCommand: nextActive,
        queue: nextQueue,
      };
    }

    case 'DISMISS_ACTIVE': {
      const { nextActive, nextQueue } = activateNextFromQueue(state.queue);
      return {
        activeCommand: nextActive,
        queue: nextQueue,
      };
    }

    case 'CLEAR_ALL': {
      return {
        activeCommand: null,
        queue: [],
      };
    }

    default:
      return state;
  }
}
