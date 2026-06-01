import { describe, expect, it } from 'vitest';
import { BIKE_SEGMENTS } from '../motorcycles/motorcycleTaxonomy';
import {
  getCanonicalSegmentsForMotorcycleVisibleGroup,
  getAvailableMotorcycleSegmentFilterOptions,
  getMotorcycleSegmentFilterGroupForCanonicalSegment,
  getMotorcycleSegmentFilterTargetSegments,
  isCanonicalMotorcycleSegment,
  isMotorcycleSegmentFilterValue,
  isMotorcycleVisibleSegmentFilterGroup,
  matchesMotorcycleSegmentFilter,
  motorcyclePrimarySegmentFilters,
  motorcycleSecondarySegmentFilters,
  motorcycleSegmentFilterOptions,
  motorcycleVisibleSegmentFilterGroups,
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

    expect(motorcycleSecondarySegmentFilters).toEqual(expectedSecondarySegments);
    expect(BIKE_SEGMENTS.includes('other' as never)).toBe(false);
  });

  it('keeps canonical segment and visible group guards explicit', () => {
    expect(isCanonicalMotorcycleSegment('trail')).toBe(true);
    expect(isCanonicalMotorcycleSegment('other')).toBe(false);

    expect(isMotorcycleVisibleSegmentFilterGroup('trail')).toBe(true);
    expect(isMotorcycleVisibleSegmentFilterGroup('other')).toBe(true);
    expect(isMotorcycleVisibleSegmentFilterGroup('adventure')).toBe(false);

    expect(isMotorcycleSegmentFilterValue('all')).toBe(true);
    expect(isMotorcycleSegmentFilterValue('other')).toBe(true);
    expect(isMotorcycleSegmentFilterValue('adventure')).toBe(false);
  });

  it('maps each canonical segment to a visible filter group', () => {
    BIKE_SEGMENTS.forEach((segment) => {
      const group = getMotorcycleSegmentFilterGroupForCanonicalSegment(segment);
      expect(motorcycleVisibleSegmentFilterGroups).toContain(group);
    });
  });

  it('maps primary segments to themselves and secondary segments to other', () => {
    motorcyclePrimarySegmentFilters.forEach((segment) => {
      expect(getMotorcycleSegmentFilterGroupForCanonicalSegment(segment)).toBe(segment);
    });

    motorcycleSecondarySegmentFilters.forEach((segment) => {
      expect(getMotorcycleSegmentFilterGroupForCanonicalSegment(segment)).toBe('other');
    });
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

  it('returns only canonical segments when resolving visible groups to targets', () => {
    motorcycleVisibleSegmentFilterGroups.forEach((group) => {
      const targets = getCanonicalSegmentsForMotorcycleVisibleGroup(group, BIKE_SEGMENTS);
      targets.forEach((segment) => {
        expect(BIKE_SEGMENTS).toContain(segment);
      });
    });
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

  it('does not expose empty filter groups for current available segments (except all)', () => {
    const availableSegments = ['trail', 'sport'] as const;
    const options = getAvailableMotorcycleSegmentFilterOptions(availableSegments);

    options.forEach((option) => {
      if (option.value === 'all') {
        return;
      }

      expect(getMotorcycleSegmentFilterTargetSegments(option.value, availableSegments).length).toBeGreaterThan(0);
    });
  });
});
