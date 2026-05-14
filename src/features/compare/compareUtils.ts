import type { Bike } from '../../types/bike';
import { compareQueueMaxSize, getComparatorHashSelection, sanitizeCompareQueue } from '../../utils/compareQueue';
import { MOTORCYCLE_IMAGE_FALLBACK_URL, getMotorcycleImage } from '../../shared/images/getMotorcycleImage';
import { getBikeA2Badge, getDataSourceLabel, isLowConfidenceSource, segmentLabels } from '../../shared/motorcycles/motorcycleTaxonomy';

export type CompareUseScoreKey = keyof Bike['useScores'];

export type CompareBikeEntry = Readonly<{
  bike: Bike;
  displayName: string;
  index: number;
  overallScore: number;
  valueScore: number;
}>;

export type CompareSpecRow = Readonly<{
  id: string;
  label: string;
  getValue: (bike: Bike) => string;
  getNumber?: (bike: Bike) => number | undefined;
  lowerIsBetter?: boolean;
}>;

export type CompareHighlight = Readonly<{
  id: string;
  icon: string;
  badgeLabel: string;
  title: string;
  description: string;
  winnerBike: Bike;
}>;

export type CompareVoteSegment = Readonly<{
  bike: Bike;
  displayName: string;
  percent: number;
}>;

export type CompareVoteSummary = Readonly<{
  marginOfErrorPercent: number;
  segments: readonly CompareVoteSegment[];
  topComment: string;
  topCommentAuthor: string;
  totalVotes: number;
}>;

export type ComparePerformanceRow = Readonly<{
  id: CompareUseScoreKey;
  label: string;
  winnerBike: Bike;
  scores: readonly Readonly<{
    bike: Bike;
    displayName: string;
    value: number;
  }>[];
}>;

export type CompareIssue = Readonly<{
  id: string;
  bike: Bike;
  description: string;
  icon: string;
  reportCount: number;
  severity: 'BAJA' | 'MEDIA' | 'ALTA';
  title: string;
}>;

export type CompareVideoAnalysis = Readonly<{
  id: string;
  alt: string;
  bike: Bike;
  duration: string;
  imageUrl: string;
  title: string;
}>;

export type CompareFinalVerdict = Readonly<{
  description: string;
  ranking: readonly CompareBikeEntry[];
  title: string;
  winnerBike: Bike;
}>;

export type CompareViewModel = Readonly<{
  bikes: readonly Bike[];
  entries: readonly CompareBikeEntry[];
  finalVerdict: CompareFinalVerdict;
  highlights: readonly CompareHighlight[];
  performanceRows: readonly ComparePerformanceRow[];
  reports: readonly CompareIssue[];
  specRows: readonly CompareSpecRow[];
  title: string;
  voteSummary: CompareVoteSummary;
  videos: readonly CompareVideoAnalysis[];
}>;

export type CompareHashSelection = Readonly<{
  ids: readonly Bike['id'][];
  ignoredIds: readonly Bike['id'][];
  rawIds: readonly Bike['id'][];
}>;

export type ResolvedCompareSelection = CompareHashSelection &
  Readonly<{
    bikes: readonly Bike[];
    missingIds: readonly Bike['id'][];
  }>;

export const NO_DATA_LABEL = 'Sin datos disponibles';
export const NOT_AVAILABLE_LABEL = 'N/D';
export const PLACEHOLDER_IMAGE_URL = MOTORCYCLE_IMAGE_FALLBACK_URL;

const numberFormatter = new Intl.NumberFormat('es-ES');
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const engineTypeLabels: Record<Bike['engineType'], string> = {
  'boxer-twin': 'boxer-twin',
  'inline-four': 'inline-four',
  'inline-three': 'inline-three',
  'l-twin': 'l-twin',
  'parallel-twin': 'parallel-twin',
  'single-cylinder': 'single-cylinder',
  'v-twin': 'v-twin',
};

function getRuntimeValue<T = unknown>(bike: Bike, key: keyof Bike) {
  return (bike as Partial<Record<keyof Bike, T>>)[key];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function getText(value: unknown, fallback = NO_DATA_LABEL) {
  return isNonEmptyString(value) ? value.trim() : fallback;
}

function getOptionalNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getNumber(value: unknown, fallback = 0) {
  return getOptionalNumber(value) ?? fallback;
}

function getTextArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isNonEmptyString) : [];
}

