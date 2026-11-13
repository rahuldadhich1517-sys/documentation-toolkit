import { describe, it, expect } from 'vitest';
import {
  generateMarkdownToc,
  extractMarkdownHeadings,
  generateHeadingSlug,
  updateMarkdownToc,
} from '../../src/markdown-toc';

describe('markdown-toc Utility', () => {
  const sampleDocument = `# Project Title

Welcome to the project.

## Introduction
Some introduction.

### Getting Started
Installation instructions.

### Prerequisites
What you need.

## Usage Guide
How to use.

\`\`\`markdown
# This heading inside code block must be ignored
## Another code heading
\`\`\`

~~~bash
### Tilde fence code heading ignored
~~~

## Introduction
Second introduction section with duplicate name.

Heading Level 1 Setext
======================

Heading Level 2 Setext
----------------------
`;

  describe('extractMarkdownHeadings', () => {
    it('extracts ATX and Setext headings and ignores code blocks', () => {
      const headings = extractMarkdownHeadings(sampleDocument);

      const texts = headings.map((h) => h.text);
      expect(texts).toContain('Project Title');
      expect(texts).toContain('Introduction');
      expect(texts).toContain('Getting Started');
      expect(texts).toContain('Prerequisites');
      expect(texts).toContain('Usage Guide');
      expect(texts).toContain('Heading Level 1 Setext');
      expect(texts).toContain('Heading Level 2 Setext');

      // Headings inside code blocks must NOT appear
      expect(texts).not.toContain('This heading inside code block must be ignored');
      expect(texts).not.toContain('Another code heading');
      expect(texts).not.toContain('Tilde fence code heading ignored');
    });

    it('assigns unique slugs to duplicate headings', () => {
      const headings = extractMarkdownHeadings(sampleDocument);
      const introHeadings = headings.filter((h) => h.text === 'Introduction');
      expect(introHeadings.length).toBe(2);
      expect(introHeadings[0]?.slug).toBe('introduction');
      expect(introHeadings[1]?.slug).toBe('introduction-1');
    });

    it('filters by minDepth and maxDepth', () => {
      const headings = extractMarkdownHeadings(sampleDocument, {
        minDepth: 2,
        maxDepth: 2,
      });

      for (const h of headings) {
        expect(h.level).toBe(2);
      }
    });

    it('excludes specified headings by string or RegExp', () => {
      const headings = extractMarkdownHeadings(sampleDocument, {
        exclude: ['Introduction', /^Heading Level/],
      });

      const texts = headings.map((h) => h.text);
      expect(texts).not.toContain('Introduction');
      expect(texts).not.toContain('Heading Level 1 Setext');
      expect(texts).toContain('Getting Started');
    });
  });

  describe('generateMarkdownToc', () => {
    it('generates nested bullet list table of contents', () => {
      const md = `# Overview
## Architecture
### Storage
## Deployment
`;
      const result = generateMarkdownToc(md, { title: 'Table of Contents' });

      expect(result.tocMarkdown).toContain('## Table of Contents\n');
      expect(result.tocMarkdown).toContain('- [Overview](#overview)');
      expect(result.tocMarkdown).toContain('  - [Architecture](#architecture)');
      expect(result.tocMarkdown).toContain('    - [Storage](#storage)');
      expect(result.tocMarkdown).toContain('  - [Deployment](#deployment)');
      expect(result.count).toBe(4);
    });

    it('supports ordered numbered TOC', () => {
      const md = `## Step 1\n## Step 2\n### Sub step\n## Step 3`;
      const result = generateMarkdownToc(md, { ordered: true });

      expect(result.tocMarkdown).toContain('1. [Step 1](#step-1)');
      expect(result.tocMarkdown).toContain('2. [Step 2](#step-2)');
      expect(result.tocMarkdown).toContain('  1. [Sub step](#sub-step)');
      expect(result.tocMarkdown).toContain('3. [Step 3](#step-3)');
    });

    it('handles documents with no headings', () => {
      const result = generateMarkdownToc('Just plain text with no headings.');
      expect(result.count).toBe(0);
      expect(result.tocMarkdown).toBe('');
    });
  });

  describe('updateMarkdownToc', () => {
    it('replaces existing TOC within markers', () => {
      const existingDoc = `# Title
<!-- toc -->
Old outdated TOC
<!-- /toc -->

## Section 1
## Section 2
`;
      const updated = updateMarkdownToc(existingDoc);

      expect(updated).not.toContain('Old outdated TOC');
      expect(updated).toContain('<!-- toc -->');
      expect(updated).toContain('[Section 1](#section-1)');
      expect(updated).toContain('[Section 2](#section-2)');
      expect(updated).toContain('<!-- /toc -->');
    });

    it('replaces single <!-- generated-toc --> comment', () => {
      const doc = `# Title\n\n<!-- generated-toc -->\n\n## Section A`;
      const updated = updateMarkdownToc(doc);

      expect(updated).toContain('<!-- toc -->');
      expect(updated).toContain('[Section A](#section-a)');
      expect(updated).toContain('<!-- /toc -->');
    });

    it('prepends TOC to top if no markers found', () => {
      const doc = `## Only Section`;
      const updated = updateMarkdownToc(doc);

      expect(updated.startsWith('<!-- toc -->')).toBe(true);
      expect(updated).toContain('[Only Section](#only-section)');
    });
  });

  describe('generateHeadingSlug', () => {
    it('creates GitHub-style anchor slug', () => {
      expect(generateHeadingSlug('Quick Start (v1.0)!')).toBe('quick-start-v10');
      expect(generateHeadingSlug('Special & Symbols @ Work')).toBe('special-symbols-work');
    });
  });
});
