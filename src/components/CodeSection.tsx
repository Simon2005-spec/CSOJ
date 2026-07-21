import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CodingProblem, SupportedLanguage } from '../types';
import { translations } from '../locales/translations';
import { evaluateCode } from '../lib/judge';
import { Play, CheckSquare, Terminal, ChevronRight, CheckCircle2, Circle, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { highlightCode } from '../utils/highlighter';
import { MarkdownRenderer } from './MarkdownRenderer';

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

  // Sync currentProblemId if the currently selected problem no longer exists
  useEffect(() => {
    if (problems.length > 0 && !problems.some((p) => p.id === currentProblemId)) {
      setCurrentProblemId(problems[0].id);
    }
  }, [problems, currentProblemId, setCurrentProblemId]);

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('cpp');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'info' | 'success' | 'error' | 'stdout'; message: string }[]>([]);

  // LeetCode Console States
  const [lastResults, setLastResults] = useState<any[] | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [selectedTestcaseIdx, setSelectedTestcaseIdx] = useState<number>(0);
  const [compileError, setCompileError] = useState<string | null>(null);

  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('csoj_editor_font_size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 12 && parsed <= 24) {
          return parsed;
        }
      }
    } catch (e) {}
    return 14;
  });

  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('csoj_console_collapsed');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('csoj_editor_font_size', editorFontSize.toString());
    } catch (e) {}
  }, [editorFontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('csoj_console_collapsed', isConsoleCollapsed.toString());
    } catch (e) {}
  }, [isConsoleCollapsed]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const latestCodeRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync latestCodeRef with local state code
  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Sync textarea code with local state when problem, language or reset state changes
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

  // Synchronize scrolling of code editor, highlighted pre, and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current) {
      if (gutterRef.current) {
        gutterRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  // Sync scroll on code/lang changes to prevent offsets
  useEffect(() => {
    handleScroll();
  }, [code, selectedLang]);

  // Generate line numbers
  const lineNumbers = useMemo(() => {
    const lines = code.split('\n');
    return Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);
  }, [code]);

  const syncCodeToParent = (codeToSync: string, langToSync: SupportedLanguage) => {
    if (!problem) return;
    setCodingAnswers((prev) => {
      const prevProblem = prev[problem.id] || {
        code: '',
        language: langToSync,
        passed: false
      };
      const updatedCodes = {
        ...((prevProblem as any).codes || {}),
        [langToSync]: codeToSync
      };
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
  };

  const handleCodeChange = (newCode: string) => {
    if (!problem) return;
    setCode(newCode);
    latestCodeRef.current = newCode;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      syncCodeToParent(newCode, selectedLang);
    }, 500);
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    syncCodeToParent(latestCodeRef.current, selectedLang);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    if (!problem) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSelectedLang(lang);
    const prevProblem = codingAnswers[problem.id];
    const savedCode = prevProblem && (prevProblem as any).codes && (prevProblem as any).codes[lang] !== undefined
      ? (prevProblem as any).codes[lang]
      : (problem.defaultCode[lang as keyof typeof problem.defaultCode] || '');
    
    setCode(savedCode);
    latestCodeRef.current = savedCode;

    setCodingAnswers((prev) => {
      const prevProblem = prev[problem.id];
      const updatedCodes = {
        ...((prevProblem as any)?.codes || {}),
        [lang]: savedCode
      };

      return {
        ...prev,
        [problem.id]: {
          code: savedCode,
          language: lang,
          passed: prevProblem?.passed || false,
          codes: updatedCodes
        } as any
      };
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = textarea.value;

      const spaces = '    ';
      const newVal = currentVal.substring(0, start) + spaces + currentVal.substring(end);

      handleCodeChange(newVal);

      // Reset caret position in next tick
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  const runCode = async () => {
    if (!problem) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    syncCodeToParent(latestCodeRef.current, selectedLang);

    setIsRunning(true);
    setIsConsoleCollapsed(false);
    setActiveConsoleTab('result');
    setCompileError(null);
    setLastResults(null);
    setSelectedTestcaseIdx(0);

    // Short simulated delay to feel like a real compile/run environment
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const results = await evaluateCode(latestCodeRef.current, selectedLang, problem, language);
      const allPassed = results.every(r => r.passed);

      setLastResults(results);

      setCodingAnswers((prev) => {
        const prevProblem = prev[problem.id] || {};
        const updatedCodes = {
          ...((prevProblem as any).codes || {}),
          [selectedLang]: latestCodeRef.current
        };
        return {
          ...prev,
          [problem.id]: {
            code: latestCodeRef.current,
            language: selectedLang,
            passed: allPassed,
            codes: updatedCodes
          } as any
        };
      });
    } catch (err: any) {
      setCompileError(err.message);
    }
    setIsRunning(false);
  };

  const submitCode = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    await runCode();
    setIsSubmitting(false);
  };

  if (!problem) {
    return (
      <div className="workspace-wrapper" id="coding-workspace-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', padding: '2rem' }}>
        <div className="liquid-glass" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '1rem', border: '1px solid var(--border-element)', maxWidth: '500px', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {language === 'vi' ? 'Chưa có bài thi nào' : 'There are no exam problems yet'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            {language === 'vi' 
              ? 'Hiện tại hệ thống chưa có câu hỏi/bài thi nào được nạp. Vui lòng quay lại sau.'
              : 'There are currently no questions/exams loaded in the system. Please come back later.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-wrapper" id="coding-workspace-container">
      <div className="workspace-grid">
        
        {/* LEFT PANEL: Problem description details */}
        <div className="problem-panel">
          <div className="problem-header">
            <h2 className="problem-title">{problem.title}</h2>
            <span className={`badge-difficulty ${problem.difficulty === 'Dễ' ? 'easy' : 'medium'}`}>
              {problem.difficulty}
            </span>
          </div>

          {/* Description Prose Markdown */}
          <MarkdownRenderer className="problem-prose" content={problem.descriptionHtml} />

          {/* Input specification */}
          <div className="description-block">
            <span className="description-block-title">{t.inputLabel}</span>
            <MarkdownRenderer className="description-block-text" content={problem.inputFormat} />
          </div>

          {/* Output specification */}
          <div className="description-block">
            <span className="description-block-title">{t.outputLabel}</span>
            <MarkdownRenderer className="description-block-text" content={problem.outputFormat} />
          </div>

          {/* Sample Examples */}
          {problem.examples && problem.examples.length > 0 && (
            <>
              <span className="examples-header">{t.testCasesLabel}</span>
              {problem.examples.map((ex, idx) => (
                <div className="example-box" key={idx}>
                  <div className="example-grid">
                    <div className="example-io">
                      <span className="example-io-label">Input</span>
                      <pre className="example-io-pre">{ex.input}</pre>
                    </div>
                    <div className="example-io">
                      <span className="example-io-label">Output</span>
                      <pre className="example-io-pre indigo-color">{ex.output}</pre>
                    </div>
                  </div>
                  {ex.explanation && (
                    <p className="example-explanation">
                      <strong>{t.explanationLabel}</strong> {ex.explanation}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Constraints */}
          {problem.constraints && problem.constraints.length > 0 && (
            <div className="description-block">
              <span className="description-block-title">{t.constraintsLabel}</span>
              <ul className="constraints-list">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Live Editor & Output Console */}
        <div className="editor-panel" style={{ minHeight: 0 }}>
          
          {/* Editor Header Toolbar */}
          <div className="editor-toolbar">
            <div className="editor-lang-selector-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="lang-selector"
              >
                <option value="cpp">C++ 17</option>
                <option value="python">Python 3</option>
                <option value="pascal">Pascal</option>
              </select>

              {/* Font Sizing / Zoom Controller */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-input)', padding: '0.125rem 0.375rem', borderRadius: '0.5rem', border: '1px solid var(--border-element)', height: '26px' }}>
                <button
                  onClick={() => setEditorFontSize(prev => Math.max(12, prev - 1))}
                  className="console-clear-btn"
                  style={{ padding: '0.125rem', minHeight: 'auto', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                  title="Thu nhỏ chữ (A-)"
                >
                  <ZoomOut size={12} />
                </button>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '2.2rem', textAlign: 'center', userSelect: 'none', fontFamily: 'var(--font-mono)' }}>
                  {editorFontSize}px
                </span>
                <button
                  onClick={() => setEditorFontSize(prev => Math.min(24, prev + 1))}
                  className="console-clear-btn"
                  style={{ padding: '0.125rem', minHeight: 'auto', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                  title="Phóng to chữ (A+)"
                >
                  <ZoomIn size={12} />
                </button>
              </div>
            </div>

            <div className="editor-action-group">
              <button
                onClick={runCode}
                disabled={isRunning || isSubmitting}
                className="csoj-btn csoj-btn-outline"
                style={{ padding: '0.25rem 0.75rem' }}
              >
                <Play size={11} style={{ fill: '#10b981', stroke: 'none' }} />
                <span>{t.btnRun}</span>
              </button>
              
              <button
                onClick={submitCode}
                disabled={isRunning || isSubmitting}
                className="csoj-btn csoj-btn-primary"
                style={{ padding: '0.25rem 0.875rem' }}
              >
                <CheckSquare size={11} />
                <span>{t.btnSubmit}</span>
              </button>
            </div>
          </div>

          {/* Editor Textarea with line gutters */}
          <div className="editor-textarea-container" style={{ minHeight: 0 }}>
            <div 
              className="editor-gutter" 
              ref={gutterRef}
              style={{
                fontSize: `${Math.max(10, editorFontSize - 2)}px`,
                paddingTop: `${Math.round(editorFontSize * 0.75)}px`,
                paddingBottom: `${Math.round(editorFontSize * 0.75)}px`,
              }}
            >
              {lineNumbers.map((num) => (
                <div 
                  key={num} 
                  className="editor-gutter-line"
                  style={{
                    height: `${Math.round(editorFontSize * 1.55)}px`,
                    lineHeight: `${Math.round(editorFontSize * 1.55)}px`,
                  }}
                >
                  {num}
                </div>
              ))}
            </div>

            <div className="editor-input-area" style={{ minHeight: 0 }}>
              <pre 
                ref={highlightRef} 
                className="editor-highlight" 
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: highlightCode(code, selectedLang) }}
                style={{
                  fontSize: `${editorFontSize}px`,
                  lineHeight: `${Math.round(editorFontSize * 1.55)}px`,
                  paddingTop: `${Math.round(editorFontSize * 0.75)}px`,
                  paddingBottom: `${Math.round(editorFontSize * 0.75)}px`,
                }}
              />
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                onBlur={handleBlur}
                className="editor-textarea"
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                style={{
                  fontSize: `${editorFontSize}px`,
                  lineHeight: `${Math.round(editorFontSize * 1.55)}px`,
                  paddingTop: `${Math.round(editorFontSize * 0.75)}px`,
                  paddingBottom: `${Math.round(editorFontSize * 0.75)}px`,
                }}
              />
            </div>
          </div>

          {/* LeetCode style Console Panel */}
          <div 
            className="console-panel"
            style={{
              height: isConsoleCollapsed ? '36px' : '280px',
              transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div className="console-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', height: '36px', borderBottom: '1px solid var(--border-element)', background: 'var(--bg-editor-toolbar)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '100%' }}>
                <button 
                  onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
                  className="console-collapse-toggle-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}
                >
                  <Terminal size={12} style={{ color: '#3b82f6' }} />
                  <span>Console</span>
                  {isConsoleCollapsed ? <ChevronUp size={12} style={{ opacity: 0.6 }} /> : <ChevronDown size={12} style={{ opacity: 0.6 }} />}
                </button>

                {!isConsoleCollapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '100%' }}>
                    <button
                      onClick={() => setActiveConsoleTab('testcase')}
                      style={{
                        height: '100%',
                        padding: '0 0.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeConsoleTab === 'testcase' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeConsoleTab === 'testcase' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: activeConsoleTab === 'testcase' ? 600 : 400,
                        fontSize: '0.725rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {language === 'vi' ? 'Bộ test mẫu' : 'Testcase'}
                    </button>
                    <button
                      onClick={() => setActiveConsoleTab('result')}
                      style={{
                        height: '100%',
                        padding: '0 0.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeConsoleTab === 'result' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeConsoleTab === 'result' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: activeConsoleTab === 'result' ? 600 : 400,
                        fontSize: '0.725rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {language === 'vi' ? 'Kết quả chạy' : 'Result'}
                    </button>
                  </div>
                )}
              </div>

              {!isConsoleCollapsed && lastResults && (
                <button 
                  onClick={() => {
                    setLastResults(null);
                    setCompileError(null);
                    setActiveConsoleTab('testcase');
                  }} 
                  className="console-clear-btn" 
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}
                >
                  {language === 'vi' ? 'Xóa kết quả' : 'Clear results'}
                </button>
              )}
            </div>

            {/* Console Content */}
            <div 
              className="console-body"
              style={{
                display: isConsoleCollapsed ? 'none' : 'flex',
                flexDirection: 'column',
                flex: 1,
                overflowY: 'auto',
                background: 'var(--bg-console)',
                padding: '1rem',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                gap: '0.75rem'
              }}
            >
              {/* Tab 1: Testcase */}
              {activeConsoleTab === 'testcase' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Testcase selectors */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {problem.testCases.map((tc, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTestcaseIdx(idx)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.6875rem',
                          fontWeight: selectedTestcaseIdx === idx ? 600 : 400,
                          background: selectedTestcaseIdx === idx ? 'var(--bg-hover)' : 'rgba(255, 255, 255, 0.02)',
                          border: selectedTestcaseIdx === idx ? '1px solid var(--border-element)' : '1px solid transparent',
                          color: selectedTestcaseIdx === idx ? 'var(--text-primary)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Selected case details */}
                  {problem.testCases[selectedTestcaseIdx] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Display arguments/inputs nicely */}
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                          {language === 'vi' ? 'Dữ liệu đầu vào (Input):' : 'Input:'}
                        </div>
                        <pre style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6875rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'pre-wrap',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {problem.testCases[selectedTestcaseIdx].rawInput || problem.testCases[selectedTestcaseIdx].input.join('\n')}
                        </pre>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                          {language === 'vi' ? 'Kết quả kỳ vọng (Expected Output):' : 'Expected Output:'}
                        </div>
                        <pre style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6875rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'pre-wrap',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {Array.isArray(problem.testCases[selectedTestcaseIdx].expected) 
                            ? problem.testCases[selectedTestcaseIdx].expected.join(' ') 
                            : String(problem.testCases[selectedTestcaseIdx].expected)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Result */}
              {activeConsoleTab === 'result' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {isRunning ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem 0', gap: '0.75rem' }}>
                      <div className="status-indicator-dot animate-pulse" style={{ width: '12px', height: '12px', background: '#3b82f6' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {language === 'vi' ? 'Đang thực thi các bộ test...' : 'Running test cases...'}
                      </span>
                    </div>
                  ) : compileError ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ef4444' }}>
                        {language === 'vi' ? 'Lỗi Biên Dịch / Lỗi Thực Thi (Error):' : 'Compilation / Runtime Error:'}
                      </div>
                      <pre style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6875rem',
                        color: '#fca5a5',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '180px',
                        overflowY: 'auto'
                      }}>
                        {compileError}
                      </pre>
                    </div>
                  ) : lastResults ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* Status Verdict */}
                      {(() => {
                        const allPassed = lastResults.every(r => r.passed);
                        const passedCount = lastResults.filter(r => r.passed).length;
                        const totalCount = lastResults.length;
                        const verdictColor = allPassed ? '#2cbb5d' : '#ef4743';
                        return (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: verdictColor }}>
                              {allPassed ? (language === 'vi' ? 'Đã Chấp Nhận (Accepted)' : 'Accepted') : (language === 'vi' ? 'Sai Đáp Án (Wrong Answer)' : 'Wrong Answer')}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                              {language === 'vi' ? `Vượt qua: ${passedCount}/${totalCount} bộ test` : `Passed: ${passedCount}/${totalCount} test cases`}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Testcase selector row with pass/fail indicator */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {lastResults.map((res, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedTestcaseIdx(idx)}
                            style={{
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.6875rem',
                              fontWeight: selectedTestcaseIdx === idx ? 600 : 400,
                              background: selectedTestcaseIdx === idx ? 'var(--bg-hover)' : 'rgba(255, 255, 255, 0.02)',
                              border: selectedTestcaseIdx === idx ? `1px solid ${res.passed ? '#10b981' : '#ef4444'}` : '1px solid transparent',
                              color: res.passed ? '#10b981' : '#f87171',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: res.passed ? '#10b981' : '#ef4444'
                            }} />
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>

                      {/* Show the selected run case result details */}
                      {lastResults[selectedTestcaseIdx] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            <div>⏱️ {language === 'vi' ? 'Thời gian chạy:' : 'Runtime:'} <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{lastResults[selectedTestcaseIdx].time || '0 ms'}</strong></div>
                            <div>💾 {language === 'vi' ? 'Bộ nhớ đã dùng:' : 'Memory:'} <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{lastResults[selectedTestcaseIdx].memory || '0 MB'}</strong></div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                              Input:
                            </div>
                            <pre style={{
                              background: 'rgba(0,0,0,0.2)',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.6875rem',
                              color: 'var(--text-primary)',
                              whiteSpace: 'pre-wrap',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              {lastResults[selectedTestcaseIdx].input}
                            </pre>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                              {language === 'vi' ? 'Đầu ra thực tế (Output):' : 'Output:'}
                            </div>
                            <pre style={{
                              background: lastResults[selectedTestcaseIdx].passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                              border: lastResults[selectedTestcaseIdx].passed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.6875rem',
                              color: lastResults[selectedTestcaseIdx].passed ? '#34d399' : '#f87171',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {lastResults[selectedTestcaseIdx].actual || ' '}
                            </pre>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                              Expected:
                            </div>
                            <pre style={{
                              background: 'rgba(0,0,0,0.2)',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.6875rem',
                              color: 'var(--text-primary)',
                              whiteSpace: 'pre-wrap',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              {lastResults[selectedTestcaseIdx].expected}
                            </pre>
                          </div>

                          {lastResults[selectedTestcaseIdx].stdout && lastResults[selectedTestcaseIdx].stdout.trim() !== '' && (
                            <div>
                              <div style={{ fontSize: '0.6875rem', color: '#60a5fa', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Terminal size={12} />
                                <span>{language === 'vi' ? 'Nhật ký Debug (stdout / print):' : 'Debug Console Output (stdout / print):'}</span>
                              </div>
                              <pre style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.6875rem',
                                color: '#93c5fd',
                                whiteSpace: 'pre-wrap',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                              }}>
                                {lastResults[selectedTestcaseIdx].stdout}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem 0', color: 'var(--text-muted)' }}>
                      <span>{language === 'vi' ? 'Hãy chạy code để xem kết quả!' : 'Run code to see execution result!'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER NAVIGATOR: Tabs for problems switching */}
      <div className="navigator-panel">
        <div className="navigator-tabs-container">
          {problems.map((prob, idx) => {
            const isCompleted = codingAnswers[prob.id]?.passed;
            const isActive = prob.id === currentProblemId;
            return (
              <button
                key={prob.id}
                onClick={() => setCurrentProblemId(prob.id)}
                className={`navigator-tab ${isActive ? 'active' : ''}`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                ) : (
                  <Circle size={13} style={{ color: '#64748b' }} />
                )}
                <span>
                  {t.problemLabel} {idx + 1}: {prob.title}
                </span>
                <ChevronRight size={10} style={{ marginLeft: 'auto', opacity: isActive ? 1 : 0.3 }} />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
