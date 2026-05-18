import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { getRelativePath, importPaths, readJsonFile, writeJsonFile } from '../src/features/import/importUtils';
import type { ImportLogger, MotorcycleValidationError } from '../src/features/import/motorcycleImportTypes';
import { validateMotorcycleImport } from '../src/features/import/validateMotorcycleImport';
import type { Bike, MotorcycleDataSource } from '../src/types/bike';

export type MergeWarning = Readonly<{
  brand: string;
  field: string;
  id: string;
  model: string;
  reason: string;
  value: unknown;
}>;

export type MergeDiscardedMotorcycle = Readonly<{
  brand?: string;
  errors: readonly MotorcycleValidationError[];
  id?: string;
  model?: string;
}>;

export type MergeFieldDecision = Readonly<{
  brand: string;
  existingValue: unknown;
  field: string;
  generatedValue: unknown;
  id: string;
  model: string;
  reason: string;
}>;

export type MergeMotorcycleSummary = Readonly<{
  brand: string;
  id: string;
  model: string;
  year: number;
}>;

export type MergeReport = Readonly<{
  added: readonly MergeMotorcycleSummary[];
  discarded: readonly MergeDiscardedMotorcycle[];
  duplicates: readonly MergeWarning[];
  generatedAt: string;
  kept: readonly MergeMotorcycleSummary[];
  nonDegradedFields: readonly MergeFieldDecision[];
  placeholderWarnings: readonly MergeWarning[];
  protectedFields: readonly MergeFieldDecision[];
  suspiciousDataWarnings: readonly MergeWarning[];
  summary: Readonly<{
    added: number;
    discarded: number;
    existing: number;
    final: number;
    generated: number;
    kept: number;
    updatableButNotModified: number;
    warnings: number;
  }>;
  updatableButNotModified: readonly MergeMotorcycleSummary[];
  warnings: readonly MergeWarning[];
}>;

export type MergeGeneratedMotorcyclesResult = Readonly<{
  applied: boolean;
  mergedCount: number;
  report: MergeReport;
}>;

export type MergeGeneratedMotorcyclesOptions = Readonly<{
  apply?: boolean;
  existingFileUrl?: URL;
  generatedFileUrl?: URL;
  logger?: ImportLogger;
  mergedFileUrl?: URL;
  now?: () => Date;
  rawExistingMotorcycles?: unknown;
  rawGeneratedMotorcycles?: unknown;
  reportFileUrl?: URL;
  resolveLocalImageUrl?: (motorcycle: Bike) => string | undefined;
  writeMainMotorcycles?: (motorcycles: readonly Bike[], fileUrl: URL) => Promise<void>;
  writeMergeReport?: (report: MergeReport, fileUrl: URL) => Promise<void>;
  writeMergedMotorcycles?: (motorcycles: readonly Bike[], fileUrl: URL) => Promise<void>;
}>;

type FieldDecisionTarget = 'nonDegradedFields' | 'protectedFields';

const sourceRank: Record<MotorcycleDataSource, number> = {
  placeholder: 0,
  estimated: 1,
  api: 2,
  user: 3,
  manual: 4,
};

const placeholderDescriptionPattern = /sin descripción disponible|datos pendientes de revisión manual en motoatlas/i;
const placeholdImagePattern = /placehold\.co|\/images\/placeholders\/|motoatlas\+sin\+imagen|motoatlas sin imagen|motorcycle-technical-pending/i;

