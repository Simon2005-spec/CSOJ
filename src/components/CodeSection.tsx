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
      return saved ? parseInt(saved, 10) : 14;
    } catch (e) { return 14; }
  });

  useEffect(() => {
    localStorage.setItem('csoj_editor_font_size', editorFontSize.toString());
  }, [editorFontSize]);

  const latestCodeRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (!problem) return;
    const saved = codingAnswers[problem.id];
    let initialCode = '';
    if (saved && (saved as any).codes && (saved as any).codes[selectedLang] !== undefined) {
      initialCode = (saved as any).codes[selectedLang];
    } else if (saved && saved.language === selectedLang) {
      initialCode = saved.code;
    } else {
      initialCode = problem.defaultCode[selectedLang as keyof typeof problem.defaultCode] || '';
    }
    setCode(initialCode);
    latestCodeRef.current = initialCode;
  }, [problem?.id, selectedLang, Object.keys(codingAnswers).length === 0]);

  const syncCodeToParent = useCallback((codeToSync: string, langToSync: SupportedLanguage) => {
    if (!problem) return;
    setCodingAnswers((prev) => {
      const prevProblem = prev[problem.id] || { code: '', language: langToSync, passed: false };
      const updatedCodes = { ...((prevProblem as any).codes || {}), [langToSync]: codeToSync };
      return {
        ...prev,
        [problem.id]: {
          code: codeToSync,
          language: langToSync,
          passed: prevProblem.passed || false,
          codes: updatedCodes
        } as any
      };
    });
  }, [problem, setCodingAnswers]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    latestCodeRef.current = newCode;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      syncCodeToParent(newCode, selectedLang);
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
    setSelectedLang(lang);
    const prevProblem = codingAnswers[problem.id];
    const savedCode = (prevProblem as any)?.codes?.[lang] ?? problem.defaultCode[lang] ?? '';
    setCode(savedCode);
    latestCodeRef.current = savedCode;
    syncCodeToParent(savedCode, lang);
  };

  const runCode = async () => {
    if (!problem) return;
    syncCodeToParent(latestCodeRef.current, selectedLang);
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
      
      setCodingAnswers(prev => ({
        ...prev,
        [problem.id]: {
          ...prev[problem.id],
          passed: allPassed
        } as any
      }));
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
    <div className="workspace-wrapper flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[40%] flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-[var(--border-element)] bg-[var(--bg-card)]/50">
          <ProblemDescription problem={problem} language={language} />
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[60%] flex flex-col min-h-0 bg-[var(--bg-editor)]">
          <div className="editor-toolbar h-10 flex items-center justify-between px-3 shrink-0 bg-[var(--bg-editor-toolbar)] border-b border-[var(--border-element)]">
            <div className="flex items-center gap-2">
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-[var(--bg-input)] text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--border-element)] outline-none cursor-pointer"
              >
                <option value="cpp">C++ 17</option>
                <option value="python">Python 3</option>
                <option value="pascal">Pascal</option>
              </select>

              <div className="flex items-center gap-1 bg-[var(--bg-input)] px-1 py-0.5 rounded border border-[var(--border-element)]">
                <button onClick={() => setEditorFontSize(v => Math.max(12, v-1))} className="p-0.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)]"><ZoomOut size={10} /></button>
                <span className="text-[9px] font-mono font-bold min-w-[1.5rem] text-center">{editorFontSize}px</span>
                <button onClick={() => setEditorFontSize(v => Math.min(24, v+1))} className="p-0.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)]"><ZoomIn size={10} /></button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button onClick={runCode} disabled={isRunning} className="csoj-btn csoj-btn-outline py-1 px-2.5 text-[10px]">
                <Play size={10} className="fill-emerald-500 stroke-none" />
                <span>{t.btnRun}</span>
              </button>
              <button onClick={submitCode} disabled={isSubmitting} className="csoj-btn csoj-btn-primary py-1 px-2.5 text-[10px]">
                <CheckSquare size={10} />
                <span>{t.btnSubmit}</span>
              </button>
            </div>
          </div>

          <CodeEditor 
            code={code}
            onCodeChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onBlur={() => syncCodeToParent(latestCodeRef.current, selectedLang)}
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
