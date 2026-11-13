/**
 * Escape utilities for HTML, SVG, and Markdown.
 */

const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_ESCAPE_REGEX = /[&<>"']/g;

export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(HTML_ESCAPE_REGEX, (match) => HTML_ESCAPE_LOOKUP[match] ?? match);
}

export function escapeSvg(str: string): string {
  return escapeHtml(str);
}

export function escapeMarkdown(str: string): string {
  if (typeof str !== 'string') return '';
  // Escape markdown characters that could trigger syntax parsing
  return str.replace(/([\\`*_{}[\]()#+\-.!|~>])/g, '\\$1');
}

export function escapeMarkdownTableCell(str: string): string {
  if (typeof str !== 'string') return '';
  // In table cells, pipes must be escaped and newlines converted to <br /> or spaces
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br />');
}

export function unescapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
