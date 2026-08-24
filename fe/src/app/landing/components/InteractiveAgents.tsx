'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Heart, Calendar, Compass, Send } from 'lucide-react';

type AgentId = 'academic' | 'psychology' | 'schedule' | 'general';

interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  icon: React.ReactNode;
  bgClass: string;
  textColor: string;
  chatHistory: { sender: 'user' | 'bot'; text: string }[];
}

export default function InteractiveAgents() {
  const [activeAgent, setActiveAgent] = useState<AgentId>('academic');

  const agents: Record<AgentId, AgentInfo> = {
    academic: {
      id: 'academic',
      name: 'Academic Agent',
      role: 'Chuyên gia Học thuật',
      icon: <GraduationCap size={20} />,
      bgClass: 'bg-blue-50 text-blue-600',
      textColor: 'text-blue-600',
      chatHistory: [
        { sender: 'user', text: 'Giúp mình phân tích xem cần bao nhiêu điểm để qua môn Toán rời rạc với.' },
        { sender: 'bot', text: 'Chào Nguyên, dựa trên điểm giữa kỳ hiện tại là 5.0 (trọng số 30%), bạn cần tối thiểu 6.5 điểm ở bài thi cuối kỳ (trọng số 70%) để đạt GPA trung bình trên 6.0 và qua môn an toàn. Mình khuyên bạn nên tập trung vào phần đồ thị vì phần này chiếm 40% số điểm cuối kỳ.' },
      ],
    },
    psychology: {
      id: 'psychology',
      name: 'Psychology Agent',
      role: 'Chuyên gia Tư vấn Tâm lý',
      icon: <Heart size={20} />,
      bgClass: 'bg-pink-50 text-pink-600',
      textColor: 'text-pink-600',
      chatHistory: [
        { sender: 'user', text: 'Áp lực ôn thi làm mình stress quá, không tập trung nổi.' },
        { sender: 'bot', text: 'Bình tĩnh lại Nguyên nhé. Căng thẳng thi cử là điều rất bình thường. Hãy thử áp dụng quy tắc 5 phút: ngồi yên lặng và hít thở sâu, thở ra thật chậm. Đừng cố học dồn ép. FocusBuddy khuyên bạn nên đi dạo nhẹ nhàng 10 phút trước khi quay lại bàn học.' },
      ],
    },
    schedule: {
      id: 'schedule',
      name: 'Schedule Agent',
      role: 'Chuyên gia Lập kế hoạch',
      icon: <Calendar size={20} />,
      bgClass: 'bg-emerald-50 text-emerald-600',
      textColor: 'text-emerald-600',
      chatHistory: [
        { sender: 'user', text: 'Lên lịch giúp mình ôn thi cuối kỳ tuần sau.' },
        { sender: 'bot', text: 'Đã lên xong thời gian biểu ôn tập cho bạn! Mình đã chia nhỏ lịch ôn thi làm 3 chặng: Sáng thứ 2, 4 học Toán Rời Rạc (9:00 - 11:00); Chiều thứ 3, 5 học Lập trình Web. Mỗi chặng 2 tiếng và áp dụng Pomodoro ngắt quãng. Mình sẽ gửi nhắc nhở trước 15 phút nhé!' },
      ],
    },
    general: {
      id: 'general',
      name: 'General Agent',
      role: 'Trợ lý Chung',
      icon: <Compass size={20} />,
      bgClass: 'bg-amber-50 text-amber-600',
      textColor: 'text-amber-600',
      chatHistory: [
        { sender: 'user', text: 'Hello! Hôm nay thế nào rồi Buddy?' },
        { sender: 'bot', text: 'Chào Nguyên! Mình luôn sẵn sàng đồng hành cùng bạn. Hôm nay của bạn thế nào? Học tập có mệt không? Nếu muốn chat chit giải lao hoặc hỏi bất kỳ câu đố vui nào thì cứ nói với mình nhé! 😊' },
      ],
    },
  };

  return (
    <section id="demo" className="py-24 bg-[#f8f7ff] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3.5 py-1.5 rounded-full border border-violet-100">
            Một trợ lý — nhiều chuyên gia
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-5">
            Trải nghiệm các Sub-Agents chuyên sâu
          </h2>
          <p className="text-slate-500 font-semibold text-md leading-relaxed">
            Chọn một chuyên gia bên dưới để trò chuyện trực tiếp và trải nghiệm sự khác biệt về phong cách hỗ trợ.
          </p>
        </div>

        {/* Interactive Chat Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* Left Agent Selectors */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-thin">
            {(Object.keys(agents) as AgentId[]).map((key) => {
              const agent = agents[key];
              const isActive = activeAgent === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveAgent(key)}
                  className={`flex-shrink-0 flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all duration-300 w-[200px] lg:w-full ${isActive ? 'bg-white border-violet-200 shadow-md shadow-violet-100/50' : 'bg-white/40 border-transparent hover:bg-white/70'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? agent.bgClass : 'bg-slate-100 text-slate-400'}`}>
                    {agent.icon}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{agent.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{agent.role}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Chat Mock Interface */}
          <div className="lg:col-span-8 flex flex-col bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100 overflow-hidden min-h-[380px] text-sm text-left">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${agents[activeAgent].bgClass}`}>
                {agents[activeAgent].icon}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-[13px]">{agents[activeAgent].name}</h4>
                <p className="text-[10px] text-slate-400 font-semibold">{agents[activeAgent].role}</p>
              </div>
            </div>

            {/* Chat Box Conversation */}
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeAgent}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-4"
                >
                  {agents[activeAgent].chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`max-w-[80%] p-3.5 rounded-2xl leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-violet-600 text-white rounded-tr-none self-end shadow-violet-200' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100 self-start'}`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <input
                disabled
                placeholder={`Nhắn tin cho ${agents[activeAgent].name}...`}
                className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none cursor-not-allowed"
              />
              <button disabled className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white cursor-not-allowed">
                <Send size={14} />
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
