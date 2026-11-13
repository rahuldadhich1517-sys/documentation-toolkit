import { describe, it, expect } from 'vitest';
import {
  renderMarkdown,
  validateMarkdownInput,
  getMarkdownOptions,
} from '../../src/markdown-edit';
import { ValidationError } from '../../src/shared';

describe('markdown-edit Utility', () => {
  describe('validateMarkdownInput', () => {
    it('accepts valid string input', () => {
      const res = validateMarkdownInput('# Hello');
      expect(res.valid).toBe(true);
      expect(res.data).toBe('# Hello');
    });

    it('rejects non-string input', () => {
      expect(validateMarkdownInput(123 as any).valid).toBe(false);
      expect(validateMarkdownInput(null as any).valid).toBe(false);
      expect(validateMarkdownInput(undefined as any).valid).toBe(false);
    });
  });

  describe('getMarkdownOptions', () => {
    it('returns default options', () => {
      const opts = getMarkdownOptions();
      expect(opts.gfm).toBe(true);
      expect(opts.sanitize).toBe(true);
      expect(opts.breaks).toBe(true);
      expect(opts.allowedTags).toBeDefined();
    });
  });

  describe('renderMarkdown', () => {
    it('renders CommonMark headings, lists, bold, and code', () => {
      const md = `# Heading 1
## Heading 2

This is **bold** and *italic* text with \`inline code\`.

> A wise blockquote

- List item 1
- List item 2
`;
      const html = renderMarkdown(md);

      expect(html).toContain('<h1>Heading 1</h1>');
      expect(html).toContain('<h2>Heading 2</h2>');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<code>inline code</code>');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>List item 1</li>');
    });

    it('renders GFM tables and task lists and strikethrough', () => {
      const md = `| Col A | Col B |
| --- | --- |
| 1 | 2 |

- [x] Task 1 completed
- [ ] Task 2 pending

~~Old text~~
`;
      const html = renderMarkdown(md);

      expect(html).toContain('<table>');
      expect(html).toContain('<th>Col A</th>');
      expect(html).toContain('<td>1</td>');
      expect(html).toContain('<del>Old text</del>');
    });

    it('sanitizes and strips malicious scripts and event handlers (XSS prevention)', () => {
      const malicious = `
# Dangerous Markdown

<script>alert("xss")</script>
<img src="x" onerror="alert('pwnd')">
<a href="javascript:alert(1)">Click Me</a>
<div onmouseover="evil()">Hover me</div>
<iframe src="https://evil.com"></iframe>
`;
      const html = renderMarkdown(malicious);

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('alert("xss")');
      expect(html).not.toContain('onerror');
      expect(html).not.toContain('javascript:alert(1)');
      expect(html).not.toContain('onmouseover');
      expect(html).not.toContain('<iframe');
    });

    it('allows safe links and images', () => {
      const safe = `
[Safe Link](https://example.com/docs)
![Safe Image](https://example.com/logo.png "Logo")
`;
      const html = renderMarkdown(safe);

      expect(html).toContain('href="https://example.com/docs"');
      expect(html).toContain('src="https://example.com/logo.png"');
    });

    it('handles malformed markdown gracefully without throwing', () => {
      const malformed = '[[[[[[[[[[((((((((( * ```` ````` >>>> |||||';
      expect(() => renderMarkdown(malformed)).not.toThrow();
    });

    it('handles empty input string', () => {
      expect(renderMarkdown('')).toBe('');
    });

    it('throws ValidationError for non-string input', () => {
      expect(() => renderMarkdown(null as any)).toThrow(ValidationError);
    });
  });
});
