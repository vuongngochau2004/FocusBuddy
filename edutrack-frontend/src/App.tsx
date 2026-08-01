// src/App.tsx
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';

type Page = 'dashboard' | 'chat' | 'psychology';

const Sidebar: React.FC<{ page: Page; setPage: (p: Page) => void }> = ({ page, setPage }) => {
  const navItems = [
    { id: 'dashboard' as Page, icon: '📊', label: 'Dashboard' },
    { id: 'chat'      as Page, icon: '🤖', label: 'AI Chatbot' },
    { id: 'psychology' as Page, icon: '🧠', label: 'Tâm lý học' },
  ];
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
      <div className="sidebar-item">⚙️ Cài đặt</div>
      <div className="sidebar-item" onClick={() => { localStorage.removeItem('access_token'); window.location.reload(); }}>
        🚪 Đăng xuất
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="logo-icon">🎓</div>
          EduTrack AI
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)' }}>
          Multi-Agent Academic Assistant
        </span>
      </header>

      {/* Sidebar */}
      <Sidebar page={page} setPage={setPage} />

      {/* Main */}
      <main className={page === 'chat' ? '' : 'main-content'}>
        {page === 'dashboard' && <Dashboard />}
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
    </div>
  );
};

export default App;
