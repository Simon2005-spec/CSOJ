import { CodingProblem } from '../types';

export interface TestResult {
  passed: boolean;
  message: string;
  output?: any;
}

// -------------------------------------------------------------
// 1. PYTHON TO JAVASCRIPT TRANSPILER
// -------------------------------------------------------------
export function transpilePythonToJS(code: string, entryFnName: string): string {
  const lines = code.split('\n');
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
      processed = 'if (' + processed.slice(3) + ')';
    } else if (processed.startsWith('elif ')) {
      processed = 'else if (' + processed.slice(5) + ')';
    } else if (processed === 'else') {
      processed = 'else';
    } else if (processed.startsWith('while ')) {
      processed = 'while (' + processed.slice(6) + ')';
    }
    
    // Convert loops:
    // for i, num in enumerate(nums) -> for (let [i, num] of nums.entries())
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
    processed = processed.replace(/([a-zA-Z0-9_]+)\s*\/\/\s*([a-zA-Z0-9_]+)/g, 'Math.floor($1 / $2)');
    // len(x) -> x.length
    processed = processed.replace(/len\(([^)]+)\)/g, '$1.length');
    // .append(x) -> .push(x)
    processed = processed.replace(/\.append\(([^)]+)\)/g, '.push($1)');
    
    // key in dict -> dict[key] !== undefined
    processed = processed.replace(/([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_]+)/g, '$2[$1] !== undefined');
    
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
  
  return resultLines.join('\n');
}

// -------------------------------------------------------------
// 2. C++ TO JAVASCRIPT TRANSPILER
// -------------------------------------------------------------
export function transpileCppToJS(code: string, entryFnName: string): string {
  let clean = code;
  
  // Remove includes and namespaces
  clean = clean.replace(/#include\s*<.*>/g, '');
  clean = clean.replace(/using\s+namespace\s+std\s*;/g, '');
  
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

  clean = clean.replace(/std::/g, '');
  
  // Convert map return values e.g. return {a, b}; to array return [a, b];
  clean = clean.replace(/return\s*\{([^}]*)\}\s*;/g, 'return [$1];');
  
  // Convert map, stack, vector and other declarations
  clean = clean.replace(/vector<[a-zA-Z0-9_<>]+>\s+([a-zA-Z0-9_]+)\s*(=|;)/g, 'let $1 $2');
  clean = clean.replace(/vector<[a-zA-Z0-9_<>]+>\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g, 'let $1 = new Array($2)');
  clean = clean.replace(/unordered_map<[^>]+>\s+([a-zA-Z0-9_]+)\s*(=|;)/g, 'let $1 = {}$2');
  clean = clean.replace(/map<[^>]+>\s+([a-zA-Z0-9_]+)\s*(=|;)/g, 'let $1 = {}$2');
  clean = clean.replace(/stack<[^>]+>\s+([a-zA-Z0-9_]+)\s*(=|;)/g, 'let $1 = []$2');

  // Convert types in variable declarations
  clean = clean.replace(/\b(int|double|float|char|string|bool|auto)\s+([a-zA-Z0-9_]+)\s*(=|;)/g, 'let $2 $3');
  clean = clean.replace(/\bconst\s+(int|double|float|char|string|bool)\s+([a-zA-Z0-9_]+)\s*=/g, 'const $2 =');

  // standard functions
  clean = clean.replace(/\.size\(\)/g, '.length');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.top\(\)/g, '$1[$1.length - 1]');
  
  // empty() checks
  clean = clean.replace(/!\s*([a-zA-Z0-9_]+)\.empty\(\)/g, '$1.length !== 0');
  clean = clean.replace(/([a-zA-Z0-9_]+)\.empty\(\)/g, '$1.length === 0');
  
  // count() map checks
  clean = clean.replace(/([a-zA-Z0-9_]+)\.count\(([^)]+)\)/g, '($1[$2] !== undefined)');
  
  // loop headers
  clean = clean.replace(/for\s*\(\s*int\s+/g, 'for (let ');
  clean = clean.replace(/for\s*\(\s*auto\s+/g, 'for (let ');
  clean = clean.replace(/for\s*\(\s*(char|int|auto|string)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*\)/g, 'for (let $2 of $3)');

  // Remove main function if any
  clean = clean.replace(/int\s+main\s*\([^)]*\)[\s\S]*$/g, '');

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
      continue;
    }

    // Replace := with =
    trimmed = trimmed.replace(/:=/g, '=');

    // Convert returns:
    trimmed = trimmed.replace(/exit\(([^)]+)\)/gi, 'return $1');
    
    if (trimmed.startsWith(activeFunctionName + ' =') || trimmed.startsWith(activeFunctionName + '=')) {
      trimmed = trimmed.replace(new RegExp('^' + activeFunctionName + '\\s*=\\s*(.*)', 'i'), 'return $1');
    }

    // Comparisons and operators inside if/while conditions
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

    resultLines.push(trimmed);
  }

  return resultLines.join('\n');
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

  try {
    for (let idx = 0; idx < problem.testCases.length; idx++) {
      const tc = problem.testCases[idx];
      
      let executionRunner = '';
      if (jsCode.includes(`function ${entryFnName}`)) {
        executionRunner = `\nreturn ${entryFnName}(${problem.inputNames.map(n => `arguments[${problem.inputNames.indexOf(n)}]`).join(', ')});`;
      } else if (jsCode.includes(`function ${snakeCaseEntryFnName}`)) {
        executionRunner = `\nreturn ${snakeCaseEntryFnName}(${problem.inputNames.map(n => `arguments[${problem.inputNames.indexOf(n)}]`).join(', ')});`;
      } else {
        // Fallback: search for any definition or default to entryFnName
        executionRunner = `\nreturn ${entryFnName}(${problem.inputNames.map(n => `arguments[${problem.inputNames.indexOf(n)}]`).join(', ')});`;
      }

      // Safe evaluation wrapper
      const wrapperFn = new Function(
        `
        ${jsCode}
        ${executionRunner}
        `
      );
      
      const output = wrapperFn(...tc.input);
      const isMatch = JSON.stringify(output) === JSON.stringify(tc.expected);
      
      results.push({
        passed: isMatch,
        output,
        message: `Testcase ${idx + 1}: ${tc.rawInput}\n👉 Output: ${JSON.stringify(output)} | ${language === 'vi' ? 'Kỳ vọng' : 'Expected'}: ${JSON.stringify(tc.expected)} ── ${isMatch ? '✅ ' + (language === 'vi' ? 'ĐẠT' : 'PASSED') : '❌ ' + (language === 'vi' ? 'SAI' : 'FAILED')}`
      });
    }
  } catch (e: any) {
    throw new Error(`${language === 'vi' ? 'Lỗi Biên Dịch/Thực Thi:' : 'Compilation/Runtime Error:'} ${e.message}`);
  }
  
  return results;
};
