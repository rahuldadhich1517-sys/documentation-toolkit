import { describe, it, expect } from 'vitest';
import {
  // 1. code-to-image
  renderCodeToSvg,
  getCodeImageDimensions,
  getCodeImageThemes,
  // 2. readme-generate
  generateReadme,
  createReadmeConfig,
  getReadmeTemplates,
  validateReadmeMetadata,
  // 3. html-table-generate
  generateHtmlTable,
  generateTableFromObjects,
  validateTableData,
  getHtmlTablePresets,
  // 4. markdown-edit
  renderMarkdown,
  validateMarkdownInput,
  getMarkdownOptions,
  // 5. markdown-table
  generateMarkdownTable,
  formatMarkdownTable,
  parseMarkdownTable,
  alignMarkdownTable,
  validateMarkdownTable,
  // 6. markdown-toc
  generateMarkdownToc,
  extractMarkdownHeadings,
  generateHeadingSlug,
  updateMarkdownToc,
  // 7. mermaid-render
  renderMermaidToSvg,
  validateMermaidSource,
  getMermaidDiagramTypes,
  getMermaidRenderOptions,
  // 8. license-generate
  generateLicense,
  getAvailableLicenses,
  getLicenseTemplate,
  validateLicenseMetadata,
  // 9. readme-badge
  generateReadmeBadge,
  generateBadgeMarkdown,
  generateBadgeUrl,
  getBadgePresets,
} from '../src';

describe('all-utilities-smoke: Comprehensive End-to-End Test for All 9 Utilities', () => {
  it('1. code-to-image smoke test', () => {
    const code = 'const msg = "Hello from Documentation Toolkit";';
    const svg = renderCodeToSvg({ code, language: 'typescript', filename: 'index.ts' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('index.ts');

    const dims = getCodeImageDimensions({ code });
    expect(dims.width).toBe(800);
    expect(dims.lineCount).toBe(1);

    const themes = getCodeImageThemes();
    expect(Object.keys(themes).length).toBeGreaterThanOrEqual(5);
  });

  it('2. readme-generate smoke test', () => {
    const meta = {
      projectName: 'smoke-test-project',
      description: 'Smoke test verification',
      installation: 'npm install smoke-test-project',
    };
    const valid = validateReadmeMetadata(meta);
    expect(valid.valid).toBe(true);

    const readme = generateReadme(meta);
    expect(readme).toContain('# smoke-test-project');
    expect(readme).toContain('## Installation');

    const config = createReadmeConfig({ projectName: 'custom' });
    expect(config.projectName).toBe('custom');

    const templates = getReadmeTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });

  it('3. html-table-generate smoke test', () => {
    const tableData = {
      headers: ['Col 1', 'Col 2'],
      rows: [['Val A', 'Val B']],
    };
    expect(validateTableData(tableData).valid).toBe(true);

    const result = generateHtmlTable(tableData);
    expect(result.html).toContain('<table');
    expect(result.totalRows).toBe(1);

    const fromObj = generateTableFromObjects([{ a: 1, b: 2 }]);
    expect(fromObj.html).toContain('>a</th>');

    const presets = getHtmlTablePresets();
    expect(presets.striped).toBeDefined();
  });

  it('4. markdown-edit smoke test', () => {
    expect(validateMarkdownInput('# Test').valid).toBe(true);
    expect(getMarkdownOptions().gfm).toBe(true);

    const html = renderMarkdown('# Markdown Title\n\nParagraph text with **bold**.');
    expect(html).toContain('<h1>Markdown Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('5. markdown-table smoke test', () => {
    const table = generateMarkdownTable({
      headers: ['Name', 'Age'],
      rows: [['Alice', 30]],
      alignments: ['left', 'right'],
    });
    expect(table).toContain('| Name  | Age |');

    const parsed = parseMarkdownTable(table);
    expect(parsed.headers).toEqual(['Name', 'Age']);
    expect(parsed.rowCount).toBe(1);

    const formatted = formatMarkdownTable(table);
    expect(formatted).toContain('| Name');

    const aligned = alignMarkdownTable(table, ['center', 'center']);
    expect(aligned).toContain(':---:');

    expect(validateMarkdownTable(table).valid).toBe(true);
  });

  it('6. markdown-toc smoke test', () => {
    const doc = '# Chapter 1\n## Section 1.1\n## Section 1.2';
    const headings = extractMarkdownHeadings(doc);
    expect(headings.length).toBe(3);

    const toc = generateMarkdownToc(doc);
    expect(toc.tocMarkdown).toContain('- [Chapter 1](#chapter-1)');
    expect(toc.count).toBe(3);

    const slug = generateHeadingSlug('My Heading');
    expect(slug).toBe('my-heading');

    const updated = updateMarkdownToc(doc);
    expect(updated).toContain('<!-- toc -->');
  });

  it('7. mermaid-render smoke test', async () => {
    const source = 'flowchart LR\n    A --> B';
    const valid = await validateMermaidSource(source);
    expect(valid.valid).toBe(true);

    const rendered = await renderMermaidToSvg(source);
    expect(rendered.svg).toContain('<svg');

    const types = getMermaidDiagramTypes();
    expect(types.length).toBeGreaterThanOrEqual(8);

    const options = getMermaidRenderOptions();
    expect(options.securityLevel).toBe('strict');
  });

  it('8. license-generate smoke test', () => {
    const available = getAvailableLicenses();
    expect(available.length).toBe(9);

    const tpl = getLicenseTemplate('MIT');
    expect(tpl).toContain('MIT License');

    expect(validateLicenseMetadata({ year: 2026 }).valid).toBe(true);

    const license = generateLicense('MIT', { author: 'Rahul', year: 2026 });
    expect(license.text).toContain('Copyright (c) 2026 Rahul');
    expect(license.spdxId).toBe('MIT');
  });

  it('9. readme-badge smoke test', () => {
    const url = generateBadgeUrl({ type: 'npm-version', packageName: 'test-pkg' });
    expect(url).toContain('https://img.shields.io/npm/v/test-pkg');

    const badgeMd = generateBadgeMarkdown({ type: 'npm-version', packageName: 'test-pkg' });
    expect(badgeMd).toContain('![npm-version]');

    const readmeBadge = generateReadmeBadge({ label: 'test', message: 'pass', color: 'green' });
    expect(readmeBadge).toContain('/badge/test-pass-green');

    const presets = getBadgePresets();
    expect(presets['npm-version']).toBeDefined();
  });
});
