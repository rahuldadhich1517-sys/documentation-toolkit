import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'code-to-image/index': 'src/code-to-image/index.ts',
    'readme-generate/index': 'src/readme-generate/index.ts',
    'html-table-generate/index': 'src/html-table-generate/index.ts',
    'markdown-edit/index': 'src/markdown-edit/index.ts',
    'markdown-table/index': 'src/markdown-table/index.ts',
    'markdown-toc/index': 'src/markdown-toc/index.ts',
    'mermaid-render/index': 'src/mermaid-render/index.ts',
    'license-generate/index': 'src/license-generate/index.ts',
    'readme-badge/index': 'src/readme-badge/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['mermaid', 'dompurify', 'marked'],
});
