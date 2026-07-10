import React, { useEffect, useState, useRef } from 'react';
import { Clock, Sun, Moon, LogOut, Code, Home, Settings, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  userName: string;
  userId: string;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  onSubmit: () => void;
  isFinished: boolean;
  isHome?: boolean;
  onGoHome: () => void;
  onLogout: () => void;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
}

const translations = {
  vi: {
    backHome: "Trở về trang chủ",
    settings: "Cài đặt",
    logout: "Đăng xuất",
    theme: "Giao diện",
    themeLight: "Nền sáng",
    themeDark: "Nền tối",
    language: "Ngôn ngữ",
    langVi: "Tiếng Việt",
    langEn: "English",
    close: "Đóng",
    userAccount: "Tài khoản thí sinh",
    timeLeftLabel: "Thời gian còn lại",
  },
  en: {
    backHome: "Return to Home",
    settings: "Settings",
    logout: "Log out",
    theme: "Theme",
    themeLight: "Light mode",
    themeDark: "Dark mode",
    language: "Language",
    langVi: "Vietnamese",
    langEn: "English",
    close: "Close",
    userAccount: "Candidate Account",
    timeLeftLabel: "Time Remaining",
  }
};

export default function Header({
  timeLeft,
  setTimeLeft,
  userName,
  isDark,
  setIsDark,
  onSubmit,
  isFinished,
  isHome = false,
  onGoHome,
  onLogout,
  language,
  setLanguage
}: HeaderProps) {
  const t = translations[language];
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  };

  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (prev === 1) {
            onSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, onSubmit, setTimeLeft]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header-wrapper" id="main-app-header">
      {/* Left side: Logo & Back to Home Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="logo-section" onClick={onGoHome} title="Về trang chủ">
          <div className="logo-badge">
            <Code size={16} className="pulse-animation" />
          </div>
          <span className="logo-text">
            <span className="gradient-text font-black">NHCOJ</span>
          </span>
        </div>

        {/* Home Button */}
        <button onClick={onGoHome} className="csoj-btn csoj-btn-outline" style={{ padding: '0.375rem 0.75rem' }}>
          <Home size={13} style={{ color: '#6366f1' }} />
          <span className="hidden-xs">{t.backHome}</span>
        </button>
      </div>

      {/* Middle: Timer display */}
      {!isHome && (
        <div className="header-timer-box">
          <div className="header-timer-pill">
            <Clock size={13} className="spin-slow" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <span className="header-timer-label">
            {t.timeLeftLabel}
          </span>
        </div>
      )}
      {isHome && <div style={{ flex: 1 }} />}

      {/* Right side: User Profile & Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="user-section" ref={dropdownRef}>
          <button onClick={() => setShowDropdown(!showDropdown)} className="user-profile-trigger">
            <div className="user-avatar">
              {userName ? userName[0].toUpperCase() : 'U'}
            </div>
            <span className="user-username hidden-xs">
              {userName}
            </span>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="dropdown-menu liquid-glass"
              >
                <div className="dropdown-header">
                  <p className="dropdown-header-title">{t.userAccount}</p>
                  <p className="dropdown-header-email">{userName}@nhcoj.org</p>
                </div>
                <div style={{ padding: '0.25rem' }}>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowSettingsModal(true);
                    }}
                    className="dropdown-item"
                  >
                    <Settings size={13} />
                    <span>{t.settings}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="dropdown-item dropdown-item-danger"
                  >
                    <LogOut size={13} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="modal-overlay">
            <div
              className="absolute inset-0"
              style={{ position: 'absolute', inset: 0, background: 'transparent' }}
              onClick={() => setShowSettingsModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="modal-card liquid-glass"
              style={{ zIndex: 110 }}
            >
              <div className="modal-header">
                <Settings size={16} className="spin-slow" style={{ color: '#10b981' }} />
                <h3 className="modal-title">{t.settings}</h3>
              </div>

              <div className="modal-body">
                {/* Theme Selection */}
                <div className="modal-setting-row">
                  <label className="modal-setting-label">
                    {isDark ? <Moon size={12} style={{ color: '#10b981' }} /> : <Sun size={12} style={{ color: '#eab308' }} />}
                    <span>{t.theme}</span>
                  </label>
                  <div className="selection-toggle-grid">
                    <button
                      onClick={() => setIsDark(false)}
                      className={`toggle-btn ${!isDark ? 'active-light' : ''}`}
                    >
                      {t.themeLight}
                    </button>
                    <button
                      onClick={() => setIsDark(true)}
                      className={`toggle-btn ${isDark ? 'active-dark' : ''}`}
                    >
                      {t.themeDark}
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="modal-setting-row">
                  <label className="modal-setting-label">
                    <Globe size={12} style={{ color: '#6366f1' }} />
                    <span>{t.language}</span>
                  </label>
                  <div className="selection-toggle-grid">
                    <button
                      onClick={() => setLanguage('vi')}
                      className={`toggle-btn ${language === 'vi' ? (isDark ? 'active-dark' : 'active-light') : ''}`}
                    >
                      {t.langVi}
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`toggle-btn ${language === 'en' ? (isDark ? 'active-dark' : 'active-light') : ''}`}
                    >
                      {t.langEn}
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="csoj-btn csoj-btn-primary"
                  style={{ padding: '0.375rem 1rem' }}
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
