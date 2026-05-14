import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createApiNinjasMotorcycleClient, type ApiNinjasFetch } from '../src/features/import/apiNinjasMotorcycleClient';
import { getRelativePath, importPaths, readJsonFile, writeJsonFile } from '../src/features/import/importUtils';
import type { ApiNinjasMotorcycle, ImportLogger } from '../src/features/import/motorcycleImportTypes';
import { normalizeMotorcycle } from '../src/features/import/normalizeMotorcycle';
import type { Bike } from '../src/types/bike';

loadEnv({ path: '.env.import', quiet: true });

type RepairableCamelField =
  | 'displacementCc'
  | 'powerHp'
  | 'torqueNm'
  | 'wetWeightKg'
  | 'seatHeightMm'
  | 'fuelTankLiters';

type RepairableSnakeField =
  | 'displacement_cc'
  | 'power_hp'
  | 'torque_nm'
  | 'wet_weight_kg'
  | 'seat_height_mm'
  | 'fuel_tank_liters';

type MutableMotorcycle = Partial<Record<RepairableCamelField, unknown>> & Record<string, unknown>;

export type InvalidTechnicalField = Readonly<{
  camelField: RepairableCamelField;
  field: RepairableSnakeField;
  value: unknown;
}>;

export type RepairSearchQuery = Readonly<{
  make: string;
  model: string;
  year?: number;
}>;

type SearchAttempt = Readonly<{
  error?: string;
  query: RepairSearchQuery;
  results: readonly Readonly<{
    make?: string;
    model?: string;
    year?: string | number;
  }>[];
  resultsFound: number;
}>;

type RepairedField = Readonly<{
  field: RepairableSnakeField;
  newValue: number;
  oldValue: unknown;
  query: RepairSearchQuery;
}>;

type RepairReportMotorcycle = Readonly<{
  brand: string;
  fieldsRepaired?: readonly RepairedField[];
  id: string;
  invalidFields?: readonly InvalidTechnicalField[];
  model: string;
  remainingInvalidFields?: readonly InvalidTechnicalField[];
  resultsFound: number;
  searchesAttempted: readonly SearchAttempt[];
}>;

export type MotorcycleRepairReport = Readonly<{
  generatedAt: string;
  motorcyclesRead: number;
  motorcyclesRepaired: readonly RepairReportMotorcycle[];
  motorcyclesUnrepaired: readonly RepairReportMotorcycle[];
  skippedReason?: string;
}>;

export type RepairMotorcycleDataResult = Readonly<{
  invalidCount: number;
  readCount: number;
  repairedCount: number;
  report: MotorcycleRepairReport;
  skipped: boolean;
  unrepairedCount: number;
}>;

export type RepairMotorcycleDataOptions = Readonly<{
  env?: NodeJS.ProcessEnv;
  fetchImpl?: ApiNinjasFetch;
  inputFileUrl?: URL;
  logger?: ImportLogger;
  motorcycles?: readonly Bike[];
  repairedFileUrl?: URL;
  reportFileUrl?: URL;
  writeRepairedMotorcycles?: (motorcycles: readonly Bike[], fileUrl: URL) => Promise<void>;
  writeRepairReport?: (report: MotorcycleRepairReport, fileUrl: URL) => Promise<void>;
}>;

const repairableFields = [
  { camelField: 'displacementCc', field: 'displacement_cc', rawKeys: ['displacementCc', 'displacement_cc', 'displacement'] },
  { camelField: 'powerHp', field: 'power_hp', rawKeys: ['powerHp', 'power_hp', 'power'] },
  { camelField: 'torqueNm', field: 'torque_nm', rawKeys: ['torqueNm', 'torque_nm', 'torque'] },
  { camelField: 'wetWeightKg', field: 'wet_weight_kg', rawKeys: ['wetWeightKg', 'wet_weight_kg', 'total_weight'] },
  { camelField: 'seatHeightMm', field: 'seat_height_mm', rawKeys: ['seatHeightMm', 'seat_height_mm', 'seat_height'] },
  { camelField: 'fuelTankLiters', field: 'fuel_tank_liters', rawKeys: ['fuelTankLiters', 'fuel_tank_liters', 'fuel_capacity'] },
] as const satisfies readonly {
  camelField: RepairableCamelField;
  field: RepairableSnakeField;
  rawKeys: readonly string[];
}[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRawValue(input: unknown, rawKeys: readonly string[]) {
  if (!isRecord(input)) {
    return input;
  }

  for (const key of rawKeys) {
    if (key in input) {
      return input[key];
    }
  }

  return undefined;
}

function isUsefulTechnicalNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function getText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getYear(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeForSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function uniqueValues(values: readonly (string | undefined)[]) {
  const result: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return;
    }

    const key = trimmedValue
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúüñ]+/gi, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmedValue);
    }
  });

  return result;
}

