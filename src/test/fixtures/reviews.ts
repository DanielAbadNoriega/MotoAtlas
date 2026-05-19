import type { MotorcycleReview, MotorcycleReviewRidingStyle, MotorcycleReviewStatus } from '../../services/motorcycleReviewService';

type ReviewFixtureStatus = MotorcycleReviewStatus | 'hidden';

type ReviewFixtureOverrides = Partial<Omit<MotorcycleReview, 'ridingStyle' | 'status'>> & {
  ridingStyle?: MotorcycleReviewRidingStyle;
  status?: ReviewFixtureStatus;
};

export function createReviewFixture(overrides: ReviewFixtureOverrides = {}): MotorcycleReview {
  const id = overrides.id ?? 'review-approved-fixture';

  return {
    id,
    motorcycleId: overrides.motorcycleId ?? 'test-bmw-f-900-gs',
    userId: Object.prototype.hasOwnProperty.call(overrides, 'userId') ? (overrides.userId ?? null) : null,
    userName: overrides.userName ?? 'Laura',
    rating: overrides.rating ?? 5,
    ridingStyle: overrides.ridingStyle ?? 'viaje',
    ownershipMonths: Object.prototype.hasOwnProperty.call(overrides, 'ownershipMonths') ? (overrides.ownershipMonths ?? null) : 12,
    kilometers: Object.prototype.hasOwnProperty.call(overrides, 'kilometers') ? (overrides.kilometers ?? null) : 8500,
    comment: overrides.comment ?? 'Fantástica para viajar con equipaje.',
    pros: overrides.pros ?? ['Motor lleno'],
    cons: overrides.cons ?? ['Precio alto'],
    verified: overrides.verified ?? false,
    status: (overrides.status ?? 'approved') as MotorcycleReviewStatus,
    createdAt: overrides.createdAt ?? '2026-05-14T10:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-14T10:00:00.000Z',
  };
}

export function createApprovedReviewFixture(overrides: ReviewFixtureOverrides = {}) {
  return createReviewFixture({ ...overrides, status: 'approved' });
}

export function createPendingReviewFixture(overrides: ReviewFixtureOverrides = {}) {
  return createReviewFixture({ ...overrides, status: 'pending' });
}

export function createRejectedReviewFixture(overrides: ReviewFixtureOverrides = {}) {
  return createReviewFixture({ ...overrides, status: 'rejected' });
}

export function createHiddenReviewFixture(overrides: ReviewFixtureOverrides = {}) {
  return createReviewFixture({ ...overrides, status: 'hidden' });
}

export function createReviewFixtures(count: number, overrides: ReviewFixtureOverrides = {}) {
  return Array.from({ length: count }, (_, index) =>
    createReviewFixture({
      ...overrides,
      id: overrides.id ? `${overrides.id}-${index + 1}` : `review-fixture-${index + 1}`,
      comment: overrides.comment ?? `Review aprobada ${index + 1}`,
    }),
  );
}
