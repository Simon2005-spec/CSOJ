import React, { useState, useRef, useEffect } from 'react';
import { Code, Settings, LogOut, Clock, Eye, RotateCcw, ArrowRight, Sun, Moon, Globe, Trophy, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CodingProblem } from '../types';

interface HomeSectionProps {
  problems: CodingProblem[];
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
    codingDesc: "Giải quyết các bài toán thuật toán từ dễ đến trung bình với trình biên dịch tự động, hỗ trợ C++ 17, Python 3, Pascal.",
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
    codingDesc: "Solve algorithmic problems from easy to medium with an automated online compiler supporting C++ 17, Python 3, Pascal.",
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
  problems,
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

  const [submissions, setSubmissions] = useState<{ [username: string]: any }>({});

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch('/api/submissions');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSubmissions(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
      }
    };
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 4000);
    return () => clearInterval(interval);
  }, []);

  const passedCodingCount = Object.values(codingAnswers).filter((ans) => ans.passed).length;
  const codingProgressPercent = problems.length > 0 ? (passedCodingCount / problems.length) * 100 : 0;

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
            <span className="gradient-text font-black">NHCOJ</span>
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
                  <p className="dropdown-header-email">{username}@nhcoj.org</p>
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
            {t.welcome} <span className="gradient-text">NHCOJ</span>
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

        {/* 3. Main Practice Card & Synchronized Leaderboard */}
        <div className="card-grid-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
          {problems.length === 0 ? (
            <div className="dashboard-card-wrap" style={{ flex: '1 1 400px', maxWidth: '480px' }}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="csoj-card liquid-glass"
                style={{ textAlign: 'center', padding: '3rem 2rem' }}
              >
                <div className="card-decorative-glow" />
                <div style={{ color: 'var(--text-muted)', fontSize: '1.125rem', fontWeight: 500 }}>
                  {language === 'vi' ? 'Chưa có bài thi nào' : 'There are no exam problems yet'}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.8 }}>
                  {language === 'vi' 
                    ? 'Vui lòng quay lại sau hoặc liên hệ quản trị viên để nạp câu hỏi.'
                    : 'Please come back later or contact the administrator to add problems.'}
                </p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Card 1: Practical Programming */}
              <div className="dashboard-card-wrap" style={{ flex: '1 1 400px', maxWidth: '480px' }}>
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
                    <p className="card-description">
                      {t.codingDesc}
                    </p>
                  </div>

                  <div className="card-footer-box">
                    {Object.keys(codingAnswers).length > 0 && (
                      <div className="score-panel">
                        <div className="score-row">
                          <span className="score-title">{t.codingScoreLabel}</span>
                          <span className="score-number">
                            {((passedCodingCount / (problems.length || 1)) * 10).toFixed(1)} / 10.0
                          </span>
                        </div>
                        <div className="score-subtitle">
                          {passedCodingCount}/{problems.length} {t.passedProblems}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="progress-label-row">
                        <span className="progress-label">{t.codingProgress}</span>
                        <span className="progress-text">{passedCodingCount}/{problems.length} {t.passed}</span>
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

              {/* Card 2: Classroom Standings Leaderboard */}
              <div className="dashboard-card-wrap" style={{ flex: '1 1 400px', maxWidth: '480px' }}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="csoj-card liquid-glass"
                  style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div className="card-decorative-glow" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)' }} />

                  <div>
                    <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div className="card-icon-badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                        <Trophy size={18} />
                      </div>
                      <div className="card-duration-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Activity size={12} className="pulse-animation" />
                        <span>{language === 'vi' ? 'Đồng bộ trực tuyến' : 'Live Sync'}</span>
                      </div>
                    </div>

                    <div className="card-title-block" style={{ marginBottom: '1rem' }}>
                      <h3 className="card-title" style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span>{language === 'vi' ? 'Bảng Điểm Lớp Học' : 'Classroom Standings'}</span>
                      </h3>
                      <p className="card-description">
                        {language === 'vi'
                          ? 'Xem tiến độ hoàn thành bài tập lập trình của tất cả học sinh trong phòng máy.'
                          : 'View real-time practical programming standings and progress for the entire lab.'}
                      </p>
                    </div>

                    {/* Submissions Standings List */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '0.75rem', padding: '0.5rem', border: '1px solid var(--border-element)' }} className="custom-scrollbar">
                      {Object.keys(submissions).length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {language === 'vi' ? 'Chưa có hoạt động nộp bài nào' : 'No submission activity recorded yet'}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          {Object.values(submissions)
                            .sort((a, b) => (b.score || 0) - (a.score || 0))
                            .map((sub: any, index) => {
                              const isCurrentUser = sub.username.toLowerCase() === username.toLowerCase();
                              const passedCount = Object.values(sub.codingAnswers || {}).filter((a: any) => a.passed).length;
                              return (
                                <div
                                  key={sub.username}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    background: isCurrentUser ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isCurrentUser ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      width: '1.25rem',
                                      height: '1.25rem',
                                      borderRadius: '50%',
                                      background: index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'rgba(255,255,255,0.08)',
                                      color: index < 3 ? '#0f172a' : 'var(--text-muted)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      {index + 1}
                                    </div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: isCurrentUser ? 600 : 500, color: isCurrentUser ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                      {sub.username} {isCurrentUser && <span style={{ fontSize: '0.7rem', color: '#6366f1', background: 'rgba(99, 102, 241, 0.15)', padding: '0.05rem 0.25rem', borderRadius: '0.25rem', marginLeft: '0.25rem' }}>bạn</span>}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {passedCount}/{problems.length} {language === 'vi' ? 'bài' : 'solved'}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#10b981' }}>
                                      {parseFloat((sub.score || 0).toFixed(1))}đ
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-element)', paddingTop: '0.5rem', marginTop: '0.75rem' }}>
                    {language === 'vi' ? 'Cập nhật tự động mỗi 4 giây' : 'Auto-updates every 4 seconds'}
                  </div>
                </motion.div>
              </div>
            </>
          )}
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
