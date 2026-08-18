'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  GraduationCap,
  Target,
  Heart,
  Settings,
  LogOut,
  Sparkles,
  X,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chatbot', label: 'AI Chatbot', icon: MessageSquare },
  { href: '/schedule', label: 'Lịch học', icon: CalendarDays },
  { href: '/scores', label: 'Điểm số', icon: GraduationCap },
  { href: '/goals', label: 'Mục tiêu', icon: Target },
  { href: '/mental-health', label: 'Sức khỏe', icon: Heart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden glass-btn p-2 rounded-lg"
        id="sidebar-toggle"
      >
        {collapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={`
          fixed top-0 left-0 h-screen w-[260px] z-40
          glass-strong flex flex-col
          transition-transform duration-300
          ${collapsed ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ borderRadius: '0 16px 16px 0' }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">FocusBuddy</h1>
            <p className="text-xs text-slate-500 dark:text-white/40">Trợ lý học tập AI</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCollapsed(false)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                id={`nav-${item.href.replace('/', '')}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-primary-400 rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 space-y-1 border-t border-white/5">
          <Link href="/settings" className="sidebar-link" id="nav-settings">
            <Settings size={18} />
            <span>Cài đặt</span>
          </Link>
          <button
            className="sidebar-link w-full text-red-400/70 hover:text-red-400"
            id="btn-logout"
            onClick={() => {
              localStorage.removeItem('focusbuddy_user_id');
              window.location.href = '/login';
            }}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
