import {
  CodeToSvgOptions,
  CodeToImageOptions,
  DownloadCodeImageOptions,
  CodeDimensions,
  CodeImageTheme,
} from './types';
import { THEMES } from './themes';
import { tokenizeCode } from './tokenizer';
import {
  escapeSvg,
  validateDimensions,
  svgToPngBlob,
  downloadBlob,
  ValidationError,
} from '../shared';

export * from './types';
export * from './themes';
export { tokenizeCode };

const DEFAULT_FONT_FAMILY =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

function resolveTheme(themeInput?: string | CodeImageTheme): CodeImageTheme {
  if (typeof themeInput === 'object' && themeInput !== null && 'tokens' in themeInput) {
    return themeInput;
  }
  if (typeof themeInput === 'string' && THEMES[themeInput]) {
    return THEMES[themeInput]!;
  }
  return THEMES['github-dark']!;
}

export function getCodeImageDimensions(options: CodeToSvgOptions): CodeDimensions {
  if (typeof options?.code !== 'string') {
    throw new ValidationError('options.code must be a string.');
  }

  const lines = options.code.split(/\r?\n/);
  const lineCount = Math.max(1, lines.length);
  const fontSize = options.fontSize ?? 14;
  const lineHeight = options.lineHeight ?? Math.round(fontSize * 1.55);
  const padding = options.padding ?? 32;

  const showHeader =
    options.showWindowControls !== false || !!options.filename || !!options.title || !!options.language;
  const headerHeight = showHeader ? 46 : 0;

  const contentHeight = lineCount * lineHeight;
  const totalHeight = contentHeight + headerHeight + padding * 2;
  const totalWidth = options.width ?? 800;

  validateDimensions(totalWidth, totalHeight, { minWidth: 200, maxWidth: 4000, minHeight: 80, maxHeight: 10000 });

  return {
    width: totalWidth,
    height: totalHeight,
    contentHeight,
    lineCount,
  };
}

