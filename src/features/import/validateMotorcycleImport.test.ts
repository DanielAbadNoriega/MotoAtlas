import { describe, expect, it } from 'vitest';
import seedMotorcycles from '../../../data/import/motorcycles.json';
import type { Bike } from '../../types/bike';
import { buildMotorcyclePayload } from './importUtils';
import { validateMotorcycleImport } from './validateMotorcycleImport';

const completeMotorcycle = seedMotorcycles[0] as Bike;

describe('validateMotorcycleImport', () => {
  it('acepta una moto completa en formato MotoAtlas', () => {
    const result = validateMotorcycleImport([completeMotorcycle]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.validItems[0].motorcycle).toMatchObject({
      brand: 'BMW',
      id: 'bmw-f-900-gs-2024',
      model: 'F 900 GS',
    });
  });

  it('rechaza una moto incompleta con errores claros en snake_case', () => {
    const invalidMotorcycle = { ...completeMotorcycle } as Record<string, unknown>;
    delete invalidMotorcycle.brand;
    delete invalidMotorcycle.engineType;

    const result = validateMotorcycleImport([invalidMotorcycle]);

    expect(result.valid).toBe(false);
    expect(result.invalidItems).toHaveLength(1);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'motorcycles[0].brand es obligatorio y debe ser texto no vacío.',
        'motorcycles[0].engine_type es obligatorio y debe ser válido.',
      ]),
    );
  });

  it('acepta payload snake_case compatible con Supabase', () => {
    const payload = buildMotorcyclePayload(completeMotorcycle);
    const result = validateMotorcycleImport([payload]);

    expect(result.valid).toBe(true);
    expect(result.payload[0]).toMatchObject({
      displacement_cc: 895,
      engine_type: 'parallel-twin',
      id: 'bmw-f-900-gs-2024',
      use_scores: completeMotorcycle.useScores,
    });
  });

  it('rechaza scores incompletos', () => {
    const invalidMotorcycle = {
      ...completeMotorcycle,
      useScores: {
        ...completeMotorcycle.useScores,
        funFactor: undefined,
      },
    };

    const result = validateMotorcycleImport([invalidMotorcycle]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('motorcycles[0].use_scores.funFactor es obligatorio y debe ser numérico.');
  });
});
