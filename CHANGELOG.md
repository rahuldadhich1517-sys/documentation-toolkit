# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-13

### Added
- Initial production-ready release of `@rahul_dadhich15/documentation-toolkit`.
- 9 independent modular utilities:
  - `code-to-image`: Render code snippets as styled, downloadable SVG and PNG images with themes, line highlighting, and header bars.
  - `readme-generate`: Configurable README generator from project metadata with presets, badges, and template customization.
  - `html-table-generate`: Generate accessible, customizable, and secure HTML tables from structured arrays or record objects.
  - `markdown-edit`: Secure browser-compatible Markdown parsing and sanitization with XSS protection and deterministic rendering.
  - `markdown-table`: Generate, format, parse, align, and validate Markdown tables with pipe escaping and multiline cell support.
  - `markdown-toc`: Table of contents generator with heading depth control, slug generation, duplicate handling, and anchor links.
  - `mermaid-render`: Official Mermaid client-side diagram rendering to SVG and PNG with syntax validation and sandboxed execution.
  - `license-generate`: Official open-source license generator supporting 9 major SPDX licenses (MIT, Apache-2.0, BSD-2/3, ISC, GPL-3, LGPL-3, MPL-2.0, Unlicense).
  - `readme-badge`: Shields.io badge URL and Markdown generator supporting popular metric presets and custom styling.
- Comprehensive shared architecture: HTML/SVG escaping, URL sanitization, dimension validation, error types, and browser download helpers.
- Subpath exports for all 9 utilities with ESM, CommonJS, and TypeScript declarations.
