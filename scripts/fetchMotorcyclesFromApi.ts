import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createApiNinjasMotorcycleClient, type ApiNinjasFetch } from '../src/features/import/apiNinjasMotorcycleClient';
import {
  findExistingMotorcycle,
  getRelativePath,
  importPaths,
  readJsonFile,
  writeJsonFile,
} from '../src/features/import/importUtils';
import type { Bike } from '../src/types/bike';
import type { ImportLogger, MotorcycleNormalizationWarning, MotorcycleSeed, MotorcycleValidationError } from '../src/features/import/motorcycleImportTypes';
import { normalizeMotorcycle } from '../src/features/import/normalizeMotorcycle';
import { validateMotorcycleImport } from '../src/features/import/validateMotorcycleImport';

loadEnv({ path: '.env.import', quiet: true });

export type FetchMotorcyclesFromApiResult = Readonly<{
  errors: readonly string[];
  failedCount: number;
  fetchedCount: number;
  generatedCount: number;
  processedCount: number;
  skipped: boolean;
  warnings: readonly string[];
}>;

export type FetchMotorcyclesFailureReportItem = Readonly<{
  errors: readonly MotorcycleValidationError[];
  make: string;
  model: string;
  warnings: readonly MotorcycleNormalizationWarning[];
  year: number;
}>;

export type FetchMotorcyclesReport = Readonly<{
  failedCount: number;
  failedMotorcycles: readonly FetchMotorcyclesFailureReportItem[];
  generatedAt: string;
  generatedCount: number;
  generatedMotorcycles: readonly Pick<Bike, 'brand' | 'id' | 'model' | 'year'>[];
  totalSeedsRead: number;
  uniqueSeeds: number;
  warnings: readonly string[];
}>;

export type FetchMotorcyclesFromApiOptions = Readonly<{
  env?: NodeJS.ProcessEnv;
  existingMotorcycles?: readonly Bike[];
  fetchImpl?: ApiNinjasFetch;
  generatedFileUrl?: URL;
  logger?: ImportLogger;
  reportFileUrl?: URL;
  seedFileUrl?: URL;
  seedList?: readonly MotorcycleSeed[];
  writeFetchReport?: (report: FetchMotorcyclesReport, fileUrl: URL) => Promise<void>;
  writeGeneratedMotorcycles?: (motorcycles: readonly Bike[], fileUrl: URL) => Promise<void>;
}>;

async function readExistingMotorcycles() {
  try {
    return await readJsonFile<readonly Bike[]>(importPaths.existingMotorcyclesFileUrl);
  } catch {
    return [];
  }
}

function mergeApiResultWithSeed(seed: MotorcycleSeed, apiResult: unknown) {
  return {
    ...(typeof apiResult === 'object' && apiResult !== null ? apiResult : {}),
    make: seed.make,
    model: seed.model,
    year: seed.year,
  };
}

function getSeedLabel(seed: MotorcycleSeed) {
  return `${seed.make} ${seed.model} ${seed.year}`;
}

function formatErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function createFailure(seed: MotorcycleSeed, errors: readonly MotorcycleValidationError[], warnings: readonly MotorcycleNormalizationWarning[] = []): FetchMotorcyclesFailureReportItem {
  return {
    errors,
    make: seed.make,
    model: seed.model,
    warnings,
    year: seed.year,
  };
}

function formatFailureError(seed: MotorcycleSeed, error: MotorcycleValidationError) {
  const received = error.receivedValue === undefined ? '' : ` · recibido: ${JSON.stringify(error.receivedValue)}`;
  return `${getSeedLabel(seed)} · ${error.field}: ${error.message}${received}`;
}

