import { describe, it, expect } from 'vitest';
import {
  generateHtmlTable,
  generateTableFromObjects,
  validateTableData,
  getHtmlTablePresets,
} from '../../src/html-table-generate';
import { ValidationError } from '../../src/shared';

describe('html-table-generate Utility', () => {
  describe('validateTableData', () => {
    it('validates proper table data structure', () => {
      const res = validateTableData({
        headers: ['Name', 'Age'],
        rows: [['Alice', 30], ['Bob', 25]],
      });
      expect(res.valid).toBe(true);
      expect(res.data?.rows.length).toBe(2);
    });

    it('rejects invalid table data', () => {
      expect(validateTableData(null).valid).toBe(false);
      expect(validateTableData({ rows: 'not an array' as any }).valid).toBe(false);
      expect(validateTableData({ rows: ['not an array row'] as any }).valid).toBe(false);
      expect(validateTableData({ rows: [], headers: 'not an array' as any }).valid).toBe(false);
    });
  });

  describe('generateHtmlTable', () => {
    it('generates accessible semantic HTML table with headers and footers', () => {
      const result = generateHtmlTable({
        headers: [
          { key: 'col1', label: 'Item', align: 'left' },
          { key: 'col2', label: 'Price', align: 'right' },
        ],
        rows: [
          ['Apple', '$1.50'],
          ['Banana', '$0.75'],
        ],
        footers: ['Total', '$2.25'],
        caption: 'Fruit Prices',
      }, {
        ariaLabel: 'Price Table',
        striped: true,
        hover: true,
        compact: true,
      });

      expect(result.html).toContain('<table class="doc-table doc-table-bordered doc-table-striped doc-table-hover doc-table-compact" aria-label="Price Table">');
      expect(result.html).toContain('<caption>Fruit Prices</caption>');
      expect(result.html).toContain('<th scope="col" class="text-left">Item</th>');
      expect(result.html).toContain('<th scope="col" class="text-right">Price</th>');
      expect(result.html).toContain('<td class="text-left">Apple</td>');
      expect(result.html).toContain('<td class="text-right">$1.50</td>');
      expect(result.html).toContain('<tfoot>');
      expect(result.html).toContain('<td class="text-left">Total</td>');
      expect(result.html).toContain('<td class="text-right">$2.25</td>');
      expect(result.totalRows).toBe(2);
      expect(result.totalColumns).toBe(2);
    });

    it('safely escapes HTML and prevents XSS in cell data and headers', () => {
      const result = generateHtmlTable({
        headers: ['<script>alert(1)</script>', 'Normal'],
        rows: [
          ['<img src=x onerror=alert("xss")>', '<span onclick="evil()">Click</span>'],
        ],
        caption: '<b onmouseover="alert(1)">Danger</b>',
      });

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(result.html).not.toContain('<img src=x onerror=alert("xss")>');
      expect(result.html).toContain('&lt;img src=x onerror=alert(&quot;xss&quot;)&gt;');
      expect(result.html).toContain('&lt;b onmouseover=&quot;alert(1)&quot;&gt;Danger&lt;/b&gt;');
    });

    it('handles empty rows state with custom empty message', () => {
      const result = generateHtmlTable(
        { headers: ['A', 'B'], rows: [] },
        { emptyMessage: 'No records found' }
      );
      expect(result.html).toContain('No records found');
      expect(result.totalRows).toBe(0);
    });

    it('handles uneven row lengths by filling missing columns', () => {
      const result = generateHtmlTable({
        headers: ['Col 1', 'Col 2', 'Col 3'],
        rows: [
          ['Val 1'], // short row
          ['Val 1', 'Val 2', 'Val 3', 'Val 4'], // extra column
        ],
      });

      expect(result.totalColumns).toBe(4);
      expect(result.totalRows).toBe(2);
    });

    it('generates optional embedded CSS when requested', () => {
      const withoutCss = generateHtmlTable({ rows: [['A']] });
      expect(withoutCss.css).toBe('');

      const withCss = generateHtmlTable({ rows: [['A']] }, { includeStyles: true });
      expect(withCss.css).toContain('.doc-table');
      expect(withCss.css).toContain('.doc-table-striped');
    });

    it('respects row limit option', () => {
      const result = generateHtmlTable(
        { rows: [['1'], ['2'], ['3'], ['4'], ['5']] },
        { limitRows: 3 }
      );
      expect(result.totalRows).toBe(3);
    });

    it('throws on invalid data', () => {
      expect(() => generateHtmlTable(null as any)).toThrow(ValidationError);
    });
  });

  describe('generateTableFromObjects', () => {
    it('creates table from structured array of objects', () => {
      const records = [
        { id: 1, name: 'Alice', active: true, extra: null },
        { id: 2, name: 'Bob', active: false, details: { role: 'admin' } },
      ];

      const result = generateTableFromObjects(records);
      expect(result.html).toContain('>id</th>');
      expect(result.html).toContain('>name</th>');
      expect(result.html).toContain('>active</th>');
      expect(result.html).toContain('<td>true</td>');
      expect(result.html).toContain('<td>false</td>');
      expect(result.html).toContain('{&quot;role&quot;:&quot;admin&quot;}');
      expect(result.totalRows).toBe(2);
    });

    it('handles empty records array', () => {
      const result = generateTableFromObjects([]);
      expect(result.totalRows).toBe(0);
    });

    it('throws if input is not an array', () => {
      expect(() => generateTableFromObjects('not an array' as any)).toThrow(ValidationError);
    });
  });

  describe('getHtmlTablePresets', () => {
    it('returns built-in table presets', () => {
      const presets = getHtmlTablePresets();
      expect(presets.default).toBeDefined();
      expect(presets.striped).toBeDefined();
      expect(presets.compact).toBeDefined();
      expect(presets.minimal).toBeDefined();
    });
  });
});
