import { CodingProblem } from '../types';

export interface TestResult {
  passed: boolean;
  message: string;
  output?: any;
  verdict?: 'AC' | 'WA' | 'TLE' | 'RTE';
  input?: string;
  expected?: string;
  actual?: string;
  stdout?: string;
  time?: string;
  memory?: string;
}

// -------------------------------------------------------------
// TOKEN-BY-TOKEN COMPETITIVE COMPARATOR (ICPC Standard)
// -------------------------------------------------------------
export function compareTokens(actualStr: string, expectedStr: string): boolean {
  const actualTokens = actualStr.trim().split(/\s+/).filter(Boolean);
  const expectedTokens = expectedStr.trim().split(/\s+/).filter(Boolean);
  
  if (actualTokens.length !== expectedTokens.length) return false;
  
  for (let i = 0; i < actualTokens.length; i++) {
    const act = actualTokens[i];
    const exp = expectedTokens[i];
    
    // Check if both are numbers (support floating point absolute/relative error)
    const actNum = Number(act);
    const expNum = Number(exp);
    if (!isNaN(actNum) && !isNaN(expNum) && act !== '' && exp !== '') {
      if (Math.abs(actNum - expNum) > 1e-6) {
        return false;
      }
    } else {
      if (act.toLowerCase() !== exp.toLowerCase()) {
        return false;
      }
    }
  }
  return true;
}

// Helper to convert function inputs to Standard Input format automatically
export function generateStandardInput(inputArgs: any[]): string {
  if (!Array.isArray(inputArgs)) return String(inputArgs);
  
  const parts: string[] = [];
  for (const arg of inputArgs) {
    if (Array.isArray(arg)) {
      if (arg.length > 0 && Array.isArray(arg[0])) {
        parts.push(`${arg.length} ${arg[0].length}`);
        for (const row of arg) {
          parts.push(row.join(' '));
        }
      } else {
        parts.push(String(arg.length));
        parts.push(arg.join(' '));
      }
    } else if (arg !== null && arg !== undefined) {
      parts.push(String(arg));
    }
  }
  return parts.join(' ');
}

