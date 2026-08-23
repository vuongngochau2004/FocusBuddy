'use client';

import { motion } from 'framer-motion';
import {
  Heart,
  Smile,
  Frown,
  Meh,
  Angry,
  Zap,
  Brain,
  Battery,
  TrendingDown,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { emotionLogService, mentalAssessmentService } from '@/lib/services';
import { EmotionLog, MentalAssessment } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const emotionEmojis: Record<string, { icon: typeof Smile; color: string; label: string }> = {
  HAPPY: { icon: Smile, color: 'text-green-400', label: 'Vui vẻ' },
  NEUTRAL: { icon: Meh, color: 'text-blue-400', label: 'Bình thường' },
  SAD: { icon: Frown, color: 'text-indigo-400', label: 'Buồn' },
  STRESSED: { icon: Zap, color: 'text-amber-400', label: 'Căng thẳng' },
  ANGRY: { icon: Angry, color: 'text-red-400', label: 'Tức giận' },
  ANXIOUS: { icon: AlertTriangle, color: 'text-orange-400', label: 'Lo lắng' },
};

const riskColors: Record<string, string> = {
  LOW: 'text-green-400 bg-green-400/10',
  MEDIUM: 'text-amber-400 bg-amber-400/10',
  HIGH: 'text-orange-400 bg-orange-400/10',
  CRITICAL: 'text-red-400 bg-red-400/10',
};

export default function MentalHealthPage() {
  const [emotions, setEmotions] = useState<EmotionLog[]>([]);
  const [assessments, setAssessments] = useState<MentalAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [levels, setLevels] = useState({ stress: 5, motivation: 5, energy: 5 });
  const [note, setNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [emotionRes, assessmentRes] = await Promise.all([
        emotionLogService.getAll(),
        mentalAssessmentService.getAll(),
      ]);
      setEmotions(Array.isArray(emotionRes.data?.items) ? emotionRes.data.items : []);
      setAssessments(Array.isArray(assessmentRes.data?.items) ? assessmentRes.data.items : []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogEmotion = async () => {
    if (!selectedEmotion) return;
    try {
      await emotionLogService.create({
        emotion: selectedEmotion === 'ANGRY' ? 'STRESSED' : selectedEmotion,
        stress_level: levels.stress,
        motivation_level: levels.motivation,
        energy_level: levels.energy,
        note: note || undefined,
        recorded_at: new Date().toISOString(),
      });
      setSelectedEmotion('');
      setNote('');
      setLevels({ stress: 5, motivation: 5, energy: 5 });
      loadData();
    } catch (err) {
      console.error('Failed to log emotion:', err);
    }
  };

  const LevelSlider = ({
    label,
    icon: Icon,
    value,
    color,
    onChange,
  }: {
    label: string;
    icon: typeof Zap;
    value: number;
    color: string;
    onChange: (v: number) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600 dark:text-white/60 flex items-center gap-2">
          <Icon size={14} className={color} />
          {label}
        </span>
        <span className="text-sm font-bold text-slate-700 dark:text-white/70">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-400
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-glow"
      />
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-600/10 flex items-center justify-center">
          <Heart size={18} className="text-pink-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sức khỏe tinh thần</h2>
          <p className="text-sm text-slate-500 dark:text-white/40">Theo dõi cảm xúc và đánh giá tâm lý</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Emotion */}
        <motion.div variants={item} className="glass p-6 space-y-5">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Smile size={18} className="text-green-500" />
            Bạn đang cảm thấy thế nào?
          </h3>
 
          {/* Emotion Picker */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(emotionEmojis).map(([key, cfg]) => {
              const EmIcon = cfg.icon;
              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedEmotion(key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                    selectedEmotion === key
                      ? `${cfg.color} bg-slate-200/60 dark:bg-white/10 border border-current/20`
                      : 'text-slate-500 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/50 hover:bg-slate-100/50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <EmIcon size={24} />
                  <span className="text-[10px] font-medium">{cfg.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <LevelSlider
              label="Mức độ căng thẳng"
              icon={Zap}
              value={levels.stress}
              color="text-amber-400"
              onChange={(v) => setLevels({ ...levels, stress: v })}
            />
            <LevelSlider
              label="Động lực"
              icon={Brain}
              value={levels.motivation}
              color="text-blue-400"
              onChange={(v) => setLevels({ ...levels, motivation: v })}
            />
            <LevelSlider
              label="Năng lượng"
              icon={Battery}
              value={levels.energy}
              color="text-green-400"
              onChange={(v) => setLevels({ ...levels, energy: v })}
            />
          </div>

          {/* Note */}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="glass-input"
            placeholder="Ghi chú thêm (tùy chọn)..."
            id="input-emotion-note"
          />

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogEmotion}
            disabled={!selectedEmotion}
            className="glass-btn-primary w-full disabled:opacity-30"
            id="btn-log-emotion"
          >
            Ghi nhận cảm xúc
          </motion.button>
        </motion.div>

        {/* Right Column: Assessments & History */}
        <div className="space-y-6">
          {/* Latest Assessment */}
          <motion.div variants={item} className="glass p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Shield size={18} className="text-blue-500" />
              Đánh giá sức khỏe tinh thần
            </h3>

            {assessments.length > 0 ? (
              <div className="space-y-3">
                {assessments.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-100/60 dark:bg-white/[0.03] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-white/60">{a.assessment_type || 'Tổng quan'}</span>
                      {a.risk_level && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${riskColors[a.risk_level] || ''}`}>
                          {a.risk_level}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 dark:text-white/40">
                      {a.stress_score != null && <span>Stress: {a.stress_score}</span>}
                      {a.anxiety_score != null && <span>Lo âu: {a.anxiety_score}</span>}
                      {a.burnout_score != null && <span>Kiệt sức: {a.burnout_score}</span>}
                    </div>
                    {a.recommendation && (
                      <p className="text-xs text-slate-500 dark:text-white/35 italic">{a.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield size={32} className="text-slate-300 dark:text-white/15 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-white/30">Chưa có đánh giá nào</p>
              </div>
            )}
          </motion.div>

          {/* Recent Emotion Logs */}
          <motion.div variants={item} className="glass p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Lịch sử cảm xúc gần đây</h3>
            {emotions.length > 0 ? (
              <div className="space-y-2">
                {emotions.slice(0, 5).map((log) => {
                  const cfg = emotionEmojis[log.emotion] || { icon: Meh, color: 'text-slate-400 dark:text-white/40', label: log.emotion };
                  const EmIcon = cfg.icon;
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100/40 dark:hover:bg-white/[0.03] transition-colors">
                      <EmIcon size={18} className={cfg.color} />
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-white/70">{cfg.label}</p>
                        {log.note && <p className="text-xs text-slate-500 dark:text-white/30">{log.note}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-white/20">
                        {new Date(log.recorded_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-white/30 text-center py-4">Chưa có dữ liệu</p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
