'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Heart, Calendar, Compass, ArrowRight } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <GraduationCap size={28} className="text-blue-600" />,
      title: 'AI Chat đa tác vụ',
      desc: 'Hệ thống Multi-Agent thông minh hiểu sâu sắc yêu cầu của bạn, điều phối dữ liệu để đưa ra câu trả lời tối ưu tức thì.',
      color: 'from-blue-50 to-indigo-50/20 border-blue-100',
      badge: 'Academic Agent',
      accentColor: 'blue',
    },
    {
      icon: <Heart size={28} className="text-pink-600" />,
      title: 'Chăm sóc tinh thần',
      desc: 'Lắng nghe, thấu hiểu, giảm căng thẳng học tập nhờ Psychology Agent đồng hành, tư vấn cảm xúc không phán xét.',
      color: 'from-pink-50 to-rose-50/20 border-pink-100',
      badge: 'Psychology Agent',
      accentColor: 'pink',
    },
    {
      icon: <Calendar size={28} className="text-emerald-600" />,
      title: 'Quản lý thời gian',
      desc: 'Lập thời gian biểu, nhắc deadline và lên danh sách công việc cần làm tự động cùng Schedule & Action Agent.',
      color: 'from-emerald-50 to-teal-50/20 border-emerald-100',
      badge: 'Schedule Agent',
      accentColor: 'emerald',
    },
    {
      icon: <Compass size={28} className="text-amber-600" />,
      title: 'Phân tích học tập',
      desc: 'Trích xuất điểm số từ bảng điểm qua OCR và phân tích tự động bằng Academic Agent giúp vạch rõ lộ trình GPA tối ưu.',
      color: 'from-amber-50 to-orange-50/20 border-amber-100',
      badge: 'Academic / OCR',
      accentColor: 'amber',
    },
  ];

  return (
    <section id="features" className="py-24 bg-[#fcfbff] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3.5 py-1.5 rounded-full border border-violet-100">
            Tất cả trong một nền tảng
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-5">
            Tính năng nổi bật được thiết kế riêng
          </h2>
          <p className="text-slate-500 font-semibold text-md leading-relaxed">
            FocusBuddy sở hữu hệ thống đa chuyên gia AI hoạt động hài hòa để hỗ trợ mọi khía cạnh trong đời sống học đường của sinh viên.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative overflow-hidden bg-gradient-to-br ${feature.color} border rounded-3xl p-8 hover:shadow-xl hover:shadow-indigo-50/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[260px]`}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md shadow-slate-100">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2.5 py-1 rounded-lg shadow-sm border border-slate-100 text-slate-500">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-6">
                  {feature.desc}
                </p>
              </div>

              <a href="#demo" className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 group-hover:gap-2.5 transition-all duration-200">
                Tìm hiểu thêm <ArrowRight size={14} />
              </a>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
