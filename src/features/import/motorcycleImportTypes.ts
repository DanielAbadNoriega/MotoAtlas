import type { Bike, BikeEngineType, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores, MotorcycleDataSource } from '../../types/bike';

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
  is_a2_compatible: boolean;
  is_a2_limited_version: boolean;
  limited_power_hp: number | null;
  original_power_hp: number | null;
  engine_type: BikeEngineType;
  displacement_cc: number;
  power_hp: number;
  torque_nm: number;
  wet_weight_kg: number;
  seat_height_mm: number;
  fuel_tank_liters: number;
  price_eur: number;
  image_url: string;
  image_locked: boolean;
  description: string;
  description_locked: boolean;
  specs_source: MotorcycleDataSource;
  price_source: MotorcycleDataSource;
  image_source: MotorcycleDataSource;
  scores_source: MotorcycleDataSource;
  pros_cons_source: MotorcycleDataSource;
  reliability_source: MotorcycleDataSource;
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
  receivedValue?: unknown;
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

export type SupabaseImportExistingMotorcycle = Readonly<{
  description: string;
  description_locked: boolean;
  id: string;
  image_locked: boolean;
  image_source?: MotorcycleDataSource;
  image_url: string;
}>;

export type SupabaseUpsertResponse = Readonly<{
  data: readonly Pick<Bike, 'id'>[] | null;
  error: { message: string } | null;
}>;

export type SupabaseSelectResponse = Readonly<{
  data: readonly SupabaseImportExistingMotorcycle[] | null;
  error: { message: string } | null;
}>;

export type SupabaseMotorcycleTable = Readonly<{
  upsert: (
    payload: readonly MotorcycleUpsertPayload[],
    options: { onConflict: 'id' },
  ) => Readonly<{
    select: (columns: 'id') => Promise<SupabaseUpsertResponse>;
  }>;
  select: (columns: string) => Readonly<{
    in: (column: 'id', values: readonly string[]) => Promise<SupabaseSelectResponse>;
  }>;
}>;

export type SupabaseMotorcycleClient = Readonly<{
  from: (table: 'motorcycles') => SupabaseMotorcycleTable;
}>;

export type ImportMotorcyclesResult = Readonly<{
  allowPartial: boolean;
  errors: readonly string[];
  importedCount: number;
  invalidCount: number;
  readCount: number;
  skippedCount: number;
  validCount: number;
  warnings: readonly MotorcycleNormalizationWarning[];
}>;