export function normalizeMotorcycleSearchText(value: string) {
  return normalizeForSearch(value);
}

export function extractDisplacementFromModel(model: string) {
  return model.match(/(\d{3,4})/)?.[1];
}

export function generateMakeVariants(make: string) {
  const normalizedMake = normalizeForSearch(make);
  const variants = [make, normalizedMake];

  if (normalizedMake === 'cfmoto' || normalizedMake === 'cf moto') {
    variants.push('CFMoto', 'CF Moto', 'cfmoto', 'cf moto');
  }

  return uniqueValues(variants);
}

export function generateModelVariants(model: string) {
  const withoutAccents = model.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lowerWithoutAccents = withoutAccents.toLowerCase();
  const hyphenAsSpace = lowerWithoutAccents.replace(/-/g, ' ');
  const withoutHyphen = lowerWithoutAccents.replace(/-/g, '');
  const withoutHyphenWithoutSuffix = withoutHyphen.replace(/(\d{3,4})[a-z]+\b/g, '$1');
  const compact = lowerWithoutAccents.replace(/[^a-z0-9]+/g, '');
  const firstPart = model.split(/[\s-]+/)[0]?.toLowerCase();
  const displacement = extractDisplacementFromModel(model);
  const withoutLetterSuffix = lowerWithoutAccents.replace(/(\d{3,4})[a-z]+\b/g, '$1');
  const numberWithSuffix = lowerWithoutAccents.match(/\b\d{3,4}[a-z]+\b/i)?.[0];
  const numberWithSeparatedSuffix = lowerWithoutAccents.replace(/-/g, ' ').replace(/(\d+)([a-z]+)/gi, '$1 $2');
  const beforeLastHyphen = lowerWithoutAccents.includes('-') ? lowerWithoutAccents.replace(/-[a-z]+$/i, '') : undefined;

  return uniqueValues([
    model,
    lowerWithoutAccents,
    withoutAccents,
    hyphenAsSpace,
    withoutHyphen,
    withoutHyphenWithoutSuffix,
    compact,
    firstPart,
    displacement,
    withoutLetterSuffix,
    numberWithSuffix,
    numberWithSeparatedSuffix,
    beforeLastHyphen,
  ]);
}

function firstModelPart(model: string) {
  return model.split(/[\s-]+/)[0]?.trim();
}

function addSearchQuery(queries: RepairSearchQuery[], seen: Set<string>, query: RepairSearchQuery) {
  const normalizedMake = normalizeForSearch(query.make);
  const normalizedModel = normalizeForSearch(query.model);
  const key = `${normalizedMake}|${normalizedModel}|${query.year ?? ''}`;

  if (!normalizedMake || !normalizedModel || seen.has(key)) {
    return;
  }

  seen.add(key);
  queries.push(query);
}

export function generateRepairSearchQueries(motorcycle: Pick<Bike, 'brand' | 'model' | 'year'>) {
  const queries: RepairSearchQuery[] = [];
  const seen = new Set<string>();
  const displacement = extractDisplacementFromModel(motorcycle.model);

  addSearchQuery(queries, seen, { make: motorcycle.brand, model: motorcycle.model, year: motorcycle.year });
  addSearchQuery(queries, seen, { make: motorcycle.brand, model: motorcycle.model });
  addSearchQuery(queries, seen, { make: motorcycle.brand, model: firstModelPart(motorcycle.model) ?? motorcycle.model });

  if (displacement) {
    addSearchQuery(queries, seen, { make: motorcycle.brand, model: displacement });
  }

  generateMakeVariants(motorcycle.brand).forEach((make) => {
    generateModelVariants(motorcycle.model).forEach((model) => {
      addSearchQuery(queries, seen, { make, model });
    });
  });

  return queries;
}

