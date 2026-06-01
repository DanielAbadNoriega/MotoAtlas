import { describe, expect, it } from 'vitest';
import { BIKE_SEGMENTS } from '../motorcycles/motorcycleTaxonomy';
import {
  getAvailableMotorcycleSegmentFilterOptions,
  getMotorcycleSegmentFilterTargetSegments,
  matchesMotorcycleSegmentFilter,
  motorcyclePrimarySegmentFilters,
  motorcycleSegmentFilterOptions,
} from './motorcycleFilterOptions';

const expectedPrimarySegments = [
  'naked',
  'sport',
  'sport-touring',
  'trail',
  'custom',
  'scooter',
  'touring',
] as const;

const expectedSecondarySegments = [
  'adventure',
  'supersport',
  'hypernaked',
  'enduro',
  'dual-sport',
  'scrambler',
  'cruiser',
  'retro',
  'neo-retro',
] as const;

describe('motorcycle segment filter options contract', () => {
  it('documents current strategy: primary segments + controlled "other" bucket', () => {
    expect(motorcyclePrimarySegmentFilters).toEqual(expectedPrimarySegments);
    const primarySegmentSet = new Set<string>(motorcyclePrimarySegmentFilters);

    const secondarySegments = BIKE_SEGMENTS.filter(
      (segment) => !primarySegmentSet.has(segment),
    );

    expect(secondarySegments).toEqual(expectedSecondarySegments);
    expect(BIKE_SEGMENTS.includes('other' as never)).toBe(false);
  });

  it('keeps filter option values in sync with known segment values (or reserved buckets)', () => {
    motorcycleSegmentFilterOptions.forEach((option) => {
      expect(option.icon.trim().length).toBeGreaterThan(0);
      expect(option.label.trim().length).toBeGreaterThan(0);

      if (option.value === 'all' || option.value === 'other') {
        return;
      }

      expect(BIKE_SEGMENTS).toContain(option.value);
    });
  });

  it('maps target segments correctly for all/other/specific filters', () => {
    expect(getMotorcycleSegmentFilterTargetSegments('all', BIKE_SEGMENTS)).toEqual([]);
    expect(getMotorcycleSegmentFilterTargetSegments('sport', BIKE_SEGMENTS)).toEqual(['sport']);
    expect(getMotorcycleSegmentFilterTargetSegments('other', BIKE_SEGMENTS)).toEqual(expectedSecondarySegments);
  });

  it('keeps "other" as UI bucket only, never as real BikeSegment', () => {
    expect(matchesMotorcycleSegmentFilter('adventure', 'other')).toBe(true);
    expect(matchesMotorcycleSegmentFilter('naked', 'other')).toBe(false);
    expect(matchesMotorcycleSegmentFilter('naked', 'naked')).toBe(true);
  });

  it('shows/hides "other" depending on available secondary segments', () => {
    const optionsWithoutSecondary = getAvailableMotorcycleSegmentFilterOptions(expectedPrimarySegments);
    const optionsWithSecondary = getAvailableMotorcycleSegmentFilterOptions(['trail', 'adventure']);

    expect(optionsWithoutSecondary.some((option) => option.value === 'other')).toBe(false);
    expect(optionsWithSecondary.some((option) => option.value === 'other')).toBe(true);
  });
});
