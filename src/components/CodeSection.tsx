import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CodingProblem, SupportedLanguage } from '../types';
import { translations } from '../locales/translations';
import { evaluateCode } from '../lib/judge';
import { Play, CheckSquare, Terminal, ChevronRight, CheckCircle2, Circle, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { highlightCode } from '../utils/highlighter';
import Markdown from 'react-markdown';

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
    setConsoleLogs([{ type: 'info', message: t.initRunner }]);

    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const displayLangName = selectedLang === 'cpp' ? 'C++ 17' : selectedLang === 'python' ? 'Python 3' : 'Pascal';
      setConsoleLogs((prev) => [...prev, { type: 'info', message: t.compilingMsg.replace('{lang}', displayLangName) }]);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const results = evaluateCode(latestCodeRef.current, selectedLang, problem, language);
      const allPassed = results.every(r => r.passed);

      setConsoleLogs((prev) => [
        ...prev,
        ...results.map((r) => ({
          type: (r.passed ? 'stdout' : 'error') as any,
          message: r.message
        })),
        {
          type: allPassed ? 'success' : 'error',
          message: allPassed ? t.allPassedMsg : t.incorrectLogicMsg
        }
      ]);

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
      setConsoleLogs((prev) => [...prev, { type: 'error', message: err.message }]);
    }
    setIsRunning(false);
  };

  const submitCode = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setConsoleLogs((prev) => [...prev, { type: 'info', message: t.submittingToJudge }]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
          <div className="problem-prose">
            <Markdown>{problem.descriptionHtml}</Markdown>
          </div>

          {/* Input specification */}
          <div className="description-block">
            <span className="description-block-title">{t.inputLabel}</span>
            <div className="description-block-text">
              <Markdown>{problem.inputFormat}</Markdown>
            </div>
          </div>

          {/* Output specification */}
          <div className="description-block">
            <span className="description-block-title">{t.outputLabel}</span>
            <div className="description-block-text">
              <Markdown>{problem.outputFormat}</Markdown>
            </div>
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

          {/* Console Output Logs Panel */}
          <div 
            className="console-panel"
            style={{
              height: isConsoleCollapsed ? '34px' : '180px',
              transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
              minHeight: 0
            }}
          >
            <div 
              className="console-header" 
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
            >
              <span className="console-title" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Terminal size={11} />
                <span>{t.consoleTitle}</span>
                {isConsoleCollapsed ? <ChevronUp size={11} style={{ opacity: 0.6 }} /> : <ChevronDown size={11} style={{ opacity: 0.6 }} />}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setConsoleLogs([])} className="console-clear-btn" title="Xóa logs">
                  Xóa
                </button>
              </div>
            </div>

            <div 
              className="console-logs-container"
              style={{
                opacity: isConsoleCollapsed ? 0 : 1,
                visibility: isConsoleCollapsed ? 'hidden' : 'visible',
                transition: 'opacity 0.2s ease, visibility 0.2s ease',
                flex: 1,
                overflowY: 'auto'
              }}
            >
              {consoleLogs.length === 0 ? (
                <span className="console-empty">{t.consoleEmpty}</span>
              ) : (
                consoleLogs.map((log, index) => (
                  <div key={index} className={`console-log-row log-${log.type}`}>
                    {log.message}
                  </div>
                ))
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
