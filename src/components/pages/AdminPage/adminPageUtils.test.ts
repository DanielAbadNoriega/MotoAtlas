import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RangeFilterPreset } from './adminPageConstants';
import type { Bike } from '../../../types/bike';
import {
  formatDate,
  formatFileSize,
  formatPendingReviewCount,
  getBrandOptions,
  getCurrentImageOriginLabel,
  getDisplayName,
  getTimestamp,
  isRangePresetActive,
  normalizeTextList,
} from './adminPageUtils';

describe('formatDate', () => {
  it('formats a valid date string in es-ES locale', () => {
    const result = formatDate('2026-05-15T10:00:00.000Z');
    expect(result).toContain('may');
    expect(result).toContain('2026');
  });

  it('returns fallback for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('Fecha pendiente');
  });

  it('returns fallback for empty string', () => {
    expect(formatDate('')).toBe('Fecha pendiente');
  });
});

describe('getTimestamp', () => {
  it('returns timestamp for valid date string', () => {
    const result = getTimestamp('2026-05-15T10:00:00.000Z');
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 for invalid date string', () => {
    expect(getTimestamp('not-a-date')).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(getTimestamp('')).toBe(0);
  });
});

describe('formatPendingReviewCount', () => {
  it('returns singular for 1', () => {
    expect(formatPendingReviewCount(1)).toBe('1 review nueva');
  });

  it('returns plural for 0', () => {
    expect(formatPendingReviewCount(0)).toBe('0 reviews nuevas');
  });

  it('returns plural for values greater than 1', () => {
    expect(formatPendingReviewCount(5)).toBe('5 reviews nuevas');
  });

  it('returns plural for 2', () => {
    expect(formatPendingReviewCount(2)).toBe('2 reviews nuevas');
  });
});

describe('getDisplayName', () => {
  it('prefers profile name over email', () => {
    expect(getDisplayName('Carlos', 'carlos@test.com')).toBe('Carlos');
  });

  it('trims profile name', () => {
    expect(getDisplayName('  Carlos  ', 'carlos@test.com')).toBe('Carlos');
  });

  it('falls back to email when profile name is null', () => {
    expect(getDisplayName(null, 'carlos@test.com')).toBe('carlos@test.com');
  });

  it('falls back to email when profile name is undefined', () => {
    expect(getDisplayName(undefined, 'carlos@test.com')).toBe('carlos@test.com');
  });

  it('falls back to Admin MotoAtlas when both are missing', () => {
    expect(getDisplayName(null, undefined)).toBe('Admin MotoAtlas');
  });

  it('falls back to email when profile name is empty string', () => {
    expect(getDisplayName('', 'user@test.com')).toBe('user@test.com');
  });
});

describe('getBrandOptions', () => {
  it('extracts unique brand names from catalog', () => {
    const catalog = [
      { brand: 'BMW' },
      { brand: 'Honda' },
      { brand: 'BMW' },
      { brand: 'Yamaha' },
    ] as unknown as readonly Bike[];

    const result = getBrandOptions(catalog);
    expect(result).toEqual(['BMW', 'Honda', 'Yamaha']);
  });

  it('returns sorted brands', () => {
    const catalog = [
      { brand: 'Yamaha' },
      { brand: 'BMW' },
      { brand: 'Honda' },
    ] as unknown as readonly Bike[];

    const result = getBrandOptions(catalog);
    expect(result).toEqual(['BMW', 'Honda', 'Yamaha']);
  });

  it('returns empty array for empty catalog', () => {
    expect(getBrandOptions([])).toEqual([]);
  });
});

describe('isRangePresetActive', () => {
  const preset: RangeFilterPreset = {
    key: 'test',
    label: 'Test preset',
    min: '100',
    max: '200',
  };

  it('returns true when min and max match the preset', () => {
    expect(isRangePresetActive('100', '200', preset)).toBe(true);
  });

  it('returns false when min differs', () => {
    expect(isRangePresetActive('50', '200', preset)).toBe(false);
  });

  it('returns false when max differs', () => {
    expect(isRangePresetActive('100', '300', preset)).toBe(false);
  });

  it('returns false when both differ', () => {
    expect(isRangePresetActive('0', '999', preset)).toBe(false);
  });
});

describe('normalizeTextList', () => {
  it('trims each value', () => {
    expect(normalizeTextList(['  hello  ', '  world  '])).toEqual(['hello', 'world']);
  });

  it('filters out empty strings', () => {
    expect(normalizeTextList(['hello', '', 'world'])).toEqual(['hello', 'world']);
  });

  it('filters out the string "null"', () => {
    expect(normalizeTextList(['hello', 'null', 'world'])).toEqual(['hello', 'world']);
  });

  it('filters out case-insensitive "null"', () => {
    expect(normalizeTextList(['hello', 'NULL', 'Null'])).toEqual(['hello']);
  });

  it('returns empty array for null input', () => {
    expect(normalizeTextList(null)).toEqual([]);
  });

  it('returns empty array for undefined input', () => {
    expect(normalizeTextList(undefined)).toEqual([]);
  });

  it('handles non-string values as empty strings', () => {
    const result = normalizeTextList(['valid', null as unknown as string, undefined as unknown as string]);
    expect(result).toEqual(['valid']);
  });

  it('preserves valid strings unchanged', () => {
    expect(normalizeTextList(['Motor lleno', 'Calor', 'Frenos'])).toEqual(['Motor lleno', 'Calor', 'Frenos']);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getCurrentImageOriginLabel', () => {
  it('returns Pendiente for empty string', () => {
    expect(getCurrentImageOriginLabel('')).toBe('Pendiente');
  });

  it('returns Pendiente for whitespace-only string', () => {
    expect(getCurrentImageOriginLabel('   ')).toBe('Pendiente');
  });

  it('returns Storage MotoAtlas for Supabase storage URL', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const url = 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg';
    expect(getCurrentImageOriginLabel(url)).toBe('Storage MotoAtlas');
  });

  it('returns Catálogo local for /images/ path', () => {
    expect(getCurrentImageOriginLabel('/images/local/bike.jpg')).toBe('Catálogo local');
  });

  it('returns URL externa for http/https URL outside storage', () => {
    expect(getCurrentImageOriginLabel('https://example.com/bike.webp')).toBe('URL externa');
  });

  it('returns Borrador local for fallback path', () => {
    expect(getCurrentImageOriginLabel('some-local-path.jpg')).toBe('Borrador local');
  });
});

describe('formatFileSize', () => {
  it('returns B for bytes under 1024', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('returns KB for values in KB range', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('returns MB for values in MB range', () => {
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });

  it('handles boundary at 1023', () => {
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('handles boundary at 1024', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('handles zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});
