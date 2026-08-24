'use client';

import React, { useState } from 'react';
import { RobotFace, RobotExpression, expressionPresets } from '@/features/robot-face';

const EXPRESSIONS: { key: RobotExpression; label: string; description: string; icon: string }[] = [
  { key: 'idle', label: 'Idle (Mặc định)', description: 'Trạng thái trung tính, bình tĩnh', icon: '🤖' },
  { key: 'happy', label: 'Happy (Vui vẻ)', description: 'Mắt cong cười, má hồng, miệng cười rạng rỡ', icon: '😄' },
  { key: 'concerned', label: 'Concerned (Lo lắng)', description: 'Lông mày cau, khóe miệng trĩu xuống', icon: '😟' },
  { key: 'thinking', label: 'Thinking (Suy nghĩ)', description: 'Lông mày bất đối xứng, tập trung tư duy', icon: '🤔' },
];

export default function RobotFaceLabPage() {
  const [expression, setExpression] = useState<RobotExpression>('idle');
  const [intensity, setIntensity] = useState<number>(1.0);
  const [previewSize, setPreviewSize] = useState<number>(440);

  const currentPreset = expressionPresets[expression];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <header className="w-full max-w-4xl mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              FACE-01 Checkpoint
            </span>
            <span className="text-xs text-slate-400 font-mono">SVG Baseline Renderer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            FocusBuddy Robot Face Lab
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Môi trường kiểm thử biểu cảm khuôn mặt robot qua đồ họa vector SVG và nội suy tuyến tính.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300">
          <span>Active:</span>
          <span className="font-semibold text-white uppercase">{expression}</span>
          <span className="text-slate-500">|</span>
          <span>{Math.round(intensity * 100)}%</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Visual Preview Card */}
        <section
          aria-label="Robot Face Preview"
          className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-md"
        >
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800/50">
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              SVG Display Screen (400 × 240)
            </span>
            <span className="font-mono text-slate-500">Width: {previewSize}px</span>
          </div>

          {/* SVG Component Container */}
          <div className="w-full flex items-center justify-center py-4">
            <RobotFace
              expression={expression}
              intensity={intensity}
              size={previewSize}
              className="transition-all duration-75 drop-shadow-[0_0_25px_rgba(6,182,212,0.15)]"
            />
          </div>

          {/* Quick Size Controls */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
            <span>Kích thước xem trước:</span>
            <div className="flex gap-1.5">
              {[320, 440, 520].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPreviewSize(sz)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    previewSize === sz
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Control Panel */}
        <section
          aria-label="Control Panel"
          className="lg:col-span-5 flex flex-col gap-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md"
        >
          {/* Expression Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              1. Chọn biểu cảm (RobotExpression)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {EXPRESSIONS.map((item) => {
                const isSelected = expression === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setExpression(item.key)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/80 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{item.icon}</span>
                      <span className="font-semibold text-sm capitalize text-slate-100">
                        {item.key}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="intensity-slider" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Cường độ biểu cảm (Intensity)
              </label>
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                {intensity.toFixed(2)} ({Math.round(intensity * 100)}%)
              </span>
            </div>

            <input
              id="intensity-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />

            <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
              <span>0.0 (Idle chuẩn)</span>
              <span>0.5 (Trung gian)</span>
              <span>1.0 (Tối đa)</span>
            </div>
          </div>

          {/* Preset Parameters Inspector */}
          <div className="pt-4 border-t border-slate-800">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              3. Thông số hình học hiện tại
            </h2>
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">eyeOpen:</span>
                <span className="text-cyan-300">{currentPreset.eyeOpen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">eyeCurvature:</span>
                <span className="text-cyan-300">{currentPreset.eyeCurvature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">eyebrows (L/R):</span>
                <span className="text-cyan-300">
                  {currentPreset.leftEyebrowAngle}° / {currentPreset.rightEyebrowAngle}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">mouthCurvature:</span>
                <span className="text-cyan-300">{currentPreset.mouthCurvature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">mouthOpen:</span>
                <span className="text-cyan-300">{currentPreset.mouthOpen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">blushOpacity:</span>
                <span className="text-cyan-300">{currentPreset.blushOpacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">glowIntensity:</span>
                <span className="text-cyan-300">{currentPreset.glowIntensity}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
