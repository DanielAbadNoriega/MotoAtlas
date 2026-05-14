import type { Bike, BikeEngineType, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores, MotorcycleDataSource } from '../../types/bike';
import type { ApiNinjasMotorcycle, DeepPartialBike, MotorcycleNormalizationResult, MotorcycleNormalizationWarning } from './motorcycleImportTypes';
import { MOTORCYCLE_IMAGE_FALLBACK_URL, getMotorcycleImage } from '../../shared/images/getMotorcycleImage';
import {
  BIKE_LICENSES,
  BIKE_SEGMENTS,
  MOTORCYCLE_DATA_SOURCES,
  inferA2StatusFromBike,
} from '../../shared/motorcycles/motorcycleTaxonomy';

export const PLACEHOLDER_IMAGE_URL = MOTORCYCLE_IMAGE_FALLBACK_URL;

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

const nakedDefaultUseScores: BikeUseScores = {
    beginner: 6,
    city: 8,
    funFactor: 8,
    offroad: 1,
    passenger: 4,
    sport: 8,
    touring: 5,
};

const sportTouringDefaultUseScores: BikeUseScores = {
    beginner: 4,
    city: 6,
    funFactor: 7,
    offroad: 2,
    passenger: 8,
    sport: 7,
    touring: 9,
};

const trailDefaultUseScores: BikeUseScores = {
    beginner: 5,
    city: 6,
    funFactor: 7,
    offroad: 7,
    passenger: 6,
    sport: 6,
    touring: 7,
};

export const SEGMENT_DEFAULT_USE_SCORES: Record<BikeSegment, BikeUseScores> = {
  adventure: trailDefaultUseScores,
  cruiser: sportTouringDefaultUseScores,
  custom: sportTouringDefaultUseScores,
  'dual-sport': trailDefaultUseScores,
  enduro: trailDefaultUseScores,
  hypernaked: nakedDefaultUseScores,
  naked: nakedDefaultUseScores,
  'neo-retro': nakedDefaultUseScores,
  retro: nakedDefaultUseScores,
  scooter: { ...nakedDefaultUseScores, beginner: 8, city: 9, funFactor: 6, offroad: 0, sport: 4, touring: 5 },
  scrambler: { ...trailDefaultUseScores, offroad: 5, touring: 6 },
  sport: { ...nakedDefaultUseScores, sport: 9, beginner: 3 },
  'sport-touring': sportTouringDefaultUseScores,
  supersport: { ...nakedDefaultUseScores, city: 4, sport: 10, beginner: 2, passenger: 3 },
  touring: { ...sportTouringDefaultUseScores, touring: 10, passenger: 9, sport: 5 },
  trail: trailDefaultUseScores,
};

const segmentValues = BIKE_SEGMENTS;
const licenseValues = BIKE_LICENSES;
const engineTypeValues = [
  'single-cylinder',
  'parallel-twin',
  'inline-three',
  'inline-four',
  'v-twin',
  'l-twin',
  'boxer-twin',
] as const satisfies readonly BikeEngineType[];
const dataSourceValues = MOTORCYCLE_DATA_SOURCES;

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

