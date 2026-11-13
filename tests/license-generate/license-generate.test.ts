import { describe, it, expect } from 'vitest';
import {
  generateLicense,
  getAvailableLicenses,
  getLicenseTemplate,
  validateLicenseMetadata,
  LicenseType,
} from '../../src/license-generate';
import { ValidationError } from '../../src/shared';

describe('license-generate Utility', () => {
  const supportedTypes: LicenseType[] = [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'GPL-3.0-only',
    'LGPL-3.0-only',
    'MPL-2.0',
    'Unlicense',
  ];

  describe('getAvailableLicenses', () => {
    it('returns all 9 supported open source licenses with metadata', () => {
      const licenses = getAvailableLicenses();
      expect(licenses.length).toBe(9);
      const spdxIds = licenses.map((l) => l.spdxId);
      for (const type of supportedTypes) {
        expect(spdxIds).toContain(type);
      }
    });
  });

  describe('getLicenseTemplate', () => {
    it('returns template string for each supported license', () => {
      for (const type of supportedTypes) {
        const tpl = getLicenseTemplate(type);
        expect(typeof tpl).toBe('string');
        expect(tpl.length).toBeGreaterThan(20);
      }
    });

    it('throws ValidationError for unsupported license type', () => {
      expect(() => getLicenseTemplate('FAKE-LICENSE' as any)).toThrow(ValidationError);
    });
  });

  describe('validateLicenseMetadata', () => {
    it('validates 4-digit year', () => {
      expect(validateLicenseMetadata({ year: 2026 }).valid).toBe(true);
      expect(validateLicenseMetadata({ year: '2026' }).valid).toBe(true);
      expect(validateLicenseMetadata({ year: '99' }).valid).toBe(false);
      expect(validateLicenseMetadata({ year: 'abcd' }).valid).toBe(false);
    });

    it('handles empty metadata', () => {
      expect(validateLicenseMetadata({}).valid).toBe(true);
      expect(validateLicenseMetadata(null).valid).toBe(true);
    });
  });

  describe('generateLicense', () => {
    it('generates MIT license with author and year substitution', () => {
      const result = generateLicense('MIT', {
        author: 'Rahul Dadhich',
        year: 2026,
      });

      expect(result.spdxId).toBe('MIT');
      expect(result.name).toBe('MIT License');
      expect(result.text).toContain('Copyright (c) 2026 Rahul Dadhich');
      expect(result.text).toContain('Permission is hereby granted, free of charge');
      expect(result.text).not.toContain('[year]');
      expect(result.text).not.toContain('[author]');
      expect(result.disclaimer).toContain('does not constitute legal advice');
    });

    it('generates all 9 supported licenses without placeholder leaks', () => {
      for (const type of supportedTypes) {
        const result = generateLicense(type, {
          author: 'ACME Corp',
          year: 2026,
          organization: 'ACME Corp',
          projectName: 'AcmeTool',
        });

        expect(result.spdxId).toBe(type);
        expect(result.text).not.toContain('[year]');
        expect(result.text).not.toContain('[author]');
        expect(result.text).not.toContain('[organization]');
      }
    });

    it('defaults missing year and author sensibly', () => {
      const currentYear = new Date().getFullYear().toString();
      const result = generateLicense('ISC');

      expect(result.text).toContain(currentYear);
      expect(result.text).toContain('The Project Contributors');
    });

    it('throws on invalid metadata', () => {
      expect(() => generateLicense('MIT', { year: 'invalid-year' })).toThrow(ValidationError);
    });
  });
});
