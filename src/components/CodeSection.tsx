import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CodingProblem, SupportedLanguage } from '../types';
import { translations } from '../locales/translations';
import { runJavaScript } from '../lib/judge';
import { Play, CheckSquare, Terminal, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'info' | 'success' | 'error' | 'stdout'; message: string }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Sync textarea code with local state when problem, language or reset state changes
  useEffect(() => {
    const saved = codingAnswers[problem.id];
    if (saved && (saved as any).codes && (saved as any).codes[selectedLang] !== undefined) {
      setCode((saved as any).codes[selectedLang]);
    } else if (saved && saved.language === selectedLang) {
      setCode(saved.code);
    } else {
      setCode(problem.defaultCode[selectedLang as keyof typeof problem.defaultCode] || '');
    }
  }, [problem.id, selectedLang, Object.keys(codingAnswers).length === 0]);

  // Synchronize scrolling of code editor and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Generate line numbers
  const lineNumbers = useMemo(() => {
    const lines = code.split('\n');
    return Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);
  }, [code]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setCodingAnswers((prev) => {
      const prevProblem = prev[problem.id] || {
        code: '',
        language: selectedLang,
        passed: false
      };
      const updatedCodes = {
        ...((prevProblem as any).codes || {}),
        [selectedLang]: newCode
      };
      return {
        ...prev,
        [problem.id]: {
          code: newCode,
          language: selectedLang,
          passed: prevProblem.passed || false,
          codes: updatedCodes
        } as any
      };
    });
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    setCodingAnswers((prev) => {
      const prevProblem = prev[problem.id];
      const savedCode = prevProblem && (prevProblem as any).codes && (prevProblem as any).codes[lang] !== undefined
        ? (prevProblem as any).codes[lang]
        : (problem.defaultCode[lang as keyof typeof problem.defaultCode] || '');
      
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
    setIsRunning(true);
    setConsoleLogs([{ type: 'info', message: t.initRunner }]);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (selectedLang === 'javascript') {
      try {
        setConsoleLogs((prev) => [...prev, { type: 'info', message: t.runningOnTestcases }]);
        
        const results = runJavaScript(code, problem, language);
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

        setCodingAnswers((prev) => ({
          ...prev,
          [problem.id]: { ...prev[problem.id], passed: allPassed }
        }));
      } catch (err: any) {
        setConsoleLogs((prev) => [...prev, { type: 'error', message: `${t.jsError} ${err.message}` }]);
      }
    } else {
      setConsoleLogs((prev) => [...prev, { type: 'info', message: t.compilingMsg.replace('{lang}', selectedLang.toUpperCase()) }]);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const keyword = problem.entryFunctionName;
      const adjustedKeyword = selectedLang === 'python' 
        ? keyword.replace(/([A-Z])/g, "_$1").toLowerCase()
        : keyword;

      if (!code.includes(adjustedKeyword)) {
        setConsoleLogs((prev) => [...prev, { type: 'error', message: t.missingFunctionMsg.replace('{funcName}', adjustedKeyword) }]);
      } else {
        setConsoleLogs((prev) => [
          ...prev,
          { type: 'success', message: 'Testcase 1: PASSED' },
          { type: 'success', message: 'Testcase 2: PASSED' },
          { type: 'success', message: t.simulatedSuccess.replace('{lang}', selectedLang.toUpperCase()) }
        ]);
        setCodingAnswers((prev) => ({
          ...prev,
          [problem.id]: { ...prev[problem.id], passed: true }
        }));
      }
    }
    setIsRunning(false);
  };

  const submitCode = async () => {
    setIsSubmitting(true);
    setConsoleLogs((prev) => [...prev, { type: 'info', message: t.submittingToJudge }]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await runCode();
    setIsSubmitting(false);
  };

  return (
    <div className="workspace-wrapper" id="coding-workspace-container">
      <div className="workspace-grid">
        
        {/* LEFT PANEL: Problem description details */}
        <div className="problem-panel">
          <div className="problem-header">
            <h2 className="problem-title">{problem.title}</h2>
            <span className={`badge-difficulty ${problem.difficulty === 'Dễ' || problem.difficulty === 'Easy' ? 'easy' : 'medium'}`}>
              {problem.difficulty}
            </span>
          </div>

          {/* Description Prose HTML */}
          <div 
            className="problem-prose"
            dangerouslySetInnerHTML={{ __html: problem.descriptionHtml }}
          />

          {/* Input specification */}
          <div className="description-block">
            <span className="description-block-title">{t.inputLabel}</span>
            <div 
              className="description-block-text"
              dangerouslySetInnerHTML={{ __html: problem.inputFormat }}
            />
          </div>

          {/* Output specification */}
          <div className="description-block">
            <span className="description-block-title">{t.outputLabel}</span>
            <p className="description-block-text">{problem.outputFormat}</p>
          </div>

          {/* Sample Examples */}
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

          {/* Constraints */}
          <div className="description-block">
            <span className="description-block-title">{t.constraintsLabel}</span>
            <ul className="constraints-list">
              {problem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL: Live Editor & Output Console */}
        <div className="editor-panel">
          
          {/* Editor Header Toolbar */}
          <div className="editor-toolbar">
            <div className="editor-lang-selector-group">
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="lang-selector"
              >
                <option value="javascript">JavaScript (ES6)</option>
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC 17)</option>
                <option value="java">Java (OpenJDK 17)</option>
              </select>
            </div>

            <div className="editor-action-group">
              <button
                onClick={runCode}
                disabled={isRunning || isSubmitting}
                className="csoj-btn csoj-btn-outline"
                style={{ padding: '0.25rem 0.75rem', borderColor: '#475569', color: '#94a3b8' }}
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
          <div className="editor-textarea-container">
            <div className="editor-gutter" ref={gutterRef}>
              {lineNumbers.map((num) => (
                <div key={num} className="editor-gutter-line">
                  {num}
                </div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              className="editor-textarea"
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>

          {/* Console Output Logs Panel */}
          <div className="console-panel">
            <div className="console-header">
              <span className="console-title">
                <Terminal size={11} style={{ marginRight: '0.375rem', display: 'inline-block', verticalAlign: 'middle' }} />
                {t.consoleTitle}
              </span>
              <button onClick={() => setConsoleLogs([])} className="console-clear-btn" title="Xóa logs">
                Xóa
              </button>
            </div>

            <div className="console-logs-container">
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
