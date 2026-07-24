import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginSectionProps {
  onLoginSuccess: (username: string) => void;
  isDark: boolean;
}

export default function LoginSection({ onLoginSuccess, isDark }: LoginSectionProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);

    // Simulate network latency
    setTimeout(() => {
      const normalizedUser = username.trim().toLowerCase();
      if ((normalizedUser === 'simon' || normalizedUser === 'admin') && password === '1230') {
        onLoginSuccess(normalizedUser);
      } else {
        setError('Tài khoản hoặc mật khẩu không chính xác.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] relative overflow-hidden px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="liquid-glass rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-gradient)] text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
              <Code size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              CSOJ <span className="text-[var(--accent-primary)]">System</span>
            </h1>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-2">
              Hệ thống chấm bài lập trình trực tuyến
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" autoComplete="off">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 text-xs font-bold"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="form-label">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder=""
                  className="csoj-input !pl-12"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="form-label">Mật khẩu</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="csoj-input !pl-12 !pr-12"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="csoj-btn csoj-btn-primary w-full py-4 text-sm mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                <span>Đăng nhập hệ thống</span>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-xs font-medium text-[var(--text-muted)] opacity-60">
          © 2024 CSOJ Engine. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
