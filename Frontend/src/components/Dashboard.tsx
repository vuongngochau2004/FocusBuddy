// src/components/Dashboard.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { useDropzone } from 'react-dropzone';
import { gradeApi, uploadApi } from '../api/client';
import type { Grade, GradeStats, UploadedFile, UploadStatus as UploadStatusType, EducationLevel } from '../types';

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8125rem',
    }}>
      <p style={{ color: 'var(--clr-text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Score Gauge ───────────────────────────────────────────────────────────────
const ScoreGauge: React.FC<{ score: number; maxScore: number; label: string }> = ({ score, maxScore, label }) => {
  const pct = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  const ratio = score / maxScore;
  const color = ratio >= 0.85 ? '#10b981' : ratio >= 0.65 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <svg viewBox="0 0 200 120" width="100%" style={{ maxWidth: 220, margin: '0 auto', display: 'block' }}>
        <defs>
          <linearGradient id="scoreg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--clr-border)" strokeWidth="14" strokeLinecap="round" />
        {/* Value arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#scoreg)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${pct * 2.513} 251.3`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="100" y="88" textAnchor="middle" fontSize="28" fontWeight="700" fill={color}>{score.toFixed(2)}</text>
        <text x="100" y="108" textAnchor="middle" fontSize="11" fill="var(--clr-text-muted)">{label}</text>
        <text x="20" y="118" fontSize="9" fill="var(--clr-text-dim)">0.0</text>
        <text x="180" y="118" textAnchor="end" fontSize="9" fill="var(--clr-text-dim)">{maxScore.toFixed(1)}</text>
      </svg>
    </div>
  );
};

// ── Upload Zone Component ─────────────────────────────────────────────────────
const UploadZone: React.FC<{
  onUploadComplete: () => void;
}> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUpload, setCurrentUpload] = useState<UploadStatusType | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    const file = accepted[0];
    setUploading(true);
    setProgress(0);

    try {
      const res = await uploadApi.uploadGradeSheet(file, setProgress);
      const { uploadId } = res.data;

      // Poll for completion
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await uploadApi.getStatus(uploadId);
          const status: UploadStatusType = statusRes.data;
          setCurrentUpload(status);

          if (status.status === 'DONE' || status.status === 'ERROR') {
            clearInterval(pollRef.current!);
            setUploading(false);
            if (status.status === 'DONE') onUploadComplete();
          }
        } catch {
          clearInterval(pollRef.current!);
          setUploading(false);
        }
      }, 2000);
    } catch (e) {
      console.error(e);
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div>
      <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'dragging' : ''}`}>
        <input {...getInputProps()} id="grade-file-input" />
        {uploading ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚙️</div>
            <p className="upload-title">Đang xử lý bảng điểm...</p>
            <p className="upload-hint" style={{ marginBottom: 16 }}>
              {currentUpload?.status === 'PROCESSING'
                ? 'AI đang đọc và trích xuất dữ liệu điểm...'
                : `Đang tải lên: ${progress}%`}
            </p>
            <div className="progress-bar" style={{ maxWidth: 300, margin: '0 auto' }}>
              <div className="progress-fill" style={{
                width: currentUpload?.status === 'PROCESSING' ? '85%' : `${progress}%`
              }} />
            </div>
            {currentUpload?.status === 'DONE' && (
              <p style={{ color: 'var(--clr-success)', marginTop: 12, fontWeight: 600 }}>
                ✅ Trích xuất thành công {currentUpload.grades?.length ?? 0} môn học!
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="upload-icon">📄</div>
            <p className="upload-title">
              {isDragActive ? 'Thả file vào đây!' : 'Kéo thả hoặc click để upload bảng điểm'}
            </p>
            <p className="upload-hint">Hỗ trợ PDF, Excel (.xlsx), Ảnh (JPG, PNG) – Tối đa 10MB</p>
            <p className="upload-hint" style={{ marginTop: 8, color: 'var(--clr-primary)', fontWeight: 500 }}>
              🤖 AI sẽ tự động đọc và lưu điểm vào hệ thống
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Grade Distribution Bar ────────────────────────────────────────────────────
const gradeColors: Record<string, string> = {
  'A+': '#10b981', A: '#34d399', 'B+': '#6366f1',
  B: '#8b5cf6', 'C+': '#f59e0b', C: '#fb923c',
  'D+': '#ef4444', D: '#dc2626', F: '#991b1b', 'N/A': '#475569',
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
interface DashboardProps {
  educationLevel?: EducationLevel;
  onOpenLevelModal?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  educationLevel = 'SINH_VIEN',
  onOpenLevelModal,
}) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  const isUniversity = educationLevel === 'SINH_VIEN';
  const isTHPT = educationLevel === 'THPT';
  const isTHCS = educationLevel === 'THCS';

  const levelLabel = isUniversity ? 'Sinh viên' : isTHPT ? 'Học sinh THPT' : 'Học sinh THCS';
  const levelIcon = isUniversity ? '🎓' : isTHPT ? '🏫' : '🎒';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gradesRes, statsRes, filesRes] = await Promise.all([
        gradeApi.getAll(selectedSemester || undefined),
        gradeApi.getStats(),
        uploadApi.getMyFiles(),
      ]);
      setGrades(gradesRes.data);
      setStats(statsRes.data);
      setFiles(filesRes.data);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedSemester]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Calculations for level-specific scores
  const avgScore10 = grades.length > 0
    ? (grades.reduce((sum, g) => sum + (g.totalScore ?? (g.gpa ? g.gpa * 2.5 : 0)), 0) / grades.length)
    : (stats?.cumulativeGpa ? (stats.cumulativeGpa / 4) * 10 : 8.5);

  const displayScore = isUniversity ? (stats?.cumulativeGpa ?? 0) : avgScore10;
  const maxScore = isUniversity ? 4.0 : 10.0;
  const scoreLabel = isUniversity ? 'GPA Tích lũy / 4.0' : 'Điểm Trung Bình / 10.0';

  // Derived chart data
  const subjectChartData = grades
    .map((g) => ({
      name: g.courseCode,
      fullName: g.courseName ?? g.courseCode,
      scoreValue: isUniversity ? (g.gpa ?? 0) : (g.totalScore ?? (g.gpa ? g.gpa * 2.5 : 0)),
      totalScore: g.totalScore ?? 0,
      gpa: g.gpa ?? 0,
    }))
    .slice(0, 10);

  const radarData = grades.slice(0, 8).map((g) => ({
    subject: g.courseCode,
    score: g.totalScore ?? 0,
    fullMark: 10,
  }));

  const pieData = stats
    ? Object.entries(stats.gradeDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const semesters = [...new Set(grades.map((g) => g.semester))];

  // Semester score trend
  const scoreTrend = [
    { semester: 'HK1/2022', score: isUniversity ? 2.8 : 7.0 },
    { semester: 'HK2/2022', score: isUniversity ? 3.1 : 7.8 },
    { semester: 'HK1/2023', score: isUniversity ? 3.0 : 7.5 },
    { semester: 'HK2/2023', score: isUniversity ? 3.4 : 8.5 },
    { semester: 'HK1/2024', score: isUniversity ? 3.2 : 8.0 },
    { semester: 'HK2/2024', score: displayScore },
  ];

  let changeText = '→ Đang tiến bộ';
  if (isUniversity) {
    const gpa = stats?.cumulativeGpa ?? 0;
    if (gpa >= 3.6) changeText = '↑ Loại Xuất sắc';
    else if (gpa >= 3.2) changeText = '↑ Loại Giỏi';
    else if (gpa >= 2.5) changeText = '→ Loại Khá';
    else if (gpa >= 2.0) changeText = '→ Trung bình';
    else if (gpa > 0) changeText = '↓ Loại Yếu';
  } else {
    if (avgScore10 >= 9.0) changeText = '↑ Học lực Xuất sắc';
    else if (avgScore10 >= 8.0) changeText = '↑ Học lực Giỏi';
    else if (avgScore10 >= 6.5) changeText = '→ Học lực Khá';
    else if (avgScore10 >= 5.0) changeText = '→ Học lực Đạt';
    else if (avgScore10 > 0) changeText = '↓ Chưa Đạt';
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--clr-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
        <p style={{ color: 'var(--clr-text-muted)' }}>Đang tải dữ liệu học tập...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* ── Page Header ───────────────────────────────────── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            📊 Dashboard Học Tập
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem' }}>
              Tổng quan kết quả học tập và phân tích AI
            </p>
            <span
              className="badge badge-purple"
              style={{ cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={onOpenLevelModal}
              title="Click để đổi trình độ học vấn"
            >
              {levelIcon} Trình độ: <strong>{levelLabel}</strong> ({isUniversity ? 'GPA 4.0' : 'ĐTB 10.0'}) ⚙️
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            style={{
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--clr-text)',
              fontSize: '0.875rem', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">Tất cả học kỳ</option>
            {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={fetchData}>🔄 Làm mới</button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────── */}
      <div className="stats-grid">
        {[
          {
            icon: levelIcon,
            label: isUniversity ? 'GPA Tích lũy' : 'Điểm Trung Bình',
            value: isUniversity
              ? (stats?.cumulativeGpa?.toFixed(2) ?? '—')
              : avgScore10.toFixed(2),
            clr: '#6366f1',
            change: changeText,
            changeType: (isUniversity ? (stats?.cumulativeGpa ?? 0) >= 3.2 : avgScore10 >= 8.0) ? 'up' : '',
          },
          {
            icon: '📚',
            label: isUniversity ? 'Tín chỉ Tích lũy' : 'Môn Học Đã Đạt',
            value: isUniversity ? (stats?.earnedCredits ?? 0) : (stats?.passedCourses ?? 0),
            clr: '#06b6d4',
            change: isUniversity ? `/ ${stats?.totalCredits ?? 0} tín chỉ` : `/ ${stats?.totalCourses ?? 0} môn`,
          },
          {
            icon: '✅', label: 'Môn Đã Hoàn Thành',
            value: stats?.passedCourses ?? 0,
            clr: '#10b981',
            change: `${stats?.totalCourses ?? 0} tổng số môn`,
          },
          {
            icon: '⚠️', label: 'Môn Cần Cải thiện',
            value: stats?.failedCourses ?? 0,
            clr: '#ef4444',
            change: stats?.failedCourses && stats.failedCourses > 0 ? '↓ Cần chú ý' : '✓ Ổn định',
            changeType: stats?.failedCourses && stats.failedCourses > 0 ? 'down' : 'up',
          },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-clr': s.clr } as React.CSSProperties}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              {s.change && (
                <div className={`stat-change ${s.changeType || ''}`}>{s.change}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Charts Grid ───────────────────────────────── */}
      <div className="dashboard-grid">

        {/* Score Gauge + Trend ───────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {isUniversity ? 'GPA Tổng Quan' : 'Điểm Trung Bình Tổng Quan'}
              </div>
              <div className="card-subtitle">
                {isUniversity ? 'Thang điểm 4.0' : 'Thang điểm 10.0'}
              </div>
            </div>
          </div>
          <ScoreGauge score={displayScore} maxScore={maxScore} label={scoreLabel} />
          <div style={{ marginTop: 12 }}>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={scoreTrend}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
                <XAxis dataKey="semester" tick={{ fontSize: 9, fill: 'var(--clr-text-muted)' }} />
                <YAxis domain={isUniversity ? [2, 4] : [5, 10]} tick={{ fontSize: 9, fill: 'var(--clr-text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" name={isUniversity ? 'GPA' : 'ĐTB'} stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: '#6366f1', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution Pie ───────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Phân Bố Điểm Chữ</div>
              <div className="card-subtitle">Tỷ lệ các loại điểm</div>
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={95}
                  paddingAngle={3} dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={gradeColors[entry.name] ?? '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(value) => <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-dim)' }}>
              Chưa có dữ liệu điểm
            </div>
          )}
        </div>

        {/* Subject Score Bar Chart ───────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {isUniversity ? 'GPA Theo Môn Học' : 'Điểm Trung Bình Theo Môn Học'}
              </div>
              <div className="card-subtitle">
                {isUniversity ? 'So sánh điểm các môn (Thang 4)' : 'So sánh điểm các môn (Thang 10)'}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={subjectChartData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--clr-text-muted)' }} />
              <YAxis domain={isUniversity ? [0, 4] : [0, 10]} tick={{ fontSize: 11, fill: 'var(--clr-text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="scoreValue" name={isUniversity ? 'GPA' : 'ĐTB'} radius={[4, 4, 0, 0]}>
                {subjectChartData.map((entry) => {
                  const val = entry.scoreValue;
                  const high = isUniversity ? 3.5 : 8.0;
                  const med = isUniversity ? 2.5 : 6.5;
                  const low = isUniversity ? 1.0 : 5.0;
                  const color = val >= high ? '#10b981' : val >= med ? '#6366f1' : val >= low ? '#f59e0b' : '#ef4444';
                  return <Cell key={entry.name} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart ─────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Biểu Đồ Radar Năng Lực</div>
              <div className="card-subtitle">Điểm các môn trên thang 10</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--clr-border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--clr-text-muted)' }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 8, fill: 'var(--clr-text-dim)' }} />
              <Radar name="Điểm" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} dot={{ fill: '#6366f1', r: 3 }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Upload Zone ─────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📤 Upload Bảng Điểm</div>
              <div className="card-subtitle">AI tự động trích xuất điểm từ PDF/Excel/Ảnh</div>
            </div>
          </div>
          <UploadZone onUploadComplete={fetchData} />

          {/* Upload history */}
          {files.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Lịch sử Upload
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {files.slice(0, 4).map((f) => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--clr-surface2)',
                    borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem',
                  }}>
                    <span style={{ color: 'var(--clr-text)' }}>📎 {f.originalName}</span>
                    <span className={`badge ${f.status === 'DONE' ? 'badge-green' : f.status === 'ERROR' ? 'badge-red' : f.status === 'PROCESSING' ? 'badge-blue' : 'badge-yellow'}`}>
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grade Table ──────────────────────────────────────── */}
        <div className="card col-full">
          <div className="card-header">
            <div>
              <div className="card-title">📋 Bảng Điểm Chi Tiết</div>
              <div className="card-subtitle">{grades.length} môn học</div>
            </div>
          </div>
          <div className="table-wrapper">
            {grades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-dim)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 12 }}>🎓</p>
                <p>Chưa có dữ liệu điểm. Hãy upload bảng điểm hoặc nhập thủ công.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Môn học</th>
                    <th>Mã môn</th>
                    <th>TC</th>
                    <th>Chuyên cần</th>
                    <th>Giữa kỳ</th>
                    <th>Cuối kỳ</th>
                    <th>Tổng (10)</th>
                    <th>Điểm chữ</th>
                    <th>{isUniversity ? 'GPA (4)' : 'ĐTB (10)'}</th>
                    <th>Trạng thái</th>
                    <th>Học kỳ</th>
                    <th>Nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => {
                    const scoreVal = isUniversity
                      ? (g.gpa?.toFixed(2) ?? '—')
                      : ((g.totalScore ?? (g.gpa ? g.gpa * 2.5 : null))?.toFixed(2) ?? '—');

                    return (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.courseName || '—'}
                        </td>
                        <td style={{ color: 'var(--clr-text-muted)' }}>{g.courseCode}</td>
                        <td>{g.credits ?? '—'}</td>
                        <td>{g.attendanceScore?.toFixed(1) ?? '—'}</td>
                        <td>{g.midtermScore?.toFixed(1) ?? '—'}</td>
                        <td>{g.finalScore?.toFixed(1) ?? '—'}</td>
                        <td style={{ fontWeight: 600 }}>{g.totalScore?.toFixed(1) ?? '—'}</td>
                        <td>
                          {g.letterGrade ? (
                            <span className="badge" style={{ background: `${gradeColors[g.letterGrade] ?? '#6366f1'}22`, color: gradeColors[g.letterGrade] ?? '#6366f1' }}>
                              {g.letterGrade}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ fontWeight: 600, color: g.gpa && g.gpa >= 3.0 ? 'var(--clr-success)' : g.gpa && g.gpa < 2.0 ? 'var(--clr-danger)' : 'var(--clr-text)' }}>
                          {scoreVal}
                        </td>
                        <td>
                          <span className={`badge ${g.status === 'PASSED' ? 'badge-green' : g.status === 'FAILED' ? 'badge-red' : g.status === 'RETAKE' ? 'badge-yellow' : 'badge-blue'}`}>
                            {g.status === 'PASSED' ? '✓ Đạt' : g.status === 'FAILED' ? '✗ Trượt' : g.status === 'RETAKE' ? '↺ Học lại' : '⏳ Chờ'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--clr-text-muted)' }}>{g.semester}/{g.year}</td>
                        <td style={{ color: 'var(--clr-text-dim)', fontSize: '0.75rem' }}>
                          {g.sourceFile ? `📄 ${g.sourceFile.originalName.substring(0, 15)}...` : '✏️ Thủ công'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
