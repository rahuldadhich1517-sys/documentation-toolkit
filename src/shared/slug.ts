/**
 * Heading slug generation conforming to GitHub-flavored Markdown conventions.
 */

export interface SlugOptions {
  lowercase?: boolean;
  preserveUnicode?: boolean;
}

/**
 * Generates a GitHub-compatible anchor slug from heading text.
 * - Removes HTML tags
 * - Converts to lowercase (configurable)
 * - Removes punctuation characters except spaces, hyphens, and word characters
 * - Replaces consecutive whitespace with a single hyphen
 * - Preserves Unicode alphanumeric characters
 */
export function generateHeadingSlug(headingText: string, options: SlugOptions = {}): string {
  if (typeof headingText !== 'string') return '';

  const { lowercase = true } = options;

  let text = headingText.trim();

  // Strip inline HTML tags (e.g. <code>foo</code> -> foo, <a href="...">bar</a> -> bar)
  text = text.replace(/<[^>]+>/g, '');

  // Strip Markdown links [text](url) -> text, inline code `code` -> code, formatting **bold** -> bold
  text = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '');

  if (lowercase) {
    text = text.toLowerCase();
  }

  // Remove punctuation while preserving Unicode letters, digits, whitespace, and hyphens
  // Punctuation characters to remove: ! " # $ % & ' ( ) * + , . / : ; < = > ? @ [ \ ] ^ ` { | } ~
  text = text.replace(/[^\p{L}\p{N}\s\-]/gu, '');

  // Replace whitespace with hyphens
  text = text.trim().replace(/\s+/g, '-');

  // Collapse multiple hyphens
  text = text.replace(/-+/g, '-');

  return text;
}

/**
 * Tracks slugs within a document to generate unique slugs (e.g. slug, slug-1, slug-2).
 */
export class SlugTracker {
  private readonly counts = new Map<string, number>();

  public getUniqueSlug(rawText: string, options?: SlugOptions): string {
    const baseSlug = generateHeadingSlug(rawText, options) || 'heading';
    const currentCount = this.counts.get(baseSlug) ?? 0;
    this.counts.set(baseSlug, currentCount + 1);

    if (currentCount === 0) {
      return baseSlug;
    }
    return `${baseSlug}-${currentCount}`;
  }

  public reset(): void {
    this.counts.clear();
  }
}
