import { getBikeDisplayName } from '../../data/bikes';
import type { Bike } from '../../types/bike';
import { compareQueueMaxSize, getComparatorHashSelection, sanitizeCompareQueue } from '../../utils/compareQueue';

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
  getNumber?: (bike: Bike) => number;
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

const numberFormatter = new Intl.NumberFormat('es-ES');
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const segmentLabels: Record<Bike['segment'], string> = {
  naked: 'Naked',
  'sport-touring': 'Sport Touring',
  trail: 'Trail',
};

const engineTypeLabels: Record<Bike['engineType'], string> = {
  'boxer-twin': 'boxer-twin',
  'inline-four': 'inline-four',
  'inline-three': 'inline-three',
  'l-twin': 'l-twin',
  'parallel-twin': 'parallel-twin',
  'single-cylinder': 'single-cylinder',
  'v-twin': 'v-twin',
};

export const compareSpecRows = [
  { id: 'engine-type', label: 'Engine Type', getValue: (bike) => engineTypeLabels[bike.engineType] },
  { id: 'displacement', label: 'Displacement', getValue: (bike) => `${numberFormatter.format(bike.displacementCc)} cc` },
  {
    id: 'power',
    label: 'Max Power',
    getValue: (bike) => `${numberFormatter.format(bike.powerHp)} HP`,
    getNumber: (bike) => bike.powerHp,
  },
  {
    id: 'torque',
    label: 'Max Torque',
    getValue: (bike) => `${numberFormatter.format(bike.torqueNm)} Nm`,
    getNumber: (bike) => bike.torqueNm,
  },
  {
    id: 'weight',
    label: 'Wet Weight',
    getValue: (bike) => `${numberFormatter.format(bike.wetWeightKg)} kg`,
    getNumber: (bike) => bike.wetWeightKg,
    lowerIsBetter: true,
  },
  {
    id: 'seat-height',
    label: 'Seat Height',
    getValue: (bike) => `${numberFormatter.format(bike.seatHeightMm)} mm`,
    getNumber: (bike) => bike.seatHeightMm,
    lowerIsBetter: true,
  },
  { id: 'fuel-tank', label: 'Fuel Tank', getValue: (bike) => `${numberFormatter.format(bike.fuelTankLiters)} L` },
  {
    id: 'price',
    label: 'Est. Price',
    getValue: (bike) => currencyFormatter.format(bike.priceEur),
    getNumber: (bike) => bike.priceEur,
    lowerIsBetter: true,
  },
  { id: 'license', label: 'License', getValue: (bike) => `Carnet ${bike.license}` },
  { id: 'segment', label: 'Segment', getValue: (bike) => segmentLabels[bike.segment] },
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
  const scores = Object.values(bike.useScores);
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

export function getValueScore(bike: Bike) {
  return (getOverallScore(bike) * 10000) / Math.max(bike.priceEur, 1);
}

export function getBestBikeByNumber(
  bikes: readonly Bike[],
  getNumber: (bike: Bike) => number,
  { lowerIsBetter = false }: { lowerIsBetter?: boolean } = {},
) {
  return [...bikes].sort((first, second) => {
    const delta = getNumber(first) - getNumber(second);
    return lowerIsBetter ? delta : -delta;
  })[0];
}

export function getBestBikeForSpec(row: CompareSpecRow, bikes: readonly Bike[]) {
  return row.getNumber ? getBestBikeByNumber(bikes, row.getNumber, { lowerIsBetter: row.lowerIsBetter }) : undefined;
}

export function getCompareTitle(bikes: readonly Bike[]) {
  const names = bikes.map(getBikeDisplayName);

  if (names.length === 2) {
    return `${names[0]} vs ${names[1]}`;
  }

  return `Comparativa de ${names.length} motos`;
}

function normalizeVotePercentages(entries: readonly CompareBikeEntry[]) {
  const total = entries.reduce((sum, entry) => sum + entry.overallScore, 0) || 1;
  const rounded = entries.map((entry) => Math.max(1, Math.round((entry.overallScore / total) * 100)));
  const drift = 100 - rounded.reduce((sum, value) => sum + value, 0);

  rounded[0] += drift;
  return rounded;
}

function buildEntries(bikes: readonly Bike[]): readonly CompareBikeEntry[] {
  return bikes.map((bike, index) => ({
    bike,
    displayName: getBikeDisplayName(bike),
    index,
    overallScore: getOverallScore(bike),
    valueScore: getValueScore(bike),
  }));
}

function buildHighlights(bikes: readonly Bike[]) {
  const overallWinner = getBestBikeByNumber(bikes, getOverallScore);
  const valueWinner = getBestBikeByNumber(bikes, getValueScore);
  const offroadWinner = getBestBikeByNumber(bikes, (bike) => bike.useScores.offroad);

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
  const totalVotes = entries.reduce((total, entry) => total + entry.bike.reliabilityReports.reportCount, 0) + 1200;

  return {
    marginOfErrorPercent: entries.length === 2 ? 1.2 : 1.8,
    segments: entries.map((entry, index) => ({
      bike: entry.bike,
      displayName: entry.displayName,
      percent: percentages[index],
    })),
    topComment: `${winner.displayName} parece la opción más completa si miramos uso real, fiabilidad percibida y coste total.`,
    topCommentAuthor: '@MOTOATLAS_DATA',
    totalVotes,
  };
}

function buildPerformanceRows(bikes: readonly Bike[]) {
  return comparePerformanceConfig.map((metric) => {
    const winnerBike = getBestBikeByNumber(bikes, (bike) => bike.useScores[metric.id]);

    return {
      id: metric.id,
      label: metric.label,
      winnerBike,
      scores: bikes.map((bike) => ({
        bike,
        displayName: getBikeDisplayName(bike),
        value: bike.useScores[metric.id],
      })),
    } satisfies ComparePerformanceRow;
  });
}

function issueSeverity(bike: Bike): CompareIssue['severity'] {
  if (bike.reliabilityReports.reliabilityScore < 8) {
    return 'ALTA';
  }

  if (bike.reliabilityReports.reliabilityScore < 8.6) {
    return 'MEDIA';
  }

  return 'BAJA';
}

function buildReports(bikes: readonly Bike[]) {
  return bikes.flatMap((bike) => {
    const issues = bike.reliabilityReports.commonIssues.length > 0 ? bike.reliabilityReports.commonIssues : ['Sin patrones críticos reportados'];

    return issues.slice(0, 2).map((issue, index) => ({
      id: `${bike.id}-${index}`,
      bike,
      description: `Reportado en ${getBikeDisplayName(bike)}. ${issue}.`,
      icon: index === 0 ? 'warning' : 'build',
      reportCount: Math.max(1, Math.round(bike.reliabilityReports.reportCount / issues.length)),
      severity: issueSeverity(bike),
      title: issue,
    }));
  });
}

function buildVideos(bikes: readonly Bike[]) {
  return bikes.map((bike) => ({
    id: `${bike.id}-analysis`,
    alt: bike.description,
    duration: `${Math.max(10, Math.round(getOverallScore(bike) + bike.pros.length + bike.cons.length))}:00`,
    imageUrl: bike.imageUrl,
    title: `${getBikeDisplayName(bike)}: análisis técnico y uso real`,
  })) satisfies readonly CompareVideoAnalysis[];
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
