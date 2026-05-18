import type { MotorcycleReview } from '../../services/motorcycleReviewService';
import type { Bike, BikeSegment } from '../../types/bike';
import { getBikeA2Badge, getBikeA2Status } from '../motorcycles/motorcycleTaxonomy';
import { getReviewAggregate } from './reviewUtils';

export type TopRatedLicenseFilter = 'all' | 'A' | 'A2';
export type TopRatedSort = 'rating' | 'reviews' | 'trend' | 'a2';

export type TopRatedFilters = Readonly<{
  license: TopRatedLicenseFilter;
  minReviews: number;
  segment: BikeSegment | 'all';
  sort: TopRatedSort;
}>;

export type TopRatedMotorcycle = Readonly<{
  averageRating: number;
  badges: readonly string[];
  bike: Bike;
  rank: number;
  reviewCount: number;
  reviews: readonly MotorcycleReview[];
}>;

export type ReviewsByMotorcycleId = Readonly<Record<string, readonly MotorcycleReview[]>>;

export const defaultTopRatedFilters: TopRatedFilters = {
  license: 'all',
  minReviews: 1,
  segment: 'all',
  sort: 'rating',
};

function isApprovedReview(review: Pick<MotorcycleReview, 'status'> | undefined | null) {
  return review?.status === 'approved';
}

export function getApprovedReviewsForMotorcycle(reviews: readonly MotorcycleReview[] = []) {
  return reviews.filter(isApprovedReview);
}

export function calculateAverageRating(reviews: readonly Pick<MotorcycleReview, 'rating'>[]) {
  return getReviewAggregate(reviews).averageRating;
}

function getBadges(bike: Bike, averageRating: number, reviewCount: number, rank: number) {
  const badges: string[] = [];
  const a2Badge = getBikeA2Badge(bike);

  if (rank === 1) {
    badges.push('Mejor valorada');
  }

  if (reviewCount >= 5 && averageRating >= 4.5) {
    badges.push('En tendencia');
  }

  if (reviewCount >= 3) {
    badges.push('Comunidad activa');
  } else {
    badges.push('Pocos datos');
  }

  badges.push(a2Badge.label);

  return badges;
}

function passesLicenseFilter(bike: Bike, license: TopRatedLicenseFilter) {
  if (license === 'all') {
    return true;
  }

  if (license === 'A2') {
    return getBikeA2Status(bike) !== 'A';
  }

  return getBikeA2Status(bike) === 'A';
}

function compareByDefault(a: Omit<TopRatedMotorcycle, 'rank' | 'badges'>, b: Omit<TopRatedMotorcycle, 'rank' | 'badges'>) {
  return (
    b.averageRating - a.averageRating ||
    b.reviewCount - a.reviewCount ||
    a.bike.brand.localeCompare(b.bike.brand, 'es') ||
    a.bike.model.localeCompare(b.bike.model, 'es')
  );
}

function compareBySort(sort: TopRatedSort) {
  return (a: Omit<TopRatedMotorcycle, 'rank' | 'badges'>, b: Omit<TopRatedMotorcycle, 'rank' | 'badges'>) => {
    if (sort === 'reviews') {
      return b.reviewCount - a.reviewCount || compareByDefault(a, b);
    }

    if (sort === 'trend') {
      const aTrendScore = a.averageRating * Math.log10(a.reviewCount + 1);
      const bTrendScore = b.averageRating * Math.log10(b.reviewCount + 1);
      return bTrendScore - aTrendScore || compareByDefault(a, b);
    }

    if (sort === 'a2') {
      const aIsA2 = getBikeA2Status(a.bike) !== 'A' ? 1 : 0;
      const bIsA2 = getBikeA2Status(b.bike) !== 'A' ? 1 : 0;
      return bIsA2 - aIsA2 || compareByDefault(a, b);
    }

    return compareByDefault(a, b);
  };
}

export function buildTopRatedMotorcycles(
  motorcycles: readonly Bike[],
  reviewsByMotorcycleId: ReviewsByMotorcycleId,
  filters: Partial<TopRatedFilters> = {},
) {
  const activeFilters = { ...defaultTopRatedFilters, ...filters };
  const rankedCandidates = motorcycles
    .map((bike) => {
      const reviews = getApprovedReviewsForMotorcycle(reviewsByMotorcycleId[bike.id] ?? []);
      const aggregate = getReviewAggregate(reviews);

      return {
        averageRating: aggregate.averageRating,
        bike,
        reviewCount: aggregate.reviewCount,
        reviews,
      } satisfies Omit<TopRatedMotorcycle, 'rank' | 'badges'>;
    })
    .filter((item) => item.reviewCount >= activeFilters.minReviews)
    .filter((item) => activeFilters.segment === 'all' || item.bike.segment === activeFilters.segment)
    .filter((item) => passesLicenseFilter(item.bike, activeFilters.license))
    .sort(compareBySort(activeFilters.sort));

  return rankedCandidates.map((item, index) => ({
    ...item,
    badges: getBadges(item.bike, item.averageRating, item.reviewCount, index + 1),
    rank: index + 1,
  })) satisfies readonly TopRatedMotorcycle[];
}
