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
import type { ImportLogger, MotorcycleSeed } from '../src/features/import/motorcycleImportTypes';
import { normalizeMotorcycle } from '../src/features/import/normalizeMotorcycle';
import { validateMotorcycleImport } from '../src/features/import/validateMotorcycleImport';

loadEnv({ path: '.env.import', quiet: true });

export type FetchMotorcyclesFromApiResult = Readonly<{
  errors: readonly string[];
  fetchedCount: number;
  generatedCount: number;
  skipped: boolean;
  warnings: readonly string[];
}>;

export type FetchMotorcyclesFromApiOptions = Readonly<{
  env?: NodeJS.ProcessEnv;
  existingMotorcycles?: readonly Bike[];
  fetchImpl?: ApiNinjasFetch;
  generatedFileUrl?: URL;
  logger?: ImportLogger;
  seedFileUrl?: URL;
  seedList?: readonly MotorcycleSeed[];
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

export async function fetchMotorcyclesFromApi({
  env = process.env,
  existingMotorcycles,
  fetchImpl,
  generatedFileUrl = importPaths.generatedMotorcyclesFileUrl,
  logger = console,
  seedFileUrl = importPaths.seedListFileUrl,
  seedList,
  writeGeneratedMotorcycles = (motorcycles, fileUrl) => writeJsonFile(fileUrl, motorcycles),
}: FetchMotorcyclesFromApiOptions = {}): Promise<FetchMotorcyclesFromApiResult> {
  const apiKey = env.API_NINJAS_KEY?.trim();

  if (!apiKey) {
    logger.log('ℹ️ API_NINJAS_KEY no configurada. Se omite el enriquecimiento externo sin error crítico.');
    return {
      errors: [],
      fetchedCount: 0,
      generatedCount: 0,
      skipped: true,
      warnings: ['API_NINJAS_KEY no configurada.'],
    };
  }

  const seeds = seedList ?? (await readJsonFile<readonly MotorcycleSeed[]>(seedFileUrl));
  const existing = existingMotorcycles ?? (await readExistingMotorcycles());
  const client = createApiNinjasMotorcycleClient({ apiKey, fetchImpl });
  const generatedMotorcycles: Bike[] = [];
  const warnings: string[] = [];
  let fetchedCount = 0;

  logger.log(`📦 Motos seed leídas: ${seeds.length}`);

  for (const seed of seeds) {
    logger.log(`🔎 Buscando ${seed.make} ${seed.model} ${seed.year}`);

    const apiResults = await client.searchMotorcycles({ seed });
    fetchedCount += apiResults.length;

    if (apiResults.length === 0) {
      const warning = `${seed.make} ${seed.model} ${seed.year}: API Ninjas no devolvió resultados; se usa JSON existente/placeholder.`;
      warnings.push(warning);
      logger.warn(`⚠️ ${warning}`);
    }

    const existingMotorcycle = findExistingMotorcycle(seed, existing);
    const normalization = normalizeMotorcycle(mergeApiResultWithSeed(seed, apiResults[0]), {
      allowPlaceholders: true,
      existingMotorcycle,
    });

    normalization.warnings.forEach((warning) => {
      const message = `${seed.make} ${seed.model} ${seed.year} · ${warning.field}: ${warning.message}`;
      warnings.push(message);
      logger.warn(`⚠️ ${message}`);
    });

    const validation = validateMotorcycleImport([normalization.motorcycle], { allowPlaceholders: true });

    if (!validation.valid) {
      validation.errors.forEach((error) => logger.error(`❌ ${error}`));
      throw new Error(`No se pudo generar ${seed.make} ${seed.model} ${seed.year}: ${validation.errors.join(' | ')}`);
    }

    generatedMotorcycles.push(validation.validItems[0].motorcycle!);
  }

  await writeGeneratedMotorcycles(generatedMotorcycles, generatedFileUrl);
  logger.log(`💾 Generado ${getRelativePath(generatedFileUrl)} con ${generatedMotorcycles.length} motos.`);
  logger.log('🛡️ data/import/motorcycles.json NO se ha sobrescrito. Revisa el generado antes de copiarlo.');

  return {
    errors: [],
    fetchedCount,
    generatedCount: generatedMotorcycles.length,
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
