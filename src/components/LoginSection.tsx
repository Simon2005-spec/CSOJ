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
        setError('Tài khoản hoặc mật khẩu không chính xác. Thử lại với tài khoản "simon" hoặc "admin" với mật khẩu "1230".');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="login-screen" id="login-page-container">
      {/* Decorative ambient blobs */}
      <div className="ambient-blobs-container">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="login-card liquid-glass"
      >
        <div className="login-top-accent" />
        
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-logo-badge">
            <Code size={24} className="pulse-animation" />
          </div>
          <h2 className="login-title">
            Đăng nhập <span className="gradient-text">CSOJ Portal</span>
          </h2>
          <p className="login-subtitle">
            Hệ thống chấm bài lập trình trực tuyến thế hệ mới
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="csoj-form">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert-error"
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Username Input */}
          <div className="form-group">
            <label className="form-label">TÊN TÀI KHOẢN (Username)</label>
            <div className="input-container">
              <span className="input-icon">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản"
                className="csoj-input"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label">MẬT KHẨU (Password)</label>
            <div className="input-container">
              <span className="input-icon">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="csoj-input"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Prompt/Guide */}
          <div className="tips-box" style={{ fontSize: '0.825rem', lineHeight: '1.5' }}>
            💡 Gợi ý đăng nhập thử nghiệm:<br />
            - Học sinh: tài khoản <strong>simon</strong> / mật khẩu <strong>1230</strong><br />
            - Quản trị viên: tài khoản <strong>admin</strong> / mật khẩu <strong>1230</strong>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="csoj-btn csoj-btn-primary"
            style={{ width: '100%', opacity: isLoading ? 0.85 : 1, padding: '0.75rem' }}
          >
            {isLoading ? (
              <>
                <svg className="spin-slow" style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', color: 'white' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang kết nối...</span>
              </>
            ) : (
              <span>Đăng Nhập Hệ Thống</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
