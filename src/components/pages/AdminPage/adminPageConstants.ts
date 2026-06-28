import {
  motorcycleLicenseFilterOptions,
  type MotorcycleSegmentFilterValue,
} from '../../../shared/filters/motorcycleFilterOptions';
import { type BikeA2Status } from '../../../shared/motorcycles/motorcycleTaxonomy';
import type {
  AdminReportReasonFilter,
  AdminReportSort,
  AdminReportStatusFilter,
} from '../../../services/adminModerationService';
import type { ReviewReportReason, ReviewReportStatus } from '../../../services/reviewReportService';
import type { ModelRequestStatus, ModelRequest } from '../../../services/modelRequestService';
import type {
  MotorcycleReview,
  MotorcycleReviewRidingStyle,
  MotorcycleReviewStatus,
} from '../../../services/motorcycleReviewService';
import type { BikeEngineType, BikeFeatures, BikeSegment, BikeUseScores } from '../../../types/bike';
import type { AdminModelFeatureKey } from './adminModelDraftUtils';

export type AdminFilterOption<T extends string> = Readonly<{
  icon: string;
  label: string;
  value: T;
}>;

export const adminModelEngineTypeOptions = [
  { value: 'single-cylinder', label: 'Single Cylinder' },
  { value: 'parallel-twin', label: 'Parallel Twin' },
  { value: 'inline-three', label: 'Inline Three' },
  { value: 'inline-four', label: 'Inline Four' },
  { value: 'v-twin', label: 'V-Twin' },
  { value: 'l-twin', label: 'L-Twin' },
  { value: 'boxer-twin', label: 'Boxer Twin' },
] as const satisfies readonly { value: BikeEngineType; label: string }[];

export const adminModelFeatureOptions = [
  { key: 'absCornering', label: 'ABS en curva' },
  { key: 'tractionControl', label: 'Control de tracción' },
  { key: 'ridingModes', label: 'Modos de conducción' },
  { key: 'cruiseControl', label: 'Control crucero' },
  { key: 'quickshifter', label: 'Quickshifter' },
  { key: 'heatedGrips', label: 'Puños calefactables' },
  { key: 'tubelessWheels', label: 'Llantas tubeless' },
] as const satisfies readonly { key: AdminModelFeatureKey; label: string }[];

export const adminModelPreviewPlaceholderImage = '/images/placeholders/motorcycle-model-creating.jpg';

export const REPORTS_PER_PAGE = 6;

export const reasonLabels: Record<ReviewReportReason, string> = {
  false_information: 'Información falsa',
  harassment: 'Acoso',
  offensive: 'Ofensivo',
  other: 'Otro',
  spam: 'Spam',
};

export const reportStatusLabels: Record<ReviewReportStatus, string> = {
  action_taken: 'Resuelto',
  dismissed: 'Descartado',
  pending: 'Pendiente',
  reviewed: 'Revisado',
};

export const reviewStatusLabels: Record<MotorcycleReviewStatus, string> = {
  approved: 'Publicada',
  hidden: 'Oculta',
  pending: 'Pendiente',
  rejected: 'Rechazada',
};

export const reportStatusOptions = [
  { icon: 'apps', label: 'Todos', value: 'all' },
  { icon: 'pending', label: 'Pendientes', value: 'pending' },
  { icon: 'fact_check', label: 'Revisados', value: 'reviewed' },
  { icon: 'block', label: 'Descartados', value: 'dismissed' },
  { icon: 'task_alt', label: 'Resueltos', value: 'action_taken' },
] satisfies readonly AdminFilterOption<AdminReportStatusFilter>[];

export const reasonOptions = [
  { icon: 'apps', label: 'Todos', value: 'all' },
  { icon: 'report', label: 'Spam', value: 'spam' },
  { icon: 'warning', label: 'Ofensivo', value: 'offensive' },
  { icon: 'error', label: 'Información falsa', value: 'false_information' },
  { icon: 'front_hand', label: 'Acoso', value: 'harassment' },
  { icon: 'more_horiz', label: 'Otro', value: 'other' },
] satisfies readonly AdminFilterOption<AdminReportReasonFilter>[];

export const sortOptions = [
  { icon: 'schedule', label: 'Más recientes', value: 'recent' },
  { icon: 'history', label: 'Más antiguos', value: 'oldest' },
] satisfies readonly AdminFilterOption<AdminReportSort>[];

export const reviewStatusOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'pending', label: 'Pendientes', value: 'pending' },
  { icon: 'task_alt', label: 'Publicadas', value: 'approved' },
  { icon: 'block', label: 'Ocultas', value: 'hidden' },
  { icon: 'cancel', label: 'Rechazadas', value: 'rejected' },
] as const;

export const reviewSourceOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'person', label: 'Usuario', value: 'user' },
  { icon: 'science', label: 'Mock', value: 'mock' },
  { icon: 'history_edu', label: 'Seed', value: 'seed' },
  { icon: 'cloud_upload', label: 'Import', value: 'import' },
] as const;

export const reviewVerifiedOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'verified', label: 'Verificadas', value: 'verified' },
  { icon: 'help', label: 'No verificadas', value: 'unverified' },
] as const;

export const reviewSortOptions = [
  { icon: 'schedule', label: 'Más recientes', value: 'recent' },
  { icon: 'history', label: 'Más antiguos', value: 'old' },
] as const;

