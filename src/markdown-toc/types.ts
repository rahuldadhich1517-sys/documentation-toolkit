import { SlugOptions } from '../shared';

export interface MarkdownHeading {
  level: number;
  text: string;
  raw: string;
  slug: string;
  line: number;
}

export interface ExtractHeadingsOptions {
  minDepth?: number;
  maxDepth?: number;
  exclude?: (string | RegExp)[];
  slugOptions?: SlugOptions;
}

export interface MarkdownTocOptions extends ExtractHeadingsOptions {
  title?: string;
  ordered?: boolean;
  indent?: number; // default: 2
  includeAnchorLinks?: boolean; // default: true
}

export interface MarkdownTocResult {
  tocMarkdown: string;
  headings: MarkdownHeading[];
  count: number;
}

export interface UpdateTocOptions extends MarkdownTocOptions {
  startMarker?: string; // default: '<!-- toc -->'
  endMarker?: string; // default: '<!-- /toc -->'
}
