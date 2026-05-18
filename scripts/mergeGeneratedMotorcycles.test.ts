import { describe, expect, it, vi } from 'vitest';
import type { Bike } from '../src/types/bike';
import { detectMotorcycleWarnings, mergeGeneratedMotorcycles } from './mergeGeneratedMotorcycles';

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

const baseBike: Bike = {
  brand: 'BMW',
  cons: ['Precio alto'],
  description: 'Descripción editorial revisada.',
  descriptionLocked: false,
  displacementCc: 895,
  engineType: 'parallel-twin',
  features: {
    absCornering: true,
    cruiseControl: false,
    heatedGrips: false,
    quickshifter: true,
    ridingModes: true,
    tractionControl: true,
    tubelessWheels: false,
  },
  fuelTankLiters: 14.5,
  id: 'bmw-f-900-gs-2024',
  imageLocked: false,
  imageSource: 'manual',
  imageUrl: '/images/motorcycles/bmw-f-900-gs-2024.webp',
  isA2Compatible: false,
  isA2LimitedVersion: false,
  license: 'A',
  limitedPowerHp: null,
  model: 'F 900 GS',
  originalPowerHp: null,
  powerHp: 105,
  priceEur: 13950,
  priceSource: 'manual',
  pros: ['Motor lleno'],
  prosConsSource: 'manual',
  reliabilityReports: {
    commonIssues: ['Calor en ciudad'],
    reliabilityScore: 8.5,
    reportCount: 30,
  },
  reliabilitySource: 'manual',
  scoresSource: 'manual',
  seatHeightMm: 870,
  segment: 'trail',
  specsSource: 'manual',
  torqueNm: 93,
  useScores: {
    beginner: 4,
    city: 6,
    funFactor: 8,
    offroad: 7,
    passenger: 7,
    sport: 7,
    touring: 8,
  },
  wetWeightKg: 219,
  year: 2024,
};

function bike(overrides: Partial<Bike> = {}): Bike {
  return {
    ...baseBike,
    ...overrides,
    features: { ...baseBike.features, ...overrides.features },
    reliabilityReports: { ...baseBike.reliabilityReports, ...overrides.reliabilityReports },
    useScores: { ...baseBike.useScores, ...overrides.useScores },
  };
}

async function mergeForTest(
  existing: readonly Bike[],
  generated: readonly unknown[],
  options: { apply?: boolean; resolveLocalImageUrl?: (motorcycle: Bike) => string | undefined } = {},
) {
  const logger = createLogger();
  const writeMergedMotorcycles = vi.fn().mockResolvedValue(undefined);
  const writeMergeReport = vi.fn().mockResolvedValue(undefined);
  const writeMainMotorcycles = vi.fn().mockResolvedValue(undefined);
  const result = await mergeGeneratedMotorcycles({
    apply: options.apply,
    logger,
    now: () => new Date('2026-05-18T00:00:00.000Z'),
    rawExistingMotorcycles: existing,
    rawGeneratedMotorcycles: generated,
    resolveLocalImageUrl: options.resolveLocalImageUrl ?? (() => undefined),
    writeMainMotorcycles,
    writeMergeReport,
    writeMergedMotorcycles,
  });

  return { logger, result, writeMainMotorcycles, writeMergeReport, writeMergedMotorcycles };
}

