import { slugifyRoutePart } from '../../../shared/routing/routeUtils';
import type { Bike, BikeEngineType, BikeFeatures, BikeLicense, BikeSegment } from '../../../types/bike';
import type { AdminMotorcycleCreatePayload, AdminMotorcycleUpdatePayload } from '../../../services/adminMotorcycleService';

export type AdminModelDraft = {
  brand: string;
  model: string;
  year: string;
  description: string;
  modelId: string;
  segment: BikeSegment | '';
  license: BikeLicense | '';
  engineType: BikeEngineType | '';
  displacementCc: string;
  powerHp: string;
  torqueNm: string;
  wetWeightKg: string;
  seatHeightMm: string;
  fuelTankLiters: string;
  priceEur: string;
  pricePending: boolean;
  imageUrl: string;
  imageLocked: boolean;
  officialUrl: string;
  sourceNotes: string;
  internalNotes: string;
  features: Record<keyof BikeFeatures, boolean>;
};

export type AdminModelDraftField = Exclude<keyof AdminModelDraft, 'features' | 'pricePending' | 'imageLocked'>;
export type AdminModelFeatureKey = keyof BikeFeatures;

export type ValidationResult =
  | { isValid: true }
  | { isValid: false; message: string };

export function createDraftFromBike(bike: Bike): AdminModelDraft {
  return {
    brand: bike.brand,
    model: bike.model,
    year: String(bike.year),
    description: bike.description || '',
    modelId: bike.id,
    segment: bike.segment,
    license: bike.license,
    engineType: bike.engineType,
    displacementCc: String(bike.displacementCc),
    powerHp: String(bike.powerHp),
    torqueNm: String(bike.torqueNm),
    wetWeightKg: String(bike.wetWeightKg),
    seatHeightMm: String(bike.seatHeightMm),
    fuelTankLiters: String(bike.fuelTankLiters),
    priceEur: String(bike.priceEur),
    pricePending: false,
    imageUrl: bike.imageUrl,
    imageLocked: bike.imageLocked ?? false,
    officialUrl: bike.officialUrl ?? '',
    sourceNotes: '',
    internalNotes: '',
    features: { ...bike.features },
  };
}

export function cloneAdminModelDraft(draft: AdminModelDraft): AdminModelDraft {
  return {
    ...draft,
    features: { ...draft.features },
  };
}

export function buildSuggestedModelId(draft: Pick<AdminModelDraft, 'brand' | 'model' | 'year'>) {
  const parts = [draft.brand.trim(), draft.model.trim(), draft.year.trim()].filter(Boolean);
  return parts.length > 0 ? slugifyRoutePart(parts.join(' ')) : '';
}

