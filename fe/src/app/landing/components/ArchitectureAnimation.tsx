'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Server, Cpu, Layers, Zap, ArrowRight } from 'lucide-react';

export default function ArchitectureAnimation() {
  const steps = [
    {
      id: 'user',
      icon: <User size={24} className="text-white" />,
      color: 'bg-violet-600 shadow-violet-200',
      label: 'Người dùng',
      desc: 'Gửi Chat / Voice / SSE Streaming',
    },
    {
      id: 'be',
      icon: <Server size={24} className="text-white" />,
      color: 'bg-indigo-600 shadow-indigo-200',
      label: 'Backend API Chat Service',
      desc: 'Quản lý Context, Memory & API Router',
    },
    {
      id: 'supervisor',
      icon: <Cpu size={24} className="text-white" />,
      color: 'bg-blue-600 shadow-blue-200',
      label: 'Supervisor Agent (Main)',
      desc: 'Phân tích Intent, trích lọc Context',
    },
    {
      id: 'subagents',
      icon: <Layers size={24} className="text-white" />,
      color: 'bg-emerald-600 shadow-emerald-200',
      label: 'Sub-Agents Layer',
      desc: 'Academic, Psychology, Schedule, General',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3.5 py-1.5 rounded-full border border-violet-100">
            Cách FocusBuddy hoạt động
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-5">
            Hệ thống Multi-Agent thông minh
          </h2>
          <p className="text-slate-500 font-semibold text-md leading-relaxed">
            Luồng dữ liệu được điều phối tự động giữa Supervisor Agent và các Sub-Agents chuyên môn để đem lại phản hồi chính xác nhất.
          </p>
        </div>

        {/* Dynamic Data Flow Nodes */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4 relative max-w-5xl mx-auto py-8">
          
          {/* Connector Line overlay (Desktop only) */}
          <div className="hidden lg:block absolute top-[30px] left-[5%] right-[5%] h-[2px] bg-gradient-to-r from-violet-200 via-indigo-200 to-emerald-200 -z-10" />

          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="flex flex-col items-center text-center w-full lg:w-1/4 max-w-[200px]"
              >
                {/* Node Bubble */}
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg mb-4 relative`}>
                  {step.icon}
                  {/* Streaming pulse indicator */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <Zap size={8} className="text-white fill-current" />
                  </div>
                </div>

                <h4 className="text-sm font-extrabold text-slate-800 mb-1">{step.label}</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">{step.desc}</p>
              </motion.div>

              {/* Connecting arrows for mobile/tablet & desktop */}
              {idx < steps.length - 1 && (
                <div className="flex items-center justify-center text-slate-300 lg:hidden">
                  <ArrowRight size={20} className="rotate-90 text-slate-400" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

      </div>
    </section>
  );
}
