import { CodingProblem } from '../types';

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Dễ',
    descriptionHtml: `
      <p>Cho một mảng số nguyên <code>nums</code> và một số nguyên <code>target</code>.</p>
      <p>Bạn cần tìm hai chỉ số <code>i</code> và <code>j</code> sao cho <code>nums[i] + nums[j] == target</code> và <code>i != j</code>.</p>
      <p>Trả về chỉ số của hai số đó dưới dạng một mảng chứa 2 phần tử.</p>
    `,
    inputFormat: `
      <ul>
        <li>Dòng đầu tiên chứa số nguyên n (2 ≤ n ≤ 10⁵) là số lượng phần tử của mảng.</li>
        <li>Dòng thứ hai chứa n số nguyên nums[i] cách nhau bởi khoảng trắng.</li>
        <li>Dòng thứ ba chứa số nguyên target.</li>
      </ul>
    `,
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
    constraints: [
      "2 ≤ n ≤ 10⁵",
      "-10⁹ ≤ nums[i], target ≤ 10⁹",
      "Chỉ có duy nhất một đáp án đúng."
    ],
    entryFunctionName: 'twoSum',
    inputNames: ['nums', 'target'],
    defaultCode: {
      python: `def two_sum(nums, target):
    """
    Tìm indices i, j sao cho nums[i] + nums[j] == target
    """
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`,
      javascript: `function twoSum(nums, target) {
    // Viết code của bạn ở đây
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [];
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    int n, target;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cin >> target;
    vector<int> ans = twoSum(nums, target);
    cout << ans[0] << " " << ans[1] << endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        int[] ans = twoSum(nums, target);
        System.out.println(ans[0] + " " + ans[1]);
    }
}
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
    descriptionHtml: `
      <p>Cho một số nguyên <code>x</code>.</p>
      <p>Trả về <code>true</code> nếu <code>x</code> là một số đối xứng (đọc từ trái sang phải giống hệt như đọc từ phải sang trái), ngược lại trả về <code>false</code>.</p>
    `,
    inputFormat: `
      <ul>
        <li>Một dòng duy nhất chứa số nguyên x (-2³¹ ≤ x ≤ 2³¹ - 1).</li>
      </ul>
    `,
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
    constraints: [
      "-2³¹ ≤ x ≤ 2³¹ - 1",
      "Hãy giải bài toán này mà không cần chuyển số nguyên thành chuỗi ký tự."
    ],
    entryFunctionName: 'isPalindrome',
    inputNames: ['x'],
    defaultCode: {
      python: `def is_palindrome(x):
    """
    Trả về True nếu x là số đối xứng, ngược lại False
    """
    if x < 0 or (x % 10 == 0 and x != 0):
        return False
        
    reverted_number = 0
    while x > reverted_number:
        reverted_number = reverted_number * 10 + x % 10
        x //= 10
        
    return x == reverted_number or x == reverted_number // 10
`,
      javascript: `function isPalindrome(x) {
    // Viết code của bạn ở đây
    if (x < 0 || (x % 10 === 0 && x !== 0)) {
        return false;
    }
    
    let revertedNumber = 0;
    let temp = x;
    while (temp > revertedNumber) {
        revertedNumber = revertedNumber * 10 + (temp % 10);
        temp = Math.floor(temp / 10);
    }
    
    return temp === revertedNumber || temp === Math.floor(revertedNumber / 10);
}
`,
      cpp: `#include <iostream>

using namespace std;

bool isPalindrome(int x) {
    if (x < 0 || (x % 10 == 0 && x != 0)) {
        return false;
    }
    int revertedNumber = 0;
    while (x > revertedNumber) {
        revertedNumber = revertedNumber * 10 + x % 10;
        x /= 10;
    }
    return x == revertedNumber || x == revertedNumber / 10;
}

int main() {
    int x;
    if (cin >> x) {
        cout << (isPalindrome(x) ? "true" : "false") << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static boolean isPalindrome(int x) {
        if (x < 0 || (x % 10 == 0 && x != 0)) {
            return false;
        }
        int revertedNumber = 0;
        while (x > revertedNumber) {
            revertedNumber = revertedNumber * 10 + x % 10;
            x /= 10;
        }
        return x == revertedNumber || x == revertedNumber / 10;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int x = sc.nextInt();
            System.out.println(isPalindrome(x) ? "true" : "false");
        }
    }
}
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
    descriptionHtml: `
      <p>Cho một chuỗi ký tự <code>s</code> chỉ chứa các ký tự ngoặc: <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> và <code>']'</code>.</p>
      <p>Hãy xác định xem chuỗi đầu vào có hợp lệ hay không.</p>
      <p>Một chuỗi đầu vào được coi là hợp lệ nếu:</p>
      <ol>
        <li>Các dấu ngoặc mở phải được đóng bằng các dấu ngoặc cùng loại.</li>
        <li>Các dấu ngoặc phải được đóng theo đúng thứ tự mở trước đó.</li>
        <li>Mỗi dấu ngoặc đóng có một dấu ngoặc mở tương ứng cùng loại đứng trước.</li>
      </ol>
    `,
    inputFormat: `
      <ul>
        <li>Một dòng duy nhất chứa chuỗi s (1 ≤ s.length ≤ 10⁴).</li>
      </ul>
    `,
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
    constraints: [
      "1 ≤ s.length ≤ 10⁴",
      "Chuỗi s chỉ chứa các ký tự ngoặc '()[]{}'"
    ],
    entryFunctionName: 'isValid',
    inputNames: ['s'],
    defaultCode: {
      python: `def is_valid(s):
    """
    Trả về True nếu chuỗi s hợp lệ, ngược lại False
    """
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack
`,
      javascript: `function isValid(s) {
    // Viết code của bạn ở đây
    const stack = [];
    const mapping = {
        ')': '(',
        '}': '{',
        ']': '['
    };
    for (let i = 0; i < s.length; i++) {
        const char = s[i];
        if (mapping[char]) {
            const topElement = stack.length > 0 ? stack.pop() : '#';
            if (mapping[char] !== topElement) {
                return false;
            }
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}
`,
      cpp: `#include <iostream>
#include <stack>
#include <unordered_map>

using namespace std;

bool isValid(string s) {
    stack<char> st;
    unordered_map<char, char> mapping = {
        {')', '('},
        {'}', '{'},
        {']', '['}
    };
    for (char c : s) {
        if (mapping.count(c)) {
            char top = st.empty() ? '#' : st.top();
            if (!st.empty()) st.pop();
            if (top != mapping[c]) return false;
        } else {
            st.push(c);
        }
    }
    return st.empty();
}

int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        Map<Character, Character> mapping = new HashMap<>();
        mapping.put(')', '(');
        mapping.put('}', '{');
        mapping.put(']', '[');
        
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (mapping.containsKey(c)) {
                char topElement = stack.isEmpty() ? '#' : stack.pop();
                if (topElement != mapping.get(c)) {
                    return false;
                }
            } else {
                stack.push(c);
            }
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String s = sc.next();
            System.out.println(isValid(s) ? "true" : "false");
        }
    }
}
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
