import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Bike, BikeEngineType, BikeLicense, BikeSegment } from '../src/types/bike';

loadEnv({ path: '.env.import', quiet: true });

export type MotorcycleUpsertPayload = Readonly<{
  id: string;
  brand: string;
  model: string;
  year: number;
  segment: BikeSegment;
  license: BikeLicense;
  engine_type: BikeEngineType;
  displacement_cc: number;
  power_hp: number;
  torque_nm: number;
  wet_weight_kg: number;
  seat_height_mm: number;
  fuel_tank_liters: number;
  price_eur: number;
  image_url: string;
  description: string;
  use_scores: Bike['useScores'];
  abs_cornering: boolean;
  traction_control: boolean;
  riding_modes: boolean;
  cruise_control: boolean;
  quickshifter: boolean;
  heated_grips: boolean;
  tubeless_wheels: boolean;
  pros: readonly string[];
  cons: readonly string[];
  common_issues: readonly string[];
  report_count: number;
  reliability_score: number;
}>;

type ImportLogger = Pick<Console, 'error' | 'log'>;

type SupabaseUpsertResponse = Readonly<{
  data: readonly Pick<Bike, 'id'>[] | null;
  error: { message: string } | null;
}>;

type SupabaseMotorcycleTable = Readonly<{
  upsert: (
    payload: readonly MotorcycleUpsertPayload[],
    options: { onConflict: 'id' },
  ) => Readonly<{
    select: (columns: 'id') => Promise<SupabaseUpsertResponse>;
  }>;
}>;

export type SupabaseMotorcycleClient = Readonly<{
  from: (table: 'motorcycles') => SupabaseMotorcycleTable;
}>;

export type ImportValidationResult = Readonly<{
  errors: readonly string[];
  motorcycles: readonly Bike[];
  valid: boolean;
}>;

export type ImportMotorcyclesResult = Readonly<{
  importedCount: number;
  readCount: number;
}>;

const defaultImportFileUrl = new URL('../data/import/motorcycles.json', import.meta.url);

const topLevelRequiredFields = [
  'id',
  'brand',
  'model',
  'year',
  'segment',
  'license',
  'engineType',
  'displacementCc',
  'powerHp',
  'torqueNm',
  'wetWeightKg',
  'seatHeightMm',
  'fuelTankLiters',
  'priceEur',
  'imageUrl',
  'description',
  'useScores',
  'features',
  'pros',
  'cons',
  'reliabilityReports',
] as const satisfies readonly (keyof Bike)[];

