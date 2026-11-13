import {
  TableData,
  ColumnDefinition,
  TableCell,
  HtmlTableOptions,
  HtmlTableOutput,
  HtmlTablePreset,
  CellAlign,
} from './types';
import { escapeHtml, ValidationResult, ValidationError } from '../shared';

export * from './types';

const PRESETS: Record<string, HtmlTablePreset> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Clean semantic table with standard borders and spacing.',
    options: {
      bordered: true,
      striped: false,
      hover: true,
      responsive: true,
    },
  },
  striped: {
    id: 'striped',
    name: 'Zebra Striped',
    description: 'Alternating row background colors for easy visual scanning.',
    options: {
      striped: true,
      bordered: true,
      hover: true,
      responsive: true,
    },
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Reduced padding for data-dense tables.',
    options: {
      compact: true,
      bordered: true,
      hover: true,
      responsive: true,
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Lightweight table with horizontal dividers only.',
    options: {
      bordered: false,
      striped: false,
      hover: false,
      responsive: true,
    },
  },
};

export function getHtmlTablePresets(): Record<string, HtmlTablePreset> {
  return { ...PRESETS };
}

export function validateTableData(input: unknown): ValidationResult<TableData> {
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Table data must be a non-null object.'] };
  }

  const data = input as Partial<TableData>;
  const errors: string[] = [];

  if (!Array.isArray(data.rows)) {
    errors.push('Table data must contain a "rows" array.');
  } else {
    for (let i = 0; i < data.rows.length; i++) {
      if (!Array.isArray(data.rows[i])) {
        errors.push(`Row at index ${i} must be an array.`);
      }
    }
  }

  if (data.headers && !Array.isArray(data.headers)) {
    errors.push('"headers" must be an array if provided.');
  }

  if (data.footers && !Array.isArray(data.footers)) {
    errors.push('"footers" must be an array if provided.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      headers: data.headers,
      rows: data.rows as TableCell[][],
      footers: data.footers,
      caption: data.caption,
    },
  };
}

function parseHeaders(headers?: (string | ColumnDefinition)[]): ColumnDefinition[] {
  if (!headers || headers.length === 0) return [];
  return headers.map((h, idx) => {
    if (typeof h === 'string') {
      return { key: `col_${idx}`, label: h };
    }
    return {
      key: h.key || `col_${idx}`,
      label: h.label ?? h.key,
      align: h.align,
      width: h.width,
      className: h.className,
    };
  });
}

function formatCell(val: TableCell): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return String(val);
}

function generateDefaultCss(): string {
  return `
.doc-table-container {
  width: 100%;
  overflow-x: auto;
  margin: 1rem 0;
}
.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.9rem;
  color: #1f2937;
}
.doc-table caption {
  padding: 0.5rem;
  font-weight: 600;
  text-align: left;
  caption-side: top;
}
.doc-table th, .doc-table td {
  padding: 0.6rem 0.8rem;
  vertical-align: top;
}
.doc-table th {
  background-color: #f3f4f6;
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid #e5e7eb;
}
.doc-table tfoot td {
  background-color: #f9fafb;
  font-weight: 600;
  border-top: 2px solid #e5e7eb;
}
.doc-table-bordered th, .doc-table-bordered td {
  border: 1px solid #e5e7eb;
}
.doc-table-striped tbody tr:nth-of-type(even) {
  background-color: #f9fafb;
}
.doc-table-hover tbody tr:hover {
  background-color: #f1f5f9;
}
.doc-table-compact th, .doc-table-compact td {
  padding: 0.35rem 0.5rem;
}
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
`.trim();
}

