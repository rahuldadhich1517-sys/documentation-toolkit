import {
  MarkdownTableData,
  MarkdownTableOptions,
  ParsedMarkdownTable,
  TableAlignment,
  MarkdownTableCell,
} from './types';
import { escapeMarkdownTableCell, ValidationResult, ValidationError } from '../shared';

export * from './types';

function formatCellRaw(val: MarkdownTableCell): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return String(val);
}

function normalizeCell(val: MarkdownTableCell): string {
  const raw = formatCellRaw(val);
  return escapeMarkdownTableCell(raw);
}

function parseAlignment(delimiter: string): TableAlignment {
  const trimmed = delimiter.trim();
  const startsColon = trimmed.startsWith(':');
  const endsColon = trimmed.endsWith(':');

  if (startsColon && endsColon) return 'center';
  if (startsColon) return 'left';
  if (endsColon) return 'right';
  return 'none';
}

function makeDelimiter(align: TableAlignment, width = 3): string {
  switch (align) {
    case 'left': {
      const dashes = Math.max(3, width - 1);
      return `:${'-'.repeat(dashes)}`;
    }
    case 'center': {
      const dashes = Math.max(3, width - 2);
      return `:${'-'.repeat(dashes)}:`;
    }
    case 'right': {
      const dashes = Math.max(3, width - 1);
      return `${'-'.repeat(dashes)}:`;
    }
    default:
      return '-'.repeat(Math.max(3, width));
  }
}

/**
 * Splits a markdown table row by unescaped pipe characters '|'.
 */
function splitTableRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let escaped = false;

  const trimmed = row.trim();
  // Strip leading and trailing outer pipes if present
  let content = trimmed;
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|') && !content.endsWith('\\|')) content = content.slice(0, -1);

  for (let i = 0; i < content.length; i++) {
    const char = content[i]!;
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      current += char;
      escaped = true;
      continue;
    }

    if (char === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function parseMarkdownTable(markdown: string): ParsedMarkdownTable {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return {
      headers: [],
      alignments: [],
      rows: [],
      columnCount: 0,
      rowCount: 0,
    };
  }

  const lines = markdown
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.includes('|'));

  if (lines.length < 2) {
    // A valid table needs at least a header line and a delimiter line
    return {
      headers: lines[0] ? splitTableRow(lines[0]) : [],
      alignments: [],
      rows: [],
      columnCount: lines[0] ? splitTableRow(lines[0]).length : 0,
      rowCount: 0,
    };
  }

  const rawHeader = lines[0]!;
  const rawDelimiter = lines[1]!;
  const headers = splitTableRow(rawHeader);
  const delimiterCells = splitTableRow(rawDelimiter);

  const alignments: TableAlignment[] = delimiterCells.map(parseAlignment);
  const columnCount = Math.max(headers.length, alignments.length);

  // Normalize header length
  while (headers.length < columnCount) headers.push('');
  while (alignments.length < columnCount) alignments.push('none');

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i]!;
    const rowCells = splitTableRow(line);
    while (rowCells.length < columnCount) {
      rowCells.push('');
    }
    rows.push(rowCells.slice(0, columnCount));
  }

  return {
    headers,
    alignments,
    rows,
    columnCount,
    rowCount: rows.length,
  };
}

export function validateMarkdownTable(markdown: string): ValidationResult<ParsedMarkdownTable> {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return { valid: false, errors: ['Markdown table cannot be empty.'] };
  }

  const parsed = parseMarkdownTable(markdown);
  const errors: string[] = [];

  if (parsed.columnCount === 0) {
    errors.push('No columns detected in table.');
  }

  const lines = markdown
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    errors.push('Markdown table must contain at least a header row and a delimiter row.');
  } else {
    // Check delimiter row format
    const delimiterRow = lines[1]!;
    const delims = splitTableRow(delimiterRow);
    const validDelim = delims.every((d) => /^:?-+:?$/.test(d.trim()));
    if (!validDelim) {
      errors.push('Second row must be a valid Markdown table delimiter row (e.g. | --- | :---: |).');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: parsed };
}

