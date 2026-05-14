import type { Bike, BikeEngineType, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores } from '../../types/bike';
import type { ApiNinjasMotorcycle, DeepPartialBike, MotorcycleNormalizationResult, MotorcycleNormalizationWarning } from './motorcycleImportTypes';

export const PLACEHOLDER_IMAGE_URL =
  'https://placehold.co/1200x800/151515/e4002b?text=MotoAtlas+sin+imagen';

export const PLACEHOLDER_DESCRIPTION =
  'Sin descripción disponible. Datos pendientes de revisión manual en MotoAtlas.';

export const DEFAULT_FEATURES: BikeFeatures = {
  absCornering: false,
  cruiseControl: false,
  heatedGrips: false,
  quickshifter: false,
  ridingModes: false,
  tractionControl: false,
  tubelessWheels: false,
};

export const DEFAULT_RELIABILITY_REPORTS: Bike['reliabilityReports'] = {
  commonIssues: [],
  reliabilityScore: 0,
  reportCount: 0,
};

export const SEGMENT_DEFAULT_USE_SCORES: Record<BikeSegment, BikeUseScores> = {
  naked: {
    beginner: 6,
    city: 8,
    funFactor: 8,
    offroad: 1,
    passenger: 4,
    sport: 8,
    touring: 5,
  },
  'sport-touring': {
    beginner: 4,
    city: 6,
    funFactor: 7,
    offroad: 2,
    passenger: 8,
    sport: 7,
    touring: 9,
  },
  trail: {
    beginner: 5,
    city: 6,
    funFactor: 7,
    offroad: 7,
    passenger: 6,
    sport: 6,
    touring: 7,
  },
};

const segmentValues = ['trail', 'naked', 'sport-touring'] as const satisfies readonly BikeSegment[];
const licenseValues = ['A2', 'A'] as const satisfies readonly BikeLicense[];
const engineTypeValues = [
  'single-cylinder',
  'parallel-twin',
  'inline-three',
  'inline-four',
  'v-twin',
  'l-twin',
  'boxer-twin',
] as const satisfies readonly BikeEngineType[];

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

export type NormalizeMotorcycleOptions = Readonly<{
  allowPlaceholders?: boolean;
  existingMotorcycle?: DeepPartialBike;
}>;

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addWarning(warnings: MotorcycleNormalizationWarning[], field: string, message: string) {
  warnings.push({ field, message });
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const compactValue = value.replace(/\s+/g, '');
  const normalizedValue =
    /\d,\d{3}(?:\D|$)/.test(compactValue) || (compactValue.includes(',') && compactValue.includes('.'))
      ? compactValue.replace(/,/g, '')
      : compactValue.replace(',', '.');
  const match = normalizedValue.match(/-?\d+(?:\.\d+)?/);
  const parsedValue = match ? Number(match[0]) : Number.NaN;

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (['true', 'yes', 'sí', 'si', '1'].includes(normalizedValue)) {
      return true;
    }

    if (['false', 'no', '0'].includes(normalizedValue)) {
      return false;
    }
  }

  return undefined;
}

function normalizeTextArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : undefined;
}

function readFirst(record: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}

function textFrom(record: Record<string, unknown>, keys: readonly string[], fallback?: unknown) {
  return normalizeText(readFirst(record, keys)) ?? normalizeText(fallback);
}

function numberFrom(record: Record<string, unknown>, keys: readonly string[], fallback?: unknown) {
  return normalizeNumber(readFirst(record, keys)) ?? normalizeNumber(fallback);
}

function booleanFrom(record: Record<string, unknown>, keys: readonly string[], fallback?: unknown) {
  return normalizeBoolean(readFirst(record, keys)) ?? normalizeBoolean(fallback);
}

function enumFrom<T extends string>(
  record: Record<string, unknown>,
  keys: readonly string[],
  validValues: readonly T[],
  fallback?: unknown,
) {
  const rawValue = normalizeText(readFirst(record, keys)) ?? normalizeText(fallback);

  if (!rawValue) {
    return undefined;
  }

  return validValues.includes(rawValue as T) ? (rawValue as T) : undefined;
}

