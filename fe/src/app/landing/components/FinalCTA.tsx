'use client';

import React from 'react';
import { ArrowRight, Bot } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20 mb-2">
          <Bot size={24} className="animate-bounce" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Sẵn sàng học tập thông minh hơn cùng FocusBuddy?
        </h2>
        <p className="text-indigo-100 max-w-lg font-semibold text-sm leading-relaxed">
          Bắt đầu hành trình nâng cấp bản thân ngay hôm nay cùng bộ tư trợ lý AI đa tài. Hoàn toàn miễn phí, cài đặt trong 1 phút.
        </p>
        <a href="/register" className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-violet-700 px-8 py-4 rounded-2xl text-[16px] font-bold transition-all duration-300 shadow-xl hover:-translate-y-1">
          Bắt đầu miễn phí <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
