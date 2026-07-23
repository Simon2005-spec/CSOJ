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
    <div className="problem-panel flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {problem.title}
          </h2>
          <span className={`badge-difficulty ${problem.difficulty === 'Dễ' ? 'easy' : problem.difficulty === 'Trung bình' ? 'medium' : 'hard'}`}>
            {problem.difficulty}
          </span>
        </div>
      </div>

      {/* Description Prose Markdown */}
      <div className="problem-prose leading-relaxed text-[var(--text-secondary)] text-[12px]">
        <MarkdownRenderer content={problem.descriptionHtml} />
      </div>

      {/* Input specification */}
      {problem.inputFormat && (
        <div className="description-block">
          <span className="description-block-title">{t.inputLabel}</span>
          <div className="description-block-text mt-1">
            <MarkdownRenderer content={problem.inputFormat} />
          </div>
        </div>
      )}

      {/* Output specification */}
      {problem.outputFormat && (
        <div className="description-block">
          <span className="description-block-title">{t.outputLabel}</span>
          <div className="description-block-text mt-1">
            <MarkdownRenderer content={problem.outputFormat} />
          </div>
        </div>
      )}

      {/* Sample Examples */}
      {problem.examples && problem.examples.length > 0 && (
        <div className="flex flex-col gap-4">
          <span className="examples-header font-extrabold text-[var(--text-muted)] uppercase tracking-widest text-[10px]">
            {t.testCasesLabel}
          </span>
          {problem.examples.map((ex, idx) => (
            <div className="example-box liquid-glass border-[var(--border-element)] p-4 rounded-xl flex flex-col gap-3" key={idx}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="example-io flex flex-col gap-1.5">
                  <span className="example-io-label text-[10px] font-bold text-[var(--text-muted)] uppercase">Input</span>
                  <pre className="example-io-pre bg-black/10 dark:bg-white/5 p-3 rounded-lg font-mono text-xs whitespace-pre-wrap border border-[var(--border-element)]">
                    {ex.input}
                  </pre>
                </div>
                <div className="example-io flex flex-col gap-1.5">
                  <span className="example-io-label text-[10px] font-bold text-[var(--text-muted)] uppercase">Output</span>
                  <pre className="example-io-pre bg-indigo-500/5 text-indigo-500 p-3 rounded-lg font-mono text-xs whitespace-pre-wrap border border-indigo-500/20">
                    {ex.output}
                  </pre>
                </div>
              </div>
              {ex.explanation && (
                <p className="example-explanation text-xs text-[var(--text-muted)] italic leading-relaxed">
                  <strong className="text-[var(--text-secondary)] not-italic">{t.explanationLabel}</strong> {ex.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && problem.constraints.length > 0 && (
        <div className="description-block bg-[var(--bg-hover)]/30 p-4 rounded-xl border border-[var(--border-element)]">
          <span className="description-block-title text-[var(--text-primary)]">{t.constraintsLabel}</span>
          <ul className="constraints-list mt-2 space-y-1">
            {problem.constraints.map((c, i) => (
              <li key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
