'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  BarChart3,
  Upload,
  Edit3,
  Plus,
  Trash2,
  Save,
  X,
  Check,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
  gradeService,
  courseService,
  academicTermService,
  academicPerformanceService,
} from '@/lib/services';
import { Course, AcademicTerm } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const gradeColors: Record<string, string> = {
  'A+': 'text-emerald-500 bg-emerald-500/10',
  'A': 'text-green-500 bg-green-500/10',
  'B+': 'text-blue-500 bg-blue-500/10',
  'B': 'text-sky-500 bg-sky-500/10',
  'C+': 'text-amber-500 bg-amber-500/10',
  'C': 'text-orange-500 bg-orange-500/10',
  'D': 'text-red-400 bg-red-400/10',
  'F': 'text-red-500 bg-red-500/10',
};

interface ManualRow {
  courseCode: string;
  courseName: string;
  credits: number;
  scoreProcess: string;
  scoreMidterm: string;
  scoreFinal: string;
}

export default function ScoresPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ gpa: 0, credits: 0, rank: 'Chưa có' });
  const [semestersData, setSemestersData] = useState<any[]>([]);

  // Available database lists for mapping
  const [dbCourses, setDbCourses] = useState<Course[]>([]);
  const [dbTerms, setDbTerms] = useState<AcademicTerm[]>([]);

  // Upload States
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Manual Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    { courseCode: '', courseName: '', credits: 3, scoreProcess: '', scoreMidterm: '', scoreFinal: '' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Academic Term States
  const [isNewTermOpen, setIsNewTermOpen] = useState(false);
  const [newTermData, setNewTermData] = useState({
    display_name: '',
    academic_year: '',
    semester_type: 'REGULAR' as 'REGULAR' | 'SUMMER',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadScoresData();
    loadMetaLists();
  }, []);

  const loadMetaLists = async () => {
    try {
      const [coursesRes, termsRes] = await Promise.all([
        courseService.getAll(0, 500),
        academicTermService.getAll(0, 100),
      ]);
      setDbCourses(coursesRes.data.items || []);
      const termsList = termsRes.data.items || [];
      setDbTerms(termsList);
      if (termsList.length > 0) {
        setSelectedTermId(termsList[0].id);
      }
    } catch (err) {
      console.error('Failed to load metadata lists:', err);
    }
  };

  const loadScoresData = async () => {
    try {
      const [termsRes, coursesRes, gradesRes, statsRes] = await Promise.all([
        academicTermService.getAll(),
        courseService.getAll(),
        gradeService.getAll(),
        academicPerformanceService.getStatistics(),
      ]);

      const terms = termsRes.data.items || [];
      const courses = coursesRes.data.items || [];
      const grades = gradesRes.data || [];
      const dbStats = statsRes.data || [];

      const termMap = new Map(terms.map((t: any) => [t.id, t]));
      const courseMap = new Map(courses.map((c: any) => [c.id, c]));

      const grouped = new Map<string, any>();

      grades.forEach((grade: any) => {
        const term = termMap.get(grade.academic_term_id);
        const course = courseMap.get(grade.course_id);
        if (!term || !course) return;

        const termId = term.id;
        if (!grouped.has(termId)) {
          grouped.set(termId, {
            name: term.display_name,
            termId: term.id,
            courses: [],
            gpa: 0,
            credits: 0,
          });
        }

        const termGroup = grouped.get(termId);
        termGroup.courses.push({
          code: course.course_code,
          name: course.course_name,
          credits: course.credits,
          score: grade.total_score,
          grade: grade.letter_grade || '-',
        });
      });

      dbStats.forEach((stat: any) => {
        if (grouped.has(stat.semester_id)) {
          const termGroup = grouped.get(stat.semester_id);
          termGroup.gpa = stat.semester_gpa || 0;
          termGroup.credits = stat.completed_credits || 0;
        }
      });

      const semesterList = Array.from(grouped.values());

      let overallGPA = 0;
      let totalCredits = 0;
      let rank = 'Chưa có';

      if (dbStats.length > 0) {
        overallGPA = dbStats[0].cumulative_gpa || 0;
        totalCredits = dbStats.reduce((sum: number, s: any) => sum + (s.completed_credits || 0), 0);
        rank = dbStats[0].rank || 'Chưa có';
      }

      setStats({
        gpa: overallGPA,
        credits: totalCredits,
        rank: rank,
      });
      setSemestersData(semesterList);
    } catch (err) {
      console.error('Failed to load scores data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper calculating letter grades and points dynamically on front-end
  const computeGradeDetails = (p: number, m: number, f: number) => {
    const total = p * 0.3 + m * 0.3 + f * 0.4;
    let letter = 'F';
    let point = 0.0;

    if (total >= 9.0) { letter = 'A+'; point = 4.0; }
    else if (total >= 8.5) { letter = 'A'; point = 4.0; }
    else if (total >= 8.0) { letter = 'B+'; point = 3.5; }
    else if (total >= 7.0) { letter = 'B'; point = 3.0; }
    else if (total >= 6.5) { letter = 'C+'; point = 2.5; }
    else if (total >= 5.5) { letter = 'C'; point = 2.0; }
    else if (total >= 5.0) { letter = 'D+'; point = 1.5; }
    else if (total >= 4.0) { letter = 'D'; point = 1.0; }

    return { total: Math.round(total * 10) / 10, letter, point };
  };

  // Mock Upload Handlers
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        showToast('success', `Tải lên ${file.name} thành công! (Sẽ tự động trích xuất bằng AI khi tích hợp Backend)`);
      }, 1500);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Manual Modal Row Manipulations
  const handleAddRow = () => {
    setManualRows([...manualRows, { courseCode: '', courseName: '', credits: 3, scoreProcess: '', scoreMidterm: '', scoreFinal: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (manualRows.length > 1) {
      setManualRows(manualRows.filter((_, i) => i !== index));
    }
  };

  const handleRowChange = (index: number, field: keyof ManualRow, value: any) => {
    const updated = [...manualRows];
    updated[index] = { ...updated[index], [field]: value };
    setManualRows(updated);
  };

  const handleSaveManualGrades = async () => {
    // Validate empty term
    if (!selectedTermId) {
      showToast('error', 'Vui lòng chọn học kỳ để lưu điểm!');
      return;
    }

    // Validate empty fields in rows
    for (let i = 0; i < manualRows.length; i++) {
      const row = manualRows[i];
      if (!row.courseCode || !row.courseName || row.scoreProcess === '' || row.scoreMidterm === '' || row.scoreFinal === '') {
        showToast('error', `Vui lòng nhập đầy đủ thông tin ở dòng ${i + 1}!`);
        return;
      }
      const p = parseFloat(row.scoreProcess);
      const m = parseFloat(row.scoreMidterm);
      const f = parseFloat(row.scoreFinal);
      if (isNaN(p) || p < 0 || p > 10 || isNaN(m) || m < 0 || m > 10 || isNaN(f) || f < 0 || f > 10) {
        showToast('error', `Điểm nhập vào phải từ 0 đến 10 ở dòng ${i + 1}!`);
        return;
      }
    }

    setIsSaving(true);
    try {
      // Loop over rows and submit
      for (const row of manualRows) {
        // 1. Kiểm tra xem môn học đã có trong DB chưa, nếu chưa thì tạo môn mới
        let course = dbCourses.find(c => c.course_code.toUpperCase() === row.courseCode.toUpperCase());
        let courseId = course?.id;

        if (!courseId) {
          const newCourseRes = await courseService.create({
            course_code: row.courseCode.toUpperCase(),
            course_name: row.courseName,
            credits: row.credits,
            course_type: 'COMPULSORY',
          });
          courseId = newCourseRes.data.id;
        }

        // 2. Tính toán điểm tổng kết
        const p = parseFloat(row.scoreProcess);
        const m = parseFloat(row.scoreMidterm);
        const f = parseFloat(row.scoreFinal);
        const { total, letter, point } = computeGradeDetails(p, m, f);

        // 3. Tạo điểm số mới
        await gradeService.create({
          course_id: courseId,
          academic_term_id: selectedTermId,
          score_process: p,
          score_midterm: m,
          score_final: f,
          total_score: total,
          letter_grade: letter,
          grade_point: point,
          status: total >= 4.0 ? 'PASSED' : 'FAILED',
          attempt_number: 1,
        });
      }

      showToast('success', 'Nhập bảng điểm thành công!');
      setIsManualModalOpen(false);
      setManualRows([{ courseCode: '', courseName: '', credits: 3, scoreProcess: '', scoreMidterm: '', scoreFinal: '' }]);
      
      // Reload everything
      await loadScoresData();
      await loadMetaLists();
    } catch (err: any) {
      console.error('Failed to save manual grades:', err);
      const detail = err?.response?.data?.detail;
      showToast('error', typeof detail === 'string' ? detail : 'Trùng môn học hoặc học kỳ đã nhập điểm trước đó.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewTerm = async () => {
    if (!newTermData.display_name || !newTermData.academic_year) {
      showToast('error', 'Vui lòng điền đầy đủ tên học kỳ và năm học!');
      return;
    }
    try {
      const res = await academicTermService.create({
        display_name: newTermData.display_name,
        academic_year: newTermData.academic_year,
        semester_type: newTermData.semester_type,
      });
      showToast('success', 'Thêm học kỳ mới thành công!');
      setIsNewTermOpen(false);
      setNewTermData({
        display_name: '',
        academic_year: '',
        semester_type: 'REGULAR',
      });
      // Tải lại danh sách học kỳ
      const termsRes = await academicTermService.getAll(0, 100);
      const termsList = termsRes.data.items || [];
      setDbTerms(termsList);
      // Tự động chọn học kỳ mới
      if (res.data && res.data.id) {
        setSelectedTermId(res.data.id);
      }
    } catch (err: any) {
      console.error('Failed to create academic term:', err);
      const detail = err?.response?.data?.detail;
      showToast('error', typeof detail === 'string' ? detail : 'Không thể tạo học kỳ mới.');
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
            <GraduationCap size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Bảng điểm</h2>
            <p className="text-sm text-slate-500 dark:text-white/40">Theo dõi kết quả học tập theo từng học kỳ</p>
          </div>
        </motion.div>

        {/* Action Panel: Upload & Manual Input */}
        <motion.div variants={item} className="flex flex-wrap items-center gap-2">
          {/* File Inputs (Hidden) */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="glass-btn flex items-center gap-1.5 text-xs !py-2.5"
            title="Upload ảnh bảng điểm"
          >
            <Upload size={14} className={isUploading ? 'animate-bounce text-primary-400' : ''} />
            {isUploading ? 'Đang tải...' : uploadFileName ? `${uploadFileName} ✓` : 'Upload ảnh bảng điểm'}
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="glass-btn-primary flex items-center gap-1.5 text-xs !py-2.5"
            id="btn-manual-grades"
          >
            <Edit3 size={14} />
            Nhập tay
          </button>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={item} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.gpa.toFixed(2)}</p>
              <p className="text-xs text-slate-500 dark:text-white/40">GPA Tích lũy</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <BookOpen size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.credits}</p>
              <p className="text-xs text-slate-500 dark:text-white/40">Tín chỉ hoàn thành</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              <Award size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.rank}</p>
              <p className="text-xs text-slate-500 dark:text-white/40">Xếp loại</p>
            </div>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="glass p-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-300 dark:border-white/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : semestersData.length === 0 ? (
        <motion.div variants={item} className="glass p-12 text-center">
          <GraduationCap size={40} className="text-slate-300 dark:text-white/15 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-white/40 text-sm">Chưa có kết quả học tập nào. Hãy nhập điểm/môn học hoặc upload bảng điểm!</p>
        </motion.div>
      ) : (
        <>
          {/* GPA Bar Chart */}
          <motion.div variants={item} className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-primary-400" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Biểu đồ GPA theo học kỳ</h3>
            </div>
            <div className="flex items-end gap-4 h-40">
              {semestersData.map((sem, i) => {
                const heightPercent = (sem.gpa / 4.0) * 100;
                return (
                  <div key={sem.name} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{sem.gpa.toFixed(2)}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ delay: 0.5 + i * 0.2, duration: 0.8, ease: 'easeOut' }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary-500/40 to-primary-400/60 border border-primary-400/20 relative"
                    >
                      <div className="absolute inset-0 rounded-t-lg bg-primary-400/10 backdrop-blur-sm" />
                    </motion.div>
                    <span className="text-[10px] text-slate-500 dark:text-white/30 text-center truncate w-full">{sem.name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Semester Details */}
          {semestersData.map((semester, semIndex) => (
            <motion.div key={semester.name} variants={item} className="glass p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-white">{semester.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 dark:text-white/40">GPA: <span className="text-emerald-500 font-bold">{semester.gpa.toFixed(2)}</span></span>
                  <span className="text-sm text-slate-500 dark:text-white/40">Tín chỉ: <span className="text-slate-700 dark:text-white/70 font-medium">{semester.credits}</span></span>
                </div>
              </div>

              {/* Course Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-slate-400 dark:text-white/30 border-b border-slate-200 dark:border-white/5">
                      <th className="text-left py-3 px-3 font-medium">Mã HP</th>
                      <th className="text-left py-3 px-3 font-medium">Tên môn học</th>
                      <th className="text-center py-3 px-3 font-medium">Tín chỉ</th>
                      <th className="text-center py-3 px-3 font-medium">Điểm số</th>
                      <th className="text-center py-3 px-3 font-medium">Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semester.courses.map((course: any, i: number) => (
                      <motion.tr
                        key={course.code}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + semIndex * 0.2 + i * 0.05 }}
                        className="border-b border-slate-100 dark:border-white/[0.03] hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3 px-3 text-sm text-primary-600 dark:text-primary-300/70 font-mono">{course.code}</td>
                        <td className="py-3 px-3 text-sm text-slate-700 dark:text-white/70">{course.name}</td>
                        <td className="py-3 px-3 text-sm text-slate-500 dark:text-white/50 text-center">{course.credits}</td>
                        <td className="py-3 px-3 text-sm text-slate-700 dark:text-white/70 text-center font-medium">{course.score != null ? course.score.toFixed(1) : '-'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${gradeColors[course.grade] || 'text-slate-500 dark:text-white/50'}`}>
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
        </>
      )}

      {/* Manual Grid Input Modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-strong w-full max-w-4xl p-6 rounded-2xl shadow-2xl z-10 border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Edit3 className="text-primary-500" size={18} />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nhập điểm thủ công</h3>
                </div>
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-white/40"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Term Selection */}
              <div className="py-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-white/70">Chọn Học Kỳ:</label>
                  <select
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(e.target.value)}
                    className="glass-input !py-1.5 !px-3 !w-auto text-sm"
                  >
                    {dbTerms.map((term) => (
                      <option key={term.id} value={term.id} className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white">
                        {term.display_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsNewTermOpen(!isNewTermOpen)}
                    className="glass-btn flex items-center gap-1.5 text-xs !py-1.5 !px-3"
                  >
                    <Plus size={14} />
                    {isNewTermOpen ? 'Đóng form' : 'Thêm học kỳ'}
                  </button>
                </div>

                {isNewTermOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass p-4 rounded-xl space-y-3 border border-slate-200/40 dark:border-white/5"
                  >
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Tạo học kỳ mới</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 dark:text-white/40">Tên học kỳ</label>
                        <input
                          type="text"
                          value={newTermData.display_name}
                          onChange={(e) => setNewTermData({ ...newTermData, display_name: e.target.value })}
                          className="glass-input !py-1 !px-2.5 text-xs w-full"
                          placeholder="Ví dụ: Học kỳ 3"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 dark:text-white/40">Năm học</label>
                        <input
                          type="text"
                          value={newTermData.academic_year}
                          onChange={(e) => setNewTermData({ ...newTermData, academic_year: e.target.value })}
                          className="glass-input !py-1 !px-2.5 text-xs w-full"
                          placeholder="Ví dụ: 2024-2025"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 dark:text-white/40">Loại học kỳ</label>
                        <select
                          value={newTermData.semester_type}
                          onChange={(e) => setNewTermData({ ...newTermData, semester_type: e.target.value as any })}
                          className="glass-input !py-1 !px-2.5 text-xs w-full"
                        >
                          <option value="REGULAR" className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white">Chính khóa (REGULAR)</option>
                          <option value="SUMMER" className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white">Học kỳ hè (SUMMER)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsNewTermOpen(false)}
                        className="glass-btn !py-1 !px-3 text-xs"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNewTerm}
                        className="glass-btn-primary !py-1 !px-3 text-xs"
                      >
                        Lưu học kỳ
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Excel-like Table Grid */}
              <div className="flex-1 overflow-auto border border-slate-200/50 dark:border-white/5 rounded-xl">
                <table className="w-full text-left min-w-[700px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-white/[0.02] text-xs text-slate-500 dark:text-white/40 border-b border-slate-200/50 dark:border-white/5">
                      <th className="py-3 px-3 font-semibold w-[15%]">Mã học phần</th>
                      <th className="py-3 px-3 font-semibold w-[30%]">Tên môn học</th>
                      <th className="py-3 px-3 font-semibold text-center w-[10%]">Tín chỉ</th>
                      <th className="py-3 px-3 font-semibold text-center w-[12%]">Thường xuyên (30%)</th>
                      <th className="py-3 px-3 font-semibold text-center w-[12%]">Giữa kỳ (30%)</th>
                      <th className="py-3 px-3 font-semibold text-center w-[12%]">Cuối kỳ (40%)</th>
                      <th className="py-3 px-3 font-semibold text-center w-[9%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualRows.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 dark:border-white/[0.02] hover:bg-slate-100/20 dark:hover:bg-white/[0.01]"
                      >
                        {/* Course Code */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="Ví dụ: MATH101"
                            value={row.courseCode}
                            onChange={(e) => handleRowChange(index, 'courseCode', e.target.value)}
                            className="w-full bg-slate-200/40 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-800 dark:text-white font-mono placeholder:text-slate-400"
                          />
                        </td>
                        {/* Course Name */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="Ví dụ: Toán cao cấp 1"
                            value={row.courseName}
                            onChange={(e) => handleRowChange(index, 'courseName', e.target.value)}
                            className="w-full bg-slate-200/40 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-800 dark:text-white placeholder:text-slate-400"
                          />
                        </td>
                        {/* Credits */}
                        <td className="py-2 px-2">
                          <select
                            value={row.credits}
                            onChange={(e) => handleRowChange(index, 'credits', parseInt(e.target.value))}
                            className="w-full bg-slate-200/40 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-800 dark:text-white text-center"
                          >
                            {[1, 2, 3, 4, 5, 6].map(c => (
                              <option key={c} value={c} className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white">{c}</option>
                            ))}
                          </select>
                        </td>
                        {/* Score Process */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="0-10"
                            value={row.scoreProcess}
                            onChange={(e) => handleRowChange(index, 'scoreProcess', e.target.value)}
                            className="w-full bg-slate-200/40 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-800 dark:text-white text-center placeholder:text-slate-400"
                          />
                        </td>
                        {/* Score Midterm */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="0-10"
                            value={row.scoreMidterm}
                            onChange={(e) => handleRowChange(index, 'scoreMidterm', e.target.value)}
                            className="w-full bg-slate-200/40 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-800 dark:text-white text-center placeholder:text-slate-400"
                          />
                        </td>
                        {/* Score Final */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="0-10"
                            value={row.scoreFinal}
                            onChange={(e) => handleRowChange(index, 'scoreFinal', e.target.value)}
                            className="w-full bg-slate-200/40 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-800 dark:text-white text-center placeholder:text-slate-400"
                          />
                        </td>
                        {/* Actions */}
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleRemoveRow(index)}
                            disabled={manualRows.length === 1}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-white/5 mt-4">
                <button
                  onClick={handleAddRow}
                  className="glass-btn flex items-center gap-1.5 text-xs !py-2 w-full sm:w-auto"
                >
                  <Plus size={14} /> Thêm dòng mới
                </button>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setIsManualModalOpen(false)}
                    className="glass-btn text-xs !py-2"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSaveManualGrades}
                    disabled={isSaving}
                    className="glass-btn-primary flex items-center gap-1.5 text-xs !py-2"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={14} /> Lưu điểm
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm max-w-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Check size={16} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-500 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