export function draftToUpdatePayload(draft: AdminModelDraft): AdminMotorcycleUpdatePayload {
  const payload: Record<string, unknown> = {};

  if (draft.brand.trim()) {
    payload.brand = draft.brand.trim();
  }

  if (draft.model.trim()) {
    payload.model = draft.model.trim();
  }

  const year = parseInt(draft.year, 10);
  if (!Number.isNaN(year) && year >= 1900 && year <= 2100) {
    payload.year = year;
  }

  if (draft.description.trim()) {
    payload.description = draft.description.trim();
  }

  if (draft.segment) {
    payload.segment = draft.segment;
  }

  if (draft.license) {
    payload.license = draft.license;
  }

  if (draft.engineType) {
    payload.engineType = draft.engineType;
  }

  const displacementCc = parseInt(draft.displacementCc, 10);
  if (!Number.isNaN(displacementCc) && displacementCc > 0) {
    payload.displacementCc = displacementCc;
  }

  const powerHp = parseFloat(draft.powerHp);
  if (!Number.isNaN(powerHp) && powerHp > 0) {
    payload.powerHp = powerHp;
  }

  const torqueNm = parseFloat(draft.torqueNm);
  if (!Number.isNaN(torqueNm) && torqueNm > 0) {
    payload.torqueNm = torqueNm;
  }

  const wetWeightKg = parseFloat(draft.wetWeightKg);
  if (!Number.isNaN(wetWeightKg) && wetWeightKg > 0) {
    payload.wetWeightKg = wetWeightKg;
  }

  const seatHeightMm = parseInt(draft.seatHeightMm, 10);
  if (!Number.isNaN(seatHeightMm) && seatHeightMm > 0) {
    payload.seatHeightMm = seatHeightMm;
  }

  const fuelTankLiters = parseFloat(draft.fuelTankLiters);
  if (!Number.isNaN(fuelTankLiters) && fuelTankLiters > 0) {
    payload.fuelTankLiters = fuelTankLiters;
  }

  if (!draft.pricePending) {
    const priceEur = parseInt(draft.priceEur, 10);
    if (!Number.isNaN(priceEur) && priceEur >= 0) {
      payload.priceEur = priceEur;
    }
  }

  if (draft.imageUrl.trim()) {
    payload.imageUrl = draft.imageUrl.trim();
  }

  payload.imageLocked = draft.imageLocked;
  payload.descriptionLocked = false;
  payload.priceSource = 'manual';
  payload.imageSource = 'manual';
  payload.specsSource = 'manual';
  payload.scoresSource = 'estimated';
  payload.prosConsSource = 'estimated';
  payload.reliabilitySource = 'estimated';
  payload.absCornering = draft.features.absCornering;
  payload.tractionControl = draft.features.tractionControl;
  payload.ridingModes = draft.features.ridingModes;
  payload.cruiseControl = draft.features.cruiseControl;
  payload.quickshifter = draft.features.quickshifter;
  payload.heatedGrips = draft.features.heatedGrips;
  payload.tubelessWheels = draft.features.tubelessWheels;

  return payload as AdminMotorcycleUpdatePayload;
}

export function draftToCreatePayload(draft: AdminModelDraft, modelId: string): AdminMotorcycleCreatePayload {
  const id = draft.modelId.trim() || modelId || '';
  const brand = draft.brand.trim() || '';
  const model = draft.model.trim() || '';
  const year = parseInt(draft.year, 10);
  const description = draft.description.trim();
  const segment = draft.segment || '';
  const license = draft.license || '';
  const engineType = draft.engineType || '';
  const displacementCc = parseInt(draft.displacementCc, 10);
  const powerHp = parseFloat(draft.powerHp);
  const torqueNm = parseFloat(draft.torqueNm);
  const wetWeightKg = parseFloat(draft.wetWeightKg);
  const seatHeightMm = parseInt(draft.seatHeightMm, 10);
  const fuelTankLiters = parseFloat(draft.fuelTankLiters);
  const priceEur = draft.pricePending ? 0 : parseInt(draft.priceEur, 10) || 0;
  const imageUrl = draft.imageUrl.trim() || '';

  return {
    id,
    brand,
    model,
    year: Number.isNaN(year) ? 0 : year,
    description,
    segment,
    license,
    engineType,
    displacementCc: Number.isNaN(displacementCc) ? 0 : displacementCc,
    powerHp: Number.isNaN(powerHp) ? 0 : powerHp,
    torqueNm: Number.isNaN(torqueNm) ? 0 : torqueNm,
    wetWeightKg: Number.isNaN(wetWeightKg) ? 0 : wetWeightKg,
    seatHeightMm: Number.isNaN(seatHeightMm) ? 0 : seatHeightMm,
    fuelTankLiters: Number.isNaN(fuelTankLiters) ? 0 : fuelTankLiters,
    priceEur,
    imageUrl,
    imageLocked: draft.imageLocked,
    descriptionLocked: false,
    priceSource: 'manual',
    imageSource: 'manual',
    specsSource: 'manual',
    scoresSource: 'estimated',
    prosConsSource: 'estimated',
    reliabilitySource: 'estimated',
    absCornering: draft.features.absCornering,
    tractionControl: draft.features.tractionControl,
    ridingModes: draft.features.ridingModes,
    cruiseControl: draft.features.cruiseControl,
    quickshifter: draft.features.quickshifter,
    heatedGrips: draft.features.heatedGrips,
    tubelessWheels: draft.features.tubelessWheels,
  };
}

