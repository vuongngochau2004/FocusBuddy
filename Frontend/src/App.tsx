// src/App.tsx
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import ThemeToggle, { Theme } from './components/ThemeToggle';
import EducationLevelModal from './components/EducationLevelModal';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { EducationLevel } from './types';

type Page = 'dashboard' | 'chat' | 'psychology';
type AuthView = 'login' | 'register' | 'verify';

// ── Sidebar ──────────────────────────────────────────────
const Sidebar: React.FC<{
  page: Page;
  setPage: (p: Page) => void;
  educationLevel: EducationLevel;
  onOpenLevelModal: () => void;
  onLogout: () => void;
  userName: string;
}> = ({ page, setPage, educationLevel, onOpenLevelModal, onLogout, userName }) => {
  const navItems = [
    { id: 'dashboard' as Page, icon: '📊', label: 'Dashboard' },
    { id: 'chat'      as Page, icon: '🤖', label: 'AI Chatbot' },
    { id: 'psychology' as Page, icon: '🧠', label: 'Tâm lý học' },
  ];

  const levelBadge =
    educationLevel === 'SINH_VIEN' ? 'Sinh viên'
    : educationLevel === 'THPT' ? 'THPT' : 'THCS';

  return (
    <nav className="sidebar">
      {/* User info */}
      <div style={{
        padding: '12px 14px',
        marginBottom: '8px',
        background: 'var(--clr-surface2)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--clr-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-dim)' }}>{levelBadge}</div>
        </div>
      </div>

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
        title="Cập nhật trình độ học vấn"
      >
        🎓 Trình độ ({levelBadge})
      </div>
      <div className="sidebar-item" onClick={onOpenLevelModal}>
        ⚙️ Cài đặt
      </div>
      <div
        className="sidebar-item"
        id="sidebar-logout-btn"
        onClick={onLogout}
        style={{ color: 'var(--clr-danger)' }}
      >
        🚪 Đăng xuất
      </div>
    </nav>
  );
};

// ── Loading Screen ────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div className="auth-loading-screen">
    <div className="auth-loading-logo">🎓</div>
    <div className="auth-loading-text">Đang tải EduTrack AI...</div>
  </div>
);

// ── Main App Logic (inside AuthProvider) ─────────────────
const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [pendingEmail, setPendingEmail] = useState('');
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

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const handleLogout = async () => {
    await logout();
    setAuthView('login');
  };

  // ── Loading ───────────────────────────────────────────
  if (isLoading) return <LoadingScreen />;

  // ── Not Authenticated → Show Auth pages ──────────────
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onGoLogin={() => setAuthView('login')}
          onRegistered={(email) => {
            setPendingEmail(email);
            setAuthView('verify');
          }}
        />
      );
    }
    if (authView === 'verify') {
      return (
        <VerifyEmailPage
          email={pendingEmail}
          onVerified={() => setAuthView('login')}
          onGoLogin={() => setAuthView('login')}
        />
      );
    }
    return <LoginPage onGoRegister={() => setAuthView('register')} />;
  }

  // ── Authenticated → Show Main App ────────────────────
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
        onLogout={handleLogout}
        userName={user?.name ?? 'Người dùng'}
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

// ── Root App ──────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
