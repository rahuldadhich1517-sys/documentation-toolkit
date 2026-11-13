import {
  ReadmeMetadata,
  ReadmeGenerateOptions,
  ReadmeTemplate,
  ReadmeConfig,
  TechStackItem,
} from './types';
import { ValidationResult, isSafeUrl, sanitizeUrl, ValidationError } from '../shared';

export * from './types';

const TEMPLATES: Record<string, ReadmeTemplate> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and compact README focusing on installation and basic usage.',
    defaultSections: ['header', 'description', 'installation', 'usage', 'license'],
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced README for open-source libraries and web tools.',
    defaultSections: [
      'header',
      'badges',
      'description',
      'features',
      'installation',
      'usage',
      'scripts',
      'contributing',
      'license',
      'author',
    ],
  },
  comprehensive: {
    id: 'comprehensive',
    name: 'Comprehensive',
    description: 'Full-featured enterprise documentation README with architecture and API details.',
    defaultSections: [
      'header',
      'badges',
      'description',
      'toc',
      'features',
      'techStack',
      'installation',
      'usage',
      'configuration',
      'envVariables',
      'api',
      'projectStructure',
      'scripts',
      'contributing',
      'links',
      'license',
      'author',
    ],
  },
};

export function getReadmeTemplates(): ReadmeTemplate[] {
  return Object.values(TEMPLATES);
}

export function validateReadmeMetadata(input: unknown): ValidationResult<ReadmeMetadata> {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Metadata must be a non-null object.'] };
  }

  const data = input as Record<string, unknown>;

  if (typeof data.projectName !== 'string' || !data.projectName.trim()) {
    errors.push('projectName is required and must be a non-empty string.');
  }

  if (data.repositoryUrl && typeof data.repositoryUrl === 'string' && !isSafeUrl(data.repositoryUrl)) {
    errors.push('repositoryUrl must be a valid, safe URL.');
  }
  if (data.documentationUrl && typeof data.documentationUrl === 'string' && !isSafeUrl(data.documentationUrl)) {
    errors.push('documentationUrl must be a valid, safe URL.');
  }
  if (data.demoUrl && typeof data.demoUrl === 'string' && !isSafeUrl(data.demoUrl)) {
    errors.push('demoUrl must be a valid, safe URL.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      projectName: (data.projectName as string).trim(),
      description: typeof data.description === 'string' ? data.description.trim() : undefined,
      installation: typeof data.installation === 'string' ? data.installation.trim() : undefined,
      usage: typeof data.usage === 'string' ? data.usage.trim() : undefined,
      features: Array.isArray(data.features)
        ? data.features.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
        : undefined,
      techStack: Array.isArray(data.techStack)
        ? (data.techStack as (string | TechStackItem)[])
        : undefined,
      scripts: Array.isArray(data.scripts) ? (data.scripts as any) : undefined,
      envVariables: Array.isArray(data.envVariables) ? (data.envVariables as any) : undefined,
      configuration: typeof data.configuration === 'string' ? data.configuration.trim() : undefined,
      api: typeof data.api === 'string' ? data.api.trim() : undefined,
      projectStructure: typeof data.projectStructure === 'string' ? data.projectStructure.trim() : undefined,
      contributing: typeof data.contributing === 'string' ? data.contributing.trim() : undefined,
      license: typeof data.license === 'string' ? data.license.trim() : undefined,
      author: typeof data.author === 'string' ? data.author.trim() : undefined,
      repositoryUrl: typeof data.repositoryUrl === 'string' ? data.repositoryUrl.trim() : undefined,
      documentationUrl: typeof data.documentationUrl === 'string' ? data.documentationUrl.trim() : undefined,
      demoUrl: typeof data.demoUrl === 'string' ? data.demoUrl.trim() : undefined,
      badges: Array.isArray(data.badges) ? (data.badges as any) : undefined,
    },
  };
}

export function createReadmeConfig(overrides: Partial<ReadmeMetadata> = {}): ReadmeConfig {
  return {
    projectName: overrides.projectName || 'my-project',
    description: overrides.description || 'A brief project description.',
    installation: overrides.installation || 'npm install',
    usage: overrides.usage || 'npm start',
    features: overrides.features || ['Fast and lightweight', 'TypeScript support', 'Zero dependencies'],
    license: overrides.license || 'MIT',
    ...overrides,
  };
}

