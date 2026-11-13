export type MermaidTheme = 'default' | 'forest' | 'dark' | 'neutral' | 'base';

export interface MermaidDiagramType {
  id: string;
  name: string;
  keyword: string;
  description: string;
  example: string;
}

export interface MermaidRenderOptions {
  theme?: MermaidTheme;
  securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
  fontFamily?: string;
  fontSize?: number;
  backgroundColor?: string;
  id?: string;
}

export interface MermaidSvgResult {
  svg: string;
  id: string;
  diagramType?: string;
}

export interface MermaidPngOptions extends MermaidRenderOptions {
  scale?: number; // default: 2
  width?: number;
  height?: number;
}
