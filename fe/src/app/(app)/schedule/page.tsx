'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Plus,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Calendar,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { studyTaskService } from '@/lib/services';
import { StudyTask } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const priorityStyles: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Thấp', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  MEDIUM: { label: 'Vừa', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  HIGH: { label: 'Cao', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  URGENT: { label: 'Khẩn cấp', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
};

export default function SchedulePage() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    deadline: '',
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await studyTaskService.getAll();
      const loaded = res.data.items || [];
      // If empty in storage, initialize with default 3 items
      if (loaded.length === 0) {
        const defaultTasks: StudyTask[] = [
          {
            id: 'task-1',
            user_id: 'mock-user-123',
            title: 'Làm bài tập Giải tích 1 (Tuần 1)',
            description: 'Bài tập chương 1 về giới hạn dãy số',
            status: 'TODO',
            priority: 'HIGH',
            deadline: '2026-08-30T23:59:00.000Z',
            created_at: new Date().toISOString(),
          },
          {
            id: 'task-2',
            user_id: 'mock-user-123',
            title: 'Cài đặt Stack và Queue bằng C++',
            description: 'Thực hành môn Cấu trúc dữ liệu',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            deadline: '2026-09-02T23:59:00.000Z',
            created_at: new Date().toISOString(),
          },
          {
            id: 'task-3',
            user_id: 'mock-user-123',
            title: 'Đọc slide chương 1 Kỹ thuật lập trình',
            description: 'Làm quen với con trỏ trong C/C++',
            status: 'DONE',
            priority: 'LOW',
            deadline: '2026-08-20T23:59:00.000Z',
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ];
        setTasks(defaultTasks);
        localStorage.setItem('focusbuddy_tasks', JSON.stringify({ items: defaultTasks }));
      } else {
        setTasks(loaded);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCycleStatus = async (task: StudyTask, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' = 'TODO';
    if (task.status === 'TODO') nextStatus = 'IN_PROGRESS';
    else if (task.status === 'IN_PROGRESS') nextStatus = 'DONE';
    else if (task.status === 'DONE') nextStatus = 'TODO';

    const updatedTask = {
      ...task,
      status: nextStatus,
      completed_at: nextStatus === 'DONE' ? new Date().toISOString() : undefined,
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));

    try {
      await studyTaskService.update(task.id, updatedTask);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await studyTaskService.delete(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const created = await studyTaskService.create({
        title: newTask.title.trim(),
        description: newTask.description?.trim() || undefined,
        priority: newTask.priority,
        status: 'TODO',
        deadline: newTask.deadline ? new Date(newTask.deadline).toISOString() : undefined,
      });

      if (created?.data) {
        setTasks((prev) => [created.data, ...prev]);
      }
      setShowAddForm(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', deadline: '' });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const filteredTasks =
    filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  const filterTabs = [
    { key: 'ALL', label: 'Tất cả', count: tasks.length },
    { key: 'TODO', label: 'Chưa làm', count: tasks.filter((t) => t.status === 'TODO').length },
    { key: 'IN_PROGRESS', label: 'Đang làm', count: tasks.filter((t) => t.status === 'IN_PROGRESS').length },
    { key: 'DONE', label: 'Hoàn thành', count: tasks.filter((t) => t.status === 'DONE').length },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-5xl"
    >
      {/* Header Section */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
            <CalendarDays size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Lịch học & Nhiệm vụ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-white/40">
              Quản lý các công việc học tập của bạn
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="glass-btn-primary flex items-center gap-2 self-start sm:self-auto !px-4 !py-2.5 shadow-sm"
          id="btn-add-task"
        >
          <Plus size={18} />
          <span>Thêm nhiệm vụ</span>
        </motion.button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#EEF0FD] dark:bg-primary-500/20 text-[#5B6BF0] dark:text-primary-300 shadow-sm'
                  : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
              }`}
              id={`filter-tab-${tab.key.toLowerCase()}`}
            >
              <span>{tab.label}</span>
              {tab.key === 'ALL' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-[#DFE3FA] dark:bg-primary-400/30 text-[#5B6BF0] dark:text-primary-200'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Task List */}
      {loading ? (
        <div className="glass p-12 flex items-center justify-center rounded-2xl">
          <div className="w-7 h-7 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <motion.div
          variants={item}
          className="glass p-12 text-center rounded-2xl border border-slate-200/50 dark:border-white/5"
        >
          <BookOpen size={44} className="text-slate-300 dark:text-white/20 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-white/60 font-medium text-sm">
            Không có nhiệm vụ nào trong mục này
          </p>
          <p className="text-slate-400 dark:text-white/30 text-xs mt-1">
            Bấm &ldquo;Thêm nhiệm vụ&rdquo; để tạo nhiệm vụ học tập mới!
          </p>
        </motion.div>
      ) : (
        <motion.div variants={container} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'DONE';
              const isInProgress = task.status === 'IN_PROGRESS';

              return (
                <motion.div
                  key={task.id}
                  layout
                  variants={item}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 hover:border-slate-300/80 dark:hover:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
                >
                  {/* Left Side: Status Icon & Title / Description */}
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    {/* Status Circle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCycleStatus(task, e)}
                      title={`Bấm để chuyển trạng thái (Hiện tại: ${
                        isDone ? 'Hoàn thành' : isInProgress ? 'Đang làm' : 'Chưa làm'
                      })`}
                      className="flex-shrink-0 transition-transform active:scale-90 hover:scale-110 focus:outline-none"
                    >
                      {isDone ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                          <CheckCircle2 size={18} className="text-emerald-500 stroke-[2.2]" />
                        </div>
                      ) : isInProgress ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                          <Clock size={18} className="text-amber-500 stroke-[2.2]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-400 dark:text-white/40 flex items-center justify-center">
                          <AlertCircle size={18} className="text-slate-400 dark:text-white/40 stroke-[2.2]" />
                        </div>
                      )}
                    </button>

                    {/* Task Info */}
                    <div className="min-w-0">
                      <h3
                        className={`text-sm sm:text-[15px] font-medium leading-snug transition-colors ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-white/35'
                            : 'text-slate-800 dark:text-white/90'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p
                          className={`text-xs sm:text-[13px] mt-0.5 truncate leading-relaxed ${
                            isDone
                              ? 'text-slate-400/80 dark:text-white/25'
                              : 'text-slate-500 dark:text-white/45'
                          }`}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Badges & Actions */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {task.priority && (
                      <span
                        className={`hidden md:inline-flex text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                          priorityStyles[task.priority]?.color || 'text-slate-500 bg-slate-100'
                        }`}
                      >
                        {priorityStyles[task.priority]?.label || task.priority}
                      </span>
                    )}

                    {task.deadline && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-white/30 bg-slate-100/60 dark:bg-white/[0.03] px-2.5 py-1 rounded-xl">
                        <Calendar size={12} />
                        {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}

                    {/* Delete Task Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      title="Xóa nhiệm vụ"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:text-white/20 dark:hover:text-red-400 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg glass-strong p-6 sm:p-7 rounded-2xl shadow-2xl z-10 border border-slate-200/60 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Thêm nhiệm vụ mới
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-white/70">
                    Tên nhiệm vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="glass-input !py-2.5 text-sm"
                    placeholder="Ví dụ: Làm bài tập Giải tích 1..."
                    required
                    autoFocus
                    id="input-task-title"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-white/70">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="glass-input !py-2.5 text-sm min-h-[80px] resize-none"
                    placeholder="Ghi chú thêm về nhiệm vụ..."
                    id="input-task-description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-white/70">
                      Mức độ ưu tiên
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="glass-input !py-2.5 text-sm"
                      id="select-task-priority"
                    >
                      <option value="LOW">Thấp</option>
                      <option value="MEDIUM">Vừa</option>
                      <option value="HIGH">Cao</option>
                      <option value="URGENT">Khẩn cấp</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-white/70">
                      Hạn chót (Deadline)
                    </label>
                    <input
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      className="glass-input !py-2.5 text-sm"
                      id="input-task-deadline"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="glass-btn !py-2 !px-4 text-xs font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="glass-btn-primary !py-2 !px-5 text-xs font-semibold"
                    id="btn-submit-task"
                  >
                    Tạo nhiệm vụ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