describe('mergeGeneratedMotorcycles', () => {
  it('añade motos nuevas válidas sin sobrescribir el catálogo principal por defecto', async () => {
    const newBike = bike({ brand: 'Honda', id: 'honda-nt1100-2024', model: 'NT1100' });
    const { result, writeMainMotorcycles, writeMergedMotorcycles } = await mergeForTest([baseBike], [newBike]);

    expect(result.report.summary).toMatchObject({ added: 1, existing: 1, final: 2, kept: 1 });
    expect(writeMergedMotorcycles).toHaveBeenCalledWith([baseBike, newBike], expect.any(URL));
    expect(writeMainMotorcycles).not.toHaveBeenCalled();
  });

  it('conserva motos existentes cuando el generated trae el mismo id', async () => {
    const generatedDuplicate = bike({ description: 'Descripción generada peor.', priceEur: 0, specsSource: 'api' });
    const { result, writeMergedMotorcycles } = await mergeForTest([baseBike], [generatedDuplicate]);

    expect(result.report.summary).toMatchObject({ added: 0, final: 1, updatableButNotModified: 1 });
    expect(writeMergedMotorcycles.mock.calls[0][0]).toEqual([baseBike]);
  });

  it('no pisa imageUrl manual o locked', async () => {
    const existing = bike({ imageLocked: true, imageSource: 'manual', imageUrl: '/images/manual.webp' });
    const generated = bike({ imageSource: 'placeholder', imageUrl: 'https://placehold.co/1200x800/test' });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].imageUrl).toBe('/images/manual.webp');
    expect(result.report.protectedFields).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'imageUrl' })]));
  });

  it('no reemplaza /images/motorcycles/suzuki-gsx-8s-2024.webp por placehold.co', async () => {
    const existing = bike({
      brand: 'Suzuki',
      id: 'suzuki-gsx-8s-2024',
      imageSource: undefined,
      imageUrl: '/images/motorcycles/suzuki-gsx-8s-2024.webp',
      model: 'GSX-8S',
    });
    const generated = bike({
      brand: 'Suzuki',
      id: 'suzuki-gsx-8s-2024',
      imageSource: 'placeholder',
      imageUrl: 'https://placehold.co/1200x800/151515/e4002b?text=MotoAtlas+sin+imagen',
      model: 'GSX-8S',
    });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].imageUrl).toBe('/images/motorcycles/suzuki-gsx-8s-2024.webp');
    expect(result.report.protectedFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'imageUrl',
          reason: expect.stringContaining('placeholder generada descartada'),
        }),
      ]),
    );
  });

  it('no reemplaza imagen local real por fallback técnico en /images/placeholders', async () => {
    const existing = bike({ imageSource: undefined, imageUrl: '/images/motorcycles/suzuki-v-strom-800de-2024.webp' });
    const generated = bike({ imageSource: 'placeholder', imageUrl: '/images/placeholders/motorcycle-technical-pending.jpg' });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].imageUrl).toBe('/images/motorcycles/suzuki-v-strom-800de-2024.webp');
    expect(result.report.protectedFields).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'imageUrl' })]));
  });

  it('conserva imagen manual aunque imageLocked sea false', async () => {
    const existing = bike({ imageLocked: false, imageSource: 'manual', imageUrl: '/images/motorcycles/manual.webp' });
    const generated = bike({ imageSource: 'api', imageUrl: '/images/motorcycles/api.webp' });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].imageUrl).toBe('/images/motorcycles/manual.webp');
    expect(result.report.protectedFields).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'imageUrl' })]));
  });

  it('conserva imagen local real aunque imageSource esté ausente', async () => {
    const existing = bike({ imageSource: undefined, imageUrl: '/images/motorcycles/local-real.webp' });
    const generated = bike({ imageSource: 'api', imageUrl: '/images/motorcycles/generated.webp' });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].imageUrl).toBe('/images/motorcycles/local-real.webp');
    expect(result.report.protectedFields).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'imageUrl' })]));
  });

  it('sí reemplaza placeholder existente por imagen local real generada', async () => {
    const existing = bike({ imageSource: 'placeholder', imageUrl: '/images/placeholders/motorcycle-technical-pending.jpg' });
    const generated = bike({ imageSource: 'manual', imageUrl: '/images/motorcycles/bmw-f-900-gs-2024.webp' });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0]).toMatchObject({
      imageSource: 'manual',
      imageUrl: '/images/motorcycles/bmw-f-900-gs-2024.webp',
    });
    expect(result.report.nonDegradedFields).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'imageUrl', reason: expect.stringContaining('reemplazada por imagen local real') })]),
    );
  });

  it('restaura una imagen local real existente en disco si el catálogo quedó con placeholder', async () => {
    const existing = bike({ imageSource: 'placeholder', imageUrl: 'https://placehold.co/1200x800/test' });
    const generated = bike({ imageSource: 'placeholder', imageUrl: '/images/placeholders/motorcycle-technical-pending.jpg' });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated], {
      resolveLocalImageUrl: () => '/images/motorcycles/bmw-f-900-gs-2024.webp',
    });

    expect(writeMergedMotorcycles.mock.calls[0][0][0]).toMatchObject({
      imageSource: 'manual',
      imageUrl: '/images/motorcycles/bmw-f-900-gs-2024.webp',
    });
    expect(result.report.nonDegradedFields).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'imageUrl', reason: expect.stringContaining('placeholder existente descartado') })]),
    );
  });

  it('no pisa description locked ni descripción existente no-placeholder', async () => {
    const existing = bike({ description: 'Texto bueno curado.', descriptionLocked: true });
    const generated = bike({ description: 'Sin descripción disponible. Datos pendientes de revisión manual en MotoAtlas.' });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].description).toBe('Texto bueno curado.');
    expect(result.report.protectedFields).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'description' })]));
  });

  it('no reemplaza descripción real por “Sin descripción disponible...”', async () => {
    const existing = bike({ description: 'Texto real curado de catálogo.' });
    const generated = bike({ description: 'Sin descripción disponible. Datos pendientes de revisión manual en MotoAtlas.' });
    const { result, writeMergedMotorcycles } = await mergeForTest([existing], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].description).toBe('Texto real curado de catálogo.');
    expect(result.report.protectedFields).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'description', reason: expect.stringContaining('placeholder generada descartada') })]),
    );
  });

  it('no reemplaza precio real por 0', async () => {
    const generated = bike({ priceEur: 0, priceSource: 'placeholder' });
    const { result, writeMergedMotorcycles } = await mergeForTest([baseBike], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].priceEur).toBe(13950);
    expect(result.report.nonDegradedFields).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'priceEur' })]));
  });

  it('no degrada sources manual/user/api hacia fuentes peores', async () => {
    const existing = bike({ specsSource: 'manual', imageSource: 'user', scoresSource: 'api' });
    const generated = bike({ specsSource: 'api', imageSource: 'placeholder', scoresSource: 'estimated' });
    const { result } = await mergeForTest([existing], [generated]);

    expect(result.report.nonDegradedFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'specsSource' }),
        expect.objectContaining({ field: 'imageSource' }),
        expect.objectContaining({ field: 'scoresSource' }),
      ]),
    );
  });

  it('no reemplaza pros/cons existentes por arrays vacíos', async () => {
    const generated = bike({ cons: [], pros: [] });
    const { result, writeMergedMotorcycles } = await mergeForTest([baseBike], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].pros).toEqual(['Motor lleno']);
    expect(writeMergedMotorcycles.mock.calls[0][0][0].cons).toEqual(['Precio alto']);
    expect(result.report.nonDegradedFields).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'pros' }), expect.objectContaining({ field: 'cons' })]),
    );
  });

  it('no reemplaza reliability útil por reliabilityScore/reportCount 0', async () => {
    const generated = bike({ reliabilityReports: { commonIssues: [], reliabilityScore: 0, reportCount: 0 } });
    const { result, writeMergedMotorcycles } = await mergeForTest([baseBike], [generated]);

    expect(writeMergedMotorcycles.mock.calls[0][0][0].reliabilityReports.reliabilityScore).toBe(8.5);
    expect(result.report.nonDegradedFields).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'reliabilityReports' })]));
  });

  it('descarta motos inválidas y no las introduce en merged.json', async () => {
    const invalid = { ...bike({ brand: 'Invalid', id: 'invalid-bike-2024', model: 'Invalid' }), displacementCc: 0 };
    const { result, writeMergedMotorcycles } = await mergeForTest([baseBike], [invalid]);

    expect(result.report.summary).toMatchObject({ added: 0, discarded: 1, final: 1 });
    expect(writeMergedMotorcycles.mock.calls[0][0]).toEqual([baseBike]);
    expect(result.report.discarded[0].errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'displacement_cc' })]));
  });

  it('detecta priceEur 0 como warning', () => {
    const warnings = detectMotorcycleWarnings(bike({ priceEur: 0 }));

    expect(warnings.placeholderWarnings).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'priceEur' })]));
  });

  it('detecta imagen placeholder como warning', () => {
    const warnings = detectMotorcycleWarnings(bike({ imageSource: 'placeholder', imageUrl: 'https://placehold.co/1200x800/test' }));

    expect(warnings.placeholderWarnings).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'imageUrl' })]));
  });

  it('detecta descripción placeholder como warning', () => {
    const warnings = detectMotorcycleWarnings(bike({ description: 'Sin descripción disponible. Datos pendientes de revisión manual en MotoAtlas.' }));

    expect(warnings.placeholderWarnings).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'description' })]));
  });

  it('detecta pros y cons vacíos como warnings', () => {
    const warnings = detectMotorcycleWarnings(bike({ cons: [], pros: [] }));

    expect(warnings.placeholderWarnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'pros' }), expect.objectContaining({ field: 'cons' })]),
    );
  });

  it('detecta Suzuki GSX-8S con power sospechosa', () => {
    const warnings = detectMotorcycleWarnings(bike({ brand: 'Suzuki', id: 'suzuki-gsx-8s-2024', model: 'GSX-8S', powerHp: 198.5, segment: 'naked' }));

    expect(warnings.suspiciousDataWarnings).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'powerHp' })]));
  });

  it('detecta Suzuki V-Strom 800DE con peso sospechoso', () => {
    const warnings = detectMotorcycleWarnings(bike({ brand: 'Suzuki', id: 'suzuki-v-strom-800de-2024', model: 'V-Strom 800DE', segment: 'trail', wetWeightKg: 277 }));

    expect(warnings.suspiciousDataWarnings).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'wetWeightKg' })]));
  });

  it('detecta CFMoto 800MT-X naked como segmento sospechoso', () => {
    const warnings = detectMotorcycleWarnings(bike({ brand: 'CFMoto', id: 'cfmoto-800mt-x-2025', model: '800MT-X', segment: 'naked' }));

    expect(warnings.suspiciousDataWarnings).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'segment' })]));
  });

  it('genera reporte correcto con added, kept, duplicates y warnings', async () => {
    const newBike = bike({ brand: 'Honda', id: 'honda-nt1100-2024', model: 'NT1100', priceEur: 0 });
    const { result, writeMergeReport } = await mergeForTest([baseBike], [newBike, newBike]);

    expect(result.report.generatedAt).toBe('2026-05-18T00:00:00.000Z');
    expect(result.report.summary).toMatchObject({ added: 1, existing: 1, final: 2, generated: 2, kept: 1 });
    expect(result.report.duplicates).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'id', id: 'honda-nt1100-2024' })]));
    expect(writeMergeReport).toHaveBeenCalledWith(result.report, expect.any(URL));
  });

  it('--apply sobrescribe motorcycles.json solo cuando el merge final es válido', async () => {
    const newBike = bike({ brand: 'Honda', id: 'honda-nt1100-2024', model: 'NT1100' });
    const { writeMainMotorcycles } = await mergeForTest([baseBike], [newBike], { apply: true });

    expect(writeMainMotorcycles).toHaveBeenCalledWith([baseBike, newBike], expect.any(URL));
  });

  it('--apply no degrada una imagen local real a placeholder', async () => {
    const existing = bike({ imageSource: undefined, imageUrl: '/images/motorcycles/suzuki-gsx-8s-2024.webp' });
    const generated = bike({ imageSource: 'placeholder', imageUrl: 'https://placehold.co/1200x800/test' });
    const { writeMainMotorcycles } = await mergeForTest([existing], [generated], { apply: true });

    expect(writeMainMotorcycles.mock.calls[0][0][0].imageUrl).toBe('/images/motorcycles/suzuki-gsx-8s-2024.webp');
  });

  it('--apply no sobrescribe si el catálogo existente impide validar el merge', async () => {
    const logger = createLogger();
    const writeMainMotorcycles = vi.fn().mockResolvedValue(undefined);

    await expect(
      mergeGeneratedMotorcycles({
        apply: true,
        logger,
        rawExistingMotorcycles: [{ ...baseBike, powerHp: 0 }],
        rawGeneratedMotorcycles: [],
        writeMainMotorcycles,
        writeMergeReport: vi.fn().mockResolvedValue(undefined),
        writeMergedMotorcycles: vi.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toThrow('motorcycles.json contiene');
    expect(writeMainMotorcycles).not.toHaveBeenCalled();
  });
});
