import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import seedMotorcycles from '../data/import/motorcycles.json';
import type { Bike } from '../src/types/bike';
import {
  generateModelVariants,
  generateRepairSearchQueries,
  getInvalidTechnicalFields,
  repairMotorcycleData,
} from './repairMotorcycleData';

const validMotorcycle = seedMotorcycles[0] as Bike;
const tempDirs: string[] = [];

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

async function createTempOutputUrls() {
  const directory = await mkdtemp(path.join(tmpdir(), 'motoatlas-repair-'));
  tempDirs.push(directory);

  return {
    repairedFileUrl: new URL(`file://${path.join(directory, 'motorcycles.repaired.json')}`),
    reportFileUrl: new URL(`file://${path.join(directory, 'motorcycles.repair-report.json')}`),
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('repairMotorcycleData helpers', () => {
  it('detecta campos técnicos inválidos', () => {
    const invalidFields = getInvalidTechnicalFields({
      ...validMotorcycle,
      displacementCc: 0,
      powerHp: 'N/A',
      torqueNm: null,
    });

    expect(invalidFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'displacement_cc', value: 0 }),
        expect.objectContaining({ field: 'power_hp', value: 'N/A' }),
        expect.objectContaining({ field: 'torque_nm', value: null }),
      ]),
    );
  });

  it('genera variantes de búsqueda normalizadas', () => {
    expect(generateModelVariants('800MT-X')).toEqual(expect.arrayContaining(['800MT-X', '800mt', '800 mt x']));
    expect(generateModelVariants('V-Strom 800DE')).toEqual(expect.arrayContaining(['v-strom 800', 'vstrom 800', '800de']));
    expect(generateModelVariants('Ténéré 700')).toEqual(expect.arrayContaining(['Ténéré 700', 'tenere 700', '700']));

    const queries = generateRepairSearchQueries({ brand: 'CFMoto', model: '800MT-X', year: 2025 });

    expect(queries).toEqual(
      expect.arrayContaining([
        { make: 'CFMoto', model: '800MT-X', year: 2025 },
        { make: 'CFMoto', model: '800MT-X' },
        { make: 'CFMoto', model: '800MT' },
        { make: 'CFMoto', model: '800' },
        { make: 'CF Moto', model: '800mt' },
      ]),
    );
  });
});

describe('repairMotorcycleData script', () => {
  it('no conecta a API real si no hay API_NINJAS_KEY', async () => {
    const logger = createLogger();
    const fetchImpl = vi.fn();
    const { repairedFileUrl, reportFileUrl } = await createTempOutputUrls();

    const result = await repairMotorcycleData({
      env: {},
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger,
      motorcycles: [{ ...validMotorcycle, displacementCc: 0 }],
      repairedFileUrl,
      reportFileUrl,
    });

    expect(result.skipped).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('⚠️ API_NINJAS_KEY no configurada. Se generará reporte sin conectar a API real.');
  });

  it('no sobrescribe campos válidos y repara solo campos a 0', async () => {
    const logger = createLogger();
    const { repairedFileUrl, reportFileUrl } = await createTempOutputUrls();
    const motorcycleToRepair = {
      ...validMotorcycle,
      displacementCc: 0,
      powerHp: 0,
      torqueNm: 93,
    };
    const fetchImpl = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([
        {
          displacement: '895 cc',
          power: '105 hp',
          torque: '99 Nm',
        },
      ]),
      ok: true,
      text: vi.fn(),
    });

    const result = await repairMotorcycleData({
      env: { API_NINJAS_KEY: 'test-key' },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger,
      motorcycles: [motorcycleToRepair],
      repairedFileUrl,
      reportFileUrl,
    });

    const repairedMotorcycles = JSON.parse(await readFile(repairedFileUrl, 'utf8')) as Bike[];
    const report = JSON.parse(await readFile(reportFileUrl, 'utf8')) as typeof result.report;

    expect(result.repairedCount).toBe(1);
    expect(repairedMotorcycles[0]).toMatchObject({
      displacementCc: 895,
      powerHp: 105,
      torqueNm: 93,
    });
    expect(report.motorcyclesRepaired[0].fieldsRepaired?.map((field) => field.field)).toEqual(['displacement_cc', 'power_hp']);
    expect(report.motorcyclesUnrepaired).toHaveLength(0);
  });

  it('guarda repaired.json y repair-report.json', async () => {
    const logger = createLogger();
    const { repairedFileUrl, reportFileUrl } = await createTempOutputUrls();
    const fetchImpl = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([{ displacement: '895 cc' }]),
      ok: true,
      text: vi.fn(),
    });

    await repairMotorcycleData({
      env: { API_NINJAS_KEY: 'test-key' },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger,
      motorcycles: [{ ...validMotorcycle, displacementCc: 0 }],
      repairedFileUrl,
      reportFileUrl,
    });

    const repairedMotorcycles = JSON.parse(await readFile(repairedFileUrl, 'utf8')) as Bike[];
    const report = JSON.parse(await readFile(reportFileUrl, 'utf8')) as { motorcyclesRepaired: unknown[] };

    expect(repairedMotorcycles[0].displacementCc).toBe(895);
    expect(report.motorcyclesRepaired).toHaveLength(1);
  });
});