export function getInvalidTechnicalFields(input: unknown): readonly InvalidTechnicalField[] {
  const normalizedMotorcycle = normalizeMotorcycle(input, { allowPlaceholders: false }).motorcycle;

  return repairableFields.flatMap(({ camelField, field, rawKeys }) => {
    const normalizedValue = normalizedMotorcycle[camelField];

    if (isUsefulTechnicalNumber(normalizedValue)) {
      return [];
    }

    return [
      {
        camelField,
        field,
        value: getRawValue(input, rawKeys),
      },
    ];
  });
}

function getCandidateTechnicalValue(apiResult: ApiNinjasMotorcycle, camelField: RepairableCamelField) {
  const normalized = normalizeMotorcycle(apiResult, { allowPlaceholders: false }).motorcycle;
  const value = normalized[camelField];

  return isUsefulTechnicalNumber(value) ? value : undefined;
}

function buildAttempt(query: RepairSearchQuery, results: readonly ApiNinjasMotorcycle[], error?: unknown): SearchAttempt {
  return {
    error: error instanceof Error ? error.message : error ? String(error) : undefined,
    query,
    results: results.slice(0, 5).map((result) => ({ make: result.make, model: result.model, year: result.year })),
    resultsFound: results.length,
  };
}

function buildReportIdentity(motorcycle: Partial<Bike>) {
  return {
    brand: getText(motorcycle.brand, 'sin marca'),
    id: getText(motorcycle.id, 'sin-id'),
    model: getText(motorcycle.model, 'sin modelo'),
  };
}

function toMotorcycleWithRepairedFields(motorcycle: Bike, fields: readonly RepairedField[]) {
  const repairedMotorcycle = { ...motorcycle } as MutableMotorcycle;

  fields.forEach((field) => {
    const definition = repairableFields.find((candidate) => candidate.field === field.field);

    if (definition) {
      repairedMotorcycle[definition.camelField] = field.newValue;
    }
  });

  return repairedMotorcycle as Bike;
}

