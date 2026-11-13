import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { MarkdownRenderOptions } from './types';
import { ValidationResult, ValidationError } from '../shared';

export * from './types';

const DEFAULT_OPTIONS: Required<MarkdownRenderOptions> = {
  gfm: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  allowHtml: false,
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'blockquote', 'pre', 'code',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'strong', 'b', 'em', 'i', 'del', 's', 'strike',
    'a', 'img',
    'span', 'div',
    'input', // For GFM task list checkboxes
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    th: ['align', 'scope'],
    td: ['align'],
    input: ['type', 'checked', 'disabled'],
    code: ['class'],
    span: ['class'],
    div: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

export function getMarkdownOptions(): MarkdownRenderOptions {
  return { ...DEFAULT_OPTIONS };
}

export function validateMarkdownInput(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') {
    return { valid: false, errors: ['Markdown input must be a string.'] };
  }
  return { valid: true, data: input };
}

/**
 * Sanitizes an HTML string using DOMPurify with secure defaults.
 */
function sanitizeHtmlOutput(html: string, options: MarkdownRenderOptions): string {
  const allowedTags = options.allowedTags ?? DEFAULT_OPTIONS.allowedTags;
  const allowedSchemes = (options.allowedSchemes ?? DEFAULT_OPTIONS.allowedSchemes).join('|');

  // DOMPurify setup
  // In browser or environments with window (happy-dom/jsdom)
  const purifyInstance = typeof window !== 'undefined'
    ? DOMPurify
    : (DOMPurify as any)(typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined);

  if (!purifyInstance || typeof purifyInstance.sanitize !== 'function') {
    // Basic fallback regex strip if no DOM environment exists (e.g. pure Node without DOM)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:[^"'\s)]*/gi, '');
  }

  const sanitized = purifyInstance.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'align', 'scope',
      'type', 'checked', 'disabled',
      'class', 'id',
    ],
    ALLOWED_URI_REGEXP: new RegExp(
      `^(?:(?:${allowedSchemes}):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))`,
      'i'
    ),
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'base', 'form', 'textarea'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
  });

  return String(sanitized);
}

export function renderMarkdown(markdown: string, options: MarkdownRenderOptions = {}): string {
  const validation = validateMarkdownInput(markdown);
  if (!validation.valid) {
    throw new ValidationError('Invalid markdown input: ' + validation.errors.join('; '), validation.errors);
  }

  const merged = { ...DEFAULT_OPTIONS, ...options };

  // Parse markdown with marked synchronously
  const rawHtml = marked.parse(validation.data, {
    gfm: merged.gfm,
    breaks: merged.breaks,
    pedantic: merged.pedantic,
    async: false,
  }) as string;

  if (merged.sanitize) {
    return sanitizeHtmlOutput(rawHtml, merged);
  }

  return rawHtml;
}
