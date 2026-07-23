import React from 'react';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { CodingProblem } from '../../types';

interface ConsolePanelProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  activeTab: 'testcase' | 'result';
  setActiveTab: (t: 'testcase' | 'result') => void;
  problem: CodingProblem;
  selectedTestcaseIdx: number;
  setSelectedTestcaseIdx: (i: number) => void;
  isRunning: boolean;
  compileError: string | null;
  lastResults: any[] | null;
  language: 'vi' | 'en';
}

export const ConsolePanel = React.memo(({
  isCollapsed,
  setIsCollapsed,
  activeTab,
  setActiveTab,
  problem,
  selectedTestcaseIdx,
  setSelectedTestcaseIdx,
  isRunning,
  compileError,
  lastResults,
  language
}: ConsolePanelProps) => {
  return (
    <div 
      className="console-panel border-t border-[var(--border-element)] bg-[var(--bg-editor-toolbar)] flex flex-col"
      style={{
        height: isCollapsed ? '32px' : '240px',
        transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div className="console-header flex items-center justify-between px-3 h-8 shrink-0">
        <div className="flex items-center gap-4 h-full">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-primary)] hover:opacity-80 transition-opacity"
          >
            <Terminal size={10} className="text-indigo-500" />
            <span>Console</span>
            {isCollapsed ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {!isCollapsed && (
            <div className="flex items-center h-full">
              <button
                onClick={() => setActiveTab('testcase')}
                className={`h-full px-3 text-[9px] font-extrabold uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === 'testcase' ? 'border-indigo-500 text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)]'
                }`}
              >
                Testcase
              </button>
              <button
                onClick={() => setActiveTab('result')}
                className={`h-full px-3 text-[9px] font-extrabold uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === 'result' ? 'border-indigo-500 text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)]'
                }`}
              >
                {language === 'vi' ? 'Kết quả' : 'Result'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="console-body flex-1 overflow-y-auto bg-[var(--bg-editor)] p-3 font-sans text-[11px]">
          {activeTab === 'testcase' ? (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                {problem.testCases.map((tc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTestcaseIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      selectedTestcaseIdx === idx 
                        ? 'bg-[var(--bg-hover)] border-[var(--border-element)] text-[var(--text-primary)]' 
                        : 'bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              {problem.testCases[selectedTestcaseIdx] && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Input:</span>
                    <pre className="p-3 rounded-lg bg-black/10 dark:bg-white/5 font-mono text-[11px] border border-[var(--border-element)]">
                      {problem.testCases[selectedTestcaseIdx].rawInput || problem.testCases[selectedTestcaseIdx].input.join('\n')}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Expected Output:</span>
                    <pre className="p-3 rounded-lg bg-black/10 dark:bg-white/5 font-mono text-[11px] border border-[var(--border-element)]">
                      {Array.isArray(problem.testCases[selectedTestcaseIdx].expected) 
                        ? problem.testCases[selectedTestcaseIdx].expected.join(' ') 
                        : String(problem.testCases[selectedTestcaseIdx].expected)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {isRunning ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 opacity-60">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">Đang chạy thử...</span>
                </div>
              ) : compileError ? (
                <div className="flex flex-col gap-2">
                  <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">Lỗi thực thi:</span>
                  <pre className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 font-mono text-[11px] whitespace-pre-wrap">
                    {compileError}
                  </pre>
                </div>
              ) : lastResults ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-black tracking-tight ${lastResults.every(r => r.passed) ? 'text-emerald-500' : 'text-red-500'}`}>
                      {lastResults.every(r => r.passed) ? 'ACCEPTED' : 'WRONG ANSWER'}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">
                      {lastResults.filter(r => r.passed).length} / {lastResults.length} testcases passed
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {lastResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTestcaseIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-2 ${
                          selectedTestcaseIdx === idx 
                            ? 'bg-[var(--bg-hover)] border-[var(--border-element)]' 
                            : 'bg-transparent border-transparent'
                        } ${res.passed ? 'text-emerald-500' : 'text-red-400'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${res.passed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {lastResults[selectedTestcaseIdx] && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-bold opacity-60">
                        <span>Thời gian: {lastResults[selectedTestcaseIdx].time || '0ms'}</span>
                        <span>Bộ nhớ: {lastResults[selectedTestcaseIdx].memory || '0MB'}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Output:</span>
                        <pre className={`p-3 rounded-lg font-mono text-[11px] border ${
                          lastResults[selectedTestcaseIdx].passed 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                          {lastResults[selectedTestcaseIdx].actual || ' '}
                        </pre>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Expected:</span>
                        <pre className="p-3 rounded-lg bg-black/10 dark:bg-white/5 font-mono text-[11px] border border-[var(--border-element)]">
                          {lastResults[selectedTestcaseIdx].expected}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full opacity-40 italic">
                  Run code to see results...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
