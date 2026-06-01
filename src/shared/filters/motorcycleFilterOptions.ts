import type { BikeSegment } from '../../types/bike';
import { BIKE_SEGMENTS, isBikeSegment, type BikeA2Status } from '../motorcycles/motorcycleTaxonomy';

export const motorcyclePrimarySegmentFilters = [
  'naked',
  'sport',
  'sport-touring',
  'trail',
  'custom',
  'scooter',
  'touring',
] as const satisfies readonly BikeSegment[];

const motorcyclePrimarySegmentSet = new Set<string>(motorcyclePrimarySegmentFilters);

export const motorcycleSecondarySegmentFilters = BIKE_SEGMENTS.filter(
  (segment) => !motorcyclePrimarySegmentSet.has(segment),
);

export type MotorcycleVisibleSegmentFilterGroup = (typeof motorcyclePrimarySegmentFilters)[number] | 'other';
export type MotorcycleSegmentFilterValue = 'all' | MotorcycleVisibleSegmentFilterGroup;

export const motorcycleVisibleSegmentFilterGroups = [
  ...motorcyclePrimarySegmentFilters,
  'other',
] as const satisfies readonly MotorcycleVisibleSegmentFilterGroup[];

const motorcycleVisibleSegmentFilterGroupSet = new Set<string>(motorcycleVisibleSegmentFilterGroups);

export type MotorcycleSegmentFilterOption = Readonly<{
  icon: string;
  label: string;
  value: MotorcycleSegmentFilterValue;
}>;

export type MotorcycleLicenseFilterOption = Readonly<{
  label: string;
  value: BikeA2Status;
}>;

export const motorcycleSegmentFilterOptions = [
  { icon: 'apps', label: 'Todos', value: 'all' },
  { icon: 'bolt', label: 'Naked', value: 'naked' },
  { icon: 'speed', label: 'Sport', value: 'sport' },
  { icon: 'route', label: 'Sport Touring', value: 'sport-touring' },
  { icon: 'terrain', label: 'Trail', value: 'trail' },
  { icon: 'construction', label: 'Custom', value: 'custom' },
  { icon: 'two_wheeler', label: 'Scooter', value: 'scooter' },
  { icon: 'explore', label: 'Touring', value: 'touring' },
  { icon: 'more_horiz', label: 'Otro', value: 'other' },
] satisfies readonly MotorcycleSegmentFilterOption[];

export const motorcycleLicenseFilterOptions = [
  { label: 'Carnet A2', value: 'A2' },
  { label: 'Carnet A', value: 'A' },
  { label: 'A2 limitable', value: 'A2_LIMITABLE' },
] satisfies readonly MotorcycleLicenseFilterOption[];

export function isCanonicalMotorcycleSegment(value: unknown): value is BikeSegment {
  return isBikeSegment(value);
}

export function isMotorcycleVisibleSegmentFilterGroup(value: unknown): value is MotorcycleVisibleSegmentFilterGroup {
  return typeof value === 'string' && motorcycleVisibleSegmentFilterGroupSet.has(value);
}

export function isMotorcycleSegmentFilterValue(value: unknown): value is MotorcycleSegmentFilterValue {
  return value === 'all' || isMotorcycleVisibleSegmentFilterGroup(value);
}

export function isPrimaryMotorcycleSegment(
  segment: BikeSegment | null | undefined,
): segment is (typeof motorcyclePrimarySegmentFilters)[number] {
  return typeof segment === 'string' && motorcyclePrimarySegmentSet.has(segment);
}

export function getMotorcycleSegmentFilterGroupForCanonicalSegment(segment: BikeSegment): MotorcycleVisibleSegmentFilterGroup {
  return isPrimaryMotorcycleSegment(segment) ? segment : 'other';
}

export function getCanonicalSegmentsForMotorcycleVisibleGroup(
  group: MotorcycleVisibleSegmentFilterGroup,
  availableSegments: readonly BikeSegment[],
): BikeSegment[] {
  if (group === 'other') {
    return availableSegments.filter((segment) => !isPrimaryMotorcycleSegment(segment));
  }

  return availableSegments.includes(group) ? [group] : [];
}

export function matchesMotorcycleSegmentFilter(segment: BikeSegment | null | undefined, filter: MotorcycleSegmentFilterValue) {
  if (filter === 'all') {
    return true;
  }

  if (!segment) {
    return false;
  }

  return getMotorcycleSegmentFilterGroupForCanonicalSegment(segment) === filter;
}

export function getAvailableMotorcycleSegmentFilterOptions(availableSegments: readonly BikeSegment[]) {
  return motorcycleSegmentFilterOptions.filter((option) => {
    if (option.value === 'all') {
      return true;
    }

    return getCanonicalSegmentsForMotorcycleVisibleGroup(option.value, availableSegments).length > 0;
  });
}

export function getMotorcycleSegmentFilterTargetSegments(
  filter: MotorcycleSegmentFilterValue,
  availableSegments: readonly BikeSegment[],
): BikeSegment[] {
  if (filter === 'all') {
    return [];
  }

  return getCanonicalSegmentsForMotorcycleVisibleGroup(filter, availableSegments);
}

export function getMotorcycleLicenseFilterLabel(value: BikeA2Status) {
  return motorcycleLicenseFilterOptions.find((option) => option.value === value)?.label ?? value;
}
