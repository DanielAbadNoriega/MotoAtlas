import { describe, expect, it, vi } from 'vitest';
import seedMotorcycles from '../data/import/motorcycles.json';
import type { Bike } from '../src/types/bike';
import { fetchMotorcyclesFromApi } from './fetchMotorcyclesFromApi';

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

describe('fetchMotorcyclesFromApi script', () => {
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
  });
});
