export type ReadmeSectionKey =
  | 'header'
  | 'badges'
  | 'toc'
  | 'description'
  | 'features'
  | 'techStack'
  | 'installation'
  | 'usage'
  | 'configuration'
  | 'envVariables'
  | 'api'
  | 'projectStructure'
  | 'scripts'
  | 'contributing'
  | 'license'
  | 'author'
  | 'links';

export interface TechStackItem {
  name: string;
  url?: string;
  version?: string;
}

export interface ScriptItem {
  name: string;
  description: string;
  command?: string;
}

export interface EnvVariableItem {
  name: string;
  description: string;
  default?: string;
  required?: boolean;
}

export interface ReadmeBadgeItem {
  label: string;
  image: string;
  url?: string;
}

export interface ReadmeMetadata {
  projectName: string;
  description?: string;
  installation?: string;
  usage?: string;
  features?: string[];
  techStack?: (string | TechStackItem)[];
  scripts?: ScriptItem[];
  envVariables?: EnvVariableItem[];
  configuration?: string;
  api?: string;
  projectStructure?: string;
  contributing?: string;
  license?: string;
  author?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  demoUrl?: string;
  badges?: ReadmeBadgeItem[];
}

export type ReadmeTemplateId = 'minimal' | 'standard' | 'comprehensive';

export interface ReadmeTemplate {
  id: ReadmeTemplateId;
  name: string;
  description: string;
  defaultSections: ReadmeSectionKey[];
}

export interface ReadmeGenerateOptions {
  template?: ReadmeTemplateId;
  sectionOrder?: ReadmeSectionKey[];
  includeToc?: boolean;
  tocTitle?: string;
  headingLevelOffset?: number;
}

export type ReadmeConfig = ReadmeMetadata & {
  options?: ReadmeGenerateOptions;
};
