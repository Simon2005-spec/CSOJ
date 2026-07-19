var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_url = require("url");
var import_vite = require("vite");

// src/data/codingProblems.ts
var CODING_PROBLEMS = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "D\u1EC5",
    descriptionHtml: `Cho m\u1ED9t m\u1EA3ng s\u1ED1 nguy\xEAn \`nums\` v\xE0 m\u1ED9t s\u1ED1 nguy\xEAn \`target\`.

B\u1EA1n c\u1EA7n t\xECm hai ch\u1EC9 s\u1ED1 \`i\` v\xE0 \`j\` sao cho \`nums[i] + nums[j] == target\` v\xE0 \`i != j\`.

Tr\u1EA3 v\u1EC1 ch\u1EC9 s\u1ED1 c\u1EE7a hai s\u1ED1 \u0111\xF3 d\u01B0\u1EDBi d\u1EA1ng m\u1ED9t m\u1EA3ng ch\u1EE9a 2 ph\u1EA7n t\u1EED.`,
    inputFormat: `- D\xF2ng \u0111\u1EA7u ti\xEAn ch\u1EE9a s\u1ED1 nguy\xEAn $n$ ($2 \\le n \\le 10^5$) l\xE0 s\u1ED1 l\u01B0\u1EE3ng ph\u1EA7n t\u1EED c\u1EE7a m\u1EA3ng.
- D\xF2ng th\u1EE9 hai ch\u1EE9a $n$ s\u1ED1 nguy\xEAn $nums[i]$ c\xE1ch nhau b\u1EDFi kho\u1EA3ng tr\u1EAFng.
- D\xF2ng th\u1EE9 ba ch\u1EE9a s\u1ED1 nguy\xEAn $target$.`,
    outputFormat: "In ra hai ch\u1EC9 s\u1ED1 i v\xE0 j (i < j) th\u1ECFa m\xE3n \u0111i\u1EC1u ki\u1EC7n c\xE1ch nhau b\u1EDFi kho\u1EA3ng tr\u1EAFng.",
    examples: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9. Do \u0111\xF3 k\u1EBFt qu\u1EA3 tr\u1EA3 v\u1EC1 l\xE0 0 1."
      },
      {
        input: "3\n3 2 4\n6",
        output: "1 2",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6. Do \u0111\xF3 k\u1EBFt qu\u1EA3 tr\u1EA3 v\u1EC1 l\xE0 1 2."
      }
    ],
    constraints: [],
    entryFunctionName: "twoSum",
    inputNames: ["nums", "target"],
    defaultCode: {
      python: `def two_sum(nums, target):
    """
    H\xE3y vi\u1EBFt h\xE0m t\xECm hai ch\u1EC9 s\u1ED1 i v\xE0 j sao cho nums[i] + nums[j] == target v\xE0 i != j.
    """
    # Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
    pass
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
    return {};
}
`,
      pascal: `function twoSum(nums: array of integer; target: integer): array of integer;
var
    res: array of integer;
begin
    // Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
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
    id: "palindrome-number",
    title: "Palindrome Number",
    difficulty: "D\u1EC5",
    descriptionHtml: `Cho m\u1ED9t s\u1ED1 nguy\xEAn \`x\`.

Tr\u1EA3 v\u1EC1 \`true\` n\u1EBFu \`x\` l\xE0 m\u1ED9t s\u1ED1 \u0111\u1ED1i x\u1EE9ng (\u0111\u1ECDc t\u1EEB tr\xE1i sang ph\u1EA3i gi\u1ED1ng h\u1EC7t nh\u01B0 \u0111\u1ECDc t\u1EEB ph\u1EA3i sang tr\xE1i), ng\u01B0\u1EE3c l\u1EA1i tr\u1EA3 v\u1EC1 \`false\`.`,
    inputFormat: `- M\u1ED9t d\xF2ng duy nh\u1EA5t ch\u1EE9a s\u1ED1 nguy\xEAn $x$ ($-2^{31} \\le x \\le 2^{31} - 1$).`,
    outputFormat: 'In ra "true" n\u1EBFu x l\xE0 s\u1ED1 \u0111\u1ED1i x\u1EE9ng, ng\u01B0\u1EE3c l\u1EA1i in ra "false".',
    examples: [
      {
        input: "121",
        output: "true",
        explanation: "121 \u0111\u1ECDc t\u1EEB ph\u1EA3i sang tr\xE1i v\u1EABn l\xE0 121. Do \u0111\xF3 k\u1EBFt qu\u1EA3 l\xE0 true."
      },
      {
        input: "-121",
        output: "false",
        explanation: "T\u1EEB tr\xE1i sang ph\u1EA3i l\xE0 -121, nh\u01B0ng t\u1EEB ph\u1EA3i sang tr\xE1i l\xE0 121-. Do \u0111\xF3 kh\xF4ng \u0111\u1ED1i x\u1EE9ng."
      }
    ],
    constraints: [],
    entryFunctionName: "isPalindrome",
    inputNames: ["x"],
    defaultCode: {
      python: `def is_palindrome(x):
    """
    H\xE3y vi\u1EBFt h\xE0m ki\u1EC3m tra xem x c\xF3 ph\u1EA3i l\xE0 s\u1ED1 \u0111\u1ED1i x\u1EE9ng hay kh\xF4ng.
    """
    # Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
    return False
`,
      cpp: `#include <iostream>

using namespace std;

bool isPalindrome(int x) {
    // Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
    return false;
}
`,
      pascal: `function isPalindrome(x: integer): boolean;
var
    // Khai b\xE1o bi\u1EBFn t\u1EA1i \u0111\xE2y n\u1EBFu c\u1EA7n thi\u1EBFt
begin
    // Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
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
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Trung b\xECnh",
    descriptionHtml: `Cho m\u1ED9t chu\u1ED7i k\xFD t\u1EF1 \`s\` ch\u1EC9 ch\u1EE9a c\xE1c k\xFD t\u1EF1 ngo\u1EB7c: \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` v\xE0 \`']'\`.

H\xE3y x\xE1c \u0111\u1ECBnh xem chu\u1ED7i \u0111\u1EA7u v\xE0o c\xF3 h\u1EE3p l\u1EC7 hay kh\xF4ng.

M\u1ED9t chu\u1ED7i \u0111\u1EA7u v\xE0o \u0111\u01B0\u1EE3c coi l\xE0 h\u1EE3p l\u1EC7 n\u1EBFu:

1. C\xE1c d\u1EA5u ngo\u1EB7c m\u1EDF ph\u1EA3i \u0111\u01B0\u1EE3c \u0111\xF3ng b\u1EB1ng c\xE1c d\u1EA5u ngo\u1EB7c c\xF9ng lo\u1EA1i.
2. C\xE1c d\u1EA5u ngo\u1EB7c ph\u1EA3i \u0111\u01B0\u1EE3c \u0111\xF3ng theo \u0111\xFAng th\u1EE9 t\u1EF1 m\u1EDF tr\u01B0\u1EDBc \u0111\xF3.
3. M\u1ED7i d\u1EA5u ngo\u1EB7c \u0111\xF3ng c\xF3 m\u1ED9t d\u1EA5u ngo\u1EB7c m\u1EDF t\u01B0\u01A1ng \u1EE9ng c\xF9ng lo\u1EA1i \u0111\u1EE9ng tr\u01B0\u1EDBc.`,
    inputFormat: `- M\u1ED9t d\xF2ng duy nh\u1EA5t ch\u1EE9a chu\u1ED7i $s$ ($1 \\le s.length \\le 10^4$).`,
    outputFormat: 'In ra "true" n\u1EBFu chu\u1ED7i h\u1EE3p l\u1EC7, ng\u01B0\u1EE3c l\u1EA1i in ra "false".',
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
    entryFunctionName: "isValid",
    inputNames: ["s"],
    defaultCode: {
      python: `def is_valid(s):
    """
    H\xE3y vi\u1EBFt h\xE0m x\xE1c \u0111\u1ECBnh xem chu\u1ED7i c\xE1c d\u1EA5u ngo\u1EB7c s c\xF3 h\u1EE3p l\u1EC7 hay kh\xF4ng.
    """
    # Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
    return False
`,
      cpp: `#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>

using namespace std;

bool isValid(string s) {
    // Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
    return false;
}
`,
      pascal: `function isValid(s: string): boolean;
var
    // Khai b\xE1o bi\u1EBFn t\u1EA1i \u0111\xE2y n\u1EBFu c\u1EA7n thi\u1EBFt
begin
    // Vi\u1EBFt code c\u1EE7a b\u1EA1n \u1EDF \u0111\xE2y
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

// server.ts
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  const PROBLEMS_FILE = import_path.default.join(process.cwd(), "data_problems.json");
  const SUBMISSIONS_FILE = import_path.default.join(process.cwd(), "data_submissions.json");
  let problems = [];
  try {
    if (import_fs.default.existsSync(PROBLEMS_FILE)) {
      const fileData = import_fs.default.readFileSync(PROBLEMS_FILE, "utf-8");
      problems = JSON.parse(fileData);
    } else {
      problems = [...CODING_PROBLEMS];
      import_fs.default.writeFileSync(PROBLEMS_FILE, JSON.stringify(problems, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error reading problems file:", err);
    problems = [...CODING_PROBLEMS];
  }
  let submissions = {};
  try {
    if (import_fs.default.existsSync(SUBMISSIONS_FILE)) {
      const fileData = import_fs.default.readFileSync(SUBMISSIONS_FILE, "utf-8");
      submissions = JSON.parse(fileData);
    } else {
      submissions = {};
      import_fs.default.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error reading submissions file:", err);
    submissions = {};
  }
  const saveProblems = () => {
    try {
      import_fs.default.writeFileSync(PROBLEMS_FILE, JSON.stringify(problems, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving problems:", err);
    }
  };
  const saveSubmissions = () => {
    try {
      import_fs.default.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving submissions:", err);
    }
  };
  app.get("/api/problems", (req, res) => {
    res.json(problems);
  });
  app.post("/api/problems", (req, res) => {
    const newProb = req.body;
    if (!newProb || !newProb.id) {
      return res.status(400).json({ error: "Invalid problem structure" });
    }
    const index = problems.findIndex((p) => p.id === newProb.id);
    if (index !== -1) {
      problems[index] = newProb;
    } else {
      problems.push(newProb);
    }
    saveProblems();
    res.json({ success: true, problem: newProb });
  });
  app.delete("/api/problems/:id", (req, res) => {
    const id = req.params.id;
    problems = problems.filter((p) => p.id !== id);
    saveProblems();
    res.json({ success: true });
  });
  app.get("/api/submissions", (req, res) => {
    res.json(submissions);
  });
  app.get("/api/submissions/:username", (req, res) => {
    const username = req.params.username.toLowerCase();
    res.json(submissions[username] || null);
  });
  app.post("/api/submissions", (req, res) => {
    const { username, codingAnswers, timeLeft, isFinished, score } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const normUser = username.toLowerCase();
    submissions[normUser] = {
      username: normUser,
      codingAnswers: codingAnswers || {},
      timeLeft: timeLeft ?? 5400,
      isFinished: !!isFinished,
      score: score ?? 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveSubmissions();
    res.json({ success: true, data: submissions[normUser] });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NHCOJ full-stack server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
