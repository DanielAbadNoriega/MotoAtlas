import type { Bike } from '../../types/bike';

export type RankingCategory =
  | 'global'
  | 'daily'
  | 'travel'
  | 'sport'
  | 'a2'
  | 'power-weight'
  | 'reliability'
  | 'passenger';

export type RankingCategoryMeta = Readonly<{
  id: RankingCategory;
  label: string;
  description: string;
  icon: string;
  tag: string;
}>;

export const RANKING_CATEGORIES: readonly RankingCategoryMeta[] = [
  {
    id: 'global',
    label: 'Mejor valoración global',
    description: 'Las motos que dominan todos los aspectos técnicos y emocionales.',
    icon: 'stars',
    tag: 'GLOBAL',
  },
  {
    id: 'daily',
    label: 'Más recomendadas día a día',
    description: 'Confort, consumo y agilidad urbana según propietarios.',
    icon: 'commute',
    tag: 'DAILY',
  },
  {
    id: 'travel',
    label: 'Mejores para viajar',
    description: 'Capacidad de carga, autonomía y protección aerodinámica.',
    icon: 'travel_explore',
    tag: 'ADVENTURE',
  },
  {
    id: 'sport',
    label: 'Más deportivas',
    description: 'Pura adrenalina, paso por curva y respuesta de motor.',
    icon: 'sports_score',
    tag: 'TRACK',
  },
  {
    id: 'a2',
    label: 'Más equilibradas carnet A2',
    description: 'La puerta de entrada ideal sin renunciar al rendimiento.',
    icon: 'badge',
    tag: 'LICENSE',
  },
  {
    id: 'power-weight',
    label: 'Mejor relación peso/potencia',
    description: 'Motos ligeras que golpean como pesos pesados.',
    icon: 'speed',
    tag: 'RATIO',
  },
  {
    id: 'reliability',
    label: 'Más fiables según usuarios',
    description: 'Mecánica infalible que aguanta el paso de los años.',
    icon: 'verified',
    tag: 'TRUST',
  },
  {
    id: 'passenger',
    label: 'Más cómodas con pasajero',
    description: 'Para los que disfrutan de la carretera en compañía.',
    icon: 'group',
    tag: 'PILLION',
  },
] as const;

export type RankingEntry = Readonly<{
  bike: Bike;
  score: number;
  reviews: number;
  keySignal: string;
}>;

export type CategoryRanking = Readonly<{
  category: RankingCategoryMeta;
  entries: readonly RankingEntry[];
}>;

function scoreGlobal(bike: Bike): number {
  const sportScore = (bike.useScores.sport + bike.useScores.funFactor) / 2;
  const touringScore = (bike.useScores.touring + bike.useScores.passenger + 5) / 2;
  const reliabilityBonus = bike.reliabilityReports.reliabilityScore / 10;
  return (sportScore * 0.4 + touringScore * 0.4 + reliabilityBonus * 0.2) * 10;
}

function scoreDaily(bike: Bike): number {
  const cityScore = bike.useScores.city;
  const comfortBonus = (bike.useScores.beginner + bike.useScores.passenger) / 2;
  const touringScore = bike.useScores.touring * 0.5;
  return (cityScore * 0.5 + comfortBonus * 0.25 + touringScore * 0.25) * 10;
}

function scoreTravel(bike: Bike): number {
  const touringScore = bike.useScores.touring;
  const passengerScore = bike.useScores.passenger;
  const sportScore = bike.useScores.sport;
  const weightPenalty = Math.max(0, bike.wetWeightKg - 200) * 0.01;
  return ((touringScore * 0.5 + passengerScore * 0.25 + sportScore * 0.25 - weightPenalty) * 10);
}

function scoreSport(bike: Bike): number {
  const sportScore = bike.useScores.sport;
  const funScore = bike.useScores.funFactor;
  const powerBonus = Math.min(bike.powerHp / 200, 1) * 5;
  const weightPenalty = Math.max(0, bike.wetWeightKg - 180) * 0.005;
  return ((sportScore * 0.5 + funScore * 0.3 + powerBonus - weightPenalty) * 10);
}

