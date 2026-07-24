import React from 'react';
import { CodingProblem } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { translations } from '../../locales/translations';

interface ProblemDescriptionProps {
  problem: CodingProblem;
  language: 'vi' | 'en';
}

export const ProblemDescription = React.memo(({ problem, language }: ProblemDescriptionProps) => {
  const t = translations[language];

  return (
    <div className="problem-panel flex flex-col gap-6 p-5 h-full overflow-y-auto bg-[var(--bg-card)]">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {problem.title}
          </h1>
          <span className={`badge-difficulty ${problem.difficulty === 'Dễ' ? 'easy' : problem.difficulty === 'Trung bình' ? 'medium' : 'hard'}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
            Algorithm
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
            Competitive
          </div>
        </div>
      </div>

      {/* Description Prose Markdown */}
      <div className="problem-prose text-[var(--text-primary)] text-[14px] leading-relaxed opacity-95">
        <MarkdownRenderer content={problem.descriptionHtml} />
      </div>

      <div className="h-px bg-[var(--border-element)] w-full opacity-10" />

      {/* Input specification */}
      {problem.inputFormat && (
        <div className="space-y-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-blue-500/30 rounded-full" />
            <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">{t.inputLabel}</span>
          </div>
          <div className="description-block-text text-[13px] leading-relaxed text-[var(--text-secondary)] ml-3">
            <MarkdownRenderer content={problem.inputFormat} />
          </div>
        </div>
      )}

      {/* Output specification */}
      {problem.outputFormat && (
        <div className="space-y-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-emerald-500/30 rounded-full" />
            <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">{t.outputLabel}</span>
          </div>
          <div className="description-block-text text-[13px] leading-relaxed text-[var(--text-secondary)] ml-3">
            <MarkdownRenderer content={problem.outputFormat} />
          </div>
        </div>
      )}

      {/* Sample Examples */}
      {problem.examples && problem.examples.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#ffa116]/40 rounded-full" />
            <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">{t.testCasesLabel}</span>
          </div>
          <div className="space-y-4 ml-3">
            {problem.examples.map((ex, idx) => (
              <div className="flex flex-col gap-2.5 group" key={idx}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Example {idx + 1}</span>
                  <div className="h-px flex-1 bg-[var(--border-element)] opacity-10" />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 opacity-60">
                      Input
                    </span>
                    <pre className="bg-[#1a1a1a] p-3 rounded-md border border-[var(--border-element)] font-mono text-[12px] text-[var(--text-primary)] overflow-x-auto">
                      {ex.input}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 opacity-60">
                      Output
                    </span>
                    <pre className="bg-[#1a1a1a] p-3 rounded-md border border-[var(--border-element)] font-mono text-[12px] text-[var(--text-primary)] overflow-x-auto">
                      {ex.output}
                    </pre>
                  </div>
                </div>
                {ex.explanation && (
                  <div className="text-[12px] text-[var(--text-secondary)] leading-normal bg-[#333333]/10 p-3 rounded-md border-l border-[#ffa116]/20">
                    <span className="text-[#ffa116] font-bold uppercase text-[9px] tracking-wider block mb-0.5 opacity-70">{t.explanationLabel}</span>
                    {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && problem.constraints.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-red-500/30 rounded-full" />
            <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">{t.constraintsLabel}</span>
          </div>
          <div className="bg-[#333333]/5 p-3 rounded-md border border-[var(--border-element)] ml-3">
            <ul className="space-y-1.5">
              {problem.constraints.map((c, i) => (
                <li key={i} className="text-[12px] text-[var(--text-secondary)] flex items-start gap-2">
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-[#ffa116]/20 shrink-0" />
                  <span className="leading-normal font-mono opacity-80">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
});
