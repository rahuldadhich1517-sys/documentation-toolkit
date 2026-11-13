export interface MarkdownRenderOptions {
  gfm?: boolean;
  breaks?: boolean;
  pedantic?: boolean;
  sanitize?: boolean;
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowedSchemes?: string[];
}

export interface MarkdownRenderResult {
  html: string;
  sanitized: boolean;
  characterCount: number;
}
