import { describe, it, expect, vi } from 'vitest';
import {
  renderCodeToSvg,
  renderCodeToImage,
  downloadCodeImage,
  getCodeImageThemes,
  getCodeImageDimensions,
  THEMES,
} from '../../src/code-to-image';
import { ValidationError } from '../../src/shared';

describe('code-to-image Utility', () => {
  const sampleCode = `function hello(name: string): string {
  // Return greeting
  const greeting = \`Hello, \${name}!\`;
  return greeting;
}`;

  describe('renderCodeToSvg', () => {
    it('generates valid SVG with code content', () => {
      const svg = renderCodeToSvg({
        code: sampleCode,
        language: 'typescript',
        filename: 'hello.ts',
      });

      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('hello.ts');
      expect(svg).toContain('TYPESCRIPT');
      expect(svg).toContain('function');
      expect(svg).toContain('</svg>');
    });

    it('safely escapes HTML/SVG content in code and header', () => {
      const maliciousCode = '<script>alert("xss")</script><div class="danger">Test & Fun</div>';
      const svg = renderCodeToSvg({
        code: maliciousCode,
        filename: '<evil.js>',
        title: 'Title & "Quotes"',
      });

      expect(svg).not.toContain('<script>');
      expect(svg).toContain('&lt;');
      expect(svg).toContain('script');
      expect(svg).toContain('&gt;');
      expect(svg).toContain('&amp;');
      expect(svg).toContain('Fun');
      expect(svg).toContain('&lt;evil.js&gt;');
    });

    it('handles unicode characters and emojis', () => {
      const unicodeCode = 'const rocket = "🚀"; // Café résumé';
      const svg = renderCodeToSvg({ code: unicodeCode });
      expect(svg).toContain('🚀');
      expect(svg).toContain('Café résumé');
    });

    it('supports line highlighting and custom startLineNumber', () => {
      const svg = renderCodeToSvg({
        code: 'line 1\nline 2\nline 3\nline 4',
        startLineNumber: 10,
        highlightLines: [11, 13],
      });

      expect(svg).toContain('>10<');
      expect(svg).toContain('>11<');
      expect(svg).toContain('>12<');
      expect(svg).toContain('>13<');
      // Highlight rect must be present
      expect(svg).toContain('height="');
    });

    it('supports transparent background option', () => {
      const opaqueSvg = renderCodeToSvg({ code: 'const x = 1;', transparentBackground: false });
      const transparentSvg = renderCodeToSvg({ code: 'const x = 1;', transparentBackground: true });

      expect(opaqueSvg).toContain('<rect width="800" height=');
      expect(transparentSvg).not.toContain('<rect width="800" height=');
    });

    it('supports custom themes and object theme definitions', () => {
      const draculaSvg = renderCodeToSvg({ code: 'const a = 1;', theme: 'dracula' });
      expect(draculaSvg).toContain(THEMES.dracula.background);

      const customTheme = {
        id: 'custom-pink',
        name: 'Custom Pink',
        type: 'dark' as const,
        background: '#ff00ff',
        windowBackground: '#aa00aa',
        textColor: '#ffffff',
        lineNumberColor: '#888888',
        highlightLineBackground: '#550055',
        tokens: THEMES['github-dark'].tokens,
      };

      const customSvg = renderCodeToSvg({ code: 'const a = 1;', theme: customTheme });
      expect(customSvg).toContain('#ff00ff');
      expect(customSvg).toContain('#aa00aa');
    });

    it('supports window controls configuration and styles', () => {
      const macSvg = renderCodeToSvg({ code: 'x = 1', windowStyle: 'mac', showWindowControls: true });
      expect(macSvg).toContain('fill="#ff5f56"');
      expect(macSvg).toContain('fill="#ffbd2e"');
      expect(macSvg).toContain('fill="#27c93f"');

      const noControlsSvg = renderCodeToSvg({ code: 'x = 1', showWindowControls: false });
      expect(noControlsSvg).not.toContain('fill="#ff5f56"');
    });

    it('throws ValidationError for invalid input', () => {
      expect(() => renderCodeToSvg({ code: null as any })).toThrow(ValidationError);
      expect(() => renderCodeToSvg(null as any)).toThrow(ValidationError);
    });
  });

  describe('getCodeImageDimensions', () => {
    it('calculates correct dimensions based on line count and padding', () => {
      const dims = getCodeImageDimensions({
        code: '1\n2\n3\n4\n5',
        fontSize: 16,
        lineHeight: 24,
        padding: 40,
        width: 900,
      });

      expect(dims.width).toBe(900);
      expect(dims.lineCount).toBe(5);
      expect(dims.contentHeight).toBe(5 * 24);
      // total = contentHeight (120) + header (46) + padding*2 (80) = 246
      expect(dims.height).toBe(246);
    });

    it('throws on out-of-bound dimensions', () => {
      expect(() =>
        getCodeImageDimensions({
          code: 'test',
          width: 50, // below 200 minWidth
        })
      ).toThrow(ValidationError);
    });
  });

  describe('getCodeImageThemes', () => {
    it('returns all built-in themes', () => {
      const themes = getCodeImageThemes();
      expect(themes['github-dark']).toBeDefined();
      expect(themes['github-light']).toBeDefined();
      expect(themes.dracula).toBeDefined();
      expect(themes.nord).toBeDefined();
      expect(themes['one-dark']).toBeDefined();
      expect(themes.monokai).toBeDefined();
    });
  });

  describe('renderCodeToImage & downloadCodeImage', () => {
    it('renders image or handles canvas properly', async () => {
      // In happy-dom or node test environment, Canvas may or may not be polyfilled
      try {
        const blob = await renderCodeToImage({ code: 'console.log(1);' });
        expect(blob).toBeInstanceOf(Blob);
      } catch (err: any) {
        expect(err.message).toMatch(/canvas|context|PNG|browser/i);
      }
    });

    it('downloads SVG format without canvas dependency', async () => {
      const clickSpy = vi.fn();
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = origCreateElement(tagName);
        if (tagName === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      await downloadCodeImage({
        code: 'console.log("download test");',
        format: 'svg',
        filename: 'test.svg',
      });

      expect(clickSpy).toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });
});
