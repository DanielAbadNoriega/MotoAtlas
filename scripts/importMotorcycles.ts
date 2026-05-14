import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  buildMotorcyclesPayload,
  createSupabaseImportClient,
  importPaths,
  readJsonFile,
} from '../src/features/import/importUtils';
import type {
  ImportLogger,
  ImportMotorcyclesResult,
  SupabaseMotorcycleClient,
} from '../src/features/import/motorcycleImportTypes';
import { validateMotorcycleImport } from '../src/features/import/validateMotorcycleImport';

loadEnv({ path: '.env.import', quiet: true });

export type ImportMotorcyclesOptions = Readonly<{
  dryRun?: boolean;
  env?: NodeJS.ProcessEnv;
  fileUrl?: URL;
  logger?: ImportLogger;
  rawMotorcycles?: unknown;
  supabase?: SupabaseMotorcycleClient;
}>;

function isDryRun(argv: readonly string[]) {
  return argv.includes('--dry-run');
}

function logValidationErrors(logger: ImportLogger, errors: readonly string[]) {
  if (errors.length === 0) {
    return;
  }

  logger.error(`❌ Errores: ${errors.length}`);
  errors.forEach((error) => logger.error(`- ${error}`));
}

function logWarnings(logger: ImportLogger, warnings: ImportMotorcyclesResult['warnings']) {
  if (warnings.length === 0) {
    return;
  }

  logger.warn(`⚠️ Avisos de normalización: ${warnings.length}`);
  warnings.forEach((warning) => logger.warn(`- ${warning.field}: ${warning.message}`));
}

export async function importMotorcycles({
  dryRun = false,
  env = process.env,
  fileUrl = importPaths.motorcyclesFileUrl,
  logger = console,
  rawMotorcycles,
  supabase,
}: ImportMotorcyclesOptions = {}): Promise<ImportMotorcyclesResult> {
  const importSource = rawMotorcycles ?? (await readJsonFile(fileUrl));
  const readCount = Array.isArray(importSource) ? importSource.length : 0;
  const validation = validateMotorcycleImport(importSource, { allowPlaceholders: false });
  const warnings = validation.items.flatMap((item) => item.warnings);
  const resultBase = {
    errors: validation.errors,
    invalidCount: validation.invalidItems.length,
    readCount,
    validCount: validation.validItems.length,
    warnings,
  };

  logger.log(`📦 Motos leídas: ${readCount}`);
  logger.log(`✅ Válidas: ${resultBase.validCount}`);
  logger.log(`⚠️ Inválidas: ${resultBase.invalidCount}`);
  logWarnings(logger, warnings);

  if (!validation.valid) {
    logValidationErrors(logger, validation.errors);
    throw new Error(`Importación cancelada: ${validation.errors.length} error(es) de validación.`);
  }

  const payload = buildMotorcyclesPayload(validation.validItems.map((item) => item.motorcycle!));

  if (dryRun) {
    logger.log('🧪 Dry run: validación correcta. No se ha conectado con Supabase.');
    logger.log('✅ Importadas/actualizadas: 0');

    return {
      ...resultBase,
      importedCount: 0,
    };
  }

  const client = supabase ?? createSupabaseImportClient(env);
  const { data, error } = await client.from('motorcycles').upsert(payload, { onConflict: 'id' }).select('id');

  if (error) {
    logger.error(`❌ Error importando motos: ${error.message}`);
    throw new Error(error.message);
  }

  const importedCount = data?.length ?? payload.length;
  logger.log(`✅ Importadas/actualizadas: ${importedCount}`);
  logger.log('🔁 Upsert completado usando id como clave de conflicto.');

  return {
    ...resultBase,
    importedCount,
  };
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isDirectRun) {
  importMotorcycles({ dryRun: isDryRun(process.argv) }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Importación fallida: ${message}`);
    process.exitCode = 1;
  });
}
