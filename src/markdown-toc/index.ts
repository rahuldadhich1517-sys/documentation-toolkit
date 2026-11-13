import {
  MarkdownHeading,
  ExtractHeadingsOptions,
  MarkdownTocOptions,
  MarkdownTocResult,
  UpdateTocOptions,
} from './types';
import { generateHeadingSlug, SlugTracker } from '../shared';

export * from './types';
export { generateHeadingSlug };

function isExcluded(text: string, excludeList?: (string | RegExp)[]): boolean {
  if (!excludeList || excludeList.length === 0) return false;
  return excludeList.some((item) => {
    if (typeof item === 'string') {
      return text.toLowerCase() === item.toLowerCase();
    }
    return item.test(text);
  });
}

function cleanHeadingDisplay(rawText: string): string {
  // Strip outer formatting for visual display in TOC while keeping clean text
  return rawText
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .trim();
}

export function extractMarkdownHeadings(
  markdown: string,
  options: ExtractHeadingsOptions = {}
): MarkdownHeading[] {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return [];
  }

  const { minDepth = 1, maxDepth = 6, exclude, slugOptions } = options;
  const lines = markdown.split(/\r?\n/);
  const headings: MarkdownHeading[] = [];
  const tracker = new SlugTracker();

  let inCodeBlock = false;
  let codeFenceChar = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Check for fenced code block start/end
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      const fence = fenceMatch[1]!;
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeFenceChar = fence[0]!;
      } else if (fence.startsWith(codeFenceChar)) {
        inCodeBlock = false;
        codeFenceChar = '';
      }
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    // ATX headings: # Heading
    const atxMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
    if (atxMatch) {
      const level = atxMatch[1]!.length;
      const rawHeading = atxMatch[2]!.trim();
      const text = cleanHeadingDisplay(rawHeading);

      if (level >= minDepth && level <= maxDepth && !isExcluded(text, exclude)) {
        const slug = tracker.getUniqueSlug(rawHeading, slugOptions);
        headings.push({
          level,
          text,
          raw: rawHeading,
          slug,
          line: i + 1,
        });
      }
      continue;
    }

    // Setext headings:
    // Heading 1
    // ===
    // Heading 2
    // ---
    if (i < lines.length - 1 && trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('>')) {
      const nextLine = lines[i + 1]!.trim();
      let level = 0;
      if (/^={3,}$/.test(nextLine)) {
        level = 1;
      } else if (/^-{3,}$/.test(nextLine)) {
        level = 2;
      }

      if (level > 0) {
        const rawHeading = trimmed;
        const text = cleanHeadingDisplay(rawHeading);
        if (level >= minDepth && level <= maxDepth && !isExcluded(text, exclude)) {
          const slug = tracker.getUniqueSlug(rawHeading, slugOptions);
          headings.push({
            level,
            text,
            raw: rawHeading,
            slug,
            line: i + 1,
          });
        }
        i++; // skip next line
        continue;
      }
    }
  }

  return headings;
}

export function generateMarkdownToc(
  markdown: string,
  options: MarkdownTocOptions = {}
): MarkdownTocResult {
  const headings = extractMarkdownHeadings(markdown, options);
  if (headings.length === 0) {
    return {
      tocMarkdown: '',
      headings: [],
      count: 0,
    };
  }

  const {
    title,
    ordered = false,
    indent = 2,
    includeAnchorLinks = true,
  } = options;

  // Determine baseline heading level to normalize indentation
  let minLevel = 6;
  for (const h of headings) {
    if (h.level < minLevel) minLevel = h.level;
  }

  const indentStr = ' '.repeat(Math.max(1, indent));
  const lines: string[] = [];

  if (title) {
    lines.push(`## ${title}\n`);
  }

  const counters: number[] = [0, 0, 0, 0, 0, 0, 0];

  for (const h of headings) {
    const depth = Math.max(0, h.level - minLevel);
    const prefix = indentStr.repeat(depth);

    let listBullet: string;
    if (ordered) {
      counters[h.level] = (counters[h.level] ?? 0) + 1;
      // Reset deeper level counters
      for (let d = h.level + 1; d <= 6; d++) {
        counters[d] = 0;
      }
      listBullet = `${counters[h.level]}.`;
    } else {
      listBullet = '-';
    }

    const itemText = includeAnchorLinks ? `[${h.text}](#${h.slug})` : h.text;
    lines.push(`${prefix}${listBullet} ${itemText}`);
  }

  return {
    tocMarkdown: lines.join('\n') + '\n',
    headings,
    count: headings.length,
  };
}

export function updateMarkdownToc(
  markdown: string,
  options: UpdateTocOptions = {}
): string {
  if (typeof markdown !== 'string') return '';

  const startMarker = options.startMarker ?? '<!-- toc -->';
  const endMarker = options.endMarker ?? '<!-- /toc -->';

  const startIndex = markdown.indexOf(startMarker);
  const endIndex = markdown.indexOf(endMarker);

  const { tocMarkdown } = generateMarkdownToc(markdown, options);
  const replacement = `${startMarker}\n${tocMarkdown.trim()}\n${endMarker}`;

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = markdown.slice(0, startIndex);
    const after = markdown.slice(endIndex + endMarker.length);
    return `${before}${replacement}${after}`;
  }

  // Also support self-closing <!-- generated-toc -->
  const singleMarker = '<!-- generated-toc -->';
  const singleIndex = markdown.indexOf(singleMarker);
  if (singleIndex !== -1) {
    const before = markdown.slice(0, singleIndex);
    const after = markdown.slice(singleIndex + singleMarker.length);
    return `${before}${startMarker}\n${tocMarkdown.trim()}\n${endMarker}${after}`;
  }

  // Prepend to top if no markers found
  return `${replacement}\n\n${markdown}`;
}
