// src/components/ChatBot.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatApi } from '../api/client';
import type { ChatMessage, ChatSession } from '../types';

const AgentTag: React.FC<{ type?: string | null }> = ({ type }) => {
  if (!type || type === 'SUPERVISOR') return null;
  const map: Record<string, { label: string; cls: string }> = {
    ACADEMIC:   { label: '📚 Academic Agent',   cls: 'academic' },
    PSYCHOLOGY: { label: '🧠 Psychology Agent', cls: 'psychology' },
  };
  const info = map[type];
  if (!info) return null;
  return <div className={`agent-tag ${info.cls}`}>{info.label}</div>;
};

const ChatBot: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load sessions
  useEffect(() => {
    chatApi.getSessions().then((r) => setSessions(r.data)).catch(console.error);
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    try {
      const res = await chatApi.getHistory(sessionId);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatApi.send({ sessionId: currentSessionId, message: text });
      const data = res.data;

      if (!currentSessionId) {
        setCurrentSessionId(data.sessionId);
        // Refresh sessions list
        chatApi.getSessions().then((r) => setSessions(r.data)).catch(console.error);
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ASSISTANT',
        content: data.reply,
        agentType: data.agentType,
        intentScore: data.intentScore,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'ASSISTANT',
        content: '❌ Đã xảy ra lỗi, vui lòng thử lại.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: 'calc(100vh - 64px)' }}>
      {/* Session Sidebar */}
      <div style={{ borderRight: '1px solid var(--clr-border)', padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 8 }}
          onClick={() => { setCurrentSessionId(undefined); setMessages([]); }}
        >
          + Chat mới
        </button>
        <p style={{ fontSize: '0.7rem', color: 'var(--clr-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 4 }}>
          Lịch sử
        </p>
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => loadSession(s.id)}
            style={{
              background: s.id === currentSessionId ? 'var(--clr-primary-glow)' : 'transparent',
              border: `1px solid ${s.id === currentSessionId ? 'var(--clr-border-hi)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm)', padding: '8px 10px', cursor: 'pointer',
              textAlign: 'left', color: s.id === currentSessionId ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              fontSize: '0.8rem', transition: 'all 0.2s',
            }}
          >
            💬 {s.title ?? 'Phiên chat'} <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-dim)', display: 'block' }}>{s._count.messages} tin nhắn</span>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>EduTrack AI</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clr-success)', display: 'inline-block' }} />
              Multi-agent · Academic + Psychology
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" style={{ flex: 1 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', margin: 'auto', padding: 40 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎓</div>
              <p style={{ color: 'var(--clr-text)', fontWeight: 600, marginBottom: 8 }}>EduTrack AI sẵn sàng hỗ trợ!</p>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', maxWidth: 300 }}>
                Hỏi về <strong>kết quả học tập</strong> hoặc chia sẻ về <strong>cảm xúc, áp lực thi cử</strong>.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                {[
                  'Phân tích điểm của tôi',
                  'Tôi đang rất stress',
                  'Gợi ý cải thiện GPA',
                  'Làm sao để ngủ ngon?',
                ].map((q) => (
                  <button key={q} onClick={() => setInput(q)} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'USER' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'ASSISTANT' && <AgentTag type={msg.agentType} />}
              <div className={`chat-bubble ${msg.role === 'USER' ? 'user' : 'assistant'}`}>
                <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </pre>
              </div>
              {msg.intentScore && (
                <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-dim)', marginTop: 4, paddingLeft: 4 }}>
                  🧠 Academic: {((msg.intentScore.academic ?? 0) * 100).toFixed(0)}% | Psychology: {((msg.intentScore.psychology ?? 0) * 100).toFixed(0)}%
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div className="chat-bubble assistant" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: 'var(--clr-primary)',
                    animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`,
                    display: 'inline-block',
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về học tập hoặc chia sẻ cảm xúc của bạn... (Enter để gửi)"
            rows={2}
            id="chat-input-field"
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            style={{ alignSelf: 'flex-end', height: 44 }}
            id="chat-send-btn"
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