export const adminLicenseOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' as const },
  ...motorcycleLicenseFilterOptions.map((opt) => ({ icon: '' as const, label: opt.label, value: opt.value })),
];

export const adminRidingStyleOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: '', label: 'Ciudad', value: 'ciudad' },
  { icon: '', label: 'Viaje', value: 'viaje' },
  { icon: '', label: 'Offroad', value: 'offroad' },
  { icon: '', label: 'Deportivo', value: 'deportivo' },
  { icon: '', label: 'Pasajero', value: 'pasajero' },
  { icon: '', label: 'Diario', value: 'diario' },
] as const;

export const sectionNavItems = [
  { id: 'admin-model-section-identity', label: 'Modelo', index: '01' },
  { id: 'admin-model-section-classification', label: 'Clasificación', index: '02' },
  { id: 'admin-model-section-engine', label: 'Motor', index: '03' },
  { id: 'admin-model-section-electronics', label: 'Electrónica', index: '04' },
  { id: 'admin-model-section-market', label: 'Mercado', index: '05' },
  { id: 'admin-model-section-image', label: 'Imagen', index: '06' },
  { id: 'admin-model-section-sources', label: 'Fuentes', index: '07' },
] as const;

export type RangeFilterPreset = {
  key: string;
  label: string;
  min: string;
  max: string;
};

export const pricePresets: RangeFilterPreset[] = [
  { key: 'price-1', label: 'Hasta 5.000 €', min: '', max: '5000' },
  { key: 'price-2', label: '5.000 - 10.000 €', min: '5000', max: '10000' },
  { key: 'price-3', label: '10.000 - 15.000 €', min: '10000', max: '15000' },
  { key: 'price-4', label: '15.000 - 20.000 €', min: '15000', max: '20000' },
  { key: 'price-5', label: 'Más de 20.000 €', min: '20000', max: '' },
];

export const powerPresets: RangeFilterPreset[] = [
  { key: 'power-1', label: 'Hasta 47 CV', min: '', max: '47' },
  { key: 'power-2', label: '48 - 75 CV', min: '48', max: '75' },
  { key: 'power-3', label: '76 - 115 CV', min: '76', max: '115' },
  { key: 'power-4', label: '116+ CV', min: '116', max: '' },
];

export const weightPresets: RangeFilterPreset[] = [
  { key: 'weight-1', label: 'Menos de 180 kg', min: '', max: '180' },
  { key: 'weight-2', label: '180 - 210 kg', min: '180', max: '210' },
  { key: 'weight-3', label: '211 - 240 kg', min: '211', max: '240' },
  { key: 'weight-4', label: 'Más de 240 kg', min: '240', max: '' },
];

export const seatHeightPresets: RangeFilterPreset[] = [
  { key: 'seat-1', label: 'Menos de 800 mm', min: '', max: '800' },
  { key: 'seat-2', label: '800 - 850 mm', min: '800', max: '850' },
  { key: 'seat-3', label: '851 - 900 mm', min: '851', max: '900' },
  { key: 'seat-4', label: 'Más de 900 mm', min: '900', max: '' },
];

export const featureLabels: Record<keyof BikeFeatures, string> = {
  absCornering: 'ABS curva',
  cruiseControl: 'Control crucero',
  heatedGrips: 'Puños calefactables',
  quickshifter: 'Quickshifter',
  ridingModes: 'Modos conducción',
  tractionControl: 'Control tracción',
  tubelessWheels: 'Llantas tubeless',
};

export const useLabels: Record<keyof BikeUseScores, string> = {
  beginner: 'Principiante',
  city: 'Ciudad',
  funFactor: 'Diversión',
  offroad: 'Off-road',
  passenger: 'Pasajero',
  sport: 'Deportivo',
  touring: 'Viaje',
};

export const adminModelsEditSegmentIcon: Partial<Record<BikeSegment, string>> = {
  naked: 'bolt',
  sport: 'speed',
  'sport-touring': 'route',
  trail: 'terrain',
  custom: 'construction',
  scooter: 'two_wheeler',
  touring: 'explore',
};

export type RequestStatusFilterValue = ModelRequestStatus | 'all';
export type RequestSourceFilterValue = ModelRequest['source'] | 'all';

export type RequestStatusOption = Readonly<{
  icon: string;
  label: string;
  value: RequestStatusFilterValue;
}>;

export type RequestSourceOption = Readonly<{
  icon: string;
  label: string;
  value: RequestSourceFilterValue;
}>;

export const requestsDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const requestStatusLabels: Record<ModelRequestStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

export const requestSourceLabels: Record<ModelRequest['source'], string> = {
  user: 'Usuario',
  admin: 'Admin',
  import: 'Import',
};

export const requestStatusOptions: readonly RequestStatusOption[] = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'pending', label: 'Pendientes', value: 'pending' },
  { icon: 'fact_check', label: 'Revisadas', value: 'reviewed' },
  { icon: 'task_alt', label: 'Aprobadas', value: 'approved' },
  { icon: 'cancel', label: 'Rechazadas', value: 'rejected' },
];

export const requestSourceOptions: readonly RequestSourceOption[] = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'person', label: 'Usuario', value: 'user' },
  { icon: 'shield_person', label: 'Admin', value: 'admin' },
  { icon: 'cloud_upload', label: 'Import', value: 'import' },
];

export const REQUESTS_PER_PAGE = 10;

export const ADMIN_ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ADMIN_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ITEMS_PER_PAGE = 12;
