import type { Bike } from '../../types/bike';
import type { MotorcycleReview, MotorcycleReviewAspect, MotorcycleReviewAspectCategory } from '../../services/motorcycleReviewService';

export type RankingConfidence = 'high' | 'medium' | 'low';

export interface RankingReviewSignal {
  readonly motorcycleId: string;
  readonly reviewCount: number;
  readonly averageRating: number | null;
}

export function buildReviewSignalsByMotorcycleId(
  reviews: readonly MotorcycleReview[],
): Record<string, RankingReviewSignal> {
  const accumulator: Record<string, { count: number; sum: number }> = {};

  for (const review of reviews) {
    if (review.status !== 'approved') continue;

    if (!accumulator[review.motorcycleId]) {
      accumulator[review.motorcycleId] = { count: 0, sum: 0 };
    }

    accumulator[review.motorcycleId] = {
      count: accumulator[review.motorcycleId].count + 1,
      sum: accumulator[review.motorcycleId].sum + review.rating,
    };
  }

  const result: Record<string, RankingReviewSignal> = {};
  for (const [motorcycleId, { count, sum }] of Object.entries(accumulator)) {
    result[motorcycleId] = {
      motorcycleId,
      reviewCount: count,
      averageRating: count > 0 ? Math.round((sum / count) * 10) / 10 : null,
    };
  }

  return result;
}

export const HIGH_CONFIDENCE_MIN_REVIEWS = 10;
export const MEDIUM_CONFIDENCE_MIN_REVIEWS = 3;

export function getRankingConfidence(reviewCount: number): RankingConfidence {
  if (reviewCount >= HIGH_CONFIDENCE_MIN_REVIEWS) return 'high';
  if (reviewCount >= MEDIUM_CONFIDENCE_MIN_REVIEWS) return 'medium';
  return 'low';
}

export interface RankingAspectSignal {
  readonly positive: number;
  readonly negative: number;
  readonly total: number;
  readonly score: number;
}

export type RankingAspectSignalsByMotorcycleId = Record<
  string,
  Partial<Record<MotorcycleReviewAspectCategory, RankingAspectSignal>>
>;

export function buildAspectSignalsByMotorcycleId(
  reviews: readonly MotorcycleReview[],
  aspects: readonly MotorcycleReviewAspect[],
): RankingAspectSignalsByMotorcycleId {
  const approvedReviewIds = new Set<string>();
  for (const review of reviews) {
    if (review.status === 'approved') {
      approvedReviewIds.add(review.id);
    }
  }

  const reviewIdToMotorcycleId: Record<string, string> = {};
  for (const review of reviews) {
    if (review.status === 'approved') {
      reviewIdToMotorcycleId[review.id] = review.motorcycleId;
    }
  }

  const accumulator: Record<string, Record<string, { positive: number; negative: number }>> = {};

  for (const aspect of aspects) {
    if (!approvedReviewIds.has(aspect.reviewId)) continue;

    const motorcycleId = reviewIdToMotorcycleId[aspect.reviewId];
    if (!motorcycleId) continue;

    if (!accumulator[motorcycleId]) {
      accumulator[motorcycleId] = {};
    }
    if (!accumulator[motorcycleId][aspect.category]) {
      accumulator[motorcycleId][aspect.category] = { positive: 0, negative: 0 };
    }

    if (aspect.sentiment === 'positive') {
      accumulator[motorcycleId][aspect.category].positive++;
    } else {
      accumulator[motorcycleId][aspect.category].negative++;
    }
  }

  const result: RankingAspectSignalsByMotorcycleId = {};
  for (const [motorcycleId, categories] of Object.entries(accumulator)) {
    result[motorcycleId] = {};
    for (const [category, { positive, negative }] of Object.entries(categories)) {
      const total = positive + negative;
      const score = total > 0 ? (positive - negative) / total : 0;
      result[motorcycleId][category as MotorcycleReviewAspectCategory] = {
        positive,
        negative,
        total,
        score,
      };
    }
  }

  return result;
}

const RANKING_ASPECT_WEIGHTS: Record<RankingCategory, Partial<Record<MotorcycleReviewAspectCategory, number>>> = {
  global: {
    engine: 1,
    ergonomics: 1,
    consumption: 0.8,
    braking: 0.8,
    suspension: 0.8,
    electronics: 0.7,
    aerodynamics: 0.7,
    passenger: 0.6,
    maintenance: 0.8,
    price: 0.6,
    weight: 0.6,
    design: 0.5,
  },
  daily: {
    ergonomics: 1,
    consumption: 1,
    maintenance: 0.8,
    price: 0.7,
    weight: 0.5,
  },
  travel: {
    aerodynamics: 1,
    passenger: 1,
    ergonomics: 0.8,
    consumption: 0.7,
    suspension: 0.6,
  },
  sport: {
    engine: 1,
    braking: 1,
    suspension: 0.9,
    weight: 0.8,
    electronics: 0.6,
  },
  a2: {
    ergonomics: 1,
    consumption: 0.9,
    maintenance: 0.8,
    weight: 0.8,
    price: 0.7,
  },
  'power-weight': {
    weight: 1,
    engine: 0.8,
  },
  reliability: {
    maintenance: 1,
    electronics: 0.8,
    engine: 0.7,
    consumption: 0.5,
  },
  passenger: {
    passenger: 1,
    ergonomics: 0.8,
    aerodynamics: 0.6,
    suspension: 0.5,
  },
};

