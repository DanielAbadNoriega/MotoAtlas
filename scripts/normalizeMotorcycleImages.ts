import sharp from 'sharp';
import { readdir, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importPaths, readJsonFile } from '../src/features/import/importUtils';
import type { ImportLogger } from '../src/features/import/motorcycleImportTypes';
import {
  getMotorcycleLocalImageFileName,
  getMotorcycleLocalImageUrl,
  MOTORCYCLE_LOCAL_IMAGE_HEIGHT,
  MOTORCYCLE_LOCAL_IMAGE_QUALITY,
  MOTORCYCLE_LOCAL_IMAGE_WIDTH,
} from '../src/shared/images/motorcycleImageNaming';
import type { Bike } from '../src/types/bike';

export type RawImageFile = Readonly<{
  isFile: boolean;
  name: string;
}>;

export type NormalizeMotorcycleImageItem = Readonly<{
  inputPath: string;
  motorcycleId?: string;
  outputPath?: string;
  outputUrl?: string;
  rawFileName: string;
  reason?: string;
  status: 'normalized' | 'skipped' | 'failed';
}>;

export type NormalizeMotorcycleImagesResult = Readonly<{
  detectedCount: number;
  dryRun: boolean;
  failedCount: number;
  ignoredCount: number;
  normalizedCount: number;
  processedCount: number;
  skippedCount: number;
  validCount: number;
  items: readonly NormalizeMotorcycleImageItem[];
}>;

export type NormalizeMotorcycleImagesOptions = Readonly<{
  dryRun?: boolean;
  fileExists?: (filePath: string) => Promise<boolean>;
  logger?: ImportLogger;
  motorcycles?: readonly Bike[];
  normalizeImage?: (inputPath: string, outputPath: string) => Promise<void>;
  outputDirectory?: string;
  rawImageDirectory?: string;
  readRawDirectory?: (directory: string) => Promise<readonly RawImageFile[]>;
  overwrite?: boolean;
}>;

const defaultRawImageDirectory = path.resolve(process.cwd(), 'data/import/raw-images');
const defaultOutputDirectory = path.resolve(process.cwd(), 'public/images/motorcycles');
const supportedImageExtensions = new Set(['.avif', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp']);

function isDirectRun() {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}

function isSupportedImageFile(fileName: string) {
  return supportedImageExtensions.has(path.extname(fileName).toLowerCase());
}

async function defaultFileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function defaultReadRawDirectory(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true });

  return entries.map((entry) => ({ isFile: entry.isFile(), name: entry.name }));
}

async function defaultNormalizeImage(inputPath: string, outputPath: string) {
  await sharp(inputPath)
    .rotate()
    .resize({
      fit: 'cover',
      height: MOTORCYCLE_LOCAL_IMAGE_HEIGHT,
      position: sharp.strategy.attention,
      width: MOTORCYCLE_LOCAL_IMAGE_WIDTH,
    })
    .webp({ quality: MOTORCYCLE_LOCAL_IMAGE_QUALITY, smartSubsample: true })
    .toFile(outputPath);
}

function getMotorcycleIdFromRawFile(fileName: string) {
  return path.parse(fileName).name;
}

function createSkippedItem(rawImageDirectory: string, rawFileName: string, reason: string): NormalizeMotorcycleImageItem {
  return {
    inputPath: path.join(rawImageDirectory, rawFileName),
    rawFileName,
    reason,
    status: 'skipped',
  };
}

export function getExpectedNormalizedImagePath(outputDirectory: string, motorcycle: Pick<Bike, 'id'>) {
  return path.join(outputDirectory, getMotorcycleLocalImageFileName(motorcycle));
}

