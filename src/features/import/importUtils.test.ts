import { describe, expect, it } from 'vitest';
import seedMotorcycles from '../../../data/import/motorcycles.json';
import type { Bike } from '../../types/bike';
import { buildMotorcyclePayload, buildSeedId, findExistingMotorcycle } from './importUtils';

const completeMotorcycle = seedMotorcycles[0] as Bike;

describe('importUtils', () => {
  it('genera payload final compatible con Supabase en snake_case', () => {
    const payload = buildMotorcyclePayload(completeMotorcycle);

    expect(payload).toMatchObject({
      abs_cornering: completeMotorcycle.features.absCornering,
      common_issues: completeMotorcycle.reliabilityReports.commonIssues,
      displacement_cc: completeMotorcycle.displacementCc,
      engine_type: completeMotorcycle.engineType,
      fuel_tank_liters: completeMotorcycle.fuelTankLiters,
      image_url: completeMotorcycle.imageUrl,
      price_eur: completeMotorcycle.priceEur,
      reliability_score: completeMotorcycle.reliabilityReports.reliabilityScore,
      report_count: completeMotorcycle.reliabilityReports.reportCount,
      use_scores: completeMotorcycle.useScores,
      wet_weight_kg: completeMotorcycle.wetWeightKg,
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
