'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, MessageSquare, LineChart, ShieldAlert } from 'lucide-react';

export default function Personalization() {
  const inputs = [
    { icon: <MessageSquare size={18} className="text-violet-600" />, text: 'Lịch sử hội thoại tuần trước' },
    { icon: <LineChart size={18} className="text-indigo-600" />, text: 'Hồ sơ điểm thi & GPA hiện tại' },
    { icon: <ShieldAlert size={18} className="text-pink-600" />, text: 'Cảm xúc ghi nhận hôm nay' },
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
          
          {/* Left Text */}
          <div className="lg:col-span-5 text-center lg:text-left">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3.5 py-1.5 rounded-full border border-violet-100">
              Trải nghiệm cá nhân hóa
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-5 leading-snug">
              Thấu hiểu theo ngữ cảnh và bộ nhớ
            </h2>
            <p className="text-slate-500 font-semibold text-sm leading-relaxed mb-6">
              Hệ thống <strong>Context Builder & Memory</strong> lưu giữ an toàn lịch sử và hồ sơ học tập của học sinh, giúp AI thấu hiểu hoàn cảnh cụ thể của bạn trước khi đưa ra câu trả lời.
            </p>
            
            <div className="flex flex-col gap-3 justify-center lg:justify-start">
              {inputs.map((inp, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-700 text-xs font-bold">
                  {inp.icon} {inp.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right Graphical Box */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div className="relative bg-gradient-to-br from-indigo-50/50 to-violet-50/30 border border-indigo-100/50 rounded-3xl p-8 w-full max-w-lg shadow-inner">
              <div className="flex flex-col items-center gap-6 text-center">
                
                {/* Core Box representing Context Builder */}
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-200"
                >
                  <BrainCircuit size={36} />
                </motion.div>

                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Context Builder Core</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">Trích xuất ý định, tạo System Prompt động</p>
                </div>

                <div className="w-full border-t border-indigo-100/60 my-2" />

                {/* Outputs Display */}
                <div className="w-full flex flex-col gap-2.5 text-xs text-left">
                  <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <span className="font-extrabold text-slate-700">Khuyên dùng hôm nay:</span>
                    <span className="text-[10px] font-bold text-violet-600 uppercase bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                      Gợi ý của AI
                    </span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 leading-relaxed text-slate-500 font-semibold italic">
                    "Hôm nay bạn vừa hoàn thành 3 task khó. FocusBuddy gợi ý bạn nên nghỉ ngơi 30 phút, nghe bản nhạc thư giãn và tạm hoãn ôn thi đến 8:00 tối."
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
