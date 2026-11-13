import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test.describe('Real Browser Rendering Verification', () => {
  test.beforeEach(async ({ page }) => {
    const rootDir = process.cwd();

    // Serve bundled library and dependencies virtually via Playwright route interception
    await page.route('http://local-test/**', async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      if (pathname === '/' || pathname === '/index.html') {
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Browser Verification</title>
  <script type="importmap">
  {
    "imports": {
      "marked": "/node_modules/marked/lib/marked.esm.js",
      "dompurify": "/node_modules/dompurify/dist/purify.es.mjs",
      "mermaid": "/node_modules/mermaid/dist/mermaid.esm.min.mjs"
    }
  }
  </script>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/test-app.js"></script>
</body>
</html>`;
        return route.fulfill({ status: 200, contentType: 'text/html', body: html });
      }

      if (pathname === '/test-app.js') {
        const testAppCode = `
import * as toolkit from '/dist/index.js';
window.__TOOLKIT__ = toolkit;
window.__READY__ = true;
`;
        return route.fulfill({ status: 200, contentType: 'application/javascript', body: testAppCode });
      }

      if (pathname.startsWith('/dist/')) {
        const filePath = join(rootDir, pathname);
        try {
          const content = readFileSync(filePath);
          return route.fulfill({ status: 200, contentType: 'application/javascript', body: content });
        } catch {
          return route.fulfill({ status: 404, body: 'Not found' });
        }
      }

      if (pathname.startsWith('/node_modules/')) {
        const filePath = join(rootDir, pathname);
        try {
          const content = readFileSync(filePath);
          return route.fulfill({ status: 200, contentType: 'application/javascript', body: content });
        } catch {
          return route.fulfill({ status: 404, body: 'Not found' });
        }
      }

      return route.fulfill({ status: 404, body: 'Not found' });
    });
  });

  test('verifies Code-to-Image SVG, Canvas PNG Blob, and Markdown rendering in Chromium', async ({ page }) => {
    // Collect console errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('http://local-test/index.html');
    await page.waitForFunction(() => (window as any).__READY__ === true);

    const testResults = await page.evaluate(async () => {
      const {
        renderCodeToSvg,
        renderCodeToImage,
        renderMarkdown,
        generateHtmlTable,
        generateMarkdownTable,
        generateMarkdownToc,
        generateLicense,
        generateReadmeBadge,
      } = (window as any).__TOOLKIT__;

      // 1. Code to SVG
      const codeSvg = renderCodeToSvg({
        code: 'const a: number = 42;\nconsole.log(a);',
        language: 'typescript',
        filename: 'answer.ts',
      });

      // 2. Code to Canvas PNG Blob in real browser
      const pngBlob = await renderCodeToImage({
        code: 'const b = 100;',
        scale: 2,
      });

      // 3. Markdown XSS Prevention in browser
      const sanitizedHtml = renderMarkdown('# Hello\\n<script>window.__EVIL__ = true;</script>');

      // 4. HTML Table
      const table = generateHtmlTable({ headers: ['Key', 'Val'], rows: [['K1', 'V1']] });

      // 5. Markdown Table
      const mdTable = generateMarkdownTable({ headers: ['A'], rows: [['1']] });

      // 6. Markdown TOC
      const toc = generateMarkdownToc(['## Intro', '## Setup'].join('\n'));

      // 7. License
      const license = generateLicense('MIT', { author: 'Rahul', year: 2026 });

      // 8. Badge
      const badge = generateReadmeBadge({ label: 'build', message: 'passed', color: 'green' });

      return {
        svgValid: codeSvg.includes('<svg') && codeSvg.includes('answer.ts'),
        pngBlobSize: pngBlob.size,
        pngBlobType: pngBlob.type,
        scriptExecuted: (window as any).__EVIL__ === true,
        htmlSanitized: !sanitizedHtml.includes('<script>'),
        tableRendered: table.html.includes('<table'),
        mdTableRendered: mdTable.includes('| A'),
        tocRendered: toc.count === 2,
        licenseRendered: license.spdxId === 'MIT',
        badgeRendered: badge.includes('/badge/build-passed-green'),
      };
    });

    expect(testResults.svgValid).toBe(true);
    expect(testResults.pngBlobSize).toBeGreaterThan(0);
    expect(testResults.pngBlobType).toBe('image/png');
    expect(testResults.scriptExecuted).toBe(false);
    expect(testResults.htmlSanitized).toBe(true);
    expect(testResults.tableRendered).toBe(true);
    expect(testResults.mdTableRendered).toBe(true);
    expect(testResults.tocRendered).toBe(true);
    expect(testResults.licenseRendered).toBe(true);
    expect(testResults.badgeRendered).toBe(true);
    expect(errors.length).toBe(0);
  });
});