const stringFields = ['id', 'brand', 'model', 'engineType', 'imageUrl', 'description'] as const satisfies readonly (keyof Bike)[];
const numberFields = [
  'year',
  'displacementCc',
  'powerHp',
  'torqueNm',
  'wetWeightKg',
  'seatHeightMm',
  'fuelTankLiters',
  'priceEur',
] as const satisfies readonly (keyof Bike)[];
const segmentValues = ['trail', 'naked', 'sport-touring'] as const;
const licenseValues = ['A2', 'A'] as const;
const useScoreKeys = ['city', 'touring', 'offroad', 'passenger', 'beginner', 'sport', 'funFactor'] as const;
const featureKeys = [
  'absCornering',
  'tractionControl',
  'ridingModes',
  'cruiseControl',
  'quickshifter',
  'heatedGrips',
  'tubelessWheels',
] as const;
const reliabilityFields = ['commonIssues', 'reportCount', 'reliabilityScore'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function pushMissingFieldErrors(record: Record<string, unknown>, fields: readonly string[], pathLabel: string, errors: string[]) {
  fields.forEach((field) => {
    if (!(field in record)) {
      errors.push(`${pathLabel}.${field} es obligatorio.`);
    }
  });
}

function validateMotorcycleRecord(value: unknown, index: number) {
  const errors: string[] = [];
  const pathLabel = `motorcycles[${index}]`;

  if (!isRecord(value)) {
    return { errors: [`${pathLabel} debe ser un objeto.`], motorcycle: undefined };
  }

  pushMissingFieldErrors(value, topLevelRequiredFields, pathLabel, errors);

  stringFields.forEach((field) => {
    if (field in value && !isNonEmptyString(value[field])) {
      errors.push(`${pathLabel}.${field} debe ser texto no vacío.`);
    }
  });

  numberFields.forEach((field) => {
    if (field in value && !isFiniteNumber(value[field])) {
      errors.push(`${pathLabel}.${field} debe ser numérico.`);
    }
  });

  if ('segment' in value && !segmentValues.includes(value.segment as BikeSegment)) {
    errors.push(`${pathLabel}.segment no es válido.`);
  }

  if ('license' in value && !licenseValues.includes(value.license as BikeLicense)) {
    errors.push(`${pathLabel}.license no es válido.`);
  }

  if ('pros' in value && !isStringArray(value.pros)) {
    errors.push(`${pathLabel}.pros debe ser un array de textos.`);
  }

  if ('cons' in value && !isStringArray(value.cons)) {
    errors.push(`${pathLabel}.cons debe ser un array de textos.`);
  }

  if ('useScores' in value) {
    const useScores = value.useScores;

    if (!isRecord(useScores)) {
      errors.push(`${pathLabel}.useScores debe ser un objeto.`);
    } else {
      pushMissingFieldErrors(useScores, useScoreKeys, `${pathLabel}.useScores`, errors);
      useScoreKeys.forEach((key) => {
        if (key in useScores && !isFiniteNumber(useScores[key])) {
          errors.push(`${pathLabel}.useScores.${key} debe ser numérico.`);
        }
      });
    }
  }

  if ('features' in value) {
    const features = value.features;

    if (!isRecord(features)) {
      errors.push(`${pathLabel}.features debe ser un objeto.`);
    } else {
      pushMissingFieldErrors(features, featureKeys, `${pathLabel}.features`, errors);
      featureKeys.forEach((key) => {
        if (key in features && typeof features[key] !== 'boolean') {
          errors.push(`${pathLabel}.features.${key} debe ser booleano.`);
        }
      });
    }
  }

  if ('reliabilityReports' in value) {
    if (!isRecord(value.reliabilityReports)) {
      errors.push(`${pathLabel}.reliabilityReports debe ser un objeto.`);
    } else {
      pushMissingFieldErrors(value.reliabilityReports, reliabilityFields, `${pathLabel}.reliabilityReports`, errors);

      if ('commonIssues' in value.reliabilityReports && !isStringArray(value.reliabilityReports.commonIssues)) {
        errors.push(`${pathLabel}.reliabilityReports.commonIssues debe ser un array de textos.`);
      }

      if ('reportCount' in value.reliabilityReports && !isFiniteNumber(value.reliabilityReports.reportCount)) {
        errors.push(`${pathLabel}.reliabilityReports.reportCount debe ser numérico.`);
      }

      if ('reliabilityScore' in value.reliabilityReports && !isFiniteNumber(value.reliabilityReports.reliabilityScore)) {
        errors.push(`${pathLabel}.reliabilityReports.reliabilityScore debe ser numérico.`);
      }
    }
  }

  return { errors, motorcycle: errors.length === 0 ? (value as Bike) : undefined };
}

export function validateMotorcycleImport(input: unknown): ImportValidationResult {
  if (!Array.isArray(input)) {
    return {
      errors: ['El archivo de importación debe contener un array de motos.'],
      motorcycles: [],
      valid: false,
    };
  }

  const errors: string[] = [];
  const motorcycles: Bike[] = [];

  input.forEach((item, index) => {
    const result = validateMotorcycleRecord(item, index);
    errors.push(...result.errors);

    if (result.motorcycle) {
      motorcycles.push(result.motorcycle);
    }
  });

  return {
    errors,
    motorcycles,
    valid: errors.length === 0,
  };
}

export function buildMotorcyclePayload(motorcycle: Bike): MotorcycleUpsertPayload {
  return {
    id: motorcycle.id,
    brand: motorcycle.brand,
    model: motorcycle.model,
    year: motorcycle.year,
    segment: motorcycle.segment,
    license: motorcycle.license,
    engine_type: motorcycle.engineType,
    displacement_cc: motorcycle.displacementCc,
    power_hp: motorcycle.powerHp,
    torque_nm: motorcycle.torqueNm,
    wet_weight_kg: motorcycle.wetWeightKg,
    seat_height_mm: motorcycle.seatHeightMm,
    fuel_tank_liters: motorcycle.fuelTankLiters,
    price_eur: motorcycle.priceEur,
    image_url: motorcycle.imageUrl,
    description: motorcycle.description,
    use_scores: motorcycle.useScores,
    abs_cornering: motorcycle.features.absCornering,
    traction_control: motorcycle.features.tractionControl,
    riding_modes: motorcycle.features.ridingModes,
    cruise_control: motorcycle.features.cruiseControl,
    quickshifter: motorcycle.features.quickshifter,
    heated_grips: motorcycle.features.heatedGrips,
    tubeless_wheels: motorcycle.features.tubelessWheels,
    pros: motorcycle.pros,
    cons: motorcycle.cons,
    common_issues: motorcycle.reliabilityReports.commonIssues,
    report_count: motorcycle.reliabilityReports.reportCount,
    reliability_score: motorcycle.reliabilityReports.reliabilityScore,
  };
}

export function buildMotorcyclesPayload(motorcycles: readonly Bike[]) {
  return motorcycles.map(buildMotorcyclePayload);
}

function getSupabaseImportConfig(env: NodeJS.ProcessEnv) {
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Revisá .env.import.');
  }

  return {
    serviceRoleKey,
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
  };
}

