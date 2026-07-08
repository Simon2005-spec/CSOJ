import React, { useState, useRef, useEffect } from 'react';
import { Code, Settings, LogOut, Clock, Eye, RotateCcw, ArrowRight, Sun, Moon, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeSectionProps {
  codingAnswers: {
    [problemId: string]: { code: string; language: string; passed: boolean };
  };
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  onSelectTab: (tab: 'home' | 'coding') => void;
  username: string;
  onLogout: () => void;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
  onResetCoding: () => void;
}

const translations = {
  vi: {
    welcome: "Chào mừng bạn đến với",
    subtitle: "Hệ thống đánh giá kỹ năng thuật toán, cấu trúc dữ liệu và tối ưu mã nguồn toàn diện.",
    cta: "Nhấn vào nút bên dưới để bắt đầu hoặc tiếp tục phần thi thực hành lập trình.",
    codingTitle: "Lập trình Thực hành (Tự luận)",
    codingDesc: "Giải quyết 3 bài toán thuật toán từ dễ đến trung bình với trình biên dịch tự động, hỗ trợ JavaScript, Python, C++, Java.",
    codingProgress: "Tiến trình",
    codingActionStart: "Bắt đầu lập trình",
    codingActionContinue: "Tiếp tục lập trình",
    settings: "Cài đặt",
    logout: "Đăng xuất",
    theme: "Giao diện",
    themeLight: "Nền sáng",
    themeDark: "Nền tối",
    language: "Ngôn ngữ",
    langVi: "Tiếng Việt",
    langEn: "English",
    close: "Đóng",
    userAccount: "Tài khoản học viên",
    duration: "90 phút",
    passed: "bài ĐẠT",
    codingScoreLabel: "Điểm thực hành",
    passedProblems: "bài đạt",
    actionRetake: "Làm lại",
    actionReview: "Xem kết quả",
    resetCodingConfirm: "Bạn có chắc chắn muốn làm lại phần thực hành lập trình không? Toàn bộ mã nguồn cũ sẽ bị xóa.",
    agree: "Đồng ý",
    cancel: "Hủy"
  },
  en: {
    welcome: "Welcome to",
    subtitle: "A comprehensive evaluation system for algorithmic skills, data structures, and code optimization.",
    cta: "Click the button below to start or continue your programming practical exam.",
    codingTitle: "Practical Programming (Coding)",
    codingDesc: "Solve 3 algorithmic problems from easy to medium with automated online compiler supporting JS, Python, C++, Java.",
    codingProgress: "Progress",
    codingActionStart: "Start Coding",
    codingActionContinue: "Continue Coding",
    settings: "Settings",
    logout: "Log out",
    theme: "Theme",
    themeLight: "Light mode",
    themeDark: "Dark mode",
    language: "Language",
    langVi: "Vietnamese",
    langEn: "English",
    close: "Close",
    userAccount: "Student Account",
    duration: "90 mins",
    passed: "passed",
    codingScoreLabel: "Practical Score",
    passedProblems: "passed",
    actionRetake: "Retake",
    actionReview: "View Results",
    resetCodingConfirm: "Are you sure you want to retake the coding section? All your previous code will be cleared.",
    agree: "Confirm",
    cancel: "Cancel"
  }
};

export default function HomeSection({
  codingAnswers,
  isDark,
  setIsDark,
  onSelectTab,
  username,
  onLogout,
  language,
  setLanguage,
  onResetCoding
}: HomeSectionProps) {
  const t = translations[language];
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResetCodingConfirm, setShowResetCodingConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const passedCodingCount = Object.values(codingAnswers).filter((ans) => ans.passed).length;
  const codingProgressPercent = (passedCodingCount / 3) * 100;

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
    <div className="dashboard-wrapper" id="home-section-container">
      {/* 1. Header inside dashboard */}
      <div className="header-wrapper" style={{ background: 'transparent', borderBottom: '1px solid var(--border-element)', padding: '0 0 1rem 0', marginBottom: '2rem' }}>
        <div className="logo-section">
          <div className="logo-badge">
            <Code size={18} className="pulse-animation" />
          </div>
          <span className="logo-text" style={{ fontSize: '1.125rem' }}>
            <span className="gradient-text font-black">CSOJ Portal</span>
          </span>
        </div>

        <div className="user-section" ref={dropdownRef}>
          <button onClick={() => setShowDropdown(!showDropdown)} className="user-profile-trigger">
            <div className="user-avatar">
              {username ? username[0].toUpperCase() : 'U'}
            </div>
            <span className="user-username hidden-xs">
              {username}
            </span>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="dropdown-menu liquid-glass"
                style={{ top: '115%' }}
              >
                <div className="dropdown-header">
                  <p className="dropdown-header-title">{t.userAccount}</p>
                  <p className="dropdown-header-email">{username}@csoj.org</p>
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

      <div className="dashboard-content">
        {/* 2. Welcome text */}
        <div className="welcome-section">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="welcome-title"
          >
            {t.welcome} <span className="gradient-text">CSOJ Portal</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="welcome-subtitle"
          >
            {t.subtitle} {t.cta}
          </motion.p>
        </div>

        {/* 3. Main Practice Card */}
        <div className="card-grid-container">
          <div className="dashboard-card-wrap">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="csoj-card liquid-glass"
            >
              <div className="card-decorative-glow" />

              <div className="card-header-row">
                <div className="card-icon-badge">
                  <Code size={18} />
                </div>
                <div className="card-duration-badge">
                  <Clock size={13} style={{ color: '#10b981' }} />
                  <span>{t.duration}</span>
                </div>
              </div>

              <div className="card-title-block">
                <h3 className="card-title">{t.codingTitle}</h3>
                <p className="card-description">{t.codingDesc}</p>
              </div>

              <div className="card-footer-box">
                {Object.keys(codingAnswers).length > 0 && (
                  <div className="score-panel">
                    <div className="score-row">
                      <span className="score-title">{t.codingScoreLabel}</span>
                      <span className="score-number">
                        {((passedCodingCount / 3) * 10).toFixed(1)} / 10.0
                      </span>
                    </div>
                    <div className="score-subtitle">
                      {passedCodingCount}/3 {t.passedProblems}
                    </div>
                  </div>
                )}

                <div>
                  <div className="progress-label-row">
                    <span className="progress-label">{t.codingProgress}</span>
                    <span className="progress-text">{passedCodingCount}/3 {t.passed}</span>
                  </div>
                  <div className="progress-container" style={{ marginTop: '0.375rem' }}>
                    <div className="progress-bar-fill" style={{ width: `${codingProgressPercent}%` }} />
                  </div>
                </div>

                {Object.keys(codingAnswers).length > 0 ? (
                  <div className="card-action-grid">
                    <button onClick={() => onSelectTab('coding')} className="csoj-btn csoj-btn-primary">
                      <Eye size={13} />
                      <span>{t.actionReview}</span>
                    </button>
                    {showResetCodingConfirm ? (
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button
                          onClick={() => { onResetCoding(); setShowResetCodingConfirm(false); }}
                          className="csoj-btn csoj-btn-danger"
                          style={{ flex: 1, padding: '0.375rem' }}
                        >
                          {t.agree}
                        </button>
                        <button
                          onClick={() => setShowResetCodingConfirm(false)}
                          className="csoj-btn csoj-btn-secondary"
                          style={{ flex: 1, padding: '0.375rem' }}
                        >
                          {t.cancel}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowResetCodingConfirm(true)} className="csoj-btn csoj-btn-outline">
                        <RotateCcw size={13} style={{ color: '#6366f1' }} />
                        <span>{t.actionRetake}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => onSelectTab('coding')} className="csoj-btn csoj-btn-primary btn-full-width">
                    <span>{codingProgressPercent > 0 ? t.codingActionContinue : t.codingActionStart}</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 4. Settings Modal Overlay */}
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
    </div>
  );
}
