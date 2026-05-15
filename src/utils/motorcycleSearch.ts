import { compareQueueMaxSize } from './compareQueue';
import type { Bike, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores, MotorcycleDataSource } from '../types/bike';
import { getBikeA2Status, isBikeA2Compatible, type BikeA2Status } from '../shared/motorcycles/motorcycleTaxonomy';

export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'power-desc'
  | 'power-asc'
  | 'weight-asc'
  | 'weight-desc'
  | 'year-desc'
  | 'year-asc';

export type SearchFilters = {
  text: string;
  brands: string[];
  segments: BikeSegment[];
  licenses: BikeLicense[];
  a2Statuses: BikeA2Status[];
  minPrice: string;
  maxPrice: string;
  minPower: string;
  maxPower: string;
  minWeight: string;
  maxWeight: string;
  minSeatHeight: string;
  maxSeatHeight: string;
  equipment: (keyof BikeFeatures)[];
  recommendedUses: (keyof BikeUseScores)[];
  dataSources: MotorcycleDataSource[];
  sort: SortOption;
};

export const initialSearchFilters: SearchFilters = {
  text: '',
  brands: [],
  segments: [],
  licenses: [],
  a2Statuses: [],
  minPrice: '',
  maxPrice: '',
  minPower: '',
  maxPower: '',
  minWeight: '',
  maxWeight: '',
  minSeatHeight: '',
  maxSeatHeight: '',
  equipment: [],
  recommendedUses: [],
  dataSources: [],
  sort: 'price-asc',
};

export function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function toOptionalNumber(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function toggleArrayValue<T extends string>(values: readonly T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function sortMotorcycles(results: readonly Bike[], sort: SortOption) {
  return [...results].sort((first, second) => {
    switch (sort) {
      case 'price-desc':
        return second.priceEur - first.priceEur;
      case 'power-desc':
        return second.powerHp - first.powerHp;
      case 'power-asc':
        return first.powerHp - second.powerHp;
      case 'weight-desc':
        return second.wetWeightKg - first.wetWeightKg;
      case 'weight-asc':
        return first.wetWeightKg - second.wetWeightKg;
      case 'year-desc':
        return second.year - first.year;
      case 'year-asc':
        return first.year - second.year;
      case 'price-asc':
      default:
        return first.priceEur - second.priceEur;
    }
  });
}

export function filterMotorcycles(motorcycles: readonly Bike[], filters: SearchFilters) {
  const text = normalizeText(filters.text);
  const minPrice = toOptionalNumber(filters.minPrice);
  const maxPrice = toOptionalNumber(filters.maxPrice);
  const minPower = toOptionalNumber(filters.minPower);
  const maxPower = toOptionalNumber(filters.maxPower);
  const minWeight = toOptionalNumber(filters.minWeight);
  const maxWeight = toOptionalNumber(filters.maxWeight);
  const minSeatHeight = toOptionalNumber(filters.minSeatHeight);
  const maxSeatHeight = toOptionalNumber(filters.maxSeatHeight);

  const results = motorcycles.filter((bike) => {
    const haystack = normalizeText(`${bike.brand} ${bike.model}`);
    const bikeDataSources = [
      bike.specsSource,
      bike.priceSource,
      bike.imageSource,
      bike.scoresSource,
      bike.prosConsSource,
      bike.reliabilitySource,
    ];

    return (
      (!text || haystack.includes(text)) &&
      (filters.brands.length === 0 || filters.brands.includes(bike.brand)) &&
      (filters.segments.length === 0 || filters.segments.includes(bike.segment)) &&
      (filters.licenses.length === 0 ||
        filters.licenses.some((license) =>
          license === 'A2' ? isBikeA2Compatible(bike) : getBikeA2Status(bike) === 'A',
        )) &&
      (filters.a2Statuses.length === 0 || filters.a2Statuses.includes(getBikeA2Status(bike))) &&
      (minPrice === undefined || bike.priceEur >= minPrice) &&
      (maxPrice === undefined || bike.priceEur <= maxPrice) &&
      (minPower === undefined || bike.powerHp >= minPower) &&
      (maxPower === undefined || bike.powerHp <= maxPower) &&
      (minWeight === undefined || bike.wetWeightKg >= minWeight) &&
      (maxWeight === undefined || bike.wetWeightKg <= maxWeight) &&
      (minSeatHeight === undefined || bike.seatHeightMm >= minSeatHeight) &&
      (maxSeatHeight === undefined || bike.seatHeightMm <= maxSeatHeight) &&
      (filters.equipment.length === 0 || filters.equipment.every((feature) => bike.features[feature])) &&
      (filters.recommendedUses.length === 0 || filters.recommendedUses.some((use) => bike.useScores[use] >= 7)) &&
      (filters.dataSources.length === 0 || filters.dataSources.some((source) => bikeDataSources.includes(source)))
    );
  });

  return sortMotorcycles(results, filters.sort);
}

export function getNextCompareSelection(currentIds: readonly Bike['id'][], bikeId: Bike['id']) {
  if (currentIds.includes(bikeId)) {
    return {
      isLimitReached: false,
      selectedIds: currentIds.filter((id) => id !== bikeId),
    };
  }

  if (currentIds.length >= compareQueueMaxSize) {
    return {
      isLimitReached: true,
      selectedIds: [...currentIds],
    };
  }

  return {
    isLimitReached: false,
    selectedIds: [...currentIds, bikeId],
  };
}