function hasFlag(argv: readonly string[], flag: string) {
  return argv.includes(flag);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRawText(input: unknown, ...keys: string[]) {
  if (!isRecord(input)) {
    return undefined;
  }

  for (const key of keys) {
    const value = input[key];

    if (typeof value === 'string') {
      return value;
    }
  }

  return undefined;
}

function getRawId(input: unknown) {
  return getRawText(input, 'id');
}

function getRawBrand(input: unknown) {
  return getRawText(input, 'brand', 'make');
}

function getRawModel(input: unknown) {
  return getRawText(input, 'model');
}

function summarizeMotorcycle(motorcycle: Bike): MergeMotorcycleSummary {
  return {
    brand: motorcycle.brand,
    id: motorcycle.id,
    model: motorcycle.model,
    year: motorcycle.year,
  };
}

function createWarning(motorcycle: Bike, field: string, value: unknown, reason: string): MergeWarning {
  return {
    brand: motorcycle.brand,
    field,
    id: motorcycle.id,
    model: motorcycle.model,
    reason,
    value,
  };
}

function createDecision(
  motorcycle: Bike,
  field: string,
  existingValue: unknown,
  generatedValue: unknown,
  reason: string,
): MergeFieldDecision {
  return {
    brand: motorcycle.brand,
    existingValue,
    field,
    generatedValue,
    id: motorcycle.id,
    model: motorcycle.model,
    reason,
  };
}

function isPlaceholderDescription(value: string) {
  return placeholderDescriptionPattern.test(value.trim());
}

function isPlaceholderImage(motorcycle: Bike) {
  return motorcycle.imageSource === 'placeholder' || placeholdImagePattern.test(motorcycle.imageUrl);
}

export function isRealLocalMotorcycleImageUrl(imageUrl: string | undefined) {
  return Boolean(imageUrl?.startsWith('/images/motorcycles/') && !imageUrl.includes('/images/placeholders/'));
}

function defaultResolveLocalImageUrl(motorcycle: Bike) {
  const expectedImageUrl = `/images/motorcycles/${motorcycle.id}.webp`;
  const expectedImageFileUrl = new URL(`../public${expectedImageUrl}`, import.meta.url);

  return existsSync(fileURLToPath(expectedImageFileUrl)) ? expectedImageUrl : undefined;
}

function hasUsefulReliability(motorcycle: Bike) {
  return motorcycle.reliabilityReports.reliabilityScore > 0 || motorcycle.reliabilityReports.reportCount > 0;
}

function areAllFeaturesFalse(motorcycle: Bike) {
  return Object.values(motorcycle.features).every((value) => value === false);
}

function isBetterSource(existingSource: MotorcycleDataSource | undefined, generatedSource: MotorcycleDataSource | undefined) {
  if (!existingSource || !generatedSource) {
    return false;
  }

  return sourceRank[existingSource] > sourceRank[generatedSource];
}

function pushDecision(
  decisions: Record<FieldDecisionTarget, MergeFieldDecision[]>,
  target: FieldDecisionTarget,
  existing: Bike,
  field: string,
  existingValue: unknown,
  generatedValue: unknown,
  reason: string,
) {
  decisions[target].push(createDecision(existing, field, existingValue, generatedValue, reason));
}

function mergeExistingDuplicate(
  existing: Bike,
  generated: Bike,
  resolveLocalImageUrl: (motorcycle: Bike) => string | undefined,
) {
  const nextMotorcycle = { ...existing };
  const decisions: Record<FieldDecisionTarget, MergeFieldDecision[]> = {
    nonDegradedFields: [],
    protectedFields: [],
  };
  const existingImageIsRealLocal = isRealLocalMotorcycleImageUrl(existing.imageUrl);
  const generatedImageIsPlaceholder = isPlaceholderImage(generated);
  const generatedImageIsRealLocal = isRealLocalMotorcycleImageUrl(generated.imageUrl);
  const localImageUrl = resolveLocalImageUrl(existing);

  if (existingImageIsRealLocal) {
    pushDecision(
      decisions,
      'protectedFields',
      existing,
      'imageUrl',
      existing.imageUrl,
      generated.imageUrl,
      generatedImageIsPlaceholder
        ? 'Imagen local real existente conservada; imagen placeholder generada descartada.'
        : 'Imagen local real existente conservada.',
    );
  } else if (existing.imageLocked || existing.imageSource === 'manual' || existing.imageSource === 'user') {
    pushDecision(
      decisions,
      'protectedFields',
      existing,
      'imageUrl',
      existing.imageUrl,
      generated.imageUrl,
      'Imagen existente protegida por lock o fuente manual/user.',
    );
  } else if (!isPlaceholderImage(existing) && generatedImageIsPlaceholder) {
    pushDecision(
      decisions,
      'nonDegradedFields',
      existing,
      'imageUrl',
      existing.imageUrl,
      generated.imageUrl,
      'Intento de degradación bloqueado: no se reemplaza una imagen existente real por placeholder.',
    );
  } else if (isPlaceholderImage(existing) && generatedImageIsRealLocal) {
    nextMotorcycle.imageUrl = generated.imageUrl;
    nextMotorcycle.imageSource = generated.imageSource ?? 'manual';
    pushDecision(
      decisions,
      'nonDegradedFields',
      existing,
      'imageUrl',
      existing.imageUrl,
      generated.imageUrl,
      'Imagen placeholder existente reemplazada por imagen local real generada.',
    );
  } else if (isPlaceholderImage(existing) && localImageUrl) {
    nextMotorcycle.imageUrl = localImageUrl;
    nextMotorcycle.imageSource = 'manual';
    pushDecision(
      decisions,
      'nonDegradedFields',
      existing,
      'imageUrl',
      existing.imageUrl,
      generated.imageUrl,
      'Imagen local real encontrada en public/images/motorcycles; placeholder existente descartado.',
    );
  }

  if (existing.descriptionLocked || !isPlaceholderDescription(existing.description)) {
    pushDecision(
      decisions,
      'protectedFields',
      existing,
      'description',
      existing.description,
      generated.description,
      isPlaceholderDescription(generated.description)
        ? 'Descripción existente bloqueada o ya curada; descripción placeholder generada descartada.'
        : 'Descripción existente bloqueada o ya curada; no se reemplaza por datos generados.',
    );
  }

  if (existing.priceEur > 0 && generated.priceEur === 0) {
    pushDecision(
      decisions,
      'nonDegradedFields',
      existing,
      'priceEur',
      existing.priceEur,
      generated.priceEur,
      'No se reemplaza un precio real por 0.',
    );
  }

  const sourceFields = [
    'specsSource',
    'priceSource',
    'imageSource',
    'scoresSource',
    'prosConsSource',
    'reliabilitySource',
  ] as const;

  sourceFields.forEach((field) => {
    if (isBetterSource(existing[field], generated[field])) {
      pushDecision(
        decisions,
        'nonDegradedFields',
        existing,
        field,
        existing[field],
        generated[field],
        'No se degrada la procedencia del dato.',
      );
    }
  });

  if (existing.pros.length > 0 && generated.pros.length === 0) {
    pushDecision(decisions, 'nonDegradedFields', existing, 'pros', existing.pros, generated.pros, 'No se reemplazan pros existentes por array vacío.');
  }

  if (existing.cons.length > 0 && generated.cons.length === 0) {
    pushDecision(decisions, 'nonDegradedFields', existing, 'cons', existing.cons, generated.cons, 'No se reemplazan contras existentes por array vacío.');
  }

  if (hasUsefulReliability(existing) && !hasUsefulReliability(generated)) {
    pushDecision(
      decisions,
      'nonDegradedFields',
      existing,
      'reliabilityReports',
      existing.reliabilityReports,
      generated.reliabilityReports,
      'No se reemplaza fiabilidad útil por score/reportCount 0.',
    );
  }

  return { decisions, motorcycle: nextMotorcycle };
}

function getExpectedSegmentReason(motorcycle: Bike) {
  const model = motorcycle.model.toLowerCase();
  const normalizedModel = model.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/(\bgs\b|v-?strom|tenere|ténéré|africa twin|adventure|transalp|tuareg|desertx|mt-?x|\b800mt\b|\b450mt\b|himalayan|tiger|klr|v85 tt)/i.test(model) && motorcycle.segment === 'naked') {
    return 'El nombre/modelo apunta a trail/adventure, pero el segmento generado es naked.';
  }

  if (/(ninja|\brs\b|rsv|supersport)/i.test(model) && !['sport', 'supersport'].includes(motorcycle.segment)) {
    return 'El nombre/modelo apunta a sport/supersport; revisar segmento.';
  }

  if (/(tracer|\bxr\b|\bnt\b|versys|multistrada)/i.test(model) && !['sport-touring', 'touring'].includes(motorcycle.segment)) {
    return 'El nombre/modelo apunta a sport-touring/touring; revisar segmento.';
  }

  if (/scrambler/i.test(model) && motorcycle.segment !== 'scrambler') {
    return 'El nombre/modelo apunta a scrambler; revisar segmento.';
  }

  if (/(bonneville|xsr|r nine t|r ninet|nineT)/i.test(normalizedModel) && !['retro', 'neo-retro'].includes(motorcycle.segment)) {
    return 'El nombre/modelo apunta a retro/neo-retro; revisar segmento.';
  }

  return null;
}

