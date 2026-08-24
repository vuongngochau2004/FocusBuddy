'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Play, ArrowRight, Star, GraduationCap, Heart, Calendar, Compass, Bot } from 'lucide-react';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Scroll parallax depth
  const { scrollY } = useScroll();
  const phoneY = useTransform(scrollY, [0, 500], [0, 80]);
  const bgGlowY = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      id="home" 
      className="relative pt-32 pb-24 lg:pt-40 lg:pb-36 bg-gradient-to-b from-indigo-50/50 via-white to-transparent overflow-hidden"
    >
      {/* Background glow balls */}
      <motion.div style={{ y: bgGlowY }} className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-200/40 blur-[120px] pointer-events-none" />
      <motion.div style={{ y: bgGlowY }} className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/30 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold mb-6"
            >
              <Bot size={14} className="animate-bounce" /> AI Agent đồng hành cho sinh viên
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6"
            >
              Học tập thông minh hơn,<br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Sống cân bằng hơn</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-600 font-medium max-w-lg mb-8 leading-relaxed"
            >
              FocusBuddy là trợ lý AI đa tác vụ, giúp bạn học tập hiệu quả, chăm sóc sức khỏe tinh thần và quản lý thời gian một cách khoa học.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10"
            >
              <a href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl text-[16px] font-bold transition-all duration-300 shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-1">
                Bắt đầu miễn phí <ArrowRight size={18} />
              </a>
              <a href="#demo" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-8 py-4 rounded-2xl text-[16px] font-semibold border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                <Play size={16} fill="currentColor" className="text-slate-800" /> Xem demo
              </a>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 pt-6 w-full justify-center lg:justify-start"
            >
              <div className="flex -space-x-3.5">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i} 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                    src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&q=80&w=100`} 
                    alt={`Sinh viên ${i}`}
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-amber-500 justify-center sm:justify-start">
                  {[...Array(5)].map((_, idx) => <Star key={idx} size={16} fill="currentColor" />)}
                  <span className="text-sm font-bold text-slate-800 ml-1">4.9/5</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Được tin dùng bởi 10,000+ sinh viên toàn quốc</p>
              </div>
            </motion.div>
          </div>

          {/* Right Visual Container */}
          <div className="lg:col-span-6 relative flex justify-center items-center h-[550px] sm:h-[650px] w-full">
            {/* Ambient Purple Backdrop Shadow */}
            <div className="absolute w-[280px] sm:w-[350px] h-[500px] sm:h-[550px] bg-violet-400/20 rounded-full filter blur-[80px] z-0" />

            {/* Smartphone Container */}
            <motion.div 
              style={{ y: phoneY, translateX: springX, translateY: springY }}
              className="relative w-[280px] sm:w-[320px] h-[550px] sm:h-[590px] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800/80 z-10 flex flex-col overflow-hidden"
            >
              {/* Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-800" />
              </div>

              {/* Phone Content Screen */}
              <div className="flex-1 bg-white rounded-[38px] p-4 pt-8 flex flex-col gap-3 font-sans overflow-hidden text-left text-xs">
                {/* Header inside Mock */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white"><Bot size={16} /></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-[11px]">FocusBuddy</h4>
                      <p className="text-[9px] text-green-500 font-medium">● Online</p>
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </div>

                {/* Messages list */}
                <div className="flex-1 flex flex-col gap-3.5 pt-2">
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-3 text-slate-700 max-w-[85%] self-start leading-relaxed shadow-sm">
                    Chào Nguyên! 👋 Hôm nay bạn muốn FocusBuddy giúp gì cho bạn?
                  </div>
                  <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm p-3 max-w-[85%] self-end leading-relaxed shadow-sm shadow-violet-200">
                    Mình vừa thi xong và điểm không như kỳ vọng, mình nản quá...
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-3 text-slate-700 max-w-[85%] self-start leading-relaxed shadow-sm">
                    Mình hiểu cảm giác của bạn lúc này, 💜 Nhưng đừng lo, chúng ta sẽ cùng nhau vượt qua nhé!
                  </div>
                </div>

                {/* Input bar mockup */}
                <div className="p-2 border border-slate-100 rounded-xl flex items-center justify-between bg-slate-50">
                  <span className="text-slate-400 text-[10px]">Nhắn tin cho FocusBuddy...</span>
                  <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white">➔</div>
                </div>
              </div>
            </motion.div>

            {/* 3D Orbiting Robot */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <svg className="w-full h-full" style={{ position: 'absolute' }}>
                {/* Orbit Path Ellipse (drawn on screen) */}
                <ellipse 
                  cx="50%" 
                  cy="50%" 
                  rx="180" 
                  ry="120" 
                  fill="none" 
                  stroke="rgba(124, 58, 237, 0.12)" 
                  strokeWidth="2" 
                  strokeDasharray="6 6"
                  className="hidden sm:block"
                />
              </svg>

              {/* Orbiting Robot Element */}
              <motion.div 
                animate={{
                  x: [130, 200, 0, -200, -130, 130],
                  y: [40, 120, -140, -100, 80, 40],
                  scale: [0.95, 1.1, 0.85, 0.9, 1.05, 0.95],
                  zIndex: [12, 22, 5, 5, 22, 12]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-[40%] left-[45%] w-24 h-24 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-3xl p-4 flex flex-col justify-center items-center shadow-xl border border-white/30 backdrop-blur-sm pointer-events-auto"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-inner mb-1">
                  <Bot size={28} className="text-violet-600 animate-bounce" />
                </div>
                <div className="text-[10px] font-bold text-white tracking-widest uppercase">BUDDY AI</div>
                {/* Orbital particles */}
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-400 border-2 border-white animate-ping" />
              </motion.div>
            </div>

            {/* 4 Floating Sub-Agent Badges */}
            {/* Academic Agent */}
            <motion.div 
              style={{ x: useTransform(springX, (val) => val * -0.6), y: useTransform(springY, (val) => val * -0.6) }}
              className="absolute top-[8%] right-[5%] sm:right-[1%] bg-white/95 border border-indigo-50 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-lg z-25 w-[190px] sm:w-[220px]"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm"><GraduationCap size={20} /></div>
              <div>
                <h5 className="font-extrabold text-[12px] text-slate-800">Academic Agent</h5>
                <p className="text-[10px] font-semibold text-slate-500">Chuyên gia học thuật & điểm số</p>
              </div>
            </motion.div>

            {/* Psychology Agent */}
            <motion.div 
              style={{ x: useTransform(springX, (val) => val * 0.7), y: useTransform(springY, (val) => val * -0.5) }}
              className="absolute top-[32%] right-[-10px] sm:right-[-40px] bg-white/95 border border-pink-50 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-lg z-25 w-[190px] sm:w-[220px]"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-sm"><Heart size={20} /></div>
              <div>
                <h5 className="font-extrabold text-[12px] text-slate-800">Psychology Agent</h5>
                <p className="text-[10px] font-semibold text-slate-500">Chuyên gia tư vấn tâm lý</p>
              </div>
            </motion.div>

            {/* Schedule Agent */}
            <motion.div 
              style={{ x: useTransform(springX, (val) => val * -0.5), y: useTransform(springY, (val) => val * 0.7) }}
              className="absolute bottom-[24%] left-[-15px] sm:left-[-40px] bg-white/95 border border-emerald-50 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-lg z-25 w-[190px] sm:w-[220px]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm"><Calendar size={20} /></div>
              <div>
                <h5 className="font-extrabold text-[12px] text-slate-800">Schedule Agent</h5>
                <p className="text-[10px] font-semibold text-slate-500">Chuyên gia thời gian & kế hoạch</p>
              </div>
            </motion.div>

            {/* General Agent */}
            <motion.div 
              style={{ x: useTransform(springX, (val) => val * 0.6), y: useTransform(springY, (val) => val * 0.6) }}
              className="absolute bottom-[6%] right-[5%] sm:right-[1%] bg-white/95 border border-amber-50 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-lg z-25 w-[190px] sm:w-[220px]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm"><Compass size={20} /></div>
              <div>
                <h5 className="font-extrabold text-[12px] text-slate-800">General Agent</h5>
                <p className="text-[10px] font-semibold text-slate-500">Trợ lý chung & Chat chit</p>
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}
