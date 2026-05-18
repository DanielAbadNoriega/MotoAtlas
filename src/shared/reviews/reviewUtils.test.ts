import { describe, expect, it } from 'vitest';
import { formatReviewAggregate, formatReviewRating, getReviewAggregate } from './reviewUtils';

describe('reviewUtils', () => {
  it('calcula rating medio y contador', () => {
    const aggregate = getReviewAggregate([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);

    expect(aggregate).toEqual({ averageRating: 4.3, reviewCount: 3 });
    expect(formatReviewAggregate(aggregate)).toBe('4.3/5 · 3 reviews');
  });

  it('gestiona estado vacío', () => {
    expect(formatReviewAggregate(getReviewAggregate([]))).toBe('Sin reviews aprobadas');
  });

  it('elimina decimales innecesarios al formatear notas', () => {
    expect(formatReviewRating(8)).toBe('8');
    expect(formatReviewRating(8.0)).toBe('8');
    expect(formatReviewRating(8.5)).toBe('8.5');
    expect(formatReviewRating(8.25)).toBe('8.3');
    expect(formatReviewAggregate({ averageRating: 8, reviewCount: 1 })).toBe('8/5 · 1 reviews');
    expect(formatReviewAggregate({ averageRating: 8.0, reviewCount: 1 })).toBe('8/5 · 1 reviews');
    expect(formatReviewAggregate({ averageRating: 8.5, reviewCount: 1 })).toBe('8.5/5 · 1 reviews');
    expect(formatReviewAggregate({ averageRating: 8.25, reviewCount: 1 })).toBe('8.3/5 · 1 reviews');
  });

  it('mantiene fallback si el agregado no tiene datos válidos', () => {
    expect(formatReviewAggregate(null)).toBe('Sin reviews aprobadas');
    expect(formatReviewAggregate(undefined)).toBe('Sin reviews aprobadas');
    expect(formatReviewAggregate({ averageRating: Number.NaN, reviewCount: 1 })).toBe('Sin reviews aprobadas');
  });
});
