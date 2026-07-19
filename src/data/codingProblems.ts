import { CodingProblem } from '../types';

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'tong-hai-so',
    title: 'Tổng hai số',
    difficulty: 'Dễ',
    descriptionHtml: '<p>Viết chương trình nhận vào hai số nguyên <strong>a</strong> và <strong>b</strong>. Tính và trả về tổng của hai số đó.</p>',
    inputFormat: 'Tham số truyền vào là hai số nguyên a và b.',
    outputFormat: 'Trả về tổng của a và b.',
    examples: [
      { input: 'a = 3, b = 5', output: '8', explanation: '3 + 5 = 8' }
    ],
    constraints: ['a, b có giá trị tuyệt đối không quá 10^9'],
    entryFunctionName: 'solve',
    inputNames: ['a', 'b'],
    defaultCode: {
      python: "def solve(a, b):\n    # Viết code của bạn ở đây\n    return a + b\n",
      cpp: "int solve(int a, int b) {\n    // Viết code của bạn ở đây\n    return a + b;\n}\n",
      pascal: "function solve(a, b: integer): integer;\nbegin\n    // Viết code của bạn ở đây\n    solve := a + b;\nend;\n"
    },
    testCases: [
      { input: [1, 2], expected: 3, rawInput: 'a = 1, b = 2' },
      { input: [100, 200], expected: 300, rawInput: 'a = 100, b = 200' },
      { input: [-5, 5], expected: 0, rawInput: 'a = -5, b = 5' }
    ]
  },
  {
    id: 'kiem-tra-so-nguyen-to',
    title: 'Kiểm tra số nguyên tố',
    difficulty: 'Dễ',
    descriptionHtml: '<p>Kiểm tra xem số nguyên dương <strong>n</strong> có phải là số nguyên tố hay không.</p>',
    inputFormat: 'Số nguyên dương n.',
    outputFormat: 'Trả về true nếu là số nguyên tố, ngược lại trả về false.',
    examples: [
      { input: 'n = 7', output: 'true', explanation: '7 chỉ chia hết cho 1 và chính nó.' },
      { input: 'n = 4', output: 'false', explanation: '4 chia hết cho 2.' }
    ],
    constraints: ['1 <= n <= 10^9'],
    entryFunctionName: 'isPrime',
    inputNames: ['n'],
    defaultCode: {
      python: "def isPrime(n):\n    if n < 2: return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0: return False\n    return True\n",
      cpp: "bool isPrime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i * i <= n; i++) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}\n",
      pascal: "function isPrime(n: integer): boolean;\nvar i: integer;\nbegin\n    if n < 2 then exit(false);\n    for i := 2 to trunc(sqrt(n)) do\n        if n mod i = 0 then exit(false);\n    exit(true);\nend;\n"
    },
    testCases: [
      { input: [2], expected: true, rawInput: 'n = 2' },
      { input: [3], expected: true, rawInput: 'n = 3' },
      { input: [4], expected: false, rawInput: 'n = 4' },
      { input: [7], expected: true, rawInput: 'n = 7' },
      { input: [9], expected: false, rawInput: 'n = 9' },
      { input: [97], expected: true, rawInput: 'n = 97' }
    ]
  }
];
