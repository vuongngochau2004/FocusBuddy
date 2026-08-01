// src/App.tsx
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import ThemeToggle, { Theme } from './components/ThemeToggle';
import EducationLevelModal from './components/EducationLevelModal';
import type { EducationLevel } from './types';

type Page = 'dashboard' | 'chat' | 'psychology';

const Sidebar: React.FC<{
  page: Page;
  setPage: (p: Page) => void;
  educationLevel: EducationLevel;
  onOpenLevelModal: () => void;
}> = ({ page, setPage, educationLevel, onOpenLevelModal }) => {
  const navItems = [
    { id: 'dashboard' as Page, icon: '📊', label: 'Dashboard' },
    { id: 'chat'      as Page, icon: '🤖', label: 'AI Chatbot' },
    { id: 'psychology' as Page, icon: '🧠', label: 'Tâm lý học' },
  ];

  const levelBadge = educationLevel === 'SINH_VIEN' ? 'Sinh viên' : educationLevel === 'THPT' ? 'THPT' : 'THCS';

  return (
    <nav className="sidebar">
      <div className="sidebar-section">Menu chính</div>
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${page === item.id ? 'active' : ''}`}
          onClick={() => setPage(item.id)}
          id={`sidebar-${item.id}`}
          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {item.icon} {item.label}
        </button>
      ))}
      <div className="sidebar-section" style={{ marginTop: 'auto' }}>Tài khoản</div>
      <div
        className="sidebar-item"
        onClick={onOpenLevelModal}
        title="Cập nhật trình độ học vấn (GPA hoặc Điểm trung bình)"
      >
        🎓 Trình độ ({levelBadge})
      </div>
      <div className="sidebar-item" onClick={onOpenLevelModal}>
        ⚙️ Cài đặt
      </div>
      <div className="sidebar-item" onClick={() => { localStorage.removeItem('access_token'); window.location.reload(); }}>
        🚪 Đăng xuất
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [educationLevel, setEducationLevel] = useState<EducationLevel>(() => {
    const saved = localStorage.getItem('education_level');
    if (saved === 'SINH_VIEN' || saved === 'THPT' || saved === 'THCS') return saved as EducationLevel;
    return 'SINH_VIEN';
  });

  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSaveEducationLevel = (level: EducationLevel) => {
    setEducationLevel(level);
    localStorage.setItem('education_level', level);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="logo-icon">🎓</div>
          EduTrack AI
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)', marginRight: 'auto' }}>
          Multi-Agent Academic Assistant
        </span>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </header>

      {/* Sidebar */}
      <Sidebar
        page={page}
        setPage={setPage}
        educationLevel={educationLevel}
        onOpenLevelModal={() => setIsLevelModalOpen(true)}
      />

      {/* Main */}
      <main className={page === 'chat' ? '' : 'main-content'}>
        {page === 'dashboard' && (
          <Dashboard
            educationLevel={educationLevel}
            onOpenLevelModal={() => setIsLevelModalOpen(true)}
          />
        )}
        {page === 'chat' && <ChatBot />}
        {page === 'psychology' && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--clr-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🧠</div>
            <h2 style={{ marginBottom: 8 }}>Nhật ký Tâm lý</h2>
            <p>Tính năng ghi nhật ký tâm lý hàng ngày đang được phát triển.</p>
            <p style={{ marginTop: 8 }}>Tạm thời, hãy chia sẻ cảm xúc với <strong>AI Chatbot</strong> nhé!</p>
          </div>
        )}
      </main>

      {/* Education Level Modal */}
      <EducationLevelModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        currentLevel={educationLevel}
        onSaveLevel={handleSaveEducationLevel}
      />
    </div>
  );
};

export default App;