async function repairSingleMotorcycle({
  apiKey,
  fetchImpl,
  logger,
  motorcycle,
}: Readonly<{
  apiKey?: string;
  fetchImpl?: ApiNinjasFetch;
  logger: ImportLogger;
  motorcycle: Bike;
}>) {
  const initialInvalidFields = getInvalidTechnicalFields(motorcycle);
  const searchesAttempted: SearchAttempt[] = [];
  const fieldsRepaired: RepairedField[] = [];

  if (initialInvalidFields.length === 0 || !apiKey) {
    return {
      fieldsRepaired,
      initialInvalidFields,
      repairedMotorcycle: motorcycle,
      searchesAttempted,
    };
  }

  const client = createApiNinjasMotorcycleClient({ apiKey, fetchImpl });
  const searchQueries = generateRepairSearchQueries(motorcycle);
  let remainingInvalidFields = [...initialInvalidFields];

  for (const query of searchQueries) {
    logger.log(`🔎 Reparando ${motorcycle.brand} ${motorcycle.model}: ${query.make} / ${query.model}${query.year ? ` / ${query.year}` : ''}`);

    try {
      const results = await client.searchMotorcycles({ seed: query });
      searchesAttempted.push(buildAttempt(query, results));

      for (const result of results) {
        const newRepairs = remainingInvalidFields.flatMap((invalidField) => {
          const newValue = getCandidateTechnicalValue(result, invalidField.camelField);

          return newValue === undefined
            ? []
            : [
                {
                  field: invalidField.field,
                  newValue,
                  oldValue: invalidField.value,
                  query,
                },
              ];
        });

        fieldsRepaired.push(...newRepairs.filter((repair) => !fieldsRepaired.some((existing) => existing.field === repair.field)));
        remainingInvalidFields = remainingInvalidFields.filter(
          (invalidField) => !fieldsRepaired.some((repair) => repair.field === invalidField.field),
        );

        if (remainingInvalidFields.length === 0) {
          break;
        }
      }
    } catch (error) {
      searchesAttempted.push(buildAttempt(query, [], error));
      logger.warn(`⚠️ Búsqueda fallida para ${motorcycle.brand} ${motorcycle.model}: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (remainingInvalidFields.length === 0) {
      break;
    }
  }

  return {
    fieldsRepaired,
    initialInvalidFields,
    repairedMotorcycle: toMotorcycleWithRepairedFields(motorcycle, fieldsRepaired),
    searchesAttempted,
  };
}

export async function repairMotorcycleData({
  env = process.env,
  fetchImpl,
  inputFileUrl = importPaths.motorcyclesFileUrl,
  logger = console,
  motorcycles,
  repairedFileUrl = importPaths.repairedMotorcyclesFileUrl,
  reportFileUrl = importPaths.repairReportFileUrl,
  writeRepairedMotorcycles = (repairedMotorcycles, fileUrl) => writeJsonFile(fileUrl, repairedMotorcycles),
  writeRepairReport = (report, fileUrl) => writeJsonFile(fileUrl, report),
}: RepairMotorcycleDataOptions = {}): Promise<RepairMotorcycleDataResult> {
  const apiKey = env.API_NINJAS_KEY?.trim();
  const sourceMotorcycles = motorcycles ?? (await readJsonFile<readonly Bike[]>(inputFileUrl));
  const repairedMotorcycles: Bike[] = [];
  const motorcyclesRepaired: RepairReportMotorcycle[] = [];
  const motorcyclesUnrepaired: RepairReportMotorcycle[] = [];

  logger.log(`📦 Motos leídas: ${sourceMotorcycles.length}`);

  if (!apiKey) {
    logger.warn('⚠️ API_NINJAS_KEY no configurada. Se generará reporte sin conectar a API real.');
  }

  for (const motorcycle of sourceMotorcycles) {
    const repairResult = await repairSingleMotorcycle({ apiKey, fetchImpl, logger, motorcycle });
    const remainingInvalidFields = getInvalidTechnicalFields(repairResult.repairedMotorcycle);
    const resultsFound = repairResult.searchesAttempted.reduce((total, attempt) => total + attempt.resultsFound, 0);
    const identity = buildReportIdentity(motorcycle);

    repairedMotorcycles.push(repairResult.repairedMotorcycle);

    if (repairResult.fieldsRepaired.length > 0) {
      motorcyclesRepaired.push({
        ...identity,
        fieldsRepaired: repairResult.fieldsRepaired,
        remainingInvalidFields,
        resultsFound,
        searchesAttempted: repairResult.searchesAttempted,
      });
    }

    if (remainingInvalidFields.length > 0) {
      motorcyclesUnrepaired.push({
        ...identity,
        invalidFields: remainingInvalidFields,
        resultsFound,
        searchesAttempted: repairResult.searchesAttempted,
      });
    }
  }

  const report: MotorcycleRepairReport = {
    generatedAt: new Date().toISOString(),
    motorcyclesRead: sourceMotorcycles.length,
    motorcyclesRepaired,
    motorcyclesUnrepaired,
    skippedReason: apiKey ? undefined : 'API_NINJAS_KEY no configurada.',
  };

  await writeRepairedMotorcycles(repairedMotorcycles, repairedFileUrl);
  await writeRepairReport(report, reportFileUrl);

  logger.log(`💾 Generado ${getRelativePath(repairedFileUrl)}.`);
  logger.log(`💾 Generado ${getRelativePath(reportFileUrl)}.`);
  logger.log('🛡️ data/import/motorcycles.json NO se ha sobrescrito. Revisa los archivos generados antes de copiar nada.');

  return {
    invalidCount: sourceMotorcycles.filter((motorcycle) => getInvalidTechnicalFields(motorcycle).length > 0).length,
    readCount: sourceMotorcycles.length,
    repairedCount: motorcyclesRepaired.length,
    report,
    skipped: !apiKey,
    unrepairedCount: motorcyclesUnrepaired.length,
  };
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isDirectRun) {
  repairMotorcycleData().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Reparación de motos fallida: ${message}`);
    process.exitCode = 1;
  });
}