export function dedupeMotorcycleSeeds(seeds: readonly MotorcycleSeed[]) {
  const seen = new Set<string>();

  return seeds.filter((seed) => {
    const key = `${seed.make.trim().toLowerCase()}|${seed.model.trim().toLowerCase()}|${seed.year}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function fetchMotorcyclesFromApi({
  env = process.env,
  existingMotorcycles,
  fetchImpl,
  generatedFileUrl = importPaths.generatedMotorcyclesFileUrl,
  logger = console,
  reportFileUrl = importPaths.fetchReportFileUrl,
  seedFileUrl = importPaths.seedListFileUrl,
  seedList,
  writeFetchReport = (report, fileUrl) => writeJsonFile(fileUrl, report),
  writeGeneratedMotorcycles = (motorcycles, fileUrl) => writeJsonFile(fileUrl, motorcycles),
}: FetchMotorcyclesFromApiOptions = {}): Promise<FetchMotorcyclesFromApiResult> {
  const apiKey = env.API_NINJAS_KEY?.trim();

  if (!apiKey) {
    logger.log('ℹ️ API_NINJAS_KEY no configurada. Se omite el enriquecimiento externo sin error crítico.');
    return {
      errors: [],
      failedCount: 0,
      fetchedCount: 0,
      generatedCount: 0,
      processedCount: 0,
      skipped: true,
      warnings: ['API_NINJAS_KEY no configurada.'],
    };
  }

  const rawSeeds = seedList ?? (await readJsonFile<readonly MotorcycleSeed[]>(seedFileUrl));
  const seeds = dedupeMotorcycleSeeds(rawSeeds);
  const existing = existingMotorcycles ?? (await readExistingMotorcycles());
  const client = createApiNinjasMotorcycleClient({ apiKey, fetchImpl });
  const generatedMotorcycles: Bike[] = [];
  const failedMotorcycles: FetchMotorcyclesFailureReportItem[] = [];
  const warnings: string[] = [];
  let fetchedCount = 0;

  logger.log(`📦 Motos seed leídas: ${rawSeeds.length}`);
  logger.log(`🧹 Seeds únicos: ${seeds.length}`);

  for (const seed of seeds) {
    logger.log(`🔎 Buscando ${getSeedLabel(seed)}`);

    let apiResults: readonly unknown[] = [];

    try {
      apiResults = await client.searchMotorcycles({ seed });
      fetchedCount += apiResults.length;
    } catch (error) {
      const message = formatErrorMessage(error);
      failedMotorcycles.push(createFailure(seed, [{ field: 'api', message }]));
      logger.error(`❌ ${getSeedLabel(seed)} · api: ${message}`);
      continue;
    }

    if (apiResults.length === 0) {
      const warning = `${getSeedLabel(seed)}: API Ninjas no devolvió resultados; se usa JSON existente/placeholder.`;
      warnings.push(warning);
      logger.warn(`⚠️ ${warning}`);
    }

    const existingMotorcycle = findExistingMotorcycle(seed, existing);
    const normalization = normalizeMotorcycle(mergeApiResultWithSeed(seed, apiResults[0]), {
      allowPlaceholders: true,
      existingMotorcycle,
    });

    const seedWarnings = normalization.warnings.map((warning) => ({
      field: warning.field,
      message: warning.message,
    }));

    seedWarnings.forEach((warning) => {
      const message = `${getSeedLabel(seed)} · ${warning.field}: ${warning.message}`;
      warnings.push(message);
      logger.warn(`⚠️ ${message}`);
    });

    const validation = validateMotorcycleImport([normalization.motorcycle], { allowPlaceholders: true });

    if (!validation.valid) {
      const validationErrors =
        validation.invalidItems[0]?.errors.length
          ? validation.invalidItems[0].errors
          : [{ field: 'validation', message: validation.errors.join(' | ') || 'Validación de moto fallida.' }];

      failedMotorcycles.push(createFailure(seed, validationErrors, seedWarnings));
      validationErrors.forEach((error) => logger.error(`❌ ${formatFailureError(seed, error)}`));
      continue;
    }

    generatedMotorcycles.push(validation.validItems[0].motorcycle!);
  }

  const report: FetchMotorcyclesReport = {
    failedCount: failedMotorcycles.length,
    failedMotorcycles,
    generatedAt: new Date().toISOString(),
    generatedCount: generatedMotorcycles.length,
    generatedMotorcycles: generatedMotorcycles.map((motorcycle) => ({
      brand: motorcycle.brand,
      id: motorcycle.id,
      model: motorcycle.model,
      year: motorcycle.year,
    })),
    totalSeedsRead: rawSeeds.length,
    uniqueSeeds: seeds.length,
    warnings,
  };

  await writeGeneratedMotorcycles(generatedMotorcycles, generatedFileUrl);
  await writeFetchReport(report, reportFileUrl);

  logger.log(`📊 Total procesadas: ${seeds.length}`);
  logger.log(`✅ Válidas: ${generatedMotorcycles.length}`);
  logger.log(`❌ Fallidas: ${failedMotorcycles.length}`);
  logger.log(`💾 Generated: ${getRelativePath(generatedFileUrl)}`);
  logger.log(`🧾 Report: ${getRelativePath(reportFileUrl)}`);
  logger.log(`💾 Generado ${getRelativePath(generatedFileUrl)} con ${generatedMotorcycles.length} motos.`);
  logger.log('🛡️ data/import/motorcycles.json NO se ha sobrescrito. Revisa el generado antes de copiarlo.');

  return {
    errors: failedMotorcycles.flatMap((failure) => failure.errors.map((error) => formatFailureError(failure, error))),
    failedCount: failedMotorcycles.length,
    fetchedCount,
    generatedCount: generatedMotorcycles.length,
    processedCount: seeds.length,
    skipped: false,
    warnings,
  };
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isDirectRun) {
  fetchMotorcyclesFromApi().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Fetch de motos fallido: ${message}`);
    process.exitCode = 1;
  });
}