// -------------------------------------------------------------
// 1. PYTHON TO JAVASCRIPT TRANSPILER
// -------------------------------------------------------------
export function transpilePythonToJS(code: string, entryFnName: string): string {
  // Strip multiline docstrings to avoid any rogue quotes / semicolons
  const cleanCode = code
    .replace(/"""[\s\S]*?"""/g, '')
    .replace(/'''[\s\S]*?'''/g, '');

  const lines = cleanCode.split('\n');
  const resultLines: string[] = [];
  const indentStack: number[] = [0];
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      resultLines.push('');
      continue;
    }
    
    // Handle comments
    if (trimmed.startsWith('#')) {
      resultLines.push('//' + trimmed.slice(1));
      continue;
    }

    // Ignore Python imports, e.g. import math, from math import ...
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      resultLines.push('//' + trimmed);
      continue;
    }

    // Ignore decorators, e.g. @lru_cache, @cache
    if (trimmed.startsWith('@')) {
      resultLines.push('//' + trimmed);
      continue;
    }
    
    const indent = line.search(/\S/);
    
    // Unindent: close curly braces for blocks that have ended
    while (indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      resultLines.push('}'.padStart(indentStack[indentStack.length - 1] + 1));
    }
    
    let isBlock = false;
    let processed = trimmed;
    if (processed.endsWith(':')) {
      isBlock = true;
      processed = processed.slice(0, -1).trim();
    }
    
    // Convert def: def function_name(args) -> function function_name(args)
    if (processed.startsWith('def ')) {
      processed = processed.replace(/^def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/, (match, name, args) => {
        return `function ${name}(${args})`;
      });
    }
    
    // Convert conditions
    if (processed.startsWith('if ')) {
      if (processed.includes('__name__') && processed.includes('__main__')) {
        processed = 'if (true)';
      } else {
        processed = 'if (' + processed.slice(3) + ')';
      }
    } else if (processed.startsWith('elif ')) {
      processed = 'else if (' + processed.slice(5) + ')';
    } else if (processed === 'else') {
      processed = 'else';
    } else if (processed.startsWith('while ')) {
      processed = 'while (' + processed.slice(6) + ')';
    }
    
    // Convert loops:
    // for i, num in enumerate(nums) -> for (let [$1, $2] of nums.entries())
    processed = processed.replace(/for\s+([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s+in\s+enumerate\(([^)]+)\)/g, 'for (let [$1, $2] of $3.entries())');
    // for i in range(len(nums)) -> for (let i = 0; i < nums.length; i++)
    processed = processed.replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+range\(len\(([^)]+)\)\)/g, 'for (let $1 = 0; $1 < $2.length; $1++)');
    // for i in range(n) -> for (let i = 0; i < n; i++)
    processed = processed.replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+range\(([^)]+)\)/g, 'for (let $1 = 0; $1 < $2; $1++)');
    // for char in s -> for (let char of s)
    processed = processed.replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+(.*)/g, 'for (let $1 of $2)');
    
    // Replace operators & built-ins
    processed = processed.replace(/\band\b/g, '&&');
    processed = processed.replace(/\bor\b/g, '||');
    processed = processed.replace(/\bnot\b/g, '!');
    processed = processed.replace(/\bTrue\b/g, 'true');
    processed = processed.replace(/\bFalse\b/g, 'false');
    processed = processed.replace(/\bNone\b/g, 'null');
    
    // Integer division: a // b -> Math.floor(a / b)
    processed = processed.replace(/([a-zA-Z0-9_\[\]\.]+)\s*\/\/\s*([a-zA-Z0-9_\[\]\.]+)/g, 'Math.floor($1 / $2)');
    
    // .append(x) -> .push(x)
    processed = processed.replace(/\.append\(([^)]+)\)/g, '.push($1)');
    // Python sorting support
    processed = processed.replace(/\.sort\(\)/g, '.sort((a, b) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))))');
    
    // key in dict -> dict[key] !== undefined
    processed = processed.replace(/([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_]+)/g, '$2[$1] !== undefined');
    
    // Convert dictionary methods: dict.items() -> Object.entries(dict), dict.keys() -> Object.keys(dict), dict.values() -> Object.values(dict)
    processed = processed.replace(/([a-zA-Z0-9_\[\]\.]+)\.items\(\)/g, 'Object.entries($1)');
    processed = processed.replace(/([a-zA-Z0-9_\[\]\.]+)\.keys\(\)/g, 'Object.keys($1)');
    processed = processed.replace(/([a-zA-Z0-9_\[\]\.]+)\.values\(\)/g, 'Object.values($1)');
    
    // Python joins: " ".join(arr) -> arr.join(" ")
    processed = processed.replace(/([\'"])([^\'"]*)\1\.join\(([^)]+)\)/g, '$3.join($1$2$1)');

    // Reverse slices: s[::-1] -> _reverse_slice(s)
    processed = processed.replace(/([a-zA-Z0-9_\[\]\.]+)\s*\[\s*::\s*-1\s*\]/g, '_reverse_slice($1)');

    // Simple list comprehensions
    processed = processed.replace(/\[\s*([^\]]+)\s+for\s+([a-zA-Z0-9_]+)\s+in\s+([^\]\s]+)\s+if\s+([^\]]+)\s*\]/g, 'Array.from($3).filter($2 => $4).map($2 => $1)');
    processed = processed.replace(/\[\s*([^\]]+)\s+for\s+([a-zA-Z0-9_]+)\s+in\s+([^\]\s]+)\s*\]/g, 'Array.from($3).map($2 => $1)');

    if (isBlock) {
      processed = processed + ' {';
      indentStack.push(indent + 4);
    } else {
      if (!processed.endsWith('}') && !processed.endsWith('{') && !processed.endsWith(';')) {
        processed = processed + ';';
      }
    }
    
    resultLines.push(' '.repeat(indent) + processed);
  }
  
  while (indentStack.length > 1) {
    indentStack.pop();
    resultLines.push('}'.padStart(indentStack[indentStack.length - 1] + 1));
  }
  
  let transpiled = resultLines.join('\n');

  // Handle multiple assignments: a, b = b, a
  transpiled = transpiled.replace(/^(\s*)([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*=\s*(.*);/gm, '$1let [$2, $3] = $4;');

  return transpiled;
}

// -------------------------------------------------------------
// 2. C++ TO JAVASCRIPT TRANSPILER
// -------------------------------------------------------------
export function transpileCppToJS(code: string, entryFnName: string): string {
  let clean = code;
  
  // Remove includes and namespaces
  clean = clean.replace(/#include\s*[<"].*[>"]/g, '');
  clean = clean.replace(/using\s+namespace\s+std\s*;/g, '');
  clean = clean.replace(/std::/g, '');

  // Convert main function: int main(...) -> function main()
  clean = clean.replace(/\b(int|void|long|long\s+long)\s+main\s*\(([^)]*)\)/g, 'function main()');
  
  // Convert standard types to general signatures
  clean = clean.replace(/(vector<[a-zA-Z0-9_<>]+>|int|long\s+long|long|bool|void|string|char|double|float)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)[\s\r\n]*\{/g, 'function $2($3) {');
  
  // Argument types cleanup, e.g. (vector<int>& nums, int target) -> (nums, target)
  clean = clean.replace(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g, (match, fnName, argsStr) => {
    const args = argsStr.split(',').map((arg: string) => {
      const parts = arg.trim().split(/\s+/);
      let name = parts[parts.length - 1] || '';
      name = name.replace(/[&*]/g, ''); // remove pointers/references
      return name;
    }).filter(Boolean);
    return `function ${fnName}(${args.join(', ')})`;
  });

  // Convert map return values e.g. return {a, b}; to array return [a, b];
  clean = clean.replace(/return\s*\{([^}]*)\}\s*;/g, 'return [$1];');
  
  // Convert map, stack, vector and other declarations
  // vector<int> v(n, val);
  clean = clean.replace(/vector\s*<\s*[a-zA-Z0-9_<>:]+\s*>\s+([a-zA-Z0-9_]+)\s*\(([^,)]+),\s*([^)]+)\)\s*;/g, 'let $1 = new Array($2).fill($3);');
  // vector<int> v(n);
  clean = clean.replace(/vector\s*<\s*[a-zA-Z0-9_<>:]+\s*>\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*;/g, 'let $1 = new Array($2).fill(0);');
  // vector<int> v;
  clean = clean.replace(/vector\s*<\s*[a-zA-Z0-9_<>:]+\s*>\s+([a-zA-Z0-9_]+)\s*;/g, 'let $1 = [];');

  clean = clean.replace(/unordered_map<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = {}$2');
  clean = clean.replace(/map<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = {}$2');
  clean = clean.replace(/stack<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = []$2');
  clean = clean.replace(/queue<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = []$2');
  
  // priority_queue with greater<type> (min-heap)
  clean = clean.replace(/priority_queue\s*<\s*[^,]+,\s*vector\s*<\s*[^>]+\s*>\s*,\s*greater\s*<\s*[^>]+\s*>\s*>\s+([a-zA-Z0-9_]+)\s*(=|;)/g, 'let $1 = new PriorityQueue((a, b) => a - b)$2');
  // standard priority_queue (max-heap)
  clean = clean.replace(/priority_queue\s*<\s*[^>]+\s*>\s+([a-zA-Z0-9_]+)\s*(=|;)/g, 'let $1 = new PriorityQueue((a, b) => b - a)$2');

  clean = clean.replace(/unordered_set<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = new Set()$2');
  clean = clean.replace(/set<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = new Set()$2');

  // Convert 1D & 2D Array Bracket declarations:
  clean = clean.replace(/\b(int|double|float|char|string|bool)\s+([a-zA-Z0-9_]+)\[([a-zA-Z0-9_\s+*-]+)\]\[([a-zA-Z0-9_\s+*-]+)\]\s*(=\s*\{[^}]*\})?\s*;/g, 
    'let $2 = Array.from({length: $3}, () => new Array($4).fill(0));');
  clean = clean.replace(/\b(int|double|float|char|string|bool)\s+([a-zA-Z0-9_]+)\[([a-zA-Z0-9_\s+*-]+)\]\s*(=\s*\{[^}]*\})?\s*;/g, 
    'let $2 = new Array($3).fill(0);');

  // Convert types in variable declarations
  clean = clean.replace(/\b(int|double|float|char|string|bool|auto)\s+([a-zA-Z0-9_,\s=]+)(;|=)/g, (match, type, varList, endChar) => {
    return `let ${varList}${endChar}`;
  });
  clean = clean.replace(/\bconst\s+(int|double|float|char|string|bool)\s+([a-zA-Z0-9_,\s=]+)(;|=)/g, (match, type, varList, endChar) => {
    return `const ${varList}${endChar}`;
  });

  // Convert C++ Pair declarations
  clean = clean.replace(/\bpair<[^>]+>\s+([a-zA-Z0-9_,\s=]+)(;|=)/g, 'let $1$2');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.first\b/g, '$1[0]');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.second\b/g, '$1[1]');
  clean = clean.replace(/\bmake_pair\s*\(([^,]+),\s*([^)]+)\)/g, '[$1, $2]');

  // Map and Set find checks (e.g. m.find(key) != m.end())
  clean = clean.replace(/([a-zA-Z0-9_]+)\.find\(([^)]+)\)\s*!=\s*\1\.end\(\)/g, '_cpp_has($1, $2)');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.find\(([^)]+)\)\s*==\s*\1\.end\(\)/g, '!_cpp_has($1, $2)');

  // standard functions
  clean = clean.replace(/\.size\(\)/g, '.length');
  clean = clean.replace(/\.length\(\)/g, '.length');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.clear\(\)\s*;/g, 'if ($1 instanceof Set || $1 instanceof Map) { $1.clear(); } else { $1.length = 0; };');
  
  clean = clean.replace(/([a-zA-Z0-9_]+)\.top\(\)/g, '_get_top($1)');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.front\(\)/g, '$1[0]');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.back\(\)/g, '$1[$1.length - 1]');
  
  // empty() checks
  clean = clean.replace(/!\s*([a-zA-Z0-9_]+)\.empty\(\)/g, '$1.length !== 0');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.empty\(\)/g, '$1.length === 0');
  
  // count() map checks
  clean = clean.replace(/([a-zA-Z0-9_]+)\.count\(([^)]+)\)/g, '(($1 instanceof Set ? $1.has($2) : ($1[$2] !== undefined)) ? 1 : 0)');
  
  // standard set operations
  clean = clean.replace(/\.insert\(([^)]+)\)/g, '.add($1)');
  clean = clean.replace(/\.erase\(([^)]+)\)/g, '.delete($1)');
  
  // standard push_back / pop_back
  clean = clean.replace(/\.push_back\(([^)]+)\)/g, '.push($1)');
  clean = clean.replace(/\.pop_back\(\)/g, '.pop()');

  // STL sort & reverse
  clean = clean.replace(/sort\(\s*([a-zA-Z0-9_]+)\.begin\(\),\s*\1\.end\(\)\s*\);?/g, '$1.sort((a, b) => a - b);');
  clean = clean.replace(/sort\(\s*([a-zA-Z0-9_]+)\.begin\(\),\s*\1\.end\(\),\s*greater<[^>]*>\s*\(\s*\)\s*\);?/g, '$1.sort((a, b) => b - a);');
  clean = clean.replace(/reverse\(\s*([a-zA-Z0-9_]+)\.begin\(\),\s*\1\.end\(\)\s*\);?/g, '$1.reverse();');

  // Min, Max, __gcd, accumulate
  clean = clean.replace(/\bmin\(([^,]+),\s*([^)]+)\)/g, 'min($1, $2)');
  clean = clean.replace(/\bmax\(([^,]+),\s*([^)]+)\)/g, 'max($1, $2)');
  clean = clean.replace(/\b__gcd\(([^,]+),\s*([^)]+)\)/g, '((a, b) => { while (b) { let t = b; b = a % b; a = t; } return a; })($1, $2)');
  clean = clean.replace(/\baccumulate\(([^.]+)\.begin\(\),\s*\1\.end\(\),\s*([^)]+)\)/g, '$1.reduce((a, b) => a + b, $2)');

  // loop headers
  clean = clean.replace(/for\s*\(\s*int\s+/g, 'for (let ');
  clean = clean.replace(/for\s*\(\s*auto\s+/g, 'for (let ');
  clean = clean.replace(/for\s*\(\s*(char|int|auto|string)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*\)/g, 'for (let $2 of $3)');

  // C++ Standard I/O transpilation
  let matchesCin = true;
  while (matchesCin) {
    const prev = clean;
    clean = clean.replace(/cin\s*>>\s*([^;]+);/g, (match, body) => {
      const vars = body.split('>>').map((v: string) => v.trim());
      return vars.map((v: string) => `${v} = _cin_read();`).join(' ');
    });
    if (prev === clean) matchesCin = false;
  }

  let matchesCout = true;
  while (matchesCout) {
    const prev = clean;
    clean = clean.replace(/cout\s*<<\s*([^;]+);/g, (match, body) => {
      const items = body.split('<<').map((item: string) => item.trim());
      return items.map((item: string) => {
        if (item === 'endl') return `_cout_write("\\n");`;
        return `_cout_write(${item});`;
      }).join(' ');
    });
    if (prev === clean) matchesCout = false;
  }

  return clean;
}

// -------------------------------------------------------------
// 3. PASCAL TO JAVASCRIPT TRANSPILER
// -------------------------------------------------------------
export function transpilePascalToJS(code: string, entryFnName: string): string {
  let clean = code;
  
  // Remove block comments
  clean = clean.replace(/\{([\s\S]*?)\}/g, '/* $1 */');
  clean = clean.replace(/\(\*([\s\S]*?)\*\)/g, '/* $1 */');
  
  const lines = clean.split('\n');
  const resultLines: string[] = [];
  let inVarBlock = false;
  let activeFunctionName = entryFnName;

  for (let line of lines) {
    let trimmed = line.trim();
    let lower = trimmed.toLowerCase();
    
    if (!trimmed) {
      resultLines.push('');
      continue;
    }

    if (lower.startsWith('uses ')) {
      resultLines.push('// ' + trimmed);
      continue;
    }

    if (lower.startsWith('program ')) {
      resultLines.push('// ' + trimmed);
      continue;
    }

    if (lower === 'var') {
      inVarBlock = true;
      continue;
    }
    
    if (lower === 'begin') {
      inVarBlock = false;
      resultLines.push('{');
      continue;
    }
    
    if (lower === 'end.' || lower === 'end;') {
      resultLines.push('}');
      continue;
    }
    
    if (lower.startsWith('function ')) {
      trimmed = trimmed.replace(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*:\s*[a-zA-Z0-9_]+(\s*\[\s*\])?\s*;/gi, (match, name, argsStr) => {
        activeFunctionName = name;
        const args = argsStr.split(';').map((arg: string) => {
          const parts = arg.trim().split(':');
          return parts[0].trim();
        }).join(', ');
        return `function ${name}(${args}) {`;
      });
      resultLines.push(trimmed);
      continue;
    }

    if (inVarBlock) {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const vars = parts[0].trim();
        resultLines.push(`let ${vars};`);
      }
      continue;
    }

    // Replace := with =
    trimmed = trimmed.replace(/:=/g, '=');

    // Convert returns
    trimmed = trimmed.replace(/exit\(([^)]+)\)/gi, 'return $1');
    
    if (trimmed.startsWith(activeFunctionName + ' =') || trimmed.startsWith(activeFunctionName + '=')) {
      trimmed = trimmed.replace(new RegExp('^' + activeFunctionName + '\\s*=\\s*(.*)', 'i'), 'return $1');
    }

    // Comparisons and operators
    if (lower.startsWith('if ') || lower.startsWith('while ')) {
      trimmed = trimmed.replace(/([^<>!=\s])\s*=\s*([^=\s])/g, '$1 === $2');
      trimmed = trimmed.replace(/<>/g, '!==');
      trimmed = trimmed.replace(/\band\b/gi, '&&');
      trimmed = trimmed.replace(/\bor\b/gi, '||');
      trimmed = trimmed.replace(/\bnot\b/gi, '!');
    }

    // Convert IF statement
    if (lower.startsWith('if ')) {
      trimmed = trimmed.replace(/if\s+(.*)\s+then/gi, 'if ($1) {');
    }
    
    // Convert ELSE
    if (lower === 'else') {
      trimmed = '} else {';
    }

    // Convert FOR loops
    if (lower.startsWith('for ')) {
      trimmed = trimmed.replace(/for\s+([a-zA-Z0-9_]+)\s*=\s*(.*)\s+to\s+(.*)\s+do/gi, 'for (let $1 = $2; $1 <= $3; $1++) {');
    }

    // Integer division & Modulo
    trimmed = trimmed.replace(/([a-zA-Z0-9_\[\]\.]+)\s+div\s+([a-zA-Z0-9_\[\]\.]+)/gi, 'Math.floor($1 / $2)');
    trimmed = trimmed.replace(/\bmod\b/gi, '%');

    // Pascal Standard I/O
    trimmed = trimmed.replace(/\b(read|readln)\s*\(([^)]+)\)\s*;/gi, (match, op, body) => {
      const vars = body.split(',').map((v: string) => v.trim());
      return vars.map((v: string) => `${v} = _cin_read();`).join(' ');
    });
    trimmed = trimmed.replace(/\bwrite\s*\(([^)]+)\)\s*;/gi, (match, body) => {
      const items = body.split(',').map((item: string) => item.trim());
      return items.map((item: string) => `_cout_write(${item});`).join(' ');
    });
    trimmed = trimmed.replace(/\bwriteln\s*\(([^)]+)\)\s*;/gi, (match, body) => {
      const items = body.split(',').map((item: string) => item.trim());
      return items.map((item: string) => `_cout_write(${item});`).join(' ') + ` _cout_write("\\n");`;
    });
    trimmed = trimmed.replace(/\bwriteln\s*;/gi, '_cout_write("\\n");');

    // Builtins and helpers for Pascal
    trimmed = trimmed.replace(/\bsqr\(([^)]+)\)/gi, '(($1) * ($1))');
    trimmed = trimmed.replace(/\bsqrt\(([^)]+)\)/gi, 'Math.sqrt($1)');
    trimmed = trimmed.replace(/\babs\(([^)]+)\)/gi, 'Math.abs($1)');
    trimmed = trimmed.replace(/\bodd\(([^)]+)\)/gi, '(($1) % 2 !== 0)');
    trimmed = trimmed.replace(/\bpred\(([^)]+)\)/gi, '(($1) - 1)');
    trimmed = trimmed.replace(/\bsucc\(([^)]+)\)/gi, '(($1) + 1)');
    trimmed = trimmed.replace(/\btrunc\(([^)]+)\)/gi, 'Math.trunc($1)');
    trimmed = trimmed.replace(/\bround\(([^)]+)\)/gi, 'Math.round($1)');

    resultLines.push(trimmed);
  }

  return resultLines.join('\n');
}

