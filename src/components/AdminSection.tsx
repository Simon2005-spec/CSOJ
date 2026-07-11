import React, { useState, useEffect } from 'react';
import { 
   Plus, 
   Trash2, 
   LogOut, 
   Code, 
   CheckCircle, 
   AlertTriangle, 
   FileText, 
   Settings,
   HelpCircle,
   Eye,
   X,
   Briefcase,
   Pencil
} from 'lucide-react';
import { CodingProblem } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

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
  // Navigation / Tabs within Admin
  const [adminTab, setAdminTab] = useState<'list' | 'add'>('list');
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);

  // Form Fields State
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Dễ');
  const [description, setDescription] = useState('');
  const [entryFunctionName, setEntryFunctionName] = useState('');
  const [inputNamesStr, setInputNamesStr] = useState('');
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const parseTestcaseInputList = (inputsStr: string): any[] => {
    try {
      const wrapped = JSON.parse('[' + inputsStr + ']');
      if (Array.isArray(wrapped)) {
        return wrapped;
      }
    } catch (e) {
      try {
        const parsedObj = JSON.parse(inputsStr);
        return [parsedObj];
      } catch {
        const parts = inputsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return parts.map(part => {
          try {
            return JSON.parse(part);
          } catch {
            return part;
          }
        });
      }
    }
    return [];
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
    const replacement = before + selected + after;
    setDescription(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  const insertStandardTemplate = () => {
    const template = `Cho một số nguyên dương **n**. Hãy viết chương trình kiểm tra xem số đó có phải là số nguyên tố hay không.

### Đầu vào (Input)
Một dòng duy nhất chứa số nguyên dương **n** (1 ≤ n ≤ 10^9).

### Đầu ra (Output)
Trả về **true** nếu là số nguyên tố, ngược lại trả về **false**.`;
    setDescription(template);
  };

  // Dynamic fields lists
  const [constraints, setConstraints] = useState<string[]>([
    'Thời gian chạy tối đa: 1.0 giây',
    'Bộ nhớ tối đa: 256 MB'
  ]);
  const [newConstraint, setNewConstraint] = useState('');

  const [examples, setExamples] = useState<{ input: string; output: string; explanation?: string }[]>([]);
  const [exInput, setExInput] = useState('');
  const [exOutput, setExOutput] = useState('');
  const [exExplanation, setExExplanation] = useState('');

  // Dynamic testcases list
  const [testCases, setTestCases] = useState<{ inputStr: string; expectedStr: string }[]>([]);
  const [tcInputStr, setTcInputStr] = useState('');
  const [tcExpectedStr, setTcExpectedStr] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const fileName = file.name.toLowerCase();
      // Only keep the actual content and try to format to valid JSON string if it's not already
      // but if they upload raw text, we might just use it directly. The prompt just asks to auto-fill.
      if (fileName.endsWith('.inp')) {
        setTcInputStr(text.trim());
      } else if (fileName.endsWith('.out')) {
        setTcExpectedStr(text.trim());
      } else {
        // default fallback if extension is weird but user selected it
        setTcInputStr(text.trim());
      }
      
      // Reset input so the same file can be uploaded again if needed
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Custom confirm state for deleting
  const [problemToDelete, setProblemToDelete] = useState<CodingProblem | null>(null);

  // Customizable Boilerplate Code Templates
  const [customPython, setCustomPython] = useState('');
  const [customPascal, setCustomPascal] = useState('');
  const [customCpp, setCustomCpp] = useState('');
  const [isUsingAutoTemplates, setIsUsingAutoTemplates] = useState(true);

  // Success / Error Alerts
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-generate ID and entryFunctionName based on Title
  useEffect(() => {
    if (adminTab === 'add' && !editingProblemId) {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      setId(slug);

      // Convert accented Vietnamese characters to raw English & form camelCase
      const clean = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .trim();
      const parts = clean.split(/[\s-_]+/);
      let derivedFn = 'solve';
      if (parts.length > 0 && parts[0]) {
        derivedFn = parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        derivedFn = derivedFn.replace(/[^a-zA-Z0-9]/g, '');
      }
      setEntryFunctionName(derivedFn || 'solve');
    }
  }, [title, adminTab, editingProblemId]);

  const parsedInputNames = inputNamesStr
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  // Auto-derive inputNamesStr based on the testcases
  useEffect(() => {
    if (editingProblemId) return;
    if (testCases.length > 0) {
      const firstTc = testCases[0];
      const parsedInputs = parseTestcaseInputList(firstTc.inputStr);
      const N = parsedInputs.length || 1;
      const names = Array.from({ length: N }, (_, i) => {
        if (N === 1) {
          return typeof parsedInputs[0] === 'string' ? 's' : 'n';
        }
        if (N === 2) {
          const firstIsArr = Array.isArray(parsedInputs[0]);
          return i === 0 ? (firstIsArr ? 'nums' : 'a') : (firstIsArr ? 'target' : 'b');
        }
        return String.fromCharCode(97 + i);
      });
      setInputNamesStr(names.join(', '));
    } else {
      setInputNamesStr('n');
    }
  }, [testCases, editingProblemId]);

  // Helper validation for testcases JSON
  const validateTestcase = (inputsStr: string, expStr: string, expectedCount?: number): { valid: boolean; error?: string; parsedInput?: any[]; parsedExpected?: any } => {
    let parsedInput: any[] = [];
    let parsedExpected: any;

    try {
      parsedExpected = JSON.parse(expStr);
    } catch (e) {
      parsedExpected = expStr.trim();
    }

    parsedInput = parseTestcaseInputList(inputsStr);

    if (expectedCount !== undefined && parsedInput.length !== expectedCount) {
      return {
        valid: false,
        error: `Số lượng tham số đầu vào (${parsedInput.length}) không khớp với bộ testcase đầu tiên (${expectedCount})`
      };
    }

    return { valid: true, parsedInput, parsedExpected };
  };

  const handleOpenAddTab = () => {
    setEditingProblemId(null);
    setTitle('');
    setDescription('');
    setEntryFunctionName('');
    setInputNamesStr('');
    setConstraints(['Thời gian chạy tối đa: 1.0 giây', 'Bộ nhớ tối đa: 256 MB']);
    setExamples([]);
    setTestCases([]);
    setCustomPascal('');
    setCustomPython('');
    setCustomCpp('');
    setIsUsingAutoTemplates(true);
    setAdminTab('add');
  };

  const handleEditProblemClick = (prob: CodingProblem) => {
    setEditingProblemId(prob.id);
    setId(prob.id);
    setTitle(prob.title);
    setDifficulty(prob.difficulty);
    setDescription(prob.descriptionHtml);
    setEntryFunctionName(prob.entryFunctionName);
    setInputNamesStr(prob.inputNames.join(', '));
    setConstraints(prob.constraints);
    setExamples(prob.examples);
    // Convert testcases back to raw string representations for editing
    setTestCases(prob.testCases.map((tc) => {
      const inputStr = tc.input.map(arg => JSON.stringify(arg)).join(', ');
      const expectedStr = JSON.stringify(tc.expected);
      return { inputStr, expectedStr };
    }));
    setAdminTab('add');
  };

  const handleAddConstraint = () => {
    if (newConstraint.trim()) {
      setConstraints([...constraints, newConstraint.trim()]);
      setNewConstraint('');
    }
  };

  const handleRemoveConstraint = (index: number) => {
    setConstraints(constraints.filter((_, idx) => idx !== index));
  };

  const handleAddExample = () => {
    if (exInput.trim() && exOutput.trim()) {
      setExamples([...examples, { 
        input: exInput, 
        output: exOutput, 
        explanation: exExplanation.trim() || undefined 
      }]);
      setExInput('');
      setExOutput('');
      setExExplanation('');
    } else {
      showNotification('error', 'Vui lòng điền thông tin Đầu vào và Đầu ra của Ví dụ mẫu.');
    }
  };

  const handleRemoveExample = (index: number) => {
    setExamples(examples.filter((_, idx) => idx !== index));
  };

  const handleAddTestCase = () => {
    if (!tcInputStr.trim() || !tcExpectedStr.trim()) {
      showNotification('error', 'Vui lòng điền đủ Tham số đầu vào và Đầu ra mong muốn.');
      return;
    }

    let expectedCount: number | undefined = undefined;
    if (testCases.length > 0) {
      const firstTc = testCases[0];
      const parsedFirst = parseTestcaseInputList(firstTc.inputStr);
      expectedCount = parsedFirst.length;
    }

    const check = validateTestcase(tcInputStr, tcExpectedStr, expectedCount);
    if (!check.valid) {
      showNotification('error', `Lỗi Testcase: ${check.error}`);
      return;
    }

    setTestCases([...testCases, { inputStr: tcInputStr.trim(), expectedStr: tcExpectedStr.trim() }]);
    setTcInputStr('');
    setTcExpectedStr('');
    showNotification('success', 'Đã thêm testcase thành công!');
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases(testCases.filter((_, idx) => idx !== index));
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id.trim() || !title.trim()) {
      showNotification('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc: ID và Tiêu đề bài toán.');
      return;
    }

    // Determine input names based on first testcase
    const firstTc = testCases[0];
    const parsedFirstInputs = firstTc ? parseTestcaseInputList(firstTc.inputStr) : [];
    const N = parsedFirstInputs.length || 1;
    const finalInputNames = Array.from({ length: N }, (_, i) => {
      if (N === 1) {
        return typeof parsedFirstInputs[0] === 'string' ? 's' : 'n';
      }
      if (N === 2) {
        const firstIsArr = Array.isArray(parsedFirstInputs[0]);
        return i === 0 ? (firstIsArr ? 'nums' : 'a') : (firstIsArr ? 'target' : 'b');
      }
      return String.fromCharCode(97 + i);
    });

    const derivedFnName = entryFunctionName || 'solve';

    // Validate and build final testcases array
    const validatedTestCases: { input: any[]; expected: any; rawInput: string }[] = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const check = validateTestcase(tc.inputStr, tc.expectedStr, N);
      if (!check.valid) {
        showNotification('error', `Testcase #${i + 1} không hợp lệ: ${check.error}`);
        return;
      }

      // Build rawInput string representation, e.g. "nums = [2, 7, 11, 15], target = 9"
      const rawInputParts = finalInputNames.map((name, idx) => {
        const val = check.parsedInput ? check.parsedInput[idx] : undefined;
        return `${name} = ${JSON.stringify(val)}`;
      });
      const rawInput = rawInputParts.join(', ');

      validatedTestCases.push({
        input: check.parsedInput || [],
        expected: check.parsedExpected,
        rawInput
      });
    }

    let finalDescHtml = description.trim();

    // Automatically generate templates programmatically on submission
    const argsList = finalInputNames.join(', ');
    const pyFn = derivedFnName.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    let finalDefaultCode: { [lang: string]: string } = {
      python: `def ${pyFn}(${argsList}):
    """
    Hãy viết hàm xử lý thuật toán tại đây.
    """
    # Viết code của bạn ở đây
    return None
`,
      pascal: `function ${derivedFnName}(${finalInputNames.map(name => `${name}: integer`).join('; ')}): integer;
var
    // Khai báo biến tại đây nếu cần thiết
begin
    // Viết code của bạn ở đây
    exit(0);
end;
`,
      cpp: `// Thay đổi kiểu dữ liệu trả về và tham số nếu cần thiết
int ${derivedFnName}(${finalInputNames.map(name => `int ${name}`).join(', ')}) {
    // Viết code của bạn ở đây
    return 0;
}
`
    };

    if (editingProblemId) {
      const existing = problems.find(p => p.id === editingProblemId);
      if (existing && existing.defaultCode) {
        finalDefaultCode = existing.defaultCode;
      }
    }

    const newProblem: CodingProblem = {
      id: id.trim(),
      title: title.trim(),
      difficulty,
      descriptionHtml: finalDescHtml || `<p>${title.trim()}</p>`,
      inputFormat: `<ul><li>Tham số đầu vào: <code>${finalInputNames.join(', ')}</code></li></ul>`,
      outputFormat: `Giá trị trả về của hàm <code>${derivedFnName}</code>.`,
      examples,
      constraints,
      entryFunctionName: derivedFnName,
      inputNames: finalInputNames,
      defaultCode: finalDefaultCode,
      testCases: validatedTestCases
    };

    if (editingProblemId) {
      onEditProblem(editingProblemId, newProblem);
      showNotification('success', `Đã cập nhật thành công câu hỏi: "${newProblem.title}"!`);
    } else {
      onAddProblem(newProblem);
      showNotification('success', `Đã nạp thành công câu hỏi mới: "${newProblem.title}"!`);
    }
    
    // Reset Form
    setEditingProblemId(null);
    setTitle('');
    setDescription('');
    setEntryFunctionName('');
    setInputNamesStr('');
    setConstraints(['Thời gian chạy tối đa: 1.0 giây', 'Bộ nhớ tối đa: 256 MB']);
    setExamples([]);
    setTestCases([]);
    setAdminTab('list');
  };

  return (
    <div className="admin-section-wrapper" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Admin Title & Info Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-element)', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', padding: '0.375rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '0.5rem' }}>
              <Settings size={20} className="spin-slow" />
            </span>
            <h1 className="problem-title" style={{ margin: 0, fontSize: '1.5rem' }}>Tài Khoản Quản Trị NHCOJ</h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Quản lý các câu hỏi trong đề thi lập trình, thêm bớt bài toán, và tối ưu hóa bộ testcase kiểm thử.
          </p>
        </div>

        <button 
          onClick={onLogout} 
          className="csoj-btn csoj-btn-outline" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <LogOut size={14} />
          <span>Đăng xuất Admin</span>
        </button>
      </div>

      {/* Notifications Alert */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: notification.type === 'success' ? '#10b981' : '#ef4444',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{notification.message}</span>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.25rem', borderRadius: '0.5rem', width: 'fit-content' }}>
        <button
          onClick={() => setAdminTab('list')}
          className={`csoj-btn ${adminTab === 'list' ? 'csoj-btn-primary' : ''}`}
          style={{ padding: '0.375rem 1rem', fontSize: '0.875rem', background: adminTab === 'list' ? 'var(--btn-primary-bg)' : 'transparent', color: adminTab === 'list' ? 'var(--btn-primary-text)' : 'var(--text-muted)' }}
        >
          Danh sách câu hỏi ({problems.length})
        </button>
        <button
          onClick={handleOpenAddTab}
          className={`csoj-btn ${adminTab === 'add' ? 'csoj-btn-primary' : ''}`}
          style={{ padding: '0.375rem 1rem', fontSize: '0.875rem', background: adminTab === 'add' ? 'var(--btn-primary-bg)' : 'transparent', color: adminTab === 'add' ? 'var(--btn-primary-text)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          {editingProblemId ? <Pencil size={14} /> : <Plus size={14} />}
          <span>{editingProblemId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</span>
        </button>
      </div>

      {/* VIEW 1: Problems List Management */}
      {adminTab === 'list' && (
        <div className="liquid-glass" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-element)' }}>
                  <th style={{ padding: '1rem' }}>Mã câu hỏi (ID)</th>
                  <th style={{ padding: '1rem' }}>Tiêu đề</th>
                  <th style={{ padding: '1rem' }}>Độ khó</th>
                  <th style={{ padding: '1rem' }}>Tên hàm (Entry)</th>
                  <th style={{ padding: '1rem' }}>Tham số</th>
                  <th style={{ padding: '1rem' }}>Số lượng testcase</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {problems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Không có câu hỏi nào hiện tại. Hãy tạo câu hỏi mới ngay!
                    </td>
                  </tr>
                ) : (
                  problems.map((prob) => (
                    <tr key={prob.id} style={{ borderBottom: '1px solid var(--border-element)' }}>
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>{prob.id}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{prob.title}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge-difficulty ${prob.difficulty === 'Dễ' ? 'easy' : prob.difficulty === 'Trung bình' ? 'medium' : 'hard'}`}>
                          {prob.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: '#10b981' }}>{prob.entryFunctionName}</td>
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{prob.inputNames.join(', ')}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{prob.testCases.length} tc</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleEditProblemClick(prob)}
                            className="csoj-btn csoj-btn-outline"
                            style={{ padding: '0.375rem', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Chỉnh sửa câu hỏi"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProblemToDelete(prob)}
                            className="csoj-btn csoj-btn-outline"
                            style={{ padding: '0.375rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Xóa câu hỏi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Add New Detailed Problem Form */}
      {adminTab === 'add' && (
        <form onSubmit={handleFormSubmit} className="csoj-form" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          
          {/* Section 1: Core Problem Metadata */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.5rem' }}>
              <FileText size={18} style={{ color: '#10b981' }} />
              <span>1. Thông tin cơ bản</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* ID */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mã định danh duy nhất (ID)</label>
                <input
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="Ví dụ: two-sum-advance"
                  className="csoj-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Title */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <span>Tiêu đề bài toán</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Tìm số nguyên tố, Tổng lớn nhất, v.v..."
                  className="csoj-input"
                />
              </div>

              {/* Difficulty */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Độ khó đề bài</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="csoj-input"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <option value="Dễ" style={{ background: '#1e293b' }}>Dễ (Easy)</option>
                  <option value="Trung bình" style={{ background: '#1e293b' }}>Trung bình (Medium)</option>
                  <option value="Khó" style={{ background: '#1e293b' }}>Khó (Hard)</option>
                </select>
              </div>
            </div>
            
          </div>

          {/* Section 3: Automated Testing Testcases (The Engine) */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.5rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} />
              <span>2. Bộ testcase kiểm thử chấm điểm tự động</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.75rem', lineHeight: 1.4 }}>
              Nhập các bộ dữ liệu kiểm thử thực tế. Các giá trị bắt buộc phải là định dạng JSON hợp lệ (ví dụ: mảng phải dùng dấu ngoặc vuông <code>[...]</code>, chuỗi ký tự phải bọc trong dấu nháy kép <code>"..."</code>, giá trị boolean viết thường <code>true</code> / <code>false</code>).
            </p>

            {/* Testcases Form Wrapper */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--border-element)' }}>
              
              <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tải lên file Testcase (.inp, .out)</span>
                  <span style={{ color: 'var(--text-muted)' }}>Sẽ tự động điền vào ô Input hoặc Output</span>
                </label>
                <input
                  type="file"
                  accept=".inp,.out,.txt"
                  onChange={handleFileUpload}
                  className="csoj-input"
                  style={{ fontSize: '0.8rem', padding: '0.375rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tham số truyền vào hàm (Input)</span>
                  <span style={{ color: 'var(--text-muted)' }}>Cú pháp JSON, cách nhau bằng dấu phẩy</span>
                </label>
                <input
                  type="text"
                  value={tcInputStr}
                  onChange={(e) => setTcInputStr(e.target.value)}
                  placeholder={parsedInputNames.length > 1 ? '[2, 7, 11, 15], 9' : '121'}
                  className="csoj-input"
                  style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
                {testCases.length > 0 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Tự động ánh xạ vào {testCases.length > 0 ? parsedInputNames.length : 1} biến đầu vào.
                  </span>
                )}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kết quả mong muốn trả về</span>
                  <span style={{ color: 'var(--text-muted)' }}>Định dạng JSON</span>
                </label>
                <input
                  type="text"
                  value={tcExpectedStr}
                  onChange={(e) => setTcExpectedStr(e.target.value)}
                  placeholder='[0, 1] hoặc true hoặc "xyz"'
                  className="csoj-input"
                  style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="csoj-btn csoj-btn-primary"
                  style={{ padding: '0.375rem 1rem', fontSize: '0.825rem', background: '#10b981', color: 'white' }}
                >
                  Thêm Testcase
                </button>
              </div>
            </div>

            {/* Testcases List with Real-time Parsing Feedback */}
            {testCases.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', paddingLeft: '0.5rem' }}>Danh sách Testcases ({testCases.length}):</div>
                {testCases.map((tc, index) => {
                  const valCheck = validateTestcase(tc.inputStr, tc.expectedStr);
                  return (
                    <div key={index} style={{ padding: '0.5rem 0.75rem', background: valCheck.valid ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)', border: `1px solid ${valCheck.valid ? 'var(--border-element)' : '#ef4444'}`, borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1, minWidth: 0 }}>
                        <div style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                          <strong style={{ color: '#10b981', marginRight: '0.5rem' }}>TC #{index + 1}:</strong>
                          <span style={{ color: 'var(--text-muted)' }}>Tham số:</span> <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap', display: 'inline-block' }}>{tc.inputStr}</code>
                        </div>
                        <div style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Kết quả kỳ vọng:</span> <code style={{ fontFamily: 'var(--font-mono)', color: '#10b981', background: 'rgba(0,0,0,0.2)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap', display: 'inline-block' }}>{tc.expectedStr}</code>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(index)}
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: 0 }}>* Bắt buộc: Phải có ít nhất 1 testcase để hệ thống có thể đối chiếu chấm thi.</p>
            )}
          </div>

          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.5rem' }}>
              <FileText size={18} style={{ color: '#10b981' }} />
              <span>3. Nội dung chi tiết đề bài</span>
            </h2>
            {/* Description Textarea with Markdown insertion tools */}
            <div className="form-group" style={{ margin: '0.5rem 0 0 0' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Mô tả chi tiết đề bài (Sử dụng Markdown chuyên nghiệp)</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Hỗ trợ đầy đủ cú pháp Markdown: **, *, \`, \`\`\`, ###, -</span>
              </label>
 
              {/* Quick Markdown Insertion Tools Bar */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--border-element)' }}>
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto', background: 'transparent' }}
                >
                  In đậm (**)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto', background: 'transparent' }}
                >
                  In nghiêng (*)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('`', '`')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto', background: 'transparent' }}
                >
                  Mã dòng (`)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n```\n', '\n```\n')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto', background: 'transparent' }}
                >
                  Khối mã (```)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- ', '\n')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto', background: 'transparent' }}
                >
                  Danh sách (-)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('### ', '\n')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto', background: 'transparent' }}
                >
                  Tiêu đề phụ (###)
                </button>
                <button
                  type="button"
                  onClick={insertStandardTemplate}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto', borderColor: '#10b981', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.05)' }}
                >
                  Mẫu đề thi chuẩn 📝
                </button>
              </div>
 
              <textarea
                ref={textareaRef}
                required
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập đề bài ở định dạng Markdown hoặc sử dụng nút 'Mẫu đề thi chuẩn' ở trên để tự động điền mẫu."
                className="csoj-input"
                style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: '1.5' }}
              />
 
              {/* Markdown Live Preview Box */}
              {description.trim() && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-element)', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    Xem trước Đề bài (Live Preview)
                  </div>
                  <div className="problem-prose coding-desc-preview" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                      {description}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setEditingProblemId(null);
                setAdminTab('list');
                setTitle('');
              }}
              className="csoj-btn csoj-btn-outline"
              style={{ padding: '0.625rem 1.5rem' }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="csoj-btn csoj-btn-primary"
              style={{ padding: '0.625rem 2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 600 }}
            >
              Lưu câu hỏi & Cập nhật đề thi
            </button>
          </div>
        </form>
      )}

      {/* Custom Confirmation Modal for Deleting */}
      {problemToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div className="liquid-glass animate-scale-up" style={{
            maxWidth: '450px',
            width: '100%',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid var(--border-element)',
            background: '#1e293b',
            color: '#f8fafc',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Xác nhận xóa câu hỏi</h3>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Bạn có chắc chắn muốn xóa câu hỏi/bài toán <strong>"{problemToDelete.title}"</strong> (ID: {problemToDelete.id}) ra khỏi đề thi không? Hành động này không thể hoàn tác.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setProblemToDelete(null)}
                className="csoj-btn csoj-btn-outline"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderColor: '#475569', color: '#94a3b8' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveProblem(problemToDelete.id);
                  showNotification('success', `Đã xóa câu hỏi "${problemToDelete.title}" thành công!`);
                  setProblemToDelete(null);
                }}
                className="csoj-btn"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