function formatNumberWithUnit(value: unknown, unit: string) {
  const parsed = getOptionalNumber(value);
  return parsed === undefined ? NOT_AVAILABLE_LABEL : `${numberFormatter.format(parsed)} ${unit}`;
}

function formatCurrency(value: unknown) {
  const parsed = getOptionalNumber(value);
  return parsed === undefined ? NOT_AVAILABLE_LABEL : currencyFormatter.format(parsed);
}

export function getSafeBikeDisplayName(bike: Bike) {
  const brand = getText(getRuntimeValue(bike, 'brand'), '');
  const model = getText(getRuntimeValue(bike, 'model'), '');
  const displayName = [brand, model].filter(Boolean).join(' ').trim();

  return displayName || NO_DATA_LABEL;
}

export function getBikeBrandLabel(bike: Bike) {
  return getText(getRuntimeValue(bike, 'brand'));
}

export function getBikeSegmentLabel(bike: Bike) {
  const segment = getRuntimeValue<Bike['segment']>(bike, 'segment');
  return segment ? (segmentLabels[segment] ?? segment) : NOT_AVAILABLE_LABEL;
}

export function getBikeA2Label(bike: Bike) {
  return getBikeA2Badge(bike).label;
}

export function getBikeDataSourceBadges(bike: Bike) {
  return [
    { id: 'price', label: `Precio ${getDataSourceLabel(bike.priceSource)}`, source: bike.priceSource },
    { id: 'image', label: `Imagen ${getDataSourceLabel(bike.imageSource)}`, source: bike.imageSource },
    { id: 'scores', label: `Scores ${getDataSourceLabel(bike.scoresSource)}`, source: bike.scoresSource },
    { id: 'pros-cons', label: `Pros/cons ${getDataSourceLabel(bike.prosConsSource)}`, source: bike.prosConsSource },
    { id: 'reliability', label: `Fiabilidad ${getDataSourceLabel(bike.reliabilitySource)}`, source: bike.reliabilitySource },
  ].filter((badge) => isLowConfidenceSource(badge.source));
}

export function getBikeDescription(bike: Bike) {
  return getText(getRuntimeValue(bike, 'description'));
}

export function getBikeImageUrl(bike: Bike) {
  return getMotorcycleImage(bike).imageUrl;
}

export function getBikePros(bike: Bike) {
  return getTextArray(getRuntimeValue(bike, 'pros'));
}

export function getBikeCons(bike: Bike) {
  return getTextArray(getRuntimeValue(bike, 'cons'));
}

export function getCommonIssues(bike: Bike) {
  const reliabilityReports = getRuntimeValue<Partial<Bike['reliabilityReports']>>(bike, 'reliabilityReports');
  return getTextArray(reliabilityReports?.commonIssues);
}

export function getReportCount(bike: Bike) {
  const reliabilityReports = getRuntimeValue<Partial<Bike['reliabilityReports']>>(bike, 'reliabilityReports');
  return getNumber(reliabilityReports?.reportCount);
}

export function getReliabilityScore(bike: Bike) {
  const reliabilityReports = getRuntimeValue<Partial<Bike['reliabilityReports']>>(bike, 'reliabilityReports');
  return getOptionalNumber(reliabilityReports?.reliabilityScore);
}

export function getUseScore(bike: Bike, key: CompareUseScoreKey) {
  const useScores = getRuntimeValue<Partial<Bike['useScores']>>(bike, 'useScores');
  return getNumber(useScores?.[key]);
}

function getPrice(bike: Bike) {
  return getOptionalNumber(getRuntimeValue(bike, 'priceEur'));
}

