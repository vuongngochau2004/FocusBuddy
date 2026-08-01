// src/components/EducationLevelModal.tsx
import React, { useState } from 'react';
import { EducationLevel } from '../types';

interface EducationLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: EducationLevel;
  onSaveLevel: (level: EducationLevel) => void;
}

export const EducationLevelModal: React.FC<EducationLevelModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  onSaveLevel,
}) => {
  const [selected, setSelected] = useState<EducationLevel>(currentLevel);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const levels: Array<{
    id: EducationLevel;
    title: string;
    sub: string;
    icon: string;
    metric: string;
    desc: string;
    tag: string;
    color: string;
  }> = [
    {
      id: 'SINH_VIEN',
      title: 'Sinh viên',
      sub: 'Đại học / Cao đẳng / Học viện',
      icon: '🎓',
      metric: 'GPA (Thang điểm 4.0)',
      desc: 'Hệ thống sẽ tính toán GPA tích lũy, phân loại Xuất sắc/Giỏi/Khá theo chuẩn tín chỉ.',
      tag: 'Tín chỉ & GPA 4.0',
      color: '#6366f1',
    },
    {
      id: 'THPT',
      title: 'Học sinh THPT',
      sub: 'Trung học Phổ thông (Lớp 10 - 12)',
      icon: '🏫',
      metric: 'Điểm Trung Bình (Thang 10.0)',
      desc: 'Hệ thống sẽ tính Điểm Trung Bình (ĐTB) môn học kỳ và cả năm theo thang điểm 10.',
      tag: 'Điểm Trung Bình 10.0',
      color: '#06b6d4',
    },
    {
      id: 'THCS',
      title: 'Học sinh THCS',
      sub: 'Trung học Cơ sở (Lớp 6 - 9)',
      icon: '🎒',
      metric: 'Điểm Trung Bình (Thang 10.0)',
      desc: 'Hệ thống sẽ tính Điểm Trung Bình (ĐTB) các môn theo chương trình học THCS.',
      tag: 'Điểm Trung Bình 10.0',
      color: '#10b981',
    },
  ];

  const handleSave = () => {
    onSaveLevel(selected);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '560px',
          boxShadow: 'var(--shadow-card), 0 20px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'fadeUp 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--clr-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--clr-surface2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--clr-primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              🎓
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--clr-text)' }}>
                Cập nhật Trình độ Học vấn
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                Chọn trình độ để tùy chỉnh công thức tính điểm (GPA / Điểm trung bình)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--clr-text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Options */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {levels.map((lvl) => {
            const isSelected = selected === lvl.id;
            return (
              <div
                key={lvl.id}
                onClick={() => setSelected(lvl.id)}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius)',
                  border: isSelected
                    ? `2px solid ${lvl.color}`
                    : '1px solid var(--clr-border)',
                  background: isSelected
                    ? `color-mix(in srgb, ${lvl.color} 10%, var(--clr-surface2))`
                    : 'var(--clr-surface2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontSize: '1.75rem',
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--clr-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {lvl.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--clr-text)' }}>
                      {lvl.title}{' '}
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--clr-text-muted)' }}>
                        ({lvl.sub})
                      </span>
                    </h4>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: lvl.color,
                          background: `color-mix(in srgb, ${lvl.color} 20%, transparent)`,
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        ✓ Đã chọn
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: lvl.color, marginBottom: 4 }}>
                    📊 {lvl.metric}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                    {lvl.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--clr-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--clr-surface2)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)' }}>
            Lưu trong cài đặt tài khoản của bạn
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Hủy
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              style={{
                minWidth: 120,
                background: savedSuccess ? 'var(--clr-success)' : undefined,
              }}
            >
              {savedSuccess ? '✓ Đã lưu!' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationLevelModal;
