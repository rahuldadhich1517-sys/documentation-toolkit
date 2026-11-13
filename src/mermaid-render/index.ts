import {
  MermaidDiagramType,
  MermaidRenderOptions,
  MermaidSvgResult,
  MermaidPngOptions,
} from './types';
import {
  isBrowser,
  ValidationResult,
  ValidationError,
  RenderError,
  BrowserError,
  svgToPngBlob,
} from '../shared';

export * from './types';

const DIAGRAM_TYPES: MermaidDiagramType[] = [
  {
    id: 'flowchart',
    name: 'Flowchart',
    keyword: 'flowchart',
    description: 'Directed and undirected node graphs representing workflows and logic paths.',
    example: 'flowchart TD\n    A[Start] --> B{Is it ready?}\n    B -- Yes --> C[Deploy]\n    B -- No --> D[Develop]',
  },
  {
    id: 'sequenceDiagram',
    name: 'Sequence Diagram',
    keyword: 'sequenceDiagram',
    description: 'Processes interacting over time with ordered request/response arrows.',
    example: 'sequenceDiagram\n    Client->>Server: HTTP Request\n    Server-->>Client: 200 OK',
  },
  {
    id: 'classDiagram',
    name: 'Class Diagram',
    keyword: 'classDiagram',
    description: 'Object-oriented structure showing classes, attributes, methods, and inheritance.',
    example: 'classDiagram\n    Animal <|-- Duck\n    Animal : +int age\n    Animal : +String gender\n    Duck : +swim()',
  },
  {
    id: 'stateDiagram',
    name: 'State Diagram',
    keyword: 'stateDiagram-v2',
    description: 'Finite state machine transitions and triggers.',
    example: 'stateDiagram-v2\n    [*] --> Idle\n    Idle --> Running : Start\n    Running --> [*] : Stop',
  },
  {
    id: 'erDiagram',
    name: 'Entity Relationship Diagram',
    keyword: 'erDiagram',
    description: 'Database entity models and relationships (one-to-one, one-to-many, etc.).',
    example: 'erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains',
  },
  {
    id: 'gantt',
    name: 'Gantt Chart',
    keyword: 'gantt',
    description: 'Project schedules, milestone timelines, and task dependencies.',
    example: 'gantt\n    title Sprint Plan\n    dateFormat YYYY-MM-DD\n    section Dev\n    Task 1: 2026-01-01, 7d',
  },
  {
    id: 'pie',
    name: 'Pie Chart',
    keyword: 'pie',
    description: 'Proportional slice charts for statistical breakdowns.',
    example: 'pie title Tech Stack\n    "TypeScript" : 60\n    "CSS" : 20\n    "HTML" : 20',
  },
  {
    id: 'gitGraph',
    name: 'Git Graph',
    keyword: 'gitGraph',
    description: 'Git branching, commits, tags, and merges visual graph.',
    example: 'gitGraph\n    commit\n    branch feature\n    checkout feature\n    commit\n    checkout main\n    merge feature',
  },
  {
    id: 'mindmap',
    name: 'Mindmap',
    keyword: 'mindmap',
    description: 'Hierarchical idea maps branching outward from a central concept.',
    example: 'mindmap\n  root((Documentation))\n    Markdown\n    Diagrams\n    Tables',
  },
];

const DEFAULT_OPTIONS: Required<Omit<MermaidRenderOptions, 'id' | 'backgroundColor'>> = {
  theme: 'default',
  securityLevel: 'strict',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 14,
};

async function getMermaidInstance() {
  if (!isBrowser()) {
    throw new BrowserError('Mermaid rendering requires a browser or DOM environment (window and document).');
  }

  // Dynamic import of mermaid to preserve zero-initial-load footprint
  const mermaidModule = await import('mermaid');
  return mermaidModule.default ?? mermaidModule;
}

export function getMermaidDiagramTypes(): MermaidDiagramType[] {
  return [...DIAGRAM_TYPES];
}

export function getMermaidRenderOptions(): MermaidRenderOptions {
  return { ...DEFAULT_OPTIONS };
}

export async function validateMermaidSource(source: string): Promise<ValidationResult<string>> {
  if (typeof source !== 'string' || !source.trim()) {
    return { valid: false, errors: ['Mermaid source diagram cannot be empty.'] };
  }

  try {
    const mermaid = await getMermaidInstance();
    const result = await mermaid.parse(source);
    if (result) {
      return { valid: true, data: source };
    }
    return { valid: false, errors: ['Mermaid source failed parsing validation.'] };
  } catch (err: any) {
    const message = err?.message || err?.str || String(err);
    return { valid: false, errors: [message] };
  }
}

let counter = 0;

export async function renderMermaidToSvg(
  source: string,
  options: MermaidRenderOptions = {}
): Promise<MermaidSvgResult> {
  if (typeof source !== 'string' || !source.trim()) {
    throw new ValidationError('Mermaid source diagram cannot be empty.');
  }

  const mermaid = await getMermaidInstance();

  const id = options.id ?? `mermaid-diagram-${Date.now()}-${++counter}`;
  const theme = options.theme ?? DEFAULT_OPTIONS.theme;
  const securityLevel = options.securityLevel ?? 'strict';
  const fontFamily = options.fontFamily ?? DEFAULT_OPTIONS.fontFamily;
  const fontSize = options.fontSize ?? DEFAULT_OPTIONS.fontSize;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel,
    theme,
    fontFamily,
    fontSize,
  });

  // Clean up any residual elements with the same ID before rendering
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  let renderResult: { svg: string };
  try {
    renderResult = await mermaid.render(id, source);
  } catch (err: any) {
    // Clean up temporary DOM element mermaid might leave behind on error
    const errEl = document.getElementById(id) || document.getElementById(`d${id}`);
    if (errEl) {
      errEl.remove();
    }
    const msg = err?.message || err?.str || String(err);
    throw new RenderError(`Mermaid rendering failed: ${msg}`, err);
  } finally {
    // Ensure temporary containers injected by Mermaid into body are cleaned up
    const residual = document.getElementById(id) || document.getElementById(`d${id}`);
    if (residual && residual.parentElement === document.body) {
      residual.remove();
    }
  }

  return {
    svg: renderResult.svg,
    id,
  };
}

export async function renderMermaidToPng(
  source: string,
  options: MermaidPngOptions = {}
): Promise<Blob> {
  const result = await renderMermaidToSvg(source, options);
  const svg = result.svg;

  // Extract dimensions from SVG viewBox or width/height
  let width = options.width;
  let height = options.height;

  if (!width || !height) {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch && viewBoxMatch[1]) {
      const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
      if (parts.length === 4 && !isNaN(parts[2]!) && !isNaN(parts[3]!)) {
        width = width ?? Math.round(parts[2]!);
        height = height ?? Math.round(parts[3]!);
      }
    }
  }

  if (!width || !height) {
    const widthMatch = svg.match(/width="([0-9.]+)(?:px)?"/);
    const heightMatch = svg.match(/height="([0-9.]+)(?:px)?"/);
    if (widthMatch && widthMatch[1]) width = width ?? Math.round(parseFloat(widthMatch[1]));
    if (heightMatch && heightMatch[1]) height = height ?? Math.round(parseFloat(heightMatch[1]));
  }

  // Fallbacks if SVG viewBox is omitted
  width = width ?? 800;
  height = height ?? 600;

  const scale = options.scale ?? 2;
  return svgToPngBlob(svg, width, height, scale);
}