export function detectMotorcycleWarnings(motorcycle: Bike) {
  const placeholderWarnings: MergeWarning[] = [];
  const suspiciousDataWarnings: MergeWarning[] = [];

  if (motorcycle.priceEur === 0) {
    placeholderWarnings.push(createWarning(motorcycle, 'priceEur', motorcycle.priceEur, 'Precio pendiente de revisión manual.'));
  }

  if (isPlaceholderImage(motorcycle)) {
    placeholderWarnings.push(createWarning(motorcycle, 'imageUrl', motorcycle.imageUrl, 'Imagen placeholder o externa de placehold detectada.'));
  }

  if (isPlaceholderDescription(motorcycle.description)) {
    placeholderWarnings.push(createWarning(motorcycle, 'description', motorcycle.description, 'Descripción placeholder pendiente de revisión editorial.'));
  }

  if (motorcycle.pros.length === 0) {
    placeholderWarnings.push(createWarning(motorcycle, 'pros', motorcycle.pros, 'Pros vacíos pendientes de revisión editorial.'));
  }

  if (motorcycle.cons.length === 0) {
    placeholderWarnings.push(createWarning(motorcycle, 'cons', motorcycle.cons, 'Contras vacíos pendientes de revisión editorial.'));
  }

  if (motorcycle.reliabilityReports.reliabilityScore === 0) {
    placeholderWarnings.push(
      createWarning(motorcycle, 'reliabilityReports.reliabilityScore', 0, 'Fiabilidad sin datos comunitarios/editoriales.'),
    );
  }

  if (motorcycle.reliabilityReports.reportCount === 0) {
    placeholderWarnings.push(createWarning(motorcycle, 'reliabilityReports.reportCount', 0, 'Report count sin datos.'));
  }

  if (areAllFeaturesFalse(motorcycle)) {
    suspiciousDataWarnings.push(createWarning(motorcycle, 'features', motorcycle.features, 'Todo el equipamiento está en false; revisar si es ausencia real o falta de datos.'));
  }

  if (motorcycle.scoresSource === 'estimated') {
    suspiciousDataWarnings.push(createWarning(motorcycle, 'scoresSource', motorcycle.scoresSource, 'Puntuaciones estimadas; revisar manualmente.'));
  }

  if (motorcycle.prosConsSource === 'estimated') {
    suspiciousDataWarnings.push(createWarning(motorcycle, 'prosConsSource', motorcycle.prosConsSource, 'Pros/contras estimados; revisar manualmente.'));
  }

  if (motorcycle.reliabilitySource === 'estimated') {
    suspiciousDataWarnings.push(createWarning(motorcycle, 'reliabilitySource', motorcycle.reliabilitySource, 'Fiabilidad estimada; revisar manualmente.'));
  }

  if (['naked', 'trail', 'adventure'].includes(motorcycle.segment) && motorcycle.powerHp > 160) {
    suspiciousDataWarnings.push(createWarning(motorcycle, 'powerHp', motorcycle.powerHp, 'Potencia muy alta para el segmento; revisar posible dato erróneo.'));
  }

  if (['sport-touring', 'touring'].includes(motorcycle.segment) && motorcycle.powerHp > 180) {
    suspiciousDataWarnings.push(createWarning(motorcycle, 'powerHp', motorcycle.powerHp, 'Potencia muy alta para sport-touring/touring; revisar posible dato erróneo.'));
  }

  if (['trail', 'adventure', 'dual-sport', 'enduro'].includes(motorcycle.segment) && motorcycle.wetWeightKg > 260) {
    suspiciousDataWarnings.push(createWarning(motorcycle, 'wetWeightKg', motorcycle.wetWeightKg, 'Peso muy alto para trail/adventure; revisar posible dato erróneo.'));
  }

  const segmentReason = getExpectedSegmentReason(motorcycle);

  if (segmentReason) {
    suspiciousDataWarnings.push(createWarning(motorcycle, 'segment', motorcycle.segment, segmentReason));
  }

  return { placeholderWarnings, suspiciousDataWarnings };
}