export function renderCodeToSvg(options: CodeToSvgOptions): string {
  if (typeof options?.code !== 'string') {
    throw new ValidationError('options.code must be a string.');
  }

  const theme = resolveTheme(options.theme);
  const dims = getCodeImageDimensions(options);
  const { width, height } = dims;

  const fontSize = options.fontSize ?? 14;
  const lineHeight = options.lineHeight ?? Math.round(fontSize * 1.55);
  const padding = options.padding ?? 32;
  const fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  const showLineNumbers = options.showLineNumbers !== false;
  const startLine = options.startLineNumber ?? 1;
  const highlightSet = new Set(options.highlightLines ?? []);
  const windowStyle = options.windowStyle ?? 'mac';
  const showHeader =
    options.showWindowControls !== false || !!options.filename || !!options.title || !!options.language;
  const headerHeight = showHeader ? 46 : 0;

  // Window bounds
  const winX = padding;
  const winY = padding;
  const winW = width - padding * 2;
  const winH = height - padding * 2;
  const borderRadius = 10;

  const tokenLines = tokenizeCode(options.code, options.language);
  const maxLineDigits = String(startLine + tokenLines.length - 1).length;
  const charWidthEst = fontSize * 0.6;
  const lineNumberGutterWidth = showLineNumbers ? Math.max(28, (maxLineDigits + 1) * charWidthEst + 12) : 0;

  const codeStartX = winX + 20 + lineNumberGutterWidth;
  const codeStartY = winY + headerHeight + 24;

  const svgParts: string[] = [];

  // SVG Root
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`
  );

  // Embedded CSS
  svgParts.push(`  <style>
    .code-text {
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: ${lineHeight}px;
      dominant-baseline: central;
      white-space: pre;
    }
    .header-text {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      fill: ${theme.textColor};
      opacity: 0.8;
      dominant-baseline: central;
    }
    .line-number {
      font-family: ${fontFamily};
      font-size: ${Math.max(10, fontSize - 2)}px;
      fill: ${theme.lineNumberColor};
      text-anchor: end;
      user-select: none;
      dominant-baseline: central;
    }
  </style>`);

  // Outer Canvas Background
  if (!options.transparentBackground) {
    svgParts.push(`  <rect width="${width}" height="${height}" fill="${theme.background}" />`);
  }

  // Window Card Background
  const borderColorAttr = theme.borderColor ? ` stroke="${theme.borderColor}" stroke-width="1"` : '';
  svgParts.push(
    `  <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="${borderRadius}" ry="${borderRadius}" fill="${theme.windowBackground}"${borderColorAttr} />`
  );

  // Header Bar
  if (showHeader) {
    svgParts.push(
      `  <line x1="${winX}" y1="${winY + headerHeight}" x2="${winX + winW}" y2="${winY + headerHeight}" stroke="${theme.borderColor || 'rgba(128,128,128,0.2)'}" stroke-width="1" />`
    );

    // Window controls
    if (options.showWindowControls !== false) {
      if (windowStyle === 'mac') {
        const ctrlY = winY + Math.round(headerHeight / 2);
        svgParts.push(`  <circle cx="${winX + 20}" cy="${ctrlY}" r="6" fill="#ff5f56" />`);
        svgParts.push(`  <circle cx="${winX + 40}" cy="${ctrlY}" r="6" fill="#ffbd2e" />`);
        svgParts.push(`  <circle cx="${winX + 60}" cy="${ctrlY}" r="6" fill="#27c93f" />`);
      }
    }

    // Title or Filename
    const titleText = options.filename ?? options.title ?? '';
    if (titleText) {
      const titleX = winX + Math.round(winW / 2);
      const titleY = winY + Math.round(headerHeight / 2);
      svgParts.push(
        `  <text x="${titleX}" y="${titleY}" text-anchor="middle" class="header-text">${escapeSvg(titleText)}</text>`
      );
    }

    // Language label
    if (options.language) {
      const langX = winX + winW - 20;
      const langY = winY + Math.round(headerHeight / 2);
      svgParts.push(
        `  <text x="${langX}" y="${langY}" text-anchor="end" class="header-text">${escapeSvg(options.language.toUpperCase())}</text>`
      );
    }
  }

  // Render Lines
  for (let idx = 0; idx < tokenLines.length; idx++) {
    const lineNum = startLine + idx;
    const tokens = tokenLines[idx]!;
    const lineY = codeStartY + idx * lineHeight;
    const isHighlighted = highlightSet.has(lineNum);

    // Line Highlight Background
    if (isHighlighted) {
      svgParts.push(
        `  <rect x="${winX}" y="${lineY - Math.round(lineHeight / 2)}" width="${winW}" height="${lineHeight}" fill="${theme.highlightLineBackground}" />`
      );
    }

    // Line Number
    if (showLineNumbers) {
      const numX = codeStartX - 14;
      svgParts.push(`  <text x="${numX}" y="${lineY}" class="line-number">${lineNum}</text>`);
    }

    // Code Tokens
    svgParts.push(
      `  <text x="${codeStartX}" y="${lineY}" class="code-text" xml:space="preserve">`
    );

    let tspanLine = '';
    for (const token of tokens) {
      const tokenColor = (theme.tokens as Record<string, string>)[token.type] ?? theme.textColor;
      const safeVal = escapeSvg(token.value);
      tspanLine += `<tspan fill="${tokenColor}">${safeVal}</tspan>`;
    }
    svgParts.push(`    ${tspanLine}`);
    svgParts.push('  </text>');
  }

  svgParts.push('</svg>');
  return svgParts.join('\n');
}

export async function renderCodeToImage(options: CodeToImageOptions): Promise<Blob> {
  const svg = renderCodeToSvg(options);
  const dims = getCodeImageDimensions(options);
  const scale = options.scale ?? 2;

  return svgToPngBlob(svg, dims.width, dims.height, scale);
}

export async function downloadCodeImage(options: DownloadCodeImageOptions): Promise<void> {
  const format = options.format ?? 'png';
  const filename = options.filename ?? `code-snippet.${format}`;

  if (format === 'svg') {
    const svg = renderCodeToSvg(options);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, filename);
    return;
  }

  const pngBlob = await renderCodeToImage(options);
  downloadBlob(pngBlob, filename);
}
