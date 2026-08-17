'use client';

import { motion } from 'framer-motion';
import { Settings, User, Bell, Palette, Globe, Shield, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setUserName(localStorage.getItem('focusbuddy_user_name') || '');
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-600/10 flex items-center justify-center">
          <Settings size={18} className="text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Cài đặt</h2>
          <p className="text-sm text-white/40">Tùy chỉnh ứng dụng theo ý bạn</p>
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div variants={item} className="glass p-6 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <User size={18} className="text-primary-400" />
          Thông tin cá nhân
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Họ và tên</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="glass-input"
              id="settings-name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="email@example.com"
              id="settings-email"
            />
          </div>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div variants={item} className="glass p-6 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Bell size={18} className="text-amber-400" />
          Thông báo
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Nhắc nhở nhiệm vụ', desc: 'Nhận thông báo trước khi nhiệm vụ đến hạn' },
            { label: 'Tóm tắt hằng ngày', desc: 'Nhận email tóm tắt kết quả học tập mỗi ngày' },
            { label: 'Lời khuyên AI', desc: 'Nhận gợi ý từ AI về phương pháp học tập' },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div>
                <p className="text-sm text-white/80">{setting.label}</p>
                <p className="text-xs text-white/30">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-10 h-5 bg-white/10 peer-checked:bg-primary-500/60 rounded-full
                  after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white
                  after:rounded-full after:h-4 after:w-4 after:transition-all
                  peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={item} className="glass p-6 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Palette size={18} className="text-pink-400" />
          Giao diện
        </h3>
        <div className="flex gap-3">
          {[
            { label: 'Tối', color: 'bg-surface-dark border-primary-500/30' },
            { label: 'Sáng', color: 'bg-white/80 border-white/20' },
            { label: 'Tự động', color: 'bg-gradient-to-r from-surface-dark to-white/60 border-white/15' },
          ].map((theme) => (
            <button
              key={theme.label}
              className={`flex-1 p-4 rounded-xl border ${theme.color} text-center transition-all hover:scale-105`}
            >
              <div className={`w-8 h-8 rounded-lg mx-auto mb-2 ${theme.color}`} />
              <span className="text-xs font-medium text-white/60">{theme.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={item}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-btn-primary flex items-center gap-2"
          id="btn-save-settings"
        >
          <Save size={16} />
          Lưu cài đặt
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
