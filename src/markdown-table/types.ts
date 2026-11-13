export type TableAlignment = 'left' | 'center' | 'right' | 'none';

export type MarkdownTableCell = string | number | boolean | null | undefined;

export interface MarkdownTableData {
  headers?: MarkdownTableCell[];
  rows: MarkdownTableCell[][];
  alignments?: TableAlignment[];
}

export interface MarkdownTableOptions {
  align?: TableAlignment | TableAlignment[];
  compact?: boolean;
  padding?: boolean;
  minColWidth?: number;
}

export interface ParsedMarkdownTable {
  headers: string[];
  alignments: TableAlignment[];
  rows: string[][];
  columnCount: number;
  rowCount: number;
}
