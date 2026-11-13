# @rahul_dadhich15/documentation-toolkit

[![npm version](https://img.shields.io/npm/v/@rahul_dadhich15/documentation-toolkit?style=flat&color=cb3837)](https://www.npmjs.com/package/@rahul_dadhich15/documentation-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)

Production-ready, modular, zero-backend documentation utilities for React, Vite, and modern browser-based developer tooling applications.

All user content is processed **100% locally in the browser**. No remote rendering APIs, no backend required, no telemetry, and zero user data uploads.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Architecture & Design Principles](#architecture--design-principles)
- [Subpath Exports](#subpath-exports)
- [All 9 Documentation Utilities](#all-9-documentation-utilities)
  - [1. code-to-image](#1-code-to-image)
  - [2. readme-generate](#2-readme-generate)
  - [3. html-table-generate](#3-html-table-generate)
  - [4. markdown-edit](#4-markdown-edit)
  - [5. markdown-table](#5-markdown-table)
  - [6. markdown-toc](#6-markdown-toc)
  - [7. mermaid-render](#7-mermaid-render)
  - [8. license-generate](#8-license-generate)
  - [9. readme-badge](#9-readme-badge)
- [Security Model & XSS Defense](#security-model--xss-defense)
- [Browser Compatibility](#browser-compatibility)
- [Development, Testing & Coverage](#development-testing--coverage)
- [Build & Packaging](#build--packaging)
- [License](#license)

---

## Features

- **Strict TypeScript & Full Typing**: Full type safety with strict declarations, accurate function signatures, and no ambient `any`.
- **Zero Backend**: Engineered specifically for client-side web tools (e.g., React + Vite).
- **Tree-Shakeable & Modular**: Import everything from root or use granular subpaths (e.g. `@rahul_dadhich15/documentation-toolkit/markdown-table`).
- **ESM & CommonJS Dual Output**: First-class support for both modern ESM bundlers and legacy CommonJS environments.
- **Secure by Default**: Explicit HTML sanitization via DOMPurify, SVG character escaping, URL protocol validation, and sandboxed diagram execution.
- **Battle-Tested Highlighting & Rendering**: Bundled client-side engine with official Mermaid integration, robust Markdown parsing, and scoped code syntax highlighting.

---

## Installation

```bash
npm install @rahul_dadhich15/documentation-toolkit
```

Or using pnpm / yarn:

```bash
pnpm add @rahul_dadhich15/documentation-toolkit
# or
yarn add @rahul_dadhich15/documentation-toolkit
```

---

## Architecture & Design Principles

```
@rahul_dadhich15/documentation-toolkit
├── code-to-image/         -> SVG & PNG code snippet export with syntax highlighting
├── readme-generate/       -> Configurable README builder from metadata
├── html-table-generate/   -> Accessible semantic HTML tables with styling presets
├── markdown-edit/         -> Markdown parser with built-in DOMPurify XSS defense
├── markdown-table/        -> Markdown table generator, parser, aligner & formatter
├── markdown-toc/          -> GitHub-compatible nested Table of Contents generator
├── mermaid-render/        -> Client-side Mermaid diagram rendering to SVG & PNG
├── license-generate/      -> Official SPDX license generator (MIT, Apache-2, BSD, etc.)
├── readme-badge/          -> Shields.io badge URLs and Markdown syntax builder
└── shared/                -> Reusable escaping, validation, and browser helpers
```

Every utility is completely self-contained and independent. Importing one subpath will never pull in the execution overhead of unrelated modules.

---

## Subpath Exports

In addition to importing from the package root, granular subpath imports are provided:

```typescript
// Subpath imports
import { renderCodeToSvg } from '@rahul_dadhich15/documentation-toolkit/code-to-image';
import { generateReadme } from '@rahul_dadhich15/documentation-toolkit/readme-generate';
import { generateHtmlTable } from '@rahul_dadhich15/documentation-toolkit/html-table-generate';
import { renderMarkdown } from '@rahul_dadhich15/documentation-toolkit/markdown-edit';
import { generateMarkdownTable } from '@rahul_dadhich15/documentation-toolkit/markdown-table';
import { generateMarkdownToc } from '@rahul_dadhich15/documentation-toolkit/markdown-toc';
import { renderMermaidToSvg } from '@rahul_dadhich15/documentation-toolkit/mermaid-render';
import { generateLicense } from '@rahul_dadhich15/documentation-toolkit/license-generate';
import { generateReadmeBadge } from '@rahul_dadhich15/documentation-toolkit/readme-badge';
```

---

## All 9 Documentation Utilities

### 1. code-to-image

Render code snippets into customizable, high-resolution downloadable SVG and PNG images with themes, macOS-style window frames, and syntax highlighting.

#### Public APIs
- `renderCodeToSvg(options: CodeToSvgOptions): string`
- `renderCodeToImage(options: CodeToImageOptions): Promise<Blob>`
- `downloadCodeImage(options: DownloadCodeImageOptions): Promise<void>`
- `getCodeImageThemes(): Record<string, CodeImageTheme>`
- `getCodeImageDimensions(options: CodeToSvgOptions): CodeDimensions`

#### Usage Example
```typescript
import { renderCodeToSvg, renderCodeToImage, downloadCodeImage } from '@rahul_dadhich15/documentation-toolkit/code-to-image';

const code = `function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}`;

// Render vector SVG string
const svg = renderCodeToSvg({
  code,
  language: 'typescript',
  filename: 'cart.ts',
  theme: 'dracula', // 'github-dark' | 'github-light' | 'dracula' | 'nord' | 'one-dark' | 'monokai'
  showLineNumbers: true,
  highlightLines: [2],
});

// Render raster PNG Blob via browser Canvas
const pngBlob = await renderCodeToImage({
  code,
  language: 'typescript',
  scale: 2, // Retina 2x
});

// Trigger immediate browser download
await downloadCodeImage({
  code,
  language: 'typescript',
  format: 'png',
  filename: 'cart-snippet.png',
});
```

---

### 2. readme-generate

Generate clean, comprehensive `README.md` files from structured project metadata and configurable section presets.

#### Public APIs
- `generateReadme(metadata: ReadmeMetadata, options?: ReadmeGenerateOptions): string`
- `createReadmeConfig(overrides?: Partial<ReadmeMetadata>): ReadmeConfig`
- `getReadmeTemplates(): ReadmeTemplate[]`
- `validateReadmeMetadata(metadata: unknown): ValidationResult<ReadmeMetadata>`

#### Usage Example
```typescript
import { generateReadme, createReadmeConfig } from '@rahul_dadhich15/documentation-toolkit/readme-generate';

const config = createReadmeConfig({
  projectName: 'my-awesome-tool',
  description: 'A developer utility for modern web applications.',
  installation: 'npm install my-awesome-tool',
  usage: 'import { run } from "my-awesome-tool";\nrun();',
  features: [
    'Zero configuration',
    'Pure client-side processing',
    'Full TypeScript declarations',
  ],
  techStack: [
    { name: 'TypeScript', version: '5.7', url: 'https://www.typescriptlang.org' },
    { name: 'Vite', version: '6.0', url: 'https://vite.dev' },
  ],
  license: 'MIT',
  author: 'Rahul Dadhich',
  repositoryUrl: 'https://github.com/rahul_dadhich15/my-awesome-tool',
});

const readmeMarkdown = generateReadme(config, {
  template: 'comprehensive', // 'minimal' | 'standard' | 'comprehensive'
  includeToc: true,
});
```

---

### 3. html-table-generate

Generate accessible, semantic HTML tables from structured rows, columns, or JavaScript object records, with built-in XSS defense and CSS presets.

#### Public APIs
- `generateHtmlTable(data: TableData, options?: HtmlTableOptions): HtmlTableOutput`
- `generateTableFromObjects(records: Record<string, unknown>[], options?: HtmlTableOptions): HtmlTableOutput`
- `validateTableData(data: unknown): ValidationResult<TableData>`
- `getHtmlTablePresets(): Record<string, HtmlTablePreset>`

#### Usage Example
```typescript
import { generateTableFromObjects, generateHtmlTable } from '@rahul_dadhich15/documentation-toolkit/html-table-generate';

// Generate table directly from API records
const records = [
  { id: 1, name: 'Frontend', language: 'TypeScript', status: 'Active' },
  { id: 2, name: 'Documentation', language: 'Markdown', status: 'Ready' },
];

const { html, css, totalRows } = generateTableFromObjects(records, {
  striped: true,
  hover: true,
  bordered: true,
  caption: 'Project Modules',
  ariaLabel: 'Project modules data table',
  includeStyles: true,
});
```

---

### 4. markdown-edit

Render Markdown into sanitized HTML using `marked` paired with `DOMPurify` to defend against XSS, dangerous schemes, and malformed tags.

#### Public APIs
- `renderMarkdown(markdown: string, options?: MarkdownRenderOptions): string`
- `validateMarkdownInput(input: unknown): ValidationResult<string>`
- `getMarkdownOptions(): MarkdownRenderOptions`

#### Usage Example
```typescript
import { renderMarkdown } from '@rahul_dadhich15/documentation-toolkit/markdown-edit';

const markdownSource = `
# Release Notes v1.0.0

- [x] Full CommonMark & GFM support
- [x] Sandboxed rendering

| Feature | Support |
| :--- | :---: |
| Tables | Yes |
| Task Lists | Yes |
`;

const safeHtml = renderMarkdown(markdownSource, {
  gfm: true,
  breaks: true,
  sanitize: true, // Uses DOMPurify to strip malicious scripts and attributes
});
```

---

### 5. markdown-table

Build, format, parse, align, and validate GitHub-flavored Markdown tables with multiline support and pipe character escaping.

#### Public APIs
- `generateMarkdownTable(data: MarkdownTableData, options?: MarkdownTableOptions): string`
- `formatMarkdownTable(tableMarkdown: string, options?: MarkdownTableOptions): string`
- `parseMarkdownTable(markdown: string): ParsedMarkdownTable`
- `alignMarkdownTable(tableMarkdown: string, alignments: TableAlignment[]): string`
- `validateMarkdownTable(markdown: string): ValidationResult<ParsedMarkdownTable>`

#### Usage Example
```typescript
import {
  generateMarkdownTable,
  parseMarkdownTable,
  formatMarkdownTable,
} from '@rahul_dadhich15/documentation-toolkit/markdown-table';

// 1. Generate aligned table
const table = generateMarkdownTable({
  headers: ['Command', 'Description', 'Default'],
  rows: [
    ['--port', 'Server port number', '3000'],
    ['--host', 'Host address', 'localhost'],
  ],
  alignments: ['left', 'left', 'center'],
});

// 2. Parse existing table
const parsed = parseMarkdownTable(table);
console.log(parsed.headers); // ['Command', 'Description', 'Default']
console.log(parsed.rowCount); // 2

// 3. Format unaligned table with vertical padding
const formatted = formatMarkdownTable('|a|b|\n|---|---|\n|val1|val2|');
```

---

### 6. markdown-toc

Extract heading hierarchies and generate nested, linked Tables of Contents adhering to GitHub-compatible slug anchors.

#### Public APIs
- `generateMarkdownToc(markdown: string, options?: MarkdownTocOptions): MarkdownTocResult`
- `extractMarkdownHeadings(markdown: string, options?: ExtractHeadingsOptions): MarkdownHeading[]`
- `generateHeadingSlug(headingText: string, options?: SlugOptions): string`
- `updateMarkdownToc(markdown: string, options?: UpdateTocOptions): string`

#### Usage Example
```typescript
import { generateMarkdownToc, updateMarkdownToc } from '@rahul_dadhich15/documentation-toolkit/markdown-toc';

const document = `
# Developer Guide
## Getting Started
### Prerequisites
### Installation
## Architecture
`;

// Extract and build TOC
const { tocMarkdown, headings, count } = generateMarkdownToc(document, {
  title: 'Table of Contents',
  minDepth: 2,
  maxDepth: 4,
  ordered: false,
});

// Automatically update existing markers <!-- toc -->...<!-- /toc -->
const updatedDoc = updateMarkdownToc(document);
```

---

### 7. mermaid-render

Render Mermaid diagram source into SVG vector markup or PNG raster Blobs entirely inside the client browser using Mermaid's official engine.

#### Public APIs
- `renderMermaidToSvg(source: string, options?: MermaidRenderOptions): Promise<MermaidSvgResult>`
- `renderMermaidToPng(source: string, options?: MermaidPngOptions): Promise<Blob>`
- `validateMermaidSource(source: string): Promise<ValidationResult<string>>`
- `getMermaidDiagramTypes(): MermaidDiagramType[]`
- `getMermaidRenderOptions(): MermaidRenderOptions`

#### Usage Example
```typescript
import { renderMermaidToSvg, renderMermaidToPng, validateMermaidSource } from '@rahul_dadhich15/documentation-toolkit/mermaid-render';

const diagram = `flowchart TD
  A[Client Input] --> B{Valid?}
  B -- Yes --> C[Render SVG]
  B -- No --> D[Show Error]`;

// 1. Validate syntax prior to rendering
const validation = await validateMermaidSource(diagram);
if (validation.valid) {
  // 2. Render SVG string
  const { svg, id } = await renderMermaidToSvg(diagram, {
    theme: 'default',
    securityLevel: 'strict',
  });

  // 3. Export PNG Blob
  const pngBlob = await renderMermaidToPng(diagram, { scale: 2 });
}
```

---

### 8. license-generate

Generate official open-source license agreements with exact SPDX legal templates, metadata substitution, and standard notices.

#### Public APIs
- `generateLicense(type: LicenseType, metadata?: LicenseMetadata): LicenseOutput`
- `getAvailableLicenses(): LicenseInfo[]`
- `getLicenseTemplate(type: LicenseType): string`
- `validateLicenseMetadata(metadata: unknown): ValidationResult<LicenseMetadata>`

#### Supported Licenses
- `MIT`
- `Apache-2.0`
- `BSD-2-Clause`
- `BSD-3-Clause`
- `ISC`
- `GPL-3.0-only`
- `LGPL-3.0-only`
- `MPL-2.0`
- `Unlicense`

#### Usage Example
```typescript
import { generateLicense, getAvailableLicenses } from '@rahul_dadhich15/documentation-toolkit/license-generate';

const license = generateLicense('MIT', {
  author: 'Rahul Dadhich',
  year: 2026,
  organization: 'Rahul Dadhich',
});

console.log(license.spdxId); // 'MIT'
console.log(license.text);   // Full MIT license text with Copyright notice
```

---

### 9. readme-badge

Generate valid, URL-encoded Shields.io badge URLs and Markdown image syntax for README files, with popular metric presets and custom styling.

#### Public APIs
- `generateReadmeBadge(config: BadgeConfig): string`
- `generateBadgeMarkdown(config: BadgeConfig): string`
- `generateBadgeUrl(config: BadgeConfig): string`
- `getBadgePresets(): Record<string, BadgePreset>`

#### Supported Badge Types
- `npm-version`
- `npm-downloads`
- `license`
- `github-stars`
- `github-forks`
- `github-issues`
- `github-contributors`
- `build-status`
- `coverage`
- `custom`

#### Usage Example
```typescript
import { generateReadmeBadge, generateBadgeUrl } from '@rahul_dadhich15/documentation-toolkit/readme-badge';

// 1. Generate npm version badge Markdown
const npmBadge = generateReadmeBadge({
  type: 'npm-version',
  packageName: '@rahul_dadhich15/documentation-toolkit',
  style: 'flat',
  color: 'cb3837',
  url: 'https://www.npmjs.com/package/@rahul_dadhich15/documentation-toolkit',
});

// 2. Custom status badge URL
const customUrl = generateBadgeUrl({
  type: 'custom',
  label: 'build',
  message: 'passing',
  color: 'brightgreen',
});
```

---

## Security Model & XSS Defense

1. **No Backend & No Network Transmission**: All operations run locally inside the client browser. No telemetry or content is sent to external servers.
2. **Explicit HTML Sanitization**: `markdown-edit` passes all parsed HTML through DOMPurify with strict attribute and tag allowlists, discarding `<script>`, `<iframe>`, `javascript:` protocols, and inline event handlers (`onload`, `onerror`).
3. **SVG Character Escaping**: `code-to-image` and `html-table-generate` escape `<`, `>`, `&`, `"`, `'` to prevent injection into DOM or SVG text nodes.
4. **Mermaid Sandboxing**: `mermaid-render` defaults to `securityLevel: 'strict'`, preventing inline script execution or untrusted HTML in node labels.
5. **No `eval()` or `new Function()`**: Zero dynamic code execution.

---

## Browser Compatibility

Designed and verified for modern client-side browsers and build tools:
- **Browsers**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- **Bundlers**: Vite 4+, Webpack 5+, Rollup, esbuild, Next.js (client components), Remix
- **Node.js**: Node 18+ (for tooling and SSR checks)

---

## Development, Testing & Coverage

```bash
# Install dependencies
npm install

# Run TypeScript typechecker
npm run typecheck

# Run ESLint linter
npm run lint

# Run all Vitest unit & integration tests
npm test

# Run tests with code coverage (Target: >90% statements/lines, >80% branches)
npm run test:coverage

# Run real browser tests with Playwright (Chromium)
npm run test:browser

# Run smoke test covering all 9 utilities
npm run test:smoke

# Run isolated npm consumer verification (ESM & CJS tarball install)
npm run test:consumer
```

---

## Build & Packaging

The package is built with `tsup`:

```bash
npm run build
```

Generates:
- `dist/index.js` (ESM) & `dist/index.cjs` (CJS) + TypeScript declarations (`.d.ts`, `.d.cts`)
- Granular subpath builds in `dist/<utility>/`
- Clean tarball containing only `dist`, `README.md`, `LICENSE`, `CHANGELOG.md`, and `package.json`.

---

## License

MIT © [Rahul Dadhich](LICENSE)
