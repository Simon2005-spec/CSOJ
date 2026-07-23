import React, { useState, useEffect, useRef } from 'react';
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
  const [timeLeft, setTimeLeft] = useState(5400); // 1h 30m default = 5400 seconds
  const [codingAnswers, setCodingAnswers] = useState<{
    [problemId: string]: { code: string; language: string; passed: boolean };
  }>({});

  const [isDark, setIsDark] = useState(() => {
    const saved = safeStorage.getItem('csoj_theme_dark');
    return saved !== null ? saved === 'true' : true;
  });

  // 1.5 Dynamic Problems State (synchronized with database)
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);

  // Refs for debounced & periodic server syncs to prevent race conditions & closures
  const codingAnswersRef = useRef(codingAnswers);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    codingAnswersRef.current = codingAnswers;
  }, [codingAnswers]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // 2. Navigation States
  const [activeTab, setActiveTab] = useState<'home' | 'coding'>('home');
  const [currentProblemId, setCurrentProblemId] = useState('');

  // Sync currentProblemId when problems list updates
  useEffect(() => {
    if (problems.length > 0 && (!currentProblemId || !problems.some(p => p.id === currentProblemId))) {
      setCurrentProblemId(problems[0].id);
    }
  }, [problems, currentProblemId]);

  // Fetch problems from server
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

  // Fetch problems on mount and periodically to sync across devices/users
  useEffect(() => {
    fetchProblems();
    // Poll every 5 seconds to synchronize new/edited problems automatically across sessions
    const interval = setInterval(fetchProblems, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch student progress on login with retry mechanism
  useEffect(() => {
    if (!isLoggedIn || !username) {
      setIsProgressLoaded(false);
      return;
    }
    if (username === 'admin') {
      setIsProgressLoaded(true);
      return;
    }

    let active = true;
    const loadUserProgress = async (retries = 5) => {
      try {
        const res = await fetch(`/api/submissions/${username}?t=${Date.now()}`);
        if (!active) return;
        
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.codingAnswers) {
              setCodingAnswers(data.codingAnswers);
            }
            if (typeof data.timeLeft === 'number') {
              setTimeLeft(data.timeLeft);
            }
          } else {
            setCodingAnswers({});
            setTimeLeft(5400);
          }
          setIsProgressLoaded(true);
        } else {
          throw new Error(`Server status ${res.status}`);
        }
      } catch (e) {
        console.error("Failed to load user progress from server:", e);
        if (active && retries > 0) {
          console.log(`Retrying to load user progress in 3s... (${retries} retries left)`);
          setTimeout(() => {
            if (active) loadUserProgress(retries - 1);
          }, 3000);
        } else if (active) {
          console.warn("Could not load user progress after max retries. Overwrite protection is ACTIVE.");
        }
      }
    };

    loadUserProgress();
    return () => {
      active = false;
    };
  }, [isLoggedIn, username]);

  // Sync coding progress on typing/change with debounce (1.5 seconds)
  useEffect(() => {
    if (!isLoggedIn || !username || username === 'admin' || !isProgressLoaded) return;
    
    const syncSub = async () => {
      try {
        const passedCount = Object.values(codingAnswersRef.current).filter(a => a.passed).length;
        const calculatedScore = parseFloat(((passedCount / (problems.length || 1)) * 10).toFixed(1));
        
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            codingAnswers: codingAnswersRef.current,
            timeLeft: timeLeftRef.current,
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
  }, [codingAnswers, username, isLoggedIn, isProgressLoaded, problems.length]);

  // Periodic heartbeat backup sync (every 10 seconds) to sync timeLeft continuously without resetting typing debounce
  useEffect(() => {
    if (!isLoggedIn || !username || username === 'admin' || !isProgressLoaded) return;

    const interval = setInterval(async () => {
      try {
        const passedCount = Object.values(codingAnswersRef.current).filter(a => a.passed).length;
        const calculatedScore = parseFloat(((passedCount / (problems.length || 1)) * 10).toFixed(1));
        
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            codingAnswers: codingAnswersRef.current,
            timeLeft: timeLeftRef.current,
            isFinished: false,
            score: calculatedScore
          })
        });
      } catch (e) {
        console.error("Error heartbeat syncing submission to server:", e);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn, username, isProgressLoaded, problems.length]);

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

  // 4. Persistence of session states in localStorage
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
    // Clear exam states immediately
    setTimeLeft(5400);
    setCodingAnswers({});
    setCurrentProblemId('');
    setActiveTab('home');
  };

  // Restart/Reset entire exam state
  const handleRestartExam = async () => {
    setTimeLeft(5400);
    setCodingAnswers({});
    setCurrentProblemId(problems[0]?.id || '');
    setActiveTab('home');

    if (isLoggedIn && username && username !== 'admin') {
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            codingAnswers: {},
            timeLeft: 5400,
            isFinished: false,
            score: 0
          })
        });
      } catch (e) {
        console.error("Error resetting exam on server:", e);
      }
    }
  };

  // Reset Coding State only
  const handleResetCoding = async () => {
    setCodingAnswers({});
    setCurrentProblemId(problems[0]?.id || '');
    setActiveTab('coding');

    if (isLoggedIn && username && username !== 'admin') {
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            codingAnswers: {},
            timeLeft,
            isFinished: false,
            score: 0
          })
        });
      } catch (e) {
        console.error("Error resetting coding answers on server:", e);
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <LoginSection onLoginSuccess={handleLoginSuccess} isDark={isDark} />
      </div>
    );
  }

  if (username === 'admin') {
    return (
      <div className={`csoj-app-wrapper ${isDark ? 'dark' : ''}`} id="csoj-root-application">
        <div className="ambient-blobs-container">
          <div className="ambient-blob ambient-blob-1" />
          <div className="ambient-blob ambient-blob-2" />
          <div className="ambient-blob ambient-blob-3" />
        </div>
        
        <main className="flex-1 relative z-10 overflow-auto">
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
      <div className="ambient-blobs-container">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

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

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-auto"
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
              className="flex-1 flex flex-col overflow-hidden"
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