export function generateMarkdownTable(
  data: MarkdownTableData,
  options: MarkdownTableOptions = {}
): string {
  if (!data || !Array.isArray(data.rows)) {
    throw new ValidationError('Table data must contain a "rows" array.');
  }

  const headers = (data.headers ?? []).map(normalizeCell);
  const rawRows = data.rows.map((row) => (Array.isArray(row) ? row.map(normalizeCell) : []));

  let colCount = headers.length;
  for (const r of rawRows) {
    if (r.length > colCount) colCount = r.length;
  }

  if (colCount === 0) return '';

  while (headers.length < colCount) {
    headers.push(`Column ${headers.length + 1}`);
  }

  const rows = rawRows.map((r) => {
    const filled = [...r];
    while (filled.length < colCount) filled.push('');
    return filled;
  });

  // Resolve alignments
  const alignments: TableAlignment[] = [];
  for (let c = 0; c < colCount; c++) {
    if (Array.isArray(options.align)) {
      alignments.push(options.align[c] ?? 'none');
    } else if (typeof options.align === 'string') {
      alignments.push(options.align);
    } else if (data.alignments && data.alignments[c]) {
      alignments.push(data.alignments[c]!);
    } else {
      alignments.push('none');
    }
  }

  if (options.compact) {
    const headerLine = `|${headers.join('|')}|`;
    const delimLine = `|${alignments.map((a) => makeDelimiter(a, 3)).join('|')}|`;
    const rowLines = rows.map((r) => `|${r.join('|')}|`);
    return [headerLine, delimLine, ...rowLines].join('\n') + '\n';
  }

  // Calculate column widths for aligned formatting
  const colWidths = new Array(colCount).fill(options.minColWidth ?? 3);
  for (let c = 0; c < colCount; c++) {
    colWidths[c] = Math.max(colWidths[c], headers[c]!.length);
    for (const r of rows) {
      colWidths[c] = Math.max(colWidths[c], r[c]!.length);
    }
  }

  const padCell = (content: string, width: number, align: TableAlignment): string => {
    const totalSpaces = Math.max(0, width - content.length);
    switch (align) {
      case 'right':
        return ' '.repeat(totalSpaces) + content;
      case 'center': {
        const left = Math.floor(totalSpaces / 2);
        const right = totalSpaces - left;
        return ' '.repeat(left) + content + ' '.repeat(right);
      }
      default:
        return content + ' '.repeat(totalSpaces);
    }
  };

  const headerLine = `| ${headers.map((h, i) => padCell(h, colWidths[i]!, alignments[i]!)).join(' | ')} |`;
  const delimLine = `| ${alignments.map((a, i) => makeDelimiter(a, colWidths[i]!)).join(' | ')} |`;
  const rowLines = rows.map(
    (r) => `| ${r.map((cell, i) => padCell(cell, colWidths[i]!, alignments[i]!)).join(' | ')} |`
  );

  return [headerLine, delimLine, ...rowLines].join('\n') + '\n';
}

export function formatMarkdownTable(tableMarkdown: string, options: MarkdownTableOptions = {}): string {
  const parsed = parseMarkdownTable(tableMarkdown);
  if (parsed.columnCount === 0) return tableMarkdown;

  return generateMarkdownTable(
    {
      headers: parsed.headers,
      rows: parsed.rows,
      alignments: parsed.alignments,
    },
    options
  );
}

export function alignMarkdownTable(tableMarkdown: string, alignments: TableAlignment[]): string {
  const parsed = parseMarkdownTable(tableMarkdown);
  if (parsed.columnCount === 0) return tableMarkdown;

  return generateMarkdownTable(
    {
      headers: parsed.headers,
      rows: parsed.rows,
      alignments,
    },
    { align: alignments }
  );
}
