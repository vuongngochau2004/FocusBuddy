'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Sparkles, Bot, User, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { chatService } from '@/lib/services';
import { ChatSession, ChatMessage } from '@/types';

export default function ChatbotPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load sessions
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await chatService.getSessions();
      setSessions(res.data);
      if (res.data.length > 0) {
        selectSession(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    setActiveSession(sessionId);
    try {
      const res = await chatService.getMessages(sessionId);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await chatService.createSession('Cuộc hội thoại mới');
      setSessions([res.data, ...sessions]);
      setActiveSession(res.data.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    let sessionId = activeSession;

    // Auto-create session if none
    if (!sessionId) {
      try {
        const res = await chatService.createSession('Cuộc hội thoại mới');
        setSessions([res.data, ...sessions]);
        sessionId = res.data.id;
        setActiveSession(sessionId);
      } catch {
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender_type: 'USER',
      content: input,
      message_type: 'TEXT',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage(sessionId, {
        content: input,
        message_type: 'TEXT',
      });
      setMessages((prev) => [...prev.filter((m) => m.id !== userMessage.id), userMessage, res.data]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        session_id: sessionId,
        sender_type: 'BOT',
        content: 'Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.',
        message_type: 'TEXT',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)]">
      {/* Session List */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:flex flex-col w-72 glass p-4"
      >
        <button
          onClick={createNewSession}
          className="glass-btn-primary w-full flex items-center justify-center gap-2 mb-4"
          id="btn-new-chat"
        >
          <Plus size={16} />
          Cuộc hội thoại mới
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-white/30 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="text-white/15 mx-auto mb-2" />
              <p className="text-sm text-white/30">Chưa có cuộc hội thoại nào</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                  activeSession === session.id
                    ? 'bg-primary-500/15 border border-primary-500/20 text-white'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                }`}
              >
                <p className="font-medium truncate">{session.title || 'Cuộc trò chuyện'}</p>
                <p className="text-xs text-white/25 mt-1">
                  {new Date(session.started_at).toLocaleDateString('vi-VN')}
                </p>
              </button>
            ))
          )}
        </div>
      </motion.div>

      {/* Chat Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 glass flex flex-col"
      >
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">FocusBuddy AI</h3>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Đang hoạt động
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-4"
              >
                <Bot size={36} className="text-primary-400" />
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Xin chào! Mình là FocusBuddy 🎓
              </h3>
              <p className="text-sm text-white/40 max-w-md">
                Mình có thể giúp bạn lên kế hoạch học tập, giải đáp thắc mắc về bài vở,
                hoặc đưa ra lời khuyên về phương pháp học tập hiệu quả.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  'Lập kế hoạch ôn thi',
                  'Phương pháp Pomodoro',
                  'Cải thiện GPA',
                  'Quản lý stress',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="glass-btn text-xs !px-3 !py-2"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${msg.sender_type === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender_type !== 'USER' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={14} className="text-primary-300" />
                    </div>
                  )}
                  <div
                    className={
                      msg.sender_type === 'USER' ? 'chat-bubble-user' : 'chat-bubble-ai'
                    }
                  >
                    <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <p className="text-[10px] text-white/20 mt-2">
                      {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {msg.sender_type === 'USER' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={14} className="text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-primary-300" />
              </div>
              <div className="chat-bubble-ai flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Nhập tin nhắn..."
              className="glass-input flex-1"
              disabled={loading}
              id="chat-input"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="glass-btn-primary !p-3 !rounded-xl disabled:opacity-30"
              id="btn-send"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
