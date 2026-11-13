/**
 * Isolated Consumer Verification Script
 * Validates npm pack tarball, tests ESM & CJS imports, and checks all 9 public subpaths.
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

console.log('🚀 Starting Isolated Consumer Verification...');

const rootDir = process.cwd();

// 1. Pack tarball
console.log('📦 Packing npm package...');
const packOutput = execSync('npm pack', { cwd: rootDir, encoding: 'utf-8' }).trim();
const tarballName = packOutput.split('\n').pop().trim();
const tarballPath = join(rootDir, tarballName);
console.log(`✅ Packed tarball: ${tarballName}`);

const consumerDir = mkdtempSync(join(tmpdir(), 'doc-toolkit-consumer-'));
console.log(`📁 Created temporary consumer directory: ${consumerDir}`);

try {
  // 2. Initialize minimal consumer package.json
  writeFileSync(
    join(consumerDir, 'package.json'),
    JSON.stringify(
      {
        name: 'consumer-test',
        version: '1.0.0',
        type: 'module',
      },
      null,
      2
    )
  );

  // 3. Install packed tarball
  console.log('📥 Installing packed tarball into consumer...');
  execSync(`npm install "${tarballPath}"`, {
    cwd: consumerDir,
    stdio: 'inherit',
  });

  // 4. Test ESM Imports (Root & All 9 Subpaths)
  console.log('🧪 Testing ESM imports across all 9 subpaths...');
  const esmTestScript = `
import {
  renderCodeToSvg,
  generateReadme,
  generateHtmlTable,
  renderMarkdown,
  generateMarkdownTable,
  generateMarkdownToc,
  renderMermaidToSvg,
  generateLicense,
  generateReadmeBadge,
} from '@rahul_dadhich15/documentation-toolkit';

import { renderCodeToSvg as subCodeToSvg } from '@rahul_dadhich15/documentation-toolkit/code-to-image';
import { generateReadme as subReadme } from '@rahul_dadhich15/documentation-toolkit/readme-generate';
import { generateHtmlTable as subHtmlTable } from '@rahul_dadhich15/documentation-toolkit/html-table-generate';
import { renderMarkdown as subMarkdownEdit } from '@rahul_dadhich15/documentation-toolkit/markdown-edit';
import { generateMarkdownTable as subMarkdownTable } from '@rahul_dadhich15/documentation-toolkit/markdown-table';
import { generateMarkdownToc as subMarkdownToc } from '@rahul_dadhich15/documentation-toolkit/markdown-toc';
import { getMermaidDiagramTypes as subMermaid } from '@rahul_dadhich15/documentation-toolkit/mermaid-render';
import { generateLicense as subLicense } from '@rahul_dadhich15/documentation-toolkit/license-generate';
import { generateBadgeUrl as subBadge } from '@rahul_dadhich15/documentation-toolkit/readme-badge';

// Test representative executions
const svg = renderCodeToSvg({ code: 'const x = 1;' });
if (!svg.includes('<svg')) throw new Error('Root renderCodeToSvg failed');

const subSvg = subCodeToSvg({ code: 'const x = 1;' });
if (!subSvg.includes('<svg')) throw new Error('Subpath renderCodeToSvg failed');

const readme = subReadme({ projectName: 'consumer-app' });
if (!readme.includes('# consumer-app')) throw new Error('Subpath generateReadme failed');

const table = subHtmlTable({ rows: [['A', 'B']] });
if (!table.html.includes('<table')) throw new Error('Subpath generateHtmlTable failed');

const html = subMarkdownEdit('# Markdown Render');
if (!html.includes('Markdown Render')) throw new Error('Subpath renderMarkdown failed');

const mdTable = subMarkdownTable({ headers: ['H1'], rows: [['V1']] });
if (!mdTable.includes('| H1')) throw new Error('Subpath generateMarkdownTable failed');

const toc = subMarkdownToc('## Section 1\\n## Section 2');
if (!toc.tocMarkdown.includes('[Section 1]')) throw new Error('Subpath generateMarkdownToc failed');

const diagramTypes = subMermaid();
if (diagramTypes.length < 8) throw new Error('Subpath mermaid diagram types failed');

const license = subLicense('MIT', { author: 'Rahul' });
if (!license.text.includes('MIT License')) throw new Error('Subpath generateLicense failed');

const badge = subBadge({ type: 'npm-version', packageName: 'toolkit' });
if (!badge.includes('https://img.shields.io/npm/v/toolkit')) throw new Error('Subpath readme-badge failed');

console.log('✅ ESM consumer verification successful for all 9 subpaths and root entry point!');
`;

  writeFileSync(join(consumerDir, 'test-esm.js'), esmTestScript);
  execSync('node test-esm.js', { cwd: consumerDir, stdio: 'inherit' });

  // 5. Test CommonJS Imports
  console.log('🧪 Testing CommonJS imports...');
  const cjsTestScript = `
const root = require('@rahul_dadhich15/documentation-toolkit');
const { generateMarkdownTable } = require('@rahul_dadhich15/documentation-toolkit/markdown-table');
const { generateLicense } = require('@rahul_dadhich15/documentation-toolkit/license-generate');
const { generateBadgeUrl } = require('@rahul_dadhich15/documentation-toolkit/readme-badge');

const tbl = generateMarkdownTable({ headers: ['C1'], rows: [['R1']] });
if (!tbl.includes('| C1')) throw new Error('CommonJS markdown-table failed');

const lic = generateLicense('MIT', { author: 'Rahul', year: 2026 });
if (!lic.text.includes('Copyright (c) 2026 Rahul')) throw new Error('CommonJS license-generate failed');

const badge = generateBadgeUrl({ type: 'npm-version', packageName: 'test' });
if (!badge.includes('https://img.shields.io/npm/v/test')) throw new Error('CommonJS readme-badge failed');

console.log('✅ CommonJS consumer verification successful!');
`;

  writeFileSync(join(consumerDir, 'test-cjs.cjs'), cjsTestScript);
  execSync('node test-cjs.cjs', { cwd: consumerDir, stdio: 'inherit' });

  console.log('🎉 ALL CONSUMER CHECKS PASSED SUCCESSFULLY!');
} finally {
  // Cleanup consumer temp dir & packed tarball
  try {
    rmSync(consumerDir, { recursive: true, force: true });
  } catch {}
  try {
    rmSync(tarballPath, { force: true });
  } catch {}
}
