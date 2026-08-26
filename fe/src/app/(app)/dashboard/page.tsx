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
import {
  studyTaskService,
  learningGoalService,
  studySessionService,
  academicPerformanceService,
} from '@/lib/services';
import { StudyTask } from '@/types';

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

const statusIcon: Record<string, React.ReactNode> = {
  DONE: <CheckCircle2 size={16} className="text-green-500" />,
  IN_PROGRESS: <Clock size={16} className="text-amber-500" />,
  TODO: <AlertCircle size={16} className="text-slate-400 dark:text-white/30" />,
  CANCELLED: <AlertCircle size={16} className="text-red-500/50" />,
};

const statusLabel: Record<string, string> = {
  DONE: 'Hoàn thành',
  IN_PROGRESS: 'Đang làm',
  TODO: 'Chưa làm',
  CANCELLED: 'Đã hủy',
};

export default function DashboardPage() {
  const [recentTasks, setRecentTasks] = useState<StudyTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Real stats state
  const [stats, setStats] = useState({
    studyHours: '0.0h',
    completedGoals: '0/0',
    gpa: '0.00',
    streak: '0 ngày',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 1. Load recent tasks
      const tasksRes = await studyTaskService.getAll(0, 10);
      const allTasks = tasksRes.data.items || [];
      // Sắp xếp đưa những việc chưa hoàn thành lên trước, giới hạn lấy 4 việc
      const sortedTasks = [...allTasks]
        .sort((a, b) => {
          if (a.status === 'DONE' && b.status !== 'DONE') return 1;
          if (a.status !== 'DONE' && b.status === 'DONE') return -1;
          return 0;
        })
        .slice(0, 4);
      setRecentTasks(sortedTasks);
      setLoadingTasks(false);

      // 2. Load learning goals count
      const goalsRes = await learningGoalService.getAll();
      const allGoals = goalsRes.data.items || [];
      const completedG = allGoals.filter((g) => g.status === 'COMPLETED' || g.status === 'ACHIEVED').length;
      const totalG = allGoals.length;

      // 3. Load study sessions to calculate hours & streak
      const sessionsRes = await studySessionService.getAll();
      const allSessions = sessionsRes.data.items || [];

      // Tính giờ học hôm nay
      const todayStr = new Date().toDateString();
      const todayMinutes = allSessions
        .filter((s) => new Date(s.start_time).toDateString() === todayStr)
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const hoursStr = (todayMinutes / 60).toFixed(1) + 'h';

      // Tính chuỗi tập trung (consecutive days)
      const uniqueDays = Array.from(
        new Set(
          allSessions.map((s) => new Date(s.start_time).toDateString())
        )
      ).map((d) => new Date(d as string).getTime());

      uniqueDays.sort((a, b) => b - a); // Sắp xếp ngày mới nhất lên đầu

      let streakCount = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      // Kiểm tra xem có phiên học nào hôm nay hoặc hôm qua không để bắt đầu tính streak
      const hasSessionToday = uniqueDays.some((time) => new Date(time).toDateString() === new Date().toDateString());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const hasSessionYesterday = uniqueDays.some((time) => new Date(time).toDateString() === yesterday.toDateString());

      if (hasSessionToday || hasSessionYesterday) {
        let currentCheck = hasSessionToday ? new Date() : yesterday;
        currentCheck.setHours(0, 0, 0, 0);

        while (true) {
          const hasDay = uniqueDays.some((time) => new Date(time).getTime() === currentCheck.getTime());
          if (hasDay) {
            streakCount++;
            currentCheck.setDate(currentCheck.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // 4. Load GPA từ kết quả học tập tích lũy gần nhất
      let cumulativeGpa = '0.00';
      try {
        const perfRes = await academicPerformanceService.getStatistics(0, 1);
        const statsList = perfRes.data || [];
        if (statsList.length > 0) {
          cumulativeGpa = statsList[0].cumulative_gpa?.toFixed(2) || '0.00';
        }
      } catch (err) {
        console.error('Failed to load cumulative GPA:', err);
      }

      setStats({
        studyHours: hoursStr,
        completedGoals: `${completedG}/${totalG}`,
        gpa: cumulativeGpa,
        streak: `${streakCount} ngày`,
      });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoadingTasks(false);
    }
  };

  const statsList = [
    {
      label: 'Giờ học hôm nay',
      value: stats.studyHours,
      icon: Clock,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    {
      label: 'Mục tiêu hoàn thành',
      value: stats.completedGoals,
      icon: Target,
      color: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-500 dark:text-green-400',
    },
    {
      label: 'GPA Hiện tại',
      value: stats.gpa,
      icon: TrendingUp,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-500 dark:text-purple-400',
    },
    {
      label: 'Chuỗi tập trung',
      value: stats.streak,
      icon: Zap,
      color: 'from-amber-500/20 to-amber-600/10',
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsList.map((stat, i) => (
          <motion.div key={stat.label} variants={item} className="stat-card">
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <stat.icon size={18} className={stat.iconColor} />
              </div>
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
              <BookOpen size={18} className="text-primary-500" />
              Nhiệm vụ gần đây
            </h3>
            <Link href="/schedule" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-slate-300 dark:border-white/20 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={36} className="text-slate-300 dark:text-white/10 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-white/40">Chưa có nhiệm vụ nào</p>
              </div>
            ) : (
              recentTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-100/50 dark:bg-white/[0.03] hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {statusIcon[task.status || 'TODO']}
                    <div>
                      <p className={`text-sm font-medium ${task.status === 'DONE' ? 'text-slate-400 dark:text-white/40 line-through' : 'text-slate-700 dark:text-white/80'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-white/30">{statusLabel[task.status || 'TODO']}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.deadline && (
                      <span className="text-xs text-slate-400 dark:text-white/30 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
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
                <MessageSquare size={18} className="text-primary-500" />
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
              <Zap size={18} className="text-accent-500" />
              <span className="font-medium text-slate-700 dark:text-white/80 text-sm">Bắt đầu phiên học</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/35">
              Đang cập nhật
              {/* Khởi động đồng hồ Pomodoro và theo dõi thời gian tập trung. */}
            </p>
          </motion.div>

          <Link href="/goals" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-pink-600/5 border border-pink-500/15 hover:border-pink-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <Target size={18} className="text-pink-500" />
                <span className="font-medium text-slate-700 dark:text-white/80 text-sm">Thêm mục tiêu mới</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/35">
                Đặt mục tiêu học tập cho tuần này và theo dõi tiến độ.
              </p>
            </motion.div>
          </Link>

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
