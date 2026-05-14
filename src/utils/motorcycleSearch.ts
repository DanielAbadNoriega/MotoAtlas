import { compareQueueMaxSize } from './compareQueue';
import type { Bike, BikeLicense, BikeSegment } from '../types/bike';
import { getBikeA2Status, isBikeA2Compatible } from '../shared/motorcycles/motorcycleTaxonomy';

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
  minPrice: string;
  maxPrice: string;
  minPower: string;
  maxWeight: string;
  sort: SortOption;
};

export const initialSearchFilters: SearchFilters = {
  text: '',
  brands: [],
  segments: [],
  licenses: [],
  minPrice: '',
  maxPrice: '',
  minPower: '',
  maxWeight: '',
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
  const maxWeight = toOptionalNumber(filters.maxWeight);

  const results = motorcycles.filter((bike) => {
    const haystack = normalizeText(`${bike.brand} ${bike.model}`);

    return (
      (!text || haystack.includes(text)) &&
      (filters.brands.length === 0 || filters.brands.includes(bike.brand)) &&
      (filters.segments.length === 0 || filters.segments.includes(bike.segment)) &&
      (filters.licenses.length === 0 ||
        filters.licenses.some((license) =>
          license === 'A2' ? isBikeA2Compatible(bike) : getBikeA2Status(bike) === 'A',
        )) &&
      (minPrice === undefined || bike.priceEur >= minPrice) &&
      (maxPrice === undefined || bike.priceEur <= maxPrice) &&
      (minPower === undefined || bike.powerHp >= minPower) &&
      (maxWeight === undefined || bike.wetWeightKg <= maxWeight)
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
