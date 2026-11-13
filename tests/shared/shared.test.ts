import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  escapeSvg,
  escapeMarkdown,
  escapeMarkdownTableCell,
  unescapeHtml,
  isSafeUrl,
  sanitizeUrl,
  validateDimensions,
  normalizeText,
  generateHeadingSlug,
  SlugTracker,
  ToolkitError,
  ValidationError,
  RenderError,
  BrowserError,
  isBrowser,
  hasBlob,
  svgToDataUrl,
} from '../../src/shared';

describe('Shared Utilities', () => {
  describe('Errors', () => {
    it('creates ToolkitError with code and cause', () => {
      const cause = new Error('root cause');
      const err = new ToolkitError('generic failure', 'ERR_CODE', cause);
      expect(err.message).toBe('generic failure');
      expect(err.code).toBe('ERR_CODE');
      expect(err.cause).toBe(cause);
      expect(err.name).toBe('ToolkitError');
    });

    it('creates ValidationError with multiple errors array', () => {
      const err = new ValidationError('Bad input', ['field a is required', 'field b too short']);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.errors).toEqual(['field a is required', 'field b too short']);
      expect(err.name).toBe('ValidationError');
    });

    it('creates RenderError and BrowserError', () => {
      const rErr = new RenderError('Render failed');
      expect(rErr.code).toBe('RENDER_ERROR');
      const bErr = new BrowserError('No DOM');
      expect(bErr.code).toBe('BROWSER_UNSUPPORTED');
    });
  });

  describe('Escape Utilities', () => {
    it('escapes HTML special characters correctly', () => {
      expect(escapeHtml('<script>alert("xss & \'fun\'")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss &amp; &#39;fun&#39;&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null as any)).toBe('');
    });

    it('escapes SVG characters identically', () => {
      expect(escapeSvg('<rect fill="red" />')).toBe('&lt;rect fill=&quot;red&quot; /&gt;');
    });

    it('escapes Markdown syntax symbols', () => {
      const escaped = escapeMarkdown('*hello* [world](http://test.com) # title `code`');
      expect(escaped).toContain('\\*hello\\*');
      expect(escaped).toContain('\\[world\\]\\(http://test\\.com\\)');
      expect(escaped).toContain('\\# title');
      expect(escaped).toContain('\\`code\\`');
    });

    it('escapes Markdown table cell with pipes and newlines', () => {
      expect(escapeMarkdownTableCell('A | B\nC')).toBe('A \\| B<br />C');
      expect(escapeMarkdownTableCell('')).toBe('');
      expect(escapeMarkdownTableCell(null as any)).toBe('');
    });

    it('unescapes HTML entities back to raw characters', () => {
      expect(unescapeHtml('&lt;div&gt;&amp;&quot;&#39;&lt;/div&gt;')).toBe('<div>&"\'</div>');
      expect(unescapeHtml('')).toBe('');
      expect(unescapeHtml(null as any)).toBe('');
    });
  });

  describe('Validation & URLs', () => {
    it('validates safe and unsafe URLs', () => {
      expect(isSafeUrl('https://example.com/docs')).toBe(true);
      expect(isSafeUrl('http://localhost:3000')).toBe(true);
      expect(isSafeUrl('mailto:test@example.com')).toBe(true);
      expect(isSafeUrl('#anchor-slug')).toBe(true);
      expect(isSafeUrl('./relative/path')).toBe(true);
      expect(isSafeUrl('/absolute/path')).toBe(true);

      // Dangerous protocols must return false
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeUrl('')).toBe(false);
      expect(isSafeUrl(null as any)).toBe(false);
    });

    it('sanitizes unsafe URLs to fallback', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('javascript:alert(1)', '#safe-fallback')).toBe('#safe-fallback');
      expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
    });

    it('validates dimensions within limits', () => {
      expect(() => validateDimensions(800, 600)).not.toThrow();
      expect(() => validateDimensions(0, 100)).toThrow(ValidationError);
      expect(() => validateDimensions(100, -50)).toThrow(ValidationError);
      expect(() => validateDimensions(10, 500, { minWidth: 50 })).toThrow(ValidationError);
      expect(() => validateDimensions(5000, 500, { maxWidth: 2000 })).toThrow(ValidationError);
      expect(() => validateDimensions(500, 20, { minHeight: 50 })).toThrow(ValidationError);
      expect(() => validateDimensions(500, 9000, { maxHeight: 5000 })).toThrow(ValidationError);
    });

    it('normalizes text with NFC and carriage returns', () => {
      expect(normalizeText('line1\r\nline2\rline3')).toBe('line1\nline2\nline3');
      expect(normalizeText(null as any)).toBe('');
    });
  });

  describe('Slug Generation', () => {
    it('generates GitHub-compatible slug', () => {
      expect(generateHeadingSlug('Quick Start Guide')).toBe('quick-start-guide');
      expect(generateHeadingSlug('What is `Markdown`?')).toBe('what-is-markdown');
      expect(generateHeadingSlug('API (v2.0) & Features!')).toBe('api-v20-features');
      expect(generateHeadingSlug('### Subheading Level 3')).toBe('subheading-level-3');
      expect(generateHeadingSlug('Unicode: Café & Résumé 🚀')).toBe('unicode-café-résumé');
      expect(generateHeadingSlug('')).toBe('');
      expect(generateHeadingSlug(null as any)).toBe('');
    });

    it('handles duplicate slugs with SlugTracker', () => {
      const tracker = new SlugTracker();
      expect(tracker.getUniqueSlug('Overview')).toBe('overview');
      expect(tracker.getUniqueSlug('Overview')).toBe('overview-1');
      expect(tracker.getUniqueSlug('Overview')).toBe('overview-2');
      tracker.reset();
      expect(tracker.getUniqueSlug('Overview')).toBe('overview');
    });
  });

  describe('Browser Helpers', () => {
    it('checks browser environment in test runner', () => {
      expect(isBrowser()).toBe(true);
      expect(hasBlob()).toBe(true);
    });

    it('converts SVG to data URL', () => {
      const svg = '<svg><rect width="100" height="100"/></svg>';
      const dataUrl = svgToDataUrl(svg);
      expect(dataUrl).toContain('data:image/svg+xml;charset=utf-8,');
      expect(svgToDataUrl(null as any)).toBe('');
    });
  });
});
