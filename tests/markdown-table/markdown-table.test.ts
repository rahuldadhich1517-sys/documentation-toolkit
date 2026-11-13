import { describe, it, expect } from 'vitest';
import {
  generateMarkdownTable,
  formatMarkdownTable,
  parseMarkdownTable,
  alignMarkdownTable,
  validateMarkdownTable,
} from '../../src/markdown-table';
import { ValidationError } from '../../src/shared';

describe('markdown-table Utility', () => {
  describe('generateMarkdownTable', () => {
    it('generates aligned Markdown table with custom headers and alignments', () => {
      const table = generateMarkdownTable(
        {
          headers: ['Name', 'Role', 'Status'],
          rows: [
            ['Alice', 'Engineer', 'Active'],
            ['Bob', 'Designer', 'Pending'],
          ],
          alignments: ['left', 'center', 'right'],
        }
      );

      expect(table).toContain('| Name  |   Role   |  Status |');
      expect(table).toContain('| :---- | :------: | ------: |');
      expect(table).toContain('| Alice | Engineer |  Active |');
      expect(table).toContain('| Bob   | Designer | Pending |');
    });

    it('escapes pipe characters and handles multiline cells', () => {
      const table = generateMarkdownTable({
        headers: ['Feature', 'Details'],
        rows: [
          ['Logic | Flow', 'Line 1\nLine 2'],
        ],
      });

      expect(table).toContain('Logic \\| Flow');
      expect(table).toContain('Line 1<br />Line 2');
    });

    it('supports compact output mode', () => {
      const table = generateMarkdownTable(
        {
          headers: ['A', 'B'],
          rows: [['1', '2']],
          alignments: ['left', 'right'],
        },
        { compact: true }
      );

      expect(table).toBe('|A|B|\n|:---|---:|\n|1|2|\n');
    });

    it('handles empty rows and uneven columns', () => {
      const table = generateMarkdownTable({
        headers: ['Col 1', 'Col 2'],
        rows: [
          ['Only one'],
          ['One', 'Two', 'Three'], // extra
        ],
      });

      expect(table).toContain('Column 3'); // auto-generated header for 3rd column
      expect(table).toContain('Only one');
    });

    it('throws ValidationError when rows are missing or not an array', () => {
      expect(() => generateMarkdownTable({} as any)).toThrow(ValidationError);
    });
  });

  describe('parseMarkdownTable', () => {
    it('parses Markdown table into structured representation', () => {
      const markdown = `
| Name | Age | City |
| :--- | :---: | ---: |
| Alice | 30 | New York |
| Bob | 25 | London |
`;
      const parsed = parseMarkdownTable(markdown);

      expect(parsed.headers).toEqual(['Name', 'Age', 'City']);
      expect(parsed.alignments).toEqual(['left', 'center', 'right']);
      expect(parsed.rows.length).toBe(2);
      expect(parsed.rows[0]).toEqual(['Alice', '30', 'New York']);
      expect(parsed.columnCount).toBe(3);
      expect(parsed.rowCount).toBe(2);
    });

    it('correctly ignores escaped pipes when parsing cells', () => {
      const markdown = `
| Expression | Description |
| --- | --- |
| a \\| b | Logical OR |
`;
      const parsed = parseMarkdownTable(markdown);
      expect(parsed.rows[0]?.[0]).toBe('a \\| b');
      expect(parsed.rows[0]?.[1]).toBe('Logical OR');
      expect(parsed.columnCount).toBe(2);
    });

    it('handles empty string gracefully', () => {
      const parsed = parseMarkdownTable('');
      expect(parsed.columnCount).toBe(0);
      expect(parsed.rowCount).toBe(0);
    });
  });

  describe('formatMarkdownTable', () => {
    it('re-formats unaligned table into padded aligned table', () => {
      const ugly = `|A|B|\n|---|---|\n|short|a very long value|`;
      const formatted = formatMarkdownTable(ugly);

      expect(formatted).toContain('| A     | B                 |');
      expect(formatted).toContain('| short | a very long value |');
    });
  });

  describe('alignMarkdownTable', () => {
    it('updates column alignments in existing table', () => {
      const original = `| Col 1 | Col 2 |\n| --- | --- |\n| 1 | 2 |`;
      const aligned = alignMarkdownTable(original, ['center', 'right']);

      expect(aligned).toContain(':---:');
      expect(aligned).toContain('---:');
    });
  });

  describe('validateMarkdownTable', () => {
    it('validates correct table', () => {
      const res = validateMarkdownTable('| H1 | H2 |\n| --- | --- |\n| 1 | 2 |');
      expect(res.valid).toBe(true);
      expect(res.data?.columnCount).toBe(2);
    });

    it('rejects empty or missing delimiter row', () => {
      expect(validateMarkdownTable('').valid).toBe(false);
      expect(validateMarkdownTable('| H1 | H2 |\n| No delimiter | row |').valid).toBe(false);
    });
  });
});
