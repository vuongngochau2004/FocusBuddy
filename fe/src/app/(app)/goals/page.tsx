'use client';

import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { learningGoalService } from '@/lib/services';
import { LearningGoal } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const statusConfig: Record<string, { icon: typeof Target; color: string; label: string; bg: string }> = {
  NOT_STARTED: { icon: AlertCircle, color: 'text-white/40', label: 'Chưa bắt đầu', bg: 'bg-white/5' },
  IN_PROGRESS: { icon: Clock, color: 'text-amber-400', label: 'Đang thực hiện', bg: 'bg-amber-400/10' },
  COMPLETED: { icon: CheckCircle2, color: 'text-green-400', label: 'Hoàn thành', bg: 'bg-green-400/10' },
  CANCELLED: { icon: AlertCircle, color: 'text-red-400/60', label: 'Đã hủy', bg: 'bg-red-400/5' },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target_value: '', unit: '', end_date: '' });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await learningGoalService.getAll();
      setGoals(res.data.items || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await learningGoalService.create({
        title: newGoal.title,
        target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : undefined,
        unit: newGoal.unit || undefined,
        end_date: newGoal.end_date || undefined,
        status: 'NOT_STARTED',
      });
      setShowAdd(false);
      setNewGoal({ title: '', target_value: '', unit: '', end_date: '' });
      loadGoals();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const completedCount = goals.filter((g) => g.status === 'COMPLETED').length;
  const inProgressCount = goals.filter((g) => g.status === 'IN_PROGRESS').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 flex items-center justify-center">
            <Target size={18} className="text-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mục tiêu học tập</h2>
            <p className="text-sm text-white/40">Đặt mục tiêu và theo dõi tiến độ</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(true)}
          className="glass-btn-primary flex items-center gap-2"
          id="btn-add-goal"
        >
          <Plus size={16} />
          Mục tiêu mới
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={item} className="stat-card">
          <p className="text-2xl font-bold text-white">{goals.length}</p>
          <p className="text-sm text-white/40">Tổng mục tiêu</p>
        </motion.div>
        <motion.div variants={item} className="stat-card">
          <p className="text-2xl font-bold text-amber-400">{inProgressCount}</p>
          <p className="text-sm text-white/40">Đang thực hiện</p>
        </motion.div>
        <motion.div variants={item} className="stat-card">
          <p className="text-2xl font-bold text-green-400">{completedCount}</p>
          <p className="text-sm text-white/40">Hoàn thành</p>
        </motion.div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Thêm mục tiêu mới</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">Tiêu đề</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="glass-input"
                  placeholder="Ví dụ: Đạt GPA 3.5 học kỳ này"
                  required
                  id="input-goal-title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Ngày kết thúc</label>
                <input
                  type="date"
                  value={newGoal.end_date}
                  onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                  className="glass-input"
                  id="input-goal-date"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">Giá trị mục tiêu</label>
                <input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                  className="glass-input"
                  placeholder="Ví dụ: 3.5"
                  step="0.01"
                  id="input-goal-value"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Đơn vị</label>
                <input
                  type="text"
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                  className="glass-input"
                  placeholder="Ví dụ: GPA, giờ, bài"
                  id="input-goal-unit"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAdd(false)} className="glass-btn">Hủy</button>
              <button type="submit" className="glass-btn-accent" id="btn-submit-goal">Thêm mục tiêu</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Goal List */}
      {loading ? (
        <div className="glass p-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-primary-400 rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <motion.div variants={item} className="glass p-12 text-center">
          <Target size={40} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Chưa có mục tiêu nào. Hãy đặt mục tiêu đầu tiên!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const config = statusConfig[goal.status || 'NOT_STARTED'];
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={goal.id}
                variants={item}
                whileHover={{ scale: 1.01 }}
                className="glass p-5 cursor-pointer hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-white/85 text-sm">{goal.title}</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 ${config.color} ${config.bg}`}>
                    <StatusIcon size={12} />
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/30">
                  {goal.target_value && (
                    <span className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      {goal.target_value} {goal.unit || ''}
                    </span>
                  )}
                  {goal.end_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(goal.end_date).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
