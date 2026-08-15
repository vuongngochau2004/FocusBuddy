'use client';

import { Bell, Search, User, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function TopBar() {
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('Sinh viên');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-subtle px-6 py-4 flex items-center justify-between"
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

        {/* Notification */}
        <button
          className="glass-btn !p-2.5 !rounded-xl relative"
          id="btn-notification"
        >
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
        </button>

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