export function slugifyMotorcycleId(brand: string, model: string, year: number) {
  return `${brand}-${model}-${year}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferSegment(rawText: string): BikeSegment {
  const text = rawText.toLowerCase();

  if (
    text.includes('mt-') ||
    text.includes('hornet') ||
    text.includes('z900') ||
    text.includes('gsx-8s') ||
    text.includes('street triple') ||
    text.includes('naked') ||
    text.includes('roadster')
  ) {
    return 'naked';
  }

  if (
    text.includes('tracer') ||
    text.includes('versys') ||
    text.includes('f 900 xr') ||
    text.includes('multistrada') ||
    text.includes('nt1100') ||
    text.includes('sport touring') ||
    text.includes('sport-touring')
  ) {
    return 'sport-touring';
  }

  return 'trail';
}

function inferLicense(powerHp?: number): BikeLicense {
  return powerHp !== undefined && powerHp <= 95 ? 'A2' : 'A';
}

function inferEngineType(rawText: string): BikeEngineType {
  const text = rawText.toLowerCase();

  if (text.includes('boxer') || text.includes('r 1300 gs')) {
    return 'boxer-twin';
  }

  if (text.includes('single') || text.includes('monocil')) {
    return 'single-cylinder';
  }

  if (text.includes('l-twin') || text.includes('desertx') || text.includes('multistrada')) {
    return 'l-twin';
  }

  if (text.includes('v-twin') || text.includes('v2') || text.includes('v 2')) {
    return 'v-twin';
  }

  if (text.includes('inline-three') || text.includes('in-line three') || text.includes('three cylinder') || text.includes('triple')) {
    return 'inline-three';
  }

  if (text.includes('inline-four') || text.includes('in-line four') || text.includes('four cylinder') || text.includes('z900')) {
    return 'inline-four';
  }

  return 'parallel-twin';
}

function normalizeUseScores(value: unknown, fallback?: Partial<BikeUseScores>) {
  if (!isRecord(value) && !fallback) {
    return undefined;
  }

  const source = isRecord(value) ? value : {};
  const result: Partial<Mutable<BikeUseScores>> = {};

  useScoreKeys.forEach((key) => {
    const normalizedValue = normalizeNumber(source[key]) ?? normalizeNumber(fallback?.[key]);

    if (normalizedValue !== undefined) {
      result[key] = normalizedValue;
    }
  });

  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeFeatures(value: unknown, record: Record<string, unknown>, fallback?: Partial<BikeFeatures>) {
  const source = isRecord(value) ? value : {};
  const result: Partial<Mutable<BikeFeatures>> = {};

  featureKeys.forEach((key) => {
    const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    const normalizedValue = normalizeBoolean(source[key]) ?? booleanFrom(record, [snakeCaseKey], fallback?.[key]);

    if (normalizedValue !== undefined) {
      result[key] = normalizedValue;
    }
  });

  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeReliabilityReports(record: Record<string, unknown>, fallback?: DeepPartialBike['reliabilityReports']) {
  const source = isRecord(record.reliabilityReports) ? record.reliabilityReports : {};
  const commonIssues =
    normalizeTextArray(source.commonIssues) ?? normalizeTextArray(record.common_issues) ?? normalizeTextArray(fallback?.commonIssues);
  const reportCount = normalizeNumber(source.reportCount) ?? normalizeNumber(record.report_count) ?? normalizeNumber(fallback?.reportCount);
  const reliabilityScore =
    normalizeNumber(source.reliabilityScore) ?? normalizeNumber(record.reliability_score) ?? normalizeNumber(fallback?.reliabilityScore);

  if (commonIssues === undefined && reportCount === undefined && reliabilityScore === undefined) {
    return undefined;
  }

  return {
    commonIssues: commonIssues ?? [],
    reliabilityScore: reliabilityScore ?? 0,
    reportCount: reportCount ?? 0,
  };
}

function withPlaceholder<T>(
  value: T | undefined,
  placeholder: T,
  allowPlaceholders: boolean,
  warnings: MotorcycleNormalizationWarning[],
  field: string,
  message: string,
) {
  if (value !== undefined) {
    return value;
  }

  if (!allowPlaceholders) {
    return undefined;
  }

  addWarning(warnings, field, message);
  return placeholder;
}

function withRequiredNumberWarning(
  value: number | undefined,
  allowPlaceholders: boolean,
  warnings: MotorcycleNormalizationWarning[],
  field: string,
  message: string,
) {
  if (value !== undefined) {
    return value;
  }

  if (allowPlaceholders) {
    addWarning(warnings, field, message);
  }

  return undefined;
}

export function normalizeMotorcycle(input: unknown, options: NormalizeMotorcycleOptions = {}): MotorcycleNormalizationResult {
  const warnings: MotorcycleNormalizationWarning[] = [];

  if (!isRecord(input)) {
    return {
      motorcycle: {},
      warnings: [{ field: 'root', message: 'La moto no es un objeto válido.' }],
    };
  }

  const allowPlaceholders = options.allowPlaceholders ?? false;
  const existing = options.existingMotorcycle;
  const apiInput = input as ApiNinjasMotorcycle;

  const brand = textFrom(input, ['brand', 'make'], existing?.brand);
  const model = textFrom(input, ['model'], existing?.model);
  const year = numberFrom(input, ['year'], existing?.year);
  const rawText = [brand, model, apiInput.type, apiInput.engine].filter(Boolean).join(' ');

  const displacementCc = numberFrom(input, ['displacementCc', 'displacement_cc', 'displacement'], existing?.displacementCc);
  const powerHp = numberFrom(input, ['powerHp', 'power_hp', 'power'], existing?.powerHp);
  const torqueNm = numberFrom(input, ['torqueNm', 'torque_nm', 'torque'], existing?.torqueNm);
  const wetWeightKg = numberFrom(input, ['wetWeightKg', 'wet_weight_kg', 'total_weight'], existing?.wetWeightKg);
  const seatHeightMm = numberFrom(input, ['seatHeightMm', 'seat_height_mm', 'seat_height'], existing?.seatHeightMm);
  const fuelTankLiters = numberFrom(input, ['fuelTankLiters', 'fuel_tank_liters', 'fuel_capacity'], existing?.fuelTankLiters);
  const segment = enumFrom(input, ['segment'], segmentValues, existing?.segment) ?? (allowPlaceholders ? inferSegment(rawText) : undefined);
  const license = enumFrom(input, ['license'], licenseValues, existing?.license) ?? (allowPlaceholders ? inferLicense(powerHp) : undefined);
  const engineType =
    enumFrom(input, ['engineType', 'engine_type'], engineTypeValues, existing?.engineType) ??
    (allowPlaceholders ? inferEngineType(rawText) : undefined);

  const id =
    textFrom(input, ['id'], existing?.id) ??
    (allowPlaceholders && brand && model && year ? slugifyMotorcycleId(brand, model, year) : undefined);

  const priceEur = withPlaceholder(
    numberFrom(input, ['priceEur', 'price_eur'], existing?.priceEur),
    0,
    allowPlaceholders,
    warnings,
    'price_eur',
    'Precio ausente: se usa 0 como placeholder hasta revisión manual.',
  );
  const imageUrl = withPlaceholder(
    textFrom(input, ['imageUrl', 'image_url'], existing?.imageUrl),
    PLACEHOLDER_IMAGE_URL,
    allowPlaceholders,
    warnings,
    'image_url',
    'Imagen ausente: se usa placeholder controlado.',
  );
  const description = withPlaceholder(
    textFrom(input, ['description'], existing?.description),
    PLACEHOLDER_DESCRIPTION,
    allowPlaceholders,
    warnings,
    'description',
    'Descripción ausente: se usa placeholder controlado.',
  );

  const inferredSegment = segment ?? 'trail';
  const useScores = withPlaceholder(
    normalizeUseScores(input.useScores ?? input.use_scores, existing?.useScores),
    SEGMENT_DEFAULT_USE_SCORES[inferredSegment],
    allowPlaceholders,
    warnings,
    'use_scores',
    'Puntuaciones de uso ausentes: se usan puntuaciones estimadas por segmento.',
  );

  const features = normalizeFeatures(input.features, input, existing?.features) ?? DEFAULT_FEATURES;
  const pros = normalizeTextArray(input.pros) ?? normalizeTextArray(existing?.pros) ?? [];
  const cons = normalizeTextArray(input.cons) ?? normalizeTextArray(existing?.cons) ?? [];
  const reliabilityReports = normalizeReliabilityReports(input, existing?.reliabilityReports) ?? DEFAULT_RELIABILITY_REPORTS;

  const motorcycle: DeepPartialBike = {
    brand,
    cons,
    description,
    displacementCc: withRequiredNumberWarning(
      displacementCc,
      allowPlaceholders,
      warnings,
      'displacement_cc',
      'Cilindrada ausente o inválida: no se aplica placeholder numérico.',
    ),
    engineType,
    features,
    fuelTankLiters: withRequiredNumberWarning(
      fuelTankLiters,
      allowPlaceholders,
      warnings,
      'fuel_tank_liters',
      'Depósito ausente o inválido: no se aplica placeholder numérico.',
    ),
    id,
    imageUrl,
    license,
    model,
    powerHp: withRequiredNumberWarning(
      powerHp,
      allowPlaceholders,
      warnings,
      'power_hp',
      'Potencia ausente o inválida: no se aplica placeholder numérico.',
    ),
    priceEur,
    pros,
    reliabilityReports,
    seatHeightMm: withRequiredNumberWarning(
      seatHeightMm,
      allowPlaceholders,
      warnings,
      'seat_height_mm',
      'Altura de asiento ausente o inválida: no se aplica placeholder numérico.',
    ),
    segment,
    torqueNm: withRequiredNumberWarning(
      torqueNm,
      allowPlaceholders,
      warnings,
      'torque_nm',
      'Par ausente o inválido: no se aplica placeholder numérico.',
    ),
    useScores,
    wetWeightKg: withRequiredNumberWarning(
      wetWeightKg,
      allowPlaceholders,
      warnings,
      'wet_weight_kg',
      'Peso en orden de marcha ausente o inválido: no se aplica placeholder numérico.',
    ),
    year,
  };

  return { motorcycle, warnings };
}
