import { describe, expect, it } from 'vitest';
import seedMotorcycles from '../../../data/import/motorcycles.json';
import type { Bike } from '../../types/bike';
import { buildMotorcyclePayload, buildSeedId, findExistingMotorcycle } from './importUtils';

const completeMotorcycle = seedMotorcycles[0] as Bike;

describe('importUtils', () => {
  it('genera payload final compatible con Supabase en snake_case', () => {
    const payload = buildMotorcyclePayload(completeMotorcycle);

    expect(payload).toMatchObject({
      abs_cornering: true,
      common_issues: completeMotorcycle.reliabilityReports.commonIssues,
      displacement_cc: 895,
      engine_type: 'parallel-twin',
      fuel_tank_liters: 14.5,
      image_url: expect.stringContaining('https://'),
      price_eur: 13950,
      reliability_score: 8.2,
      report_count: 124,
      use_scores: completeMotorcycle.useScores,
      wet_weight_kg: 219,
    });
    expect(payload).not.toHaveProperty('engineType');
    expect(payload).not.toHaveProperty('reliabilityReports');
  });

  it('normaliza ids de seeds y localiza motos existentes', () => {
    const seed = { make: 'Yamaha', model: 'Ténéré 700', year: 2024 };

    expect(buildSeedId(seed)).toBe('yamaha-tenere-700-2024');
    expect(findExistingMotorcycle(seed, seedMotorcycles as readonly Bike[])?.id).toBe('yamaha-tenere-700-2024');
  });
});
