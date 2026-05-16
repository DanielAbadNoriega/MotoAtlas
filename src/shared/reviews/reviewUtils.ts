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

export function formatReviewAggregate({ averageRating, reviewCount }: ReviewAggregate) {
  return reviewCount === 0 ? 'Sin reviews aprobadas' : `${averageRating.toFixed(1)}/5 · ${reviewCount} reviews`;
}

export function getReviewUserName(review: Pick<MotorcycleReview, 'userName'>) {
  return review.userName.trim() || fallbackReviewUserName;
}

export function isReviewVerified(review: Pick<MotorcycleReview, 'verified'>) {
  return review.verified === true;
}
