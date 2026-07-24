
/**
 * Shared transpilation logic for C++ and Pascal to JavaScript
 * This is used both on the client-side fallback and on the server-side judge
 */


// -------------------------------------------------------------
// RUNTIME HELPERS (Shared between client and server)
// -------------------------------------------------------------

export const TRANSPILER_HELPERS = `
          const _cpp_has = (obj, key) => {
            if (obj instanceof Set || obj instanceof Map) return obj.has(key);
            return (key in obj);
          };
          const _cpp_erase = (obj, key) => {
            if (obj instanceof Set || obj instanceof Map) return obj.delete(key);
            delete obj[key];
          };
          const _cpp_clear = (obj) => {
            if (obj instanceof Set || obj instanceof Map) return obj.clear();
            if (Array.isArray(obj)) obj.length = 0;
            else for (let k in obj) delete obj[k];
          };
          const _cpp_size = (obj) => {
            if (obj instanceof Set || obj instanceof Map) return obj.size;
            if (Array.isArray(obj)) return obj.length;
            return Object.keys(obj).length;
          };
          const _get_top = (obj) => {
            if (obj instanceof PriorityQueue) return obj.peek();
            if (Array.isArray(obj)) return obj[obj.length - 1];
            return null;
          };

          class PriorityQueue {
            constructor(comparator = (a, b) => a - b) {
              this.heap = [];
              this.comparator = comparator;
            }
            push(val) {
              this.heap.push(val);
              this.siftUp();
            }
            pop() {
              if (this.size() === 0) return null;
              const top = this.heap[0];
              const bottom = this.heap.pop();
              if (this.size() > 0) {
                this.heap[0] = bottom;
                this.siftDown();
              }
              return top;
            }
            peek() { return this.heap[0] || null; }
            size() { return this.heap.length; }
            siftUp() {
              let nodeIdx = this.size() - 1;
              while (nodeIdx > 0) {
                let parentIdx = (nodeIdx - 1) >> 1;
                if (this.comparator(this.heap[nodeIdx], this.heap[parentIdx]) < 0) {
                  [this.heap[nodeIdx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[nodeIdx]];
                  nodeIdx = parentIdx;
                } else break;
              }
            }
            siftDown() {
              let nodeIdx = 0;
              while (true) {
                let leftChildIdx = (nodeIdx << 1) + 1;
                let rightChildIdx = (nodeIdx << 1) + 2;
                let smallestIdx = nodeIdx;
                if (leftChildIdx < this.size() && this.comparator(this.heap[leftChildIdx], this.heap[smallestIdx]) < 0) smallestIdx = leftChildIdx;
                if (rightChildIdx < this.size() && this.comparator(this.heap[rightChildIdx], this.heap[smallestIdx]) < 0) smallestIdx = rightChildIdx;
                if (smallestIdx !== nodeIdx) {
                  [this.heap[nodeIdx], this.heap[smallestIdx]] = [this.heap[smallestIdx], this.heap[nodeIdx]];
                  nodeIdx = smallestIdx;
                } else break;
              }
            }
          }

          let __loopCount = 0;
          let __startTime = Date.now();
          function __guard() {
            __loopCount++;
            if (__loopCount > 2000000) throw new Error("TLE: Loop iteration limit exceeded");
            if (Date.now() - __startTime > 2000) throw new Error("TLE: Time limit exceeded");
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
            for (const part of parts) if (part.trim() !== "") _stdin_tokens.push(part.trim());
          }

          function _cin_read() {
            if (_stdin_ptr >= _stdin_tokens.length) return null;
            const tok = _stdin_tokens[_stdin_ptr++];
            if (/^-?\\d+$/.test(tok)) return parseInt(tok, 10);
            if (/^-?\\d*\\.\\d+$/.test(tok)) return parseFloat(tok);
            return tok;
          }

          function _getline_read() {
            if (_stdin_line_ptr >= _stdin_lines.length) return null;
            return _stdin_lines[_stdin_line_ptr++];
          }

          function _cout_write(...args) {
            for (const arg of args) {
              if (arg === "\\n" || arg === "\\r\\n") _stdout_buffer.push("\\n");
              else _stdout_buffer.push(String(arg));
            }
          }

          function input() {
            if (_stdin_line_ptr >= _stdin_lines.length) return "";
            return _stdin_lines[_stdin_line_ptr++];
          }

          function print(...args) {
            let sep = " ";
            let end = "\\n";
            const cleanArgs = [];
            for (const arg of args) {
              if (typeof arg === 'string' && arg.startsWith('__kw_sep=')) sep = arg.slice(9);
              else if (typeof arg === 'string' && arg.startsWith('__kw_end=')) end = arg.slice(9);
              else cleanArgs.push(arg);
            }
            const parts = cleanArgs.map(x => (x === null ? 'None' : (x === true ? 'True' : (x === false ? 'False' : (typeof x === 'object' ? JSON.stringify(x) : String(x))))));
            _stdout_buffer.push(parts.join(sep) + end);
          }

          const console = { log: print, info: print, warn: print, error: print };
          const min = Math.min;
          const max = Math.max;
          const abs = Math.abs;
          const pow = Math.pow;
          const sqrt = Math.sqrt;
          const floor = Math.floor;
          const ceil = Math.ceil;
          const round = Math.round;
`;

