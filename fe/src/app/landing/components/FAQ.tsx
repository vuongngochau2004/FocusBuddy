'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Hệ thống AI Multi-Agent hoạt động như thế nào?',
      a: 'Khi bạn gửi tin nhắn, Supervisor Agent phân tích intent (ý định) và context của bạn, tự động điều phối lệnh đến Sub-Agent phù hợp nhất (Academic, Psychology, Schedule, hoặc General) để trả lời.',
    },
    {
      q: 'Dữ liệu cá nhân và bảng điểm của tôi có an toàn không?',
      a: 'Hoàn toàn bảo mật. Dữ liệu bảng điểm quét qua OCR được xử lý trực tiếp trên RAM và lưu mã hóa. Chúng tôi cam kết không chia sẻ dữ liệu cá nhân hay lịch sử học tập của bạn cho bất kỳ bên thứ ba nào.',
    },
    {
      q: 'Cơ chế AI Streaming là gì?',
      a: 'FocusBuddy sử dụng cơ chế Server-Sent Events (SSE) giúp nhả chữ (token) ngay lập tức khi mô hình AI đang sinh từ, tương tự như chatGPT, giảm tối đa thời gian chờ đợi phản hồi của người dùng.',
    },
    {
      q: 'Tôi có phải trả phí để sử dụng FocusBuddy không?',
      a: 'Chúng tôi cung cấp gói miễn phí với đầy đủ các Sub-Agent cơ bản. Nếu có nhu cầu sử dụng các tính năng nâng cao như OCR số lượng lớn hoặc sử dụng LLM cao cấp, bạn có thể nâng cấp lên bản Premium.',
    },
    {
      q: 'Schedule Agent có đồng bộ với Calendar trên điện thoại của tôi không?',
      a: 'Có. Schedule Agent hỗ trợ kết nối với Google Calendar và Apple Calendar để đồng bộ hóa lịch học, danh sách việc cần làm và tự động gửi thông báo nhắc nhở.',
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#fcfbff] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3.5 py-1.5 rounded-full border border-violet-100">
            Giải đáp thắc mắc
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-5">
            Câu hỏi thường gặp
          </h2>
        </div>

        {/* FAQs list */}
        <div className="max-w-3xl mx-auto flex flex-col gap-4 text-left">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between font-bold text-slate-800 text-sm sm:text-md text-left"
                >
                  <span>{faq.q}</span>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isOpen ? 'bg-violet-50 text-violet-600' : 'bg-slate-50 text-slate-500'}`}>
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-5 text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold border-t border-slate-50 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
