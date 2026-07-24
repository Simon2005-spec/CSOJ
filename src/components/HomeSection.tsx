import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Code, 
  Settings, 
  LogOut, 
  Clock, 
  Eye, 
  RotateCcw, 
  ArrowRight, 
  Sun, 
  Moon, 
  Globe, 
  Trophy, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
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
    welcome: "Chào mừng trở lại,",
    subtitle: "Hệ thống đánh giá kỹ năng thuật toán và tối ưu mã nguồn toàn diện.",
    codingTitle: "Thực hành Lập trình",
    codingDesc: "Giải quyết các bài toán thuật toán với trình biên dịch tự động, hỗ trợ C++, Python, Pascal.",
    codingProgress: "Tiến trình",
    actionStart: "Bắt đầu bài thi",
    actionContinue: "Tiếp tục làm bài",
    actionRetake: "Làm lại bài",
    actionReview: "Xem lại bài",
    settings: "Cài đặt",
    logout: "Đăng xuất",
    theme: "Giao diện",
    language: "Ngôn ngữ",
    passed: "bài đạt",
    scoreLabel: "Điểm hiện tại",
    resetConfirm: "Bạn có chắc chắn muốn làm lại phần thực hành lập trình không? Toàn bộ mã nguồn cũ sẽ bị xóa.",
    confirm: "Xác nhận",
    cancel: "Hủy bỏ"
  },
  en: {
    welcome: "Welcome back,",
    subtitle: "A comprehensive system for evaluating algorithmic skills and source code optimization.",
    codingTitle: "Practical Programming",
    codingDesc: "Solve algorithmic problems with an automated compiler supporting C++, Python, Pascal.",
    codingProgress: "Progress",
    actionStart: "Start Exam",
    actionContinue: "Continue",
    actionRetake: "Retake",
    actionReview: "Review",
    settings: "Settings",
    logout: "Logout",
    theme: "Theme",
    language: "Language",
    passed: "passed",
    scoreLabel: "Current Score",
    resetConfirm: "Are you sure you want to retake the coding section? All your previous code will be cleared.",
    confirm: "Confirm",
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
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const passedCount = Object.values(codingAnswers).filter((ans) => ans.passed).length;
  const progressPercent = problems.length > 0 ? (passedCount / problems.length) * 100 : 0;
  const currentScore = ((passedCount / (problems.length || 1)) * 10).toFixed(1);

  return (
    <div className="flex flex-col flex-1 bg-[var(--bg-app)] relative overflow-hidden">
      {/* Nav */}
      <header className="header-wrapper sticky top-0 z-40 bg-[var(--bg-card)]/80 backdrop-blur-xl shadow-sm">
        <div className="header-content h-14 md:h-16 px-4 md:px-10">
          <div 
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-gradient)] text-white flex items-center justify-center shadow-lg shadow-indigo-500/15 group-hover:scale-105 transition-transform">
              <Code size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">CSOJ</span>
          </div>
  
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-[var(--border-element)]">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-element)]">
                {username[0].toUpperCase()}
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">{username}</span>
            </div>
            <button onClick={onLogout} className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 app-container pt-4 pb-8 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20 relative z-10">
        <div className="flex flex-col gap-10 md:gap-16">
          {/* Welcome Hero */}
          <div className="flex flex-col gap-4">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] break-words"
            >
              {t.welcome} <span className="text-[var(--accent-primary)]">{username}!</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl font-medium text-[var(--text-muted)] max-w-2xl leading-loose opacity-90"
            >
              {t.subtitle}
            </motion.p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Practice Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-8 liquid-glass rounded-[1.5rem] p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)]">{t.codingTitle}</h2>
                    <span className="flex items-center gap-2 text-xs font-bold text-emerald-500 mt-1">
                      <Clock size={14} /> 90 {language === 'vi' ? 'phút' : 'mins'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl relative z-10">
                {t.codingDesc}
              </p>

              <div className="flex flex-col gap-6 mt-auto relative z-10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                    <span>{t.codingProgress}</span>
                    <span>{passedCount}/{problems.length} {t.passed}</span>
                  </div>
                  <div className="h-2.5 w-full bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border-element)]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-[var(--accent-gradient)]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-6 border-t border-[var(--border-element)]">
                  {Object.keys(codingAnswers).length > 0 ? (
                    <>
                      <button onClick={() => onSelectTab('coding')} className="csoj-btn csoj-btn-primary px-8 py-3.5 text-sm">
                        <Eye size={16} />
                        <span>{t.actionReview}</span>
                      </button>
                      <button onClick={() => setShowResetConfirm(true)} className="csoj-btn csoj-btn-outline px-8 py-3.5 text-sm">
                        <RotateCcw size={16} />
                        <span>{t.actionRetake}</span>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => onSelectTab('coding')} className="csoj-btn csoj-btn-primary px-10 py-4 text-sm">
                      <span>{t.actionStart}</span>
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stats / Sidebar Cards */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="liquid-glass rounded-[1.5rem] p-8 flex flex-col gap-4 items-center text-center bg-[var(--accent-gradient)] text-white border-none shadow-xl shadow-indigo-500/20"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                  <Trophy size={28} />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest opacity-70 mb-1">{t.scoreLabel}</p>
                  <h3 className="text-4xl font-black">{currentScore}</h3>
                  <p className="text-[10px] font-bold mt-1 opacity-80 uppercase">THANG ĐIỂM 10.0</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="liquid-glass rounded-[1.5rem] p-8 flex flex-col gap-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-extrabold text-[var(--text-primary)]">Hệ thống an toàn</h3>
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                  Tất cả bài nộp được lưu trữ an toàn và đồng bộ hóa thời gian thực với máy chủ chấm bài.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-card max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-indigo-500" />
                  <h3 className="text-xl font-black tracking-tight">{t.settings}</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
                  <LogOut size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <label className="form-label flex items-center gap-2">
                    <Sun size={14} /> {t.theme}
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-element)]">
                    <button onClick={() => setIsDark(false)} className={`py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all ${!isDark ? 'bg-[var(--bg-card)] shadow-sm text-indigo-600' : 'text-[var(--text-muted)]'}`}>LIGHT</button>
                    <button onClick={() => setIsDark(true)} className={`py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all ${isDark ? 'bg-[var(--bg-app)] shadow-sm text-indigo-400' : 'text-[var(--text-muted)]'}`}>DARK</button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="form-label flex items-center gap-2">
                    <Globe size={14} /> {t.language}
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-element)]">
                    <button onClick={() => setLanguage('vi')} className={`py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all ${language === 'vi' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-muted)]'}`}>TIẾNG VIỆT</button>
                    <button onClick={() => setLanguage('en')} className={`py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all ${language === 'en' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-muted)]'}`}>ENGLISH</button>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-[var(--border-element)]">
                <button onClick={() => setShowSettings(false)} className="csoj-btn csoj-btn-primary w-full py-3">
                  Đóng cài đặt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirm Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-card max-w-sm"
            >
              <div className="text-red-500 mb-4">
                <RotateCcw size={32} />
              </div>
              <h3 className="text-lg font-black mb-2">{language === 'vi' ? 'Xác nhận làm lại bài?' : 'Confirm retake?'}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
                {t.resetConfirm}
              </p>
              <div className="flex gap-3">
                <button onClick={() => { onResetCoding(); setShowResetConfirm(false); }} className="flex-1 csoj-btn csoj-btn-danger">{t.confirm}</button>
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 csoj-btn csoj-btn-secondary">{t.cancel}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
