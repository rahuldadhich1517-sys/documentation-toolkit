export interface CodeImageTheme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  background: string;
  windowBackground: string;
  borderColor?: string;
  textColor: string;
  lineNumberColor: string;
  highlightLineBackground: string;
  tokens: {
    keyword: string;
    string: string;
    comment: string;
    number: string;
    function: string;
    operator: string;
    punctuation: string;
    variable: string;
    type: string;
    tag: string;
    attribute: string;
  };
}

export interface CodeToSvgOptions {
  code: string;
  language?: string;
  title?: string;
  filename?: string;
  theme?: string | CodeImageTheme;
  fontSize?: number; // default: 14
  lineHeight?: number; // default: 22
  fontFamily?: string;
  width?: number; // default: 800
  padding?: number; // default: 32
  showLineNumbers?: boolean; // default: true
  startLineNumber?: number; // default: 1
  highlightLines?: number[];
  showWindowControls?: boolean; // default: true
  windowStyle?: 'mac' | 'windows' | 'none';
  transparentBackground?: boolean;
  dropShadow?: boolean;
}

export interface CodeToImageOptions extends CodeToSvgOptions {
  scale?: number; // default: 2 (retina)
}

export interface DownloadCodeImageOptions extends CodeToImageOptions {
  filename?: string;
  format?: 'png' | 'svg';
}

export interface CodeDimensions {
  width: number;
  height: number;
  contentHeight: number;
  lineCount: number;
}