function findDuplicateIds(motorcycles: readonly Bike[], source: 'existing' | 'generated') {
  const seen = new Set<string>();
  const duplicates: MergeWarning[] = [];

  motorcycles.forEach((motorcycle) => {
    if (!seen.has(motorcycle.id)) {
      seen.add(motorcycle.id);
      return;
    }

    duplicates.push(createWarning(motorcycle, 'id', motorcycle.id, `ID duplicado en ${source}; se conserva la primera aparición.`));
  });

  return duplicates;
}

function validateRawMotorcycles(input: unknown, sourceLabel: string) {
  const validation = validateMotorcycleImport(input, { allowPlaceholders: false });

  if (!Array.isArray(input)) {
    throw new Error(`${sourceLabel} debe ser un array de motos.`);
  }

  return validation;
}

function validateFinalMotorcycles(motorcycles: readonly Bike[]) {
  const validation = validateMotorcycleImport(motorcycles, { allowPlaceholders: false });

  if (!validation.valid) {
    throw new Error(`Merge cancelado: el catálogo fusionado contiene ${validation.errors.length} error(es) de validación.`);
  }

  return validation.validItems.map((item) => item.motorcycle!);
}

function toDiscarded(input: unknown, errors: readonly MotorcycleValidationError[]): MergeDiscardedMotorcycle {
  return {
    brand: getRawBrand(input),
    errors,
    id: getRawId(input),
    model: getRawModel(input),
  };
}

