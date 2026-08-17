'use client';

import { motion } from 'framer-motion';
import {
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { gradeService, courseService } from '@/lib/services';
import { Course } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

// Demo data to display when no real data
const demoSemesters = [
  {
    name: 'Học kỳ 1 - 2024-2025',
    gpa: 3.42,
    credits: 18,
    courses: [
      { name: 'Toán cao cấp 1', code: 'MATH101', credits: 3, grade: 'A', score: 8.5 },
      { name: 'Vật lý đại cương', code: 'PHYS101', credits: 3, grade: 'B+', score: 7.8 },
      { name: 'Nhập môn CNTT', code: 'IT101', credits: 3, grade: 'A', score: 8.7 },
      { name: 'Kỹ thuật lập trình', code: 'CS101', credits: 3, grade: 'A+', score: 9.2 },
      { name: 'Tiếng Anh 1', code: 'ENG101', credits: 3, grade: 'B', score: 7.0 },
      { name: 'Pháp luật đại cương', code: 'LAW101', credits: 3, grade: 'B+', score: 7.5 },
    ],
  },
  {
    name: 'Học kỳ 2 - 2024-2025',
    gpa: 3.58,
    credits: 19,
    courses: [
      { name: 'Toán cao cấp 2', code: 'MATH102', credits: 3, grade: 'A', score: 8.3 },
      { name: 'Cấu trúc dữ liệu', code: 'CS201', credits: 4, grade: 'A+', score: 9.0 },
      { name: 'Cơ sở dữ liệu', code: 'CS202', credits: 3, grade: 'A', score: 8.8 },
      { name: 'Mạng máy tính', code: 'CS203', credits: 3, grade: 'B+', score: 7.6 },
      { name: 'Tiếng Anh 2', code: 'ENG102', credits: 3, grade: 'A', score: 8.2 },
      { name: 'Xác suất thống kê', code: 'MATH201', credits: 3, grade: 'B+', score: 7.7 },
    ],
  },
];

const gradeColors: Record<string, string> = {
  'A+': 'text-emerald-400 bg-emerald-400/10',
  'A': 'text-green-400 bg-green-400/10',
  'B+': 'text-blue-400 bg-blue-400/10',
  'B': 'text-sky-400 bg-sky-400/10',
  'C+': 'text-amber-400 bg-amber-400/10',
  'C': 'text-orange-400 bg-orange-400/10',
  'D': 'text-red-400 bg-red-400/10',
  'F': 'text-red-500 bg-red-500/10',
};

export default function ScoresPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    courseService
      .getAll()
      .then((res) => setCourses(res.data.items || []))
      .catch(() => {});
  }, []);

  const overallGPA = 3.50;
  const totalCredits = 37;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
          <GraduationCap size={18} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Bảng điểm</h2>
          <p className="text-sm text-white/40">Theo dõi kết quả học tập theo từng học kỳ</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={item} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{overallGPA}</p>
              <p className="text-xs text-white/40">GPA Tích lũy</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <BookOpen size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCredits}</p>
              <p className="text-xs text-white/40">Tín chỉ hoàn thành</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              <Award size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Khá</p>
              <p className="text-xs text-white/40">Xếp loại</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* GPA Bar Chart (simple visual) */}
      <motion.div variants={item} className="glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-primary-400" />
          <h3 className="font-semibold text-white">Biểu đồ GPA theo học kỳ</h3>
        </div>
        <div className="flex items-end gap-4 h-40">
          {demoSemesters.map((sem, i) => {
            const heightPercent = (sem.gpa / 4.0) * 100;
            return (
              <div key={sem.name} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-white">{sem.gpa}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: 0.5 + i * 0.2, duration: 0.8, ease: 'easeOut' }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary-500/40 to-primary-400/60 border border-primary-400/20 relative"
                >
                  <div className="absolute inset-0 rounded-t-lg bg-primary-400/10 backdrop-blur-sm" />
                </motion.div>
                <span className="text-[10px] text-white/30 text-center">HK{i + 1}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Semester Details */}
      {demoSemesters.map((semester, semIndex) => (
        <motion.div key={semester.name} variants={item} className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{semester.name}</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/40">GPA: <span className="text-emerald-400 font-bold">{semester.gpa}</span></span>
              <span className="text-sm text-white/40">Tín chỉ: <span className="text-white/70 font-medium">{semester.credits}</span></span>
            </div>
          </div>

          {/* Course Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-white/30 border-b border-white/5">
                  <th className="text-left py-3 px-3 font-medium">Mã HP</th>
                  <th className="text-left py-3 px-3 font-medium">Tên môn học</th>
                  <th className="text-center py-3 px-3 font-medium">Tín chỉ</th>
                  <th className="text-center py-3 px-3 font-medium">Điểm số</th>
                  <th className="text-center py-3 px-3 font-medium">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {semester.courses.map((course, i) => (
                  <motion.tr
                    key={course.code}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + semIndex * 0.2 + i * 0.05 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-3 text-sm text-primary-300/70 font-mono">{course.code}</td>
                    <td className="py-3 px-3 text-sm text-white/70">{course.name}</td>
                    <td className="py-3 px-3 text-sm text-white/50 text-center">{course.credits}</td>
                    <td className="py-3 px-3 text-sm text-white/70 text-center font-medium">{course.score}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${gradeColors[course.grade] || 'text-white/50'}`}>
                        {course.grade}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
