'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Trang chủ', href: '#home' },
    { name: 'Tính năng', href: '#features' },
    { name: 'Cách hoạt động', href: '#how-it-works' },
    { name: 'Giá', href: '#pricing' },
    { name: 'Về chúng tôi', href: '#about' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/70 backdrop-blur-md border-b border-indigo-100/50 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-200">
              <Bot size={22} className="animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Focus<span className="text-violet-600">Buddy</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-[15px] font-medium text-slate-600 hover:text-violet-600 transition-colors duration-200">
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA & Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/login" className="px-5 py-2.5 text-[15px] font-semibold text-slate-700 hover:text-violet-600 transition-colors duration-200">
              Đăng nhập
            </a>
            <a href="/register" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-[15px] font-semibold transition-all duration-300 shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300 hover:-translate-y-0.5">
              Bắt đầu miễn phí <ArrowRight size={16} />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:text-violet-600 transition-colors">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-indigo-50 px-4 pt-2 pb-6 flex flex-col gap-4 animate-slide-up">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-[15px] font-medium text-slate-600 hover:text-violet-600 py-2 border-b border-slate-50">
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-2">
            <a href="/login" className="w-full text-center py-2.5 text-[15px] font-semibold text-slate-700 hover:text-violet-600">
              Đăng nhập
            </a>
            <a href="/register" className="w-full text-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl text-[15px] font-semibold shadow-md shadow-violet-200">
              Bắt đầu miễn phí
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
