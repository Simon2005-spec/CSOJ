import React from 'react';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
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
        height: isCollapsed ? '36px' : '280px',
        transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div className="console-header flex items-center justify-between px-3 h-10 shrink-0 border-b border-[var(--border-element)] bg-[var(--bg-editor-toolbar)] shadow-sm">
        <div className="flex items-center gap-4 h-full">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-hover)] px-2 py-1 rounded transition-all"
          >
            <Terminal size={14} className="text-[#ffa116]" />
            <span>Console</span>
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {!isCollapsed && (
            <div className="flex items-center h-full gap-2">
              <div className="h-4 w-px bg-[var(--border-element)] mx-1" />
              <button
                onClick={() => setActiveTab('testcase')}
                className={`h-7 px-4 text-[11px] font-bold uppercase tracking-wide rounded-md transition-all flex items-center ${
                  activeTab === 'testcase' 
                    ? 'bg-[#333] text-[var(--text-primary)] border border-[#444]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span>{language === 'vi' ? 'Bộ thử' : 'Testcases'}</span>
              </button>
              <button
                onClick={() => setActiveTab('result')}
                className={`h-7 px-4 text-[11px] font-bold uppercase tracking-wide rounded-md transition-all flex items-center ${
                  activeTab === 'result' 
                    ? 'bg-[#333] text-[var(--text-primary)] border border-[#444]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span>{language === 'vi' ? 'Kết quả' : 'Result'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="console-body flex-1 overflow-y-auto bg-[#1e1e1e] p-5 font-sans text-xs">
          {activeTab === 'testcase' ? (
            <div className="flex flex-col gap-5">
              <div className="flex gap-2 flex-wrap">
                {problem.testCases.map((tc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTestcaseIdx(idx)}
                    className={`h-7 px-3 rounded-md text-[10px] font-bold transition-all border ${
                      selectedTestcaseIdx === idx 
                        ? 'bg-[#ffa116] border-[#ffa116] text-black' 
                        : 'bg-[#333] border-[#444] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              {problem.testCases[selectedTestcaseIdx] && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-3 bg-blue-500/50 rounded-full" />
                      Input:
                    </span>
                    <pre className="p-3.5 rounded-lg bg-[#1a1a1a] font-mono text-[12px] border border-[var(--border-element)] text-[var(--text-primary)]">
                      {problem.testCases[selectedTestcaseIdx].rawInput || problem.testCases[selectedTestcaseIdx].input.join('\n')}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-3 bg-emerald-500/50 rounded-full" />
                      Expected Output:
                    </span>
                    <pre className="p-3.5 rounded-lg bg-[#1a1a1a] font-mono text-[12px] border border-[var(--border-element)] text-[var(--text-primary)]">
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
                <div className="flex flex-col items-center justify-center flex-1 gap-3 opacity-80">
                  <div className="w-8 h-8 border-2 border-[#ffa116] border-t-transparent rounded-full animate-spin" />
                  <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#ffa116]">Judging...</span>
                </div>
              ) : compileError ? (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-[11px]">
                    <div className="w-1.5 h-4 bg-red-500/50 rounded-full" />
                    Runtime Error
                  </div>
                  <pre className="p-5 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 font-mono text-[12px] whitespace-pre-wrap leading-relaxed">
                    {compileError}
                  </pre>
                </div>
              ) : lastResults ? (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between bg-[var(--bg-hover)] p-3 rounded-xl border border-[var(--border-element)]">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold tracking-tight ${lastResults.every(r => r.passed) ? 'text-[#2cbb5d]' : 'text-red-500'}`}>
                        {lastResults.every(r => r.passed) ? 'SCORE: 100/100' : `SCORE: ${Math.floor((lastResults.filter(r => r.passed).length / lastResults.length) * 100)}/100`}
                      </span>
                      <div className="h-5 w-px bg-[var(--border-element)]" />
                      <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                        {lastResults.filter(r => r.passed).length} / {lastResults.length} test cases passed
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {lastResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTestcaseIdx(idx)}
                        className={`h-6 px-2 rounded-md text-[9px] font-black transition-all border flex items-center gap-1.5 ${
                          selectedTestcaseIdx === idx 
                            ? 'bg-[#333] border-[#666]' 
                            : 'bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                        } ${res.passed ? 'text-[#2cbb5d]' : 'text-red-400'}`}
                      >
                        <div className={`w-1 h-1 rounded-full ${res.passed ? 'bg-[#2cbb5d]' : 'bg-red-500'}`} />
                        #{idx + 1}: {res.passed ? 'AC' : (res.verdict || 'WA')}
                      </button>
                    ))}
                  </div>

                  {lastResults[selectedTestcaseIdx] && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      <div className="flex items-center gap-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-app)]/50 p-2.5 rounded-lg border border-[var(--border-element)]/50">
                        <span className="flex items-center gap-2">Time: <span className="text-[var(--text-primary)]">{lastResults[selectedTestcaseIdx].time || '0ms'}</span></span>
                        <span className="flex items-center gap-2">Memory: <span className="text-[var(--text-primary)]">{lastResults[selectedTestcaseIdx].memory || '0MB'}</span></span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-3 bg-blue-500/50 rounded-full" />
                            Your Output:
                          </span>
                          <pre className={`p-3.5 rounded-lg font-mono text-[12px] border overflow-x-auto ${
                            lastResults[selectedTestcaseIdx].passed 
                              ? 'bg-[#2cbb5d]/5 border-[#2cbb5d]/20 text-[#2cbb5d]' 
                              : 'bg-red-500/5 border-red-500/20 text-red-400'
                          }`}>
                            {lastResults[selectedTestcaseIdx].actual || '(empty)'}
                          </pre>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-3 bg-emerald-500/50 rounded-full" />
                            Expected:
                          </span>
                          <pre className="p-3.5 rounded-lg bg-[#1a1a1a] font-mono text-[12px] border border-[var(--border-element)] text-[var(--text-primary)] overflow-x-auto">
                            {lastResults[selectedTestcaseIdx].expected}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full opacity-40 italic text-[12px] font-medium tracking-wide">
                  Run code to see test results...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
