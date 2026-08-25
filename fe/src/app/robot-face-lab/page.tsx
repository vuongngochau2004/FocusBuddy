'use client';

import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import {
  RobotFace,
  RobotFaceFullscreenContainer,
  useRobotFaceFullscreen,
  RobotExpression,
  RobotFaceEffect,
  RobotFacePriority,
  RobotOperationalState,
  RobotEmotion,
  VALID_ROBOT_EXPRESSIONS,
  VALID_ROBOT_EFFECTS,
  useRobotFaceEventBridge,
  useRobotFaceController,
} from '@/features/robot-face';

const OPERATIONAL_STATES: { key: RobotOperationalState; label: string; icon: string; desc: string }[] = [
  { key: 'idle', label: 'Idle (Nghỉ)', icon: '🤖', desc: 'Trạng thái trung tính, bình tĩnh' },
  { key: 'listening', label: 'Listening (Lắng nghe)', icon: '👂', desc: 'Đang tiếp nhận âm thanh/lệnh' },
  { key: 'thinking', label: 'Thinking (Tư duy)', icon: '🤔', desc: 'Đang suy nghĩ, xử lý dữ liệu' },
  { key: 'speaking', label: 'Speaking (Phản hồi)', icon: '💬', desc: 'Đang trò chuyện, giải thích' },
];

