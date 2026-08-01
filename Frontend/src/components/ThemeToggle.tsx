import React from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'dark' | 'light';

interface ThemeToggleProps {
  theme: Theme;
  toggleTheme: () => void;
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  toggleTheme,
  className = '',
  showText = false,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`theme-toggle-container ${className}`}>
      {showText && (
        <span className="theme-toggle-label">
          {isDark ? 'Giao diện Tối' : 'Giao diện Sáng'}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        className={`theme-toggle-switch ${isDark ? 'dark' : 'light'}`}
        title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
        aria-label="Toggle light/dark theme"
        id="theme-toggle-btn"
      >
        <span className="theme-toggle-track-icon left">
          <Sun size={12} />
        </span>
        <span className="theme-toggle-track-icon right">
          <Moon size={12} />
        </span>
        <span className="theme-toggle-thumb">
          {isDark ? <Moon size={13} className="moon-icon" /> : <Sun size={13} className="sun-icon" />}
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;
