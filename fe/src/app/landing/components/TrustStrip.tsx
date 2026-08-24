'use client';

import React from 'react';
import { ShieldCheck, Zap, ScanFace, Layers, Cpu } from 'lucide-react';

export default function TrustStrip() {
  const items = [
    { icon: <ShieldCheck size={20} className="text-violet-600" />, title: 'Bảo mật dữ liệu', desc: 'An toàn tuyệt đối' },
    { icon: <Zap size={20} className="text-violet-600" />, title: 'Streaming AI', desc: 'Phản hồi tức thì' },
    { icon: <ScanFace size={20} className="text-violet-600" />, title: 'OCR thông minh', desc: 'Trích xuất điểm tự động' },
    { icon: <Layers size={20} className="text-violet-600" />, title: 'Đa mô hình AI', desc: 'OpenAI, Gemini, LLMs' },
    { icon: <Cpu size={20} className="text-violet-600" />, title: 'Xử lý nền', desc: 'Nhanh & ổn định' },
  ];

  return (
    <section className="py-8 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 md:justify-between lg:px-12">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                <p className="text-xs text-slate-500 font-semibold">{item.desc}</p>
              </div>
              {idx < items.length - 1 && (
                <div className="hidden lg:block w-px h-8 bg-slate-200 self-center ml-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