function createSupabaseImportClient(env: NodeJS.ProcessEnv): SupabaseMotorcycleClient {
  const { serviceRoleKey, supabaseUrl } = getSupabaseImportConfig(env);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as SupabaseMotorcycleClient;
}

async function readImportJson(fileUrl: URL) {
  const rawContent = await readFile(fileUrl, 'utf8');
  return JSON.parse(rawContent) as unknown;
}

export async function importMotorcycles({
  env = process.env,
  fileUrl = defaultImportFileUrl,
  logger = console,
  rawMotorcycles,
  supabase,
}: {
  env?: NodeJS.ProcessEnv;
  fileUrl?: URL;
  logger?: ImportLogger;
  rawMotorcycles?: unknown;
  supabase?: SupabaseMotorcycleClient;
} = {}): Promise<ImportMotorcyclesResult> {
  const importSource = rawMotorcycles ?? (await readImportJson(fileUrl));
  const readCount = Array.isArray(importSource) ? importSource.length : 0;

  logger.log(`📦 Motos leídas: ${readCount}`);

  const validation = validateMotorcycleImport(importSource);

  if (!validation.valid) {
    logger.error('❌ Errores de validación:');
    validation.errors.forEach((error) => logger.error(`- ${error}`));
    throw new Error(`Importación cancelada: ${validation.errors.length} error(es) de validación.`);
  }

  const payload = buildMotorcyclesPayload(validation.motorcycles);
  const client = supabase ?? createSupabaseImportClient(env);
  const { data, error } = await client.from('motorcycles').upsert(payload, { onConflict: 'id' }).select('id');

  if (error) {
    logger.error(`❌ Error importando motos: ${error.message}`);
    throw new Error(error.message);
  }

  const importedCount = data?.length ?? payload.length;
  logger.log(`✅ Motos importadas: ${importedCount}`);
  logger.log('🔁 Upsert completado usando id como clave de conflicto.');

  return { importedCount, readCount };
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isDirectRun) {
  importMotorcycles().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Importación fallida: ${message}`);
    process.exitCode = 1;
  });
}
