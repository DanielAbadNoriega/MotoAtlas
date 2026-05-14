import type { Bike, BikeEngineType, BikeLicense, BikeSegment, BikeUseScores } from '../../types/bike';
import { buildMotorcyclePayload } from './importUtils';
import { normalizeMotorcycle, type NormalizeMotorcycleOptions } from './normalizeMotorcycle';
import type {
  DeepPartialBike,
  MotorcycleImportValidationResult,
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

export type ValidateMotorcycleImportOptions = Pick<NormalizeMotorcycleOptions, 'allowPlaceholders'>;

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function pushError(errors: MotorcycleValidationError[], field: string, message: string) {
  errors.push({ field, message });
}

function validateText(errors: MotorcycleValidationError[], motorcycle: DeepPartialBike, camelField: keyof Bike, snakeField: string) {
  if (!isNonEmptyString(motorcycle[camelField])) {
    pushError(errors, snakeField, `${snakeField} es obligatorio y debe ser texto no vacío.`);
  }
}

function validateNumber(errors: MotorcycleValidationError[], motorcycle: DeepPartialBike, camelField: keyof Bike, snakeField: string) {
  if (!isFiniteNumber(motorcycle[camelField])) {
    pushError(errors, snakeField, `${snakeField} es obligatorio y debe ser numérico.`);
  }
}

function validateEnum<T extends string>(
  errors: MotorcycleValidationError[],
  value: unknown,
  validValues: readonly T[],
  snakeField: string,
) {
  if (!validValues.includes(value as T)) {
    pushError(errors, snakeField, `${snakeField} es obligatorio y debe ser válido.`);
  }
}

function validateUseScores(errors: MotorcycleValidationError[], useScores: DeepPartialBike['useScores']) {
  if (typeof useScores !== 'object' || useScores === null) {
    pushError(errors, 'use_scores', 'use_scores es obligatorio y debe ser un objeto.');
    return;
  }

  useScoreKeys.forEach((key) => {
    const score = useScores[key];
    const field = `use_scores.${key}`;

    if (!isFiniteNumber(score)) {
      pushError(errors, field, `${field} es obligatorio y debe ser numérico.`);
      return;
    }

    if (score < 0 || score > 10) {
      pushError(errors, field, `${field} debe estar entre 0 y 10.`);
    }
  });
}

function validateNormalizedMotorcycle(motorcycle: DeepPartialBike) {
  const errors: MotorcycleValidationError[] = [];

  validateText(errors, motorcycle, 'id', 'id');
  validateText(errors, motorcycle, 'brand', 'brand');
  validateText(errors, motorcycle, 'model', 'model');
  validateNumber(errors, motorcycle, 'year', 'year');
  validateEnum(errors, motorcycle.segment, segmentValues, 'segment');
  validateEnum(errors, motorcycle.license, licenseValues, 'license');
  validateEnum(errors, motorcycle.engineType, engineTypeValues, 'engine_type');
  validateNumber(errors, motorcycle, 'displacementCc', 'displacement_cc');
  validateNumber(errors, motorcycle, 'powerHp', 'power_hp');
  validateNumber(errors, motorcycle, 'torqueNm', 'torque_nm');
  validateNumber(errors, motorcycle, 'wetWeightKg', 'wet_weight_kg');
  validateNumber(errors, motorcycle, 'seatHeightMm', 'seat_height_mm');
  validateNumber(errors, motorcycle, 'fuelTankLiters', 'fuel_tank_liters');
  validateNumber(errors, motorcycle, 'priceEur', 'price_eur');
  validateText(errors, motorcycle, 'imageUrl', 'image_url');
  validateText(errors, motorcycle, 'description', 'description');
  validateUseScores(errors, motorcycle.useScores);

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

function formatItemErrors(index: number, errors: readonly MotorcycleValidationError[]) {
  return errors.map((error) => `motorcycles[${index}].${error.message}`);
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
    const validationErrors = validateNormalizedMotorcycle(normalization.motorcycle);
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
      warnings: normalization.warnings,
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
