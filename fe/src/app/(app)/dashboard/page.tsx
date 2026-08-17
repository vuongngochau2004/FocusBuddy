'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { healthCheck } from '@/lib/services';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const statsData = [
  {
    label: 'Giờ học hôm nay',
    value: '4.5h',
    change: '+12%',
    icon: Clock,
    color: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-400',
  },
  {
    label: 'Mục tiêu hoàn thành',
    value: '3/5',
    change: '60%',
    icon: Target,
    color: 'from-green-500/20 to-green-600/10',
    iconColor: 'text-green-400',
  },
  {
    label: 'GPA Hiện tại',
    value: '3.42',
    change: '+0.15',
    icon: TrendingUp,
    color: 'from-purple-500/20 to-purple-600/10',
    iconColor: 'text-purple-400',
  },
  {
    label: 'Chuỗi tập trung',
    value: '7 ngày',
    change: 'Kỷ lục!',
    icon: Zap,
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-400',
  },
];

const recentTasks = [
  { title: 'Bài tập Toán cao cấp', status: 'done', deadline: 'Hôm nay' },
  { title: 'Đọc chương 5 - CSDL', status: 'in_progress', deadline: 'Ngày mai' },
  { title: 'Ôn tập giữa kỳ Vật lý', status: 'todo', deadline: '3 ngày nữa' },
  { title: 'Nộp báo cáo thực hành', status: 'todo', deadline: '5 ngày nữa' },
];

const statusIcon: Record<string, React.ReactNode> = {
  done: <CheckCircle2 size={16} className="text-green-400" />,
  in_progress: <Clock size={16} className="text-amber-400" />,
  todo: <AlertCircle size={16} className="text-white/30" />,
};

const statusLabel: Record<string, string> = {
  done: 'Hoàn thành',
  in_progress: 'Đang làm',
  todo: 'Chưa bắt đầu',
};

export default function DashboardPage() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    healthCheck()
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('error'));
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* API Status */}
      {apiStatus !== 'loading' && (
        <motion.div
          variants={item}
          className={`glass-subtle px-4 py-2.5 flex items-center gap-2 text-sm ${
            apiStatus === 'ok' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              apiStatus === 'ok' ? 'bg-green-400' : 'bg-red-400'
            } animate-pulse`}
          />
          {apiStatus === 'ok'
            ? 'Backend API đang hoạt động bình thường'
            : 'Không thể kết nối tới Backend API'}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsData.map((stat, i) => (
          <motion.div key={stat.label} variants={item} className="stat-card">
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <stat.icon size={18} className={stat.iconColor} />
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-400/10 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-white/40">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <motion.div variants={item} className="lg:col-span-2 glass p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-primary-400" />
              Nhiệm vụ gần đây
            </h3>
            <Link href="/schedule" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTasks.map((task, i) => (
              <motion.div
                key={task.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-100/50 dark:bg-white/[0.03] hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {statusIcon[task.status]}
                  <div>
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'text-slate-400 dark:text-white/40 line-through' : 'text-slate-700 dark:text-white/80'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-white/30">{statusLabel[task.status]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-white/30 flex items-center gap-1">
                    <Calendar size={12} />
                    {task.deadline}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="glass p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Hành động nhanh</h3>

          <Link href="/chatbot" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/5 border border-primary-500/15 hover:border-primary-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare size={18} className="text-primary-400" />
                <span className="font-medium text-slate-700 dark:text-white/80 text-sm">Hỏi AI Trợ lý</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/35">
                Hỏi bất cứ điều gì về việc học, lời khuyên, phương pháp học tập...
              </p>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-r from-accent-500/10 to-accent-600/5 border border-accent-500/15 hover:border-accent-500/30 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap size={18} className="text-accent-400" />
              <span className="font-medium text-slate-700 dark:text-white/80 text-sm">Bắt đầu phiên học</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/35">
              Khởi động đồng hồ Pomodoro và theo dõi thời gian tập trung.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-pink-600/5 border border-pink-500/15 hover:border-pink-500/30 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <Target size={18} className="text-pink-400" />
              <span className="font-medium text-slate-700 dark:text-white/80 text-sm">Thêm mục tiêu mới</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/35">
              Đặt mục tiêu học tập cho tuần này và theo dõi tiến độ.
            </p>
          </motion.div>

          {/* Motivation Quote */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-center mt-4">
            <p className="text-sm text-slate-600 dark:text-white/50 italic">
              "Hành trình ngàn dặm bắt đầu từ một bước chân."
            </p>
            <p className="text-xs text-slate-400 dark:text-white/25 mt-1">— Lão Tử</p>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
