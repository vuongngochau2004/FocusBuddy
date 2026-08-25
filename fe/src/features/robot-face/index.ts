export { RobotFace } from './components/RobotFace';
export { RobotFaceEffects } from './components/RobotFaceEffects';
export type { RobotFaceEffectsProps } from './components/RobotFaceEffects';
export { RobotFaceFullscreenContainer } from './components/RobotFaceFullscreenContainer';
export type { RobotFaceFullscreenContainerProps } from './components/RobotFaceFullscreenContainer';
export { useRobotFaceFullscreen } from './hooks/useRobotFaceFullscreen';
export type { UseRobotFaceFullscreenReturn } from './hooks/useRobotFaceFullscreen';
export {
  expressionPresets,
  idleFace,
  interpolateFaceParameters,
  lerp,
} from './expression-presets';
export type {
  FaceParameters,
  RobotExpression,
  RobotFaceProps,
  RobotFaceEffect,
  RobotBlinkProfile,
} from './robot-face.types';
export {
  VALID_ROBOT_EXPRESSIONS,
  VALID_ROBOT_EFFECTS,
  normalizeRobotFaceEffects,
} from './robot-face.types';
export {
  BLINK_PROFILES,
  getRandomBlinkDelay,
} from './blink-utils';

// Controller Layer Exports
export { useRobotFaceController } from './controller/useRobotFaceController';
export {
  robotFaceControllerReducer,
  applySendCommand,
  activateNextFromQueue,
  initialControllerState,
} from './controller/robot-face-controller.reducer';
export type {
  RobotFacePriority,
  RobotFaceCommandInput,
  RobotFaceCommand,
  RobotFaceSendResult,
  RobotFaceControllerState,
  RobotFaceControllerAction,
  UseRobotFaceControllerReturn,
} from './controller/robot-face-controller.types';
export {
  PRIORITY_WEIGHTS,
  MAX_QUEUE_SIZE,
  normalizeCommandEffects,
} from './controller/robot-face-controller.types';

// Semantic Event Layer Exports
export { useRobotFaceEventBridge } from './events/useRobotFaceEventBridge';
export {
  mapOperationalStateToExpression,
  mapEmotionToExpression,
  mapEmotionToVisual,
  normalizeRobotFaceEvent,
} from './events/robot-face-event.mapper';
export {
  validateRobotFaceEvent,
  createSafeInputSummary,
} from './events/robot-face-event.validation';
export type {
  RobotOperationalState,
  RobotEmotion,
  ResolvedEmotionVisual,
  OperationalBaseline,
  RobotStateEvent,
  RobotEmotionEvent,
  RobotResetEvent,
  RobotFaceEvent,
  RobotFaceEventStatus,
  RobotFaceEventResult,
  RobotFaceEventHistoryItem,
  UseRobotFaceEventBridgeReturn,
} from './events/robot-face-event.types';
export {
  VALID_OPERATIONAL_STATES,
  VALID_ROBOT_EMOTIONS,
} from './events/robot-face-event.types';
