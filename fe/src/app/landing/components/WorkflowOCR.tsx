'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileUp, Scan, Award, ChevronRight, BarChart } from 'lucide-react';

export default function WorkflowOCR() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  return (
    <section className="py-24 bg-[#fcfbff] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3.5 py-1.5 rounded-full border border-violet-100">
            Quy trình thông minh
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-5">
            Từ bảng điểm đến kế hoạch tối ưu GPA
          </h2>
          <p className="text-slate-500 font-semibold text-md leading-relaxed">
            Nhận lời khuyên cải thiện điểm học tập tức thì chỉ với vài bước đơn giản.
          </p>
        </div>

        {/* Workflow UI Mockup */}
        <div className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-3xl shadow-xl p-8 text-left text-sm">
          
          {/* Timeline Tracker */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
            {[
              { num: 1, label: 'Upload bảng điểm', icon: <FileUp size={16} /> },
              { num: 2, label: 'Quét OCR tự động', icon: <Scan size={16} /> },
              { num: 3, label: 'Trích xuất điểm số', icon: <BarChart size={16} /> },
              { num: 4, label: 'AI phân tích & gợi ý', icon: <Award size={16} /> },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num as any)}
                className={`flex items-center gap-2 pb-2 px-1 border-b-2 font-bold transition-all duration-300 ${step >= s.num ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= s.num ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {s.num}
                </div>
                <span className="text-xs sm:text-sm">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Content */}
          <div className="min-h-[250px] flex items-center justify-center">
            
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 text-center w-full max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-dashed border-indigo-200 flex items-center justify-center text-indigo-600">
                  <FileUp size={36} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">Tải ảnh hoặc PDF bảng điểm của bạn</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Hỗ trợ JPG, PNG, PDF chụp màn hình cổng đào tạo</p>
                </div>
                <button onClick={() => setStep(2)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-1">
                  Upload file mô phỏng <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex flex-col items-center gap-4 text-center w-full max-w-sm border border-slate-100 rounded-2xl p-6 bg-slate-50 overflow-hidden">
                {/* Laser scan animation overlay */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent z-10"
                />
                
                <div className="w-14 h-14 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Scan size={28} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">Đang quét OCR nhận dạng thực thể...</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Nhận diện tiêu đề môn học, điểm hệ 10, hệ 4 và tín chỉ</p>
                </div>
                <button onClick={() => setStep(3)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg text-xs mt-2 relative z-20">
                  Kế tiếp
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 w-full max-w-md">
                <h4 className="font-extrabold text-slate-800 text-center mb-1">Dữ liệu trích xuất thành công:</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                        <th className="px-4 py-2 text-left">Tên môn học</th>
                        <th className="px-4 py-2 text-center">Tín chỉ</th>
                        <th className="px-4 py-2 text-right">Điểm số</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <td className="px-4 py-2 text-left">Toán rời rạc</td>
                        <td className="px-4 py-2 text-center">3</td>
                        <td className="px-4 py-2 text-right text-rose-500 font-extrabold">3.5 (F)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-left">Lập trình Web</td>
                        <td className="px-4 py-2 text-center">4</td>
                        <td className="px-4 py-2 text-right text-green-600 font-extrabold">8.5 (A)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button onClick={() => setStep(4)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-1 self-center">
                  Gửi dữ liệu cho AI <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 w-full max-w-lg">
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex gap-4 text-xs">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex-shrink-0 flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 mb-1">Gợi ý từ Academic Agent:</h5>
                    <p className="text-slate-600 font-semibold leading-relaxed">
                      GPA hiện tại của bạn là 2.85. Môn <strong>Toán rời rạc</strong> đang kéo GPA của bạn xuống đáng kể. Chúng tôi gợi ý bạn đăng ký học cải thiện vào học kỳ phụ sắp tới. Cần học bổ túc thêm các chủ đề <em>Đồ thị</em> và <em>Đại số Boolean</em>. FocusBuddy đã tự tạo một lộ trình tự học gồm 5 buổi ôn thi Toán rời rạc trong Calendar của bạn!
                    </p>
                  </div>
                </div>
                <button onClick={() => setStep(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-5 rounded-xl text-xs self-center">
                  Thử lại quy trình
                </button>
              </motion.div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}
