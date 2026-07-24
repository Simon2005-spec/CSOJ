import React, { useEffect, useState, useRef } from 'react';
import { Clock, LogOut, Code, Home, Settings, Globe, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onGoHome: () => void;
  onLogout: () => void;
  language: 'vi' | 'en';
}

const translations = {
  vi: {
    logout: "Đăng xuất",
  },
  en: {
    logout: "Log out",
  }
};

export default function Header({
  onGoHome,
  onLogout,
  language
}: HeaderProps) {
  const t = translations[language];

  return (
    <>
      <header className="header-wrapper sticky top-0 z-40 bg-[var(--bg-app)] shrink-0 shadow-sm border-b border-[var(--border-element)]">
        <div className="header-content !h-12 px-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div 
              onClick={onGoHome}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded bg-[#ffa116] flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Code className="text-white" size={16} strokeWidth={3} />
              </div>
              <span className="text-[16px] font-black tracking-tight text-[var(--text-primary)] uppercase">
                CSOJ
              </span>
            </div>
          </div>
  
          <div className="flex items-center gap-3">
            <button 
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/80 hover:text-red-500 transition-all"
              title={t.logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
