import { describe, expect, it } from 'vitest';
import {
  formatPreviewNumber,
  formatPreviewPrice,
  getPreviewBadgeIcon,
  getPreviewBadgeLabel,
} from './adminModelPreviewUtils';

describe('formatPreviewNumber', () => {
  it('formats a valid number with unit', () => {
    expect(formatPreviewNumber('105', 'CV')).toBe('105 CV');
  });

  it('formats a large number with thousands separator', () => {
    expect(formatPreviewNumber('999999', 'cc')).toBe('999.999 cc');
  });

  it('returns em-dash for zero', () => {
    expect(formatPreviewNumber('0', 'kg')).toBe('—');
  });

  it('returns em-dash for negative number', () => {
    expect(formatPreviewNumber('-5', 'kg')).toBe('—');
  });

  it('returns em-dash for non-numeric string', () => {
    expect(formatPreviewNumber('abc', 'kg')).toBe('—');
  });

  it('returns em-dash for empty string', () => {
    expect(formatPreviewNumber('', 'kg')).toBe('—');
  });

  it('returns em-dash for NaN', () => {
    expect(formatPreviewNumber('NaN', 'kg')).toBe('—');
  });
});

describe('formatPreviewPrice', () => {
  it('formats a valid price in EUR', () => {
    expect(formatPreviewPrice('12000', false)).toBe('12.000\u00a0€');
  });

  it('formats a large price', () => {
    expect(formatPreviewPrice('25999', false)).toBe('25.999\u00a0€');
  });

  it('returns Precio pendiente when isPending is true', () => {
    expect(formatPreviewPrice('12000', true)).toBe('Precio pendiente');
  });

  it('returns Precio pendiente for empty string', () => {
    expect(formatPreviewPrice('', false)).toBe('Precio pendiente');
  });

  it('returns Precio pendiente for zero', () => {
    expect(formatPreviewPrice('0', false)).toBe('Precio pendiente');
  });

  it('returns Precio pendiente for negative price', () => {
    expect(formatPreviewPrice('-1', false)).toBe('Precio pendiente');
  });

  it('returns Precio pendiente for non-numeric string', () => {
    expect(formatPreviewPrice('abc', false)).toBe('Precio pendiente');
  });

  it('returns Precio pendiente when both pending and invalid', () => {
    expect(formatPreviewPrice('', true)).toBe('Precio pendiente');
  });
});

describe('getPreviewBadgeLabel', () => {
  it('returns label for known segment', () => {
    expect(getPreviewBadgeLabel('naked')).toBe('Naked');
    expect(getPreviewBadgeLabel('sport')).toBe('Sport');
    expect(getPreviewBadgeLabel('trail')).toBe('Trail');
    expect(getPreviewBadgeLabel('touring')).toBe('Touring');
  });

  it('returns fallback for empty segment', () => {
    expect(getPreviewBadgeLabel('')).toBe('Segmento pendiente');
  });
});

describe('getPreviewBadgeIcon', () => {
  it('returns icon for known segment', () => {
    expect(getPreviewBadgeIcon('naked')).toBe('motorcycle');
    expect(getPreviewBadgeIcon('sport')).toBe('speed');
    expect(getPreviewBadgeIcon('trail')).toBe('terrain');
    expect(getPreviewBadgeIcon('touring')).toBe('travel_explore');
  });

  it('returns fallback icon for empty segment', () => {
    expect(getPreviewBadgeIcon('')).toBe('category');
  });
});
