import { bikeCatalog } from '../data/bikes';
import type { Bike, BikeEngineType, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores, MotorcycleDataSource } from '../types/bike';
import { getMotorcycleImage } from '../shared/images/getMotorcycleImage';
import { getBikeA2Status } from '../shared/motorcycles/motorcycleTaxonomy';

type MotorcycleCatalogSource = 'supabase' | 'fallback';

export type MotorcycleServiceResult = Readonly<{
  motorcycles: readonly Bike[];
  source: MotorcycleCatalogSource;
  error?: Error;
}>;

type MotorcycleRow = Readonly<{
  id: string;
  brand: string;
  model: string;
  year: number;
  segment: BikeSegment;
  license: BikeLicense;
  is_a2_compatible?: boolean;
  is_a2_limited_version?: boolean;
  limited_power_hp?: number | null;
  original_power_hp?: number | null;
  engine_type: BikeEngineType;
  displacement_cc: number;
  power_hp: number;
  torque_nm: number;
  wet_weight_kg: number;
  seat_height_mm: number;
  fuel_tank_liters: number;
  price_eur: number;
  image_url: string;
  image_locked?: boolean;
  description: string;
  description_locked?: boolean;
  specs_source?: MotorcycleDataSource;
  price_source?: MotorcycleDataSource;
  image_source?: MotorcycleDataSource;
  scores_source?: MotorcycleDataSource;
  pros_cons_source?: MotorcycleDataSource;
  reliability_source?: MotorcycleDataSource;
  use_scores: Partial<BikeUseScores> | null;
  abs_cornering: boolean;
  traction_control: boolean;
  riding_modes: boolean;
  cruise_control: boolean;
  quickshifter: boolean;
  heated_grips: boolean;
  tubeless_wheels: boolean;
  pros: readonly string[] | null;
  cons: readonly string[] | null;
  common_issues: readonly string[] | null;
  report_count: number;
  reliability_score: number;
}>;

const fallbackMotorcycles: readonly Bike[] = bikeCatalog;

const defaultUseScores: BikeUseScores = {
  beginner: 0,
  city: 0,
  funFactor: 0,
  offroad: 0,
  passenger: 0,
  sport: 0,
  touring: 0,
};

function toNumber(value: number, fallback = 0) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeTextArray(value: readonly string[] | null) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeUseScores(value: Partial<BikeUseScores> | null): BikeUseScores {
  return {
    beginner: toNumber(value?.beginner ?? defaultUseScores.beginner),
    city: toNumber(value?.city ?? defaultUseScores.city),
    funFactor: toNumber(value?.funFactor ?? defaultUseScores.funFactor),
    offroad: toNumber(value?.offroad ?? defaultUseScores.offroad),
    passenger: toNumber(value?.passenger ?? defaultUseScores.passenger),
    sport: toNumber(value?.sport ?? defaultUseScores.sport),
    touring: toNumber(value?.touring ?? defaultUseScores.touring),
  };
}

function mapMotorcycleRow(row: MotorcycleRow): Bike {
  const features: BikeFeatures = {
    absCornering: Boolean(row.abs_cornering),
    cruiseControl: Boolean(row.cruise_control),
    heatedGrips: Boolean(row.heated_grips),
    quickshifter: Boolean(row.quickshifter),
    ridingModes: Boolean(row.riding_modes),
    tractionControl: Boolean(row.traction_control),
    tubelessWheels: Boolean(row.tubeless_wheels),
  };

  const bike: Bike = {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: toNumber(row.year),
    segment: row.segment,
    license: row.license,
    isA2Compatible: Boolean(row.is_a2_compatible),
    isA2LimitedVersion: Boolean(row.is_a2_limited_version),
    limitedPowerHp: row.limited_power_hp ?? null,
    originalPowerHp: row.original_power_hp ?? null,
    engineType: row.engine_type,
    displacementCc: toNumber(row.displacement_cc),
    powerHp: toNumber(row.power_hp),
    torqueNm: toNumber(row.torque_nm),
    wetWeightKg: toNumber(row.wet_weight_kg),
    seatHeightMm: toNumber(row.seat_height_mm),
    fuelTankLiters: toNumber(row.fuel_tank_liters),
    priceEur: toNumber(row.price_eur),
    imageUrl: row.image_url,
    imageLocked: Boolean(row.image_locked),
    description: row.description,
    descriptionLocked: Boolean(row.description_locked),
    specsSource: row.specs_source ?? 'manual',
    priceSource: toNumber(row.price_eur) === 0 ? 'placeholder' : row.price_source ?? 'manual',
    imageSource: getMotorcycleImage({ brand: row.brand, model: row.model, imageUrl: row.image_url }).isFallback
      ? 'placeholder'
      : row.image_source ?? 'manual',
    scoresSource: row.scores_source ?? 'estimated',
    prosConsSource: row.pros_cons_source ?? 'estimated',
    reliabilitySource: row.reliability_source ?? 'estimated',
    useScores: normalizeUseScores(row.use_scores),
    features,
    pros: normalizeTextArray(row.pros),
    cons: normalizeTextArray(row.cons),
    reliabilityReports: {
      commonIssues: normalizeTextArray(row.common_issues),
      reportCount: toNumber(row.report_count),
      reliabilityScore: toNumber(row.reliability_score),
    },
  };

  const a2Status = getBikeA2Status(bike);

  return {
    ...bike,
    isA2Compatible: Boolean(row.is_a2_compatible) || a2Status !== 'A',
    isA2LimitedVersion: Boolean(row.is_a2_limited_version) || a2Status === 'A2_LIMITABLE',
  };
}

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return undefined;
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function fallbackResult(error?: Error): MotorcycleServiceResult {
  return {
    error,
    motorcycles: fallbackMotorcycles,
    source: 'fallback',
  };
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

export async function getMotorcycles(): Promise<MotorcycleServiceResult> {
  const config = getSupabaseConfig();

  if (!config) {
    return fallbackResult(new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'));
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycles?select=*&order=brand.asc,model.asc`, {
      headers: {
        Accept: 'application/json',
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Supabase motorcycles request failed (${response.status}): ${errorBody}`);
    }

    const rows: unknown = await response.json();

    if (!Array.isArray(rows)) {
      throw new Error('Supabase motorcycles response is not an array.');
    }

    return {
      motorcycles: (rows as MotorcycleRow[]).map(mapMotorcycleRow),
      source: 'supabase',
    };
  } catch (error) {
    return fallbackResult(toError(error));
  }
}
