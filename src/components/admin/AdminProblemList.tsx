import React from 'react';
import { Pencil, Trash2, Plus, Code } from 'lucide-react';
import { CodingProblem } from '../../types';

interface AdminProblemListProps {
  problems: CodingProblem[];
  onEdit: (prob: CodingProblem) => void;
  onDeleteRequest: (prob: CodingProblem) => void;
  onAddNew: () => void;
}

export const AdminProblemList = React.memo(({ 
  problems, 
  onEdit, 
  onDeleteRequest, 
  onAddNew 
}: AdminProblemListProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Quản lý Bài tập
          </h2>
          <p className="text-xs font-medium text-[var(--text-muted)] mt-1">
            Danh sách các bài toán lập trình đang có trên hệ thống
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="csoj-btn csoj-btn-primary"
        >
          <Plus size={16} />
          <span>Thêm Bài mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {problems.map((prob) => (
          <div 
            key={prob.id} 
            className="liquid-glass rounded-2xl p-5 flex flex-col gap-4 group transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--bg-easy)] text-[var(--color-easy)] border border-[var(--border-easy)]">
                  <Code size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] text-sm line-clamp-1">{prob.title}</h3>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    prob.difficulty === 'Dễ' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {prob.difficulty}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 min-h-[2.5rem] leading-relaxed">
              {prob.descriptionHtml.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
            </p>

            <div className="flex items-center justify-between mt-2 pt-4 border-t border-[var(--border-element)]">
              <div className="text-[10px] font-bold text-[var(--text-muted)]">
                ID: {prob.id}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(prob)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  title="Chỉnh sửa"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDeleteRequest(prob)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  title="Xóa bài tập"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {problems.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-60">
            <div className="p-4 rounded-full bg-[var(--bg-hover)] mb-4">
              <Code size={32} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-muted)]">Chưa có bài tập nào được tạo.</p>
          </div>
        )}
      </div>
    </div>
  );
});
