import { describe, expect, it } from 'vitest';
import seedMotorcycles from '../../../data/import/motorcycles.json';
import type { Bike } from '../../types/bike';
import { PLACEHOLDER_DESCRIPTION, PLACEHOLDER_IMAGE_URL, normalizeMotorcycle } from './normalizeMotorcycle';

const existingMotorcycle = seedMotorcycles[0] as Bike;

describe('normalizeMotorcycle', () => {
  it('mantiene los datos internos camelCase cuando ya vienen en formato MotoAtlas', () => {
    const result = normalizeMotorcycle(existingMotorcycle);

    expect(result.motorcycle).toMatchObject({
      brand: 'BMW',
      displacementCc: 895,
      engineType: 'parallel-twin',
      id: 'bmw-f-900-gs-2024',
      model: 'F 900 GS',
      priceEur: 13950,
      useScores: existingMotorcycle.useScores,
      year: 2024,
    });
    expect(result.warnings).toHaveLength(0);
  });

  it('convierte datos de API Ninjas al formato interno y rellena placeholders controlados', () => {
    const result = normalizeMotorcycle(
      {
        displacement: '948 cc',
        engine: 'In-line four, four-stroke',
        fuel_capacity: '17 litres',
        make: 'Kawasaki',
        model: 'Z900',
        power: '125 HP',
        seat_height: '820 mm',
        torque: '98.6 Nm',
        total_weight: '213 kg',
        type: 'Naked bike',
        year: '2024',
      },
      { allowPlaceholders: true },
    );

    expect(result.motorcycle).toMatchObject({
      brand: 'Kawasaki',
      description: PLACEHOLDER_DESCRIPTION,
      displacementCc: 948,
      engineType: 'inline-four',
      fuelTankLiters: 17,
      id: 'kawasaki-z900-2024',
      imageUrl: PLACEHOLDER_IMAGE_URL,
      license: 'A',
      model: 'Z900',
      powerHp: 125,
      priceEur: 0,
      priceSource: 'placeholder',
      segment: 'naked',
      imageSource: 'placeholder',
      scoresSource: 'estimated',
      useScores: expect.objectContaining({ city: 8, sport: 8 }),
      year: 2024,
    });
    expect(result.warnings.map((warning) => warning.field)).toEqual(
      expect.arrayContaining(['price_eur', 'image_url', 'description', 'use_scores']),
    );
  });

  it('conserva valores existentes cuando la API no trae precio, imagen, descripción o scores', () => {
    const result = normalizeMotorcycle(
      {
        displacement: '895 cc',
        engine: 'Twin, four-stroke',
        make: 'BMW',
        model: 'F 900 GS',
        power: '105 HP',
        year: 2024,
      },
      { allowPlaceholders: true, existingMotorcycle },
    );

    expect(result.motorcycle.priceEur).toBe(existingMotorcycle.priceEur);
    expect(result.motorcycle.imageUrl).toBe(existingMotorcycle.imageUrl);
    expect(result.motorcycle.description).toBe(existingMotorcycle.description);
    expect(result.motorcycle.useScores).toEqual(existingMotorcycle.useScores);
    expect(result.warnings.map((warning) => warning.field)).not.toEqual(expect.arrayContaining(['price_eur', 'image_url']));
  });

  it('interpreta números externos con separador de miles', () => {
    const result = normalizeMotorcycle(
      {
        displacement: '1,084 cc',
        engine: 'Twin, four-stroke',
        make: 'Honda',
        model: 'Africa Twin 1100',
        power: '102 HP',
        year: 2024,
      },
      { allowPlaceholders: true },
    );

    expect(result.motorcycle.displacementCc).toBe(1084);
  });

  it('infiere compatibilidad A2 limitable y fuentes de datos controladas', () => {
    const input = {
      ...existingMotorcycle,
      imageUrl: '',
      powerHp: 80,
      priceEur: 0,
    } as Record<string, unknown>;
    delete input.isA2Compatible;
    delete input.isA2LimitedVersion;
    delete input.limitedPowerHp;
    delete input.originalPowerHp;

    const result = normalizeMotorcycle(
      input,
      { allowPlaceholders: true },
    );

    expect(result.motorcycle).toMatchObject({
      imageSource: 'placeholder',
      isA2Compatible: true,
      isA2LimitedVersion: true,
      limitedPowerHp: 47.6,
      originalPowerHp: 80,
      priceSource: 'placeholder',
    });
  });
});
