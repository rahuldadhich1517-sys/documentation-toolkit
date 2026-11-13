/**
 * Validation utilities
 */

import { ValidationError } from './errors';

export type ValidationResult<T> =
  | { readonly valid: true; readonly data: T; readonly errors?: never }
  | { readonly valid: false; readonly errors: string[]; readonly data?: never };

export function isSafeUrl(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();

  // Allow relative paths, hash anchors, and protocol-relative URLs
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }

  // Reject dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    // If it doesn't parse as an absolute URL, check if it's a relative path with no protocol
    return !/^[a-z0-9+.-]+:/i.test(trimmed);
  }
}

export function sanitizeUrl(url: string, fallback = '#'): string {
  if (isSafeUrl(url)) {
    return url.trim();
  }
  return fallback;
}

export interface DimensionLimits {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function validateDimensions(
  width: number,
  height: number,
  limits: DimensionLimits = { minWidth: 50, maxWidth: 4000, minHeight: 50, maxHeight: 8000 }
): void {
  if (typeof width !== 'number' || isNaN(width) || width <= 0) {
    throw new ValidationError(`Invalid width: ${width}. Must be a positive number.`);
  }
  if (typeof height !== 'number' || isNaN(height) || height <= 0) {
    throw new ValidationError(`Invalid height: ${height}. Must be a positive number.`);
  }

  if (limits.minWidth !== undefined && width < limits.minWidth) {
    throw new ValidationError(`Width ${width}px is below minimum allowed ${limits.minWidth}px.`);
  }
  if (limits.maxWidth !== undefined && width > limits.maxWidth) {
    throw new ValidationError(`Width ${width}px exceeds maximum allowed ${limits.maxWidth}px.`);
  }
  if (limits.minHeight !== undefined && height < limits.minHeight) {
    throw new ValidationError(`Height ${height}px is below minimum allowed ${limits.minHeight}px.`);
  }
  if (limits.maxHeight !== undefined && height > limits.maxHeight) {
    throw new ValidationError(`Height ${height}px exceeds maximum allowed ${limits.maxHeight}px.`);
  }
}

export function normalizeText(text: string): string {
  if (typeof text !== 'string') return '';
  return text.normalize('NFC').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
