import type { Bike, BikeLicense, BikeSegment, MotorcycleDataSource } from '../../types/bike';

export const BIKE_SEGMENTS = [
  'trail',
  'adventure',
  'touring',
  'sport-touring',
  'naked',
  'sport',
  'supersport',
  'hypernaked',
  'enduro',
  'dual-sport',
  'scrambler',
  'custom',
  'cruiser',
  'retro',
  'neo-retro',
  'scooter',
] as const satisfies readonly BikeSegment[];

export const BIKE_LICENSES = ['A2', 'A'] as const satisfies readonly BikeLicense[];

export const MOTORCYCLE_DATA_SOURCES = ['api', 'manual', 'estimated', 'user', 'placeholder'] as const satisfies readonly MotorcycleDataSource[];

export const segmentLabels: Record<BikeSegment, string> = {
  adventure: 'Adventure',
  cruiser: 'Cruiser',
  custom: 'Custom',
  'dual-sport': 'Dual Sport',
  enduro: 'Enduro',
  hypernaked: 'Hypernaked',
  naked: 'Naked',
  'neo-retro': 'Neo-retro',
  retro: 'Retro',
  scooter: 'Scooter',
  scrambler: 'Scrambler',
  sport: 'Sport',
  'sport-touring': 'Sport Touring',
  supersport: 'Supersport',
  touring: 'Touring',
  trail: 'Trail',
};

export type BikeA2Status = 'A2' | 'A2_LIMITABLE' | 'A';

export type BikeA2Badge = Readonly<{
  label: 'A2' | 'A2 LIMITABLE' | 'A';
  status: BikeA2Status;
}>;

function getOptionalNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function inferA2StatusFromBike(bike: Pick<Bike, 'license'> & Partial<Pick<Bike, 'powerHp'>>): BikeA2Status {
  if (bike.license === 'A2') {
    const powerHp = getOptionalNumber(bike.powerHp);
    return powerHp !== undefined && powerHp <= 47.6 ? 'A2' : 'A2_LIMITABLE';
  }

  const powerHp = getOptionalNumber(bike.powerHp);

  if (powerHp !== undefined && powerHp <= 47.6) {
    return 'A2';
  }

  if (powerHp !== undefined && powerHp <= 95.2) {
    return 'A2_LIMITABLE';
  }

  return 'A';
}

export function getBikeA2Status(bike: Bike): BikeA2Status {
  if (bike.isA2Compatible === false) {
    return 'A';
  }

  if (bike.isA2Compatible === true) {
    return bike.isA2LimitedVersion ? 'A2_LIMITABLE' : 'A2';
  }

  return inferA2StatusFromBike(bike);
}

export function isBikeA2Compatible(bike: Bike) {
  return getBikeA2Status(bike) !== 'A';
}

export function getBikeA2Badge(bike: Bike): BikeA2Badge {
  const status = getBikeA2Status(bike);

  if (status === 'A2_LIMITABLE') {
    return { label: 'A2 LIMITABLE', status };
  }

  return { label: status, status };
}

export function getDataSourceLabel(source: MotorcycleDataSource | undefined) {
  switch (source) {
    case 'api':
      return 'API';
    case 'manual':
      return 'Manual';
    case 'user':
      return 'Usuario';
    case 'placeholder':
      return 'Placeholder';
    case 'estimated':
    default:
      return 'Estimado';
  }
}

export function isLowConfidenceSource(source: MotorcycleDataSource | undefined) {
  return source === 'estimated' || source === 'placeholder';
}
