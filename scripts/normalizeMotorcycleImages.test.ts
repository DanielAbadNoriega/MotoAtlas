import { describe, expect, it, vi } from 'vitest';
import { bikeFixtures } from '../src/test/fixtures/bikes';
import {
  getExpectedNormalizedImagePath,
  normalizeMotorcycleImages,
  type RawImageFile,
} from './normalizeMotorcycleImages';

const rawDir = '/tmp/motoatlas/raw-images';
const outputDir = '/tmp/motoatlas/public/images/motorcycles';

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

function readRawDirectory(files: readonly RawImageFile[]) {
  return vi.fn().mockResolvedValue(files);
}

describe('normalizeMotorcycleImages', () => {
  it('valida naming por motorcycle.id y output webp', () => {
    expect(getExpectedNormalizedImagePath(outputDir, bikeFixtures[0])).toBe(`${outputDir}/test-bmw-f-900-gs.webp`);
  });

  it('ignora archivos no imagen', async () => {
    const logger = createLogger();
    const normalizeImage = vi.fn().mockResolvedValue(undefined);

    const result = await normalizeMotorcycleImages({
      dryRun: true,
      logger,
      motorcycles: bikeFixtures.slice(0, 1),
      normalizeImage,
      outputDirectory: outputDir,
      rawImageDirectory: rawDir,
      readRawDirectory: readRawDirectory([{ isFile: true, name: 'notes.txt' }]),
    });

    expect(result.detectedCount).toBe(1);
    expect(result.ignoredCount).toBe(1);
    expect(result.validCount).toBe(0);
    expect(normalizeImage).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith('⏭️ skipped: notes.txt (no es imagen)');
  });

  it('avisa si no existe una moto con ese id', async () => {
    const logger = createLogger();

    const result = await normalizeMotorcycleImages({
      dryRun: true,
      logger,
      motorcycles: bikeFixtures.slice(0, 1),
      outputDirectory: outputDir,
      rawImageDirectory: rawDir,
      readRawDirectory: readRawDirectory([{ isFile: true, name: 'missing-bike.jpg' }]),
    });

    expect(result.validCount).toBe(0);
    expect(result.ignoredCount).toBe(1);
    expect(result.items[0]).toMatchObject({ motorcycleId: 'missing-bike', status: 'skipped' });
    expect(logger.warn).toHaveBeenCalledWith('⚠️ warning: no existe moto con id missing-bike para missing-bike.jpg');
  });

  it('en dry-run muestra output esperado sin escribir archivos', async () => {
    const logger = createLogger();
    const normalizeImage = vi.fn().mockResolvedValue(undefined);

    const result = await normalizeMotorcycleImages({
      dryRun: true,
      fileExists: vi.fn().mockResolvedValue(false),
      logger,
      motorcycles: bikeFixtures.slice(0, 1),
      normalizeImage,
      outputDirectory: outputDir,
      rawImageDirectory: rawDir,
      readRawDirectory: readRawDirectory([{ isFile: true, name: 'test-bmw-f-900-gs.jpg' }]),
    });

    expect(result).toMatchObject({ dryRun: true, detectedCount: 1, validCount: 1, normalizedCount: 0, ignoredCount: 1 });
    expect(result.items[0]).toMatchObject({
      inputPath: `${rawDir}/test-bmw-f-900-gs.jpg`,
      motorcycleId: 'test-bmw-f-900-gs',
      outputPath: `${outputDir}/test-bmw-f-900-gs.webp`,
      outputUrl: '/images/motorcycles/test-bmw-f-900-gs.webp',
      status: 'skipped',
    });
    expect(normalizeImage).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(`🧪 valid: test-bmw-f-900-gs.jpg -> ${outputDir}/test-bmw-f-900-gs.webp`);
  });

  it('no sobrescribe si el output existe sin --overwrite', async () => {
    const logger = createLogger();
    const normalizeImage = vi.fn().mockResolvedValue(undefined);

    const result = await normalizeMotorcycleImages({
      fileExists: vi.fn().mockResolvedValue(true),
      logger,
      motorcycles: bikeFixtures.slice(0, 1),
      normalizeImage,
      outputDirectory: outputDir,
      rawImageDirectory: rawDir,
      readRawDirectory: readRawDirectory([{ isFile: true, name: 'test-bmw-f-900-gs.webp' }]),
    });

    expect(result.normalizedCount).toBe(0);
    expect(result.ignoredCount).toBe(1);
    expect(normalizeImage).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      `⚠️ warning: output ya existe para test-bmw-f-900-gs: ${outputDir}/test-bmw-f-900-gs.webp (usa --overwrite)`,
    );
  });

  it('permite overwrite y normaliza usando el procesador mockeado', async () => {
    const logger = createLogger();
    const normalizeImage = vi.fn().mockResolvedValue(undefined);

    const result = await normalizeMotorcycleImages({
      fileExists: vi.fn().mockResolvedValue(true),
      logger,
      motorcycles: bikeFixtures.slice(0, 1),
      normalizeImage,
      outputDirectory: outputDir,
      overwrite: true,
      rawImageDirectory: rawDir,
      readRawDirectory: readRawDirectory([{ isFile: true, name: 'test-bmw-f-900-gs.png' }]),
    });

    expect(result.normalizedCount).toBe(1);
    expect(result.processedCount).toBe(1);
    expect(normalizeImage).toHaveBeenCalledWith(`${rawDir}/test-bmw-f-900-gs.png`, `${outputDir}/test-bmw-f-900-gs.webp`);
    expect(logger.log).toHaveBeenCalledWith(`✅ normalized: test-bmw-f-900-gs.png -> ${outputDir}/test-bmw-f-900-gs.webp`);
  });
});