export function applyAspectAdjustment(
  baseScore: number,
  category: RankingCategory,
  bikeId: string,
  reviewSignals?: Record<string, RankingReviewSignal>,
  aspectSignals?: RankingAspectSignalsByMotorcycleId,
): number {
  const bikeAspects = aspectSignals?.[bikeId];
  if (!bikeAspects) {
    return baseScore;
  }

  const weights = RANKING_ASPECT_WEIGHTS[category];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [categoryKey, aspectSignal] of Object.entries(bikeAspects)) {
    const weight = weights[categoryKey as MotorcycleReviewAspectCategory];
    if (weight === undefined) continue;

    weightedSum += aspectSignal.score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return baseScore;
  }

  const normalizedScore = weightedSum / totalWeight;

  const reviewCount = reviewSignals?.[bikeId]?.reviewCount ?? 0;
  let adjustmentFactor: number;
  if (reviewCount < 3) {
    adjustmentFactor = 0.35;
  } else if (reviewCount < 10) {
    adjustmentFactor = 0.7;
  } else {
    adjustmentFactor = 1;
  }

  const maxAdjustment = 5;
  const adjustment = normalizedScore * maxAdjustment * adjustmentFactor;

  return Math.max(0, Math.min(100, baseScore + adjustment));
}

export type RankingCategory =
  | 'global'
  | 'daily'
  | 'travel'
  | 'sport'
  | 'a2'
  | 'power-weight'
  | 'reliability'
  | 'passenger';

function clampRankingScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

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
  reviewCount: number;
  averageRating: number | null;
  confidence: RankingConfidence;
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

function buildCategoryRanking(
  motorcycles: readonly Bike[],
  category: RankingCategory,
  reviewSignals?: Record<string, RankingReviewSignal>,
  aspectSignals?: RankingAspectSignalsByMotorcycleId,
): CategoryRanking {
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
      const adjustedScore = applyAspectAdjustment(score, category, bike.id, reviewSignals, aspectSignals);
      const signal = reviewSignals?.[bike.id];
      const reviewCount = signal?.reviewCount ?? 0;
      return { bike, score: adjustedScore >= 0 ? clampRankingScore(adjustedScore) : -1, reviews: reviewCount, keySignal: getKeySignal(bike, category) };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || b.reviews - a.reviews)
    .slice(0, 10)
    .map((item) => {
      const signal = reviewSignals?.[item.bike.id];
      const reviewCount = signal?.reviewCount ?? 0;
      const averageRating = signal?.averageRating ?? null;
      return {
        bike: item.bike,
        score: Math.round(item.score * 10) / 10,
        reviews: reviewCount,
        reviewCount,
        averageRating,
        confidence: getRankingConfidence(reviewCount),
        keySignal: item.keySignal,
      };
    });

  return { category: categoryMeta, entries: scoredBikes };
}

export function buildAllRankings(
  motorcycles: readonly Bike[],
  reviewSignals?: Record<string, RankingReviewSignal>,
  aspectSignals?: RankingAspectSignalsByMotorcycleId,
): readonly CategoryRanking[] {
  return RANKING_CATEGORIES.map((category) => buildCategoryRanking(motorcycles, category.id, reviewSignals, aspectSignals));
}

export function buildGlobalRanking(
  motorcycles: readonly Bike[],
  reviewSignals?: Record<string, RankingReviewSignal>,
  aspectSignals?: RankingAspectSignalsByMotorcycleId,
): readonly RankingEntry[] {
  return buildCategoryRanking(motorcycles, 'global', reviewSignals, aspectSignals).entries;
}

export function getPodiumEntries(
  motorcycles: readonly Bike[],
  reviewSignals?: Record<string, RankingReviewSignal>,
  aspectSignals?: RankingAspectSignalsByMotorcycleId,
): readonly RankingEntry[] {
  const allEntries = buildGlobalRanking(motorcycles, reviewSignals, aspectSignals);

  const highEntries = allEntries.filter((e) => e.confidence === 'high');
  const mediumEntries = allEntries.filter((e) => e.confidence === 'medium');
  const lowEntries = allEntries.filter((e) => e.confidence === 'low');

  const sortByScoreAndReviews = (a: RankingEntry, b: RankingEntry) =>
    b.score - a.score || b.reviews - a.reviews;

  const podium: RankingEntry[] = [];

  for (const entry of highEntries.sort(sortByScoreAndReviews)) {
    if (podium.length >= 3) break;
    podium.push(entry);
  }

  for (const entry of mediumEntries.sort(sortByScoreAndReviews)) {
    if (podium.length >= 3) break;
    podium.push(entry);
  }

  for (const entry of lowEntries.sort(sortByScoreAndReviews)) {
    if (podium.length >= 3) break;
    podium.push(entry);
  }

  return podium;
}
