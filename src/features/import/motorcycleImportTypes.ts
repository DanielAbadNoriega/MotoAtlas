import type { Bike, BikeEngineType, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores } from '../../types/bike';

export type ImportLogger = Pick<Console, 'error' | 'log' | 'warn'>;

export type DeepPartialBike = Partial<
  Omit<Bike, 'features' | 'reliabilityReports' | 'useScores'> & {
    features: Partial<BikeFeatures>;
    reliabilityReports: Partial<Bike['reliabilityReports']>;
    useScores: Partial<BikeUseScores>;
  }
>;

export type MotorcycleSeed = Readonly<{
  make: string;
  model: string;
  year: number;
}>;

export type ApiNinjasMotorcycle = Readonly<{
  make?: string;
  model?: string;
  year?: string | number;
  type?: string;
  displacement?: string;
  engine?: string;
  power?: string;
  torque?: string;
  total_weight?: string;
  seat_height?: string;
  fuel_capacity?: string;
  [key: string]: unknown;
}>;

export type MotorcycleNormalizationWarning = Readonly<{
  field: string;
  message: string;
}>;

export type MotorcycleNormalizationResult = Readonly<{
  motorcycle: DeepPartialBike;
  warnings: readonly MotorcycleNormalizationWarning[];
}>;

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
  use_scores: BikeUseScores;
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

export type MotorcycleValidationError = Readonly<{
  field: keyof MotorcycleUpsertPayload | string;
  message: string;
}>;

export type MotorcycleValidationItem = Readonly<{
  index: number;
  id?: string;
  errors: readonly MotorcycleValidationError[];
  motorcycle?: Bike;
  normalizedMotorcycle: DeepPartialBike;
  payload?: MotorcycleUpsertPayload;
  valid: boolean;
  warnings: readonly MotorcycleNormalizationWarning[];
}>;

export type MotorcycleImportValidationResult = Readonly<{
  errors: readonly string[];
  invalidItems: readonly MotorcycleValidationItem[];
  items: readonly MotorcycleValidationItem[];
  payload: readonly MotorcycleUpsertPayload[];
  valid: boolean;
  validItems: readonly MotorcycleValidationItem[];
}>;

export type SupabaseUpsertResponse = Readonly<{
  data: readonly Pick<Bike, 'id'>[] | null;
  error: { message: string } | null;
}>;

export type SupabaseMotorcycleTable = Readonly<{
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

export type ImportMotorcyclesResult = Readonly<{
  errors: readonly string[];
  importedCount: number;
  invalidCount: number;
  readCount: number;
  validCount: number;
  warnings: readonly MotorcycleNormalizationWarning[];
}>;
