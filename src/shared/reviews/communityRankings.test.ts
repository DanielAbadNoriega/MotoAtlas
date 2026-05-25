import { describe, expect, it } from 'vitest';
import { buildAllRankings, buildGlobalRanking, getPodiumEntries, RANKING_CATEGORIES } from './communityRankings';
import { bikeFixtures } from '../../test/fixtures/bikes';

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

    it('cada entrada tiene bike, score, reviews y keySignal', () => {
      const ranking = buildGlobalRanking(bikeFixtures);

      ranking.forEach((entry) => {
        expect(entry.bike).toBeDefined();
        expect(typeof entry.score).toBe('number');
        expect(entry.score).toBeGreaterThan(0);
        expect(typeof entry.reviews).toBe('number');
        expect(entry.reviews).toBeGreaterThanOrEqual(0);
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
  });
});
