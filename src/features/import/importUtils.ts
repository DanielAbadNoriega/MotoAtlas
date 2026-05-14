import { createClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Bike } from '../../types/bike';
import { slugifyMotorcycleId } from './normalizeMotorcycle';
import { getMotorcycleImage } from '../../shared/images/getMotorcycleImage';
import type { MotorcycleSeed, MotorcycleUpsertPayload, SupabaseMotorcycleClient } from './motorcycleImportTypes';

export const importPaths = {
  existingMotorcyclesFileUrl: new URL('../../../data/import/motorcycles.json', import.meta.url),
  generatedMotorcyclesFileUrl: new URL('../../../data/import/motorcycles.generated.json', import.meta.url),
  motorcyclesFileUrl: new URL('../../../data/import/motorcycles.json', import.meta.url),
  repairReportFileUrl: new URL('../../../data/import/motorcycles.repair-report.json', import.meta.url),
  repairedMotorcyclesFileUrl: new URL('../../../data/import/motorcycles.repaired.json', import.meta.url),
  seedListFileUrl: new URL('../../../data/import/motorcycleSeedList.json', import.meta.url),
};

export async function readJsonFile<T = unknown>(fileUrl: URL): Promise<T> {
  const rawContent = await readFile(fileUrl, 'utf8');
  return JSON.parse(rawContent) as T;
}

export async function writeJsonFile(fileUrl: URL, value: unknown) {
  const filePath = fileURLToPath(fileUrl);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function buildMotorcyclePayload(motorcycle: Bike): MotorcycleUpsertPayload {
  const imageSource = getMotorcycleImage(motorcycle).isFallback ? 'placeholder' : motorcycle.imageSource ?? 'manual';

  return {
    abs_cornering: motorcycle.features.absCornering,
    brand: motorcycle.brand,
    common_issues: motorcycle.reliabilityReports.commonIssues,
    cons: motorcycle.cons,
    cruise_control: motorcycle.features.cruiseControl,
    description: motorcycle.description,
    displacement_cc: motorcycle.displacementCc,
    engine_type: motorcycle.engineType,
    fuel_tank_liters: motorcycle.fuelTankLiters,
    heated_grips: motorcycle.features.heatedGrips,
    id: motorcycle.id,
    image_locked: motorcycle.imageLocked ?? false,
    image_url: motorcycle.imageUrl,
    image_source: imageSource,
    is_a2_compatible: motorcycle.isA2Compatible ?? false,
    is_a2_limited_version: motorcycle.isA2LimitedVersion ?? false,
    license: motorcycle.license,
    limited_power_hp: motorcycle.limitedPowerHp ?? null,
    model: motorcycle.model,
    original_power_hp: motorcycle.originalPowerHp ?? null,
    power_hp: motorcycle.powerHp,
    price_eur: motorcycle.priceEur,
    price_source: motorcycle.priceEur === 0 ? 'placeholder' : motorcycle.priceSource ?? 'manual',
    pros: motorcycle.pros,
    pros_cons_source: motorcycle.prosConsSource ?? 'estimated',
    quickshifter: motorcycle.features.quickshifter,
    reliability_score: motorcycle.reliabilityReports.reliabilityScore,
    reliability_source: motorcycle.reliabilitySource ?? 'estimated',
    report_count: motorcycle.reliabilityReports.reportCount,
    riding_modes: motorcycle.features.ridingModes,
    scores_source: motorcycle.scoresSource ?? 'estimated',
    seat_height_mm: motorcycle.seatHeightMm,
    segment: motorcycle.segment,
    torque_nm: motorcycle.torqueNm,
    traction_control: motorcycle.features.tractionControl,
    tubeless_wheels: motorcycle.features.tubelessWheels,
    specs_source: motorcycle.specsSource ?? 'manual',
    use_scores: motorcycle.useScores,
    wet_weight_kg: motorcycle.wetWeightKg,
    year: motorcycle.year,
    description_locked: motorcycle.descriptionLocked ?? false,
  };
}

export function buildMotorcyclesPayload(motorcycles: readonly Bike[]) {
  return motorcycles.map(buildMotorcyclePayload);
}

export function getSupabaseImportConfig(env: NodeJS.ProcessEnv) {
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Revisa .env.import.');
  }

  return {
    serviceRoleKey,
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
  };
}

export function createSupabaseImportClient(env: NodeJS.ProcessEnv): SupabaseMotorcycleClient {
  const { serviceRoleKey, supabaseUrl } = getSupabaseImportConfig(env);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as SupabaseMotorcycleClient;
}

export function buildSeedId(seed: MotorcycleSeed) {
  return slugifyMotorcycleId(seed.make, seed.model, seed.year);
}

export function findExistingMotorcycle(seed: MotorcycleSeed, motorcycles: readonly Bike[]) {
  const seedId = buildSeedId(seed);
  const normalizedMake = seed.make.trim().toLowerCase();
  const normalizedModel = seed.model.trim().toLowerCase();

  return motorcycles.find((motorcycle) => {
    const sameId = motorcycle.id === seedId;
    const sameIdentity =
      motorcycle.brand.trim().toLowerCase() === normalizedMake &&
      motorcycle.model.trim().toLowerCase() === normalizedModel &&
      motorcycle.year === seed.year;

    return sameId || sameIdentity;
  });
}

export function getRelativePath(fileUrl: URL, cwd = process.cwd()) {
  if (fileUrl.protocol !== 'file:') {
    return fileUrl.pathname.replace(/^\/+/, '');
  }

  return path.relative(cwd, fileURLToPath(fileUrl));
}
