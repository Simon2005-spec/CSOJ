import React from 'react';
import { Trophy, CheckCircle, Eye, AlertTriangle } from 'lucide-react';

interface AdminSubmissionsProps {
  submissions: { [username: string]: any };
  onViewCode: (sub: any) => void;
}

export const AdminSubmissions = React.memo(({ submissions, onViewCode }: AdminSubmissionsProps) => {
  const userList = Object.keys(submissions).sort((a, b) => {
    const scoreA = submissions[a].score || 0;
    const scoreB = submissions[b].score || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Bảng xếp hạng & Bài nộp
          </h2>
          <p className="text-xs font-medium text-[var(--text-muted)] mt-1">
            Theo dõi tiến độ và kết quả làm bài của học sinh theo thời gian thực
          </p>
        </div>
      </div>

      <div className="liquid-glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-[var(--border-element)] bg-[var(--bg-hover)]/30">
              <th className="px-3 py-2 text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Học sinh</th>
              <th className="px-3 py-2 text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider text-center">Tiến độ</th>
              <th className="px-3 py-2 text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider text-center">Điểm số</th>
              <th className="px-3 py-2 text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider text-center">Thời gian</th>
              <th className="px-3 py-2 text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-element)]">
            {userList.map((user) => {
              const sub = submissions[user];
              const codingAnswers = sub.codingAnswers || {};
              const problemsAnswered = Object.keys(codingAnswers).length;
              const problemsPassed = Object.values(codingAnswers).filter((a: any) => a.passed).length;
              const minutes = Math.floor((sub.timeLeft || 0) / 60);
              const seconds = (sub.timeLeft || 0) % 60;
              
              return (
                <tr key={user} className="hover:bg-[var(--bg-hover)]/20 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-[var(--accent-gradient)] text-white flex items-center justify-center font-bold text-[8px] uppercase">
                        {user.substring(0, 2)}
                      </div>
                      <span className="font-bold text-[11px] text-[var(--text-primary)]">{user}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-[9px] font-bold">
                        <span className="text-[var(--color-easy)]">{problemsPassed}</span>
                        <span className="text-[var(--text-muted)]">/</span>
                        <span className="text-[var(--text-secondary)]">{problemsAnswered}</span>
                      </div>
                      <div className="w-16 h-0.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--accent-gradient)] transition-all duration-500" 
                          style={{ width: `${(problemsPassed / (problemsAnswered || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="inline-flex items-center gap-1 bg-[var(--bg-easy)] text-[var(--color-easy)] px-1.5 py-0 rounded border border-[var(--border-easy)]">
                      <Trophy size={8} />
                      <span className="font-extrabold text-[11px]">{sub.score || 0}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-mono text-[9px] font-bold ${sub.timeLeft < 300 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {Object.keys(codingAnswers).length > 0 ? (
                        Object.keys(codingAnswers).map((pId) => (
                          <button
                            key={pId}
                            onClick={() => onViewCode({ 
                              username: user, 
                              problemId: pId, 
                              code: codingAnswers[pId].code,
                              language: codingAnswers[pId].language,
                              passed: codingAnswers[pId].passed
                            })}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                              codingAnswers[pId].passed 
                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                            }`}
                            title={`Xem bài ${pId}`}
                          >
                            <Eye size={10} />
                          </button>
                        ))
                      ) : (
                        <span className="text-[9px] italic text-[var(--text-muted)]">Chưa nộp bài</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {userList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-[var(--text-muted)] italic">
                  Chưa có học sinh nào nộp bài.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
});