const EMOTIONS: { key: RobotEmotion; label: string; icon: string; color: string }[] = [
  { key: 'neutral', label: 'Neutral (Về Baseline)', icon: '🔄', color: 'border-slate-600 text-slate-300 bg-slate-800/60' },
  { key: 'happy', label: 'Happy (Vui vẻ)', icon: '😄', color: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40' },
  { key: 'encouraging', label: 'Encouraging (Cổ vũ)', icon: '✨', color: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40' },
  { key: 'concerned', label: 'Concerned (Lo lắng)', icon: '😟', color: 'border-amber-500/50 text-amber-300 bg-amber-950/40' },
  { key: 'excited', label: 'Excited (Hào hứng)', icon: '🎉', color: 'border-rose-500/50 text-rose-300 bg-rose-950/40' },
  { key: 'sleepy', label: 'Sleepy (Buồn ngủ)', icon: '😴', color: 'border-purple-500/50 text-purple-300 bg-purple-950/40' },
  { key: 'surprised', label: 'Surprised (Ngạc nhiên)', icon: '😲', color: 'border-sky-500/50 text-sky-300 bg-sky-950/40' },
];

const EMOTION_DURATIONS: { label: string; value: number }[] = [
  { label: '2.0s', value: 2000 },
  { label: '3.0s (Mặc định)', value: 3000 },
  { label: '5.0s', value: 5000 },
];

const RAW_PRIORITIES: { key: RobotFacePriority; label: string; color: string }[] = [
  { key: 'low', label: 'Low', color: 'border-slate-600 text-slate-300 bg-slate-800/60' },
  { key: 'normal', label: 'Normal', color: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40' },
  { key: 'high', label: 'High', color: 'border-amber-500/50 text-amber-300 bg-amber-950/40' },
  { key: 'critical', label: 'Critical', color: 'border-rose-500/50 text-rose-300 bg-rose-950/40' },
];

const RAW_DURATIONS: { label: string; value: number | undefined }[] = [
  { label: '2.0s', value: 2000 },
  { label: '4.0s', value: 4000 },
  { label: '6.0s', value: 6000 },
  { label: 'Persistent', value: undefined },
];

/**
 * 1. Sub-component Semantic Event Simulator (Sử dụng useRobotFaceEventBridge)
 */
function SemanticEventSimulator() {
  const bridge = useRobotFaceEventBridge();
  const fullscreen = useRobotFaceFullscreen();

  // Visual preview controls
  const [previewSize, setPreviewSize] = useState<number>(440);
  const [animated, setAnimated] = useState<boolean>(true);
  const [autoBlink, setAutoBlink] = useState<boolean>(true);
  const [ambientMotion, setAmbientMotion] = useState<boolean>(true);

  // Form controls
  const [stateIntensity, setStateIntensity] = useState<number>(1.0);
  const [selectedEmotion, setSelectedEmotion] = useState<RobotEmotion>('happy');
  const [emotionDuration, setEmotionDuration] = useState<number>(3000);
  const [emotionIntensity, setEmotionIntensity] = useState<number>(1.0);
  const [customEventId, setCustomEventId] = useState<string>('');

  const handleDispatchState = (state: RobotOperationalState) => {
    bridge.dispatchEvent({
      type: 'state',
      state,
      intensity: stateIntensity,
      id: customEventId.trim() || undefined,
    });
    setCustomEventId('');
  };

  const handleDispatchEmotion = (emotion: RobotEmotion) => {
    bridge.dispatchEvent({
      type: 'emotion',
      emotion,
      durationMs: emotion === 'neutral' ? undefined : emotionDuration,
      intensity: emotionIntensity,
      id: customEventId.trim() || undefined,
    });
    setCustomEventId('');
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Visual Preview & Semantic Status */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        {/* Visual Preview Card */}
        <section
          aria-label="Robot Face Preview"
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-md"
        >
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800/50">
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              SVG Display Screen (400 × 240)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500">{previewSize}px</span>
              <button
                type="button"
                onClick={fullscreen.enterFullscreen}
                title="Toàn màn hình (Fullscreen)"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all duration-150 shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>

          <div className="w-full flex items-center justify-center py-4">
            <RobotFaceFullscreenContainer
              fullscreenState={fullscreen}
              showFullscreenButton={false}
              className="w-full"
              contentClassName="w-full flex items-center justify-center"
            >
              <RobotFace
                expression={bridge.expression}
                intensity={bridge.intensity}
                effects={bridge.effects}
                size={previewSize}
                animated={animated}
                autoBlink={autoBlink}
                ambientMotion={ambientMotion}
                className="drop-shadow-[0_0_25px_rgba(6,182,212,0.15)]"
              />
            </RobotFaceFullscreenContainer>
          </div>

          <div className="w-full mt-2 pt-3 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Size:</span>
              {[320, 440, 520].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPreviewSize(sz)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                    previewSize === sz
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBlink}
                  onChange={(e) => setAutoBlink(e.target.checked)}
                  className="accent-cyan-400 w-3.5 h-3.5"
                />
                <span>Blink</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ambientMotion}
                  onChange={(e) => setAmbientMotion(e.target.checked)}
                  className="accent-cyan-400 w-3.5 h-3.5"
                />
                <span>Ambient</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={animated}
                  onChange={(e) => setAnimated(e.target.checked)}
                  className="accent-cyan-400 w-3.5 h-3.5"
                />
                <span>Anim</span>
              </label>
            </div>
          </div>
        </section>

        {/* Semantic Status Card */}
        <section
          aria-label="Semantic Status"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Semantic Status & Baseline Invariant
            </h2>
            <button
              type="button"
              onClick={bridge.reset}
              className="px-2.5 py-1 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded transition-colors"
            >
              Reset System
            </button>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/70 text-xs font-mono space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Operational State:</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                {bridge.operationalState}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Resolved Baseline:</span>
              <span className="text-slate-200">
                {bridge.baseline.expression} ({Math.round(bridge.baseline.intensity * 100)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Presentation:</span>
              <span className="text-emerald-400 font-bold uppercase">
                {bridge.expression} ({Math.round(bridge.intensity * 100)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Effects:</span>
              <div className="flex gap-1.5 flex-wrap">
                {bridge.effects.length > 0 ? (
                  bridge.effects.map((eff) => (
                    <span
                      key={eff}
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800"
                    >
                      {eff}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Command ID:</span>
              <span className="text-slate-300 truncate max-w-[200px]">
                {bridge.activeCommand?.id ?? 'None (Idle default)'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Controller Queue:</span>
              <span className="text-cyan-400 font-bold">{bridge.queue.length} / 20</span>
            </div>
          </div>
        </section>

        {/* Event History Inspector */}
        <section
          aria-label="Event History Inspector"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col gap-3"
        >
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Lịch sử sự kiện gần nhất (Tối đa 10):</span>
            <span className="font-mono text-slate-500 text-[11px]">{bridge.eventHistory.length} mục</span>
          </h2>

          {bridge.eventHistory.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {bridge.eventHistory.map((item) => (
                <div
                  key={`${item.id}-${item.timestamp}`}
                  className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs font-mono flex items-center justify-between"
                >
                  <div className="flex flex-col gap-0.5 truncate max-w-[240px]">
                    <span className="text-slate-200 font-semibold truncate">{item.inputSummary}</span>
                    <span className="text-[10px] text-slate-500 truncate">{item.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.result.status === 'accepted'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                          : item.result.status === 'partial'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                          : 'bg-rose-950/60 text-rose-300 border-rose-500/50'
                      }`}
                    >
                      {item.result.status}
                    </span>
                    {item.result.reason && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                        ({item.result.reason})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
              Chưa có sự kiện nào được phát
            </div>
          )}
        </section>
      </div>

      {/* Right Column: Semantic Event Dispatchers */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        {/* 1. Operational State Event Dispatcher */}
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              1. Phát Operational State Event (Persistent)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Thay đổi trạng thái nền tảng. Khi phát state mới, emotion cũ và transient effects bị ngắt ngay lập tức.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {OPERATIONAL_STATES.map((s) => {
              const isActive = bridge.operationalState === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleDispatchState(s.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/30'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.icon}</span>
                    <span className="font-semibold text-xs">{s.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1 leading-tight">{s.desc}</span>
                </button>
              );
            })}
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Cường độ State (Intensity):</span>
              <span className="font-mono text-cyan-400">{Math.round(stateIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={stateIntensity}
              onChange={(e) => setStateIntensity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </section>

        {/* 2. Transient Emotion Event Dispatcher */}
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              2. Phát Transient Emotion Event (7 Emotions)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Kích hoạt cảm xúc tạm thời kèm visual effects tương ứng (Stars, Zzz, Sweat, Blush). Khi hết hạn, robot tự phục hồi về baseline.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EMOTIONS.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => {
                  setSelectedEmotion(e.key);
                  handleDispatchEmotion(e.key);
                }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all flex flex-col items-center gap-1 ${
                  selectedEmotion === e.key ? `${e.color} font-bold ring-1 ring-white/20` : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-base">{e.icon}</span>
                <span className="truncate w-full">{e.label}</span>
              </button>
            ))}
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Thời gian duy trì Emotion (Duration):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EMOTION_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setEmotionDuration(d.value)}
                  className={`p-2 rounded-lg border text-xs font-mono text-center transition-all ${
                    emotionDuration === d.value
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity & Optional ID */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Cường độ Emotion:</span>
                <span className="font-mono text-emerald-400">{Math.round(emotionIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={emotionIntensity}
                onChange={(e) => setEmotionIntensity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Custom Event ID (Tùy chọn - để kiểm tra Duplicate ID):
              </label>
              <input
                type="text"
                placeholder="Để trống để tự sinh ID ngẫu nhiên..."
                value={customEventId}
                onChange={(e) => setCustomEventId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * 2. Sub-component Expression & Effect Playground (Khám phá 8 Biểu cảm & 4 Hiệu ứng)
 */
function ExpressionPlayground() {
  const fullscreen = useRobotFaceFullscreen();
  const [expression, setExpression] = useState<RobotExpression>('happy');
  const [intensity, setIntensity] = useState<number>(1.0);
  const [effects, setEffects] = useState<RobotFaceEffect[]>([]);
  const [previewSize, setPreviewSize] = useState<number>(440);
  const [animated, setAnimated] = useState<boolean>(true);
  const [autoBlink, setAutoBlink] = useState<boolean>(true);
  const [ambientMotion, setAmbientMotion] = useState<boolean>(true);

  const toggleEffect = (eff: RobotFaceEffect) => {
    setEffects((prev) =>
      prev.includes(eff) ? prev.filter((e) => e !== eff) : [...prev, eff]
    );
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Face Preview */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        <section className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-md">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800/50">
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Interactive Playground ({expression})
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500">{previewSize}px</span>
              <button
                type="button"
                onClick={fullscreen.enterFullscreen}
                title="Toàn màn hình (Fullscreen)"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all duration-150 shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>

          <div className="w-full flex items-center justify-center py-4">
            <RobotFaceFullscreenContainer
              fullscreenState={fullscreen}
              showFullscreenButton={false}
              className="w-full"
              contentClassName="w-full flex items-center justify-center"
            >
              <RobotFace
                expression={expression}
                intensity={intensity}
                effects={effects}
                size={previewSize}
                animated={animated}
                autoBlink={autoBlink}
                ambientMotion={ambientMotion}
                className="drop-shadow-[0_0_25px_rgba(192,132,252,0.15)]"
              />
            </RobotFaceFullscreenContainer>
          </div>

          <div className="w-full mt-2 pt-3 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Size:</span>
              {[320, 440, 520].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPreviewSize(sz)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                    previewSize === sz
                      ? 'bg-purple-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBlink}
                  onChange={(e) => setAutoBlink(e.target.checked)}
                  className="accent-purple-400 w-3.5 h-3.5"
                />
                <span>Blink</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ambientMotion}
                  onChange={(e) => setAmbientMotion(e.target.checked)}
                  className="accent-purple-400 w-3.5 h-3.5"
                />
                <span>Ambient</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={animated}
                  onChange={(e) => setAnimated(e.target.checked)}
                  className="accent-purple-400 w-3.5 h-3.5"
                />
                <span>Anim</span>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Expression & Effect Controls */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        {/* 8 Expressions Gallery */}
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Chọn 1 Trong 8 Biểu Cảm Vector (FACE-07)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VALID_ROBOT_EXPRESSIONS.map((expr) => (
              <button
                key={expr}
                type="button"
                onClick={() => setExpression(expr)}
                className={`p-2.5 rounded-xl border text-xs capitalize font-medium transition-all text-center ${
                  expression === expr
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold ring-1 ring-purple-400/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {expr}
              </button>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Cường độ (Intensity):</span>
              <span className="font-mono text-purple-400">{Math.round(intensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </section>

        {/* 4 Visual Effects Playground */}
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Layered Visual Effects (Tùy chọn)
            </h2>
            <button
              type="button"
              onClick={() => setEffects([])}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 rounded"
            >
              Clear Effects
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VALID_ROBOT_EFFECTS.map((eff) => {
              const active = effects.includes(eff);
              return (
                <button
                  key={eff}
                  type="button"
                  onClick={() => toggleEffect(eff)}
                  className={`p-2.5 rounded-xl border text-xs capitalize font-medium transition-all text-center ${
                    active
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold ring-1 ring-yellow-400/30'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {eff === 'blush' && '🌸 Blush'}
                  {eff === 'stars' && '⭐ Stars'}
                  {eff === 'zzz' && '💤 Zzz'}
                  {eff === 'sweat' && '💧 Sweat'}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * 3. Sub-component Raw Controller Simulator (Độc lập cho FACE-05)
 */
function RawControllerSimulator() {
  const controller = useRobotFaceController();
  const fullscreen = useRobotFaceFullscreen();

  const [previewSize, setPreviewSize] = useState<number>(440);
  const [animated, setAnimated] = useState<boolean>(true);
  const [autoBlink, setAutoBlink] = useState<boolean>(true);
  const [ambientMotion, setAmbientMotion] = useState<boolean>(true);

  const [rawExpr, setRawExpr] = useState<RobotExpression>('happy');
  const [rawPriority, setRawPriority] = useState<RobotFacePriority>('normal');
  const [rawDuration, setRawDuration] = useState<number | undefined>(4000);
  const [rawIntensity, setRawIntensity] = useState<number>(1.0);
  const [rawEffects, setRawEffects] = useState<RobotFaceEffect[]>([]);
  const [customId, setCustomId] = useState<string>('');
  const [lastRejection, setLastRejection] = useState<{ id: string; reason?: string } | null>(null);

  const toggleRawEffect = (eff: RobotFaceEffect) => {
    setRawEffects((prev) =>
      prev.includes(eff) ? prev.filter((e) => e !== eff) : [...prev, eff]
    );
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const res = controller.send({
      expression: rawExpr,
      priority: rawPriority,
      durationMs: rawDuration,
      intensity: rawIntensity,
      effects: rawEffects,
      id: customId.trim() || undefined,
    });

    if (!res.accepted) {
      setLastRejection({ id: res.commandId, reason: res.reason });
    } else {
      setLastRejection(null);
      setCustomId('');
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-6 flex flex-col gap-6">
        <section className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-md">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800/50">
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Raw Controller Mode Preview
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500">{previewSize}px</span>
              <button
                type="button"
                onClick={fullscreen.enterFullscreen}
                title="Toàn màn hình (Fullscreen)"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all duration-150 shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>

          <div className="w-full flex items-center justify-center py-4">
            <RobotFaceFullscreenContainer
              fullscreenState={fullscreen}
              showFullscreenButton={false}
              className="w-full"
              contentClassName="w-full flex items-center justify-center"
            >
              <RobotFace
                expression={controller.expression}
                intensity={controller.intensity}
                effects={controller.activeEffects}
                size={previewSize}
                animated={animated}
                autoBlink={autoBlink}
                ambientMotion={ambientMotion}
                className="drop-shadow-[0_0_25px_rgba(245,158,11,0.15)]"
              />
            </RobotFaceFullscreenContainer>
          </div>
        </section>

        {/* Active Command Inspector */}
        <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Active Command
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={controller.dismiss}
                disabled={!controller.activeCommand}
                className="px-2.5 py-1 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded disabled:opacity-30 transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={controller.clear}
                className="px-2.5 py-1 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/70 text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">ID:</span>
              <span className="text-cyan-300">{controller.activeCommand?.id ?? 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Expression:</span>
              <span className="text-white uppercase font-bold">{controller.expression}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Effects:</span>
              <span className="text-purple-300">
                {controller.activeEffects.length > 0
                  ? controller.activeEffects.join(', ')
                  : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Queue Count:</span>
              <span className="text-cyan-400">{controller.queue.length} / 20</span>
            </div>
          </div>
        </section>
      </div>

      {/* Raw Command Form */}
      <section className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Gửi Direct Controller Command (FACE-07)
        </h2>

        {lastRejection && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg text-xs text-rose-300">
            ⚠️ Bị từ chối: {lastRejection.reason} ({lastRejection.id})
          </div>
        )}

        <form onSubmit={handleSendCommand} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Expression (8 Presets)</label>
            <div className="grid grid-cols-4 gap-2">
              {VALID_ROBOT_EXPRESSIONS.map((exp) => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => setRawExpr(exp)}
                  className={`p-2 rounded-lg border text-xs capitalize text-center ${
                    rawExpr === exp ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Visual Effects</label>
            <div className="grid grid-cols-4 gap-2">
              {VALID_ROBOT_EFFECTS.map((eff) => (
                <button
                  key={eff}
                  type="button"
                  onClick={() => toggleRawEffect(eff)}
                  className={`p-2 rounded-lg border text-xs capitalize text-center ${
                    rawEffects.includes(eff) ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  {eff}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Priority</label>
            <div className="grid grid-cols-2 gap-2">
              {RAW_PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setRawPriority(p.key)}
                  className={`p-2 rounded-lg border text-xs font-medium text-center ${
                    rawPriority === p.key ? `${p.color} font-bold ring-1 ring-white/20` : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Duration</label>
            <div className="grid grid-cols-2 gap-2">
              {RAW_DURATIONS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRawDuration(d.value)}
                  className={`p-2 rounded-lg border text-xs font-mono text-center ${
                    rawDuration === d.value ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            Gửi Raw Command →
          </button>
        </form>
      </section>
    </div>
  );
}

/**
 * Main Page Component với Tab Switcher 3 Chế Độ
 */
export default function RobotFaceLabPage() {
  const [activeTab, setActiveTab] = useState<'semantic' | 'playground' | 'raw'>('semantic');

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-10 relative z-10">
      {/* Header */}
      <header className="w-full max-w-5xl mb-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              FACE-07 Checkpoint
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Extended Robot Emotions & Layered Visual Effects
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            FocusBuddy Robot Face Lab
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Môi trường kiểm thử 8 biểu cảm vector, 7 cảm xúc ngữ nghĩa, hiệu ứng trực quan (Stars, Zzz, Sweat, Blush) và phục hồi baseline.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('semantic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'semantic'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semantic Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playground')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'playground'
                ? 'bg-purple-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Playground (8 Presets)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'raw'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Controller
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl">
        {activeTab === 'semantic' && <SemanticEventSimulator />}
        {activeTab === 'playground' && <ExpressionPlayground />}
        {activeTab === 'raw' && <RawControllerSimulator />}
      </main>
    </div>
  );
}
