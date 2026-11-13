import { describe, it, expect } from 'vitest';
import {
  generateReadme,
  createReadmeConfig,
  getReadmeTemplates,
  validateReadmeMetadata,
} from '../../src/readme-generate';
import { ValidationError } from '../../src/shared';

describe('readme-generate Utility', () => {
  const completeMetadata = {
    projectName: 'super-tool',
    description: 'A powerful documentation toolkit.',
    installation: 'npm install super-tool',
    usage: 'import { hello } from "super-tool";',
    features: ['Fast', 'TypeScript support', 'Zero dependencies'],
    techStack: [
      'Node.js',
      { name: 'TypeScript', url: 'https://typescriptlang.org', version: '5.0' },
    ],
    scripts: [
      { name: 'build', description: 'Builds dist', command: 'tsup' },
      { name: 'test', description: 'Runs test suite' },
    ],
    envVariables: [
      { name: 'API_KEY', description: 'Secret key', required: true },
      { name: 'PORT', description: 'Port number', default: '3000', required: false },
    ],
    configuration: 'Configure via `supertool.config.json`.',
    api: 'Detailed API descriptions go here.',
    projectStructure: 'src/\n  index.ts\ntests/\n  index.test.ts',
    contributing: 'Pull requests are welcome!',
    license: 'MIT',
    author: 'Rahul Dadhich',
    repositoryUrl: 'https://github.com/rahul/super-tool',
    documentationUrl: 'https://super-tool.dev',
    demoUrl: 'https://demo.super-tool.dev',
    badges: [
      { label: 'npm', image: 'https://img.shields.io/npm/v/super-tool', url: 'https://npmjs.com/package/super-tool' },
    ],
  };

  describe('validateReadmeMetadata', () => {
    it('validates correct metadata', () => {
      const res = validateReadmeMetadata({ projectName: 'my-lib' });
      expect(res.valid).toBe(true);
      expect(res.data?.projectName).toBe('my-lib');
    });

    it('rejects missing or empty projectName', () => {
      expect(validateReadmeMetadata({})?.valid).toBe(false);
      expect(validateReadmeMetadata({ projectName: '   ' })?.valid).toBe(false);
      expect(validateReadmeMetadata(null)?.valid).toBe(false);
    });

    it('rejects dangerous URLs in metadata', () => {
      const res = validateReadmeMetadata({
        projectName: 'safe-proj',
        repositoryUrl: 'javascript:alert(1)',
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('repositoryUrl must be a valid, safe URL.');
    });
  });

  describe('createReadmeConfig', () => {
    it('provides sensible defaults and merges overrides', () => {
      const config = createReadmeConfig({ projectName: 'custom-app' });
      expect(config.projectName).toBe('custom-app');
      expect(config.license).toBe('MIT');
      expect(config.installation).toBe('npm install');
      expect(config.features).toBeDefined();
    });
  });

  describe('getReadmeTemplates', () => {
    it('returns template options', () => {
      const templates = getReadmeTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(3);
      const ids = templates.map((t) => t.id);
      expect(ids).toContain('minimal');
      expect(ids).toContain('standard');
      expect(ids).toContain('comprehensive');
    });
  });

  describe('generateReadme', () => {
    it('generates standard README with all provided sections', () => {
      const md = generateReadme(completeMetadata, { template: 'comprehensive' });

      expect(md).toContain('# super-tool');
      expect(md).toContain('![npm](https://img.shields.io/npm/v/super-tool)');
      expect(md).toContain('## Features');
      expect(md).toContain('- Fast');
      expect(md).toContain('## Tech Stack');
      expect(md).toContain('[TypeScript](https://typescriptlang.org) (5.0)');
      expect(md).toContain('## Installation');
      expect(md).toContain('```bash\nnpm install super-tool\n```');
      expect(md).toContain('## Usage');
      expect(md).toContain('## Environment Variables');
      expect(md).toContain('| `API_KEY` | Secret key | - | Yes |');
      expect(md).toContain('## Available Scripts');
      expect(md).toContain('| `build` | Builds dist | `tsup` |');
      expect(md).toContain('| `test` | Runs test suite | `npm run test` |');
      expect(md).toContain('## Links');
      expect(md).toContain('[https://github.com/rahul/super-tool]');
      expect(md).toContain('## License\n\nDistributed under the MIT License.');
      expect(md).toContain('## Author\n\nCreated by **Rahul Dadhich**.');
    });

    it('generates minimal README with minimal sections only', () => {
      const md = generateReadme(completeMetadata, { template: 'minimal' });

      expect(md).toContain('# super-tool');
      expect(md).toContain('## Installation');
      expect(md).toContain('## Usage');
      expect(md).not.toContain('## Environment Variables');
      expect(md).not.toContain('## Available Scripts');
    });

    it('supports custom section order', () => {
      const md = generateReadme(completeMetadata, {
        sectionOrder: ['license', 'header', 'installation'],
      });

      const licenseIndex = md.indexOf('## License');
      const headerIndex = md.indexOf('# super-tool');
      const installIndex = md.indexOf('## Installation');

      expect(licenseIndex).toBeLessThan(headerIndex);
      expect(headerIndex).toBeLessThan(installIndex);
    });

    it('does not generate fabricated content for omitted fields', () => {
      const md = generateReadme({ projectName: 'bare-bones' });
      expect(md).toContain('# bare-bones');
      expect(md).not.toContain('## Environment Variables');
      expect(md).not.toContain('## Tech Stack');
      expect(md).not.toContain('## Features');
      expect(md).not.toContain('## API Reference');
    });

    it('throws ValidationError for invalid metadata', () => {
      expect(() => generateReadme({ projectName: '' })).toThrow(ValidationError);
    });
  });
});
