export type CellAlign = 'left' | 'center' | 'right';

export interface ColumnDefinition {
  key: string;
  label?: string;
  align?: CellAlign;
  width?: string;
  className?: string;
}

export type TableCell = string | number | boolean | null | undefined;

export interface TableData {
  headers?: (string | ColumnDefinition)[];
  rows: TableCell[][];
  footers?: TableCell[];
  caption?: string;
}

export interface HtmlTablePreset {
  id: string;
  name: string;
  description: string;
  options: Partial<HtmlTableOptions>;
}

export interface HtmlTableOptions {
  className?: string;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  compact?: boolean;
  responsive?: boolean;
  emptyMessage?: string;
  caption?: string;
  ariaLabel?: string;
  includeStyles?: boolean;
  alignments?: CellAlign[];
  limitRows?: number;
}

export interface HtmlTableOutput {
  html: string;
  css: string;
  totalRows: number;
  totalColumns: number;
}
