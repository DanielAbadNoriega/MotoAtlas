import type { Bike, BikeEngineType, BikeLicense, BikeSegment, BikeUseScores } from '../../types/bike';
import { buildMotorcyclePayload } from './importUtils';
import { normalizeMotorcycle, type NormalizeMotorcycleOptions } from './normalizeMotorcycle';
import type {
  DeepPartialBike,
  MotorcycleImportValidationResult,
  MotorcycleNormalizationWarning,
  MotorcycleValidationError,
  MotorcycleValidationItem,
} from './motorcycleImportTypes';

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

const rawFieldKeys = {
  brand: ['brand', 'make'],
  description: ['description'],
  displacement_cc: ['displacement_cc', 'displacementCc', 'displacement'],
  engine_type: ['engine_type', 'engineType', 'engine'],
  fuel_tank_liters: ['fuel_tank_liters', 'fuelTankLiters', 'fuel_capacity'],
  id: ['id'],
  image_url: ['image_url', 'imageUrl'],
  license: ['license'],
  model: ['model'],
  power_hp: ['power_hp', 'powerHp', 'power'],
  price_eur: ['price_eur', 'priceEur'],
  seat_height_mm: ['seat_height_mm', 'seatHeightMm', 'seat_height'],
  segment: ['segment', 'type'],
  torque_nm: ['torque_nm', 'torqueNm', 'torque'],
  use_scores: ['use_scores', 'useScores'],
  wet_weight_kg: ['wet_weight_kg', 'wetWeightKg', 'total_weight'],
  year: ['year'],
} as const;

const positiveNumberFields = [
  { camelField: 'displacementCc', snakeField: 'displacement_cc' },
  { camelField: 'powerHp', snakeField: 'power_hp' },
  { camelField: 'torqueNm', snakeField: 'torque_nm' },
  { camelField: 'wetWeightKg', snakeField: 'wet_weight_kg' },
  { camelField: 'seatHeightMm', snakeField: 'seat_height_mm' },
  { camelField: 'fuelTankLiters', snakeField: 'fuel_tank_liters' },
] as const satisfies readonly { camelField: keyof Bike; snakeField: keyof typeof rawFieldKeys }[];

export type ValidateMotorcycleImportOptions = Pick<NormalizeMotorcycleOptions, 'allowPlaceholders'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function readRawValue(input: unknown, field: keyof typeof rawFieldKeys) {
  if (!isRecord(input)) {
    return input;
  }

  for (const key of rawFieldKeys[field]) {
    if (key in input) {
      return input[key];
    }
  }

  return undefined;
}

function pushError(
  errors: MotorcycleValidationError[],
  field: keyof typeof rawFieldKeys | string,
  message: string,
  receivedValue?: unknown,
) {
  errors.push({ field, message, receivedValue });
}

function pushWarning(warnings: MotorcycleNormalizationWarning[], field: string, message: string) {
  warnings.push({ field, message });
}

function validateText(
  errors: MotorcycleValidationError[],
  input: unknown,
  motorcycle: DeepPartialBike,
  camelField: keyof Bike,
  snakeField: keyof typeof rawFieldKeys,
) {
  if (!isNonEmptyString(motorcycle[camelField])) {
    pushError(errors, snakeField, `${snakeField} es obligatorio y debe ser texto no vacío.`, readRawValue(input, snakeField));
  }
}

function validateNumber(
  errors: MotorcycleValidationError[],
  input: unknown,
  motorcycle: DeepPartialBike,
  camelField: keyof Bike,
  snakeField: keyof typeof rawFieldKeys,
) {
  if (!isFiniteNumber(motorcycle[camelField])) {
    pushError(errors, snakeField, `${snakeField} es obligatorio y debe ser numérico.`, readRawValue(input, snakeField));
  }
}

function validatePositiveNumber(
  errors: MotorcycleValidationError[],
  input: unknown,
  motorcycle: DeepPartialBike,
  camelField: keyof Bike,
  snakeField: keyof typeof rawFieldKeys,
) {
  const value = motorcycle[camelField];
  const receivedValue = readRawValue(input, snakeField);

  if (!isFiniteNumber(value)) {
    pushError(errors, snakeField, `${snakeField} es obligatorio y debe ser numérico.`, receivedValue);
    return;
  }

  if (value <= 0) {
    pushError(errors, snakeField, `${snakeField} debe ser mayor que 0.`, receivedValue);
  }
}

function validatePrice(
  errors: MotorcycleValidationError[],
  warnings: MotorcycleNormalizationWarning[],
  input: unknown,
  motorcycle: DeepPartialBike,
) {
  const value = motorcycle.priceEur;
  const receivedValue = readRawValue(input, 'price_eur');

  if (!isFiniteNumber(value)) {
    pushError(errors, 'price_eur', 'price_eur es obligatorio y debe ser numérico.', receivedValue);
    return;
  }

  if (value < 0) {
    pushError(errors, 'price_eur', 'price_eur debe ser 0 o mayor que 0.', receivedValue);
    return;
  }

  if (value === 0) {
    pushWarning(warnings, 'price_eur', 'Precio 0 detectado: se acepta como placeholder y debe revisarse manualmente.');
  }
}

function validateEnum<T extends string>(
  errors: MotorcycleValidationError[],
  input: unknown,
  value: unknown,
  validValues: readonly T[],
  snakeField: keyof typeof rawFieldKeys,
) {
  if (!validValues.includes(value as T)) {
    pushError(errors, snakeField, `${snakeField} es obligatorio y debe ser válido.`, readRawValue(input, snakeField));
  }
}

