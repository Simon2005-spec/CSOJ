import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CodingProblem, SupportedLanguage } from '../types';
import { translations } from '../locales/translations';
import { evaluateCode } from '../lib/judge';
import { Play, CheckSquare, ZoomIn, ZoomOut, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { ProblemDescription } from './code/ProblemDescription';
import { CodeEditor } from './code/CodeEditor';
import { ConsolePanel } from './code/ConsolePanel';

interface CodeSectionProps {
  problems: CodingProblem[];
  currentProblemId: string;
  setCurrentProblemId: (id: string) => void;
  codingAnswers: { [problemId: string]: { code: string; language: string; passed: boolean } };
  setCodingAnswers: React.Dispatch<
    React.SetStateAction<{ [problemId: string]: { code: string; language: string; passed: boolean } }>
  >;
  isDark: boolean;
  language: 'vi' | 'en';
  onResetCoding: () => void;
}

export default function CodeSection({
  problems,
  currentProblemId,
  setCurrentProblemId,
  codingAnswers,
  setCodingAnswers,
  isDark,
  language,
  onResetCoding
}: CodeSectionProps) {
  const t = translations[language];
  
  const problem = useMemo(() => {
    return problems.find((p) => p.id === currentProblemId) || problems[0];
  }, [problems, currentProblemId]);

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('cpp');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResults, setLastResults] = useState<any[] | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [selectedTestcaseIdx, setSelectedTestcaseIdx] = useState<number>(0);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);

  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('csoj_editor_font_size');
      return saved ? parseInt(saved, 10) : 18;
    } catch (e) { return 18; }
  });

  useEffect(() => {
    localStorage.setItem('csoj_editor_font_size', editorFontSize.toString());
  }, [editorFontSize]);

  const latestCodeRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  const getStarterCode = (lang: SupportedLanguage) => {
    if (problem.defaultCode && problem.defaultCode[lang]) {
      return problem.defaultCode[lang];
    }
    if (lang === 'cpp') {
      return '#include <bits/stdc++.h>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // freopen("input.txt", "r", stdin);\n    // freopen("output.txt", "w", stdout);\n    \n    // Viết code của bạn ở đây\n    \n    return 0;\n}';
    }
    if (lang === 'python') {
      return 'import sys\n\ndef solve():\n    # Dữ liệu đọc từ stdin\n    # input = sys.stdin.read().split()\n    pass\n\nif __name__ == "__main__":\n    solve()';
    }
    if (lang === 'pascal') {
      return 'program Problem;\nuses math;\nvar\n  // Khai báo biến ở đây\nbegin\n  // Viết code của bạn ở đây\nend.';
    }
    return '// Viết code của bạn ở đây';
  };

  useEffect(() => {
    if (!problem) return;
    const saved = codingAnswers[problem.id];
    let initialCode = '';
    if (saved && (saved as any).codes && (saved as any).codes[selectedLang] !== undefined) {
      initialCode = (saved as any).codes[selectedLang];
    } else if (saved && saved.language === selectedLang) {
      initialCode = saved.code;
    } else {
      initialCode = getStarterCode(selectedLang);
    }
    setCode(initialCode);
    latestCodeRef.current = initialCode;
  }, [problem?.id, selectedLang, Object.keys(codingAnswers).length === 0]);

  const syncCodeToParent = useCallback((codeToSync: string, langToSync: SupportedLanguage, probId: string) => {
    setCodingAnswers((prev) => {
      const prevProblem = prev[probId] || { code: '', language: langToSync, passed: false };
      const updatedCodes = { ...((prevProblem as any).codes || {}), [langToSync]: codeToSync };
      return {
        ...prev,
        [probId]: {
          code: codeToSync,
          language: langToSync,
          passed: prevProblem.passed || false,
          codes: updatedCodes
        } as any
      };
    });
  }, [setCodingAnswers]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    latestCodeRef.current = newCode;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    // Capture the current problem ID to prevent race conditions during switching
    const currentId = problem.id;
    const currentLang = selectedLang;
    
    debounceTimerRef.current = setTimeout(() => {
      syncCodeToParent(newCode, currentLang, currentId);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newVal = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
      handleCodeChange(newVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    if (!problem) return;
    
    // Sync current code before switching language
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      syncCodeToParent(latestCodeRef.current, selectedLang, problem.id);
    }

    setSelectedLang(lang);
    const prevProblem = codingAnswers[problem.id];
    const savedCode = (prevProblem as any)?.codes?.[lang] ?? getStarterCode(lang);
    setCode(savedCode);
    latestCodeRef.current = savedCode;
  };

  const runCode = async () => {
    if (!problem) return;
    syncCodeToParent(latestCodeRef.current, selectedLang, problem.id);
    setIsRunning(true);
    setIsConsoleCollapsed(false);
    setActiveConsoleTab('result');
    setCompileError(null);
    setLastResults(null);
    setSelectedTestcaseIdx(0);

    try {
      const results = await evaluateCode(latestCodeRef.current, selectedLang, problem, language);
      setLastResults(results);
      const allPassed = results.every(r => r.passed);
      
      setCodingAnswers(prev => {
        const prevProblem = prev[problem.id] || { code: latestCodeRef.current, language: selectedLang, passed: false };
        return {
          ...prev,
          [problem.id]: {
            ...prevProblem,
            passed: allPassed
          } as any
        };
      });
    } catch (err: any) {
      setCompileError(err.message);
    }
    setIsRunning(false);
  };

  const submitCode = async () => {
    setIsSubmitting(true);
    await runCode();
    setIsSubmitting(false);
  };

  if (!problem) return null;

  return (
    <div className="workspace-wrapper flex flex-col flex-1 overflow-hidden bg-[var(--bg-app)]">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden app-container py-4 lg:py-6 gap-4 lg:gap-6">
        {/* LEFT PANEL: Problem Description */}
        <div className="w-full lg:w-[32%] min-w-0 flex flex-col min-h-0 rounded-xl border border-[var(--border-element)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
          <div className="h-10 px-4 border-b border-[var(--border-element)] flex items-center bg-[var(--bg-editor-toolbar)]">
            <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#ffa116] rounded-full" />
              {t.tabDescription}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ProblemDescription problem={problem} language={language} />
          </div>
        </div>

        {/* RIGHT PANEL: Editor & Console */}
        <div className="w-full lg:w-[68%] min-w-0 flex flex-col min-h-0 rounded-xl border border-[var(--border-element)] bg-[var(--bg-editor)] overflow-hidden shadow-sm">
          <div className="editor-toolbar h-10 flex items-center justify-between px-3 shrink-0 bg-[var(--bg-editor-toolbar)] border-b border-[var(--border-element)]">
            <div className="flex items-center gap-2">
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-transparent text-[13px] font-medium px-2 py-1 rounded hover:bg-[var(--bg-hover)] transition-colors outline-none cursor-pointer text-[var(--text-primary)]"
              >
                <option value="cpp">C++ 17</option>
                <option value="python">Python 3</option>
                <option value="pascal">Pascal</option>
              </select>

              <div className="h-4 w-px bg-[var(--border-element)] mx-1" />

              <div className="flex items-center gap-0.5">
                <button onClick={() => setEditorFontSize(v => Math.max(12, v-1))} className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)]" title="Zoom Out"><ZoomOut size={14} /></button>
                <span className="text-[11px] font-mono font-medium min-w-[2rem] text-center text-[var(--text-muted)]">{editorFontSize}px</span>
                <button onClick={() => setEditorFontSize(v => Math.min(24, v+1))} className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)]" title="Zoom In"><ZoomIn size={14} /></button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={runCode} disabled={isRunning} className="csoj-btn csoj-btn-outline h-7 px-3 text-[12px] font-medium">
                <Play size={12} className="text-[#2cbb5d] fill-[#2cbb5d]/20" />
                <span>{t.btnRun}</span>
              </button>
              <button onClick={submitCode} disabled={isSubmitting} className="csoj-btn csoj-btn-primary h-7 px-3 text-[12px] font-medium shadow-none">
                <CheckSquare size={12} />
                <span>{t.btnSubmit}</span>
              </button>
            </div>
          </div>

          <CodeEditor 
            code={code}
            onCodeChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onBlur={() => syncCodeToParent(latestCodeRef.current, selectedLang, problem.id)}
            selectedLang={selectedLang}
            editorFontSize={editorFontSize}
          />

          <ConsolePanel 
            isCollapsed={isConsoleCollapsed}
            setIsCollapsed={setIsConsoleCollapsed}
            activeTab={activeConsoleTab}
            setActiveTab={setActiveConsoleTab}
            problem={problem}
            selectedTestcaseIdx={selectedTestcaseIdx}
            setSelectedTestcaseIdx={setSelectedTestcaseIdx}
            isRunning={isRunning}
            compileError={compileError}
            lastResults={lastResults}
            language={language}
          />
        </div>
      </div>

      {/* FOOTER NAVIGATOR */}
      <div className="h-12 border-t border-[var(--border-element)] bg-[var(--bg-card)] px-4 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
        {problems.map((prob, idx) => {
          const isActive = prob.id === currentProblemId;
          const isPassed = codingAnswers[prob.id]?.passed;
          return (
            <button
              key={prob.id}
              onClick={() => setCurrentProblemId(prob.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-all border ${
                isActive ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {isPassed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              <span>{idx + 1}. {prob.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
