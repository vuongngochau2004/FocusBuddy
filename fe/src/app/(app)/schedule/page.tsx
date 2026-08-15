'use client';

import { motion } from 'framer-motion';
import {
  CalendarDays,
  Plus,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { studyTaskService, studySessionService } from '@/lib/services';
import { StudyTask } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const priorityColors: Record<string, string> = {
  LOW: 'text-blue-400 bg-blue-400/10',
  MEDIUM: 'text-amber-400 bg-amber-400/10',
  HIGH: 'text-orange-400 bg-orange-400/10',
  URGENT: 'text-red-400 bg-red-400/10',
};

const statusStyles: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  TODO: { icon: AlertCircle, color: 'text-white/30' },
  IN_PROGRESS: { icon: Clock, color: 'text-amber-400' },
  DONE: { icon: CheckCircle2, color: 'text-green-400' },
  CANCELLED: { icon: AlertCircle, color: 'text-red-400/50' },
};

export default function SchedulePage() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', deadline: '' });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await studyTaskService.getAll();
      setTasks(res.data.items || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studyTaskService.create({
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority,
        status: 'TODO',
        deadline: newTask.deadline ? new Date(newTask.deadline).toISOString() : undefined,
      });
      setShowAddForm(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', deadline: '' });
      loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const filteredTasks =
    filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  const filterTabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'TODO', label: 'Chưa làm' },
    { key: 'IN_PROGRESS', label: 'Đang làm' },
    { key: 'DONE', label: 'Hoàn thành' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
            <CalendarDays size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Lịch học & Nhiệm vụ</h2>
            <p className="text-sm text-white/40">Quản lý các công việc học tập của bạn</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="glass-btn-primary flex items-center gap-2"
          id="btn-add-task"
        >
          <Plus size={16} />
          Thêm nhiệm vụ
        </motion.button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/20'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
            {tab.key === 'ALL' && (
              <span className="ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded-md">
                {tasks.length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Add Task Modal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Thêm nhiệm vụ mới</h3>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">Tiêu đề</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="glass-input"
                  placeholder="Tên nhiệm vụ..."
                  required
                  id="input-task-title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Hạn chót</label>
                <input
                  type="datetime-local"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="glass-input"
                  id="input-task-deadline"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/60">Mô tả</label>
              <input
                type="text"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="glass-input"
                placeholder="Mô tả chi tiết (tùy chọn)..."
                id="input-task-description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/60">Mức độ ưu tiên</label>
              <div className="flex gap-2">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTask({ ...newTask, priority: p })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      newTask.priority === p
                        ? priorityColors[p] + ' border border-current/20'
                        : 'text-white/30 bg-white/[0.03]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="glass-btn"
              >
                Hủy
              </button>
              <button type="submit" className="glass-btn-primary" id="btn-submit-task">
                Thêm nhiệm vụ
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="glass p-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-primary-400 rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <motion.div variants={item} className="glass p-12 text-center">
          <BookOpen size={40} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Chưa có nhiệm vụ nào. Hãy thêm nhiệm vụ mới!</p>
        </motion.div>
      ) : (
        <motion.div variants={container} className="space-y-3">
          {filteredTasks.map((task) => {
            const statusInfo = statusStyles[task.status || 'TODO'];
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={task.id}
                variants={item}
                whileHover={{ scale: 1.005 }}
                className="glass p-4 flex items-center justify-between group cursor-pointer hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-center gap-4">
                  <StatusIcon size={18} className={statusInfo.color} />
                  <div>
                    <p className={`font-medium text-sm ${task.status === 'DONE' ? 'text-white/40 line-through' : 'text-white/85'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-white/30 mt-0.5">{task.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {task.priority && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${priorityColors[task.priority] || 'text-white/30'}`}>
                      {task.priority}
                    </span>
                  )}
                  {task.deadline && (
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(task.deadline).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-white/15 group-hover:text-white/40 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