export async function normalizeMotorcycleImages({
  dryRun = false,
  fileExists = defaultFileExists,
  logger = console,
  motorcycles,
  normalizeImage = defaultNormalizeImage,
  outputDirectory = defaultOutputDirectory,
  rawImageDirectory = defaultRawImageDirectory,
  readRawDirectory = defaultReadRawDirectory,
  overwrite = false,
}: NormalizeMotorcycleImagesOptions = {}): Promise<NormalizeMotorcycleImagesResult> {
  const sourceMotorcycles = motorcycles ?? (await readJsonFile<readonly Bike[]>(importPaths.motorcyclesFileUrl));
  const motorcyclesById = new Map(sourceMotorcycles.map((motorcycle) => [motorcycle.id, motorcycle]));
  const rawFiles = await readRawDirectory(rawImageDirectory);
  const fileEntries = rawFiles.filter((entry) => entry.isFile);
  const items: NormalizeMotorcycleImageItem[] = [];
  let validCount = 0;
  let normalizedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  logger.log(`🔎 Imágenes detectadas: ${fileEntries.length}`);

  if (dryRun) {
    logger.log('🧪 Dry run: no se escribirán archivos.');
  }

  if (!dryRun) {
    await mkdir(outputDirectory, { recursive: true });
  }

  for (const entry of fileEntries) {
    if (!isSupportedImageFile(entry.name)) {
      const item = createSkippedItem(rawImageDirectory, entry.name, 'Archivo ignorado: no es una imagen soportada.');
      items.push(item);
      skippedCount += 1;
      logger.log(`⏭️ skipped: ${entry.name} (no es imagen)`);
      continue;
    }

    const motorcycleId = getMotorcycleIdFromRawFile(entry.name);
    const motorcycle = motorcyclesById.get(motorcycleId);

    if (!motorcycle) {
      const item = createSkippedItem(rawImageDirectory, entry.name, `No existe moto con id ${motorcycleId}.`);
      items.push({ ...item, motorcycleId });
      skippedCount += 1;
      logger.warn(`⚠️ warning: no existe moto con id ${motorcycleId} para ${entry.name}`);
      continue;
    }

    validCount += 1;
    const inputPath = path.join(rawImageDirectory, entry.name);
    const outputPath = getExpectedNormalizedImagePath(outputDirectory, motorcycle);
    const outputUrl = getMotorcycleLocalImageUrl(motorcycle);
    const outputExists = await fileExists(outputPath);

    if (outputExists && !overwrite) {
      items.push({
        inputPath,
        motorcycleId,
        outputPath,
        outputUrl,
        rawFileName: entry.name,
        reason: 'La imagen normalizada ya existe. Usa --overwrite para regenerarla.',
        status: 'skipped',
      });
      skippedCount += 1;
      logger.warn(`⚠️ warning: output ya existe para ${motorcycleId}: ${outputPath} (usa --overwrite)`);
      continue;
    }

    if (dryRun) {
      items.push({ inputPath, motorcycleId, outputPath, outputUrl, rawFileName: entry.name, status: 'skipped' });
      skippedCount += 1;
      logger.log(`🧪 valid: ${entry.name} -> ${outputPath}`);
      continue;
    }

    try {
      await normalizeImage(inputPath, outputPath);
      items.push({ inputPath, motorcycleId, outputPath, outputUrl, rawFileName: entry.name, status: 'normalized' });
      normalizedCount += 1;
      logger.log(`✅ normalized: ${entry.name} -> ${outputPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      items.push({ inputPath, motorcycleId, outputPath, outputUrl, rawFileName: entry.name, reason: message, status: 'failed' });
      failedCount += 1;
      logger.error(`❌ error: ${entry.name} (${message})`);
    }
  }

  logger.log(`📦 Imágenes válidas: ${validCount}`);
  logger.log(`✅ Normalizadas: ${normalizedCount}`);
  logger.log(`⏭️ Ignoradas/skipped: ${skippedCount}`);
  logger.log(`❌ Fallidas: ${failedCount}`);

  return {
    detectedCount: fileEntries.length,
    dryRun,
    failedCount,
    ignoredCount: skippedCount,
    items,
    normalizedCount,
    processedCount: normalizedCount,
    skippedCount,
    validCount,
  };
}

if (isDirectRun()) {
  normalizeMotorcycleImages({
    dryRun: process.argv.includes('--dry-run'),
    overwrite: process.argv.includes('--overwrite'),
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Normalización de imágenes fallida: ${message}`);
    process.exitCode = 1;
  });
}
