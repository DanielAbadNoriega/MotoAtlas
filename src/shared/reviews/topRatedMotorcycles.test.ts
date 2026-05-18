import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../test/fixtures/bikes';
import {
  createApprovedReviewFixture,
  createHiddenReviewFixture,
  createPendingReviewFixture,
  createRejectedReviewFixture,
} from '../../test/fixtures/reviews';
import {
  buildTopRatedMotorcycles,
  calculateAverageRating,
  getApprovedReviewsForMotorcycle,
} from './topRatedMotorcycles';

describe('topRatedMotorcycles', () => {
  it('solo cuenta reviews approved para el ranking', () => {
    const reviews = [
      createApprovedReviewFixture({ rating: 5 }),
      createPendingReviewFixture({ rating: 1 }),
      createRejectedReviewFixture({ rating: 1 }),
      createHiddenReviewFixture({ rating: 1 }),
    ];

    expect(getApprovedReviewsForMotorcycle(reviews)).toHaveLength(1);
    expect(calculateAverageRating(getApprovedReviewsForMotorcycle(reviews))).toBe(5);
  });

  it('ordena por mejor valoración y desempata por número de reviews', () => {
    const ranking = buildTopRatedMotorcycles(bikeFixtures, {
      [bikeFixtures[0].id]: [createApprovedReviewFixture({ motorcycleId: bikeFixtures[0].id, rating: 5 })],
      [bikeFixtures[1].id]: [
        createApprovedReviewFixture({ id: 'aprilia-1', motorcycleId: bikeFixtures[1].id, rating: 5 }),
        createApprovedReviewFixture({ id: 'aprilia-2', motorcycleId: bikeFixtures[1].id, rating: 5 }),
      ],
    });

    expect(ranking[0].bike.id).toBe(bikeFixtures[1].id);
    expect(ranking[0].reviewCount).toBe(2);
    expect(ranking[0].badges).toContain('Mejor valorada');
  });

  it('filtra por segmento y carnet A2 compatible', () => {
    const reviewsById = Object.fromEntries(
      bikeFixtures.map((bike) => [bike.id, [createApprovedReviewFixture({ motorcycleId: bike.id, rating: 4 })]]),
    );

    const ranking = buildTopRatedMotorcycles(bikeFixtures, reviewsById, { license: 'A2', segment: 'trail' });

    expect(ranking.map((item) => item.bike.id)).toEqual([bikeFixtures[1].id]);
    expect(ranking[0].badges).toContain('A2 LIMITABLE');
  });

  it('permite ordenar por más reviews', () => {
    const ranking = buildTopRatedMotorcycles(
      bikeFixtures,
      {
        [bikeFixtures[0].id]: [createApprovedReviewFixture({ motorcycleId: bikeFixtures[0].id, rating: 5 })],
        [bikeFixtures[2].id]: [
          createApprovedReviewFixture({ id: 'mt-1', motorcycleId: bikeFixtures[2].id, rating: 4 }),
          createApprovedReviewFixture({ id: 'mt-2', motorcycleId: bikeFixtures[2].id, rating: 4 }),
          createApprovedReviewFixture({ id: 'mt-3', motorcycleId: bikeFixtures[2].id, rating: 4 }),
        ],
      },
      { sort: 'reviews' },
    );

    expect(ranking[0].bike.id).toBe(bikeFixtures[2].id);
    expect(ranking[0].reviewCount).toBe(3);
  });
});