export function validateAdminModelDraftForPublish(
  draft: AdminModelDraft,
  options: { mode: 'create' | 'edit'; modelId?: string },
): ValidationResult {
  if (options.mode === 'create') {
    const id = draft.modelId.trim() || options.modelId || '';
    if (!id) {
      return { isValid: false, message: 'El ID del modelo es obligatorio.' };
    }
    if (id.includes(' ')) {
      return { isValid: false, message: 'El ID del modelo no puede contener espacios.' };
    }
  }

  if (!draft.brand.trim()) {
    return { isValid: false, message: 'La marca es obligatoria.' };
  }
  if (!draft.model.trim()) {
    return { isValid: false, message: 'El modelo es obligatorio.' };
  }
  if (!draft.description.trim()) {
    return { isValid: false, message: 'La descripción es obligatoria.' };
  }
  if (!draft.segment) {
    return { isValid: false, message: 'El segmento es obligatorio.' };
  }
  if (!draft.license) {
    return { isValid: false, message: 'El carnet es obligatorio.' };
  }
  if (!draft.engineType) {
    return { isValid: false, message: 'El tipo de motor es obligatorio.' };
  }

  const year = parseInt(draft.year, 10);
  if (Number.isNaN(year) || year < 1900 || year > 2100) {
    return { isValid: false, message: 'El año debe ser un número entre 1900 y 2100.' };
  }

  const displacementCc = parseInt(draft.displacementCc, 10);
  if (Number.isNaN(displacementCc) || displacementCc <= 0) {
    return { isValid: false, message: 'La cilindrada debe ser un número mayor a 0.' };
  }

  const powerHp = parseFloat(draft.powerHp);
  if (Number.isNaN(powerHp) || powerHp <= 0) {
    return { isValid: false, message: 'La potencia debe ser un número mayor a 0.' };
  }

  const torqueNm = parseFloat(draft.torqueNm);
  if (Number.isNaN(torqueNm) || torqueNm <= 0) {
    return { isValid: false, message: 'El par motor debe ser un número mayor a 0.' };
  }

  const wetWeightKg = parseFloat(draft.wetWeightKg);
  if (Number.isNaN(wetWeightKg) || wetWeightKg <= 0) {
    return { isValid: false, message: 'El peso debe ser un número mayor a 0.' };
  }

  const seatHeightMm = parseInt(draft.seatHeightMm, 10);
  if (Number.isNaN(seatHeightMm) || seatHeightMm <= 0) {
    return { isValid: false, message: 'La altura del asiento debe ser un número mayor a 0.' };
  }

  const fuelTankLiters = parseFloat(draft.fuelTankLiters);
  if (Number.isNaN(fuelTankLiters) || fuelTankLiters <= 0) {
    return { isValid: false, message: 'La capacidad del depósito debe ser un número mayor a 0.' };
  }

  if (!draft.pricePending) {
    const priceEur = parseInt(draft.priceEur, 10);
    if (Number.isNaN(priceEur) || priceEur < 0) {
      return { isValid: false, message: 'El precio debe ser un número igual o mayor a 0.' };
    }
  }

  const imageUrl = draft.imageUrl.trim();
  if (!imageUrl) {
    return { isValid: false, message: 'La URL de imagen es obligatoria.' };
  }
  if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return { isValid: false, message: 'La URL de imagen debe ser una URL absoluta o una ruta local comenzando con /.' };
  }

  return { isValid: true };
}
