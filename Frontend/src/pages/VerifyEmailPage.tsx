// src/pages/VerifyEmailPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface VerifyEmailPageProps {
  email: string;
  onVerified: () => void;
  onGoLogin: () => void;
}

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ email, onVerified, onGoLogin }) => {
  const { verifyEmail, resendOtp } = useAuth();
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Đếm ngược cooldown gửi lại OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1); // chỉ nhận số
    const newCodes = [...codes];
    newCodes[index] = char;
    setCodes(newCodes);

    // Auto-focus next
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCodes(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codes.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await verifyEmail(email, code);
      setSuccess('✅ Xác nhận thành công! Đang chuyển đến đăng nhập...');
      setTimeout(() => onVerified(), 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Mã xác nhận không hợp lệ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendOtp(email);
      setSuccess('📧 Mã mới đã được gửi đến email của bạn!');
      setError('');
      setResendCooldown(60);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError?.response?.data?.message || 'Không thể gửi lại mã. Thử lại sau.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Icon */}
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ fontSize: '3rem' }}>📧</div>
          <h1 className="auth-logo-title">Xác nhận Email</h1>
          <p className="auth-logo-sub">EduTrack AI</p>
        </div>

        <h2 className="auth-heading">Nhập mã xác nhận</h2>
        <p className="auth-subheading">
          Chúng tôi đã gửi mã OTP gồm <strong>6 chữ số</strong> đến:
          <br />
          <strong className="auth-email-highlight">{email}</strong>
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* OTP Inputs */}
          <div className="auth-otp-wrap" onPaste={handlePaste}>
            {codes.map((c, i) => (
              <input
                key={i}
                id={`otp-input-${i}`}
                ref={(el) => { inputRefs.current[i] = el; }}
                className={`auth-otp-input ${c ? 'auth-otp-input--filled' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={c}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Messages */}
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {/* Submit */}
          <button
            id="verify-submit-btn"
            type="submit"
            className="auth-btn-primary"
            disabled={isLoading || codes.join('').length < 6}
          >
            {isLoading ? <span className="auth-spinner" /> : '✅ Xác nhận'}
          </button>
        </form>

        {/* Resend */}
        <div className="auth-resend">
          <span>Không nhận được mã? </span>
          <button
            id="resend-otp-btn"
            className={`auth-link-btn ${resendCooldown > 0 ? 'auth-link-btn--disabled' : ''}`}
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã'}
          </button>
        </div>

        <p className="auth-switch">
          <button className="auth-link-btn" onClick={onGoLogin} id="back-to-login-btn">
            ← Quay lại đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
