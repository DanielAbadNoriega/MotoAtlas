import { describe, expect, it, vi } from 'vitest';
import seedMotorcycles from '../data/import/motorcycles.json';
import type { Bike } from '../src/types/bike';
import { dedupeMotorcycleSeeds, fetchMotorcyclesFromApi } from './fetchMotorcyclesFromApi';

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

describe('fetchMotorcyclesFromApi script', () => {
  it('deduplica seeds para escalar el catálogo sin consultas repetidas', () => {
    expect(
      dedupeMotorcycleSeeds([
        { make: 'BMW', model: 'F 900 GS', year: 2024 },
        { make: 'bmw', model: 'f 900 gs', year: 2024 },
        { make: 'BMW', model: 'R 1300 GS', year: 2024 },
      ]),
    ).toEqual([
      { make: 'BMW', model: 'F 900 GS', year: 2024 },
      { make: 'BMW', model: 'R 1300 GS', year: 2024 },
    ]);
  });

  it('sale sin error crítico ni conexión externa si no hay API_NINJAS_KEY', async () => {
    const fetchImpl = vi.fn();
    const logger = createLogger();

    const result = await fetchMotorcyclesFromApi({ env: {}, fetchImpl: fetchImpl as unknown as typeof fetch, logger });

    expect(result).toMatchObject({ fetchedCount: 0, generatedCount: 0, skipped: true });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      'ℹ️ API_NINJAS_KEY no configurada. Se omite el enriquecimiento externo sin error crítico.',
    );
  });

  it('usa API mockeada, conserva fallbacks existentes y escribe motorcycles.generated.json', async () => {
    const logger = createLogger();
    const writeFetchReport = vi.fn().mockResolvedValue(undefined);
    const writeGeneratedMotorcycles = vi.fn().mockResolvedValue(undefined);
    const fetchImpl = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([
        {
          displacement: '895 cc',
          engine: 'Twin, four-stroke',
          fuel_capacity: '14.5 litres',
          make: 'BMW',
          model: 'F 900 GS',
          power: '105 HP',
          seat_height: '870 mm',
          torque: '93 Nm',
          total_weight: '219 kg',
          type: 'Enduro / offroad',
          year: '2024',
        },
      ]),
      ok: true,
      text: vi.fn(),
    });

    const result = await fetchMotorcyclesFromApi({
      env: { API_NINJAS_KEY: 'test-key' },
      existingMotorcycles: seedMotorcycles as readonly Bike[],
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger,
      seedList: [{ make: 'BMW', model: 'F 900 GS', year: 2024 }],
      writeFetchReport,
      writeGeneratedMotorcycles,
    });

    expect(result).toMatchObject({ fetchedCount: 1, generatedCount: 1, skipped: false });
    expect(fetchImpl).toHaveBeenCalledWith(expect.any(URL), { headers: { 'X-Api-Key': 'test-key' } });
    expect(writeGeneratedMotorcycles).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          description: seedMotorcycles[0].description,
          id: 'bmw-f-900-gs-2024',
          imageUrl: seedMotorcycles[0].imageUrl,
          priceEur: seedMotorcycles[0].priceEur,
          useScores: seedMotorcycles[0].useScores,
        }),
      ],
      expect.any(URL),
    );
    expect(writeFetchReport).toHaveBeenCalledWith(
      expect.objectContaining({
        failedCount: 0,
        generatedCount: 1,
        totalSeedsRead: 1,
        uniqueSeeds: 1,
      }),
      expect.any(URL),
    );
  });

  it('continúa si una seed falla, guarda solo motos válidas y genera reporte de fallidas', async () => {
    const logger = createLogger();
    const writeFetchReport = vi.fn().mockResolvedValue(undefined);
    const writeGeneratedMotorcycles = vi.fn().mockResolvedValue(undefined);
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue([
          {
            make: 'BMW',
            model: 'R 1250 RT',
            year: '2024',
          },
        ]),
        ok: true,
        text: vi.fn(),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue([
          {
            displacement: '895 cc',
            engine: 'Twin, four-stroke',
            fuel_capacity: '14.5 litres',
            make: 'BMW',
            model: 'F 900 GS',
            power: '105 HP',
            seat_height: '870 mm',
            torque: '93 Nm',
            total_weight: '219 kg',
            type: 'Enduro / offroad',
            year: '2024',
          },
        ]),
        ok: true,
        text: vi.fn(),
      });

    const result = await fetchMotorcyclesFromApi({
      env: { API_NINJAS_KEY: 'test-key' },
      existingMotorcycles: [],
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger,
      seedList: [
        { make: 'BMW', model: 'R 1250 RT', year: 2024 },
        { make: 'BMW', model: 'F 900 GS', year: 2024 },
      ],
      writeFetchReport,
      writeGeneratedMotorcycles,
    });

    expect(result).toMatchObject({ failedCount: 1, generatedCount: 1, processedCount: 2, skipped: false });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(writeGeneratedMotorcycles).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'bmw-f-900-gs-2024',
          displacementCc: 895,
          powerHp: 105,
        }),
      ],
      expect.any(URL),
    );
    expect(writeGeneratedMotorcycles.mock.calls[0][0]).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'bmw-r-1250-rt-2024' })]),
    );

    const report = writeFetchReport.mock.calls[0][0];
    expect(report).toMatchObject({
      failedCount: 1,
      generatedCount: 1,
      totalSeedsRead: 2,
      uniqueSeeds: 2,
    });
    expect(report.failedMotorcycles[0]).toMatchObject({
      make: 'BMW',
      model: 'R 1250 RT',
      year: 2024,
    });
    expect(report.failedMotorcycles[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'displacement_cc' }),
        expect.objectContaining({ field: 'power_hp' }),
      ]),
    );
    expect(report.failedMotorcycles[0].warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'displacement_cc' }),
        expect.objectContaining({ field: 'power_hp' }),
      ]),
    );
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('BMW R 1250 RT 2024 · displacement_cc'));
    expect(logger.log).toHaveBeenCalledWith('❌ Fallidas: 1');
  });
});
