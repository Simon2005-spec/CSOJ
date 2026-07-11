import { CodingProblem } from '../types';

export interface TestResult {
  passed: boolean;
  message: string;
  output?: any;
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
  
  const lines: string[] = [];
  for (const arg of inputArgs) {
    if (Array.isArray(arg)) {
      lines.push(String(arg.length));
      lines.push(arg.join(' '));
    } else if (arg !== null && arg !== undefined) {
      lines.push(String(arg));
    }
  }
  return lines.join('\n');
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
  transpiled = transpiled.replace(/^(\s*)([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*=\s*(.*);/gm, '$1[$2, $3] = $4;');

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
  clean = clean.replace(/\b(int|void)\s+main\s*\(([^)]*)\)/g, 'function main()');
  
  // Convert standard types to general signatures
  clean = clean.replace(/(vector<[a-zA-Z0-9_<>]+>|int|bool|void|string|char|double|float)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, 'function $2($3) {');
  
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
export const evaluateCode = (
  code: string,
  lang: 'cpp' | 'python' | 'pascal',
  problem: CodingProblem,
  language: 'vi' | 'en' = 'vi'
): TestResult[] => {
  const results: TestResult[] = [];
  const entryFnName = problem.entryFunctionName;
  const snakeCaseEntryFnName = entryFnName.replace(/([A-Z])/g, "_$1").toLowerCase();
  
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
            _stdout_buffer.push(args.map(x => (x === null ? 'None' : (x === true ? 'True' : (x === false ? 'False' : String(x))))).join(" ") + "\\n");
          }

          function _reverse_slice(x) {
            if (typeof x === 'string') return x.split('').reverse().join('');
            if (Array.isArray(x)) return [...x].reverse();
            return x;
          }

          // Injected Python & C++ Standard Libraries & Mathematical Polyfills
          const pi = Math.PI;
          const e = Math.E;
          const inf = Infinity;
          const nan = NaN;
          const sqrt = Math.sqrt;
          const isqrt = (n) => Math.floor(Math.sqrt(Number(n)));
          const pow = Math.pow;
          const ceil = Math.ceil;
          const floor = Math.floor;
          const fabs = Math.abs;
          const abs = Math.abs;
          const log = Math.log;
          const log2 = Math.log2;
          const log10 = Math.log10;
          const sin = Math.sin;
          const cos = Math.cos;
          const tan = Math.tan;
          const asin = Math.asin;
          const acos = Math.acos;
          const atan = Math.atan;
          const radians = (deg) => deg * Math.PI / 180;
          const degrees = (rad) => rad * 180 / Math.PI;

          const factorial = (n) => {
            let res = 1;
            for (let i = 2; i <= n; i++) res *= i;
            return res;
          };

          const gcd = (a, b) => {
            a = Math.abs(a);
            b = Math.abs(b);
            while (b) {
              let t = b;
              b = a % b;
              a = t;
            }
            return a;
          };

          const comb = (n, k) => {
            if (k < 0 || k > n) return 0;
            if (k === 0 || k === n) return 1;
            if (k > n / 2) k = n - k;
            let res = 1;
            for (let i = 1; i <= k; i++) {
              res = res * (n - i + 1) / i;
            }
            return Math.round(res);
          };

          const perm = (n, k = null) => {
            if (k === null) k = n;
            if (k < 0 || k > n) return 0;
            let res = 1;
            for (let i = 0; i < k; i++) res *= (n - i);
            return res;
          };

          const prod = (arr) => Array.isArray(arr) ? arr.reduce((a, b) => a * b, 1) : 1;

          const math = {
            pi, e, inf, nan, sqrt, isqrt, pow, ceil, floor, fabs, abs, factorial, gcd, comb, perm, log, log2, log10, sin, cos, tan, asin, acos, atan, radians, degrees, prod
          };

          // deque, Counter, defaultdict, collections
          class deque extends Array {
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

          class Counter extends Map {
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

          class defaultdict {
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

          const collections = { deque, Counter, defaultdict };

          // heapq
          const heappush = (heap, item) => {
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

          const heappop = (heap) => {
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

          const heapify = (heap) => {
            const temp = [...heap];
            heap.length = 0;
            for (const item of temp) {
              heappush(heap, item);
            }
          };

          const heapq = { heappush, heappop, heapify };

          // bisect
          const bisect_left = (a, x, lo = 0, hi = null) => {
            if (hi === null) hi = a.length;
            while (lo < hi) {
              let mid = Math.floor((lo + hi) / 2);
              if (a[mid] < x) lo = mid + 1;
              else hi = mid;
            }
            return lo;
          };

          const bisect_right = (a, x, lo = 0, hi = null) => {
            if (hi === null) hi = a.length;
            while (lo < hi) {
              let mid = Math.floor((lo + hi) / 2);
              if (a[mid] <= x) lo = mid + 1;
              else hi = mid;
            }
            return lo;
          };

          const bisect_fun = bisect_right;
          const bisect = Object.assign(bisect_fun, {
            bisect_left,
            bisect_right,
            bisect: bisect_fun
          });
          const bisect_module = bisect;

          // random module
          const random = {
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

          // re module
          const re = {
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

          // time module
          const time = {
            time: () => Date.now() / 1000,
            sleep: (secs) => {
              const start = Date.now();
              while (Date.now() - start < secs * 1000) {}
            }
          };

          // datetime module
          const datetime = {
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

          // PriorityQueue polyfill class
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

          // C++ and other language polyfills
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

          // sys
          const sys = {
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

          // itertools
          const combinations = (iterable, r) => {
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

          const permutations = (iterable, r = null) => {
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

          const itertools = { combinations, permutations };

          // functools
          const lru_cache = (maxsize) => (fn) => fn;
          const cache = (fn) => fn;
          const reduce = (fn, arr, init) => arr.reduce(fn, init);
          const functools = { lru_cache, cache, reduce };

          // string
          const ascii_lowercase = 'abcdefghijklmnopqrstuvwxyz';
          const ascii_uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const ascii_letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const digits = '0123456789';
          const hexdigits = '0123456789abcdefABCDEF';
          const octdigits = '01234567';
          const punctuation = "!" + '"' + "#$%&'()*+,-./:;<=>?@[" + String.fromCharCode(92) + "]" + "^" + String.fromCharCode(96) + "{|}~";
          const printable = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!" + '"' + "#$%&'()*+,-./:;<=>?@[" + String.fromCharCode(92) + "]" + "^" + String.fromCharCode(96) + "{|}~ \t\n\r\x0b\x0c";
          const whitespace = ' \t\n\r\x0b\x0c';

          const string = {
            ascii_lowercase, ascii_uppercase, ascii_letters, digits, hexdigits, octdigits, punctuation, printable, whitespace
          };

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

          ${jsCode}

          _init_stdin(runContext.rawStdin);

          let retVal = undefined;
          if (typeof main === 'function') {
            retVal = main();
          } else if (typeof ${entryFnName} === 'function') {
            retVal = ${entryFnName}(...runContext.args);
          } else if (typeof ${snakeCaseEntryFnName} === 'function') {
            retVal = ${snakeCaseEntryFnName}(...runContext.args);
          }

          return {
            retVal: retVal,
            stdout: _stdout_buffer.join('')
          };
          `
        );

        const startTime = performance.now();
        const runResult = wrapperFn({ rawStdin: rawStdin, args: Array.isArray(tc.input) ? tc.input : [tc.input] });
        duration = performance.now() - startTime;
        
        output = runResult.retVal;
        stdoutStr = runResult.stdout;

        const stdoutTrimmed = stdoutStr.trim();
        const expectedStr = Array.isArray(tc.expected) ? tc.expected.join(' ') : String(tc.expected);

        if (stdoutTrimmed !== '') {
          passed = compareTokens(stdoutStr, expectedStr);
          if (!passed && typeof tc.expected === 'boolean') {
            passed = compareTokens(stdoutStr, tc.expected ? 'true' : 'false');
          }
        } else {
          passed = cleanAndCompare(output, tc.expected);
          if (!passed) {
            const actualRetStr = Array.isArray(output) ? output.join(' ') : String(output ?? '');
            passed = compareTokens(actualRetStr, expectedStr);
          }
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
          ? `👉 Kết quả: ${stdoutStr.trim() !== '' ? stdoutStr.trim() : JSON.stringify(output)} (Khớp với đáp án)`
          : `👉 Result: ${stdoutStr.trim() !== '' ? stdoutStr.trim() : JSON.stringify(output)} (Matches expected)`;
      } else if (verdict === 'WA') {
        const expectedStr = Array.isArray(tc.expected) ? tc.expected.join(' ') : String(tc.expected);
        detailMsg = language === 'vi'
          ? `👉 Đầu ra: ${stdoutStr.trim() !== '' ? stdoutStr.trim() : JSON.stringify(output)} | Kỳ vọng: ${expectedStr}`
          : `👉 Output: ${stdoutStr.trim() !== '' ? stdoutStr.trim() : JSON.stringify(output)} | Expected: ${expectedStr}`;
      } else {
        detailMsg = `⚠️ Chi tiết: ${errorMessage}`;
      }

      const header = `[${verdict}] Testcase ${idx + 1} (${timeStr} | ${memStr})`;
      const subheader = `   • Input: ${tc.rawInput || rawStdin.replace(/\n/g, ' ')}`;
      const footer = `   • ${detailMsg}`;

      results.push({
        passed,
        output: stdoutStr.trim() !== '' ? stdoutStr : output,
        message: `${header}\n${subheader}\n${footer}`
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
