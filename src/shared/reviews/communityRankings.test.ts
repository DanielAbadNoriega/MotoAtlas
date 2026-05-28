import { describe, expect, it } from 'vitest';
import {
  applyAspectAdjustment,
  buildAllRankings,
  buildAspectSignalsByMotorcycleId,
  buildGlobalRanking,
  buildReviewSignalsByMotorcycleId,
  getPodiumEntries,
  getRankingConfidence,
  HIGH_CONFIDENCE_MIN_REVIEWS,
  MEDIUM_CONFIDENCE_MIN_REVIEWS,
  RANKING_CATEGORIES,
} from './communityRankings';
import { bikeFixtures } from '../../test/fixtures/bikes';
import {
  createApprovedReviewFixture,
  createPendingReviewFixture,
  createRejectedReviewFixture,
  createHiddenReviewFixture,
} from '../../test/fixtures/reviews';
import type { MotorcycleReviewAspect } from '../../services/motorcycleReviewService';

function createAspectFixture(overrides: Partial<MotorcycleReviewAspect> = {}): MotorcycleReviewAspect {
  return {
    reviewId: overrides.reviewId ?? 'review-1',
    category: overrides.category ?? 'engine',
    sentiment: overrides.sentiment ?? 'positive',
    comment: overrides.comment ?? null,
    ...overrides,
  };
}

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

    it('prioriza entries con confidence high si hay 3 o más', () => {
      const signals = {
        'test-bmw-f-900-gs': { motorcycleId: 'test-bmw-f-900-gs', reviewCount: 15, averageRating: 5 },
        'test-aprilia-tuareg-660': { motorcycleId: 'test-aprilia-tuareg-660', reviewCount: 12, averageRating: 4.5 },
        'test-yamaha-mt-09': { motorcycleId: 'test-yamaha-mt-09', reviewCount: 10, averageRating: 4.8 },
        'test-honda-nt1100': { motorcycleId: 'test-honda-nt1100', reviewCount: 3, averageRating: 4.2 },
      };

      const podium = getPodiumEntries(bikeFixtures, signals);

      expect(podium.length).toBe(3);
      expect(podium.every((e) => e.confidence === 'high')).toBe(true);
    });

    it('medium con score superior no se cuela si hay 3 high', () => {
      const signals = {
        'test-bmw-f-900-gs': { motorcycleId: 'test-bmw-f-900-gs', reviewCount: 15, averageRating: 5 },
        'test-aprilia-tuareg-660': { motorcycleId: 'test-aprilia-tuareg-660', reviewCount: 12, averageRating: 4.5 },
        'test-yamaha-mt-09': { motorcycleId: 'test-yamaha-mt-09', reviewCount: 10, averageRating: 4.8 },
      };

      const podium = getPodiumEntries(bikeFixtures, signals);

      const hondaInPodium = podium.some((e) => e.bike.id === 'test-honda-nt1100');
      expect(hondaInPodium).toBe(false);
    });

    it('si solo hay 2 high, rellena con medium', () => {
      const signals = {
        'test-bmw-f-900-gs': { motorcycleId: 'test-bmw-f-900-gs', reviewCount: 15, averageRating: 5 },
        'test-aprilia-tuareg-660': { motorcycleId: 'test-aprilia-tuareg-660', reviewCount: 12, averageRating: 4.5 },
        'test-honda-nt1100': { motorcycleId: 'test-honda-nt1100', reviewCount: 5, averageRating: 4.2 },
      };

      const podium = getPodiumEntries(bikeFixtures, signals);

      const highCount = podium.filter((e) => e.confidence === 'high').length;
      const mediumCount = podium.filter((e) => e.confidence === 'medium').length;
      expect(highCount).toBe(2);
      expect(mediumCount).toBe(1);
    });

    it('si no hay medium suficiente, rellena con low', () => {
      const signals = {
        'test-bmw-f-900-gs': { motorcycleId: 'test-bmw-f-900-gs', reviewCount: 15, averageRating: 5 },
        'test-aprilia-tuareg-660': { motorcycleId: 'test-aprilia-tuareg-660', reviewCount: 2, averageRating: 4.5 },
      };

      const podium = getPodiumEntries(bikeFixtures, signals);

      const highCount = podium.filter((e) => e.confidence === 'high').length;
      const lowCount = podium.filter((e) => e.confidence === 'low').length;
      expect(highCount).toBe(1);
      expect(lowCount).toBe(2);
    });

    it('no afecta buildAllRankings / CategoryCard', () => {
      const signals = {
        'test-bmw-f-900-gs': { motorcycleId: 'test-bmw-f-900-gs', reviewCount: 15, averageRating: 5 },
      };

      const rankings = buildAllRankings(bikeFixtures, signals);
      const globalRanking = rankings.find((r) => r.category.id === 'global');

      expect(globalRanking).toBeDefined();
      expect(globalRanking!.entries[0].bike.id).toBe('test-bmw-f-900-gs');
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
    it('reviewCount >= HIGH_CONFIDENCE_MIN_REVIEWS devuelve high', () => {
      expect(getRankingConfidence(HIGH_CONFIDENCE_MIN_REVIEWS)).toBe('high');
      expect(getRankingConfidence(15)).toBe('high');
    });

    it('reviewCount >= MEDIUM_CONFIDENCE_MIN_REVIEWS y < HIGH devuelve medium', () => {
      expect(getRankingConfidence(MEDIUM_CONFIDENCE_MIN_REVIEWS)).toBe('medium');
      expect(getRankingConfidence(5)).toBe('medium');
      expect(getRankingConfidence(9)).toBe('medium');
    });

    it('reviewCount < MEDIUM_CONFIDENCE_MIN_REVIEWS devuelve low', () => {
      expect(getRankingConfidence(0)).toBe('low');
      expect(getRankingConfidence(1)).toBe('low');
      expect(getRankingConfidence(2)).toBe('low');
    });

    it('valores muy grandes devuelven high (confianza absoluta, no relativa)', () => {
      expect(getRankingConfidence(200)).toBe('high');
      expect(getRankingConfidence(1_000_000)).toBe('high');
    });

    it('HIGH_CONFIDENCE_MIN_REVIEWS es 10', () => {
      expect(HIGH_CONFIDENCE_MIN_REVIEWS).toBe(10);
    });

    it('MEDIUM_CONFIDENCE_MIN_REVIEWS es 3', () => {
      expect(MEDIUM_CONFIDENCE_MIN_REVIEWS).toBe(3);
    });
  });

  describe('buildAspectSignalsByMotorcycleId', () => {
    it('agrupa aspects por motorcycleId', () => {
      const reviews = [
        createApprovedReviewFixture({ id: 'r1', motorcycleId: 'bike-1' }),
        createApprovedReviewFixture({ id: 'r2', motorcycleId: 'bike-1' }),
      ];
      const aspects = [
        createAspectFixture({ reviewId: 'r1', category: 'engine', sentiment: 'positive' }),
        createAspectFixture({ reviewId: 'r2', category: 'engine', sentiment: 'positive' }),
      ];

      const signals = buildAspectSignalsByMotorcycleId(reviews, aspects);

      expect(signals['bike-1'].engine).toBeDefined();
      expect(signals['bike-1'].engine?.positive).toBe(2);
      expect(signals['bike-1'].engine?.negative).toBe(0);
      expect(signals['bike-1'].engine?.total).toBe(2);
    });

    it('calcula positive/negative/total/score correctamente', () => {
      const reviews = [createApprovedReviewFixture({ id: 'r1', motorcycleId: 'bike-1' })];
      const aspects = [
        createAspectFixture({ reviewId: 'r1', category: 'engine', sentiment: 'positive' }),
        createAspectFixture({ reviewId: 'r1', category: 'engine', sentiment: 'positive' }),
        createAspectFixture({ reviewId: 'r1', category: 'engine', sentiment: 'negative' }),
      ];

      const signals = buildAspectSignalsByMotorcycleId(reviews, aspects);

      expect(signals['bike-1'].engine?.positive).toBe(2);
      expect(signals['bike-1'].engine?.negative).toBe(1);
      expect(signals['bike-1'].engine?.total).toBe(3);
      expect(signals['bike-1'].engine?.score).toBeCloseTo((2 - 1) / 3);
    });

    it('ignora aspects de reviews no approved', () => {
      const reviews = [
        createApprovedReviewFixture({ id: 'r1', motorcycleId: 'bike-1' }),
        createPendingReviewFixture({ id: 'r2', motorcycleId: 'bike-1' }),
      ];
      const aspects = [
        createAspectFixture({ reviewId: 'r1', category: 'engine', sentiment: 'positive' }),
        createAspectFixture({ reviewId: 'r2', category: 'engine', sentiment: 'negative' }),
      ];

      const signals = buildAspectSignalsByMotorcycleId(reviews, aspects);

      expect(signals['bike-1'].engine?.positive).toBe(1);
      expect(signals['bike-1'].engine?.negative).toBe(0);
    });

    it('ignora aspects con reviewId desconocido', () => {
      const reviews = [createApprovedReviewFixture({ id: 'r1', motorcycleId: 'bike-1' })];
      const aspects = [
        createAspectFixture({ reviewId: 'r1', category: 'engine', sentiment: 'positive' }),
        createAspectFixture({ reviewId: 'unknown', category: 'engine', sentiment: 'negative' }),
      ];

      const signals = buildAspectSignalsByMotorcycleId(reviews, aspects);

      expect(signals['bike-1'].engine?.positive).toBe(1);
      expect(signals['bike-1'].engine?.negative).toBe(0);
    });

    it('devuelve mapa vacío sin aspects', () => {
      const reviews = [createApprovedReviewFixture({ id: 'r1', motorcycleId: 'bike-1' })];
      const signals = buildAspectSignalsByMotorcycleId(reviews, []);
      expect(Object.keys(signals)).toHaveLength(0);
    });
  });

  describe('applyAspectAdjustment', () => {
    it('devuelve baseScore si no hay aspectSignals', () => {
      const result = applyAspectAdjustment(80, 'global', 'bike-1', {}, undefined);
      expect(result).toBe(80);
    });

    it('aplica ajuste positivo con aspectos positivos', () => {
      const reviewSignals = { 'bike-1': { motorcycleId: 'bike-1', reviewCount: 15, averageRating: 5 } };
      const aspectSignals = {
        'bike-1': {
          engine: { positive: 10, negative: 0, total: 10, score: 1 },
        },
      };

      const result = applyAspectAdjustment(80, 'global', 'bike-1', reviewSignals, aspectSignals);

      expect(result).toBeGreaterThan(80);
      expect(result).toBeLessThanOrEqual(85);
    });

    it('aplica ajuste negativo con aspectos negativos', () => {
      const reviewSignals = { 'bike-1': { motorcycleId: 'bike-1', reviewCount: 15, averageRating: 5 } };
      const aspectSignals = {
        'bike-1': {
          engine: { positive: 0, negative: 10, total: 10, score: -1 },
        },
      };

      const result = applyAspectAdjustment(80, 'global', 'bike-1', reviewSignals, aspectSignals);

      expect(result).toBeLessThan(80);
      expect(result).toBeGreaterThanOrEqual(75);
    });

    it('reduce ajuste al 35% si reviewCount < 3', () => {
      const reviewSignals = { 'bike-1': { motorcycleId: 'bike-1', reviewCount: 2, averageRating: 5 } };
      const aspectSignals = {
        'bike-1': {
          engine: { positive: 10, negative: 0, total: 10, score: 1 },
        },
      };

      const fullAdjustment = applyAspectAdjustment(80, 'global', 'bike-1', { 'bike-1': { motorcycleId: 'bike-1', reviewCount: 15, averageRating: 5 } }, aspectSignals);
      const reducedAdjustment = applyAspectAdjustment(80, 'global', 'bike-1', reviewSignals, aspectSignals);

      expect(reducedAdjustment).toBeLessThan(fullAdjustment);
    });

    it('reduce ajuste al 70% si 3 <= reviewCount < 10', () => {
      const reviewSignals = { 'bike-1': { motorcycleId: 'bike-1', reviewCount: 5, averageRating: 5 } };
      const aspectSignals = {
        'bike-1': {
          engine: { positive: 10, negative: 0, total: 10, score: 1 },
        },
      };

      const result = applyAspectAdjustment(80, 'global', 'bike-1', reviewSignals, aspectSignals);
      expect(result).toBeGreaterThan(80);

      const highConfidenceResult = applyAspectAdjustment(80, 'global', 'bike-1', { 'bike-1': { motorcycleId: 'bike-1', reviewCount: 15, averageRating: 5 } }, aspectSignals);
      expect(result).toBeLessThan(highConfidenceResult);
    });

    it('devuelve baseScore si no hay aspects para la moto', () => {
      const reviewSignals = { 'bike-2': { motorcycleId: 'bike-2', reviewCount: 15, averageRating: 5 } };
      const aspectSignals = {
        'bike-1': {
          engine: { positive: 10, negative: 0, total: 10, score: 1 },
        },
      };

      const result = applyAspectAdjustment(80, 'global', 'bike-2', reviewSignals, aspectSignals);
      expect(result).toBe(80);
    });

    it('no supera +/- 5 puntos', () => {
      const reviewSignals = { 'bike-1': { motorcycleId: 'bike-1', reviewCount: 20, averageRating: 5 } };
      const aspectSignals = {
        'bike-1': {
          engine: { positive: 100, negative: 0, total: 100, score: 1 },
        },
      };

      const result = applyAspectAdjustment(80, 'global', 'bike-1', reviewSignals, aspectSignals);
      expect(result).toBeLessThanOrEqual(85);
      expect(result).toBeGreaterThanOrEqual(75);
    });
  });

  describe('clampRankingScore', () => {
    it('buildGlobalRanking nunca devuelve entries con score > 100', () => {
      const ranking = buildGlobalRanking(bikeFixtures);
      ranking.forEach((entry) => {
        expect(entry.score).toBeLessThanOrEqual(100);
      });
    });

    it('buildAllRankings nunca devuelve entries con score > 100', () => {
      const rankings = buildAllRankings(bikeFixtures);
      rankings.forEach((ranking) => {
        ranking.entries.forEach((entry) => {
          expect(entry.score).toBeLessThanOrEqual(100);
        });
      });
    });

    it('getPodiumEntries nunca devuelve entries con score > 100', () => {
      const podium = getPodiumEntries(bikeFixtures);
      podium.forEach((entry) => {
        expect(entry.score).toBeLessThanOrEqual(100);
      });
    });

    it('buildCategoryRanking clampa score > 100 a 100', () => {
      const rankings = buildAllRankings(bikeFixtures);
      rankings.forEach((ranking) => {
        ranking.entries.forEach((entry) => {
          expect(entry.score).toBeLessThanOrEqual(100);
          expect(entry.score).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});
