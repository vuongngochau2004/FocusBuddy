'use client';

import {
  Bell,
  Search,
  User,
  Sun,
  Moon,
  Clock,
  Sparkles,
  Info,
  GraduationCap,
  Heart,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/lib/services';
import { Notification } from '@/types';

const notiIcon: Record<string, React.ReactNode> = {
  REMINDER: <Clock size={14} className="text-amber-500" />,
  RECOMMENDATION: <Sparkles size={14} className="text-purple-500" />,
  SYSTEM: <Info size={14} className="text-blue-500" />,
  ACADEMIC: <GraduationCap size={14} className="text-emerald-500" />,
  MENTAL_HEALTH: <Heart size={14} className="text-pink-500" />,
};

export default function TopBar() {
  const [greeting, setGreeting] = useState('');
  const { user } = useAuth();
  const userName = user?.full_name || 'Sinh viên';
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');

    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getAll(0, 10);
      const items = res.data.items || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleMarkRead = async (notiId: string) => {
    try {
      await notificationService.markRead(notiId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notiId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-subtle px-6 py-4 flex items-center justify-between z-40 relative"
    >
      {/* Greeting */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          {greeting}, <span className="text-gradient">{userName}</span> 👋
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/40 mt-0.5">
          Hãy bắt đầu một ngày học tập hiệu quả!
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 glass-input !w-56 !py-2">
          <Search size={16} className="text-slate-400 dark:text-white/40" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="bg-transparent outline-none text-sm text-slate-800 dark:text-white/80 w-full placeholder:text-slate-400 dark:placeholder:text-white/30"
            id="search-input"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="glass-btn !p-2.5 !rounded-xl transition-all active:scale-95"
          id="btn-theme-toggle"
          title="Chuyển chế độ sáng/tối"
        >
          {mounted && (theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-700" />)}
          {!mounted && <div className="w-[18px] h-[18px]" />}
        </button>

        {/* Notification dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="glass-btn !p-2.5 !rounded-xl relative"
            id="btn-notification"
            title="Thông báo"
          >
            <Bell size={18} className="text-slate-700 dark:text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Dropdown Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 glass-strong p-4 rounded-2xl shadow-xl z-50 border border-slate-200/50 dark:border-white/10"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-white/5">
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">
                      Thông báo ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-0.5 transition-colors"
                      >
                        <Check size={12} /> Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell size={24} className="text-slate-300 dark:text-white/15 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 dark:text-white/30">Không có thông báo nào</p>
                      </div>
                    ) : (
                      notifications.map((noti) => (
                        <div
                          key={noti.id}
                          onClick={() => {
                            if (!noti.is_read) handleMarkRead(noti.id);
                          }}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                            noti.is_read
                              ? 'bg-transparent border-transparent text-slate-600 dark:text-white/60'
                              : 'bg-slate-100/70 dark:bg-white/[0.04] border-slate-200/50 dark:border-white/[0.02] text-slate-800 dark:text-white'
                          } hover:bg-slate-200/40 dark:hover:bg-white/[0.06]`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 rounded-lg bg-slate-200/60 dark:bg-white/10">
                              {notiIcon[noti.notification_type] || <Info size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${noti.is_read ? 'text-slate-500 dark:text-white/50' : 'text-slate-800 dark:text-white'}`}>
                                {noti.title}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5 line-clamp-2 leading-relaxed">
                                {noti.content}
                              </p>
                              <span className="text-[8px] text-slate-400 dark:text-white/20 mt-1 block">
                                {new Date(noti.sent_at).toLocaleDateString('vi-VN')} {new Date(noti.sent_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <button
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center"
          id="btn-profile"
        >
          <User size={16} className="text-white" />
        </button>
      </div>
    </motion.header>
  );
}
