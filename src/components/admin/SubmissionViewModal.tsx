import React from 'react';
import { X, Code, CheckCircle, AlertTriangle } from 'lucide-react';
import { highlightCode } from '../../utils/highlighter';

interface SubmissionViewModalProps {
  viewingUserCode: { username: string; problemId: string; code: string; language: string; passed: boolean } | null;
  onClose: () => void;
}

export const SubmissionViewModal = React.memo(({ viewingUserCode, onClose }: SubmissionViewModalProps) => {
  if (!viewingUserCode) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-4xl w-full">
        <div className="flex items-center justify-between border-b border-[var(--border-element)] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-gradient)] text-white flex items-center justify-center font-bold">
              {viewingUserCode.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-[var(--text-primary)]">{viewingUserCode.username}</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Bài: {viewingUserCode.problemId}</span>
                <span>•</span>
                <span className={viewingUserCode.passed ? 'text-emerald-500' : 'text-red-500'}>
                  {viewingUserCode.passed ? 'ACCEPTED' : 'WRONG ANSWER'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-[var(--border-element)] bg-[var(--bg-editor)]">
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-editor-toolbar)] border-bottom border-[var(--border-element)]">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <Code size={12} />
              <span>{viewingUserCode.language} source code</span>
            </div>
          </div>
          <pre 
            className="p-6 overflow-auto max-h-[60vh] font-mono text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightCode(viewingUserCode.code, viewingUserCode.language as any) }}
          />
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="csoj-btn csoj-btn-secondary">
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
});
