'use client';

import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Sparkles, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { userService } from '@/lib/services';
import { useTheme } from 'next-themes';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await userService.create({
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        phone_number: formData.phone_number || undefined,
      });

      localStorage.setItem('focusbuddy_user_id', res.data.id);
      localStorage.setItem('focusbuddy_user_name', res.data.full_name);
      setSuccess(true);

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Đã xảy ra lỗi khi đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="glass-btn !p-2.5 !rounded-xl transition-all active:scale-95"
          id="btn-theme-toggle-register"
          title="Chuyển chế độ sáng/tối"
        >
          {mounted && (theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-700" />)}
          {!mounted && <div className="w-[18px] h-[18px]" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-strong w-full max-w-md p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles size={28} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tạo tài khoản mới</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-2">
            Bắt đầu hành trình học tập cùng FocusBuddy
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-green-500 text-3xl font-bold"
              >
                ✓
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Đăng ký thành công!</h3>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-2">Đang chuyển đến trang Dashboard...</p>
          </motion.div>
        ) : (
          /* Form */
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-white/60 font-medium">Họ và tên</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="glass-input !pl-11"
                  required
                  id="input-fullname"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-white/60 font-medium">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@university.edu"
                  className="glass-input !pl-11"
                  required
                  id="input-email"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-white/60 font-medium">Số điện thoại (tuỳ chọn)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="0912 345 678"
                  className="glass-input !pl-11"
                  id="input-phone"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-white/60 font-medium">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className="glass-input !pl-11 !pr-11"
                  required
                  minLength={6}
                  id="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center font-medium"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="glass-btn-accent w-full flex items-center justify-center gap-2 !py-3 disabled:opacity-50"
              id="btn-register"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Đăng ký
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>
        )}

        {/* Footer */}
        {!success && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-white/40">
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="text-accent-600 dark:text-accent-400 hover:text-accent-500 dark:hover:text-accent-300 font-medium transition-colors"
                id="link-login"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
