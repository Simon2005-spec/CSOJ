import React, { useEffect, useState, useRef } from 'react';
import { Clock, LogOut, Code, Home, Settings, Globe, Sun, Moon } from 'lucide-react';
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
    backHome: "Trang chủ",
    settings: "Cài đặt",
    logout: "Đăng xuất",
    theme: "Giao diện",
    language: "Ngôn ngữ",
    timeLeftLabel: "Thời gian còn lại",
  },
  en: {
    backHome: "Home",
    settings: "Settings",
    logout: "Log out",
    theme: "Theme",
    language: "Language",
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
  onGoHome,
  onLogout,
  language,
  setLanguage
}: HeaderProps) {
  const t = translations[language];
  const [showSettings, setShowSettings] = useState(false);

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
          if (prev === 1) onSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, onSubmit, setTimeLeft]);

  return (
    <header className="header-wrapper sticky top-0 z-50 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border-element)]">
      <div className="flex items-center gap-5">
        <div className="logo-section" onClick={onGoHome}>
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-gradient)] text-white flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <Code size={16} />
          </div>
          <span className="logo-text text-lg">CSOJ</span>
        </div>

        <button onClick={onGoHome} className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[10px] font-bold text-[var(--text-secondary)] transition-all">
          <Home size={12} />
          <span>{t.backHome}</span>
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--border-element)]">
          <Clock size={12} className={timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-emerald-500'} />
          <span className={`font-mono text-xs font-black tracking-tight ${timeLeft < 300 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 pr-3 border-r border-[var(--border-element)]">
          <div className="w-7 h-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[9px] font-black text-[var(--text-muted)] border border-[var(--border-element)]">
            {userName[0].toUpperCase()}
          </div>
          <span className="text-[11px] font-bold text-[var(--text-primary)]">{userName}</span>
        </div>
        
        <button onClick={() => setShowSettings(true)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
          <Settings size={16} />
        </button>
        <button onClick={onLogout} className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-card max-w-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Settings size={20} className="text-indigo-500" />
                  <h3 className="text-xl font-black">{t.settings}</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl"><LogOut size={18} /></button>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="form-label flex items-center gap-2"><Sun size={14} /> {t.theme}</label>
                  <div className="grid grid-cols-2 gap-1 bg-[var(--bg-input)] p-1 rounded-xl">
                    <button onClick={() => setIsDark(false)} className={`py-1.5 text-[9px] font-black uppercase rounded-lg ${!isDark ? 'bg-[var(--bg-card)] shadow text-indigo-600' : 'text-[var(--text-muted)]'}`}>LIGHT</button>
                    <button onClick={() => setIsDark(true)} className={`py-1.5 text-[9px] font-black uppercase rounded-lg ${isDark ? 'bg-[var(--bg-app)] shadow text-indigo-400' : 'text-[var(--text-muted)]'}`}>DARK</button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="form-label flex items-center gap-2"><Globe size={14} /> {t.language}</label>
                  <div className="grid grid-cols-2 gap-1 bg-[var(--bg-input)] p-1 rounded-xl">
                    <button onClick={() => setLanguage('vi')} className={`py-1.5 text-[9px] font-black uppercase rounded-lg ${language === 'vi' ? 'bg-indigo-500 text-white shadow' : 'text-[var(--text-muted)]'}`}>VIỆT</button>
                    <button onClick={() => setLanguage('en')} className={`py-1.5 text-[9px] font-black uppercase rounded-lg ${language === 'en' ? 'bg-indigo-500 text-white shadow' : 'text-[var(--text-muted)]'}`}>ENG</button>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowSettings(false)} className="csoj-btn csoj-btn-primary w-full py-3 mt-8">Đóng</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