export function generateHtmlTable(data: TableData, options: HtmlTableOptions = {}): HtmlTableOutput {
  const validation = validateTableData(data);
  if (!validation.valid) {
    throw new ValidationError('Invalid table data: ' + validation.errors.join('; '), validation.errors);
  }

  const tableData = validation.data;
  const colDefs = parseHeaders(tableData.headers);
  const rows = options.limitRows ? tableData.rows.slice(0, options.limitRows) : tableData.rows;

  let totalCols = colDefs.length;
  for (const r of rows) {
    if (r.length > totalCols) totalCols = r.length;
  }
  if (tableData.footers && tableData.footers.length > totalCols) {
    totalCols = tableData.footers.length;
  }

  const classNames = ['doc-table'];
  if (options.className) classNames.push(escapeHtml(options.className));
  if (options.bordered !== false) classNames.push('doc-table-bordered');
  if (options.striped) classNames.push('doc-table-striped');
  if (options.hover !== false) classNames.push('doc-table-hover');
  if (options.compact) classNames.push('doc-table-compact');

  const parts: string[] = [];
  const ariaAttr = options.ariaLabel ? ` aria-label="${escapeHtml(options.ariaLabel)}"` : '';
  parts.push(`<table class="${classNames.join(' ')}"${ariaAttr}>`);

  // Caption
  const captionText = options.caption ?? tableData.caption;
  if (captionText) {
    parts.push(`  <caption>${escapeHtml(captionText)}</caption>`);
  }

  // Column alignment helper
  const getAlignment = (colIndex: number): CellAlign | undefined => {
    return options.alignments?.[colIndex] ?? colDefs[colIndex]?.align;
  };

  const getAlignClass = (align?: CellAlign): string => {
    if (align === 'center') return ' class="text-center"';
    if (align === 'right') return ' class="text-right"';
    if (align === 'left') return ' class="text-left"';
    return '';
  };

  // Header
  if (colDefs.length > 0) {
    parts.push('  <thead>');
    parts.push('    <tr>');
    for (let i = 0; i < totalCols; i++) {
      const def = colDefs[i];
      const label = def?.label ?? `Column ${i + 1}`;
      const alignClass = getAlignClass(getAlignment(i));
      const widthStyle = def?.width ? ` style="width: ${escapeHtml(def.width)};"` : '';
      parts.push(`      <th scope="col"${alignClass}${widthStyle}>${escapeHtml(label)}</th>`);
    }
    parts.push('    </tr>');
    parts.push('  </thead>');
  }

  // Body
  parts.push('  <tbody>');
  if (rows.length === 0) {
    const emptyMsg = options.emptyMessage ?? 'No data available';
    parts.push(`    <tr><td colspan="${Math.max(1, totalCols)}" class="text-center">${escapeHtml(emptyMsg)}</td></tr>`);
  } else {
    for (const row of rows) {
      parts.push('    <tr>');
      for (let c = 0; c < totalCols; c++) {
        const cellVal = row[c];
        const text = formatCell(cellVal);
        const alignClass = getAlignClass(getAlignment(c));
        parts.push(`      <td${alignClass}>${escapeHtml(text)}</td>`);
      }
      parts.push('    </tr>');
    }
  }
  parts.push('  </tbody>');

  // Footer
  if (tableData.footers && tableData.footers.length > 0) {
    parts.push('  <tfoot>');
    parts.push('    <tr>');
    for (let c = 0; c < totalCols; c++) {
      const footVal = tableData.footers[c];
      const text = formatCell(footVal);
      const alignClass = getAlignClass(getAlignment(c));
      parts.push(`      <td${alignClass}>${escapeHtml(text)}</td>`);
    }
    parts.push('    </tr>');
    parts.push('  </tfoot>');
  }

  parts.push('</table>');

  let tableHtml = parts.join('\n');
  if (options.responsive !== false) {
    tableHtml = `<div class="doc-table-container">\n${tableHtml}\n</div>`;
  }

  const css = options.includeStyles ? generateDefaultCss() : '';

  return {
    html: tableHtml,
    css,
    totalRows: rows.length,
    totalColumns: totalCols,
  };
}

export function generateTableFromObjects(
  records: Record<string, unknown>[],
  options: HtmlTableOptions = {}
): HtmlTableOutput {
  if (!Array.isArray(records)) {
    throw new ValidationError('Input records must be an array of objects.');
  }

  if (records.length === 0) {
    return generateHtmlTable({ rows: [] }, options);
  }

  // Extract unique column keys in order of appearance
  const keySet = new Set<string>();
  for (const item of records) {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach((k) => keySet.add(k));
    }
  }

  const keys = Array.from(keySet);
  const headers = keys.map((k) => ({ key: k, label: k }));

  const rows: TableCell[][] = records.map((rec) => {
    return keys.map((k) => {
      const val = rec[k];
      if (val === null || val === undefined || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        return val as TableCell;
      }
      return JSON.stringify(val);
    });
  });

  return generateHtmlTable({ headers, rows }, options);
}