function scoreA2(bike: Bike): number {
  if (bike.license !== 'A2' && !bike.isA2Compatible) {
    return -1;
  }

  const sportScore = bike.useScores.sport;
  const funScore = bike.useScores.funFactor;
  const cityScore = bike.useScores.city;
  const powerFactor = bike.isA2LimitedVersion && bike.limitedPowerHp
    ? bike.limitedPowerHp / 47.6
    : bike.powerHp / 95;
  return ((sportScore * 0.35 + funScore * 0.35 + cityScore * 0.3) * (0.5 + powerFactor * 0.5)) * 10;
}

function scorePowerWeight(bike: Bike): number {
  const powerWeightRatio = bike.powerHp / bike.wetWeightKg;
  const sportScore = bike.useScores.sport;
  const funScore = bike.useScores.funFactor;
  const rawScore = (powerWeightRatio * 100 + sportScore * 0.3 + funScore * 0.2) * 10;
  return Math.min(rawScore, 100);
}

function scoreReliability(bike: Bike): number {
  return bike.reliabilityReports.reliabilityScore * 10;
}

function scorePassenger(bike: Bike): number {
  const passengerScore = bike.useScores.passenger;
  const touringScore = bike.useScores.touring;
  const comfortBonus = bike.useScores.beginner;
  return ((passengerScore * 0.5 + touringScore * 0.3 + comfortBonus * 0.2) * 10);
}

function getKeySignal(bike: Bike, category: RankingCategory): string {
  switch (category) {
    case 'global':
      if (bike.powerHp >= 180) return 'Top Potencia';
      if (bike.useScores.funFactor >= 9) return 'Top Diversión';
      return 'Top Fiabilidad';
    case 'daily':
      if (bike.useScores.city >= 8) return 'Top Ciudad';
      if (bike.useScores.beginner >= 7) return 'Top Iniciación';
      return 'Top Agilidad';
    case 'travel':
      if (bike.useScores.touring >= 9) return 'Top Viaje';
      if (bike.useScores.passenger >= 8) return 'Top Pasajero';
      return 'Top Autonomía';
    case 'sport':
      if (bike.powerHp >= 180) return 'Top Potencia';
      if (bike.useScores.offroad >= 8) return 'Top Offroad';
      return 'Top Agilidad';
    case 'a2':
      if (bike.isA2LimitedVersion) return 'A2 Limitada';
      return 'A2 Compatible';
    case 'power-weight':
      if (bike.powerHp / bike.wetWeightKg >= 0.6) return 'Top Ratio';
      return 'Bajo Peso';
    case 'reliability':
      if (bike.reliabilityReports.reliabilityScore >= 9) return 'Top Fiabilidad';
      return 'Buena Reputación';
    case 'passenger':
      if (bike.useScores.passenger >= 8) return 'Top Confort';
      return 'Buen Reparto';
  }
}

function buildCategoryRanking(motorcycles: readonly Bike[], category: RankingCategory): CategoryRanking {
  const categoryMeta = RANKING_CATEGORIES.find((c) => c.id === category)!;
  const scoredBikes = motorcycles
    .map((bike) => {
      let score: number;
      switch (category) {
        case 'global': score = scoreGlobal(bike); break;
        case 'daily': score = scoreDaily(bike); break;
        case 'travel': score = scoreTravel(bike); break;
        case 'sport': score = scoreSport(bike); break;
        case 'a2': score = scoreA2(bike); break;
        case 'power-weight': score = scorePowerWeight(bike); break;
        case 'reliability': score = scoreReliability(bike); break;
        case 'passenger': score = scorePassenger(bike); break;
      }
      return { bike, score, reviews: bike.reliabilityReports.reportCount, keySignal: getKeySignal(bike, category) };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || b.reviews - a.reviews)
    .slice(0, 10)
    .map((item) => ({
      bike: item.bike,
      score: Math.round(item.score * 10) / 10,
      reviews: item.reviews,
      keySignal: item.keySignal,
    }));

  return { category: categoryMeta, entries: scoredBikes };
}

export function buildAllRankings(motorcycles: readonly Bike[]): readonly CategoryRanking[] {
  return RANKING_CATEGORIES.map((category) => buildCategoryRanking(motorcycles, category.id));
}

export function buildGlobalRanking(motorcycles: readonly Bike[]): readonly RankingEntry[] {
  return buildCategoryRanking(motorcycles, 'global').entries;
}

export function getPodiumEntries(motorcycles: readonly Bike[]): readonly RankingEntry[] {
  return buildGlobalRanking(motorcycles).slice(0, 3);
}
