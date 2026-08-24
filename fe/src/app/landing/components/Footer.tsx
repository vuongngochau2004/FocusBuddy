'use client';

import React from 'react';
import { Bot, Github, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="about" className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
            <Bot size={18} />
          </div>
          <span className="text-sm font-bold text-white">FocusBuddy</span>
        </div>
        <p className="text-xs font-semibold text-slate-500">
          © {new Date().getFullYear()} FocusBuddy AI. Mọi quyền được bảo lưu.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="p-2 bg-slate-800 rounded-xl hover:text-white transition-colors">
            <Github size={18} />
          </a>
          <a href="#" className="p-2 bg-slate-800 rounded-xl hover:text-white transition-colors">
            <Facebook size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