export function generateReadme(metadata: ReadmeMetadata, options: ReadmeGenerateOptions = {}): string {
  const validation = validateReadmeMetadata(metadata);
  if (!validation.valid) {
    throw new ValidationError('Invalid README metadata: ' + validation.errors.join('; '), validation.errors);
  }

  const meta = validation.data;
  const templateKey = options.template ?? 'standard';
  const template = TEMPLATES[templateKey] ?? TEMPLATES.standard!;
  const sectionsToRender = options.sectionOrder ?? template.defaultSections;

  const parts: string[] = [];

  for (const section of sectionsToRender) {
    switch (section) {
      case 'header':
        parts.push(`# ${meta.projectName}`);
        break;

      case 'badges':
        if (meta.badges && meta.badges.length > 0) {
          const badgeLine = meta.badges
            .map((b) => {
              const img = `![${b.label}](${sanitizeUrl(b.image)})`;
              return b.url ? `[${img}](${sanitizeUrl(b.url)})` : img;
            })
            .join(' ');
          parts.push(badgeLine);
        }
        break;

      case 'description':
        if (meta.description) {
          parts.push(meta.description);
        }
        break;

      case 'toc':
        if (options.includeToc !== false) {
          parts.push(`## ${options.tocTitle ?? 'Table of Contents'}\n\n<!-- generated-toc -->`);
        }
        break;

      case 'features':
        if (meta.features && meta.features.length > 0) {
          const list = meta.features.map((f) => `- ${f}`).join('\n');
          parts.push(`## Features\n\n${list}`);
        }
        break;

      case 'techStack':
        if (meta.techStack && meta.techStack.length > 0) {
          const stackList = meta.techStack
            .map((item) => {
              if (typeof item === 'string') return `- ${item}`;
              const ver = item.version ? ` (${item.version})` : '';
              return item.url ? `- [${item.name}](${sanitizeUrl(item.url)})${ver}` : `- ${item.name}${ver}`;
            })
            .join('\n');
          parts.push(`## Tech Stack\n\n${stackList}`);
        }
        break;

      case 'installation':
        if (meta.installation) {
          parts.push(`## Installation\n\n\`\`\`bash\n${meta.installation}\n\`\`\``);
        }
        break;

      case 'usage':
        if (meta.usage) {
          parts.push(`## Usage\n\n\`\`\`bash\n${meta.usage}\n\`\`\``);
        }
        break;

      case 'configuration':
        if (meta.configuration) {
          parts.push(`## Configuration\n\n${meta.configuration}`);
        }
        break;

      case 'envVariables':
        if (meta.envVariables && meta.envVariables.length > 0) {
          let envMd = '## Environment Variables\n\n| Variable | Description | Default | Required |\n| --- | --- | --- | --- |\n';
          for (const ev of meta.envVariables) {
            const req = ev.required ? 'Yes' : 'No';
            const def = ev.default ? `\`${ev.default}\`` : '-';
            envMd += `| \`${ev.name}\` | ${ev.description} | ${def} | ${req} |\n`;
          }
          parts.push(envMd.trimEnd());
        }
        break;

      case 'api':
        if (meta.api) {
          parts.push(`## API Reference\n\n${meta.api}`);
        }
        break;

      case 'projectStructure':
        if (meta.projectStructure) {
          parts.push(`## Project Structure\n\n\`\`\`\n${meta.projectStructure}\n\`\`\``);
        }
        break;

      case 'scripts':
        if (meta.scripts && meta.scripts.length > 0) {
          let scriptMd = '## Available Scripts\n\n| Script | Description | Command |\n| --- | --- | --- |\n';
          for (const s of meta.scripts) {
            const cmd = s.command ? `\`${s.command}\`` : `\`npm run ${s.name}\``;
            scriptMd += `| \`${s.name}\` | ${s.description} | ${cmd} |\n`;
          }
          parts.push(scriptMd.trimEnd());
        }
        break;

      case 'contributing':
        if (meta.contributing) {
          parts.push(`## Contributing\n\n${meta.contributing}`);
        }
        break;

      case 'links': {
        const linkItems: string[] = [];
        if (meta.repositoryUrl) linkItems.push(`- **Repository:** [${meta.repositoryUrl}](${sanitizeUrl(meta.repositoryUrl)})`);
        if (meta.documentationUrl) linkItems.push(`- **Documentation:** [${meta.documentationUrl}](${sanitizeUrl(meta.documentationUrl)})`);
        if (meta.demoUrl) linkItems.push(`- **Live Demo:** [${meta.demoUrl}](${sanitizeUrl(meta.demoUrl)})`);
        if (linkItems.length > 0) {
          parts.push(`## Links\n\n${linkItems.join('\n')}`);
        }
        break;
      }

      case 'license':
        if (meta.license) {
          parts.push(`## License\n\nDistributed under the ${meta.license} License. See \`LICENSE\` for more information.`);
        }
        break;

      case 'author':
        if (meta.author) {
          parts.push(`## Author\n\nCreated by **${meta.author}**.`);
        }
        break;
    }
  }

  return parts.filter(Boolean).join('\n\n') + '\n';
}