function nullableNumberFrom(record: Record<string, unknown>, keys: readonly string[], fallback?: unknown) {
  const rawValue = readFirst(record, keys);

  if (rawValue === null) {
    return null;
  }

  const normalizedValue = normalizeNumber(rawValue) ?? normalizeNumber(fallback);
  return normalizedValue ?? null;
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

  if (text.includes('scooter')) {
    return 'scooter';
  }

  if (text.includes('supersport') || text.includes('rr') || text.includes('r1') || text.includes('zx-6r')) {
    return 'supersport';
  }

  if (text.includes('sport') && !text.includes('sport touring') && !text.includes('sport-touring')) {
    return 'sport';
  }

  if (text.includes('scrambler')) {
    return 'scrambler';
  }

  if (text.includes('cruiser')) {
    return 'cruiser';
  }

  if (text.includes('custom')) {
    return 'custom';
  }

  if (text.includes('retro') || text.includes('classic')) {
    return text.includes('neo') ? 'neo-retro' : 'retro';
  }

  if (text.includes('enduro')) {
    return 'enduro';
  }

  if (text.includes('dual sport') || text.includes('dual-sport')) {
    return 'dual-sport';
  }

  if (
    text.includes('mt-') ||
    text.includes('hornet') ||
    text.includes('z900') ||
    text.includes('gsx-8s') ||
    text.includes('street triple') ||
    text.includes('naked') ||
    text.includes('roadster')
  ) {
    return text.includes('super duke') ? 'hypernaked' : 'naked';
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

  if (text.includes('adventure')) {
    return 'adventure';
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
  const imageLocked = booleanFrom(input, ['imageLocked', 'image_locked'], existing?.imageLocked) ?? false;
  const descriptionLocked = booleanFrom(input, ['descriptionLocked', 'description_locked'], existing?.descriptionLocked) ?? false;

  const inferredA2Status = inferA2StatusFromBike({ license: license ?? 'A', powerHp });
  const isA2Compatible =
    booleanFrom(input, ['isA2Compatible', 'is_a2_compatible'], existing?.isA2Compatible) ?? inferredA2Status !== 'A';
  const isA2LimitedVersion =
    booleanFrom(input, ['isA2LimitedVersion', 'is_a2_limited_version'], existing?.isA2LimitedVersion) ??
    inferredA2Status === 'A2_LIMITABLE';
  const limitedPowerHp = nullableNumberFrom(input, ['limitedPowerHp', 'limited_power_hp'], existing?.limitedPowerHp);
  const originalPowerHp = nullableNumberFrom(input, ['originalPowerHp', 'original_power_hp'], existing?.originalPowerHp);

  const specsSource = enumFrom(input, ['specsSource', 'specs_source'], dataSourceValues, existing?.specsSource) ?? 'api';
  const priceSource =
    priceEur === 0
      ? 'placeholder'
      : enumFrom(input, ['priceSource', 'price_source'], dataSourceValues, existing?.priceSource) ?? 'manual';
  const imageSource =
    getMotorcycleImage({ brand, model, imageUrl }).isFallback
      ? 'placeholder'
      : enumFrom(input, ['imageSource', 'image_source'], dataSourceValues, existing?.imageSource) ?? 'manual';
  const scoresSource = enumFrom(input, ['scoresSource', 'scores_source'], dataSourceValues, existing?.scoresSource) ?? 'estimated';
  const prosConsSource =
    enumFrom(input, ['prosConsSource', 'pros_cons_source'], dataSourceValues, existing?.prosConsSource) ?? 'estimated';
  const reliabilitySource =
    enumFrom(input, ['reliabilitySource', 'reliability_source'], dataSourceValues, existing?.reliabilitySource) ?? 'estimated';

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
    descriptionLocked,
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
    imageLocked,
    imageSource: imageSource as MotorcycleDataSource,
    imageUrl,
    isA2Compatible,
    isA2LimitedVersion,
    license,
    limitedPowerHp: isA2LimitedVersion ? limitedPowerHp ?? 47.6 : limitedPowerHp,
    model,
    originalPowerHp: isA2LimitedVersion ? originalPowerHp ?? powerHp ?? null : originalPowerHp,
    powerHp: withRequiredNumberWarning(
      powerHp,
      allowPlaceholders,
      warnings,
      'power_hp',
      'Potencia ausente o inválida: no se aplica placeholder numérico.',
    ),
    priceEur,
    priceSource: priceSource as MotorcycleDataSource,
    pros,
    prosConsSource: prosConsSource as MotorcycleDataSource,
    reliabilityReports,
    reliabilitySource: reliabilitySource as MotorcycleDataSource,
    scoresSource: scoresSource as MotorcycleDataSource,
    seatHeightMm: withRequiredNumberWarning(
      seatHeightMm,
      allowPlaceholders,
      warnings,
      'seat_height_mm',
      'Altura de asiento ausente o inválida: no se aplica placeholder numérico.',
    ),
    segment,
    specsSource: specsSource as MotorcycleDataSource,
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