export async function mergeGeneratedMotorcycles({
  apply = false,
  existingFileUrl = importPaths.motorcyclesFileUrl,
  generatedFileUrl = importPaths.generatedMotorcyclesFileUrl,
  logger = console,
  mergedFileUrl = importPaths.mergedMotorcyclesFileUrl,
  now = () => new Date(),
  rawExistingMotorcycles,
  rawGeneratedMotorcycles,
  reportFileUrl = importPaths.mergeReportFileUrl,
  resolveLocalImageUrl = defaultResolveLocalImageUrl,
  writeMainMotorcycles = (motorcycles, fileUrl) => writeJsonFile(fileUrl, motorcycles),
  writeMergeReport = (report, fileUrl) => writeJsonFile(fileUrl, report),
  writeMergedMotorcycles = (motorcycles, fileUrl) => writeJsonFile(fileUrl, motorcycles),
}: MergeGeneratedMotorcyclesOptions = {}): Promise<MergeGeneratedMotorcyclesResult> {
  const existingInput = rawExistingMotorcycles ?? (await readJsonFile(existingFileUrl));
  const generatedInput = rawGeneratedMotorcycles ?? (await readJsonFile(generatedFileUrl));
  const existingValidation = validateRawMotorcycles(existingInput, 'motorcycles.json');

  if (!existingValidation.valid) {
    throw new Error(`Merge cancelado: motorcycles.json contiene ${existingValidation.errors.length} error(es) de validación.`);
  }

  const generatedValidation = validateRawMotorcycles(generatedInput, 'motorcycles.generated.json');
  const existingMotorcycles = existingValidation.validItems.map((item) => item.motorcycle!);
  const generatedMotorcycles = generatedValidation.validItems.map((item) => item.motorcycle!);
  const existingById = new Map(existingMotorcycles.map((motorcycle) => [motorcycle.id, motorcycle]));
  const added: MergeMotorcycleSummary[] = [];
  const kept: MergeMotorcycleSummary[] = [];
  const updatableButNotModified: MergeMotorcycleSummary[] = [];
  const protectedFields: MergeFieldDecision[] = [];
  const nonDegradedFields: MergeFieldDecision[] = [];
  const placeholderWarnings: MergeWarning[] = [];
  const suspiciousDataWarnings: MergeWarning[] = [];
  const finalMotorcycles = [...existingMotorcycles];
  const finalMotorcycleIndexById = new Map(finalMotorcycles.map((motorcycle, index) => [motorcycle.id, index]));
  const processedGeneratedIds = new Set<string>();
  const discarded = generatedValidation.invalidItems.map((item) => toDiscarded(Array.isArray(generatedInput) ? generatedInput[item.index] : undefined, item.errors));
  const duplicates = [
    ...findDuplicateIds(existingMotorcycles, 'existing'),
    ...findDuplicateIds(generatedMotorcycles, 'generated'),
  ];

  existingMotorcycles.forEach((motorcycle) => kept.push(summarizeMotorcycle(motorcycle)));

  generatedMotorcycles.forEach((generated) => {
    if (processedGeneratedIds.has(generated.id)) {
      return;
    }

    processedGeneratedIds.add(generated.id);
    const existing = existingById.get(generated.id);

    if (existing) {
      updatableButNotModified.push(summarizeMotorcycle(existing));
      const { decisions, motorcycle } = mergeExistingDuplicate(existing, generated, resolveLocalImageUrl);
      const existingIndex = finalMotorcycleIndexById.get(existing.id);

      if (existingIndex !== undefined) {
        finalMotorcycles[existingIndex] = motorcycle;
      }

      protectedFields.push(...decisions.protectedFields);
      nonDegradedFields.push(...decisions.nonDegradedFields);
      return;
    }

    finalMotorcycles.push(generated);
    added.push(summarizeMotorcycle(generated));
  });

  const mergedMotorcycles = validateFinalMotorcycles(finalMotorcycles);

  mergedMotorcycles.forEach((motorcycle) => {
    const warnings = detectMotorcycleWarnings(motorcycle);
    placeholderWarnings.push(...warnings.placeholderWarnings);
    suspiciousDataWarnings.push(...warnings.suspiciousDataWarnings);
  });

  const warnings = [...placeholderWarnings, ...suspiciousDataWarnings, ...duplicates];
  const report: MergeReport = {
    added,
    discarded,
    duplicates,
    generatedAt: now().toISOString(),
    kept,
    nonDegradedFields,
    placeholderWarnings,
    protectedFields,
    suspiciousDataWarnings,
    summary: {
      added: added.length,
      discarded: discarded.length,
      existing: existingMotorcycles.length,
      final: mergedMotorcycles.length,
      generated: Array.isArray(generatedInput) ? generatedInput.length : 0,
      kept: kept.length,
      updatableButNotModified: updatableButNotModified.length,
      warnings: warnings.length,
    },
    updatableButNotModified,
    warnings,
  };

  await writeMergedMotorcycles(mergedMotorcycles, mergedFileUrl);
  await writeMergeReport(report, reportFileUrl);

  logger.log(`📦 Existentes: ${existingMotorcycles.length}`);
  logger.log(`📦 Generadas: ${Array.isArray(generatedInput) ? generatedInput.length : 0}`);
  logger.log(`➕ Añadidas: ${added.length}`);
  logger.log(`🛡️ Conservadas: ${kept.length}`);
  logger.log(`🧾 Warnings: ${warnings.length}`);
  logger.log(`💾 Merged: ${getRelativePath(mergedFileUrl)}`);
  logger.log(`🧾 Report: ${getRelativePath(reportFileUrl)}`);

  if (warnings.length > 0) {
    logger.warn(`⚠️ Revisa ${warnings.length} warning(s) antes de aplicar el merge.`);
  }

  if (apply) {
    const finalValidation = validateMotorcycleImport(mergedMotorcycles, { allowPlaceholders: false });

    if (!finalValidation.valid) {
      throw new Error(`--apply cancelado: motorcycles.merged.json contiene ${finalValidation.errors.length} error(es) de validación.`);
    }

    await writeMainMotorcycles(mergedMotorcycles, existingFileUrl);
    logger.log(`✅ --apply activo: ${getRelativePath(existingFileUrl)} reemplazado con el merge validado.`);
  } else {
    logger.log('🧪 Modo seguro: motorcycles.json NO se ha sobrescrito. Usa --apply tras revisar el reporte.');
  }

  return {
    applied: apply,
    mergedCount: mergedMotorcycles.length,
    report,
  };
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isDirectRun) {
  mergeGeneratedMotorcycles({ apply: hasFlag(process.argv, '--apply') }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Merge de motos fallido: ${message}`);
    process.exitCode = 1;
  });
}
