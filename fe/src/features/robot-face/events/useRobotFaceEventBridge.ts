import { useState, useRef, useCallback } from 'react';
import {
  OperationalBaseline,
  RobotFaceEventResult,
  RobotFaceEventHistoryItem,
  UseRobotFaceEventBridgeReturn,
} from './robot-face-event.types';
import { validateRobotFaceEvent, createSafeInputSummary } from './robot-face-event.validation';
import {
  mapOperationalStateToExpression,
  mapEmotionToVisual,
  normalizeRobotFaceEvent,
} from './robot-face-event.mapper';
import { useRobotFaceController } from '../controller/useRobotFaceController';

const INITIAL_BASELINE: OperationalBaseline = {
  state: 'idle',
  expression: 'idle',
  intensity: 1.0,
  effects: [],
  commandId: 'baseline_idle',
};

const MAX_DEDUP_REGISTRY_SIZE = 100;
const MAX_HISTORY_SIZE = 10;

/**
 * Custom Hook kết nối và điều phối giữa Semantic Events và Controller Layer
 * Đóng gói hoàn toàn useRobotFaceController, đảm bảo Baseline Restoration Invariant và Command-Coupled Effects.
 */
export function useRobotFaceEventBridge(): UseRobotFaceEventBridgeReturn {
  // 1. Compose and own an isolated controller instance
  const controller = useRobotFaceController();

  // 2. State & Ref đồng bộ cho Operational Baseline (luôn duy trì effects: [])
  const [baseline, setBaseline] = useState<OperationalBaseline>(INITIAL_BASELINE);
  const baselineRef = useRef<OperationalBaseline>(INITIAL_BASELINE);

  // 3. Event History State
  const [eventHistory, setEventHistory] = useState<RobotFaceEventHistoryItem[]>([]);

  // 4. Bounded Deduplication Registry (tối đa 100 ID gần nhất)
  const recentEventIdsSet = useRef<Set<string>>(new Set());
  const recentEventIdsQueue = useRef<string[]>([]);

  const registerEventId = useCallback((id: string) => {
    if (recentEventIdsSet.current.has(id)) {
      return;
    }
    recentEventIdsSet.current.add(id);
    recentEventIdsQueue.current.push(id);

    if (recentEventIdsQueue.current.length > MAX_DEDUP_REGISTRY_SIZE) {
      const oldestId = recentEventIdsQueue.current.shift();
      if (oldestId !== undefined) {
        recentEventIdsSet.current.delete(oldestId);
      }
    }
  }, []);

  // Helper ghi nhận lịch sử an toàn
  const addHistoryItem = useCallback((item: RobotFaceEventHistoryItem) => {
    setEventHistory((prev) => [item, ...prev].slice(0, MAX_HISTORY_SIZE));
  }, []);

  // Helper bảo đảm baseline trong queue mà không đọc stale snapshot
  const ensureBaseline = useCallback(
    (currentBaseline: OperationalBaseline): { success: boolean; controllerReason?: 'duplicate-id' | 'invalid-duration' | 'queue-full' } => {
      const res = controller.send({
        id: currentBaseline.commandId,
        expression: currentBaseline.expression,
        intensity: currentBaseline.intensity,
        effects: currentBaseline.effects,
        priority: 'normal',
        durationMs: undefined,
      });

      if (res.accepted || res.reason === 'duplicate-id') {
        return { success: true };
      }

      return { success: false, controllerReason: res.reason };
    },
    [controller]
  );

  // 5. Main Dispatch Event Pipeline
  const dispatchEvent = useCallback(
    (input: unknown): RobotFaceEventResult => {
      // BƯỚC 1: Validate input runtime
      const valResult = validateRobotFaceEvent(input);
      if (!valResult.valid) {
        const rawId =
          typeof input === 'object' && input !== null && 'id' in input && typeof (input as { id: unknown }).id === 'string'
            ? (input as { id: string }).id
            : `evt_invalid_${Date.now()}`;

        const result: RobotFaceEventResult = {
          status: 'rejected',
          accepted: false,
          eventId: rawId,
          reason: 'invalid-event',
        };

        addHistoryItem({
          id: rawId,
          timestamp: Date.now(),
          inputSummary: createSafeInputSummary(input),
          result,
        });

        return result;
      }

      // BƯỚC 2: Normalize event thành typed object mới
      const event = normalizeRobotFaceEvent(input);

      // BƯỚC 3: Kiểm tra trùng lặp Event ID (nếu caller truyền ID rõ ràng)
      const rawInput = input as Record<string, unknown>;
      if (typeof rawInput.id === 'string' && rawInput.id.trim() !== '') {
        if (recentEventIdsSet.current.has(event.id)) {
          const result: RobotFaceEventResult = {
            status: 'rejected',
            accepted: false,
            eventId: event.id,
            reason: 'duplicate-event-id',
          };

          addHistoryItem({
            id: event.id,
            timestamp: Date.now(),
            normalizedEvent: event,
            inputSummary: createSafeInputSummary(input),
            result,
          });

          return result;
        }
      }

      // BƯỚC 4: Đăng ký ID vào registry
      registerEventId(event.id);

      // BƯỚC 5: Xử lý theo từng loại Event

      // 5.1 STATE EVENT
      if (event.type === 'state') {
        const targetExpr = mapOperationalStateToExpression(event.state);
        const newBaseline: OperationalBaseline = {
          state: event.state,
          expression: targetExpr,
          intensity: event.intensity ?? 1.0,
          effects: [],
          commandId: `baseline_${event.state}`,
        };

        // Cập nhật baseline snapshot đồng bộ
        baselineRef.current = newBaseline;
        setBaseline(newBaseline);

        // Clear active/queue cũ và kích hoạt baseline mới sạch sẽ
        controller.clear();
        const sendRes = controller.send({
          id: newBaseline.commandId,
          expression: newBaseline.expression,
          intensity: newBaseline.intensity,
          effects: newBaseline.effects,
          priority: 'normal',
          durationMs: undefined,
        });

        const result: RobotFaceEventResult = sendRes.accepted
          ? { status: 'accepted', accepted: true, eventId: event.id }
          : {
              status: 'rejected',
              accepted: false,
              eventId: event.id,
              reason: 'controller-rejected',
              controllerReason: sendRes.reason,
            };

        addHistoryItem({
          id: event.id,
          timestamp: Date.now(),
          normalizedEvent: event,
          inputSummary: createSafeInputSummary(input),
          result,
        });

        return result;
      }

      // 5.2 EMOTION EVENT
      if (event.type === 'emotion') {
        // Trường hợp Neutral Emotion: kết thúc emotion ngay và trở về baseline hiện tại
        if (event.emotion === 'neutral') {
          controller.clear();
          const currentB = baselineRef.current;
          const sendRes = controller.send({
            id: currentB.commandId,
            expression: currentB.expression,
            intensity: currentB.intensity,
            effects: currentB.effects,
            priority: 'normal',
            durationMs: undefined,
          });

          const result: RobotFaceEventResult = sendRes.accepted
            ? { status: 'accepted', accepted: true, eventId: event.id }
            : {
                status: 'rejected',
                accepted: false,
                eventId: event.id,
                reason: 'controller-rejected',
                controllerReason: sendRes.reason,
              };

          addHistoryItem({
            id: event.id,
            timestamp: Date.now(),
            normalizedEvent: event,
            inputSummary: createSafeInputSummary(input),
            result,
          });

          return result;
        }

        // Transient Emotion (khác neutral): gửi command high-priority kèm effects
        const currentB = baselineRef.current;
        const visual = mapEmotionToVisual(event.emotion, currentB);

        const emoSendRes = controller.send({
          id: `${event.id}:emotion`,
          expression: visual.expression,
          effects: visual.effects,
          intensity: event.intensity ?? 1.0,
          durationMs: event.durationMs ?? 3000,
          priority: 'high',
        });

        if (!emoSendRes.accepted) {
          const result: RobotFaceEventResult = {
            status: 'rejected',
            accepted: false,
            eventId: event.id,
            reason: 'controller-rejected',
            controllerReason: emoSendRes.reason,
          };

          addHistoryItem({
            id: event.id,
            timestamp: Date.now(),
            normalizedEvent: event,
            inputSummary: createSafeInputSummary(input),
            result,
          });

          return result;
        }

        // Primary command accepted -> bảo đảm baseline trong queue
        const ensureRes = ensureBaseline(currentB);
        const result: RobotFaceEventResult = ensureRes.success
          ? { status: 'accepted', accepted: true, eventId: event.id }
          : {
              status: 'partial',
              accepted: true,
              eventId: event.id,
              reason: 'baseline-restore-failed',
              controllerReason: ensureRes.controllerReason,
            };

        addHistoryItem({
          id: event.id,
          timestamp: Date.now(),
          normalizedEvent: event,
          inputSummary: createSafeInputSummary(input),
          result,
        });

        return result;
      }

      // 5.3 RESET EVENT
      baselineRef.current = INITIAL_BASELINE;
      setBaseline(INITIAL_BASELINE);
      controller.clear();
      const sendRes = controller.send({
        id: INITIAL_BASELINE.commandId,
        expression: INITIAL_BASELINE.expression,
        intensity: INITIAL_BASELINE.intensity,
        effects: INITIAL_BASELINE.effects,
        priority: 'normal',
        durationMs: undefined,
      });

      const result: RobotFaceEventResult = sendRes.accepted
        ? { status: 'accepted', accepted: true, eventId: event.id }
        : {
            status: 'rejected',
            accepted: false,
            eventId: event.id,
            reason: 'controller-rejected',
            controllerReason: sendRes.reason,
          };

      addHistoryItem({
        id: event.id,
        timestamp: Date.now(),
        normalizedEvent: event,
        inputSummary: createSafeInputSummary(input),
        result,
      });

      return result;
    },
    [controller, registerEventId, addHistoryItem, ensureBaseline]
  );

  // 6. Reset wrapper gọi qua pipeline chuẩn
  const reset = useCallback((): RobotFaceEventResult => {
    const generatedId = `evt_reset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return dispatchEvent({ type: 'reset', id: generatedId });
  }, [dispatchEvent]);

  return {
    operationalState: baseline.state,
    baseline,
    expression: controller.expression,
    intensity: controller.intensity,
    effects: controller.activeEffects,
    activeCommand: controller.activeCommand,
    queue: controller.queue,
    dispatchEvent,
    reset,
    eventHistory,
  };
}
