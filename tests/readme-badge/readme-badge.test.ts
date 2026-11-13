import { describe, it, expect } from 'vitest';
import {
  generateBadgeUrl,
  generateBadgeMarkdown,
  generateReadmeBadge,
  getBadgePresets,
} from '../../src/readme-badge';
import { ValidationError } from '../../src/shared';

describe('readme-badge Utility', () => {
  describe('generateBadgeUrl', () => {
    it('generates npm version badge URL', () => {
      const url = generateBadgeUrl({
        type: 'npm-version',
        packageName: '@rahul_dadhich15/documentation-toolkit',
        style: 'flat',
        color: 'cb3837',
      });

      expect(url).toContain('https://img.shields.io/npm/v/%40rahul_dadhich15%2Fdocumentation-toolkit');
      expect(url).toContain('style=flat');
      expect(url).toContain('color=cb3837');
    });

    it('generates npm downloads badge URL', () => {
      const url = generateBadgeUrl({
        type: 'npm-downloads',
        packageName: 'my-package',
      });
      expect(url).toContain('https://img.shields.io/npm/dm/my-package');
    });

    it('generates GitHub metric badges (stars, forks, issues, contributors)', () => {
      const stars = generateBadgeUrl({ type: 'github-stars', repo: 'facebook/react' });
      expect(stars).toContain('https://img.shields.io/github/stars/facebook/react');

      const forks = generateBadgeUrl({ type: 'github-forks', repo: 'facebook/react' });
      expect(forks).toContain('https://img.shields.io/github/forks/facebook/react');

      const issues = generateBadgeUrl({ type: 'github-issues', repo: 'facebook/react' });
      expect(issues).toContain('https://img.shields.io/github/issues/facebook/react');

      const contributors = generateBadgeUrl({ type: 'github-contributors', repo: 'facebook/react' });
      expect(contributors).toContain('https://img.shields.io/github/contributors/facebook/react');
    });

    it('generates build status badge URL with branch param', () => {
      const url = generateBadgeUrl({
        type: 'build-status',
        repo: 'owner/repo',
        branch: 'main',
      });
      expect(url).toContain('https://img.shields.io/github/actions/workflow/status/owner/repo/ci.yml?branch=main');
    });

    it('generates code coverage badge URL', () => {
      const url = generateBadgeUrl({
        type: 'coverage',
        repo: 'owner/repo',
      });
      expect(url).toContain('https://img.shields.io/codecov/c/github/owner/repo');
    });

    it('generates custom static badge URL with escaped dashes and underscores', () => {
      const url = generateBadgeUrl({
        type: 'custom',
        label: 'build_status',
        message: 'v1.0-beta',
        color: 'brightgreen',
      });

      // _ is escaped as __, - as --
      expect(url).toContain('/badge/build__status-v1.0--beta-brightgreen');
    });

    it('supports custom logo and logoColor', () => {
      const url = generateBadgeUrl({
        type: 'custom',
        label: 'typescript',
        message: '5.0',
        logo: 'typescript',
        logoColor: 'white',
      });
      expect(url).toContain('logo=typescript');
      expect(url).toContain('logoColor=white');
    });
  });

  describe('generateBadgeMarkdown & generateReadmeBadge', () => {
    it('generates markdown image syntax', () => {
      const md = generateReadmeBadge({
        type: 'npm-version',
        packageName: 'toolkit',
      });
      expect(md).toContain('![npm-version](https://img.shields.io/npm/v/toolkit)');
    });

    it('generates clickable linked badge syntax', () => {
      const md = generateBadgeMarkdown({
        type: 'npm-version',
        packageName: 'toolkit',
        url: 'https://www.npmjs.com/package/toolkit',
      });

      expect(md).toContain('[![npm-version](https://img.shields.io/npm/v/toolkit)](https://www.npmjs.com/package/toolkit)');
    });

    it('throws ValidationError for unsafe link URLs', () => {
      expect(() =>
        generateBadgeMarkdown({
          label: 'test',
          message: 'val',
          url: 'javascript:alert(1)',
        })
      ).toThrow(ValidationError);
    });
  });

  describe('getBadgePresets', () => {
    it('returns standard presets list', () => {
      const presets = getBadgePresets();
      expect(presets['npm-version']).toBeDefined();
      expect(presets['github-stars']).toBeDefined();
      expect(presets['build-status']).toBeDefined();
      expect(presets.coverage).toBeDefined();
    });
  });
});
