import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../test/fixtures/bikes';
import {
  filterMotorcycles,
  getNextCompareSelection,
  initialSearchFilters,
  sortMotorcycles,
  type SearchFilters,
} from './motorcycleSearch';

function ids(filters: Partial<SearchFilters>) {
  return filterMotorcycles(bikeFixtures, { ...initialSearchFilters, ...filters }).map((bike) => bike.id);
}

describe('motorcycle search filtering', () => {
  it('filters motorcycles by brand/model text', () => {
    expect(ids({ text: 'tuareg' })).toEqual(['test-aprilia-tuareg-660']);
    expect(ids({ text: 'yamaha mt' })).toEqual(['test-yamaha-mt-09']);
  });

  it('filters motorcycles by brand', () => {
    expect(ids({ brands: ['BMW'] })).toEqual(['test-bmw-f-900-gs']);
  });

  it('filters motorcycles by segment', () => {
    expect(ids({ segments: ['naked'] })).toEqual(['test-yamaha-mt-09']);
  });

  it('filters motorcycles by license', () => {
    expect(ids({ licenses: ['A2'] })).toEqual(['test-aprilia-tuareg-660']);
  });
});

describe('motorcycle search sorting', () => {
  it('sorts by price', () => {
    expect(sortMotorcycles(bikeFixtures, 'price-asc').map((bike) => bike.id)).toEqual([
      'test-yamaha-mt-09',
      'test-aprilia-tuareg-660',
      'test-bmw-f-900-gs',
      'test-honda-nt1100',
    ]);
    expect(sortMotorcycles(bikeFixtures, 'price-desc')[0].id).toBe('test-honda-nt1100');
  });

  it('sorts by power', () => {
    expect(sortMotorcycles(bikeFixtures, 'power-desc')[0].id).toBe('test-yamaha-mt-09');
    expect(sortMotorcycles(bikeFixtures, 'power-asc')[0].id).toBe('test-aprilia-tuareg-660');
  });

  it('sorts by weight', () => {
    expect(sortMotorcycles(bikeFixtures, 'weight-asc')[0].id).toBe('test-yamaha-mt-09');
    expect(sortMotorcycles(bikeFixtures, 'weight-desc')[0].id).toBe('test-honda-nt1100');
  });

  it('sorts by year', () => {
    expect(sortMotorcycles(bikeFixtures, 'year-asc')[0].id).toBe('test-honda-nt1100');
    expect(sortMotorcycles(bikeFixtures, 'year-desc')[0].year).toBe(2024);
  });
});

describe('compare selection', () => {
  it('selects and unselects motorcycles', () => {
    const selected = getNextCompareSelection([], 'test-bmw-f-900-gs');
    expect(selected.selectedIds).toEqual(['test-bmw-f-900-gs']);
    expect(selected.isLimitReached).toBe(false);

    const unselected = getNextCompareSelection(selected.selectedIds, 'test-bmw-f-900-gs');
    expect(unselected.selectedIds).toEqual([]);
  });

  it('prevents selecting more than 3 motorcycles', () => {
    const currentIds = ['test-bmw-f-900-gs', 'test-aprilia-tuareg-660', 'test-yamaha-mt-09'];
    const next = getNextCompareSelection(currentIds, 'test-honda-nt1100');

    expect(next.isLimitReached).toBe(true);
    expect(next.selectedIds).toEqual(currentIds);
  });
});