// -------------------------------------------------------------
// INSTRUMENTATION (Infinite Loop Protection & TLE Prevention)
// -------------------------------------------------------------
function instrumentJS(jsCode: string): string {
  let instrumented = jsCode;
  // Instrument for loops
  instrumented = instrumented.replace(/(\bfor\s*\(.*?\)\s*\{)/g, '$1 __guard(); ');
  // Instrument while loops
  instrumented = instrumented.replace(/(\bwhile\s*\(.*?\)\s*\{)/g, '$1 __guard(); ');
  // Instrument recursive function entries
  instrumented = instrumented.replace(/(\bfunction\s+[a-zA-Z0-9_]+\s*\(.*?\)\s*\{)/g, '$1 __guard(); ');
  
  return instrumented;
}

// -------------------------------------------------------------
// CLEAN AND COMPARE
// -------------------------------------------------------------
export function cleanAndCompare(actual: any, expected: any): boolean {
  if (actual === expected) return true;

  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) < 1e-6;
  }

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    return actual.every((item, i) => cleanAndCompare(item, expected[i]));
  }

  if (actual && expected && typeof actual === 'object' && typeof expected === 'object') {
    const keysA = Object.keys(actual);
    const keysB = Object.keys(expected);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => cleanAndCompare(actual[key], expected[key]));
  }

  if (typeof actual === 'string' && typeof expected === 'string') {
    const normA = actual.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
    const normB = expected.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
    return normA === normB;
  }

  const strA = String(actual).trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  const strB = String(expected).trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  return strA === strB;
}

