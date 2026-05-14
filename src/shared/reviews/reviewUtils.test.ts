import { describe, expect, it } from 'vitest';
import { formatReviewAggregate, getReviewAggregate } from './reviewUtils';

describe('reviewUtils', () => {
  it('calcula rating medio y contador', () => {
    const aggregate = getReviewAggregate([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);

    expect(aggregate).toEqual({ averageRating: 4.3, reviewCount: 3 });
    expect(formatReviewAggregate(aggregate)).toBe('4.3/5 · 3 reviews');
  });

  it('gestiona estado vacío', () => {
    expect(formatReviewAggregate(getReviewAggregate([]))).toBe('Sin reviews aprobadas');
  });
});
