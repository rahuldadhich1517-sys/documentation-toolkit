/**
 * Browser-specific utilities (Blob, Canvas, Download, DOM checks).
 */

import { BrowserError, RenderError } from './errors';

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function hasCanvas(): boolean {
  return isBrowser() && typeof document.createElement('canvas').getContext === 'function';
}

export function hasBlob(): boolean {
  return typeof Blob !== 'undefined' && typeof URL !== 'undefined';
}

/**
 * Triggers a client-side file download for a given Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (!isBrowser()) {
    throw new BrowserError('downloadBlob requires a browser environment with window and document.');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  link.style.display = 'none';

  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    // Revoke URL after a short delay to allow browser to complete download
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Converts an SVG string into a Base64 data URL.
 */
export function svgToDataUrl(svg: string): string {
  if (typeof svg !== 'string') return '';
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Rasterizes an SVG string to a PNG Blob using HTML5 Canvas in the browser.
 */
export async function svgToPngBlob(
  svg: string,
  width: number,
  height: number,
  scale = 2
): Promise<Blob> {
  if (!isBrowser()) {
    throw new BrowserError('svgToPngBlob requires a browser environment with Canvas support.');
  }

  const canvas = document.createElement('canvas');
  const dpr = Math.max(1, scale);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new RenderError('Failed to get 2D context from canvas.');
  }

  ctx.scale(dpr, dpr);

  const dataUrl = svgToDataUrl(svg);
  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new RenderError('Canvas toBlob() returned null. Failed to generate PNG.'));
            return;
          }
          resolve(blob);
        }, 'image/png');
      } catch (err) {
        reject(new RenderError('Failed drawing SVG to canvas: ' + String(err), err));
      }
    };

    img.onerror = (_event, _source, _lineno, _colno, error) => {
      reject(new RenderError('Failed loading SVG into image element for PNG rasterization.', error));
    };

    img.src = dataUrl;
  });
}
