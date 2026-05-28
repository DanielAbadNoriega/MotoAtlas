import { describe, expect, it } from 'vitest';
import {
  buildAllRankings,
  buildGlobalRanking,
  buildReviewSignalsByMotorcycleId,
  getPodiumEntries,
  getRankingConfidence,
  RANKING_CATEGORIES,
} from './communityRankings';
import { bikeFixtures } from '../../test/fixtures/bikes';
import {
  createApprovedReviewFixture,
  createPendingReviewFixture,
  createRejectedReviewFixture,
  createHiddenReviewFixture,
} from '../../test/fixtures/reviews';

describe('communityRankings', () => {
  describe('RANKING_CATEGORIES', () => {
    it('tiene exactamente 8 categorías', () => {
      expect(RANKING_CATEGORIES).toHaveLength(8);
    });

    it('cada categoría tiene id, label, description, icon y tag', () => {
      RANKING_CATEGORIES.forEach((category) => {
        expect(category.id).toBeDefined();
        expect(category.label).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(category.tag).toBeDefined();
      });
    });

    it('los ids de categoría son únicos', () => {
      const ids = RANKING_CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('buildGlobalRanking', () => {
    it('devuelve un array de entradas ordenadas por score descendente', () => {
      const ranking = buildGlobalRanking(bikeFixtures);

      expect(ranking.length).toBeGreaterThan(0);

      for (let i = 1; i < ranking.length; i++) {
        expect(ranking[i - 1].score).toBeGreaterThanOrEqual(ranking[i].score);
      }
    });

    it('cada entrada tiene bike, score, reviews, reviewCount, averageRating, confidence y keySignal', () => {
      const ranking = buildGlobalRanking(bikeFixtures);

      ranking.forEach((entry) => {
        expect(entry.bike).toBeDefined();
        expect(typeof entry.score).toBe('number');
        expect(entry.score).toBeGreaterThan(0);
        expect(typeof entry.reviews).toBe('number');
        expect(entry.reviews).toBeGreaterThanOrEqual(0);
        expect(typeof entry.reviewCount).toBe('number');
        expect(entry.reviewCount).toBeGreaterThanOrEqual(0);
        expect(entry.averageRating).toBeNull();
        expect(entry.confidence).toBe('low');
        expect(typeof entry.keySignal).toBe('string');
        expect(entry.keySignal.length).toBeGreaterThan(0);
      });
    });

    it('excluye motos sin datos válidos (score negativo)', () => {
      const ranking = buildGlobalRanking(bikeFixtures);

      ranking.forEach((entry) => {
        expect(entry.score).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getPodiumEntries', () => {
    it('devuelve exactamente 3 entradas para el podium', () => {
      const podium = getPodiumEntries(bikeFixtures);

      expect(podium).toHaveLength(3);
    });

    it('las 3 primeras entradas son las mejor puntuadas', () => {
      const fullRanking = buildGlobalRanking(bikeFixtures);
      const podium = getPodiumEntries(bikeFixtures);

      expect(podium[0].bike.id).toBe(fullRanking[0].bike.id);
      expect(podium[1].bike.id).toBe(fullRanking[1].bike.id);
      expect(podium[2].bike.id).toBe(fullRanking[2].bike.id);
    });
  });

  describe('buildAllRankings', () => {
    it('devuelve exactamente 8 rankings (uno por categoría)', () => {
      const rankings = buildAllRankings(bikeFixtures);

      expect(rankings).toHaveLength(8);
    });

    it('cada ranking tiene category y entries', () => {
      const rankings = buildAllRankings(bikeFixtures);

      rankings.forEach((ranking) => {
        expect(ranking.category).toBeDefined();
        expect(Array.isArray(ranking.entries)).toBe(true);
      });
    });

    it('todas las categorías tienenentries con al menos 1 moto', () => {
      const rankings = buildAllRankings(bikeFixtures);

      rankings.forEach((ranking) => {
        expect(ranking.entries.length).toBeGreaterThan(0);
      });
    });

    it('el ranking global tiene las bikes ordenadas por score', () => {
      const rankings = buildAllRankings(bikeFixtures);
      const globalRanking = rankings.find((r) => r.category.id === 'global');

      expect(globalRanking).toBeDefined();

      if (globalRanking && globalRanking.entries.length > 1) {
        for (let i = 1; i < globalRanking.entries.length; i++) {
          expect(globalRanking.entries[i - 1].score).toBeGreaterThanOrEqual(globalRanking.entries[i].score);
        }
      }
    });

    it('el ranking A2 excluye motos sin compatibilidad A2 cuando no la tienen', () => {
      const rankings = buildAllRankings(bikeFixtures);
      const a2Ranking = rankings.find((r) => r.category.id === 'a2');

      expect(a2Ranking).toBeDefined();

      a2Ranking?.entries.forEach((entry) => {
        const isA2 = entry.bike.license === 'A2' || entry.bike.isA2Compatible === true;
        expect(isA2).toBe(true);
      });
    });

    it('usa reviewCount real cuando se pasan reviewSignals', () => {
      const signals = {
        'test-bmw-f-900-gs': { motorcycleId: 'test-bmw-f-900-gs', reviewCount: 15, averageRating: 4.5 },
      };
      const ranking = buildGlobalRanking(bikeFixtures, signals);

      const bmwEntry = ranking.find((e) => e.bike.id === 'test-bmw-f-900-gs');
      expect(bmwEntry?.reviewCount).toBe(15);
      expect(bmwEntry?.reviews).toBe(15);
      expect(bmwEntry?.averageRating).toBe(4.5);
      expect(bmwEntry?.confidence).toBe('high');
    });

    it('fallback no rompe cuando no hay signals', () => {
      const ranking = buildGlobalRanking(bikeFixtures, undefined);
      expect(ranking.length).toBeGreaterThan(0);
      ranking.forEach((entry) => {
        expect(entry.reviewCount).toBe(0);
        expect(entry.confidence).toBe('low');
      });
    });
  });

  describe('buildReviewSignalsByMotorcycleId', () => {
    it('agrupa y cuenta reviews approved por motorcycleId', () => {
      const reviews = [
        createApprovedReviewFixture({ motorcycleId: 'bike-1', rating: 5 }),
        createApprovedReviewFixture({ motorcycleId: 'bike-1', rating: 4 }),
        createApprovedReviewFixture({ motorcycleId: 'bike-2', rating: 3 }),
      ];

      const signals = buildReviewSignalsByMotorcycleId(reviews);

      expect(signals['bike-1'].reviewCount).toBe(2);
      expect(signals['bike-2'].reviewCount).toBe(1);
    });

    it('calcula averageRating correctamente', () => {
      const reviews = [
        createApprovedReviewFixture({ motorcycleId: 'bike-1', rating: 5 }),
        createApprovedReviewFixture({ motorcycleId: 'bike-1', rating: 3 }),
      ];

      const signals = buildReviewSignalsByMotorcycleId(reviews);

      expect(signals['bike-1'].averageRating).toBe(4.0);
    });

    it('ignora reviews pending, rejected y hidden', () => {
      const reviews = [
        createApprovedReviewFixture({ motorcycleId: 'bike-1' }),
        createPendingReviewFixture({ motorcycleId: 'bike-1' }),
        createRejectedReviewFixture({ motorcycleId: 'bike-1' }),
        createHiddenReviewFixture({ motorcycleId: 'bike-1' }),
      ];

      const signals = buildReviewSignalsByMotorcycleId(reviews);

      expect(signals['bike-1'].reviewCount).toBe(1);
    });

    it('devuelve averageRating null si no hay reviews', () => {
      const signals = buildReviewSignalsByMotorcycleId([]);
      expect(Object.keys(signals)).toHaveLength(0);
    });
  });

  describe('getRankingConfidence', () => {
    it('reviewCount >= 10 devuelve high', () => {
      expect(getRankingConfidence(10)).toBe('high');
      expect(getRankingConfidence(15)).toBe('high');
    });

    it('reviewCount >= 3 y < 10 devuelve medium', () => {
      expect(getRankingConfidence(3)).toBe('medium');
      expect(getRankingConfidence(5)).toBe('medium');
      expect(getRankingConfidence(9)).toBe('medium');
    });

    it('reviewCount < 3 devuelve low', () => {
      expect(getRankingConfidence(0)).toBe('low');
      expect(getRankingConfidence(1)).toBe('low');
      expect(getRankingConfidence(2)).toBe('low');
    });
  });
});
