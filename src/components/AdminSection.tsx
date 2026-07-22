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
   Pencil,
   Trophy
} from 'lucide-react';
import { CodingProblem } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

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
  const [adminTab, setAdminTab] = useState<'list' | 'add' | 'submissions'>('list');
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<{ [username: string]: any }>({});
  const [viewingUserCode, setViewingUserCode] = useState<{ username: string; problemId: string; code: string; language: string; passed: boolean } | null>(null);

  // Poll submissions dynamically when the submissions tab is active
  useEffect(() => {
    if (adminTab !== 'submissions') return;
    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`/api/submissions?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSubmissions(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
      }
    };
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 3000);
    return () => clearInterval(interval);
  }, [adminTab]);

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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-element)', paddingBottom: '1rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', padding: '0.375rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '0.5rem' }}>
              <Settings size={20} className="spin-slow" />
            </span>
            <h1 className="problem-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Tài Khoản Quản Trị NHCOJ</h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Quản lý câu hỏi thi đấu, cập nhật bộ testcase và đồng bộ dữ liệu thời gian thực trên Firestore Cloud.
          </p>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.25rem 0.625rem', borderRadius: '1rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Hệ Thống Tự Động Đồng Bộ Dữ Liệu Realtime (Active)
            </span>
            <a 
              href="https://console.firebase.google.com/project/iconic-caldron-f7krv/firestore/databases/ai-studio-csoj-42055485-0df2-442c-a19b-74afb9f5489f/data" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              🔗 Mở Trang Quản Lý Firestore Console
            </a>
          </div>
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
        <div className="fixed top-5 right-5 z-50 px-5 py-4 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-3 transition-all border max-w-xs md:max-w-md"
          style={{
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
            borderColor: notification.type === 'success' ? '#10b981' : '#ef4444',
            color: notification.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
          <span className="font-semibold text-xs md:text-sm leading-relaxed">{notification.message}</span>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(120,120,120,0.08)', padding: '0.25rem', borderRadius: '0.5rem', width: 'fit-content' }}>
        <button
          onClick={() => setAdminTab('list')}
          className="csoj-btn"
          style={{
            background: adminTab === 'list' ? 'var(--accent-gradient)' : 'transparent',
            color: adminTab === 'list' ? 'white' : 'var(--text-muted)',
            boxShadow: adminTab === 'list' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            borderRadius: '0.375rem',
            fontWeight: 700
          }}
        >
          Danh sách câu hỏi ({problems.length})
        </button>
        <button
          onClick={handleOpenAddTab}
          className="csoj-btn"
          style={{
            background: adminTab === 'add' ? 'var(--accent-gradient)' : 'transparent',
            color: adminTab === 'add' ? 'white' : 'var(--text-muted)',
            boxShadow: adminTab === 'add' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            borderRadius: '0.375rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          {editingProblemId ? <Pencil size={13} /> : <Plus size={13} />}
          <span>{editingProblemId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</span>
        </button>
        <button
          onClick={() => setAdminTab('submissions')}
          className="csoj-btn"
          style={{
            background: adminTab === 'submissions' ? 'var(--accent-gradient)' : 'transparent',
            color: adminTab === 'submissions' ? 'white' : 'var(--text-muted)',
            boxShadow: adminTab === 'submissions' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            borderRadius: '0.375rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          <Trophy size={13} />
          <span>Bảng điểm học viên</span>
        </button>
      </div>

      {/* VIEW 1: Problems List Management */}
      {adminTab === 'list' && (
        <div className="liquid-glass rounded-xl overflow-hidden border border-[var(--border-element)] shadow-xl w-full">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full border-collapse text-left text-xs md:text-sm min-w-[700px]">
              <thead>
                <tr style={{ background: 'rgba(120, 120, 120, 0.05)', borderBottom: '1px solid var(--border-element)' }}>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mã câu hỏi (ID)</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tiêu đề</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Độ khó</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tên hàm (Entry)</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tham số</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Số lượng testcase</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-element)]">
                {problems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Không có câu hỏi nào hiện tại. Hãy tạo câu hỏi mới ngay!
                    </td>
                  </tr>
                ) : (
                  problems.map((prob) => (
                    <tr key={prob.id} className="hover:bg-white/[0.02] transition-colors">
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>{prob.id}</td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{prob.title}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge-difficulty ${prob.difficulty === 'Dễ' ? 'easy' : prob.difficulty === 'Trung bình' ? 'medium' : 'hard'}`}>
                          {prob.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 600 }}>{prob.entryFunctionName}</td>
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prob.inputNames.join(', ')}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#10b981' }}>{prob.testCases.length} tc</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleEditProblemClick(prob)}
                            className="csoj-btn csoj-btn-outline"
                            style={{ padding: '0.375rem', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.2)' }}
                            title="Chỉnh sửa câu hỏi"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProblemToDelete(prob)}
                            className="csoj-btn csoj-btn-outline"
                            style={{ padding: '0.375rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
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
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          
          {/* Section 1: Core Problem Metadata */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-element)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-element)', color: 'var(--text-primary)' }}>
              <FileText size={18} style={{ color: '#10b981' }} />
              <span>1. Thông tin cơ bản</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {/* ID */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)' }}>Mã định danh duy nhất (ID)</label>
                <input
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="Ví dụ: two-sum-advance"
                  className="csoj-input"
                  style={{ paddingLeft: '1rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Title */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  <span>Tiêu đề bài toán</span>
                  <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Tìm số nguyên tố, Tổng lớn nhất, v.v..."
                  className="csoj-input"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              {/* Difficulty */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)' }}>Độ khó đề bài</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="csoj-input"
                  style={{ paddingLeft: '1rem', background: 'var(--bg-input)', color: 'var(--text-input)' }}
                >
                  <option value="Dễ" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Dễ (Easy)</option>
                  <option value="Trung bình" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Trung bình (Medium)</option>
                  <option value="Khó" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Khó (Hard)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Automated Testing Testcases (The Engine) */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-element)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-element)', color: 'var(--text-primary)' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} />
              <span>2. Bộ testcase kiểm thử chấm điểm tự động</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '-0.5rem 0 0.5rem 0', lineHeight: 1.5 }}>
              Nhập các bộ dữ liệu kiểm thử thực tế. Các giá trị bắt buộc phải là định dạng JSON hợp lệ (ví dụ: mảng dùng dấu ngoặc vuông <code>[...]</code>, chuỗi ký tự dùng dấu nháy kép <code>"..."</code>, giá trị boolean viết thường <code>true</code> / <code>false</code>).
            </p>

            {/* Testcases Form Wrapper */}
            <div style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-element)', background: 'rgba(120,120,120,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span>Tải lên file Testcase (.inp, .out)</span>
                  <span style={{ fontSize: '0.625rem', fontWeight: 400, fontStyle: 'italic' }}>Hệ thống sẽ tự động điền vào ô Input hoặc Output tương ứng</span>
                </label>
                <input
                  type="file"
                  accept=".inp,.out,.txt"
                  onChange={handleFileUpload}
                  className="csoj-input"
                  style={{ paddingLeft: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span>Tham số truyền vào hàm (Input)</span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 400, fontStyle: 'italic' }}>JSON, cách nhau bằng dấu phẩy</span>
                  </label>
                  <input
                    type="text"
                    value={tcInputStr}
                    onChange={(e) => setTcInputStr(e.target.value)}
                    placeholder={parsedInputNames.length > 1 ? '[2, 7, 11, 15], 9' : '121'}
                    className="csoj-input"
                    style={{ paddingLeft: '1rem', fontFamily: 'var(--font-mono)' }}
                  />
                  {testCases.length > 0 && (
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Tự động ánh xạ vào {parsedInputNames.length} biến đầu vào.
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span>Kết quả mong muốn trả về (Output)</span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 400, fontStyle: 'italic' }}>Định dạng JSON</span>
                  </label>
                  <input
                    type="text"
                    value={tcExpectedStr}
                    onChange={(e) => setTcExpectedStr(e.target.value)}
                    placeholder='[0, 1] hoặc true hoặc "xyz"'
                    className="csoj-input"
                    style={{ paddingLeft: '1rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="csoj-btn csoj-btn-primary"
                  style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}
                >
                  <Plus size={14} />
                  <span>Thêm Testcase</span>
                </button>
              </div>
            </div>

            {/* Testcases List with Real-time Parsing Feedback */}
            {testCases.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Danh sách Testcases đã thêm ({testCases.length}):</div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="custom-scrollbar pr-1">
                  {testCases.map((tc, index) => {
                    const valCheck = validateTestcase(tc.inputStr, tc.expectedStr);
                    return (
                      <div key={index} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${valCheck.valid ? 'border-[var(--border-element)]' : 'border-red-500/30'}`}
                        style={{ background: valCheck.valid ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)' }}
                      >
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.125rem 0.5rem', borderRadius: '0.25rem' }}>TC #{index + 1}</span>
                            {!valCheck.valid && <span style={{ fontSize: '0.625rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={12}/> Lỗi định dạng JSON</span>}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ width: '100%' }}>
                            <div>
                              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Input params:</span>
                              <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(120,120,120,0.06)', padding: '0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', display: 'block', border: '1px solid var(--border-element)', wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxHeight: '80px', overflowY: 'auto' }}>
                                {tc.inputStr}
                              </code>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Expected Output:</span>
                              <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(120,120,120,0.06)', padding: '0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', display: 'block', border: '1px solid var(--border-element)', color: '#10b981', wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxHeight: '80px', overflowY: 'auto' }}>
                                {tc.expectedStr}
                              </code>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(index)}
                          className="csoj-btn csoj-btn-outline"
                          style={{ padding: '0.375rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', alignSelf: 'flex-end' }}
                          title="Xóa testcase"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.25rem 0 0 0' }}>
                <AlertTriangle size={14} />
                <span>* Bắt buộc: Phải có ít nhất 1 testcase để hệ thống có thể đối chiếu chấm thi.</span>
              </p>
            )}
          </div>

          {/* Section 3: Detailed Problem Description */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-element)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-element)', color: 'var(--text-primary)' }}>
              <FileText size={18} style={{ color: '#10b981' }} />
              <span>3. Nội dung chi tiết đề bài</span>
            </h2>
            
            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span>Mô tả chi tiết đề bài (Sử dụng Markdown chuyên nghiệp)</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 400, fontStyle: 'italic' }}>Hỗ trợ đầy đủ cú pháp Markdown: **, *, `, ```, ###, -</span>
              </label>

              {/* Quick Markdown Insertion Tools Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', padding: '0.5rem', background: 'rgba(120,120,120,0.03)', border: '1px solid var(--border-element)', borderRadius: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700 }}
                >
                  In đậm (**)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700 }}
                >
                  In nghiêng (*)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('`', '`')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700 }}
                >
                  Mã dòng (`)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n```\n', '\n```\n')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700 }}
                >
                  Khối mã (```)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- ', '\n')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700 }}
                >
                  Danh sách (-)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('### ', '\n')}
                  className="csoj-btn csoj-btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700 }}
                >
                  Tiêu đề phụ (###)
                </button>
                <button
                  type="button"
                  onClick={insertStandardTemplate}
                  className="csoj-btn"
                  style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                >
                  <span>Mẫu đề thi chuẩn 📝</span>
                </button>
              </div>

              <textarea
                ref={textareaRef}
                required
                rows={12}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập đề bài ở định dạng Markdown hoặc sử dụng nút 'Mẫu đề thi chuẩn' ở trên để tự động điền mẫu."
                className="csoj-input"
                style={{ padding: '1rem', fontFamily: 'var(--font-mono)', minHeight: '200px', width: '100%', resize: 'vertical' }}
              />

              {/* Markdown Live Preview Box */}
              {description.trim() && (
                <div style={{ marginTop: '1rem', padding: '1rem', border: '1px dashed var(--border-element)', borderRadius: '0.75rem', background: 'rgba(120,120,120,0.02)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.375rem' }}>
                    Xem trước đề thi trực quan (Live Preview)
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="custom-scrollbar">
                    <MarkdownRenderer
                      className="problem-prose coding-desc-preview"
                      content={description}
                      style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setEditingProblemId(null);
                setAdminTab('list');
                setTitle('');
              }}
              className="csoj-btn csoj-btn-outline"
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="csoj-btn csoj-btn-primary"
              style={{ padding: '0.75rem 2rem', fontWeight: 700 }}
            >
              <span>Lưu câu hỏi & Cập nhật đề thi</span>
            </button>
          </div>
        </form>
      )}

      {/* Custom Confirmation Modal for Deleting */}
      {problemToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="liquid-glass" style={{ maxWidth: '450px', width: '100%', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-element)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
              <AlertTriangle size={24} className="shrink-0" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>Xác nhận xóa câu hỏi</h3>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Bạn có chắc chắn muốn xóa câu hỏi/bài toán <strong>"{problemToDelete.title}"</strong> (ID: {problemToDelete.id}) ra khỏi đề thi không? Hành động này không thể hoàn tác.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setProblemToDelete(null)}
                className="csoj-btn csoj-btn-outline"
                style={{ padding: '0.5rem 1.25rem', fontWeight: 700 }}
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
                style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1.5rem', fontWeight: 700 }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Student Submissions / Grades */}
      {adminTab === 'submissions' && (
        <div className="liquid-glass rounded-xl overflow-hidden border border-[var(--border-element)] shadow-xl w-full p-4 md:p-6">
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Bảng Điểm Từng Học Viên
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Danh sách chi tiết tiến trình thực tế, điểm số và bài làm chi tiết của từng người học.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontWeight: 600 }}>
              Cập nhật tự động mỗi 4 giây
            </span>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full border-collapse text-left text-xs md:text-sm min-w-[800px]">
              <thead>
                <tr style={{ background: 'rgba(120, 120, 120, 0.05)', borderBottom: '1px solid var(--border-element)' }}>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>STT</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tên học viên (Username)</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Số bài Đạt (Đạt / Tổng)</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Điểm số (Thang 10)</th>
                  <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Chi tiết từng bài thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-element)]">
                {Object.keys(submissions).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Chưa có học viên nào nộp bài hoặc bắt đầu làm bài thi lập trình.
                    </td>
                  </tr>
                ) : (
                  Object.values(submissions)
                    .sort((a, b) => b.score - a.score)
                    .map((sub: any, index) => {
                      const userAnswers = sub.codingAnswers || {};
                      const passedCount = Object.values(userAnswers).filter((ans: any) => ans.passed).length;
                      return (
                        <tr key={sub.username} className="hover:bg-white/[0.02] transition-colors">
                          <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>{index + 1}</td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sub.username}</td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>
                            <span style={{ color: passedCount === problems.length && problems.length > 0 ? '#10b981' : 'var(--text-secondary)' }}>
                              {passedCount} / {problems.length}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                              {parseFloat((sub.score || 0).toFixed(1))}đ
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {problems.length === 0 ? (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>Chưa có câu hỏi thi nào được thêm</span>
                              ) : (
                                problems.map((prob) => {
                                  const ans = userAnswers[prob.id];
                                  const hasSubmitted = !!ans;
                                  const passed = ans?.passed;
                                  return (
                                    <div 
                                      key={prob.id}
                                      style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.375rem', 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '0.375rem', 
                                        background: passed ? 'rgba(16, 185, 129, 0.1)' : hasSubmitted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(120, 120, 120, 0.04)',
                                        border: `1px solid ${passed ? 'rgba(16, 185, 129, 0.2)' : hasSubmitted ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-element)'}`,
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{prob.title}:</span>
                                      {hasSubmitted ? (
                                        <button
                                          type="button"
                                          onClick={() => setViewingUserCode({
                                            username: sub.username,
                                            problemId: prob.id,
                                            code: ans.code || '',
                                            language: ans.language || 'python',
                                            passed: !!ans.passed
                                          })}
                                          className="hover:underline font-bold"
                                          style={{ color: passed ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.125rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                        >
                                          <span>{passed ? 'ĐẠT' : 'SAI'}</span>
                                          <Eye size={11} />
                                        </button>
                                      ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa làm</span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Code Viewer Modal for Admin to view student submissions */}
      {viewingUserCode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="liquid-glass" style={{ maxWidth: '800px', width: '100%', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-element)', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>Mã nguồn bài làm của học viên</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Học viên: <strong style={{ color: 'var(--text-primary)' }}>{viewingUserCode.username}</strong> | Mã bài: <strong style={{ color: 'var(--text-primary)' }}>{viewingUserCode.problemId}</strong> | Ngôn ngữ: <strong style={{ color: '#10b981', textTransform: 'uppercase' }}>{viewingUserCode.language}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingUserCode(null)} 
                style={{ background: 'rgba(120,120,120,0.1)', border: 'none', padding: '0.375rem', borderRadius: '50%', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: viewingUserCode.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: viewingUserCode.passed ? '#10b981' : '#ef4444', fontWeight: 700 }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: viewingUserCode.passed ? '#10b981' : '#ef4444' }}></span>
              <span>Trạng thái kiểm thử chấm điểm: {viewingUserCode.passed ? 'ĐẠT (Tất cả testcases chính xác)' : 'KHÔNG ĐẠT (Sai hoặc lỗi logic)'}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border-element)', background: 'rgba(0,0,0,0.2)', padding: '1rem' }} className="custom-scrollbar">
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#e2e8f0', lineHeight: 1.5 }}>
                {viewingUserCode.code || '// Học viên chưa lưu hoặc nộp bài.'}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-element)' }}>
              <button
                type="button"
                onClick={() => setViewingUserCode(null)}
                className="csoj-btn csoj-btn-primary"
                style={{ padding: '0.5rem 1.5rem', fontWeight: 700 }}
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
