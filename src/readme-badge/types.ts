export type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social';

export type PresetBadgeType =
  | 'npm-version'
  | 'npm-downloads'
  | 'license'
  | 'github-stars'
  | 'github-forks'
  | 'github-issues'
  | 'github-contributors'
  | 'build-status'
  | 'coverage'
  | 'custom';

export interface BadgeConfig {
  type?: PresetBadgeType;
  label?: string;
  message?: string;
  color?: string;
  labelColor?: string;
  style?: BadgeStyle;
  logo?: string;
  logoColor?: string;
  url?: string;
  repo?: string; // owner/repo for GitHub badges
  packageName?: string; // for npm badges
  branch?: string; // for build status / coverage
}

export interface BadgePreset {
  id: PresetBadgeType;
  name: string;
  description: string;
  defaultConfig: Partial<BadgeConfig>;
}
