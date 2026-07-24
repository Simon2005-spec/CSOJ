import React, { useState, useEffect, useCallback } from 'react';
import { 
   LogOut, 
   Settings,
   AlertTriangle,
   LayoutDashboard,
   Users
} from 'lucide-react';
import { CodingProblem } from '../types';
import { AdminProblemList } from './admin/AdminProblemList';
import { AdminProblemForm } from './admin/AdminProblemForm';
import { AdminSubmissions } from './admin/AdminSubmissions';
import { SubmissionViewModal } from './admin/SubmissionViewModal';

interface AdminSectionProps {
  problems: CodingProblem[];
  onAddProblem: (newProblem: CodingProblem) => void;
  onEditProblem: (oldId: string, updatedProblem: CodingProblem) => void;
  onRemoveProblem: (problemId: string) => void;
  onLogout: () => void;
}

export default function AdminSection({ 
  problems, 
  onAddProblem, 
  onEditProblem, 
  onRemoveProblem, 
  onLogout 
}: AdminSectionProps) {
  const [adminTab, setAdminTab] = useState<'list' | 'add' | 'submissions'>('list');
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<{ [username: string]: any }>({});
  const [viewingUserCode, setViewingUserCode] = useState<{ username: string; problemId: string; code: string; language: string; passed: boolean } | null>(null);
  const [problemToDelete, setProblemToDelete] = useState<CodingProblem | null>(null);

  // Poll submissions dynamically
  useEffect(() => {
    if (adminTab !== 'submissions') return;
    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`/api/submissions?t=${Date.now()}`);
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server did not return JSON");
        }
        const data = await res.json();
        if (data) setSubmissions(data);
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
      }
    };
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 5000);
    return () => clearInterval(interval);
  }, [adminTab]);

  const handleAddNew = useCallback(() => {
    setEditingProblemId(null);
    setAdminTab('add');
  }, []);

  const handleEdit = useCallback((prob: CodingProblem) => {
    setEditingProblemId(prob.id);
    setAdminTab('add');
  }, []);

  const handleProblemSubmit = useCallback((oldId: string | null, updatedProb: CodingProblem) => {
    if (oldId) {
      onEditProblem(oldId, updatedProb);
    } else {
      onAddProblem(updatedProb);
    }
    setAdminTab('list');
  }, [onAddProblem, onEditProblem]);

  return (
    <div className="flex flex-col flex-1 bg-[var(--bg-app)]">
      {/* Admin Sidebar/Header */}
      <header className="header-wrapper border-b border-[var(--border-element)] bg-[var(--bg-card)]/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="header-content h-12 md:h-14 px-4 md:px-10">
          <div className="flex items-center gap-6">
            <div className="logo-section py-2 px-0" onClick={() => setAdminTab('list')}>
              <div className="logo-badge w-8 h-8 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                <Settings size={16} />
              </div>
              <span className="logo-text text-sm">Admin Panel</span>
            </div>

            <nav className="flex items-center gap-0.5">
              <button 
                onClick={() => setAdminTab('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
                  adminTab === 'list' || adminTab === 'add' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <LayoutDashboard size={12} />
                <span>Bài tập</span>
              </button>
              <button 
                onClick={() => setAdminTab('submissions')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
                  adminTab === 'submissions' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Users size={12} />
                <span>Kết quả</span>
              </button>
            </nav>
          </div>

          <div className="user-section">
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-1.5 rounded text-red-500 hover:bg-red-500/10 transition-all font-bold text-[11px]">
              <LogOut size={12} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 app-container pt-4 pb-8 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20">
        {adminTab === 'list' && (
          <AdminProblemList 
            problems={problems} 
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onDeleteRequest={setProblemToDelete}
          />
        )}

        {adminTab === 'add' && (
          <AdminProblemForm 
            editingProblemId={editingProblemId}
            problems={problems}
            onAddProblem={(p) => handleProblemSubmit(null, p)}
            onEditProblem={handleProblemSubmit}
            onCancel={() => setAdminTab('list')}
          />
        )}

        {adminTab === 'submissions' && (
          <AdminSubmissions 
            submissions={submissions}
            onViewCode={setViewingUserCode}
          />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {problemToDelete && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <AlertTriangle size={24} />
              <h3 className="font-extrabold uppercase tracking-tight">Xác nhận xóa?</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Bạn có chắc chắn muốn xóa bài tập <strong>{problemToDelete.title}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={() => setProblemToDelete(null)} className="flex-1 csoj-btn csoj-btn-secondary">Hủy</button>
              <button 
                onClick={() => {
                  onRemoveProblem(problemToDelete.id);
                  setProblemToDelete(null);
                }} 
                className="flex-1 csoj-btn csoj-btn-danger"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Viewer Modal */}
      <SubmissionViewModal 
        viewingUserCode={viewingUserCode}
        onClose={() => setViewingUserCode(null)}
      />
    </div>
  );
}
