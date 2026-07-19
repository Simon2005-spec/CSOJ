import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CodeSection from './components/CodeSection';
import HomeSection from './components/HomeSection';
import LoginSection from './components/LoginSection';
import AdminSection from './components/AdminSection';
import { CODING_PROBLEMS } from './data/codingProblems';
import { CodingProblem } from './types';
import { AnimatePresence, motion } from 'framer-motion';

// In-memory fallback dictionary for restricted third-party / sandbox iframes
const memoryStorage: { [key: string]: string } = {};

const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  }
};

export default function App() {
  // 0. User & Language States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return safeStorage.getItem('csoj_logged_in') === 'true';
  });

  const [username, setUsername] = useState(() => {
    return safeStorage.getItem('csoj_username') || '';
  });

  const [language, setLanguage] = useState<'vi' | 'en'>(() => {
    const saved = safeStorage.getItem('csoj_language');
    return (saved === 'en' ? 'en' : 'vi') as 'vi' | 'en';
  });

  // 1. Core Exam States
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const saved = safeStorage.getItem('csoj_time_left');
      if (saved) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 5400 : parsed;
      }
    } catch (e) {
      // Fallback
    }
    return 5400; // 1h 30m default = 5400 seconds
  });

  const [codingAnswers, setCodingAnswers] = useState<{
    [problemId: string]: { code: string; language: string; passed: boolean };
  }>(() => {
    try {
      const saved = safeStorage.getItem('csoj_coding_answers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = safeStorage.getItem('csoj_theme_dark');
    return saved !== null ? saved === 'true' : true;
  });

  // 1.5 Dynamic Problems State (synchronized with database)
  const [problems, setProblems] = useState<CodingProblem[]>(() => {
    try {
      const saved = safeStorage.getItem('csoj_problems');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 2. Navigation States
  const [activeTab, setActiveTab] = useState<'home' | 'coding'>('home');
  const [currentProblemId, setCurrentProblemId] = useState(() => {
    try {
      const saved = safeStorage.getItem('csoj_problems');
      const probs = saved ? JSON.parse(saved) : [];
      return probs[0]?.id || '';
    } catch (e) {
      return '';
    }
  });

  // Sync currentProblemId when problems list updates
  useEffect(() => {
    if (problems.length > 0 && (!currentProblemId || !problems.some(p => p.id === currentProblemId))) {
      setCurrentProblemId(problems[0].id);
    }
  }, [problems, currentProblemId]);

  // Fetch problems on mount and periodically
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await fetch(`/api/problems?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setProblems(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch problems from server:", err);
      }
    };
    fetchProblems();
    // Poll every 3 seconds to synchronize new/edited problems automatically across all sessions
    const interval = setInterval(fetchProblems, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch student progress on login
  useEffect(() => {
    if (!isLoggedIn || !username || username === 'admin') return;

    const loadUserProgress = async () => {
      try {
        const res = await fetch(`/api/submissions/${username}?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.codingAnswers) {
              setCodingAnswers(data.codingAnswers);
            }
            if (typeof data.timeLeft === 'number') {
              setTimeLeft(data.timeLeft);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load user progress from server:", e);
      }
    };

    loadUserProgress();
  }, [isLoggedIn, username]);

  // Sync coding progress and timeLeft to server
  useEffect(() => {
    if (!isLoggedIn || !username || username === 'admin') return;
    
    const syncSub = async () => {
      try {
        const passedCount = Object.values(codingAnswers).filter(a => a.passed).length;
        const calculatedScore = parseFloat(((passedCount / (problems.length || 1)) * 10).toFixed(1));
        
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            codingAnswers,
            timeLeft,
            isFinished: false,
            score: calculatedScore
          })
        });
      } catch (e) {
        console.error("Error syncing submission to server:", e);
      }
    };

    const delayDebounce = setTimeout(syncSub, 1500);
    return () => clearTimeout(delayDebounce);
  }, [codingAnswers, timeLeft, username, isLoggedIn, problems.length]);

  // Sync problems list to localStorage
  useEffect(() => {
    safeStorage.setItem('csoj_problems', JSON.stringify(problems));
  }, [problems]);

  // Handle adding new problem
  const handleAddProblem = async (newProb: CodingProblem) => {
    setProblems((prev) => {
      const filtered = prev.filter((p) => p.id !== newProb.id);
      return [...filtered, newProb];
    });
    if (!currentProblemId) {
      setCurrentProblemId(newProb.id);
    }
    try {
      await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProb)
      });
    } catch (e) {
      console.error("Error saving problem to server:", e);
    }
  };

  // Handle editing/updating a problem
  const handleEditProblem = async (oldId: string, updatedProb: CodingProblem) => {
    setProblems((prev) => {
      const index = prev.findIndex((p) => p.id === oldId);
      if (index !== -1) {
        const next = [...prev];
        next[index] = updatedProb;
        return next;
      }
      return [...prev.filter((p) => p.id !== updatedProb.id), updatedProb];
    });
    if (currentProblemId === oldId) {
      setCurrentProblemId(updatedProb.id);
    }
    try {
      if (oldId !== updatedProb.id) {
        await fetch(`/api/problems/${oldId}`, { method: 'DELETE' });
      }
      await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProb)
      });
    } catch (e) {
      console.error("Error editing problem on server:", e);
    }
  };

  // Handle removing a problem
  const handleRemoveProblem = async (problemId: string) => {
    setProblems((prev) => {
      const updated = prev.filter((p) => p.id !== problemId);
      if (currentProblemId === problemId) {
        setCurrentProblemId(updated[0]?.id || '');
      }
      return updated;
    });
    try {
      await fetch(`/api/problems/${problemId}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Error deleting problem from server:", e);
    }
  };

  // 4. Persistence in localStorage
  useEffect(() => {
    safeStorage.setItem('csoj_logged_in', isLoggedIn.toString());
  }, [isLoggedIn]);

  useEffect(() => {
    safeStorage.setItem('csoj_username', username);
  }, [username]);

  useEffect(() => {
    safeStorage.setItem('csoj_language', language);
  }, [language]);

  useEffect(() => {
    safeStorage.setItem('csoj_time_left', timeLeft.toString());
  }, [timeLeft]);

  useEffect(() => {
    safeStorage.setItem('csoj_coding_answers', JSON.stringify(codingAnswers));
  }, [codingAnswers]);

  useEffect(() => {
    safeStorage.setItem('csoj_theme_dark', isDark.toString());
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Handle Login Success
  const handleLoginSuccess = (user: string) => {
    setUsername(user);
    setIsLoggedIn(true);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    safeStorage.removeItem('csoj_logged_in');
    safeStorage.removeItem('csoj_username');
    handleRestartExam();
  };

  // Restart/Reset entire exam state
  const handleRestartExam = () => {
    safeStorage.removeItem('csoj_time_left');
    safeStorage.removeItem('csoj_coding_answers');
    setTimeLeft(5400);
    setCodingAnswers({});
    setCurrentProblemId(problems[0]?.id || '');
    setActiveTab('home');
  };

  // Reset Coding State only
  const handleResetCoding = () => {
    safeStorage.removeItem('csoj_coding_answers');
    setCodingAnswers({});
    setCurrentProblemId(problems[0]?.id || '');
    setActiveTab('coding');
  };

  if (!isLoggedIn) {
    return <LoginSection onLoginSuccess={handleLoginSuccess} isDark={isDark} />;
  }

  if (username === 'admin') {
    return (
      <div className={`csoj-app-wrapper ${isDark ? 'dark' : ''}`} id="csoj-root-application" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Floating background decorations */}
        <div className="ambient-blobs-container">
          <div className="ambient-blob ambient-blob-1" />
          <div className="ambient-blob ambient-blob-2" />
          <div className="ambient-blob ambient-blob-3" />
        </div>
        
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10 }}>
          <AdminSection
            problems={problems}
            onAddProblem={handleAddProblem}
            onEditProblem={handleEditProblem}
            onRemoveProblem={handleRemoveProblem}
            onLogout={handleLogout}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={`csoj-app-wrapper ${isDark ? 'dark' : ''}`} id="csoj-root-application">
      {/* Decorative Floating Ambient Glass Blobs */}
      <div className="ambient-blobs-container">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      {/* Header Panel */}
      {activeTab !== 'home' && (
        <Header
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          userName={username}
          userId="123456"
          isDark={isDark}
          setIsDark={setIsDark}
          onSubmit={() => {}}
          isFinished={false}
          isHome={false}
          onGoHome={() => setActiveTab('home')}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
        />
      )}

      {/* Main Interactive Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <HomeSection
                problems={problems}
                codingAnswers={codingAnswers}
                isDark={isDark}
                setIsDark={setIsDark}
                onSelectTab={(tab) => setActiveTab(tab)}
                username={username}
                onLogout={handleLogout}
                language={language}
                setLanguage={setLanguage}
                onResetCoding={handleResetCoding}
              />
            </motion.div>
          ) : (
            <motion.div
              key="coding"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <CodeSection
                problems={problems}
                currentProblemId={currentProblemId}
                setCurrentProblemId={setCurrentProblemId}
                codingAnswers={codingAnswers}
                setCodingAnswers={setCodingAnswers}
                isDark={isDark}
                language={language}
                onResetCoding={handleResetCoding}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* VS Code Style Immersive status bar footer */}
      {activeTab !== 'home' && (
        <footer className="status-bar">
          <div className="status-bar-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="status-indicator-dot" />
              <span>{language === 'vi' ? 'Sẵn sàng nộp bài' : 'Ready to submit'}</span>
            </div>
            <span>UTF-8</span>
            <span className="hidden-xs">Spaces: 4</span>
          </div>
          <div className="status-bar-right">
            <span className="hidden-xs">Line 1, Col 1</span>
            <span style={{ fontWeight: 'bold', color: '#10b981' }}>NHCOJ Engine v2.5</span>
          </div>
        </footer>
      )}
    </div>
  );
}
