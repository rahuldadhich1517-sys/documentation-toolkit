import { BadgeConfig, BadgePreset, PresetBadgeType } from './types';
import { isSafeUrl, sanitizeUrl, ValidationError } from '../shared';

export * from './types';

const PRESETS: Record<PresetBadgeType, BadgePreset> = {
  'npm-version': {
    id: 'npm-version',
    name: 'npm Version',
    description: 'Displays the latest published version on npm.',
    defaultConfig: {
      style: 'flat',
      logo: 'npm',
      color: 'cb3837',
    },
  },
  'npm-downloads': {
    id: 'npm-downloads',
    name: 'npm Downloads',
    description: 'Displays monthly downloads from npm.',
    defaultConfig: {
      style: 'flat',
      logo: 'npm',
      color: 'blue',
    },
  },
  license: {
    id: 'license',
    name: 'License',
    description: 'Displays the project license badge.',
    defaultConfig: {
      style: 'flat',
      color: 'green',
    },
  },
  'github-stars': {
    id: 'github-stars',
    name: 'GitHub Stars',
    description: 'Displays current repository star count.',
    defaultConfig: {
      style: 'flat',
      logo: 'github',
    },
  },
  'github-forks': {
    id: 'github-forks',
    name: 'GitHub Forks',
    description: 'Displays current repository fork count.',
    defaultConfig: {
      style: 'flat',
      logo: 'github',
    },
  },
  'github-issues': {
    id: 'github-issues',
    name: 'GitHub Open Issues',
    description: 'Displays the count of open GitHub issues.',
    defaultConfig: {
      style: 'flat',
      logo: 'github',
    },
  },
  'github-contributors': {
    id: 'github-contributors',
    name: 'GitHub Contributors',
    description: 'Displays contributor count for the repository.',
    defaultConfig: {
      style: 'flat',
      logo: 'github',
    },
  },
  'build-status': {
    id: 'build-status',
    name: 'Build Status',
    description: 'Displays the status of GitHub Actions CI workflow.',
    defaultConfig: {
      style: 'flat',
      logo: 'githubactions',
    },
  },
  coverage: {
    id: 'coverage',
    name: 'Code Coverage',
    description: 'Displays test coverage percentage.',
    defaultConfig: {
      style: 'flat',
      logo: 'codecov',
    },
  },
  custom: {
    id: 'custom',
    name: 'Custom Static Badge',
    description: 'Custom label, message, and color badge.',
    defaultConfig: {
      style: 'flat',
    },
  },
};

export function getBadgePresets(): Record<string, BadgePreset> {
  return { ...PRESETS };
}

function escapeShieldsPath(str: string): string {
  return str
    .replace(/_/g, '__')
    .replace(/-/g, '--')
    .replace(/\s+/g, '_');
}

export function generateBadgeUrl(config: BadgeConfig): string {
  const type = config.type ?? (config.label && config.message ? 'custom' : 'npm-version');

  let baseUrl = 'https://img.shields.io';
  const queryParams = new URLSearchParams();

  if (config.style) queryParams.set('style', config.style);
  if (config.logo) queryParams.set('logo', config.logo);
  if (config.logoColor) queryParams.set('logoColor', config.logoColor);
  if (config.labelColor) queryParams.set('labelColor', config.labelColor);

  switch (type) {
    case 'npm-version': {
      const pkg = config.packageName || 'package-name';
      baseUrl += `/npm/v/${encodeURIComponent(pkg)}`;
      if (config.color) queryParams.set('color', config.color);
      break;
    }

    case 'npm-downloads': {
      const pkg = config.packageName || 'package-name';
      baseUrl += `/npm/dm/${encodeURIComponent(pkg)}`;
      if (config.color) queryParams.set('color', config.color);
      break;
    }

    case 'license': {
      if (config.repo) {
        baseUrl += `/github/license/${config.repo.replace(/^\//, '')}`;
      } else if (config.packageName) {
        baseUrl += `/npm/l/${encodeURIComponent(config.packageName)}`;
      } else {
        const label = escapeShieldsPath(config.label || 'license');
        const message = escapeShieldsPath(config.message || 'MIT');
        const color = config.color || 'blue';
        baseUrl += `/badge/${label}-${message}-${color}`;
      }
      break;
    }

    case 'github-stars': {
      const repo = (config.repo || 'owner/repo').replace(/^\//, '');
      baseUrl += `/github/stars/${repo}`;
      break;
    }

    case 'github-forks': {
      const repo = (config.repo || 'owner/repo').replace(/^\//, '');
      baseUrl += `/github/forks/${repo}`;
      break;
    }

    case 'github-issues': {
      const repo = (config.repo || 'owner/repo').replace(/^\//, '');
      baseUrl += `/github/issues/${repo}`;
      break;
    }

    case 'github-contributors': {
      const repo = (config.repo || 'owner/repo').replace(/^\//, '');
      baseUrl += `/github/contributors/${repo}`;
      break;
    }

    case 'build-status': {
      const repo = (config.repo || 'owner/repo').replace(/^\//, '');
      const branchParam = config.branch ? `?branch=${encodeURIComponent(config.branch)}` : '';
      baseUrl += `/github/actions/workflow/status/${repo}/ci.yml${branchParam}`;
      break;
    }

    case 'coverage': {
      const repo = (config.repo || 'owner/repo').replace(/^\//, '');
      baseUrl += `/codecov/c/github/${repo}`;
      break;
    }

    case 'custom':
    default: {
      const label = escapeShieldsPath(config.label || 'badge');
      const message = escapeShieldsPath(config.message || 'status');
      const color = config.color || 'blue';
      baseUrl += `/badge/${label}-${message}-${color}`;
      break;
    }
  }

  // Label override if specified
  if (config.label && type !== 'custom') {
    queryParams.set('label', config.label);
  }

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}` : baseUrl;
}

export function generateBadgeMarkdown(config: BadgeConfig): string {
  const badgeUrl = generateBadgeUrl(config);
  const altText = config.label || config.type || 'badge';

  const imgMarkdown = `![${altText}](${badgeUrl})`;

  if (config.url) {
    if (!isSafeUrl(config.url)) {
      throw new ValidationError(`Unsafe badge link URL: ${config.url}`);
    }
    return `[${imgMarkdown}](${sanitizeUrl(config.url)})`;
  }

  return imgMarkdown;
}

export function generateReadmeBadge(config: BadgeConfig): string {
  return generateBadgeMarkdown(config);
}
