export type LicenseType =
  | 'MIT'
  | 'Apache-2.0'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'ISC'
  | 'GPL-3.0-only'
  | 'LGPL-3.0-only'
  | 'MPL-2.0'
  | 'Unlicense';

export interface LicenseMetadata {
  author?: string;
  year?: string | number;
  organization?: string;
  projectName?: string;
}

export interface LicenseInfo {
  spdxId: LicenseType;
  name: string;
  description: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
  url: string;
}

export interface LicenseOutput {
  spdxId: LicenseType;
  name: string;
  text: string;
  metadata: Required<LicenseMetadata>;
  disclaimer: string;
}
