import type { Bike, BikeFeatures, BikeSegment, BikeLicense, BikeEngineType, MotorcycleDataSource, BikeUseScores } from '../types/bike';

export type AdminMotorcycleCreatePayload = Readonly<{
  id: string;
  brand: string;
  model: string;
  year: number;
  description: string;
  segment: string;
  license: string;
  engineType: string;
  displacementCc: number;
  powerHp: number;
  torqueNm: number;
  wetWeightKg: number;
  seatHeightMm: number;
  fuelTankLiters: number;
  priceEur: number;
  imageUrl: string;
  descriptionLocked?: boolean;
  imageLocked?: boolean;
  priceSource?: string;
  imageSource?: string;
  specsSource?: string;
  scoresSource?: string;
  prosConsSource?: string;
  reliabilitySource?: string;
  absCornering?: boolean;
  tractionControl?: boolean;
  ridingModes?: boolean;
  cruiseControl?: boolean;
  quickshifter?: boolean;
  heatedGrips?: boolean;
  tubelessWheels?: boolean;
  isA2Compatible?: boolean;
  isA2LimitedVersion?: boolean;
  limitedPowerHp?: number | null;
  originalPowerHp?: number | null;
}>;

export type AdminMotorcycleUpdatePayload = Readonly<{
  brand?: string;
  model?: string;
  year?: number;
  description?: string;
  descriptionLocked?: boolean;
  segment?: string;
  license?: string;
  engineType?: string;
  displacementCc?: number;
  powerHp?: number;
  torqueNm?: number;
  wetWeightKg?: number;
  seatHeightMm?: number;
  fuelTankLiters?: number;
  priceEur?: number;
  priceSource?: string;
  imageUrl?: string;
  imageSource?: string;
  imageLocked?: boolean;
  specsSource?: string;
  scoresSource?: string;
  prosConsSource?: string;
  reliabilitySource?: string;
  absCornering?: boolean;
  tractionControl?: boolean;
  ridingModes?: boolean;
  cruiseControl?: boolean;
  quickshifter?: boolean;
  heatedGrips?: boolean;
  tubelessWheels?: boolean;
  isA2Compatible?: boolean;
  isA2LimitedVersion?: boolean;
  limitedPowerHp?: number | null;
  originalPowerHp?: number | null;
}>;

type AdminMotorcycleRow = Readonly<{
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
  abs_cornering: boolean;
  traction_control: boolean;
  riding_modes: boolean;
  cruise_control: boolean;
  quickshifter: boolean;
  heated_grips: boolean;
  tubeless_wheels: boolean;
  use_scores?: Partial<BikeUseScores> | null;
  pros?: readonly string[] | null;
  cons?: readonly string[] | null;
  common_issues?: readonly string[] | null;
  report_count?: number;
  reliability_score?: number;
  official_url?: string | null;
}>;

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for admin motorcycle operations.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function assertAccessToken(accessToken: string): asserts accessToken is string {
  if (!accessToken?.trim()) {
    throw new Error('Access token is required for admin motorcycle operations.');
  }
}

function assertResponseOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Admin motorcycle request failed (${response.status}): ${response.statusText}`);
  }
}

type CreateRpcParams = Record<string, string | number | boolean | null>;

function toCreateRpcParams(payload: AdminMotorcycleCreatePayload): CreateRpcParams {
  return {
    p_id: payload.id,
    p_brand: payload.brand,
    p_model: payload.model,
    p_year: payload.year,
    p_description: payload.description,
    p_segment: payload.segment,
    p_license: payload.license,
    p_engine_type: payload.engineType,
    p_displacement_cc: payload.displacementCc,
    p_power_hp: payload.powerHp,
    p_torque_nm: payload.torqueNm,
    p_wet_weight_kg: payload.wetWeightKg,
    p_seat_height_mm: payload.seatHeightMm,
    p_fuel_tank_liters: payload.fuelTankLiters,
    p_price_eur: payload.priceEur,
    p_image_url: payload.imageUrl,
    p_description_locked: payload.descriptionLocked ?? false,
    p_image_locked: payload.imageLocked ?? false,
    p_price_source: payload.priceSource ?? 'manual',
    p_image_source: payload.imageSource ?? 'manual',
    p_specs_source: payload.specsSource ?? 'manual',
    p_scores_source: payload.scoresSource ?? 'estimated',
    p_pros_cons_source: payload.prosConsSource ?? 'estimated',
    p_reliability_source: payload.reliabilitySource ?? 'estimated',
    p_abs_cornering: payload.absCornering ?? false,
    p_traction_control: payload.tractionControl ?? false,
    p_riding_modes: payload.ridingModes ?? false,
    p_cruise_control: payload.cruiseControl ?? false,
    p_quickshifter: payload.quickshifter ?? false,
    p_heated_grips: payload.heatedGrips ?? false,
    p_tubeless_wheels: payload.tubelessWheels ?? false,
    p_is_a2_compatible: payload.isA2Compatible ?? false,
    p_is_a2_limited_version: payload.isA2LimitedVersion ?? false,
    p_limited_power_hp: payload.limitedPowerHp ?? null,
    p_original_power_hp: payload.originalPowerHp ?? null,
  };
}

function toUpdateBody(payload: AdminMotorcycleUpdatePayload): Record<string, unknown> {
  const columnMap: Record<string, keyof AdminMotorcycleUpdatePayload> = {
    brand: 'brand',
    model: 'model',
    year: 'year',
    description: 'description',
    description_locked: 'descriptionLocked',
    segment: 'segment',
    license: 'license',
    engine_type: 'engineType',
    displacement_cc: 'displacementCc',
    power_hp: 'powerHp',
    torque_nm: 'torqueNm',
    wet_weight_kg: 'wetWeightKg',
    seat_height_mm: 'seatHeightMm',
    fuel_tank_liters: 'fuelTankLiters',
    price_eur: 'priceEur',
    price_source: 'priceSource',
    image_url: 'imageUrl',
    image_source: 'imageSource',
    image_locked: 'imageLocked',
    specs_source: 'specsSource',
    scores_source: 'scoresSource',
    pros_cons_source: 'prosConsSource',
    reliability_source: 'reliabilitySource',
    abs_cornering: 'absCornering',
    traction_control: 'tractionControl',
    riding_modes: 'ridingModes',
    cruise_control: 'cruiseControl',
    quickshifter: 'quickshifter',
    heated_grips: 'heatedGrips',
    tubeless_wheels: 'tubelessWheels',
    is_a2_compatible: 'isA2Compatible',
    is_a2_limited_version: 'isA2LimitedVersion',
    limited_power_hp: 'limitedPowerHp',
    original_power_hp: 'originalPowerHp',
  };

  const body: Record<string, unknown> = {};

  for (const [column, key] of Object.entries(columnMap)) {
    if (key in payload && payload[key as keyof AdminMotorcycleUpdatePayload] !== undefined) {
      body[column] = payload[key as keyof AdminMotorcycleUpdatePayload];
    }
  }

  return body;
}

function mapAdminMotorcycleRow(row: AdminMotorcycleRow): Bike {
  const features: BikeFeatures = {
    absCornering: Boolean(row.abs_cornering),
    cruiseControl: Boolean(row.cruise_control),
    heatedGrips: Boolean(row.heated_grips),
    quickshifter: Boolean(row.quickshifter),
    ridingModes: Boolean(row.riding_modes),
    tractionControl: Boolean(row.traction_control),
    tubelessWheels: Boolean(row.tubeless_wheels),
  };

  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    segment: row.segment,
    license: row.license,
    isA2Compatible: Boolean(row.is_a2_compatible),
    isA2LimitedVersion: Boolean(row.is_a2_limited_version),
    limitedPowerHp: row.limited_power_hp ?? null,
    originalPowerHp: row.original_power_hp ?? null,
    engineType: row.engine_type,
    displacementCc: row.displacement_cc,
    powerHp: row.power_hp,
    torqueNm: row.torque_nm,
    wetWeightKg: row.wet_weight_kg,
    seatHeightMm: row.seat_height_mm,
    fuelTankLiters: row.fuel_tank_liters,
    priceEur: row.price_eur,
    imageUrl: row.image_url,
    imageLocked: Boolean(row.image_locked),
    description: row.description,
    descriptionLocked: Boolean(row.description_locked),
    specsSource: row.specs_source ?? 'manual',
    priceSource: row.price_source ?? 'manual',
    imageSource: row.image_source ?? 'manual',
    scoresSource: row.scores_source ?? 'estimated',
    prosConsSource: row.pros_cons_source ?? 'estimated',
    reliabilitySource: row.reliability_source ?? 'estimated',
    officialUrl: row.official_url ?? null,
    useScores: {
      beginner: row.use_scores?.beginner ?? 0,
      city: row.use_scores?.city ?? 0,
      funFactor: row.use_scores?.funFactor ?? 0,
      offroad: row.use_scores?.offroad ?? 0,
      passenger: row.use_scores?.passenger ?? 0,
      sport: row.use_scores?.sport ?? 0,
      touring: row.use_scores?.touring ?? 0,
    },
    features,
    pros: row.pros ? [...row.pros] : [],
    cons: row.cons ? [...row.cons] : [],
    reliabilityReports: {
      commonIssues: row.common_issues ? [...row.common_issues] : [],
      reportCount: row.report_count ?? 0,
      reliabilityScore: row.reliability_score ?? 0,
    },
  };
}

export async function createAdminMotorcycle(payload: AdminMotorcycleCreatePayload, accessToken: string): Promise<Bike> {
  assertAccessToken(accessToken);
  const config = getSupabaseConfig();
  const params = toCreateRpcParams(payload);

  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/create_admin_motorcycle`, {
    body: JSON.stringify(params),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
  });

  assertResponseOk(response);
  const row = (await response.json()) as AdminMotorcycleRow;

  return mapAdminMotorcycleRow(row);
}

export async function updateAdminMotorcycle(id: string, payload: AdminMotorcycleUpdatePayload, accessToken: string): Promise<Bike> {
  assertAccessToken(accessToken);
  const config = getSupabaseConfig();

  if (!id?.trim()) {
    throw new Error('Motorcycle id is required for update.');
  }

  const body = toUpdateBody(payload);

  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycles?id=eq.${encodeURIComponent(id.trim())}`, {
    body: JSON.stringify(body),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'return=representation',
    },
    method: 'PATCH',
  });

  assertResponseOk(response);
  const rows = (await response.json()) as AdminMotorcycleRow[];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`Motorcycle with id "${id}" not found for update.`);
  }

  return mapAdminMotorcycleRow(rows[0]);
}