function validateUseScores(errors: MotorcycleValidationError[], input: unknown, useScores: DeepPartialBike['useScores']) {
  if (typeof useScores !== 'object' || useScores === null) {
    pushError(errors, 'use_scores', 'use_scores es obligatorio y debe ser un objeto.', readRawValue(input, 'use_scores'));
    return;
  }

  useScoreKeys.forEach((key) => {
    const score = useScores[key];
    const field = `use_scores.${key}`;

    if (!isFiniteNumber(score)) {
      const rawUseScores = readRawValue(input, 'use_scores');
      const receivedValue = isRecord(rawUseScores) ? rawUseScores[key] : rawUseScores;
      pushError(errors, field, `${field} es obligatorio y debe ser numérico.`, receivedValue);
      return;
    }

    if (score < 0 || score > 10) {
      pushError(errors, field, `${field} debe estar entre 0 y 10.`, score);
    }
  });
}

function validateNormalizedMotorcycle(input: unknown, motorcycle: DeepPartialBike, warnings: MotorcycleNormalizationWarning[]) {
  const errors: MotorcycleValidationError[] = [];

  validateText(errors, input, motorcycle, 'id', 'id');
  validateText(errors, input, motorcycle, 'brand', 'brand');
  validateText(errors, input, motorcycle, 'model', 'model');
  validateNumber(errors, input, motorcycle, 'year', 'year');
  validateEnum(errors, input, motorcycle.segment, segmentValues, 'segment');
  validateEnum(errors, input, motorcycle.license, licenseValues, 'license');
  validateEnum(errors, input, motorcycle.engineType, engineTypeValues, 'engine_type');
  positiveNumberFields.forEach(({ camelField, snakeField }) => validatePositiveNumber(errors, input, motorcycle, camelField, snakeField));
  validatePrice(errors, warnings, input, motorcycle);
  validateText(errors, input, motorcycle, 'imageUrl', 'image_url');
  validateText(errors, input, motorcycle, 'description', 'description');
  validateUseScores(errors, input, motorcycle.useScores);

  return errors;
}

function toCompleteBike(motorcycle: DeepPartialBike): Bike {
  return {
    brand: motorcycle.brand!,
    cons: motorcycle.cons ?? [],
    description: motorcycle.description!,
    displacementCc: motorcycle.displacementCc!,
    engineType: motorcycle.engineType!,
    features: {
      absCornering: motorcycle.features?.absCornering ?? false,
      cruiseControl: motorcycle.features?.cruiseControl ?? false,
      heatedGrips: motorcycle.features?.heatedGrips ?? false,
      quickshifter: motorcycle.features?.quickshifter ?? false,
      ridingModes: motorcycle.features?.ridingModes ?? false,
      tractionControl: motorcycle.features?.tractionControl ?? false,
      tubelessWheels: motorcycle.features?.tubelessWheels ?? false,
    },
    fuelTankLiters: motorcycle.fuelTankLiters!,
    id: motorcycle.id!,
    imageUrl: motorcycle.imageUrl!,
    license: motorcycle.license!,
    model: motorcycle.model!,
    powerHp: motorcycle.powerHp!,
    priceEur: motorcycle.priceEur!,
    pros: motorcycle.pros ?? [],
    reliabilityReports: {
      commonIssues: motorcycle.reliabilityReports?.commonIssues ?? [],
      reliabilityScore: motorcycle.reliabilityReports?.reliabilityScore ?? 0,
      reportCount: motorcycle.reliabilityReports?.reportCount ?? 0,
    },
    seatHeightMm: motorcycle.seatHeightMm!,
    segment: motorcycle.segment!,
    torqueNm: motorcycle.torqueNm!,
    useScores: motorcycle.useScores as BikeUseScores,
    wetWeightKg: motorcycle.wetWeightKg!,
    year: motorcycle.year!,
  };
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

function formatItemErrors(index: number, errors: readonly MotorcycleValidationError[]) {
  return errors.map((error) => {
    const valueLabel = `valor recibido: ${formatReceivedValue(error.receivedValue)}`;
    return `motorcycles[${index}].${error.message} (${valueLabel})`;
  });
}

export function validateMotorcycleImport(input: unknown, options: ValidateMotorcycleImportOptions = {}): MotorcycleImportValidationResult {
  if (!Array.isArray(input)) {
    return {
      errors: ['El archivo de importación debe contener un array de motos.'],
      invalidItems: [],
      items: [],
      payload: [],
      valid: false,
      validItems: [],
    };
  }

  const items: MotorcycleValidationItem[] = input.map((item, index) => {
    const normalization = normalizeMotorcycle(item, { allowPlaceholders: options.allowPlaceholders ?? false });
    const warnings = [...normalization.warnings];
    const validationErrors = validateNormalizedMotorcycle(item, normalization.motorcycle, warnings);
    const valid = validationErrors.length === 0;
    const motorcycle = valid ? toCompleteBike(normalization.motorcycle) : undefined;
    const payload = motorcycle ? buildMotorcyclePayload(motorcycle) : undefined;

    return {
      errors: validationErrors,
      id: normalization.motorcycle.id,
      index,
      motorcycle,
      normalizedMotorcycle: normalization.motorcycle,
      payload,
      valid,
      warnings,
    };
  });

  const invalidItems = items.filter((item) => !item.valid);
  const validItems = items.filter((item) => item.valid);
  const errors = items.flatMap((item) => formatItemErrors(item.index, item.errors));
  const payload = validItems.flatMap((item) => (item.payload ? [item.payload] : []));

  return {
    errors,
    invalidItems,
    items,
    payload,
    valid: errors.length === 0,
    validItems,
  };
}
