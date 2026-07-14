import { CodingProblem } from '../types';

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Dễ',
    descriptionHtml: `Cho một mảng số nguyên \`nums\` và một số nguyên \`target\`.

Bạn cần tìm hai chỉ số \`i\` và \`j\` sao cho \`nums[i] + nums[j] == target\` và \`i != j\`.

Trả về chỉ số của hai số đó dưới dạng một mảng chứa 2 phần tử.`,
    inputFormat: `- Dòng đầu tiên chứa số nguyên $n$ ($2 \\le n \\le 10^5$) là số lượng phần tử của mảng.
- Dòng thứ hai chứa $n$ số nguyên $nums[i]$ cách nhau bởi khoảng trắng.
- Dòng thứ ba chứa số nguyên $target$.`,
    outputFormat: 'In ra hai chỉ số i và j (i < j) thỏa mãn điều kiện cách nhau bởi khoảng trắng.',
    examples: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9. Do đó kết quả trả về là 0 1."
      },
      {
        input: "3\n3 2 4\n6",
        output: "1 2",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6. Do đó kết quả trả về là 1 2."
      }
    ],
    constraints: [],
    entryFunctionName: 'twoSum',
    inputNames: ['nums', 'target'],
    defaultCode: {
      python: `def two_sum(nums, target):
    """
    Hãy viết hàm tìm hai chỉ số i và j sao cho nums[i] + nums[j] == target và i != j.
    """
    # Viết code của bạn ở đây
    pass
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Viết code của bạn ở đây
    return {};
}
`,
      pascal: `function twoSum(nums: array of integer; target: integer): array of integer;
var
    res: array of integer;
begin
    // Viết code của bạn ở đây
    SetLength(res, 0);
    exit(res);
end;
`
    },
    testCases: [
      {
        input: [[2, 7, 11, 15], 9],
        expected: [0, 1],
        rawInput: "nums = [2, 7, 11, 15], target = 9"
      },
      {
        input: [[3, 2, 4], 6],
        expected: [1, 2],
        rawInput: "nums = [3, 2, 4], target = 6"
      },
      {
        input: [[3, 3], 6],
        expected: [0, 1],
        rawInput: "nums = [3, 3], target = 6"
      }
    ]
  },
  {
    id: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'Dễ',
    descriptionHtml: `Cho một số nguyên \`x\`.

Trả về \`true\` nếu \`x\` là một số đối xứng (đọc từ trái sang phải giống hệt như đọc từ phải sang trái), ngược lại trả về \`false\`.`,
    inputFormat: `- Một dòng duy nhất chứa số nguyên $x$ ($-2^{31} \\le x \\le 2^{31} - 1$).`,
    outputFormat: 'In ra "true" nếu x là số đối xứng, ngược lại in ra "false".',
    examples: [
      {
        input: "121",
        output: "true",
        explanation: "121 đọc từ phải sang trái vẫn là 121. Do đó kết quả là true."
      },
      {
        input: "-121",
        output: "false",
        explanation: "Từ trái sang phải là -121, nhưng từ phải sang trái là 121-. Do đó không đối xứng."
      }
    ],
    constraints: [],
    entryFunctionName: 'isPalindrome',
    inputNames: ['x'],
    defaultCode: {
      python: `def is_palindrome(x):
    """
    Hãy viết hàm kiểm tra xem x có phải là số đối xứng hay không.
    """
    # Viết code của bạn ở đây
    return False
`,
      cpp: `#include <iostream>

using namespace std;

bool isPalindrome(int x) {
    // Viết code của bạn ở đây
    return false;
}
`,
      pascal: `function isPalindrome(x: integer): boolean;
var
    // Khai báo biến tại đây nếu cần thiết
begin
    // Viết code của bạn ở đây
    exit(false);
end;
`
    },
    testCases: [
      {
        input: [121],
        expected: true,
        rawInput: "x = 121"
      },
      {
        input: [-121],
        expected: false,
        rawInput: "x = -121"
      },
      {
        input: [10],
        expected: false,
        rawInput: "x = 10"
      }
    ]
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Trung bình',
    descriptionHtml: `Cho một chuỗi ký tự \`s\` chỉ chứa các ký tự ngoặc: \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` và \`']'\`.

Hãy xác định xem chuỗi đầu vào có hợp lệ hay không.

Một chuỗi đầu vào được coi là hợp lệ nếu:

1. Các dấu ngoặc mở phải được đóng bằng các dấu ngoặc cùng loại.
2. Các dấu ngoặc phải được đóng theo đúng thứ tự mở trước đó.
3. Mỗi dấu ngoặc đóng có một dấu ngoặc mở tương ứng cùng loại đứng trước.`,
    inputFormat: `- Một dòng duy nhất chứa chuỗi $s$ ($1 \\le s.length \\le 10^4$).`,
    outputFormat: 'In ra "true" nếu chuỗi hợp lệ, ngược lại in ra "false".',
    examples: [
      {
        input: "()",
        output: "true"
      },
      {
        input: "()[]{}",
        output: "true"
      },
      {
        input: "(]",
        output: "false"
      }
    ],
    constraints: [],
    entryFunctionName: 'isValid',
    inputNames: ['s'],
    defaultCode: {
      python: `def is_valid(s):
    """
    Hãy viết hàm xác định xem chuỗi các dấu ngoặc s có hợp lệ hay không.
    """
    # Viết code của bạn ở đây
    return False
`,
      cpp: `#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>

using namespace std;

bool isValid(string s) {
    // Viết code của bạn ở đây
    return false;
}
`,
      pascal: `function isValid(s: string): boolean;
var
    // Khai báo biến tại đây nếu cần thiết
begin
    // Viết code của bạn ở đây
    exit(false);
end;
`
    },
    testCases: [
      {
        input: ["()"],
        expected: true,
        rawInput: 's = "()"'
      },
      {
        input: ["()[]{}"],
        expected: true,
        rawInput: 's = "()[]{}"'
      },
      {
        input: ["(]"],
        expected: false,
        rawInput: 's = "(]"'
      }
    ]
  }
];
