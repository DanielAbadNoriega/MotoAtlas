import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getAllowedReviewSources,
  shouldIncludeDemoData,
  isProductionEnvironment,
} from './reviewSourcePolicy';

vi.mock('import.meta.env', () => ({ PROD: false }));

describe('reviewSourcePolicy', () => {
  describe('isProductionEnvironment', () => {
    it('returns import.meta.env.PROD value', () => {
      expect(isProductionEnvironment()).toBe(false);
    });
  });

  describe('shouldIncludeDemoData', () => {
    it('returns false in production regardless of demoEnabled', () => {
      expect(shouldIncludeDemoData({ isProduction: true, demoEnabled: true })).toBe(false);
      expect(shouldIncludeDemoData({ isProduction: true, demoEnabled: false })).toBe(false);
    });

    it('returns false in production when demoEnabled is undefined', () => {
      expect(shouldIncludeDemoData({ isProduction: true })).toBe(false);
    });

    it('returns true in dev/pre by default (demoEnabled undefined)', () => {
      expect(shouldIncludeDemoData({ isProduction: false })).toBe(true);
    });

    it('returns true in dev/pre when demoEnabled is true', () => {
      expect(shouldIncludeDemoData({ isProduction: false, demoEnabled: true })).toBe(true);
    });

    it('returns false in dev/pre when demoEnabled is false', () => {
      expect(shouldIncludeDemoData({ isProduction: false, demoEnabled: false })).toBe(false);
    });
  });

  describe('getAllowedReviewSources', () => {
    it('production + demoEnabled true => only user', () => {
      expect(getAllowedReviewSources({ isProduction: true, demoEnabled: true })).toEqual(['user']);
    });

    it('production + demoEnabled false => only user', () => {
      expect(getAllowedReviewSources({ isProduction: true, demoEnabled: false })).toEqual(['user']);
    });

    it('production without demoEnabled => only user', () => {
      expect(getAllowedReviewSources({ isProduction: true })).toEqual(['user']);
    });

    it('dev/pre + demoEnabled true => user, seed, mock', () => {
      expect(getAllowedReviewSources({ isProduction: false, demoEnabled: true })).toEqual(['user', 'seed', 'mock']);
    });

    it('dev/pre + demoEnabled false => only user', () => {
      expect(getAllowedReviewSources({ isProduction: false, demoEnabled: false })).toEqual(['user']);
    });

    it('dev/pre without demoEnabled => user, seed, mock', () => {
      expect(getAllowedReviewSources({ isProduction: false })).toEqual(['user', 'seed', 'mock']);
    });
  });
});