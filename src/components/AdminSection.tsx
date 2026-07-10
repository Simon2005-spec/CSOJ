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
  Briefcase
} from 'lucide-react';
import { CodingProblem } from '../types';

interface AdminSectionProps {
  problems: CodingProblem[];
  onAddProblem: (newProblem: CodingProblem) => void;
  onRemoveProblem: (problemId: string) => void;
  onLogout: () => void;
}

export default function AdminSection({ 
  problems, 
  onAddProblem, 
  onRemoveProblem, 
  onLogout 
}: AdminSectionProps) {
  // Navigation / Tabs within Admin
  const [adminTab, setAdminTab] = useState<'list' | 'add'>('list');

  // Form Fields State
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Dễ');
  const [description, setDescription] = useState('');
  const [entryFunctionName, setEntryFunctionName] = useState('');
  const [inputNamesStr, setInputNamesStr] = useState('');
  
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

  // Custom confirm state for deleting
  const [problemToDelete, setProblemToDelete] = useState<CodingProblem | null>(null);

  // Customizable Boilerplate Code Templates
  const [customPython, setCustomPython] = useState('');
  const [customPascal, setCustomPascal] = useState('');
  const [customCpp, setCustomCpp] = useState('');
  const [isUsingAutoTemplates, setIsUsingAutoTemplates] = useState(true);

  // Success / Error Alerts
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-generate ID based on Title
  useEffect(() => {
    if (adminTab === 'add') {
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
    }
  }, [title, adminTab]);

  // Handle Input Names parsing
  const parsedInputNames = inputNamesStr
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  // Generate standard code templates automatically on field changes
  useEffect(() => {
    if (isUsingAutoTemplates && entryFunctionName && parsedInputNames.length > 0) {
      const argsList = parsedInputNames.join(', ');
      
      const pyFn = entryFunctionName.replace(/([A-Z])/g, '_$1').toLowerCase();
      setCustomPython(`def ${pyFn}(${argsList}):
    """
    Hãy viết hàm xử lý thuật toán tại đây.
    """
    # Viết code của bạn ở đây
    return None
`);

      setCustomPascal(`function ${entryFunctionName}(${parsedInputNames.map(name => `${name}: integer`).join('; ')}): integer;
var
    // Khai báo biến tại đây nếu cần thiết
begin
    // Viết code của bạn ở đây
    exit(0);
end;
`);

      setCustomCpp(`#include <iostream>
#include <vector>
#include <string>

using namespace std;

// Thay đổi kiểu dữ liệu trả về và tham số nếu cần thiết
int ${entryFunctionName}(${parsedInputNames.map(name => `int ${name}`).join(', ')}) {
    // Viết code của bạn ở đây
    return 0;
}

int main() {
    int ${parsedInputNames.join(', ')};
    // Đọc dữ liệu từ cin và gọi hàm xử lý của bạn
    return 0;
}
`);
    }
  }, [entryFunctionName, inputNamesStr, isUsingAutoTemplates, adminTab]);

  // Helper validation for testcases JSON
  const validateTestcase = (inputsStr: string, expStr: string): { valid: boolean; error?: string; parsedInput?: any[]; parsedExpected?: any } => {
    let parsedInput: any[] = [];
    let parsedExpected: any;

    // 1. Parse expected output
    try {
      parsedExpected = JSON.parse(expStr);
    } catch (e) {
      // Fall back to treating it as a raw string (trimmed)
      parsedExpected = expStr.trim();
    }

    // 2. Parse inputs
    try {
      // Try parsing as JSON array
      const tempInput = JSON.parse('[' + inputsStr + ']');
      if (Array.isArray(tempInput) && tempInput.length === parsedInputNames.length) {
        parsedInput = tempInput;
      } else if (parsedInputNames.length === 1) {
        // If it failed length check but we only expect 1 argument, try parsing inputsStr directly
        parsedInput = [JSON.parse(inputsStr)];
      } else {
        throw new Error('Mismatch length');
      }
    } catch (e) {
      // If parsing fails or length mismatch, and we only have 1 input argument:
      if (parsedInputNames.length === 1) {
        // Fall back to treating the whole inputsStr as a raw string
        parsedInput = [inputsStr];
      } else {
        // If we have multiple inputs, split by comma and parse each as JSON if possible, else as string
        const parts = inputsStr.split(',').map(s => s.trim());
        if (parts.length === parsedInputNames.length) {
          parsedInput = parts.map(part => {
            try {
              return JSON.parse(part);
            } catch {
              return part; // fallback to raw string
            }
          });
        } else {
          return {
            valid: false,
            error: `Số lượng tham số đầu vào (${parts.length}) không khớp với số tham số khai báo (${parsedInputNames.length}): [${parsedInputNames.join(', ')}]`
          };
        }
      }
    }

    return { valid: true, parsedInput, parsedExpected };
  };

  const handleOpenAddTab = () => {
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

    const check = validateTestcase(tcInputStr, tcExpectedStr);
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

    if (!id.trim() || !title.trim() || !entryFunctionName.trim() || parsedInputNames.length === 0) {
      showNotification('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc: ID, Tiêu đề, Tên hàm, và Tham số đầu vào.');
      return;
    }

    if (examples.length === 0) {
      showNotification('error', 'Vui lòng thêm ít nhất một Ví dụ mẫu để học sinh dễ hình dung đề bài.');
      return;
    }

    if (testCases.length === 0) {
      showNotification('error', 'Vui lòng thêm ít nhất một Testcase kiểm thử để chạy chấm điểm tự động.');
      return;
    }

    // Validate and build final testcases array
    const validatedTestCases: { input: any[]; expected: any; rawInput: string }[] = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const check = validateTestcase(tc.inputStr, tc.expectedStr);
      if (!check.valid) {
        showNotification('error', `Testcase #${i + 1} không hợp lệ: ${check.error}`);
        return;
      }

      // Build rawInput string representation, e.g. "nums = [2, 7, 11, 15], target = 9"
      const rawInputParts = parsedInputNames.map((name, idx) => {
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

    // Convert flat description text with newlines to paragraph HTML elements
    const descParagraphs = description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('\n');

    const newProblem: CodingProblem = {
      id: id.trim(),
      title: title.trim(),
      difficulty,
      descriptionHtml: descParagraphs || `<p>${title.trim()}</p>`,
      inputFormat: `<ul><li>Tham số đầu vào: <code>${parsedInputNames.join(', ')}</code></li></ul>`,
      outputFormat: `Giá trị trả về của hàm <code>${entryFunctionName.trim()}</code>.`,
      examples,
      constraints,
      entryFunctionName: entryFunctionName.trim(),
      inputNames: parsedInputNames,
      defaultCode: {
        python: customPython || `def ${entryFunctionName}(${parsedInputNames.join(', ')}):\n    pass`,
        cpp: customCpp,
        pascal: customPascal || `function ${entryFunctionName}(${parsedInputNames.map(name => `${name}: integer`).join('; ')}): integer;\nbegin\nend;`
      },
      testCases: validatedTestCases
    };

    onAddProblem(newProblem);
    showNotification('success', `Đã nạp thành công câu hỏi mới: "${newProblem.title}"!`);
    
    // Reset Form
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
            <h1 className="problem-title" style={{ margin: 0, fontSize: '1.5rem' }}>Tài Khoản Quản Trị CSOJ</h1>
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
          <Plus size={14} />
          <span>Thêm câu hỏi mới</span>
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
                    <tr key={prob.id} style={{ borderBottom: '1px solid var(--border-element)', hover: { background: 'rgba(255,255,255,0.01)' } }}>
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
                        <button
                          type="button"
                          onClick={() => setProblemToDelete(prob)}
                          className="csoj-btn csoj-btn-outline"
                          style={{ padding: '0.375rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', hover: { background: 'rgba(239,68,68,0.1)' } }}
                          title="Xóa câu hỏi"
                        >
                          <Trash2 size={14} />
                        </button>
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
              <span>1. Thông tin chung của Bài toán</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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

            {/* Description Textarea */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mô tả chi tiết bài toán (Tự động chuyển dòng thành thẻ đoạn &lt;p&gt;)</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Mỗi lần xuống dòng tạo ra 1 đoạn mới</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập yêu cầu đề bài. Ví dụ:&#10;Cho một số nguyên dương n. Hãy kiểm tra xem n có phải là số nguyên tố hay không.&#10;In ra true nếu n là số nguyên tố, ngược lại in ra false."
                className="csoj-input"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Section 2: Function Signature & Entry Points */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.5rem' }}>
              <Code size={18} style={{ color: '#10b981' }} />
              <span>2. Khai báo hàm & Biến đầu vào</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.75rem', lineHeight: 1.4 }}>
              Cấu hình chính xác tên hàm và các tham số. Trình biên dịch sẽ tự động sinh mã nguồn mẫu tương ứng cho các ngôn ngữ khác nhau dựa trên thông tin này.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Entry Function Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <span>Tên hàm chấm thi (Entry Point)</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={entryFunctionName}
                  onChange={(e) => setEntryFunctionName(e.target.value)}
                  placeholder="Ví dụ: isPrime, twoSum, solve"
                  className="csoj-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Input Names */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <span>Danh sách tham số đầu vào (Cực kỳ quan trọng)</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inputNamesStr}
                  onChange={(e) => setInputNamesStr(e.target.value)}
                  placeholder="Các tham số phân cách bằng dấu phẩy. Ví dụ: nums, target"
                  className="csoj-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Hàm của bạn sẽ nhận dạng tham số: {parsedInputNames.length > 0 ? parsedInputNames.map(n => `"${n}"`).join(', ') : 'Chưa có'}
                </span>
              </div>
            </div>

            {/* Constraints Dynamic List */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ràng buộc & Giới hạn thuật toán</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  placeholder="Ví dụ: -10^9 <= nums[i] <= 10^9"
                  className="csoj-input"
                />
                <button
                  type="button"
                  onClick={handleAddConstraint}
                  className="csoj-btn csoj-btn-primary"
                  style={{ padding: '0 1rem', background: '#10b981', color: 'white' }}
                >
                  Thêm
                </button>
              </div>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {constraints.map((c, index) => (
                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>• {c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveConstraint(index)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', paddingLeft: '1rem' }}
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Examples Builder */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.5rem' }}>
              <Eye size={18} style={{ color: '#10b981' }} />
              <span>3. Ví dụ mẫu cho Học sinh</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.75rem' }}>
              Thêm ít nhất 1-2 ví dụ thực tế có giải thích chi tiết để hiển thị trong mô tả đề bài.
            </p>

            {/* Examples Form Wrapper */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--border-element)' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Đầu vào ví dụ (Dạng Text)</label>
                <textarea
                  rows={2}
                  value={exInput}
                  onChange={(e) => setExInput(e.target.value)}
                  placeholder="Ví dụ:&#10;5&#10;2 3 5 7 11"
                  className="csoj-input"
                  style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Đầu ra ví dụ (Dạng Text)</label>
                <input
                  type="text"
                  value={exOutput}
                  onChange={(e) => setExOutput(e.target.value)}
                  placeholder="Ví dụ: true hoặc 0 1"
                  className="csoj-input"
                  style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Giải thích chi tiết (Tùy chọn)</label>
                <input
                  type="text"
                  value={exExplanation}
                  onChange={(e) => setExExplanation(e.target.value)}
                  placeholder="Ví dụ: Vì 5 là số nguyên tố chỉ chia hết cho 1 và chính nó."
                  className="csoj-input"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleAddExample}
                  className="csoj-btn csoj-btn-primary"
                  style={{ padding: '0.375rem 1rem', fontSize: '0.825rem', background: '#3b82f6', color: 'white' }}
                >
                  Nạp ví dụ mẫu
                </button>
              </div>
            </div>

            {/* Added Examples List */}
            {examples.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
                {examples.map((ex, index) => (
                  <div key={index} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-element)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', flex: 1 }}>
                      <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>Ví dụ #{index + 1}:</span>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                        <div><strong>Input:</strong> <pre style={{ display: 'inline', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{ex.input.replace(/\n/g, ' ')}</pre></div>
                        <div><strong>Output:</strong> <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{ex.output}</code></div>
                      </div>
                      {ex.explanation && <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{ex.explanation}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(index)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Chưa có ví dụ mẫu nào được thêm.</p>
            )}
          </div>

          {/* Section 4: Automated Testing Testcases (The Engine) */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.5rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} />
              <span>4. Testcase kiểm thử chấm điểm tự động</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.75rem', lineHeight: 1.4 }}>
              Nhập các bộ dữ liệu kiểm thử thực tế. Các giá trị bắt buộc phải là định dạng JSON hợp lệ (ví dụ: mảng phải dùng dấu ngoặc vuông <code>[...]</code>, chuỗi ký tự phải bọc trong dấu nháy kép <code>"..."</code>, giá trị boolean viết thường <code>true</code> / <code>false</code>).
            </p>

            {/* Testcases Form Wrapper */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--border-element)' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tham số truyền vào hàm</span>
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
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Truyền lần lượt vào: {parsedInputNames.map(n => `"${n}"`).join(', ')}
                </span>
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
                    <div key={index} style={{ padding: '0.5rem 0.75rem', background: valCheck.valid ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)', border: `1px solid ${valCheck.valid ? 'var(--border-element)' : '#ef4444'}`, borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', flex: 1 }}>
                        <div>
                          <strong style={{ color: '#10b981', marginRight: '0.5rem' }}>TC #{index + 1}:</strong>
                          <span style={{ color: 'var(--text-muted)' }}>Tham số:</span> <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{tc.inputStr}</code>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Kết quả kỳ vọng:</span> <code style={{ fontFamily: 'var(--font-mono)', color: '#10b981', background: 'rgba(0,0,0,0.2)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{tc.expectedStr}</code>
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

          {/* Section 5: Customized Code Boilerplates (Customize Default Editor Code) */}
          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
                <Briefcase size={18} style={{ color: '#10b981' }} />
                <span>5. Tùy biến khung mã nguồn mẫu (Boilerplates)</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <input
                  type="checkbox"
                  id="auto-template-checkbox"
                  checked={isUsingAutoTemplates}
                  onChange={(e) => setIsUsingAutoTemplates(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="auto-template-checkbox" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                  Tự động điền theo Tên hàm
                </label>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.75rem', lineHeight: 1.4 }}>
              Bạn có thể điều chỉnh mã nguồn xuất phát mặc định để học sinh không cần gõ từ đầu hoặc định hướng cấu trúc phù hợp cho từng ngôn ngữ lập trình.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* Python Boilerplate */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Python Template</label>
                <textarea
                  rows={6}
                  value={customPython}
                  onChange={(e) => {
                    setCustomPython(e.target.value);
                    setIsUsingAutoTemplates(false);
                  }}
                  className="csoj-input"
                  style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre', background: '#0f172a' }}
                />
              </div>

              {/* C++ Boilerplate */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', color: '#ec4899' }}>C++ Template</label>
                <textarea
                  rows={6}
                  value={customCpp}
                  onChange={(e) => {
                    setCustomCpp(e.target.value);
                    setIsUsingAutoTemplates(false);
                  }}
                  className="csoj-input"
                  style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre', background: '#0f172a' }}
                />
              </div>

              {/* Pascal Boilerplate */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Pascal Template</label>
                <textarea
                  rows={6}
                  value={customPascal}
                  onChange={(e) => {
                    setCustomPascal(e.target.value);
                    setIsUsingAutoTemplates(false);
                  }}
                  className="csoj-input"
                  style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre', background: '#0f172a' }}
                />
              </div>
            </div>
          </div>

          {/* Form Actions Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
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