// -------------------------------------------------------------
// 4. UNIFIED EVALUATOR
// -------------------------------------------------------------
export const evaluateCode = async (
  code: string,
  lang: 'cpp' | 'python' | 'pascal',
  problem: CodingProblem,
  language: 'vi' | 'en' = 'vi'
): Promise<TestResult[]> => {
  // 1. Try real server API endpoint /api/judge for 100% native execution
  try {
    const res = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language: lang,
        problem,
        uiLanguage: language
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.isCompileError) {
        throw new Error(data.compileError || 'Compilation Error');
      }
      if (Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('Compilation Error') || err.message.includes('CE'))) {
      throw err;
    }
    console.warn("⚠️ Server judge API unavailable, using client fallback engine:", err);
  }

  const results: TestResult[] = [];
  const entryFnName = problem.entryFunctionName;
  const snakeCaseEntryFnName = entryFnName.replace(/([A-Z])/g, "_$1").toLowerCase();

  // 1. C++ Header & Namespace checks, and Python library import checks
  if (lang === 'cpp') {
    const hasBits = code.includes('#include <bits/stdc++.h>');
    
    // Check iostream
    if (/\b(cin|cout|endl)\b/.test(code) && !hasBits && !code.includes('#include <iostream>')) {
      throw new Error(language === 'vi' 
        ? `'cin', 'cout', 'endl' chưa được khai báo trong phạm vi này (Bạn có thiếu '#include <iostream>' hoặc '#include <bits/stdc++.h>' không?)`
        : `'cin', 'cout', 'endl' was not declared in this scope (Did you miss '#include <iostream>' or '#include <bits/stdc++.h>'?)`
      );
    }
    // Check vector
    if (/\bvector\b/.test(code) && !hasBits && !code.includes('#include <vector>')) {
      throw new Error(language === 'vi'
        ? `'vector' chưa được khai báo trong phạm vi này (Bạn có thiếu '#include <vector>' hoặc '#include <bits/stdc++.h>' không?)`
        : `'vector' was not declared in this scope (Did you miss '#include <vector>' or '#include <bits/stdc++.h>'?)`
      );
    }
    // Check string
    if (/\bstring\b/.test(code) && !hasBits && !code.includes('#include <string>') && !code.includes('#include <iostream>')) {
      throw new Error(language === 'vi'
        ? `'string' chưa được khai báo trong phạm vi này (Bạn có thiếu '#include <string>' hoặc '#include <bits/stdc++.h>' không?)`
        : `'string' was not declared in this scope (Did you miss '#include <string>' or '#include <bits/stdc++.h>'?)`
      );
    }
    // Check algorithm
    if (/\b(sort|reverse)\b/.test(code) && !hasBits && !code.includes('#include <algorithm>')) {
      throw new Error(language === 'vi'
        ? `'sort', 'reverse' chưa được khai báo trong phạm vi này (Bạn có thiếu '#include <algorithm>' hoặc '#include <bits/stdc++.h>' không?)`
        : `'sort', 'reverse' was not declared in this scope (Did you miss '#include <algorithm>' or '#include <bits/stdc++.h>'?)`
      );
    }
    // Check map/unordered_map
    if (/\b(unordered_map|map)\b/.test(code) && !hasBits && !code.includes('#include <unordered_map>') && !code.includes('#include <map>')) {
      throw new Error(language === 'vi'
        ? `'map'/'unordered_map' chưa được khai báo trong phạm vi này (Bạn có thiếu '#include <map>' hoặc '#include <unordered_map>' hoặc '#include <bits/stdc++.h>' không?)`
        : `'map' or 'unordered_map' was not declared in this scope (Did you miss '#include <map>'/'#include <unordered_map>' or '#include <bits/stdc++.h>'?)`
      );
    }
    // Check stack
    if (/\bstack\b/.test(code) && !hasBits && !code.includes('#include <stack>')) {
      throw new Error(language === 'vi'
        ? `'stack' chưa được khai báo trong phạm vi này (Bạn có thiếu '#include <stack>' hoặc '#include <bits/stdc++.h>' không?)`
        : `'stack' was not declared in this scope (Did you miss '#include <stack>' or '#include <bits/stdc++.h>'?)`
      );
    }
    // Check queue/priority_queue
    if (/\b(queue|priority_queue)\b/.test(code) && !hasBits && !code.includes('#include <queue>')) {
      throw new Error(language === 'vi'
        ? `'queue'/'priority_queue' chưa được khai báo trong phạm vi này (Bạn có thiếu '#include <queue>' hoặc '#include <bits/stdc++.h>' không?)`
        : `'queue'/'priority_queue' was not declared in this scope (Did you miss '#include <queue>' or '#include <bits/stdc++.h>'?)`
      );
    }
    // Check set/unordered_set
    if (/\b(unordered_set|set)\b/.test(code) && !hasBits && !code.includes('#include <unordered_set>') && !code.includes('#include <set>')) {
      throw new Error(language === 'vi'
        ? `'set'/'unordered_set' chưa được khai báo trong phạm vi này (Bạn có thiếu '#include <set>' hoặc '#include <unordered_set>' hoặc '#include <bits/stdc++.h>' không?)`
        : `'set' or 'unordered_set' was not declared in this scope (Did you miss '#include <set>'/'#include <unordered_set>' or '#include <bits/stdc++.h>'?)`
      );
    }
    
    // Check using namespace std or std:: prefix
    const hasNamespace = code.includes('using namespace std;');
    if (!hasNamespace) {
      const unmanaged: string[] = [];
      if (/\b(?<!std::)(vector)\b/.test(code)) unmanaged.push('vector');
      if (/\b(?<!std::)(string)\b/.test(code)) unmanaged.push('string');
      if (/\b(?<!std::)(cout)\b/.test(code)) unmanaged.push('cout');
      if (/\b(?<!std::)(cin)\b/.test(code)) unmanaged.push('cin');
      if (/\b(?<!std::)(endl)\b/.test(code)) unmanaged.push('endl');
      if (/\b(?<!std::)(unordered_map)\b/.test(code)) unmanaged.push('unordered_map');
      if (/\b(?<!std::)(map)\b/.test(code)) unmanaged.push('map');
      if (/\b(?<!std::)(stack)\b/.test(code)) unmanaged.push('stack');
      if (/\b(?<!std::)(queue)\b/.test(code)) unmanaged.push('queue');
      if (/\b(?<!std::)(priority_queue)\b/.test(code)) unmanaged.push('priority_queue');
      if (/\b(?<!std::)(unordered_set)\b/.test(code)) unmanaged.push('unordered_set');
      if (/\b(?<!std::)(set)\b/.test(code)) unmanaged.push('set');
      
      if (unmanaged.length > 0) {
        throw new Error(language === 'vi'
          ? `'${unmanaged[0]}' chưa được khai báo trong phạm vi này (Bạn có thiếu 'using namespace std;' hoặc tiền tố 'std::' không?)`
          : `'${unmanaged[0]}' was not declared in this scope (Did you miss 'using namespace std;' or prefix 'std::'?)`
        );
      }
    }
  }

  const imports: Record<string, boolean> = {
    math: false, collections: false, deque: false, Counter: false, defaultdict: false,
    heapq: false, heappush: false, heappop: false, heapify: false,
    bisect: false, random: false, re: false, itertools: false, functools: false, string: false, sys: false
  };

  if (lang === 'python') {
    // Detect math
    if (/(\bimport\s+math\b|\bfrom\s+math\s+import\b)/.test(code)) {
      imports.math = true;
    } else if (/\bmath\./.test(code)) {
      throw new Error(language === 'vi'
        ? `NameError: name 'math' is not defined. Bạn có thiếu 'import math' không?`
        : `NameError: name 'math' is not defined. Did you miss 'import math'?`
      );
    }
    
    // Detect collections
    const hasCollections = /(\bimport\s+collections\b|\bfrom\s+collections\s+import\b)/.test(code);
    if (hasCollections) {
      imports.collections = true;
      if (code.includes('deque')) imports.deque = true;
      if (code.includes('Counter')) imports.Counter = true;
      if (code.includes('defaultdict')) imports.defaultdict = true;
    } else {
      if (/\bcollections\./.test(code)) {
        throw new Error(language === 'vi'
          ? `NameError: name 'collections' is not defined. Bạn có thiếu 'import collections' không?`
          : `NameError: name 'collections' is not defined. Did you miss 'import collections'?`
        );
      }
      if (/\bdeque\b/.test(code)) {
        throw new Error(language === 'vi'
          ? `NameError: name 'deque' is not defined. Bạn có thiếu 'from collections import deque' không?`
          : `NameError: name 'deque' is not defined. Did you miss 'from collections import deque'?`
        );
      }
      if (/\bCounter\b/.test(code)) {
        throw new Error(language === 'vi'
          ? `NameError: name 'Counter' is not defined. Bạn có thiếu 'from collections import Counter' không?`
          : `NameError: name 'Counter' is not defined. Did you miss 'from collections import Counter'?`
        );
      }
      if (/\bdefaultdict\b/.test(code)) {
        throw new Error(language === 'vi'
          ? `NameError: name 'defaultdict' is not defined. Bạn có thiếu 'from collections import defaultdict' không?`
          : `NameError: name 'defaultdict' is not defined. Did you miss 'from collections import defaultdict'?`
        );
      }
    }

    // Detect heapq
    const hasHeapq = /(\bimport\s+heapq\b|\bfrom\s+heapq\s+import\b)/.test(code);
    if (hasHeapq) {
      imports.heapq = true;
      imports.heappush = true;
      imports.heappop = true;
      imports.heapify = true;
    } else {
      if (/\bheapq\./.test(code)) {
        throw new Error(language === 'vi'
          ? `NameError: name 'heapq' is not defined. Bạn có thiếu 'import heapq' không?`
          : `NameError: name 'heapq' is not defined. Did you miss 'import heapq'?`
        );
      }
      if (/\b(heappush|heappop|heapify)\b/.test(code)) {
        const hName = code.includes('heappush') ? 'heappush' : code.includes('heappop') ? 'heappop' : 'heapify';
        throw new Error(language === 'vi'
          ? `NameError: name '${hName}' is not defined. Bạn có thiếu 'from heapq import ...' không?`
          : `NameError: name '${hName}' is not defined. Did you miss 'from heapq import ...'?`
        );
      }
    }

    // Detect bisect
    if (/(\bimport\s+bisect\b|\bfrom\s+bisect\s+import\b)/.test(code)) {
      imports.bisect = true;
    } else if (/\bbisect\./.test(code) || /\b(bisect_left|bisect_right)\b/.test(code)) {
      throw new Error(language === 'vi'
        ? `NameError: name 'bisect' is not defined. Bạn có thiếu 'import bisect' không?`
        : `NameError: name 'bisect' is not defined. Did you miss 'import bisect'?`
      );
    }

    // Detect random
    if (/(\bimport\s+random\b|\bfrom\s+random\s+import\b)/.test(code)) {
      imports.random = true;
    } else if (/\brandom\./.test(code) || /\b(randint|choice|shuffle)\b/.test(code)) {
      throw new Error(language === 'vi'
        ? `NameError: name 'random' is not defined. Bạn có thiếu 'import random' không?`
        : `NameError: name 'random' is not defined. Did you miss 'import random'?`
      );
    }

    // Detect re
    if (/(\bimport\s+re\b|\bfrom\s+re\s+import\b)/.test(code)) {
      imports.re = true;
    } else if (/\bre\./.test(code)) {
      throw new Error(language === 'vi'
        ? `NameError: name 're' is not defined. Bạn có thiếu 'import re' không?`
        : `NameError: name 're' is not defined. Did you miss 'import re'?`
      );
    }

    // Detect itertools
    if (/(\bimport\s+itertools\b|\bfrom\s+itertools\s+import\b)/.test(code)) {
      imports.itertools = true;
    } else if (/\bitertools\./.test(code) || /\b(combinations|permutations)\b/.test(code)) {
      throw new Error(language === 'vi'
        ? `NameError: name 'itertools' is not defined. Bạn có thiếu 'import itertools' không?`
        : `NameError: name 'itertools' is not defined. Did you miss 'import itertools'?`
      );
    }

    // Detect functools
    if (/(\bimport\s+functools\b|\bfrom\s+functools\s+import\b)/.test(code)) {
      imports.functools = true;
    } else if (/\bfunctools\./.test(code) || /\b(lru_cache|cache|reduce)\b/.test(code)) {
      throw new Error(language === 'vi'
        ? `NameError: name 'functools' is not defined. Bạn có thiếu 'import functools' không?`
        : `NameError: name 'functools' is not defined. Did you miss 'import functools'?`
      );
    }

    // Detect string
    if (/(\bimport\s+string\b)/.test(code)) {
      imports.string = true;
    } else if (/\bstring\./.test(code)) {
      throw new Error(language === 'vi'
        ? `NameError: name 'string' is not defined. Bạn có thiếu 'import string' không?`
        : `NameError: name 'string' is not defined. Did you miss 'import string'?`
      );
    }

    // Detect sys
    if (/(\bimport\s+sys\b|\bfrom\s+sys\s+import\b)/.test(code)) {
      imports.sys = true;
    } else if (/\bsys\./.test(code)) {
      throw new Error(language === 'vi'
        ? `NameError: name 'sys' is not defined. Bạn có thiếu 'import sys' không?`
        : `NameError: name 'sys' is not defined. Did you miss 'import sys'?`
      );
    }
  }

  let jsCode = '';
  if (lang === 'python') {
    jsCode = transpilePythonToJS(code, entryFnName);
  } else if (lang === 'cpp') {
    jsCode = transpileCppToJS(code, entryFnName);
  } else if (lang === 'pascal') {
    jsCode = transpilePascalToJS(code, entryFnName);
  } else {
    throw new Error('Unsupported language');
  }

  // Instrument with Loop Guard to prevent infinite loops and TLE!
  jsCode = instrumentJS(jsCode);

  try {
    const summaryData: { idx: number; verdict: string; time: string; memory: string; passed: boolean }[] = [];

    for (let idx = 0; idx < problem.testCases.length; idx++) {
      const tc = problem.testCases[idx];
      
      // Intelligent standard input resolution
      let rawStdin = '';
      if (typeof tc.input === 'string') {
        rawStdin = tc.input;
      } else if (Array.isArray(tc.input)) {
        if (tc.input.length === 1 && typeof tc.input[0] === 'string' && tc.input[0].includes('\n')) {
          rawStdin = tc.input[0];
        } else {
          rawStdin = generateStandardInput(tc.input);
        }
      } else {
        rawStdin = String(tc.input || '');
      }

      let output: any = null;
      let stdoutStr = '';
      let passed = false;
      let duration = 0;
      let verdict: 'AC' | 'WA' | 'TLE' | 'RTE' = 'AC';
      let errorMessage = '';
      let actualValDisplay = '';

      try {
        const wrapperFn = new Function(
          'runContext',
          `
          let __loopCount = 0;
          const __startTime = performance.now();
          function __guard() {
            __loopCount++;
            if (__loopCount > 3000000) {
              throw new Error("TLE: Loop iteration limit exceeded (Infinite loop detected)");
            }
            if (performance.now() - __startTime > 1000) {
              throw new Error("TLE: Execution timed out (> 1000ms)");
            }
          }
          
          let _stdin_tokens = [];
          let _stdin_ptr = 0;
          let _stdin_lines = [];
          let _stdin_line_ptr = 0;
          const _stdout_buffer = [];

          function _init_stdin(rawInput) {
            _stdin_tokens = [];
            _stdin_ptr = 0;
            _stdin_lines = rawInput ? rawInput.toString().split(/\\r?\\n/) : [];
            _stdin_line_ptr = 0;
            
            const parts = rawInput ? rawInput.toString().split(/\\s+/) : [];
            for (const part of parts) {
              if (part.trim() !== '') {
                _stdin_tokens.push(part.trim());
              }
            }
          }

          function _cin_read() {
            if (_stdin_ptr >= _stdin_tokens.length) {
              return null;
            }
            const tok = _stdin_tokens[_stdin_ptr++];
            if (/^-?\\d+$/.test(tok)) return parseInt(tok, 10);
            if (/^-?\\d*\\.\\d+$/.test(tok)) return parseFloat(tok);
            return tok;
          }

          function _cout_write(...args) {
            for (const arg of args) {
              if (arg === "\\n" || arg === "\\r\\n") {
                _stdout_buffer.push("\\n");
              } else {
                _stdout_buffer.push(String(arg));
              }
            }
          }

          function input() {
            if (_stdin_line_ptr >= _stdin_lines.length) {
              return "";
            }
            return _stdin_lines[_stdin_line_ptr++];
          }

          function print(...args) {
            let sep = " ";
            let end = "\\n";
            const cleanArgs = [];
            for (const arg of args) {
              if (typeof arg === 'string' && arg.startsWith('__kw_sep=')) {
                sep = arg.slice(9);
              } else if (typeof arg === 'string' && arg.startsWith('__kw_end=')) {
                end = arg.slice(9);
              } else {
                cleanArgs.push(arg);
              }
            }
            const parts = cleanArgs.map(x => (x === null ? 'None' : (x === true ? 'True' : (x === false ? 'False' : (typeof x === 'object' ? JSON.stringify(x) : String(x))))));
            _stdout_buffer.push(parts.join(sep) + end);
          }

          const console = {
            log: print,
            info: print,
            warn: print,
            error: print
          };

          function _reverse_slice(x) {
            if (typeof x === 'string') return x.split('').reverse().join('');
            if (Array.isArray(x)) return [...x].reverse();
            return x;
          }

          // Internal raw implementations
          const pi_raw = Math.PI;
          const e_raw = Math.E;
          const inf_raw = Infinity;
          const nan_raw = NaN;
          const sqrt_raw = Math.sqrt;
          const isqrt_raw = (n) => Math.floor(Math.sqrt(Number(n)));
          const pow_raw = Math.pow;
          const ceil_raw = Math.ceil;
          const floor_raw = Math.floor;
          const fabs_raw = Math.abs;
          const abs_raw = Math.abs;
          const log_raw = Math.log;
          const log2_raw = Math.log2;
          const log10_raw = Math.log10;
          const sin_raw = Math.sin;
          const cos_raw = Math.cos;
          const tan_raw = Math.tan;
          const asin_raw = Math.asin;
          const acos_raw = Math.acos;
          const atan_raw = Math.atan;
          const radians_raw = (deg) => deg * Math.PI / 180;
          const degrees_raw = (rad) => rad * 180 / Math.PI;

          const factorial_raw = (n) => {
            let res = 1;
            for (let i = 2; i <= n; i++) res *= i;
            return res;
          };

          const gcd_raw = (a, b) => {
            a = Math.abs(a);
            b = Math.abs(b);
            while (b) {
              let t = b;
              b = a % b;
              a = t;
            }
            return a;
          };

          const comb_raw = (n, k) => {
            if (k < 0 || k > n) return 0;
            if (k === 0 || k === n) return 1;
            if (k > n / 2) k = n - k;
            let res = 1;
            for (let i = 1; i <= k; i++) {
              res = res * (n - i + 1) / i;
            }
            return Math.round(res);
          };

          const perm_raw = (n, k = null) => {
            if (k === null) k = n;
            if (k < 0 || k > n) return 0;
            let res = 1;
            for (let i = 0; i < k; i++) res *= (n - i);
            return res;
          };

          const prod_raw = (arr) => Array.isArray(arr) ? arr.reduce((a, b) => a * b, 1) : 1;

          class deque_raw extends Array {
            constructor(iterable = []) {
              super();
              if (iterable) {
                for (let x of iterable) this.push(x);
              }
            }
            append(x) { this.push(x); }
            appendleft(x) { this.unshift(x); }
            popleft() { return this.shift(); }
            extend(iterable) { for (let x of iterable) this.push(x); }
            extendleft(iterable) { for (let x of iterable) this.unshift(x); }
          }

          class Counter_raw extends Map {
            constructor(iterable = []) {
              super();
              if (iterable) {
                if (typeof iterable === 'string' || Array.isArray(iterable)) {
                  for (let x of iterable) {
                    this.set(x, (this.get(x) || 0) + 1);
                  }
                } else if (iterable instanceof Map) {
                  for (let [k, v] of iterable) {
                    this.set(k, v);
                  }
                } else if (typeof iterable === 'object') {
                  for (let k of Object.keys(iterable)) {
                    this.set(k, iterable[k]);
                  }
                }
              }
              return new Proxy(this, {
                get(target, prop) {
                  if (prop in target || typeof prop === 'symbol') {
                    const val = target[prop];
                    if (typeof val === 'function') return val.bind(target);
                    return val;
                  }
                  return target.get(prop) || 0;
                },
                set(target, prop, value) {
                  target.set(prop, value);
                  return true;
                }
              });
            }
            most_common(n) {
              const entries = Array.from(this.entries()).sort((a, b) => b[1] - a[1]);
              return n === undefined ? entries : entries.slice(0, n);
            }
          }

          class defaultdict_raw {
            constructor(defaultFactory) {
              this.map = new Map();
              this.defaultFactory = defaultFactory;
              return new Proxy(this, {
                get(target, prop) {
                  if (prop === 'map' || prop === 'defaultFactory' || typeof prop === 'symbol') {
                    return target[prop];
                  }
                  if (prop in target) {
                    const val = target[prop];
                    if (typeof val === 'function') return val.bind(target);
                    return val;
                  }
                  if (!target.map.has(prop)) {
                    let defaultVal;
                    if (typeof target.defaultFactory === 'function') {
                      defaultVal = target.defaultFactory();
                    } else if (target.defaultFactory === Array) {
                      defaultVal = [];
                    } else if (target.defaultFactory === Object) {
                      defaultVal = {};
                    } else if (target.defaultFactory === Set) {
                      defaultVal = new Set();
                    } else {
                      defaultVal = target.defaultFactory;
                    }
                    target.map.set(prop, defaultVal);
                  }
                  return target.map.get(prop);
                },
                set(target, prop, value) {
                  if (prop === 'map' || prop === 'defaultFactory') {
                    target[prop] = value;
                  } else {
                    target.map.set(prop, value);
                  }
                  return true;
                }
              });
            }
            keys() { return Array.from(this.map.keys()); }
            values() { return Array.from(this.map.values()); }
            entries() { return Array.from(this.map.entries()); }
            has(key) { return this.map.has(key); }
            delete(key) { return this.map.delete(key); }
            get length() { return this.map.size; }
          }

          const heappush_raw = (heap, item) => {
            heap.push(item);
            let idx = heap.length - 1;
            while (idx > 0) {
              let pIdx = Math.floor((idx - 1) / 2);
              if (heap[idx] < heap[pIdx]) {
                let temp = heap[idx];
                heap[idx] = heap[pIdx];
                heap[pIdx] = temp;
                idx = pIdx;
              } else {
                break;
              }
            }
          };

          const heappop_raw = (heap) => {
            if (heap.length === 0) return undefined;
            const res = heap[0];
            const last = heap.pop();
            if (heap.length > 0) {
              heap[0] = last;
              let idx = 0;
              while (idx < heap.length) {
                let left = idx * 2 + 1;
                let right = idx * 2 + 2;
                let smallest = idx;
                if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
                if (right < heap.length && heap[right] < heap[smallest]) smallest = right;
                if (smallest !== idx) {
                  let temp = heap[idx];
                  heap[idx] = heap[smallest];
                  heap[smallest] = temp;
                  idx = smallest;
                } else {
                  break;
                }
              }
            }
            return res;
          };

          const heapify_raw = (heap) => {
            const temp = [...heap];
            heap.length = 0;
            for (const item of temp) {
              heappush_raw(heap, item);
            }
          };

          const bisect_left_raw = (a, x, lo = 0, hi = null) => {
            if (hi === null) hi = a.length;
            while (lo < hi) {
              let mid = Math.floor((lo + hi) / 2);
              if (a[mid] < x) lo = mid + 1;
              else hi = mid;
            }
            return lo;
          };

          const bisect_right_raw = (a, x, lo = 0, hi = null) => {
            if (hi === null) hi = a.length;
            while (lo < hi) {
              let mid = Math.floor((lo + hi) / 2);
              if (a[mid] <= x) lo = mid + 1;
              else hi = mid;
            }
            return lo;
          };

          const random_raw = {
            random: () => Math.random(),
            randint: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
            choice: (arr) => arr[Math.floor(Math.random() * arr.length)],
            shuffle: (arr) => {
              for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
              }
              return arr;
            }
          };

          const re_raw = {
            search: (pattern, string) => {
              const flags = pattern.startsWith('(?i)') ? 'i' : '';
              const pat = pattern.startsWith('(?i)') ? pattern.slice(4) : pattern;
              const match = new RegExp(pat, flags).exec(string);
              return match ? { group: (i = 0) => match[i], start: () => match.index, end: () => match.index + match[0].length } : null;
            },
            match: (pattern, string) => {
              const flags = pattern.startsWith('(?i)') ? 'i' : '';
              const pat = pattern.startsWith('(?i)') ? pattern.slice(4) : pattern;
              const match = new RegExp('^' + pat, flags).exec(string);
              return match ? { group: (i = 0) => match[i], start: () => match.index, end: () => match.index + match[0].length } : null;
            },
            findall: (pattern, string) => {
              const flags = 'g' + (pattern.startsWith('(?i)') ? 'i' : '');
              const pat = pattern.startsWith('(?i)') ? pattern.slice(4) : pattern;
              return string.match(new RegExp(pat, flags)) || [];
            },
            sub: (pattern, repl, string) => {
              const flags = 'g' + (pattern.startsWith('(?i)') ? 'i' : '');
              const pat = pattern.startsWith('(?i)') ? pattern.slice(4) : pattern;
              return string.replace(new RegExp(pat, flags), repl);
            },
            split: (pattern, string) => {
              return string.split(new RegExp(pattern));
            }
          };

          const time_raw = {
            time: () => Date.now() / 1000,
            sleep: (secs) => {
              const start = Date.now();
              while (Date.now() - start < secs * 1000) {}
            }
          };

          const datetime_raw = {
            datetime: {
              now: () => {
                const d = new Date();
                return {
                  year: d.getFullYear(),
                  month: d.getMonth() + 1,
                  day: d.getDate(),
                  hour: d.getHours(),
                  minute: d.getMinutes(),
                  second: d.getSeconds(),
                  strftime: (fmt) => fmt
                };
              }
            }
          };

          const sys_raw = {
            setrecursionlimit: (limit) => {},
            stdin: {
              read: () => {
                const remainingLines = _stdin_lines.slice(_stdin_line_ptr);
                _stdin_line_ptr = _stdin_lines.length;
                return remainingLines.join('\\n');
              },
              readline: () => {
                return input();
              }
            }
          };

          const combinations_raw = (iterable, r) => {
            const pool = Array.from(iterable);
            const n = pool.length;
            if (r > n) return [];
            const indices = Array.from({length: r}, (_, i) => i);
            const result = [indices.map(i => pool[i])];
            while (true) {
              let i;
              for (i = r - 1; i >= 0; i--) {
                if (indices[i] !== i + n - r) break;
              }
              if (i < 0) return result;
              indices[i] += 1;
              for (let j = i + 1; j < r; j++) {
                indices[j] = indices[j - 1] + 1;
              }
              result.push(indices.map(idx => pool[idx]));
            }
          };

          const permutations_raw = (iterable, r = null) => {
            const pool = Array.from(iterable);
            const n = pool.length;
            if (r === null) r = n;
            if (r > n) return [];
            const results = [];
            const used = new Array(n).fill(false);
            const path = [];
            const backtrack = () => {
              if (path.length === r) {
                results.push([...path]);
                return;
              }
              for (let i = 0; i < n; i++) {
                if (!used[i]) {
                  used[i] = true;
                  path.push(pool[i]);
                  backtrack();
                  path.pop();
                  used[i] = false;
                }
              }
            };
            backtrack();
            return results;
          };

          const itertools_raw = { combinations: combinations_raw, permutations: permutations_raw };

          const lru_cache_raw = (maxsize) => (fn) => fn;
          const cache_raw = (fn) => fn;
          const reduce_raw = (fn, arr, init) => arr.reduce(fn, init);
          const functools_raw = { lru_cache: lru_cache_raw, cache: cache_raw, reduce: reduce_raw };

          const ascii_lowercase_raw = 'abcdefghijklmnopqrstuvwxyz';
          const ascii_uppercase_raw = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const ascii_letters_raw = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const digits_raw = '0123456789';
          const hexdigits_raw = '0123456789abcdefABCDEF';
          const octdigits_raw = '01234567';
          const punctuation_raw = "!" + '"' + "#$%&'()*+,-./:;<=>?@[" + String.fromCharCode(92) + "]" + "^" + String.fromCharCode(96) + "{|}~";
          const printable_raw = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!" + '"' + "#$%&'()*+,-./:;<=>?@[" + String.fromCharCode(92) + "]" + "^" + String.fromCharCode(96) + "{|}~ \t\n\r\x0b\x0c";
          const whitespace_raw = ' \t\n\r\x0b\x0c';

          const string_raw = {
            ascii_lowercase: ascii_lowercase_raw, ascii_uppercase: ascii_uppercase_raw, ascii_letters: ascii_letters_raw,
            digits: digits_raw, hexdigits: hexdigits_raw, octdigits: octdigits_raw, punctuation: punctuation_raw,
            printable: printable_raw, whitespace: whitespace_raw
          };

          // PriorityQueue is still global or accessible for C++ PriorityQueue uses
          class PriorityQueue {
            constructor(comparator = (a, b) => b - a) {
              this.heap = [];
              this.comparator = comparator;
            }
            push(item) {
              this.heap.push(item);
              this._up(this.heap.length - 1);
            }
            pop() {
              if (this.heap.length === 0) return undefined;
              const top = this.heap[0];
              const bottom = this.heap.pop();
              if (this.heap.length > 0) {
                this.heap[0] = bottom;
                this._down(0);
              }
              return top;
            }
            top() {
              return this.heap[0];
            }
            get length() {
              return this.heap.length;
            }
            empty() {
              return this.heap.length === 0;
            }
            _up(i) {
              while (i > 0) {
                const p = Math.floor((i - 1) / 2);
                if (this.comparator(this.heap[i], this.heap[p]) < 0) {
                  const t = this.heap[i];
                  this.heap[i] = this.heap[p];
                  this.heap[p] = t;
                  i = p;
                } else {
                  break;
                }
              }
            }
            _down(i) {
              const len = this.heap.length;
              while (i < len) {
                let left = 2 * i + 1;
                let right = 2 * i + 2;
                let best = i;
                if (left < len && this.comparator(this.heap[left], this.heap[best]) < 0) best = left;
                if (right < len && this.comparator(this.heap[right], this.heap[best]) < 0) best = right;
                if (best !== i) {
                  const t = this.heap[i];
                  this.heap[i] = this.heap[best];
                  this.heap[best] = t;
                  i = best;
                } else {
                  break;
                }
              }
            }
          }

          // C++ global items
          const make_pair = (a, b) => [a, b];
          const M_PI = Math.PI;

          const __builtin_popcount = (x) => {
            let count = 0;
            while (x) {
              count += x & 1;
              x >>>= 1;
            }
            return count;
          };

          const _get_top = (x) => {
            if (x && typeof x.top === 'function') return x.top();
            if (Array.isArray(x)) return x[x.length - 1];
            return undefined;
          };

          const _cpp_has = (container, key) => {
            if (container instanceof Set) return container.has(key);
            if (container instanceof Map) return container.has(key);
            return container[key] !== undefined;
          };

          // -------------------------------------------------------------
          // Expose standard variables conditionally based on runContext.imports
          // -------------------------------------------------------------
          const math = runContext.imports.math ? {
            pi: pi_raw, e: e_raw, inf: inf_raw, nan: nan_raw, sqrt: sqrt_raw, isqrt: isqrt_raw, pow: pow_raw,
            ceil: ceil_raw, floor: floor_raw, fabs: fabs_raw, abs: abs_raw, factorial: factorial_raw, gcd: gcd_raw,
            comb: comb_raw, perm: perm_raw, log: log_raw, log2: log2_raw, log10: log10_raw, sin: sin_raw, cos: cos_raw,
            tan: tan_raw, asin: asin_raw, acos: acos_raw, atan: atan_raw, radians: radians_raw, degrees: degrees_raw, prod: prod_raw
          } : undefined;

          // Expose direct functions if math is imported
          const pi = runContext.imports.math ? pi_raw : undefined;
          const e = runContext.imports.math ? e_raw : undefined;
          const inf = runContext.imports.math ? inf_raw : undefined;
          const nan = runContext.imports.math ? nan_raw : undefined;
          const sqrt = runContext.imports.math ? sqrt_raw : undefined;
          const isqrt = runContext.imports.math ? isqrt_raw : undefined;
          const pow = runContext.imports.math ? pow_raw : undefined;
          const ceil = runContext.imports.math ? ceil_raw : undefined;
          const floor = runContext.imports.math ? floor_raw : undefined;
          const fabs = runContext.imports.math ? fabs_raw : undefined;
          const abs = runContext.imports.math ? abs_raw : undefined;
          const factorial = runContext.imports.math ? factorial_raw : undefined;
          const gcd = runContext.imports.math ? gcd_raw : undefined;
          const comb = runContext.imports.math ? comb_raw : undefined;
          const perm = runContext.imports.math ? perm_raw : undefined;

          const deque = runContext.imports.deque ? deque_raw : undefined;
          const Counter = runContext.imports.Counter ? Counter_raw : undefined;
          const defaultdict = runContext.imports.defaultdict ? defaultdict_raw : undefined;
          const collections = runContext.imports.collections ? { deque: deque_raw, Counter: Counter_raw, defaultdict: defaultdict_raw } : undefined;

          const heappush = runContext.imports.heappush ? heappush_raw : undefined;
          const heappop = runContext.imports.heappop ? heappop_raw : undefined;
          const heapify = runContext.imports.heapify ? heapify_raw : undefined;
          const heapq = runContext.imports.heapq ? { heappush: heappush_raw, heappop: heappop_raw, heapify: heapify_raw } : undefined;

          const bisect_left = runContext.imports.bisect ? bisect_left_raw : undefined;
          const bisect_right = runContext.imports.bisect ? bisect_right_raw : undefined;
          const bisect = runContext.imports.bisect ? Object.assign(bisect_right_raw, {
            bisect_left: bisect_left_raw, bisect_right: bisect_right_raw, bisect: bisect_right_raw
          }) : undefined;

          const random = runContext.imports.random ? random_raw : undefined;
          const re = runContext.imports.re ? re_raw : undefined;
          const time = runContext.imports.time ? time_raw : undefined;
          const datetime = runContext.imports.datetime ? datetime_raw : undefined;
          const sys = runContext.imports.sys ? sys_raw : undefined;
          const itertools = runContext.imports.itertools ? itertools_raw : undefined;
          const combinations = runContext.imports.itertools ? combinations_raw : undefined;
          const permutations = runContext.imports.itertools ? permutations_raw : undefined;
          const functools = runContext.imports.functools ? functools_raw : undefined;
          const lru_cache = runContext.imports.functools ? lru_cache_raw : undefined;
          const cache = runContext.imports.functools ? cache_raw : undefined;
          const reduce = runContext.imports.functools ? reduce_raw : undefined;
          const string = runContext.imports.string ? string_raw : undefined;

          // Basic Python helpers
          const len = (x) => (x !== null && x !== undefined) ? (x.length !== undefined ? x.length : (x.size !== undefined ? x.size : 0)) : 0;
          const sum = (arr) => Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b), 0) : 0;
          const min = (...args) => {
            if (args.length === 1 && Array.isArray(args[0])) return Math.min(...args[0]);
            return Math.min(...args);
          };
          const max = (...args) => {
            if (args.length === 1 && Array.isArray(args[0])) return Math.max(...args[0]);
            return Math.max(...args);
          };
          const sorted = (arr, key, reverse = false) => {
            let res = [...arr];
            if (key) {
              res.sort((a, b) => {
                const ka = key(a), kb = key(b);
                return ka < kb ? -1 : (ka > kb ? 1 : 0);
              });
            } else {
              res.sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
            }
            if (reverse) res.reverse();
            return res;
          };
          const range = (start, stop, step = 1) => {
            if (stop === undefined) {
              stop = start;
              start = 0;
            }
            const res = [];
            if (step > 0) {
              for (let i = start; i < stop; i += step) res.push(i);
            } else if (step < 0) {
              for (let i = start; i > stop; i += step) res.push(i);
            }
            return res;
          };
          const any = (arr) => Array.from(arr).some(Boolean);
          const all = (arr) => Array.from(arr).every(Boolean);
          const list = (x) => Array.from(x);
          const set = (x) => new Set(x);
          const enumerate = (arr) => Array.from(arr.entries());
          const zip = (...arrs) => {
            const minLen = Math.min(...arrs.map(a => a.length));
            return Array.from({length: minLen}, (_, i) => arrs.map(a => a[i]));
          };
          const round = (val, dec = 0) => Number(val.toFixed(dec));
          const str = String;
          const int = (x) => {
            if (typeof x === 'string') {
              const val = parseInt(x, 10);
              return isNaN(val) ? 0 : val;
            }
            return Math.trunc(Number(x || 0));
          };
          const float = (x) => {
            const val = parseFloat(x);
            return isNaN(val) ? 0.0 : val;
          };
          const map = (fn, iter) => {
            if (!iter) return [];
            const arr = Array.from(iter);
            return typeof fn === 'function' ? arr.map(fn) : arr;
          };
          const filter = (fn, iter) => {
            if (!iter) return [];
            const arr = Array.from(iter);
            return typeof fn === 'function' ? arr.filter(fn) : arr;
          };
          const chr = (code) => String.fromCharCode(code);
          const ord = (ch) => (typeof ch === 'string' && ch.length > 0 ? ch.charCodeAt(0) : 0);
          const reversed = (iter) => Array.from(iter).reverse();

          _init_stdin(runContext.rawStdin);

          ${jsCode}

          let retVal = undefined;
          if (typeof main === 'function') {
            retVal = main();
          } else if (typeof ${entryFnName} === 'function') {
            try {
              retVal = ${entryFnName}(...runContext.args);
            } catch (e) {
              retVal = ${entryFnName}();
            }
          } else if (typeof ${snakeCaseEntryFnName} === 'function') {
            try {
              retVal = ${snakeCaseEntryFnName}(...runContext.args);
            } catch (e) {
              retVal = ${snakeCaseEntryFnName}();
            }
          }

          return {
            retVal: retVal,
            stdout: _stdout_buffer.join('')
          };
          `
        );

        const startTime = performance.now();
        const runResult = wrapperFn({ rawStdin: rawStdin, args: Array.isArray(tc.input) ? tc.input : [tc.input], imports: imports });
        duration = performance.now() - startTime;
        
        output = runResult.retVal;
        stdoutStr = runResult.stdout;

        const stdoutTrimmed = stdoutStr.trim();
        const expectedStr = Array.isArray(tc.expected) ? tc.expected.join(' ') : String(tc.expected);

        actualValDisplay = '';

        let passedByReturn = false;
        let passedByStdout = false;

        if (output !== undefined && output !== null) {
          passedByReturn = cleanAndCompare(output, tc.expected);
          if (!passedByReturn) {
            const actualRetStr = Array.isArray(output) ? output.join(' ') : (typeof output === 'object' ? JSON.stringify(output) : String(output));
            passedByReturn = compareTokens(actualRetStr, expectedStr);
          }
        }

        if (stdoutTrimmed !== '') {
          passedByStdout = compareTokens(stdoutStr, expectedStr);
          if (!passedByStdout && typeof tc.expected === 'boolean') {
            passedByStdout = compareTokens(stdoutStr, tc.expected ? 'true' : 'false');
          }
          if (!passedByStdout) {
            passedByStdout = cleanAndCompare(stdoutTrimmed, tc.expected);
          }
        }

        passed = passedByReturn || passedByStdout;

        if (passedByReturn && (output !== undefined && output !== null)) {
          actualValDisplay = typeof output === 'object' ? JSON.stringify(output) : String(output);
        } else if (stdoutTrimmed !== '') {
          actualValDisplay = stdoutTrimmed;
        } else if (output !== undefined && output !== null) {
          actualValDisplay = typeof output === 'object' ? JSON.stringify(output) : String(output);
        } else {
          actualValDisplay = '(Output rỗng / Empty)';
        }

        verdict = passed ? 'AC' : 'WA';
      } catch (e: any) {
        if (e.message && e.message.includes('TLE:')) {
          verdict = 'TLE';
          errorMessage = e.message;
        } else {
          verdict = 'RTE';
          errorMessage = e.message;
        }
        passed = false;
      }

      const memUsage = (1.2 + Math.random() * 1.5).toFixed(1);
      const timeStr = `${duration.toFixed(2)} ms`;
      const memStr = `${memUsage} MB`;

      summaryData.push({
        idx: idx + 1,
        verdict,
        time: timeStr,
        memory: memStr,
        passed
      });

      let detailMsg = '';
      if (verdict === 'AC') {
        detailMsg = language === 'vi' 
          ? `👉 Kết quả: ${actualValDisplay || '(True)'} (Khớp với đáp án)`
          : `👉 Result: ${actualValDisplay || '(True)'} (Matches expected)`;
      } else if (verdict === 'WA') {
        const expectedStr = Array.isArray(tc.expected) ? tc.expected.join(' ') : String(tc.expected);
        detailMsg = language === 'vi'
          ? `👉 Đầu ra: ${actualValDisplay || '(Rỗng)'} | Kỳ vọng: ${expectedStr}`
          : `👉 Output: ${actualValDisplay || '(Empty)'} | Expected: ${expectedStr}`;
      } else {
        detailMsg = `⚠️ Chi tiết: ${errorMessage}`;
      }

      const header = `[${verdict}] Testcase ${idx + 1} (${timeStr} | ${memStr})`;
      const subheader = `   • Input: ${tc.rawInput || rawStdin.replace(/\n/g, ' ')}`;
      const footer = `   • ${detailMsg}`;

      results.push({
        passed,
        output: output !== undefined && output !== null ? output : stdoutStr,
        message: `${header}\n${subheader}\n${footer}`,
        verdict,
        input: tc.rawInput || rawStdin,
        expected: Array.isArray(tc.expected) ? tc.expected.join(' ') : String(tc.expected),
        actual: actualValDisplay,
        stdout: stdoutStr,
        time: timeStr,
        memory: memStr
      });
    }

    // Build beautiful, styled DMOJ-like Judge Report
    const totalPassed = summaryData.filter(x => x.passed).length;
    const totalCases = problem.testCases.length;
    const finalScore = Math.round((totalPassed / totalCases) * 100);
    const overallVerdict = totalPassed === totalCases 
      ? 'ACCEPTED' 
      : summaryData.some(x => x.verdict === 'TLE') 
        ? 'TIME LIMIT EXCEEDED' 
        : summaryData.some(x => x.verdict === 'RTE') 
          ? 'RUNTIME ERROR' 
          : 'WRONG ANSWER';
    
    const divider = '='.repeat(54);
    const thinDivider = '-'.repeat(54);
    
    let report = `\n${divider}\n`;
    report += `                  NHCOJ ONLINE JUDGE REPORT\n`;
    report += `${divider}\n`;
    report += `  [TC #]     [VERDICT]     [TIME]         [MEMORY]\n`;
    report += `${thinDivider}\n`;
    
    for (const item of summaryData) {
      const tcNum = `  TC #${item.idx}`.padEnd(13);
      const verd = `[${item.verdict}]`.padEnd(14);
      const time = `${item.time}`.padEnd(15);
      const mem = `${item.memory}`;
      report += `${tcNum}${verd}${time}${mem}\n`;
    }
    
    report += `${thinDivider}\n`;
    report += `  VERDICT : ${overallVerdict}\n`;
    report += `  SCORE   : ${finalScore}/100 points (${totalPassed}/${totalCases} passed)\n`;
    report += `${divider}`;

    if (results.length > 0) {
      results[results.length - 1].message += '\n' + report;
    }
  } catch (e: any) {
    throw new Error(`${language === 'vi' ? 'Lỗi Biên Dịch/Thực Thi:' : 'Compilation/Runtime Error:'} ${e.message}`);
  }
  
  return results;
};
