import type { BikeSegment } from '../../types/bike';
import type { BikeA2Status } from '../motorcycles/motorcycleTaxonomy';

export type MotorcycleSegmentFilterValue =
  | 'all'
  | 'custom'
  | 'naked'
  | 'other'
  | 'scooter'
  | 'sport'
  | 'sport-touring'
  | 'touring'
  | 'trail';

export type MotorcycleSegmentFilterOption = Readonly<{
  icon: string;
  label: string;
  value: MotorcycleSegmentFilterValue;
}>;

export type MotorcycleLicenseFilterOption = Readonly<{
  label: string;
  value: BikeA2Status;
}>;

export const motorcyclePrimarySegmentFilters = [
  'naked',
  'sport',
  'sport-touring',
  'trail',
  'custom',
  'scooter',
  'touring',
] as const satisfies readonly BikeSegment[];

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

export function isPrimaryMotorcycleSegment(segment: BikeSegment | null | undefined) {
  return Boolean(segment) && motorcyclePrimarySegmentFilters.includes(segment as (typeof motorcyclePrimarySegmentFilters)[number]);
}

export function matchesMotorcycleSegmentFilter(segment: BikeSegment | null | undefined, filter: MotorcycleSegmentFilterValue) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'other') {
    return Boolean(segment) && !isPrimaryMotorcycleSegment(segment);
  }

  return segment === filter;
}

export function getAvailableMotorcycleSegmentFilterOptions(availableSegments: readonly BikeSegment[]) {
  const availableSegmentSet = new Set(availableSegments);
  const hasOtherSegments = availableSegments.some((segment) => !isPrimaryMotorcycleSegment(segment));

  return motorcycleSegmentFilterOptions.filter((option) => {
    if (option.value === 'all') {
      return true;
    }

    if (option.value === 'other') {
      return hasOtherSegments;
    }

    return availableSegmentSet.has(option.value);
  });
}

export function getMotorcycleSegmentFilterTargetSegments(
  filter: MotorcycleSegmentFilterValue,
  availableSegments: readonly BikeSegment[],
) {
  if (filter === 'all') {
    return [];
  }

  if (filter === 'other') {
    return availableSegments.filter((segment) => !isPrimaryMotorcycleSegment(segment));
  }

  return [filter];
}

export function getMotorcycleLicenseFilterLabel(value: BikeA2Status) {
  return motorcycleLicenseFilterOptions.find((option) => option.value === value)?.label ?? value;
}
