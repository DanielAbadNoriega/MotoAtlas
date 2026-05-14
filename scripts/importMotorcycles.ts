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
  MotorcycleValidationItem,
  SupabaseMotorcycleClient,
} from '../src/features/import/motorcycleImportTypes';
import { validateMotorcycleImport } from '../src/features/import/validateMotorcycleImport';

loadEnv({ path: '.env.import', quiet: true });

export type ImportMotorcyclesOptions = Readonly<{
  allowPartial?: boolean;
  dryRun?: boolean;
  env?: NodeJS.ProcessEnv;
  fileUrl?: URL;
  logger?: ImportLogger;
  rawMotorcycles?: unknown;
  supabase?: SupabaseMotorcycleClient;
}>;

function hasFlag(argv: readonly string[], flag: string) {
  return argv.includes(flag);
}

function formatReceivedValue(value: unknown) {
  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return JSON.stringify(value);
}

function formatMotorcycleIdentity(item: MotorcycleValidationItem) {
  const id = item.id ?? 'sin-id';
  const brand = item.normalizedMotorcycle.brand ?? 'sin marca';
  const model = item.normalizedMotorcycle.model ?? 'sin modelo';

  return `${id} · ${brand} ${model}`;
}

function logInvalidItems(logger: ImportLogger, invalidItems: readonly MotorcycleValidationItem[]) {
  if (invalidItems.length === 0) {
    return;
  }

  logger.error(`❌ Motos inválidas: ${invalidItems.length}`);
  invalidItems.forEach((item) => {
    item.errors.forEach((error) => {
      logger.error(
        `- ${formatMotorcycleIdentity(item)} | campo: ${error.field} | valor recibido: ${formatReceivedValue(
          error.receivedValue,
        )} | motivo: ${error.message}`,
      );
    });
  });
}

function logWarnings(logger: ImportLogger, warnings: ImportMotorcyclesResult['warnings']) {
  if (warnings.length === 0) {
    return;
  }

  logger.warn(`⚠️ Avisos de normalización: ${warnings.length}`);
  warnings.forEach((warning) => logger.warn(`- ${warning.field}: ${warning.message}`));
}

export async function importMotorcycles({
  allowPartial = false,
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
  const skippedCount = validation.invalidItems.length;
  const resultBase = {
    allowPartial,
    errors: validation.errors,
    invalidCount: validation.invalidItems.length,
    readCount,
    skippedCount,
    validCount: validation.validItems.length,
    warnings,
  };

  logger.log(`📦 Motos leídas: ${readCount}`);
  logger.log(`✅ Válidas: ${resultBase.validCount}`);
  logger.log(`⚠️ Inválidas: ${resultBase.invalidCount}`);
  logWarnings(logger, warnings);
  logInvalidItems(logger, validation.invalidItems);

  if (!validation.valid && !allowPartial) {
    throw new Error(`Importación cancelada: ${validation.errors.length} error(es) de validación.`);
  }

  if (allowPartial && skippedCount > 0) {
    logger.warn(`⏭️ --allow-partial activo: se saltan ${skippedCount} moto(s) inválida(s).`);
  }

  const motorcyclesToImport = validation.validItems.map((item) => item.motorcycle!);
  const payload = buildMotorcyclesPayload(motorcyclesToImport);

  if (dryRun) {
    logger.log('🧪 Dry run: validación ejecutada. No se ha conectado con Supabase.');
    logger.log('✅ Importadas/actualizadas: 0');

    return {
      ...resultBase,
      importedCount: 0,
    };
  }

  if (payload.length === 0) {
    logger.warn('⚠️ No hay motos válidas para importar. No se ha conectado con Supabase.');

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
  importMotorcycles({
    allowPartial: hasFlag(process.argv, '--allow-partial'),
    dryRun: hasFlag(process.argv, '--dry-run'),
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Importación fallida: ${message}`);
    process.exitCode = 1;
  });
}
