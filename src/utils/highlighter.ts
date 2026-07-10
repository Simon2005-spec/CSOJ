export function highlightCode(code: string, language: 'cpp' | 'python' | 'pascal'): string {
  // We want to escape HTML characters first to prevent XSS and rendering breakages
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (language === 'cpp') {
    const tokens: string[] = [];
    const pushToken = (content: string, className: string) => {
      const id = `___TOKEN_${tokens.length}___`;
      tokens.push(`<span class="${className}">${content}</span>`);
      return id;
    };

    // Match comments
    html = html.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (match) => {
      return pushToken(match, 'hl-comment');
    });

    // Match double quoted strings
    html = html.replace(/("(?:\\.|[^"\\])*")/g, (match) => {
      return pushToken(match, 'hl-string');
    });

    // Match single quoted chars
    html = html.replace(/('(?:\\.|[^'\\])*')/g, (match) => {
      return pushToken(match, 'hl-string');
    });

    // Preprocessor directives
    html = html.replace(/(#[a-zA-Z_][a-zA-Z0-9_]*)/g, (match) => {
      return pushToken(match, 'hl-preprocessor');
    });

    // Keywords
    const keywords = [
      'auto', 'break', 'case', 'class', 'const', 'continue', 'default', 'do',
      'else', 'enum', 'extern', 'for', 'goto', 'if', 'register', 'return',
      'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'volatile', 'while',
      'using', 'namespace', 'template', 'typename', 'public', 'private', 'protected',
      'friend', 'inline', 'virtual', 'explicit', 'operator', 'new', 'delete', 'true', 'false',
      'null', 'nullptr'
    ];
    // Types
    const types = [
      'bool', 'char', 'double', 'float', 'int', 'long', 'short', 'signed',
      'unsigned', 'void', 'size_t', 'string', 'vector', 'map', 'set', 'pair', 'queue', 'stack'
    ];

    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    html = html.replace(keywordRegex, '<span class="hl-keyword">$1</span>');

    const typeRegex = new RegExp(`\\b(${types.join('|')})\\b`, 'g');
    html = html.replace(typeRegex, '<span class="hl-type">$1</span>');

    // Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span class="hl-number">$1</span>');

    // Functions (word followed by open parenthesis)
    html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/g, '<span class="hl-function">$1</span>');

    // Builtins / special keywords
    html = html.replace(/\b(std|cin|cout|endl|printf|scanf)\b/g, '<span class="hl-builtin">$1</span>');

    // Restore tokens
    for (let i = 0; i < tokens.length; i++) {
      html = html.replace(`___TOKEN_${i}___`, tokens[i]);
    }
  } else if (language === 'python') {
    const tokens: string[] = [];
    const pushToken = (content: string, className: string) => {
      const id = `___TOKEN_${tokens.length}___`;
      tokens.push(`<span class="${className}">${content}</span>`);
      return id;
    };

    // Multi-line comments / Docstrings
    html = html.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, (match) => {
      return pushToken(match, 'hl-comment');
    });

    // Single-line comments
    html = html.replace(/(#[^\n]*)/g, (match) => {
      return pushToken(match, 'hl-comment');
    });

    // Strings
    html = html.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, (match) => {
      return pushToken(match, 'hl-string');
    });

    const keywords = [
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
      'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
      'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
      'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
    ];

    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    html = html.replace(keywordRegex, '<span class="hl-keyword">$1</span>');

    // Builtin functions
    const builtins = [
      'abs', 'all', 'any', 'bin', 'bool', 'chr', 'dict', 'dir', 'divmod',
      'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'hash', 'hex',
      'id', 'input', 'int', 'isinstance', 'len', 'list', 'map', 'max', 'min',
      'next', 'oct', 'open', 'ord', 'pow', 'print', 'range', 'repr', 'reversed',
      'round', 'set', 'sorted', 'str', 'sum', 'tuple', 'type', 'zip'
    ];

    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    html = html.replace(builtinRegex, '<span class="hl-builtin">$1</span>');

    // Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');

    // Functions
    html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/g, '<span class="hl-function">$1</span>');

    // Restore tokens
    for (let i = 0; i < tokens.length; i++) {
      html = html.replace(`___TOKEN_${i}___`, tokens[i]);
    }
  } else if (language === 'pascal') {
    const tokens: string[] = [];
    const pushToken = (content: string, className: string) => {
      const id = `___TOKEN_${tokens.length}___`;
      tokens.push(`<span class="${className}">${content}</span>`);
      return id;
    };

    // Comments: { ... } or (* ... *) or // ...
    html = html.replace(/(\{[^}]*\}|\(\*[\s\S]*?\*\)|\/\/[^\n]*)/g, (match) => {
      return pushToken(match, 'hl-comment');
    });

    // Strings
    html = html.replace(/('(?:''|[^'\n])*')/g, (match) => {
      return pushToken(match, 'hl-string');
    });

    const keywords = [
      'and', 'array', 'begin', 'case', 'const', 'div', 'do', 'downto', 'else',
      'end', 'file', 'for', 'function', 'goto', 'if', 'in', 'label', 'mod',
      'nil', 'not', 'of', 'or', 'packed', 'procedure', 'program', 'record',
      'repeat', 'set', 'then', 'to', 'type', 'until', 'var', 'while', 'with',
      'uses', 'implementation', 'interface', 'unit', 'uses', 'true', 'false'
    ];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    html = html.replace(keywordRegex, '<span class="hl-keyword">$1</span>');

    const types = [
      'integer', 'real', 'char', 'string', 'boolean', 'text'
    ];
    const typeRegex = new RegExp(`\\b(${types.join('|')})\\b`, 'gi');
    html = html.replace(typeRegex, '<span class="hl-type">$1</span>');

    // Builtins
    const builtins = [
      'write', 'writeln', 'read', 'readln', 'abs', 'sqr', 'sqrt', 'odd', 'pred', 'succ'
    ];
    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'gi');
    html = html.replace(builtinRegex, '<span class="hl-builtin">$1</span>');

    // Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');

    // Functions / Procedures calls
    html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/g, '<span class="hl-function">$1</span>');

    // Restore tokens
    for (let i = 0; i < tokens.length; i++) {
      html = html.replace(`___TOKEN_${i}___`, tokens[i]);
    }
  }

  // Ensure trailing newline is preserved so scrolling behaves correctly
  if (html.endsWith('\n')) {
    html += ' ';
  }

  return html;
}
