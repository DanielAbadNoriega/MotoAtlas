import type { MotorcycleReview } from '../../services/motorcycleReviewService';

export const fallbackReviewUserName = 'Usuario MotoAtlas';

export type ReviewAggregate = Readonly<{
  averageRating: number;
  reviewCount: number;
}>;

export function getReviewAggregate(reviews: readonly Pick<MotorcycleReview, 'rating'>[]): ReviewAggregate {
  if (reviews.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    averageRating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

export function formatReviewRating(value: number) {
  const roundedValue = Math.round(value * 10) / 10;
  return Number.isInteger(roundedValue) ? String(roundedValue) : roundedValue.toFixed(1);
}

export function formatReviewAggregate(aggregate?: Partial<ReviewAggregate> | null) {
  const reviewCount = aggregate?.reviewCount ?? 0;
  const averageRating = aggregate?.averageRating;

  if (reviewCount === 0 || typeof averageRating !== 'number' || !Number.isFinite(averageRating)) {
    return 'Sin reviews aprobadas';
  }

  return `${formatReviewRating(averageRating)}/5 · ${reviewCount} reviews`;
}

export function getReviewUserName(review: Pick<MotorcycleReview, 'userName'>) {
  return (String(review.userName ?? '').trim() || fallbackReviewUserName);
}

export function isReviewVerified(review: Pick<MotorcycleReview, 'verified'>) {
  return review.verified === true;
}
