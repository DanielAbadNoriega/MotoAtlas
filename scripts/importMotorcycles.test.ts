import { describe, expect, it, vi } from 'vitest';
import seedMotorcycles from '../data/import/motorcycles.json';
import type { Bike } from '../src/types/bike';
import {
  buildMotorcyclePayload,
  importMotorcycles,
  validateMotorcycleImport,
  type SupabaseMotorcycleClient,
} from './importMotorcycles';

const completeMotorcycle = seedMotorcycles[0] as Bike;

describe('importMotorcycles validation', () => {
  it('validates the initial JSON seed motorcycles', () => {
    const result = validateMotorcycleImport(seedMotorcycles);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.motorcycles).toHaveLength(5);
    expect(result.motorcycles.map((motorcycle) => `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year}`)).toEqual([
      'BMW F 900 GS 2024',
      'Yamaha Ténéré 700 2024',
      'Aprilia Tuareg 660 2024',
      'Honda XL750 Transalp 2024',
      'Honda Africa Twin 1100 2024',
    ]);
  });

  it('rejects incomplete motorcycles before inserting', () => {
    const invalidMotorcycle = { ...completeMotorcycle } as Record<string, unknown>;
    delete invalidMotorcycle.brand;

    const result = validateMotorcycleImport([invalidMotorcycle]);

    expect(result.valid).toBe(false);
    expect(result.motorcycles).toHaveLength(0);
    expect(result.errors).toContain('motorcycles[0].brand es obligatorio.');
  });

  it('rejects motorcycles with incomplete nested required fields', () => {
    const invalidMotorcycle = {
      ...completeMotorcycle,
      useScores: {
        ...completeMotorcycle.useScores,
        funFactor: undefined,
      },
    };

    const result = validateMotorcycleImport([invalidMotorcycle]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('motorcycles[0].useScores.funFactor debe ser numérico.');
  });
});

describe('importMotorcycles payload', () => {
  it('generates a Supabase-compatible snake_case payload', () => {
    const payload = buildMotorcyclePayload(completeMotorcycle);

    expect(payload).toMatchObject({
      id: 'bmw-f-900-gs-2024',
      engine_type: 'parallel-twin',
      displacement_cc: 895,
      power_hp: 105,
      wet_weight_kg: 219,
      seat_height_mm: 870,
      fuel_tank_liters: 14.5,
      price_eur: 13950,
      image_url: expect.stringContaining('https://'),
      abs_cornering: true,
      traction_control: true,
      riding_modes: true,
      cruise_control: false,
      heated_grips: false,
      tubeless_wheels: false,
      common_issues: ['Calor percibido en conducción lenta', 'Coste alto de recambios y extras'],
      report_count: 124,
      reliability_score: 8.2,
    });
    expect(payload).not.toHaveProperty('engineType');
    expect(payload).not.toHaveProperty('reliabilityReports');
  });

  it('upserts using id without connecting to real Supabase', async () => {
    const select = vi.fn().mockResolvedValue({
      data: seedMotorcycles.map((motorcycle) => ({ id: motorcycle.id })),
      error: null,
    });
    const upsert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ upsert });
    const supabase = { from } as unknown as SupabaseMotorcycleClient;
    const logger = { error: vi.fn(), log: vi.fn() };

    const result = await importMotorcycles({ logger, rawMotorcycles: seedMotorcycles, supabase });

    expect(result).toEqual({ importedCount: 5, readCount: 5 });
    expect(from).toHaveBeenCalledWith('motorcycles');
    expect(upsert).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'bmw-f-900-gs-2024' })]), {
      onConflict: 'id',
    });
    expect(select).toHaveBeenCalledWith('id');
    expect(logger.log).toHaveBeenCalledWith('📦 Motos leídas: 5');
    expect(logger.log).toHaveBeenCalledWith('✅ Motos importadas: 5');
  });
});