export function transpileCppToJS(code: string): string {
  let clean = code;
  
  // Remove includes and namespaces
  clean = clean.replace(/#include\s*[<"].*[>"]/g, '');
  clean = clean.replace(/using\s+namespace\s+std\s*;/g, '');
  clean = clean.replace(/std::/g, '');
  
  // Handle C++17 constexpr and type traits for the judge template fallback
  clean = clean.replace(/\bif\s+constexpr\b/g, 'if');
  clean = clean.replace(/\bconstexpr\b/g, 'const');
  clean = clean.replace(/is_same_v\s*<\s*decltype\s*\([^)]+\)\s*,\s*bool\s*>/g, 'true'); 
  clean = clean.replace(/is_same_v\s*<\s*[^,]+\s*,\s*bool\s*>/g, 'true');

  // Convert main function: int main(...) -> function main()
  clean = clean.replace(/\b(int|void|long|long\s+long|long\s+long\s+int)\s+main\s*\(([^)]*)\)/g, 'function main()');
  
  // Convert standard types to general signatures
  clean = clean.replace(/\b(vector<[a-zA-Z0-9_<>]+>|int|long\s+long|long|bool|void|string|char|double|float|uint64_t|int64_t|size_t)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)[\s\r\n]*\{/g, 'function $2($3) {');
  
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
  clean = clean.replace(/vector\s*<\s*[a-zA-Z0-9_<>:]+\s*>\s+([a-zA-Z0-9_]+)\s*\(([^,)]+),\s*([^)]+)\)\s*;/g, 'let $1 = new Array($2).fill($3);');
  clean = clean.replace(/vector\s*<\s*[a-zA-Z0-9_<>:]+\s*>\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*;/g, 'let $1 = new Array($2).fill(0);');
  clean = clean.replace(/vector\s*<\s*[a-zA-Z0-9_<>:]+\s*>\s+([a-zA-Z0-9_]+)\s*;/g, 'let $1 = [];');

  clean = clean.replace(/unordered_map<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = {}$2');
  clean = clean.replace(/map<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = {}$2');
  clean = clean.replace(/stack<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = []$2');
  clean = clean.replace(/queue<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = []$2');
  
  clean = clean.replace(/unordered_set<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = new Set()$2');
  clean = clean.replace(/set<[^>]+>\s+([a-zA-Z0-9_,\s]+)\s*(=|;)/g, 'let $1 = new Set()$2');

  // Convert types in variable declarations
  clean = clean.replace(/\b(unsigned\s+)?(long\s+long\s+int|long\s+long|long\s+int|long|int|double|float|char|string|bool|auto|uint64_t|int64_t|size_t)\s+([a-zA-Z0-9_,\s=]+)(;|=)/g, (match, unsigned, type, varList, endChar) => {
    return `let ${varList}${endChar}`;
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
  clean = clean.replace(/for\s*\(\s*(unsigned\s+)?(long\s+long\s+int|long\s+long|long\s+int|long|int|auto|size_t)\s+/g, 'for (let ');
  clean = clean.replace(/for\s*\(\s*(char|int|long|long\s+long|long\s+int|auto|string)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*\)/g, 'for (let $2 of $3)');

  // C++ Standard I/O transpilation
  clean = clean.replace(/ios_base\s*::\s*sync_with_stdio\s*\([^)]*\)\s*;?/g, '');
  clean = clean.replace(/cin\s*\.\s*tie\s*\([^)]*\)\s*;?/g, '');
  clean = clean.replace(/cout\s*\.\s*tie\s*\([^)]*\)\s*;?/g, '');

  clean = clean.replace(/\b(if|while)\s*\(\s*getline\s*\(\s*cin\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*\)/g, '$1 (($2 = _getline_read()) !== null)');
  clean = clean.replace(/getline\s*\(\s*cin\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*;?/g, '$1 = _getline_read();');

  // cin >> x; -> x = _cin_read();
  clean = clean.replace(/\b(if|while)\s*\(\s*cin\s*>>\s*([^)]+)\)/g, (match, keyword, body) => {
    const vars = body.split('>>').map((v: string) => v.trim());
    const conds = vars.map((v: string) => `(${v} = _cin_read()) !== null`).join(' && ');
    return `${keyword} (${conds})`;
  });

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

export function transpilePascalToJS(code: string): string {
  let clean = code;
  
  clean = clean.replace(/\{([\s\S]*?)\}/g, '/* $1 */');
  clean = clean.replace(/\(\*([\s\S]*?)\*\)/g, '/* $1 */');
  
  const lines = clean.split('\n');
  const resultLines: string[] = [];
  let inVarBlock = false;

  for (let line of lines) {
    let trimmed = line.trim();
    let lower = trimmed.toLowerCase();
    
    if (!trimmed) {
      resultLines.push('');
      continue;
    }

    if (lower.startsWith('uses ') || lower.startsWith('program ')) {
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

    if (inVarBlock && trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const vars = parts[0].split(',').map(v => v.trim());
      resultLines.push('let ' + vars.join(', ') + ';');
      continue;
    }

    // Basic replacements
    let lineJs = trimmed
      .replace(/(\w+)\s*:=\s*(.+);/g, '$1 = $2;')
      .replace(/writeln\((.*)\);/i, '_cout_write($1); _cout_write("\\n");')
      .replace(/write\((.*)\);/i, '_cout_write($1);')
      .replace(/readln\((.*)\);/i, '$1 = _getline_read();')
      .replace(/read\((.*)\);/i, (match, body) => {
         const vars = body.split(',').map((v: string) => v.trim());
         return vars.map((v: string) => `${v} = _cin_read();`).join(' ');
      })
      .replace(/if\s+(.+)\s+then/i, 'if ($1) {')
      .replace(/else/i, '} else {')
      .replace(/for\s+(\w+)\s*:=\s*(.+)\s+to\s+(.+)\s+do/i, 'for ($1 = $2; $1 <= $3; $1++) {')
      .replace(/while\s+(.+)\s+do/i, 'while ($1) {');

    resultLines.push(lineJs);
  }

  return resultLines.join('\n');
}
