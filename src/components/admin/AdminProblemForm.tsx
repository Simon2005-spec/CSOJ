import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  HelpCircle, 
  Plus, 
  Trash2,
  ChevronRight
} from 'lucide-react';
import { CodingProblem } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface AdminProblemFormProps {
  editingProblemId: string | null;
  problems: CodingProblem[];
  onAddProblem: (newProblem: CodingProblem) => void;
  onEditProblem: (oldId: string, updatedProblem: CodingProblem) => void;
  onCancel: () => void;
}

export const AdminProblemForm = React.memo(({
  editingProblemId,
  problems,
  onAddProblem,
  onEditProblem,
  onCancel
}: AdminProblemFormProps) => {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Dễ');
  const [description, setDescription] = useState('');
  const [entryFunctionName, setEntryFunctionName] = useState('');
  const [inputNamesStr, setInputNamesStr] = useState('');
  
  const [constraints, setConstraints] = useState<string[]>([
    'Thời gian chạy tối đa: 1.0 giây',
    'Bộ nhớ tối đa: 256 MB'
  ]);
  const [newConstraint, setNewConstraint] = useState('');
  const [examples, setExamples] = useState<{ input: string; output: string; explanation?: string }[]>([]);
  const [exInput, setExInput] = useState('');
  const [exOutput, setExOutput] = useState('');
  const [exExplanation, setExExplanation] = useState('');
  const [testCases, setTestCases] = useState<{ inputStr: string; expectedStr: string }[]>([]);
  const [tcInputStr, setTcInputStr] = useState('');
  const [tcExpectedStr, setTcExpectedStr] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingProblemId) {
      const prob = problems.find(p => p.id === editingProblemId);
      if (prob) {
        setId(prob.id);
        setTitle(prob.title);
        setDifficulty(prob.difficulty);
        setDescription(prob.descriptionHtml);
        setEntryFunctionName(prob.entryFunctionName);
        setInputNamesStr(prob.inputNames.join(', '));
        setConstraints(prob.constraints);
        setExamples(prob.examples);
        setTestCases(prob.testCases.map((tc) => {
          const inputStr = tc.input.map(arg => JSON.stringify(arg)).join(', ');
          const expectedStr = JSON.stringify(tc.expected);
          return { inputStr, expectedStr };
        }));
      }
    }
  }, [editingProblemId, problems]);

  // Auto-generate ID and function name if not editing
  useEffect(() => {
    if (!editingProblemId && title) {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      setId(slug);

      const clean = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
      const parts = clean.split(/[\s-_]+/);
      let derivedFn = 'solve';
      if (parts.length > 0 && parts[0]) {
        derivedFn = parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        derivedFn = derivedFn.replace(/[^a-zA-Z0-9]/g, '');
      }
      setEntryFunctionName(derivedFn || 'solve');
    }
  }, [title, editingProblemId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const parseTestcaseInputList = (inputsStr: string): any[] => {
    try {
      const wrapped = JSON.parse('[' + inputsStr + ']');
      if (Array.isArray(wrapped)) return wrapped;
    } catch (e) {
      try {
        const parsedObj = JSON.parse(inputsStr);
        return [parsedObj];
      } catch {
        return inputsStr.split(',').map(s => s.trim()).filter(s => s.length > 0).map(part => {
          try { return JSON.parse(part); } catch { return part; }
        });
      }
    }
    return [];
  };

  const validateTestcase = (inputsStr: string, expStr: string, expectedCount?: number) => {
    let parsedInput: any[] = parseTestcaseInputList(inputsStr);
    let parsedExpected: any;
    try { parsedExpected = JSON.parse(expStr); } catch { parsedExpected = expStr.trim(); }

    if (expectedCount !== undefined && parsedInput.length !== expectedCount) {
      return { valid: false, error: `Số lượng tham số (${parsedInput.length}) không khớp với bộ test đầu tiên (${expectedCount})` };
    }
    return { valid: true, parsedInput, parsedExpected };
  };

  const handleAddTestCase = () => {
    if (!tcInputStr.trim() || !tcExpectedStr.trim()) {
      showNotification('error', 'Vui lòng điền đủ Tham số đầu vào và Đầu ra.');
      return;
    }
    const check = validateTestcase(tcInputStr, tcExpectedStr, testCases.length > 0 ? parseTestcaseInputList(testCases[0].inputStr).length : undefined);
    if (!check.valid) {
      showNotification('error', `Lỗi: ${check.error}`);
      return;
    }
    setTestCases([...testCases, { inputStr: tcInputStr.trim(), expectedStr: tcExpectedStr.trim() }]);
    setTcInputStr('');
    setTcExpectedStr('');
    showNotification('success', 'Đã thêm testcase!');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !title.trim() || testCases.length === 0) {
      showNotification('error', 'Vui lòng điền ID, Tiêu đề và ít nhất 1 testcase.');
      return;
    }

    const firstTc = testCases[0];
    const parsedFirstInputs = parseTestcaseInputList(firstTc.inputStr);
    const N = parsedFirstInputs.length;
    
    const validatedTestCases: { input: any[]; expected: any; rawInput: string }[] = [];
    for (const tc of testCases) {
      const check = validateTestcase(tc.inputStr, tc.expectedStr, N);
      if (!check.valid) {
        showNotification('error', `Testcase lỗi: ${check.error}`);
        return;
      }
      validatedTestCases.push({
        input: check.parsedInput!,
        expected: check.parsedExpected,
        rawInput: tc.inputStr
      });
    }

    const finalProblem: CodingProblem = {
      id,
      title,
      difficulty,
      descriptionHtml: description,
      inputFormat: '',
      outputFormat: '',
      entryFunctionName: entryFunctionName || 'solve',
      inputNames: inputNamesStr.split(',').map(s => s.trim()).filter(s => s.length > 0),
      constraints,
      examples,
      testCases: validatedTestCases,
      defaultCode: {
        cpp: `// Nhập mã nguồn của bạn tại đây\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`,
        python: `# Nhập mã nguồn của bạn tại đây\ndef solve():\n    pass`,
        pascal: `// Nhập mã nguồn của bạn tại đây\nbegin\nend.`
      }
    };

    if (editingProblemId) {
      onEditProblem(editingProblemId, finalProblem);
    } else {
      onAddProblem(finalProblem);
    }
  };

  const insertMarkdown = (before: string, after: string) => {
    const el = textareaRef.current;
    if (!el) {
      setDescription(prev => prev + before + after);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    setDescription(text.substring(0, start) + before + selected + after + text.substring(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl text-[var(--text-muted)]">
            <X size={20} />
          </button>
          <h2 className="text-xl font-extrabold tracking-tight">
            {editingProblemId ? 'Chỉnh sửa Bài tập' : 'Tạo Bài tập Mới'}
          </h2>
        </div>
        <button onClick={handleFormSubmit} className="csoj-btn csoj-btn-primary">
          <CheckCircle size={16} />
          <span>Lưu bài tập</span>
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        {/* Left Column: Info */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="liquid-glass rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="text-sm font-extrabold text-[var(--color-easy)] uppercase tracking-widest">Thông tin cơ bản</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="form-label">Tiêu đề bài toán</label>
                <input 
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                  className="csoj-input pl-4" placeholder="Ví dụ: Tính tổng hai số" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">ID (Slug)</label>
                <input 
                  type="text" value={id} onChange={(e) => setId(e.target.value)} 
                  className="csoj-input pl-4" placeholder="tinh-tong-hai-so" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Độ khó</label>
                <select 
                  value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}
                  className="csoj-input pl-4 cursor-pointer"
                >
                  <option value="Dễ">Dễ</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Khó">Khó</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between">
                <label className="form-label">Mô tả bài toán (Markdown)</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => insertMarkdown('**', '**')} className="px-2 py-0.5 text-[10px] font-bold bg-[var(--bg-hover)] rounded border border-[var(--border-element)]">B</button>
                  <button type="button" onClick={() => insertMarkdown('*', '*')} className="px-2 py-0.5 text-[10px] font-bold bg-[var(--bg-hover)] rounded border border-[var(--border-element)]">I</button>
                  <button type="button" onClick={() => insertMarkdown('`', '`')} className="px-2 py-0.5 text-[10px] font-bold bg-[var(--bg-hover)] rounded border border-[var(--border-element)]">Code</button>
                </div>
              </div>
              <textarea 
                ref={textareaRef}
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="csoj-input pl-4 min-h-[300px] font-mono text-sm leading-relaxed"
                placeholder="Nhập mô tả bài toán bằng Markdown..."
              />
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="text-sm font-extrabold text-[var(--color-easy)] uppercase tracking-widest">Ví dụ mẫu (Example)</h3>
            <div className="flex flex-col gap-4">
              {examples.map((ex, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-element)] relative group">
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div><span className="text-[var(--text-muted)]">In:</span> {ex.input}</div>
                    <div><span className="text-[var(--text-muted)]">Out:</span> {ex.output}</div>
                  </div>
                  <button 
                    type="button" onClick={() => setExamples(examples.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={exInput} onChange={(e) => setExInput(e.target.value)} className="csoj-input pl-4 text-xs" placeholder="Input mẫu" />
                <input type="text" value={exOutput} onChange={(e) => setExOutput(e.target.value)} className="csoj-input pl-4 text-xs" placeholder="Output mẫu" />
                <button type="button" onClick={() => {
                  if (exInput && exOutput) {
                    setExamples([...examples, { input: exInput, output: exOutput, explanation: exExplanation }]);
                    setExInput(''); setExOutput(''); setExExplanation('');
                  }
                }} className="col-span-2 csoj-btn csoj-btn-outline py-2">
                  <Plus size={14} /> Thêm Ví dụ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Constraints & Testcases */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="liquid-glass rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="text-sm font-extrabold text-[var(--color-easy)] uppercase tracking-widest">Testcases (Bộ test ẩn)</h3>
            <div className="flex flex-col gap-3">
              {testCases.map((tc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-hover)] text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)]">#{idx+1}</span>
                    <span className="text-[var(--color-easy)] truncate max-w-[80px]">{tc.inputStr}</span>
                    <ChevronRight size={10} className="text-[var(--text-muted)]" />
                    <span className="text-[var(--accent-secondary)] truncate max-w-[80px]">{tc.expectedStr}</span>
                  </div>
                  <button type="button" onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))} className="text-red-500 p-1"><Trash2 size={12} /></button>
                </div>
              ))}
              <div className="flex flex-col gap-2 p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-element)]">
                <input type="text" value={tcInputStr} onChange={(e) => setTcInputStr(e.target.value)} className="csoj-input pl-4 text-xs" placeholder="Tham số (cách nhau bởi dấu phẩy)" />
                <input type="text" value={tcExpectedStr} onChange={(e) => setTcExpectedStr(e.target.value)} className="csoj-input pl-4 text-xs" placeholder="Kết quả mong muốn" />
                <button type="button" onClick={handleAddTestCase} className="csoj-btn csoj-btn-primary py-2 text-xs">
                  <Plus size={14} /> Thêm Testcase
                </button>
              </div>
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="text-sm font-extrabold text-[var(--color-easy)] uppercase tracking-widest">Xem trước (Preview)</h3>
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-element)] max-h-[400px] overflow-y-auto">
              <h4 className="font-bold text-lg mb-4">{title || 'Tiêu đề bài viết'}</h4>
              <MarkdownRenderer content={description || '*Chưa có mô tả*'} className="problem-prose" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
});
