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
    expect(result.invalidItems[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'brand', message: 'brand es obligatorio y debe ser texto no vacío.' }),
        expect.objectContaining({ field: 'engine_type', message: 'engine_type es obligatorio y debe ser válido.' }),
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

  it('normaliza strings numéricos como "895 cc" antes de validar', () => {
    const result = validateMotorcycleImport([{ ...completeMotorcycle, displacementCc: '895 cc' }]);

    expect(result.valid).toBe(true);
    expect(result.validItems[0].motorcycle?.displacementCc).toBe(895);
  });

  it('rechaza displacement 0 porque Supabase exige un valor mayor que 0', () => {
    const result = validateMotorcycleImport([{ ...completeMotorcycle, displacementCc: 0 }]);

    expect(result.valid).toBe(false);
    expect(result.invalidItems[0].errors).toContainEqual(
      expect.objectContaining({
        field: 'displacement_cc',
        message: 'displacement_cc debe ser mayor que 0.',
        receivedValue: 0,
      }),
    );
  });

  it('rechaza displacement null porque no es un número útil', () => {
    const result = validateMotorcycleImport([{ ...completeMotorcycle, displacementCc: null }]);

    expect(result.valid).toBe(false);
    expect(result.invalidItems[0].errors).toContainEqual(
      expect.objectContaining({
        field: 'displacement_cc',
        message: 'displacement_cc es obligatorio y debe ser numérico.',
        receivedValue: null,
      }),
    );
  });

  it('rechaza strings externos tipo "N/A" porque no contienen número útil', () => {
    const result = validateMotorcycleImport([{ ...completeMotorcycle, displacementCc: 'N/A' }]);

    expect(result.valid).toBe(false);
    expect(result.invalidItems[0].errors).toContainEqual(
      expect.objectContaining({
        field: 'displacement_cc',
        message: 'displacement_cc es obligatorio y debe ser numérico.',
        receivedValue: 'N/A',
      }),
    );
  });

  it('rechaza campos técnicos que no sean mayores que 0', () => {
    const result = validateMotorcycleImport([
      {
        ...completeMotorcycle,
        fuelTankLiters: 0,
        powerHp: 0,
        seatHeightMm: 0,
        torqueNm: 0,
        wetWeightKg: 0,
      },
    ]);

    expect(result.valid).toBe(false);
    expect(result.invalidItems[0].errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['power_hp', 'torque_nm', 'wet_weight_kg', 'seat_height_mm', 'fuel_tank_liters']),
    );
  });

  it('permite price_eur 0 pero lo marca como placeholder', () => {
    const result = validateMotorcycleImport([{ ...completeMotorcycle, priceEur: 0 }]);

    expect(result.valid).toBe(true);
    expect(result.payload[0].price_source).toBe('placeholder');
    expect(result.validItems[0].warnings).toContainEqual(
      expect.objectContaining({
        field: 'price_eur',
        message: 'Precio 0 detectado: se acepta como placeholder y debe revisarse manualmente.',
      }),
    );
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
    expect(result.errors.some((error) => error.includes('use_scores.funFactor es obligatorio y debe ser numérico.'))).toBe(true);
  });

  it('rechaza procedencias de datos inválidas', () => {
    const result = validateMotorcycleImport([{ ...completeMotorcycle, specsSource: 'scraped' }]);

    expect(result.valid).toBe(false);
    expect(result.invalidItems[0].errors).toContainEqual(
      expect.objectContaining({
        field: 'specs_source',
        message: 'specs_source debe tener una procedencia válida.',
        receivedValue: 'scraped',
      }),
    );
  });
});
