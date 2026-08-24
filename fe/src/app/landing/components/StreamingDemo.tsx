'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, RefreshCw } from 'lucide-react';

export default function StreamingDemo() {
  const fullText = "Đang kết nối SSE... \n[Academic Agent]: Tôi đã tạo lịch ôn tập cho bạn vào Thứ 3 (Toán rời rạc) và Thứ 5 (Lập trình). Hãy yên tâm ôn tập và thư giãn nhé!";
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!isTyping) return;
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + fullText[index]);
      index++;
      if (index >= fullText.length - 1) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isTyping]);

  const handleRestart = () => {
    setDisplayedText('');
    setIsTyping(true);
  };

  return (
    <section className="py-16 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left font-mono text-slate-300 text-xs shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={handleRestart} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-3 mb-4">
            <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center text-white"><Bot size={12} /></div>
            <span className="text-[10px] font-bold tracking-wider uppercase">SSE Streaming Token Output</span>
          </div>

          <div className="min-h-[70px] whitespace-pre-wrap leading-relaxed">
            {displayedText}
            {isTyping && (
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-1.5 h-3.5 bg-violet-500 ml-0.5 align-middle" />
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
