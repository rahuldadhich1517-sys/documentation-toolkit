export interface Token {
  type: string;
  value: string;
}

const JS_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
  'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'let', 'static', 'enum', 'await', 'async', 'from', 'as', 'interface',
  'type', 'implements', 'package', 'protected', 'private', 'public', 'readonly'
]);

const PY_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
  'raise', 'return', 'try', 'while', 'with', 'yield'
]);

export function tokenizeCode(code: string, language = 'javascript'): Token[][] {
  const lines = code.split(/\r?\n/);
  const lang = (language || 'text').toLowerCase();

  return lines.map((line) => tokenizeLine(line, lang));
}

function tokenizeLine(line: string, lang: string): Token[] {
  if (!line) return [{ type: 'text', value: '' }];

  if (lang === 'text') {
    return [{ type: 'text', value: line }];
  }

  const tokens: Token[] = [];
  let pos = 0;
  const len = line.length;

  while (pos < len) {
    const char = line[pos]!;

    // Single-line comment: // or # or --
    if (
      (char === '/' && line[pos + 1] === '/') ||
      (char === '#' && (lang === 'python' || lang === 'bash' || lang === 'sh' || lang === 'yaml')) ||
      (char === '-' && line[pos + 1] === '-' && lang === 'sql')
    ) {
      tokens.push({ type: 'comment', value: line.slice(pos) });
      break;
    }

    // Strings: single quotes, double quotes, backticks
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let end = pos + 1;
      let escaped = false;
      while (end < len) {
        if (escaped) {
          escaped = false;
        } else if (line[end] === '\\') {
          escaped = true;
        } else if (line[end] === quote) {
          end++;
          break;
        }
        end++;
      }
      tokens.push({ type: 'string', value: line.slice(pos, end) });
      pos = end;
      continue;
    }

    // Numbers: integer or floating point
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(line[pos + 1] || ''))) {
      let end = pos;
      while (end < len && /[0-9a-fA-FxX._]/.test(line[end]!)) {
        end++;
      }
      tokens.push({ type: 'number', value: line.slice(pos, end) });
      pos = end;
      continue;
    }

    // Identifiers / Keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let end = pos;
      while (end < len && /[a-zA-Z0-9_$]/.test(line[end]!)) {
        end++;
      }
      const word = line.slice(pos, end);

      if (lang === 'python' && PY_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (JS_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (end < len && line[end] === '(') {
        tokens.push({ type: 'function', value: word });
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        tokens.push({ type: 'type', value: word });
      } else {
        tokens.push({ type: 'variable', value: word });
      }
      pos = end;
      continue;
    }

    // Operators
    if (/[=+\-*/%&|^!<>?:~]/.test(char)) {
      let end = pos;
      while (end < len && /[=+\-*/%&|^!<>?:~]/.test(line[end]!)) {
        end++;
      }
      tokens.push({ type: 'operator', value: line.slice(pos, end) });
      pos = end;
      continue;
    }

    // Punctuation
    if (/[{}()[\];,.]/.test(char)) {
      tokens.push({ type: 'punctuation', value: char });
      pos++;
      continue;
    }

    // Whitespace or unknown character
    let end = pos + 1;
    while (end < len && !/[a-zA-Z0-9_$"'/`#=+\-*/%&|^!<>?:~{}()[\];,.]/.test(line[end]!)) {
      end++;
    }
    tokens.push({ type: 'text', value: line.slice(pos, end) });
    pos = end;
  }

  return tokens;
}