export const compareSpecRows = [
  {
    id: 'engine-type',
    label: 'Engine Type',
    getValue: (bike) => {
      const engineType = getRuntimeValue<Bike['engineType']>(bike, 'engineType');
      return engineType ? (engineTypeLabels[engineType] ?? engineType) : NOT_AVAILABLE_LABEL;
    },
  },
  { id: 'displacement', label: 'Displacement', getValue: (bike) => formatNumberWithUnit(getRuntimeValue(bike, 'displacementCc'), 'cc') },
  {
    id: 'power',
    label: 'Max Power',
    getValue: (bike) => formatNumberWithUnit(getRuntimeValue(bike, 'powerHp'), 'HP'),
    getNumber: (bike) => getOptionalNumber(getRuntimeValue(bike, 'powerHp')),
  },
  {
    id: 'torque',
    label: 'Max Torque',
    getValue: (bike) => formatNumberWithUnit(getRuntimeValue(bike, 'torqueNm'), 'Nm'),
    getNumber: (bike) => getOptionalNumber(getRuntimeValue(bike, 'torqueNm')),
  },
  {
    id: 'weight',
    label: 'Wet Weight',
    getValue: (bike) => formatNumberWithUnit(getRuntimeValue(bike, 'wetWeightKg'), 'kg'),
    getNumber: (bike) => getOptionalNumber(getRuntimeValue(bike, 'wetWeightKg')),
    lowerIsBetter: true,
  },
  {
    id: 'seat-height',
    label: 'Seat Height',
    getValue: (bike) => formatNumberWithUnit(getRuntimeValue(bike, 'seatHeightMm'), 'mm'),
    getNumber: (bike) => getOptionalNumber(getRuntimeValue(bike, 'seatHeightMm')),
    lowerIsBetter: true,
  },
  { id: 'fuel-tank', label: 'Fuel Tank', getValue: (bike) => formatNumberWithUnit(getRuntimeValue(bike, 'fuelTankLiters'), 'L') },
  {
    id: 'price',
    label: 'Est. Price',
    getValue: (bike) => formatCurrency(getRuntimeValue(bike, 'priceEur')),
    getNumber: getPrice,
    lowerIsBetter: true,
  },
  { id: 'a2', label: 'A2 Compatibility', getValue: getBikeA2Label },
  { id: 'license', label: 'License', getValue: (bike) => `Carnet ${getText(getRuntimeValue(bike, 'license'), NOT_AVAILABLE_LABEL)}` },
  { id: 'segment', label: 'Segment', getValue: getBikeSegmentLabel },
] satisfies readonly CompareSpecRow[];

export const comparePerformanceConfig = [
  { id: 'city', label: 'City Use' },
  { id: 'touring', label: 'Road Comfort' },
  { id: 'offroad', label: 'Off-Road Capability' },
  { id: 'passenger', label: 'Passenger / Load' },
  { id: 'beginner', label: 'Beginner Friendly' },
  { id: 'sport', label: 'Sport Riding' },
  { id: 'funFactor', label: 'Fun Factor' },
] satisfies readonly Readonly<{ id: CompareUseScoreKey; label: string }>[];

export function clampScore(score: number) {
  return Math.max(0, Math.min(score, 10));
}

export function scoreWidth(score: number) {
  return `${clampScore(score) * 10}%`;
}

