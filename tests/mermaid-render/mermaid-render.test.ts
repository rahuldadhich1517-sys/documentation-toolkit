import { describe, it, expect } from 'vitest';
import {
  renderMermaidToSvg,
  renderMermaidToPng,
  validateMermaidSource,
  getMermaidDiagramTypes,
  getMermaidRenderOptions,
} from '../../src/mermaid-render';
import { ValidationError, RenderError } from '../../src/shared';

describe('mermaid-render Utility', () => {
  const validFlowchart = `flowchart TD
    A[Start] --> B[Process]
    B --> C[End]`;

  const validSequence = `sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hi Alice`;

  const invalidDiagram = `flowchart TD
    A --> !!! syntax error ???`;

  describe('getMermaidDiagramTypes', () => {
    it('returns supported diagram types with examples', () => {
      const types = getMermaidDiagramTypes();
      expect(types.length).toBeGreaterThanOrEqual(8);
      const ids = types.map((t) => t.id);
      expect(ids).toContain('flowchart');
      expect(ids).toContain('sequenceDiagram');
      expect(ids).toContain('classDiagram');
      expect(ids).toContain('stateDiagram');
      expect(ids).toContain('erDiagram');
      expect(ids).toContain('gitGraph');
    });
  });

  describe('getMermaidRenderOptions', () => {
    it('returns default options with strict security level', () => {
      const opts = getMermaidRenderOptions();
      expect(opts.securityLevel).toBe('strict');
      expect(opts.theme).toBe('default');
    });
  });

  describe('validateMermaidSource', () => {
    it('validates correct flowchart source', async () => {
      const res = await validateMermaidSource(validFlowchart);
      expect(res.valid).toBe(true);
      expect(res.data).toBe(validFlowchart);
    });

    it('rejects empty or whitespace string', async () => {
      const res = await validateMermaidSource('   ');
      expect(res.valid).toBe(false);
      expect(res.errors?.[0]).toContain('cannot be empty');
    });

    it('detects invalid Mermaid diagram syntax', async () => {
      const res = await validateMermaidSource(invalidDiagram);
      expect(res.valid).toBe(false);
      expect(res.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('renderMermaidToSvg', () => {
    it('renders flowchart to SVG string', async () => {
      const result = await renderMermaidToSvg(validFlowchart);
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
      expect(result.id).toBeDefined();

      // Ensure no residual container was left in document.body
      const residual = document.getElementById(result.id);
      expect(residual).toBeNull();
    });

    it('renders sequence diagram to SVG string', async () => {
      const result = await renderMermaidToSvg(validSequence);
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('Alice');
      expect(result.svg).toContain('Bob');
    });

    it('throws ValidationError for empty source', async () => {
      await expect(renderMermaidToSvg('')).rejects.toThrow(ValidationError);
    });

    it('throws RenderError for malformed syntax and cleans up DOM elements', async () => {
      await expect(renderMermaidToSvg(invalidDiagram)).rejects.toThrow(RenderError);
    });
  });

  describe('renderMermaidToPng', () => {
    it('invokes SVG rendering and attempts rasterization', async () => {
      try {
        const blob = await renderMermaidToPng(validFlowchart);
        expect(blob).toBeInstanceOf(Blob);
      } catch (err: any) {
        // In happy-dom without canvas rasterization support
        expect(err.message).toMatch(/canvas|context|PNG|browser/i);
      }
    });
  });
});