export function getOverallScore(bike: Bike) {
  const scores = comparePerformanceConfig.map((metric) => getUseScore(bike, metric.id));
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

export function getValueScore(bike: Bike) {
  const price = getPrice(bike);
  return price && price > 0 ? (getOverallScore(bike) * 10000) / price : 0;
}

export function getBestBikeByNumber(
  bikes: readonly Bike[],
  getNumericValue: (bike: Bike) => number | undefined,
  { lowerIsBetter = false }: { lowerIsBetter?: boolean } = {},
) {
  const sortedBikes = [...bikes].sort((first, second) => {
    const firstValue = getNumericValue(first);
    const secondValue = getNumericValue(second);

    if (firstValue === undefined && secondValue === undefined) {
      return 0;
    }

    if (firstValue === undefined) {
      return 1;
    }

    if (secondValue === undefined) {
      return -1;
    }

    const delta = firstValue - secondValue;
    return lowerIsBetter ? delta : -delta;
  });

  return sortedBikes[0] ?? bikes[0];
}

export function getBestBikeForSpec(row: CompareSpecRow, bikes: readonly Bike[]) {
  return row.getNumber ? getBestBikeByNumber(bikes, row.getNumber, { lowerIsBetter: row.lowerIsBetter }) : undefined;
}

export function getCompareTitle(bikes: readonly Bike[]) {
  const names = bikes.map(getSafeBikeDisplayName);

  if (names.length === 2) {
    return `${names[0]} vs ${names[1]}`;
  }

  return `Comparativa de ${names.length} motos`;
}

function normalizeVotePercentages(entries: readonly CompareBikeEntry[]) {
  if (entries.length === 0) {
    return [];
  }

  const total = entries.reduce((sum, entry) => sum + entry.overallScore, 0);

  if (total <= 0) {
    const base = Math.floor(100 / entries.length);
    const remainder = 100 - base * entries.length;
    return entries.map((_, index) => base + (index < remainder ? 1 : 0));
  }

  const rounded = entries.map((entry) => Math.max(1, Math.round((entry.overallScore / total) * 100)));
  const drift = 100 - rounded.reduce((sum, value) => sum + value, 0);

  rounded[0] += drift;
  return rounded;
}

function buildEntries(bikes: readonly Bike[]): readonly CompareBikeEntry[] {
  return bikes.map((bike, index) => ({
    bike,
    displayName: getSafeBikeDisplayName(bike),
    index,
    overallScore: getOverallScore(bike),
    valueScore: getValueScore(bike),
  }));
}

function buildHighlights(bikes: readonly Bike[]) {
  const overallWinner = getBestBikeByNumber(bikes, getOverallScore);
  const valueWinner = getBestBikeByNumber(bikes, getValueScore);
  const offroadWinner = getBestBikeByNumber(bikes, (bike) => getUseScore(bike, 'offroad'));

  return [
    {
      id: 'best-overall',
      icon: 'workspace_premium',
      badgeLabel: 'Ganadora',
      title: 'Mejor equilibrio global',
      description: 'La moto que mejor combina uso real, prestaciones, ergonomía y diversión dentro de esta comparativa.',
      winnerBike: overallWinner,
    },
    {
      id: 'best-value',
      icon: 'payments',
      badgeLabel: 'Best value',
      title: 'Mejor calidad/precio',
      description: 'La que más puntuación útil entrega por euro. No es la más barata: es la compra más inteligente.',
      winnerBike: valueWinner,
    },
    {
      id: 'best-adventure',
      icon: 'terrain',
      badgeLabel: 'Ganadora',
      title: 'Mejor fuera del asfalto',
      description: 'La opción con mejor lectura campera según peso, enfoque de segmento y puntuación off-road.',
      winnerBike: offroadWinner,
    },
  ] satisfies readonly CompareHighlight[];
}

function buildVoteSummary(entries: readonly CompareBikeEntry[]): CompareVoteSummary {
  const percentages = normalizeVotePercentages(entries);
  const winner = [...entries].sort((first, second) => second.overallScore - first.overallScore)[0];
  const totalVotes = entries.reduce((total, entry) => total + getReportCount(entry.bike), 0) + 1200;

  return {
    marginOfErrorPercent: entries.length === 2 ? 1.2 : 1.8,
    segments: entries.map((entry, index) => ({
      bike: entry.bike,
      displayName: entry.displayName,
      percent: percentages[index] ?? 0,
    })),
    topComment: `${winner?.displayName ?? NO_DATA_LABEL} parece la opción más completa si miramos uso real, fiabilidad percibida y coste total.`,
    topCommentAuthor: '@MOTOATLAS_DATA',
    totalVotes,
  };
}

function buildPerformanceRows(bikes: readonly Bike[]) {
  return comparePerformanceConfig.map((metric) => {
    const winnerBike = getBestBikeByNumber(bikes, (bike) => getUseScore(bike, metric.id));

    return {
      id: metric.id,
      label: metric.label,
      winnerBike,
      scores: bikes.map((bike) => ({
        bike,
        displayName: getSafeBikeDisplayName(bike),
        value: getUseScore(bike, metric.id),
      })),
    } satisfies ComparePerformanceRow;
  });
}

function issueSeverity(bike: Bike): CompareIssue['severity'] {
  const reliabilityScore = getReliabilityScore(bike);

  if (reliabilityScore === undefined) {
    return 'BAJA';
  }

  if (reliabilityScore < 8) {
    return 'ALTA';
  }

  if (reliabilityScore < 8.6) {
    return 'MEDIA';
  }

  return 'BAJA';
}

function buildReports(bikes: readonly Bike[]) {
  return bikes.flatMap((bike) => {
    const issues = getCommonIssues(bike);
    const issuesToRender = issues.length > 0 ? issues : [NO_DATA_LABEL];

    return issuesToRender.slice(0, 2).map((issue, index) => ({
      id: `${bike.id}-${index}`,
      bike,
      description:
        issue === NO_DATA_LABEL
          ? `${getSafeBikeDisplayName(bike)} no tiene common issues registrados.`
          : `Reportado en ${getSafeBikeDisplayName(bike)}. ${issue}.`,
      icon: issue === NO_DATA_LABEL ? 'info' : index === 0 ? 'warning' : 'build',
      reportCount: issues.length > 0 ? Math.round(getReportCount(bike) / issues.length) : 0,
      severity: issue === NO_DATA_LABEL ? 'BAJA' : issueSeverity(bike),
      title: issue,
    }));
  });
}

function buildVideos(bikes: readonly Bike[]) {
  return bikes.map((bike) => {
    const overallScore = getOverallScore(bike);
    const hasScore = overallScore > 0;

    return {
      id: `${bike.id}-analysis`,
      alt: getBikeDescription(bike),
      bike,
      duration: hasScore ? `${Math.max(10, Math.round(overallScore + getBikePros(bike).length + getBikeCons(bike).length))}:00` : NOT_AVAILABLE_LABEL,
      imageUrl: getBikeImageUrl(bike),
      title: `${getSafeBikeDisplayName(bike)}: análisis técnico y uso real`,
    };
  }) satisfies readonly CompareVideoAnalysis[];
}

function buildFinalVerdict(entries: readonly CompareBikeEntry[]): CompareFinalVerdict {
  const ranking = [...entries].sort((first, second) => second.overallScore - first.overallScore);
  const winner = ranking[0];

  return {
    description: `${winner.displayName} queda como referencia por balance global. No gana en todo, pero ofrece el paquete más sólido para esta selección concreta.`,
    ranking,
    title: 'Veredicto final',
    winnerBike: winner.bike,
  };
}

export function buildCompareViewModel(bikes: readonly Bike[]): CompareViewModel {
  const selectedBikes = sanitizeCompareQueue(bikes.map((bike) => bike.id))
    .map((id) => bikes.find((bike) => bike.id === id))
    .filter((bike): bike is Bike => Boolean(bike));
  const entries = buildEntries(selectedBikes);

  return {
    bikes: selectedBikes,
    entries,
    finalVerdict: buildFinalVerdict(entries),
    highlights: buildHighlights(selectedBikes),
    performanceRows: buildPerformanceRows(selectedBikes),
    reports: buildReports(selectedBikes),
    specRows: compareSpecRows,
    title: getCompareTitle(selectedBikes),
    voteSummary: buildVoteSummary(entries),
    videos: buildVideos(selectedBikes),
  };
}

export function getCompareHashSelection(hash: string): CompareHashSelection {
  return getComparatorHashSelection(hash);
}

export function resolveCompareSelectionFromHash(hash: string, motorcycles: readonly Bike[]): ResolvedCompareSelection {
  const selection = getCompareHashSelection(hash);
  const bikes = selection.ids
    .map((id) => motorcycles.find((bike) => bike.id === id))
    .filter((bike): bike is Bike => Boolean(bike));
  const missingIds = selection.ids.filter((id) => !motorcycles.some((bike) => bike.id === id));

  return {
    ...selection,
    bikes,
    missingIds,
  };
}

export function getCompareHashFromIds(ids: readonly Bike['id'][]) {
  const selectedIds = sanitizeCompareQueue(ids);
  return `#/comparador?bikes=${selectedIds.map((id) => encodeURIComponent(id)).join(',')}`;
}

export function getCompareHashAfterRemoving(ids: readonly Bike['id'][], idToRemove: Bike['id']) {
  return getCompareHashFromIds(ids.filter((id) => id !== idToRemove));
}

export function getCompareHashAfterAdding(ids: readonly Bike['id'][], idToAdd: Bike['id']) {
  return getCompareHashFromIds([...ids, idToAdd]);
}

export function getFirstAddableBike(selectedBikes: readonly Bike[], motorcycles: readonly Bike[]) {
  if (selectedBikes.length >= compareQueueMaxSize) {
    return undefined;
  }

  const selectedIds = new Set(selectedBikes.map((bike) => bike.id));
  return motorcycles.find((bike) => !selectedIds.has(bike.id));
}
