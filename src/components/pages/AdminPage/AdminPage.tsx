import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import adminHeroImage from '../../../assets/hero-admin.png';
import { useAuth } from '../../../features/auth';
import { bikeCatalog, findBikeById, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import {
  getReviewReports,
  resolveReportWithReviewStatus,
  updateReviewReportStatus,
  type AdminReportReasonFilter,
  type AdminReportSort,
  type AdminReportStatusFilter,
  type AdminReviewReport,
} from '../../../services/adminModerationService';
import { getAllReviews } from '../../../services/adminReviewService';
import {
  getAdminPendingReplies,
  updateReviewReplyStatus,
  type AdminReviewReply,
} from '../../../services/adminReplyService';
import {
  getAllModelRequests,
  updateModelRequestStatus as updateModelRequestStatusService,
  type ModelRequest as ModelRequestType,
  type ModelRequestAuthContext,
  type ModelRequestFilters,
  type ModelRequestStatus as ModelRequestStatusType,
} from '../../../services/modelRequestService';
import {
  getReviewAspectsByReviewIds,
  type CreateReviewAuthContext,
  MotorcycleReview,
  MotorcycleReviewAspect,
  MotorcycleReviewRidingStyle,
  MotorcycleReviewStatus,
} from '../../../services/motorcycleReviewService';
import {
  createAdminMotorcycle,
  updateAdminMotorcycle,
  type AdminMotorcycleCreatePayload,
  type AdminMotorcycleUpdatePayload,
} from '../../../services/adminMotorcycleService';
import { deleteMotorcycleImage, MOTORCYCLE_IMAGE_BUCKET, uploadMotorcycleImage } from '../../../services/adminMotorcycleImageUploadService';
import {
  createAdminMotorcycleGalleryImage,
  getAdminMotorcycleGalleryImages,
  type AdminMotorcycleGalleryImage,
} from '../../../services/adminMotorcycleGalleryService';
import type { ReviewReplyStatus } from '../../../services/reviewReplyService';
import type { ReviewReportReason, ReviewReportStatus } from '../../../services/reviewReportService';
import {
  matchesMotorcycleSegmentFilter,
  motorcycleLicenseFilterOptions,
  motorcycleSegmentFilterOptions,
  type MotorcycleSegmentFilterValue,
} from '../../../shared/filters/motorcycleFilterOptions';
import { BIKE_LICENSES, BIKE_SEGMENTS, getBikeA2Status, segmentIcons, segmentLabels, MOTORCYCLE_DATA_SOURCES, type BikeA2Status } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { dataQualityLabels, getDataQualityLabel } from '../../../shared/dataQuality/dataQualityLabels';
import { canUseDemoData, isDemoDataToggleAvailable, setDemoDataPreference } from '../../../shared/env/runtimeEnvironment';
import { getMotorcycleTechnicalIcon } from '../../../shared/motorcycles/motorcycleTechnicalIcons';
import { normalizeText } from '../../../utils/motorcycleSearch';
import { slugifyRoutePart } from '../../../shared/routing/routeUtils';
import { FilterGroup } from '../../../shared/ui/filters/FilterGroup';
import { FilterOptionButton } from '../../../shared/ui/filters/FilterOptionButton';
import { PageHero } from '../../ui/PageHero';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { AccountQuickLinksNav, type AdminQuickLinksModelsItem } from '../AccountPage/AccountQuickLinksNav';
import { ReviewAspectSummary } from '../../reviews/ReviewAspectSummary';
import '../AccountPage/AccountPage.scss';
import './AdminPage.scss';
import type { Bike, BikeEngineType, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores, MotorcycleDataSource } from '../../../types/bike';

type ReviewAspectsMap = Record<string, readonly MotorcycleReviewAspect[]>;

type AdminGateProps = Readonly<{
  children: ReactNode;
  title?: string;
}>;

type AdminFilters = Readonly<{
  reason: AdminReportReasonFilter;
  sort: AdminReportSort;
  status: AdminReportStatusFilter;
}>;

type AdminFilterOption<T extends string> = Readonly<{
  icon: string;
  label: string;
  value: T;
}>;

type AdminSidebarActiveItem = 'dashboard' | 'moderation' | 'reviews' | 'requests' | 'models';


type AdminModelDraft = {
  brand: string;
  model: string;
  year: string;
  description: string;
  modelId: string;
  segment: BikeSegment | '';
  license: BikeLicense | '';
  engineType: BikeEngineType | '';
  displacementCc: string;
  powerHp: string;
  torqueNm: string;
  wetWeightKg: string;
  seatHeightMm: string;
  fuelTankLiters: string;
  priceEur: string;
  pricePending: boolean;
  imageUrl: string;
  imageLocked: boolean;
  officialUrl: string;
  sourceNotes: string;
  internalNotes: string;
  features: Record<keyof BikeFeatures, boolean>;
};

type AdminModelDraftField = Exclude<keyof AdminModelDraft, 'features' | 'pricePending' | 'imageLocked'>;
type AdminModelFeatureKey = keyof BikeFeatures;

type AdminModelSectionProps = Readonly<{
  children: ReactNode;
  description?: string;
  id: string;
  technicalTitle: string;
}>;

const adminModelEngineTypeOptions = [
  { value: 'single-cylinder', label: 'Single Cylinder' },
  { value: 'parallel-twin', label: 'Parallel Twin' },
  { value: 'inline-three', label: 'Inline Three' },
  { value: 'inline-four', label: 'Inline Four' },
  { value: 'v-twin', label: 'V-Twin' },
  { value: 'l-twin', label: 'L-Twin' },
  { value: 'boxer-twin', label: 'Boxer Twin' },
] as const satisfies readonly { value: BikeEngineType; label: string }[];

const adminModelFeatureOptions = [
  { key: 'absCornering', label: 'ABS en curva' },
  { key: 'tractionControl', label: 'Control de tracción' },
  { key: 'ridingModes', label: 'Modos de conducción' },
  { key: 'cruiseControl', label: 'Control crucero' },
  { key: 'quickshifter', label: 'Quickshifter' },
  { key: 'heatedGrips', label: 'Puños calefactables' },
  { key: 'tubelessWheels', label: 'Llantas tubeless' },
] as const satisfies readonly { key: AdminModelFeatureKey; label: string }[];

const emptyAdminModelDraft: AdminModelDraft = {
  brand: '',
  model: '',
  year: '',
  description: '',
  modelId: '',
  segment: '',
  license: '',
  engineType: '',
  displacementCc: '',
  powerHp: '',
  torqueNm: '',
  wetWeightKg: '',
  seatHeightMm: '',
  fuelTankLiters: '',
  priceEur: '',
  pricePending: true,
  imageUrl: '',
  imageLocked: false,
  officialUrl: '',
  sourceNotes: '',
  internalNotes: '',
  features: {
    absCornering: false,
    tractionControl: false,
    ridingModes: false,
    cruiseControl: false,
    quickshifter: false,
    heatedGrips: false,
    tubelessWheels: false,
  },
};

const adminModelPreviewPlaceholderImage = '/images/placeholders/motorcycle-model-creating.jpg';
const adminModelTechnicalPlaceholderImage = '/images/placeholders/motorcycle-technical-pending.jpg';

function createDraftFromBike(bike: Bike): AdminModelDraft {
  return {
    brand: bike.brand,
    model: bike.model,
    year: String(bike.year),
    description: bike.description || '',
    modelId: bike.id,
    segment: bike.segment,
    license: bike.license,
    engineType: bike.engineType,
    displacementCc: String(bike.displacementCc),
    powerHp: String(bike.powerHp),
    torqueNm: String(bike.torqueNm),
    wetWeightKg: String(bike.wetWeightKg),
    seatHeightMm: String(bike.seatHeightMm),
    fuelTankLiters: String(bike.fuelTankLiters),
    priceEur: String(bike.priceEur),
    pricePending: false,
    imageUrl: bike.imageUrl,
    imageLocked: bike.imageLocked ?? false,
    officialUrl: bike.officialUrl ?? '',
    sourceNotes: '',
    internalNotes: '',
    features: { ...bike.features },
  };
}

function cloneAdminModelDraft(draft: AdminModelDraft): AdminModelDraft {
  return {
    ...draft,
    features: { ...draft.features },
  };
}

function formatPreviewNumber(value: string, unit: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '—';
  }

  return `${new Intl.NumberFormat('es-ES').format(parsed)} ${unit}`;
}

function formatPreviewPrice(value: string, isPending: boolean) {
  const parsed = Number(value);

  if (isPending || !Number.isFinite(parsed) || parsed <= 0) {
    return 'Precio pendiente';
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(parsed);
}

function buildSuggestedModelId(draft: Pick<AdminModelDraft, 'brand' | 'model' | 'year'>) {
  const parts = [draft.brand.trim(), draft.model.trim(), draft.year.trim()].filter(Boolean);
  return parts.length > 0 ? slugifyRoutePart(parts.join(' ')) : '';
}

function getPreviewBadgeLabel(segment: BikeSegment | '') {
  return segment ? segmentLabels[segment] : 'Segmento pendiente';
}

function getPreviewBadgeIcon(segment: BikeSegment | '') {
  return segment ? segmentIcons[segment] : 'category';
}

function AdminModelSection({ children, description, id, technicalTitle }: AdminModelSectionProps) {
  return (
    <details className="admin-page__model-section" id={id} open>
      <summary className="admin-page__model-section-header">
        <div className="admin-page__model-section-heading">
          <span className="admin-page__model-section-line" aria-hidden="true" />
          <div className="admin-page__model-section-title-group">
            <span className="admin-page__model-section-expand-icon" aria-hidden="true">
              <span className="material-symbols-outlined">expand_more</span>
            </span>
            <h2>{technicalTitle}</h2>
            {description ? (
              <span className="admin-page__model-section-tooltip-wrapper">
                <button
                  type="button"
                  className="admin-page__model-section-info-btn"
                  aria-label={`Más información sobre ${technicalTitle}`}
                >
                  <span aria-hidden="true">i</span>
                </button>
                <span className="admin-page__model-section-tooltip" role="tooltip">
                  {description}
                </span>
              </span>
            ) : null}
          </div>
          <span className="admin-page__model-section-line" aria-hidden="true" />
        </div>
      </summary>
      <div className="admin-page__model-section-body">{children}</div>
    </details>
  );
}

type AdminModelInfoTooltipProps = Readonly<{
  ariaLabel: string;
  description: string;
}>;

function AdminModelInfoTooltip({ ariaLabel, description }: AdminModelInfoTooltipProps) {
  return (
    <span className="admin-page__model-field-tooltip-wrapper">
      <button type="button" className="admin-page__model-section-info-btn" aria-label={ariaLabel}>
        <span aria-hidden="true">i</span>
      </button>
      <span className="admin-page__model-section-tooltip" role="tooltip">
        {description}
      </span>
    </span>
  );
}

function AdminModelHeroPreview({ draft }: Readonly<{ draft: AdminModelDraft }>) {
  const brandLabel = (draft.brand ?? '').trim() || 'Marca';
  const modelLabel = (draft.model ?? '').trim() || 'Modelo';
  const description = (draft.description ?? '').trim() || 'Descripción pendiente de completar';
  const previewImageSrc = (draft.imageUrl ?? '').trim() || adminModelPreviewPlaceholderImage;
  const previewTitle = `${brandLabel} ${modelLabel}`;

  return (
    <section className="admin-page__model-preview" aria-labelledby="admin-model-preview-title">
      <div className="admin-page__model-preview-hero">
        <div className="admin-page__model-preview-media">
          <img src={previewImageSrc} alt={`Preview local de ${previewTitle}`} />
        </div>

        <div className="admin-page__model-preview-content">
          <span className="admin-page__model-preview-chip">Preview local</span>

          <div className="admin-page__model-preview-badges">
            <span className="admin-page__model-preview-badge">
              <span className="material-symbols-outlined" aria-hidden="true">{getPreviewBadgeIcon(draft.segment)}</span>
              <span className="admin-page__model-preview-badge-text">{getPreviewBadgeLabel(draft.segment)}</span>
            </span>
            <span className="admin-page__model-preview-badge">
              <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('license')}</span>
              <span className="admin-page__model-preview-badge-text">{draft.license || 'Carnet pendiente'}</span>
            </span>
            <span className="admin-page__model-preview-badge">
              <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
              <span className="admin-page__model-preview-badge-text">{draft.year.trim() || 'Año pendiente'}</span>
            </span>
          </div>

          <h2 id="admin-model-preview-title">
            {brandLabel} <strong>{modelLabel}</strong>
          </h2>
          <p>{description}</p>

          <div className="admin-page__model-preview-specs" role="group" aria-label="Datos principales del preview">
            <div>
              <span>Potencia</span>
              <strong>{formatPreviewNumber(draft.powerHp, 'CV')}</strong>
            </div>
            <div>
              <span>Peso</span>
              <strong>{formatPreviewNumber(draft.wetWeightKg, 'kg')}</strong>
            </div>
            <div>
              <span>Motor</span>
              <strong>{formatPreviewNumber(draft.displacementCc, 'cc')}</strong>
            </div>
            <div>
              <span>Precio</span>
              <strong>{formatPreviewPrice(draft.priceEur, draft.pricePending)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type AdminReviewGarageItem = Readonly<{
  detailHref: string;
  imageSource: Readonly<{
    brand?: string;
    imageUrl?: string;
    model?: string;
    name?: string;
  }>;
  latestReviewAt: string;
  motorcycleId: string;
  motorcycleName: string;
  pendingReviewCount: number;
  reviewCount: number;
}>;

const defaultFilters: AdminFilters = {
  reason: 'all',
  sort: 'recent',
  status: 'pending',
};

// Filters for admin reviews page
type AdminReviewsFilters = Readonly<{
  search: string;
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'hidden';
  source: 'all' | 'user' | 'mock' | 'seed' | 'import';
  segment: MotorcycleSegmentFilterValue;
  verified: 'all' | 'verified' | 'unverified';
  license: 'all' | BikeA2Status;
  ridingStyle: 'all' | MotorcycleReviewRidingStyle;
  sort: 'recent' | 'old';
}>;

const defaultReviewsFilters: AdminReviewsFilters = {
  search: '',
  status: 'all',
  source: 'all',
  segment: 'all',
  verified: 'all',
  license: 'all',
  ridingStyle: 'all',
  sort: 'recent',
};

const REPORTS_PER_PAGE = 6;

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const reasonLabels: Record<ReviewReportReason, string> = {
  false_information: 'Información falsa',
  harassment: 'Acoso',
  offensive: 'Ofensivo',
  other: 'Otro',
  spam: 'Spam',
};

const reportStatusLabels: Record<ReviewReportStatus, string> = {
  action_taken: 'Resuelto',
  dismissed: 'Descartado',
  pending: 'Pendiente',
  reviewed: 'Revisado',
};

const reviewStatusLabels: Record<MotorcycleReviewStatus, string> = {
  approved: 'Publicada',
  hidden: 'Oculta',
  pending: 'Pendiente',
  rejected: 'Rechazada',
};

const reportStatusOptions = [
  { icon: 'apps', label: 'Todos', value: 'all' },
  { icon: 'pending', label: 'Pendientes', value: 'pending' },
  { icon: 'fact_check', label: 'Revisados', value: 'reviewed' },
  { icon: 'block', label: 'Descartados', value: 'dismissed' },
  { icon: 'task_alt', label: 'Resueltos', value: 'action_taken' },
] satisfies readonly AdminFilterOption<AdminReportStatusFilter>[];

const reasonOptions = [
  { icon: 'apps', label: 'Todos', value: 'all' },
  { icon: 'report', label: 'Spam', value: 'spam' },
  { icon: 'warning', label: 'Ofensivo', value: 'offensive' },
  { icon: 'error', label: 'Información falsa', value: 'false_information' },
  { icon: 'front_hand', label: 'Acoso', value: 'harassment' },
  { icon: 'more_horiz', label: 'Otro', value: 'other' },
] satisfies readonly AdminFilterOption<AdminReportReasonFilter>[];

const sortOptions = [
  { icon: 'schedule', label: 'Más recientes', value: 'recent' },
  { icon: 'history', label: 'Más antiguos', value: 'oldest' },
] satisfies readonly AdminFilterOption<AdminReportSort>[];

const reviewStatusOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'pending', label: 'Pendientes', value: 'pending' },
  { icon: 'task_alt', label: 'Publicadas', value: 'approved' },
  { icon: 'block', label: 'Ocultas', value: 'hidden' },
  { icon: 'cancel', label: 'Rechazadas', value: 'rejected' },
] as const;

const reviewSourceOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'person', label: 'Usuario', value: 'user' },
  { icon: 'science', label: 'Mock', value: 'mock' },
  { icon: 'history_edu', label: 'Seed', value: 'seed' },
  { icon: 'cloud_upload', label: 'Import', value: 'import' },
] as const;

const reviewVerifiedOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'verified', label: 'Verificadas', value: 'verified' },
  { icon: 'help', label: 'No verificadas', value: 'unverified' },
] as const;

const reviewSortOptions = [
  { icon: 'schedule', label: 'Más recientes', value: 'recent' },
  { icon: 'history', label: 'Más antiguos', value: 'old' },
] as const;

const adminLicenseOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' as const },
  ...motorcycleLicenseFilterOptions.map((opt) => ({ icon: '' as const, label: opt.label, value: opt.value })),
];

const adminRidingStyleOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: '', label: 'Ciudad', value: 'ciudad' },
  { icon: '', label: 'Viaje', value: 'viaje' },
  { icon: '', label: 'Offroad', value: 'offroad' },
  { icon: '', label: 'Deportivo', value: 'deportivo' },
  { icon: '', label: 'Pasajero', value: 'pasajero' },
  { icon: '', label: 'Diario', value: 'diario' },
] as const;

function hasActiveFilters(filters: AdminFilters) {
  return filters.reason !== defaultFilters.reason
    || filters.sort !== defaultFilters.sort
    || filters.status !== defaultFilters.status;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha pendiente' : dateFormatter.format(date);
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatPendingReviewCount(value: number) {
  return value === 1 ? '1 review nueva' : `${value} reviews nuevas`;
}

function getDisplayName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Admin MotoAtlas';
}

function buildAdminReviewGarage(reviews: readonly MotorcycleReview[]): readonly AdminReviewGarageItem[] {
  const reviewsByMotorcycle = new Map<string, MotorcycleReview[]>();

  reviews.forEach((review) => {
    const motorcycleId = review.motorcycleId.trim();

    if (!motorcycleId) {
      return;
    }

    const currentReviews = reviewsByMotorcycle.get(motorcycleId) ?? [];
    currentReviews.push(review);
    reviewsByMotorcycle.set(motorcycleId, currentReviews);
  });

  return [...reviewsByMotorcycle.entries()]
    .map(([motorcycleId, motorcycleReviews]) => {
      const sortedReviews = [...motorcycleReviews].sort((left, right) => getTimestamp(right.createdAt) - getTimestamp(left.createdAt));
      const latestReview = sortedReviews[0];
      const reviewWithMotorcycle = sortedReviews.find((review) => Boolean(review.motorcycle)) ?? latestReview;
      const catalogBike = findBikeById(motorcycleId);
      const motorcycle = reviewWithMotorcycle?.motorcycle;
      const motorcycleName = motorcycle
        ? `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year}`
        : catalogBike
          ? `${getBikeDisplayName(catalogBike)} ${catalogBike.year}`
          : motorcycleId;
      const detailHref = catalogBike ? getBikeDetailHash(catalogBike) : `#/motos/${motorcycleId}`;
      const imageSource = motorcycle
        ? {
            brand: motorcycle.brand,
            imageUrl: motorcycle.imageUrl,
            model: motorcycle.model,
            name: motorcycleName,
          }
        : catalogBike
          ? {
              brand: catalogBike.brand,
              imageUrl: catalogBike.imageUrl,
              model: catalogBike.model,
              name: motorcycleName,
            }
          : {
              name: motorcycleName,
            };
      const pendingReviewCount = motorcycleReviews.filter((review) => review.status === 'pending').length;

      return {
        detailHref,
        imageSource,
        latestReviewAt: latestReview?.createdAt ?? '',
        motorcycleId,
        motorcycleName,
        pendingReviewCount,
        reviewCount: motorcycleReviews.length,
      };
    })
    .sort((left, right) => (
      right.pendingReviewCount - left.pendingReviewCount
      || getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt)
      || left.motorcycleName.localeCompare(right.motorcycleName, 'es')
    ));
}

function getReviewSearchText(review: MotorcycleReview) {
  const { motorcycle } = review;
  const catalogBike = findBikeById(review.motorcycleId);
  return motorcycle
    ? `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year}`.toLowerCase()
    : catalogBike
      ? `${getBikeDisplayName(catalogBike)} ${catalogBike.year}`.toLowerCase()
      : review.motorcycleId.toLowerCase();
}

function getReviewSegment(review: MotorcycleReview) {
  return review.motorcycle?.segment ?? findBikeById(review.motorcycleId)?.segment ?? null;
}

function getReviewA2Status(review: MotorcycleReview) {
  const catalogBike = findBikeById(review.motorcycleId);
  if (catalogBike) return getBikeA2Status(catalogBike);
  return review.motorcycle?.license ?? null;
}

function AdminState({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <main className="account-page admin-page" aria-labelledby="admin-state-title">
      <section className="account-page__empty-state">
        <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">admin_panel_settings</span>
        <h1 id="admin-state-title">{title}</h1>
        {children}
      </section>
    </main>
  );
}

function AdminGate({ children }: AdminGateProps) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AdminState title="Cargando panel admin...">
        <p>Comprobando permisos de administración.</p>
      </AdminState>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminState title="Inicia sesión para acceder al panel admin">
        <p>Necesitás una sesión de administrador para revisar reportes.</p>
        <a className="account-page__button" href="#/login">Iniciar sesión</a>
      </AdminState>
    );
  }

  if (!isAdmin) {
    return (
      <AdminState title="No tienes permisos para acceder a esta zona.">
        <p>Esta sección está reservada para perfiles con rol admin.</p>
      </AdminState>
    );
  }

  return children;
}

export function AdminSidebar({
  active,
  activeModelsItem,
  children,
}: Readonly<{
  active: AdminSidebarActiveItem;
  activeModelsItem?: AdminQuickLinksModelsItem;
  children?: ReactNode;
}>) {
  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Navegación admin">
      <article className="account-page__notice admin-page__notice">
        <span className="material-symbols-outlined" aria-hidden="true">shield_person</span>
        <div>
          <p>Zona privada de administración.</p>
          <strong>Las acciones quedan protegidas por rol admin y RLS.</strong>
        </div>
      </article>

      <AccountQuickLinksNav
        activeAdminItem={active}
        activeAdminModelsItem={activeModelsItem}
        ariaLabel="Navegación de administración"
        includeAdmin
      />
      {children}
    </aside>
  );
}

function AdminDemoDataToggle() {
  const toggleAvailable = isDemoDataToggleAvailable();
  const [includeDemoData, setIncludeDemoData] = useState(() => canUseDemoData());

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.checked;
    setDemoDataPreference(nextValue);
    setIncludeDemoData(nextValue);
  }, []);

  if (!toggleAvailable) {
    return null;
  }

  return (
    <article className="account-page__notice admin-page__notice admin-page__demo-data-toggle">
      <span className="material-symbols-outlined" aria-hidden="true">science</span>
      <div className="admin-page__demo-data-content">
        <strong>Datos demo</strong>
        <p>Solo disponible en development/preview. En producción nunca habilita datos demo.</p>
        <label className="admin-page__demo-data-control" htmlFor="admin-demo-data-toggle">
          <input
            id="admin-demo-data-toggle"
            type="checkbox"
            checked={includeDemoData}
            onChange={handleChange}
          />
          <span>Incluir datos demo</span>
        </label>
        <small className="admin-page__demo-data-caption">El cambio se guarda en este navegador y afecta nuevas consultas o navegación.</small>
      </div>
    </article>
  );
}

// Nota: usamos `PageHero` (base normalizada del antiguo `CommunityHero`)
// para el hero en las páginas admin. El chip de admin se inyecta como
// `children` cuando se necesita.

export function AdminDashboardPage() {
  const { profile, user } = useAuth();

  return (
    <AdminGate>
      <PageHero
        className="admin-page__community-hero admin-page__hero"
        titleId="admin-dashboard-title"
        imageSrc={adminHeroImage}
        eyebrow="ADMIN STUDIO"
        title="Panel de administración"
        description="Gestiona la actividad crítica de MotoAtlas desde un espacio privado."
      >
        <div className="admin-page__hero-meta">
          <div className="admin-page__admin-chip" aria-label="Administrador activo">
            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
            {getDisplayName(profile?.displayName, user?.email)}
          </div>
        </div>
      </PageHero>

      <main className="account-page admin-page" aria-labelledby="admin-dashboard-title">
        <section className="account-page__dashboard">
          <AdminSidebar active="dashboard">
            <AdminDemoDataToggle />
          </AdminSidebar>
          <div className="account-page__main">
            <section className="admin-page__dashboard-grid" aria-labelledby="admin-dashboard-cards-title">
              <article className="account-page__card admin-page__summary-card">
                <span className="material-symbols-outlined" aria-hidden="true">flag</span>
                <h2 id="admin-dashboard-cards-title">Reportes pendientes</h2>
                <p>Revisa reportes de reviews, actualiza su estado y actúa sobre la review si corresponde.</p>
                <a className="account-page__button" href="#/admin/moderacion">Ir a moderación</a>
              </article>
              <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                <h2>Reviews pendientes</h2>
                <p>Garaje admin agrupado por moto para revisar reviews de la comunidad.</p>
                <a className="account-page__button account-page__button--glass" href="#/admin/reviews">Ir a reviews</a>
              </article>
              <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
                <span className="material-symbols-outlined" aria-hidden="true">fact_check</span>
                <h2>Solicitudes pendientes</h2>
                <p>Gestiona las solicitudes de nuevos modelos enviadas por la comunidad.</p>
                <a className="account-page__button account-page__button--glass" href="#/admin/solicitudes">Ir a solicitudes</a>
              </article>
            </section>
          </div>
        </section>
      </main>
    </AdminGate>
  );
}

function AdminModelsWorkspace({
  activeModelsItem,
  children,
  description,
  sidebarContent,
  title,
  titleId,
}: Readonly<{
  activeModelsItem: AdminQuickLinksModelsItem;
  children: ReactNode;
  description: string;
  sidebarContent?: ReactNode;
  title: string;
  titleId: string;
}>) {
  const { profile, user } = useAuth();

  return (
    <AdminGate>
      <PageHero
        className="admin-page__community-hero admin-page__hero"
        titleId={titleId}
        imageSrc={adminHeroImage}
        eyebrow="ADMIN STUDIO"
        title={title}
        description={description}
      >
        <div className="admin-page__hero-meta">
          <div className="admin-page__admin-chip" aria-label="Administrador activo">
            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
            {getDisplayName(profile?.displayName, user?.email)}
          </div>
        </div>
      </PageHero>

      <main className="account-page admin-page" aria-labelledby={titleId}>
        <section className="account-page__dashboard admin-page__layout">
          <AdminSidebar active="models" activeModelsItem={activeModelsItem}>
            {sidebarContent}
            <AdminDemoDataToggle />
          </AdminSidebar>
          <div className="account-page__main">{children}</div>
        </section>
      </main>
    </AdminGate>
  );
}

export function AdminModelsPage() {
  return (
    <AdminModelsWorkspace
      activeModelsItem="overview"
      description="Gestiona las fichas técnicas del catálogo MotoAtlas."
      title="Estudio de modelos"
      titleId="admin-models-title"
    >
      <section className="admin-page__dashboard-grid" aria-labelledby="admin-models-cards-title">
        <article className="account-page__card admin-page__summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">precision_manufacturing</span>
          <h2 id="admin-models-cards-title">Workspace futuro</h2>
          <p>Este hub reúne los accesos iniciales para preparar el alta y la edición del catálogo sin activar todavía formularios, búsqueda ni persistencia.</p>
        </article>
        <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
          <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
          <h2>Nuevo modelo</h2>
          <p>Aquí arrancará el futuro flujo de alta interna del catálogo.</p>
          <a className="account-page__button account-page__button--glass" href="#/admin/modelos/nuevo">Abrir placeholder</a>
        </article>
        <article className="account-page__card admin-page__summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
          <h2>Editar modelo existente</h2>
          <p>Busca y selecciona una moto del catálogo para abrir su ficha interna de edición.</p>
          <a className="account-page__button account-page__button--glass" href="#/admin/modelos/editar">Seleccionar modelo</a>
        </article>
      </section>
    </AdminModelsWorkspace>
  );
}

type AdminModelFormBodyProps = Readonly<{
  draft: AdminModelDraft;
  suggestedModelId: string;
  localStatus: string;
  persistedImageLocked?: boolean;
  persistedImageUrl?: string;
  onDraftFieldChange: (field: AdminModelDraftField, value: string) => void;
  onDraftCheckboxChange: (field: 'pricePending' | 'imageLocked', value: boolean) => void;
  onFeatureToggle: (feature: AdminModelFeatureKey, checked: boolean) => void;
  onDiscardChanges: () => void;
  onLocalAction: (message: string) => void;
  onPublish?: (autoUploadedUrl?: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onCreateGalleryRecord?: (input: {
    motorcycleId: string;
    url: string;
    storagePath: string;
    isPrimary: boolean;
    sortOrder: number;
    source: MotorcycleDataSource;
  }) => Promise<AdminMotorcycleGalleryImage>;
  onPersistedImageGalleryStateChange?: (isGalleryBacked: boolean) => void;
  onDeleteImage?: (objectPath: string) => Promise<void>;
  saving?: boolean;
  toolbarKicker: string;
  workspaceHeading: string;
  workspaceHeadingId: string;
  formLabel: string;
}>;

type AdminModelLibraryImage = Readonly<{
  key: string;
  url: string;
  kind: 'gallery' | 'draft' | 'persisted' | 'placeholder';
  galleryImage?: AdminMotorcycleGalleryImage;
}>;

const motorcycleImageBucketPublicPath = `/storage/v1/object/public/${MOTORCYCLE_IMAGE_BUCKET}/`;

function getConfiguredMotorcycleImageOrigin(): string | null {
  const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl, window.location.origin).origin;
  } catch {
    return null;
  }
}

function isSafeMotorcycleImageObjectPath(objectPath: string): boolean {
  if (!objectPath) {
    return false;
  }

  if (objectPath.startsWith('/')) {
    return false;
  }

  if (objectPath.includes('..')) {
    return false;
  }

  return objectPath.includes('/');
}

function getMotorcycleImageObjectPath(imageUrl: string): string | null {
  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl) return null;

  const configuredOrigin = getConfiguredMotorcycleImageOrigin();
  const isAbsoluteHttpUrl = /^https?:\/\//i.test(trimmedUrl);

  try {
    const parsedUrl = new URL(trimmedUrl, window.location.origin);

    if (!isAbsoluteHttpUrl && (!configuredOrigin || configuredOrigin !== window.location.origin)) {
      return null;
    }

    if (parsedUrl.origin !== window.location.origin && configuredOrigin && parsedUrl.origin !== configuredOrigin) {
      return null;
    }

    if (!parsedUrl.pathname.startsWith(motorcycleImageBucketPublicPath)) {
      return null;
    }

    const objectPath = decodeURIComponent(parsedUrl.pathname.slice(motorcycleImageBucketPublicPath.length));
    return isSafeMotorcycleImageObjectPath(objectPath) ? objectPath : null;
  } catch {
    if (!trimmedUrl.startsWith(motorcycleImageBucketPublicPath)) {
      return null;
    }

    const objectPath = decodeURIComponent(trimmedUrl.slice(motorcycleImageBucketPublicPath.length));
    return isSafeMotorcycleImageObjectPath(objectPath) ? objectPath : null;
  }
}

function appendGalleryImage(
  currentImages: readonly AdminMotorcycleGalleryImage[],
  nextImage: AdminMotorcycleGalleryImage,
): readonly AdminMotorcycleGalleryImage[] {
  const existingIndex = currentImages.findIndex((image) => image.id === nextImage.id);
  const images = existingIndex >= 0
    ? currentImages.map((image, index) => (index === existingIndex ? nextImage : image))
    : [...currentImages, nextImage];

  return [...images].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

function getNextGallerySortOrder(images: readonly AdminMotorcycleGalleryImage[]): number {
  if (images.length === 0) {
    return 0;
  }

  return images.reduce((maxSortOrder, image) => Math.max(maxSortOrder, image.sortOrder), 0) + 1;
}

function getGalleryImageSourceLabel(source: MotorcycleDataSource): string {
  switch (source) {
    case 'api':
      return 'Importación';
    case 'manual':
      return 'Manual';
    case 'user':
      return 'Usuario';
    case 'estimated':
      return 'Estimado';
    case 'placeholder':
      return 'Placeholder';
    default:
      return 'Manual';
  }
}

function getCurrentImageOriginLabel(imageUrl: string): string {
  const trimmedUrl = imageUrl.trim();

  if (!trimmedUrl) {
    return 'Pendiente';
  }

  if (getMotorcycleImageObjectPath(trimmedUrl)) {
    return 'Storage MotoAtlas';
  }

  if (trimmedUrl.startsWith('/images/')) {
    return 'Catálogo local';
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return 'URL externa';
  }

  return 'Borrador local';
}

function formatGalleryImageDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Fecha pendiente';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

function AdminModelFormBody({
  draft,
  suggestedModelId,
  localStatus,
  persistedImageLocked = false,
  persistedImageUrl = '',
  onDraftFieldChange,
  onDraftCheckboxChange,
  onFeatureToggle,
  onDiscardChanges,
  onLocalAction,
  onPublish,
  onUploadImage,
  onCreateGalleryRecord,
  onPersistedImageGalleryStateChange,
  onDeleteImage,
  saving,
  toolbarKicker,
  workspaceHeading,
  workspaceHeadingId,
  formLabel,
}: AdminModelFormBodyProps) {
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<readonly AdminMotorcycleGalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryBackedUploadUrls, setGalleryBackedUploadUrls] = useState<readonly string[]>([]);
  const { session, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024;

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const resetSelectedUploadState = useCallback(() => {
    setSelectedFile(null);
    setPreviewBlobUrl(null);
    setHasUploadedImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewBlobUrl(null);
      return;
    }

    if (!acceptedMimeTypes.includes(file.type)) {
      setFileError('Tipo de archivo no soportado. Usa: JPEG, PNG o WebP.');
      setSelectedFile(null);
      setPreviewBlobUrl(null);
      setHasUploadedImage(false);
      return;
    }

    if (file.size > maxFileSize) {
      setFileError('El archivo supera el límite de 5 MB.');
      setSelectedFile(null);
      setPreviewBlobUrl(null);
      setHasUploadedImage(false);
      return;
    }

    setHasUploadedImage(false);
    const blobUrl = URL.createObjectURL(file);
    setPreviewBlobUrl(blobUrl);
    setSelectedFile(file);
  }, []);

  useEffect(() => {
    const url = previewBlobUrl;
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewBlobUrl]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isImageManagerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImageManagerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageManagerOpen]);

  // Fetch gallery images when modal opens in edit mode
  useEffect(() => {
    if (!isImageManagerOpen) {
      setGalleryLoading(false);
      setGalleryError(null);
      return;
    }

    if (!draft.modelId.trim()) {
      return;
    }

    let cancelled = false;
    setGalleryLoading(true);
    setGalleryError(null);

    getAdminMotorcycleGalleryImages(draft.modelId, session?.access_token)
      .then((images) => {
        if (!cancelled) {
          setGalleryImages(images);
          setGalleryLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setGalleryError(error instanceof Error ? error.message : 'Error al cargar la galería');
          setGalleryLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [isImageManagerOpen, draft.modelId, session?.access_token]);

  const [isUploading, setIsUploading] = useState(false);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [sessionUploadedImageUrl, setSessionUploadedImageUrl] = useState<string | null>(null);
  const [isDeletingCurrentImage, setIsDeletingCurrentImage] = useState(false);

  const maybeCreateGalleryRecordForUpload = useCallback(async (publicUrl: string) => {
    const trimmedModelId = draft.modelId.trim();
    const storagePath = getMotorcycleImageObjectPath(publicUrl);

    if (!onCreateGalleryRecord || !trimmedModelId || !storagePath) {
      return { galleryImage: null, warningMessage: null };
    }

    const existingImage = galleryImages.find((image) =>
      image.url === publicUrl || (image.storagePath && image.storagePath === storagePath),
    );

    if (existingImage) {
      setGalleryBackedUploadUrls((currentUrls) => (
        currentUrls.includes(publicUrl) ? currentUrls : [...currentUrls, publicUrl]
      ));

      return { galleryImage: existingImage, warningMessage: null };
    }

    try {
      const galleryImage = await onCreateGalleryRecord({
        motorcycleId: trimmedModelId,
        url: publicUrl,
        storagePath,
        isPrimary: false,
        sortOrder: getNextGallerySortOrder(galleryImages),
        source: 'manual',
      });

      setGalleryImages((currentImages) => appendGalleryImage(currentImages, galleryImage));
      setGalleryBackedUploadUrls((currentUrls) => (
        currentUrls.includes(publicUrl) ? currentUrls : [...currentUrls, publicUrl]
      ));

      return { galleryImage, warningMessage: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error al registrar la imagen en la galería.';
      return {
        galleryImage: null,
        warningMessage: `Imagen subida correctamente, pero no se pudo registrar en la galería. ${reason}`,
      };
    }
  }, [draft.modelId, galleryImages, onCreateGalleryRecord]);

  const handleImageUpload = useCallback(async () => {
    if (!onUploadImage || !selectedFile) return;

    setIsUploading(true);
    setFileError(null);

    try {
      const publicUrl = await onUploadImage(selectedFile);
      setHasUploadedImage(true);
      setSessionUploadedImageUrl(publicUrl);
      onDraftFieldChange('imageUrl', publicUrl);
      onDraftCheckboxChange('imageLocked', true);
      const { warningMessage } = await maybeCreateGalleryRecordForUpload(publicUrl);
      onLocalAction(warningMessage ?? 'Imagen subida correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al subir la imagen.';
      setFileError(message);
    } finally {
      setIsUploading(false);
    }
  }, [
    maybeCreateGalleryRecordForUpload,
    onDraftCheckboxChange,
    onDraftFieldChange,
    onLocalAction,
    onUploadImage,
    selectedFile,
  ]);

  const handlePublishWithAutoUpload = useCallback(async () => {
    if (!onPublish) return;

    if (selectedFile && onUploadImage && !hasUploadedImage) {
      setIsUploading(true);
      setFileError(null);

      try {
        const publicUrl = await onUploadImage(selectedFile);
        setHasUploadedImage(true);
        setSessionUploadedImageUrl(publicUrl);
        onDraftFieldChange('imageUrl', publicUrl);
        onDraftCheckboxChange('imageLocked', true);
        const { warningMessage } = await maybeCreateGalleryRecordForUpload(publicUrl);
        if (warningMessage) {
          onLocalAction(warningMessage);
        }
        setIsUploading(false);
        await onPublish(publicUrl);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al subir la imagen.';
        setFileError(message);
        setIsUploading(false);
        return;
      }
    }

    await onPublish();
  }, [
    hasUploadedImage,
    maybeCreateGalleryRecordForUpload,
    onDraftCheckboxChange,
    onDraftFieldChange,
    onLocalAction,
    onPublish,
    onUploadImage,
    selectedFile,
  ]);

  const currentImageUrl = draft.imageUrl.trim();
  const persistedImageUrlTrimmed = persistedImageUrl.trim();
  const currentImageObjectPath = getMotorcycleImageObjectPath(currentImageUrl);
  const currentImageIsStorageAsset = Boolean(currentImageObjectPath);
  const persistedImageObjectPath = getMotorcycleImageObjectPath(persistedImageUrlTrimmed);

  useEffect(() => {
    if (!currentImageUrl || (persistedImageUrlTrimmed && currentImageUrl === persistedImageUrlTrimmed)) {
      setSessionUploadedImageUrl(null);
    }
  }, [currentImageUrl, persistedImageUrlTrimmed]);

  const currentImageHasGalleryRecord = Boolean(
    currentImageUrl
    && (
      galleryBackedUploadUrls.includes(currentImageUrl)
      || galleryImages.some((image) => image.url === currentImageUrl)
    ),
  );

  useEffect(() => {
    if (!onPersistedImageGalleryStateChange) {
      return;
    }

    const isGalleryBacked = Boolean(
      persistedImageUrlTrimmed
      && galleryImages.some((image) => (
        image.url === persistedImageUrlTrimmed
        || (persistedImageObjectPath && image.storagePath === persistedImageObjectPath)
      )),
    );

    onPersistedImageGalleryStateChange(isGalleryBacked);
  }, [
    galleryImages,
    onPersistedImageGalleryStateChange,
    persistedImageObjectPath,
    persistedImageUrlTrimmed,
  ]);

  const currentImageIsSessionUpload = Boolean(
    currentImageObjectPath
    && sessionUploadedImageUrl
    && currentImageUrl === sessionUploadedImageUrl,
  ) && !currentImageHasGalleryRecord;

  const handleRemoveCurrentImage = useCallback(async () => {
    const restorePersistedImage = currentImageIsSessionUpload
      && persistedImageUrlTrimmed
      && persistedImageUrlTrimmed !== currentImageUrl;
    const nextImageUrl = restorePersistedImage ? persistedImageUrlTrimmed : adminModelTechnicalPlaceholderImage;
    const nextImageLocked = restorePersistedImage ? persistedImageLocked : false;

    if (!currentImageUrl) return;

    if (!currentImageIsSessionUpload || !onDeleteImage || !currentImageObjectPath) {
      onDraftFieldChange('imageUrl', nextImageUrl);
      onDraftCheckboxChange('imageLocked', nextImageLocked);
      onLocalAction('Imagen quitada del formulario.');
      return;
    }

    setIsDeletingCurrentImage(true);
    setFileError(null);

    try {
      await onDeleteImage(currentImageObjectPath);
      onDraftFieldChange('imageUrl', nextImageUrl);
      onDraftCheckboxChange('imageLocked', nextImageLocked);
      setSessionUploadedImageUrl(null);
      resetSelectedUploadState();
      onLocalAction('Imagen eliminada correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la imagen.';
      setFileError(message);
    } finally {
      setIsDeletingCurrentImage(false);
    }
  }, [
    currentImageIsSessionUpload,
    currentImageObjectPath,
    currentImageUrl,
    onDeleteImage,
    onDraftCheckboxChange,
    onDraftFieldChange,
    onLocalAction,
    persistedImageLocked,
    persistedImageUrlTrimmed,
    resetSelectedUploadState,
  ]);

  const handleDiscardChangesClick = useCallback(() => {
    setFileError(null);
    setSessionUploadedImageUrl(null);
    setGalleryBackedUploadUrls([]);
    setIsDeletingCurrentImage(false);
    resetSelectedUploadState();
    onDiscardChanges();
  }, [onDiscardChanges, resetSelectedUploadState]);

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    if (el instanceof HTMLDetailsElement && !el.open) {
      el.open = true;
    }
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function getSectionProgress(sectionId: string): number {
    switch (sectionId) {
      case 'admin-model-section-identity': {
        const filled = [draft.brand, draft.model, draft.year, draft.description].filter(Boolean).length;
        return filled / 4;
      }
      case 'admin-model-section-classification': {
        const filled = [draft.segment, draft.license].filter(Boolean).length;
        return filled / 2;
      }
      case 'admin-model-section-engine': {
        const fields = [draft.engineType, draft.displacementCc, draft.powerHp, draft.torqueNm, draft.wetWeightKg, draft.seatHeightMm, draft.fuelTankLiters];
        return fields.filter(Boolean).length / fields.length;
      }
      case 'admin-model-section-electronics': {
        const checked = Object.values(draft.features).filter(Boolean).length;
        return checked / Object.keys(draft.features).length;
      }
      case 'admin-model-section-market': {
        return draft.priceEur ? 1 : 0;
      }
      case 'admin-model-section-image': {
        const hasImage = draft.imageUrl || selectedFile || hasUploadedImage;
        return hasImage ? 1 : 0;
      }
      case 'admin-model-section-sources': {
        const fields = [draft.officialUrl, draft.sourceNotes, draft.internalNotes];
        return fields.filter(Boolean).length / fields.length;
      }
      default:
        return 0;
    }
  }

  const sectionNavItems = [
    { id: 'admin-model-section-identity', label: 'Modelo', index: '01' },
    { id: 'admin-model-section-classification', label: 'Clasificación', index: '02' },
    { id: 'admin-model-section-engine', label: 'Motor', index: '03' },
    { id: 'admin-model-section-electronics', label: 'Electrónica', index: '04' },
    { id: 'admin-model-section-market', label: 'Mercado', index: '05' },
    { id: 'admin-model-section-image', label: 'Imagen', index: '06' },
    { id: 'admin-model-section-sources', label: 'Fuentes', index: '07' },
  ] as const;

  const imageModalBadge = [draft.brand.trim(), draft.model.trim(), draft.year.trim()]
    .filter(Boolean)
    .join(' · ');
  const currentImagePreviewUrl = currentImageUrl || '';
  const currentImageOriginLabel = getCurrentImageOriginLabel(currentImagePreviewUrl);
  const currentImageStatusLabel = currentImagePreviewUrl
    ? (draft.imageLocked ? 'Portada bloqueada' : 'Portada activa')
    : 'Sin portada';
  const currentImageSupportCopy = currentImagePreviewUrl
    ? 'Esta imagen sigue siendo la portada activa que usa el modelo en el flujo actual.'
    : 'Define una imagen principal desde URL manual o archivo local para preparar la portada del modelo.';
  const libraryImages = useMemo<readonly AdminModelLibraryImage[]>(() => {
    const entries = new Map<string, AdminModelLibraryImage>();

    const registerImage = (entry: AdminModelLibraryImage) => {
      const trimmedUrl = entry.url.trim();
      if (!trimmedUrl || entries.has(trimmedUrl)) {
        return;
      }

      entries.set(trimmedUrl, {
        ...entry,
        url: trimmedUrl,
      });
    };

    galleryImages.forEach((image) => {
      registerImage({
        key: `gallery-${image.id}`,
        url: image.url,
        kind: 'gallery',
        galleryImage: image,
      });
    });

    if (currentImagePreviewUrl) {
      registerImage({
        key: 'draft-current-image',
        url: currentImagePreviewUrl,
        kind: 'draft',
      });
    }

    if (persistedImageUrlTrimmed && persistedImageUrlTrimmed !== currentImagePreviewUrl) {
      registerImage({
        key: 'persisted-model-image',
        url: persistedImageUrlTrimmed,
        kind: 'persisted',
      });
    }

    registerImage({
      key: 'technical-placeholder-image',
      url: adminModelTechnicalPlaceholderImage,
      kind: 'placeholder',
    });

    return [...entries.values()];
  }, [currentImagePreviewUrl, galleryImages, persistedImageUrlTrimmed]);

  const handleUseLibraryImageAsCover = useCallback((nextImageUrl: string) => {
    onDraftFieldChange('imageUrl', nextImageUrl);
    setFileError(null);
    setSelectedFile(null);
    setPreviewBlobUrl(null);
    setHasUploadedImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onDraftFieldChange]);

  return (
    <section className="admin-page__model-studio" aria-labelledby={workspaceHeadingId}>
      <header className="admin-page__model-toolbar">
          <span className="admin-page__model-toolbar-kicker">{toolbarKicker}</span>
          <h2 id={workspaceHeadingId}>{workspaceHeading}</h2>
      </header>

      <AdminModelHeroPreview draft={draft} />

      <nav className="admin-page__section-radar" aria-label="Secciones del formulario">
        <ul className="admin-page__section-radar-list">
          {sectionNavItems.map((item) => {
            const progress = getSectionProgress(item.id);
            const progressPct = Math.round(progress * 100);
            return (
              <li key={item.id} className="admin-page__section-radar-item">
                <button
                  type="button"
                  className="admin-page__section-radar-btn"
                  aria-label={`${item.label}, ${progressPct}% completado`}
                  onClick={() => scrollToSection(item.id)}
                >
                  <span className="admin-page__section-radar-index" aria-hidden="true">{item.index}</span>
                  <span className="admin-page__section-radar-track" aria-hidden="true">
                    <span className="admin-page__section-radar-fill" style={{ height: `${progressPct}%` }} />
                  </span>
                  <span className="admin-page__section-radar-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <form className="admin-page__model-form" aria-label={formLabel} onSubmit={(event) => event.preventDefault()}>
        <AdminModelSection
          id="admin-model-section-identity"
          technicalTitle="01. MODELO"
          description="Base de naming y copy inicial para alimentar el preview local antes de decidir persistencia o validación real."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field" htmlFor="admin-model-brand">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">branding_watermark</span>
                Marca
              </span>
              <input id="admin-model-brand" aria-label="Marca" type="text" value={draft.brand} onChange={(event) => onDraftFieldChange('brand', event.target.value)} placeholder="BMW" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-name">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">two_wheeler</span>
                Modelo
              </span>
              <input id="admin-model-name" aria-label="Modelo" type="text" value={draft.model} onChange={(event) => onDraftFieldChange('model', event.target.value)} placeholder="F 900 GS" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-year">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
                Año
              </span>
              <input id="admin-model-year" aria-label="Año" type="number" min="1900" max="2100" value={draft.year} onChange={(event) => onDraftFieldChange('year', event.target.value)} placeholder="2026" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-id">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">tag</span>
                ID sugerido
                <AdminModelInfoTooltip
                  ariaLabel="Más información sobre ID sugerido"
                  description={`Sugerencia automática: ${suggestedModelId || 'marca-modelo-2026'}`}
                />
              </span>
              <input id="admin-model-id" aria-label="ID sugerido" type="text" value={draft.modelId} onChange={(event) => onDraftFieldChange('modelId', event.target.value)} placeholder={suggestedModelId || 'marca-modelo-2026'} />
            </label>

            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-description">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">article</span>
                Descripción
              </span>
              <textarea id="admin-model-description" aria-label="Descripción" rows={4} value={draft.description} onChange={(event) => onDraftFieldChange('description', event.target.value)} placeholder="Resumen técnico/editorial del modelo para el hero público." />
            </label>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-classification"
          technicalTitle="02. CLASIFICACION"
          description="Define la taxonomía base y el carnet objetivo antes de empezar a cargar números o copy técnico."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field" htmlFor="admin-model-segment">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">category</span>
                Segmento
              </span>
              <select id="admin-model-segment" aria-label="Segmento" value={draft.segment} onChange={(event) => onDraftFieldChange('segment', event.target.value)}>
                <option value="">Seleccionar segmento</option>
                {BIKE_SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>{segmentLabels[segment]}</option>
                ))}
              </select>
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-license">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('license')}</span>
                Carnet
              </span>
              <select id="admin-model-license" aria-label="Carnet" value={draft.license} onChange={(event) => onDraftFieldChange('license', event.target.value)}>
                <option value="">Seleccionar carnet</option>
                {BIKE_LICENSES.map((license) => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </label>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-engine"
          technicalTitle="03. MOTOR & RENDIMIENTO"
          description="Bloque local de specs principales para alimentar el preview tipo ficha y preparar el contrato técnico futuro."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field" htmlFor="admin-model-engine-type">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">memory</span>
                Tipo de motor
              </span>
              <select id="admin-model-engine-type" aria-label="Tipo de motor" value={draft.engineType} onChange={(event) => onDraftFieldChange('engineType', event.target.value)}>
                <option value="">Seleccionar arquitectura</option>
                {adminModelEngineTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-displacement">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('engine')}</span>
                Cilindrada (cc)
              </span>
              <input id="admin-model-displacement" aria-label="Cilindrada (cc)" type="number" min="0" value={draft.displacementCc} onChange={(event) => onDraftFieldChange('displacementCc', event.target.value)} placeholder="895" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-power">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('power')}</span>
                Potencia (hp)
              </span>
              <input id="admin-model-power" aria-label="Potencia (hp)" type="number" min="0" step="0.1" value={draft.powerHp} onChange={(event) => onDraftFieldChange('powerHp', event.target.value)} placeholder="105" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-torque">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('torque')}</span>
                Torque (nm)
              </span>
              <input id="admin-model-torque" aria-label="Torque (nm)" type="number" min="0" step="0.1" value={draft.torqueNm} onChange={(event) => onDraftFieldChange('torqueNm', event.target.value)} placeholder="93" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-weight">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('weight')}</span>
                Peso (kg)
              </span>
              <input id="admin-model-weight" aria-label="Peso (kg)" type="number" min="0" step="0.1" value={draft.wetWeightKg} onChange={(event) => onDraftFieldChange('wetWeightKg', event.target.value)} placeholder="219" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-seat-height">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('seatHeight')}</span>
                Altura asiento (mm)
              </span>
              <input id="admin-model-seat-height" aria-label="Altura asiento (mm)" type="number" min="0" value={draft.seatHeightMm} onChange={(event) => onDraftFieldChange('seatHeightMm', event.target.value)} placeholder="870" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-fuel-tank">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('fuelTank')}</span>
                Depósito (l)
              </span>
              <input id="admin-model-fuel-tank" aria-label="Depósito (l)" type="number" min="0" step="0.1" value={draft.fuelTankLiters} onChange={(event) => onDraftFieldChange('fuelTankLiters', event.target.value)} placeholder="14.5" />
            </label>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-electronics"
          technicalTitle="04. ELECTRONICA & EQUIPAMIENTO"
          description="Selección local de features típicas para revisar el layout de toggles antes de mapearlas al backend real."
        >
          <div className="admin-page__model-checkbox-grid">
            {adminModelFeatureOptions.map((feature) => (
              <label className="admin-page__model-checkbox" key={feature.key}>
                <input type="checkbox" checked={draft.features[feature.key]} onChange={(event) => onFeatureToggle(feature.key, event.target.checked)} />
                <span>{feature.label}</span>
              </label>
            ))}
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-market"
          technicalTitle="05. PRECIO"
          description="Campos locales para validar copy, fallback de precio pendiente y decisiones de presentación antes de tocar persistencia."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field" htmlFor="admin-model-price">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('price')}</span>
                Precio (€)
              </span>
              <input id="admin-model-price" type="number" min="0" value={draft.priceEur} onChange={(event) => onDraftFieldChange('priceEur', event.target.value)} placeholder="13990" />
            </label>

            <label className="admin-page__model-checkbox admin-page__model-checkbox--inline">
              <input type="checkbox" checked={draft.pricePending} onChange={(event) => onDraftCheckboxChange('pricePending', event.target.checked)} />
              <span>Marcar precio como pendiente</span>
            </label>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-image"
          technicalTitle="06. IMAGEN"
          description="Gestioná la imagen actual del modelo y prepará un reemplazo antes de publicar."
        >
          <div className="admin-page__model-field-grid">
            {currentImageUrl ? (
              <section className="admin-page__model-image-preview admin-page__model-field--full" aria-label="Imagen actual del modelo">
                <div className="admin-page__model-image-preview-copy">
                  <strong>Imagen actual</strong>
                  <p>
                    {currentImageIsSessionUpload
                      ? 'Imagen subida en este borrador. Puedes eliminarla o reemplazarla antes de publicar.'
                      : currentImageIsStorageAsset
                        ? 'Imagen guardada en el modelo. Puedes quitarla del formulario o reemplazarla antes de publicar.'
                        : 'Imagen activa en el formulario. Puedes reemplazarla o quitarla antes de publicar.'}
                  </p>
                </div>
                <div className="admin-page__model-image-preview-media">
                  <img src={currentImageUrl} alt="Imagen actual del modelo" />
                  <button
                    type="button"
                    className="admin-page__model-image-preview-delete"
                    aria-label={currentImageIsSessionUpload ? 'Eliminar imagen actual' : 'Quitar imagen del formulario'}
                    disabled={isDeletingCurrentImage}
                    onClick={handleRemoveCurrentImage}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {currentImageIsSessionUpload ? 'delete' : 'close'}
                    </span>
                    {isDeletingCurrentImage
                      ? 'Eliminando...'
                      : currentImageIsSessionUpload
                        ? 'Eliminar'
                        : 'Quitar'}
                  </button>
                </div>
              </section>
            ) : (
              <section className="admin-page__model-image-preview admin-page__model-image-preview--empty admin-page__model-field--full" aria-label="Imagen actual del modelo">
                <div className="admin-page__model-image-preview-copy">
                  <strong>Imagen no disponible</strong>
                  <p>Elige una URL o sube un archivo para continuar con el formulario.</p>
                </div>
              </section>
            )}
            <div className="admin-model__image-manager-trigger admin-page__model-field--full">
              <button
                type="button"
                className="account-page__button account-page__button--glass admin-page__model-action-button admin-model__image-manager-button"
                onClick={() => setIsImageManagerOpen(true)}
              >
                Gestionar imágenes
              </button>
            </div>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-sources"
          technicalTitle="07. FUENTES & NOTAS"
          description="Campos de referencia local para preparar fuentes, URL oficial y notas editoriales antes de definir servicios reales."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-official-url">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">link</span>
                URL oficial
              </span>
              <input id="admin-model-official-url" type="url" value={draft.officialUrl} onChange={(event) => onDraftFieldChange('officialUrl', event.target.value)} placeholder="https://www.marca.com/modelo" />
            </label>

            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-source-notes">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">source_environment</span>
                Notas de fuente
              </span>
              <textarea id="admin-model-source-notes" rows={3} value={draft.sourceNotes} onChange={(event) => onDraftFieldChange('sourceNotes', event.target.value)} placeholder="API, ficha oficial, manual interno, revisión editorial..." />
            </label>

            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-internal-notes">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">note_stack</span>
                Notas internas
              </span>
              <textarea id="admin-model-internal-notes" rows={4} value={draft.internalNotes} onChange={(event) => onDraftFieldChange('internalNotes', event.target.value)} placeholder="Pendientes de copy, dudas de specs, checks para QA visual..." />
            </label>
          </div>
        </AdminModelSection>

        <footer className="admin-page__model-actions" aria-label="Acciones del borrador">
          <button type="button" className="account-page__button account-page__button--glass admin-page__model-action-button admin-page__model-action-button--discard" onClick={handleDiscardChangesClick}>
            <span className="material-symbols-outlined" aria-hidden="true">undo</span>
            Descartar cambios
          </button>
          <button type="button" className="account-page__button account-page__button--glass admin-page__model-action-button" onClick={() => onLocalAction('Borrador local actualizado.')}>
            <span className="material-symbols-outlined" aria-hidden="true">save</span>
            Guardar borrador
          </button>
          <button type="button" className="account-page__button account-page__button--glass admin-page__model-action-button" onClick={() => onLocalAction('Vista previa actualizada.')}>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            Vista previa
          </button>
          <button type="button" className="account-page__button admin-page__model-action-button admin-page__model-action-button--primary" disabled={saving || isUploading} onClick={handlePublishWithAutoUpload}>
            <span className="material-symbols-outlined" aria-hidden="true">rocket_launch</span>
            {isUploading ? 'Subiendo imagen previa...' : 'Publicar modelo'}
          </button>
        </footer>
      </form>
      
      {localStatus ? (
        <p className="admin-page__model-status" role="status" aria-live="polite">{localStatus}</p>
      ) : null}

      {isImageManagerOpen && (
        <div className="admin-model__image-modal-backdrop">
          <div className="admin-model__image-modal" role="dialog" aria-modal="true" aria-labelledby="image-manager-title">
            <header className="admin-model__image-modal-header">
              <div className="admin-model__image-modal-title-group">
                <span className="admin-model__image-modal-kicker">ADMIN IMAGE STUDIO</span>
                <h2 id="image-manager-title">Galería de imágenes</h2>
                {imageModalBadge ? (
                  <span className="admin-model__image-modal-badge">{imageModalBadge}</span>
                ) : null}
                <p className="admin-model__image-modal-subtitle">Visualiza la galería de imágenes y gestiona la imagen principal del modelo.</p>
              </div>
              <button
                type="button"
                className="admin-model__image-modal-close"
                aria-label="Cerrar gestor de imágenes"
                onClick={() => setIsImageManagerOpen(false)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </header>
            <div className="admin-model__image-modal-body">
              <div className="admin-model__image-modal-workspace">
                <section className="admin-model__image-modal-primary-panel" aria-label="Portada activa del modelo">
                  <header className="admin-model__image-modal-primary-header">
                      <p className="admin-model__image-modal-section-label">{currentImageStatusLabel}</p>
                      <h3>Imagen principal del modelo</h3>
                  </header>

                  {currentImagePreviewUrl ? (
                    <div className="admin-model__image-modal-primary-card">
                      <div className="admin-model__image-modal-primary-media">
                        <img src={currentImagePreviewUrl} alt="Portada activa del modelo" loading="lazy" />
                        <div className="admin-model__image-modal-primary-media-overlay">
                          <span className="admin-model__image-modal-primary-chip">
                            <span className="material-symbols-outlined" aria-hidden="true">imagesmode</span>
                            {currentImageOriginLabel}
                          </span>
                          {draft.imageLocked ? (
                            <span className="admin-model__image-modal-primary-chip admin-model__image-modal-primary-chip--locked">
                              <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                              Bloqueada
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="admin-model__image-modal-primary-copy">
                        <p>{currentImageSupportCopy}</p>
                        <dl className="admin-model__image-modal-primary-meta">
                          <div>
                            <dt>Origen</dt>
                            <dd>{currentImageOriginLabel}</dd>
                          </div>
                          <div>
                            <dt>Estado</dt>
                            <dd>{draft.imageLocked ? 'Curada manualmente' : 'Editable'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-model__image-modal-primary-card admin-model__image-modal-primary-card--empty">
                      <span className="material-symbols-outlined" aria-hidden="true">image_search</span>
                      <div>
                        <strong>Sin portada definida</strong>
                        <p>{currentImageSupportCopy}</p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="admin-model__image-modal-library" aria-label="Biblioteca visual del modelo">
                  <header className="admin-model__image-modal-gallery-header">
                    <div className="admin-model__image-modal-gallery-title-group">
                      <p className="admin-model__image-modal-section-label">Biblioteca visual</p>
                      <p className="admin-model__image-modal-helper">Selecciona una imagen disponible para usarla como portada actual. La metadata avanzada de galería seguirá gestionándose en fases posteriores.</p>
                    </div>
                    <span className="admin-model__image-modal-gallery-count">{libraryImages.length} opciones</span>
                  </header>

                  {!draft.modelId.trim() ? (
                    <div className="admin-model__image-modal-placeholder">
                      <span className="material-symbols-outlined" aria-hidden="true">imagesmode</span>
                      <div>
                        <strong>Galería persistente pendiente</strong>
                        <p>Cuando el modelo exista se cargarán aquí sus imágenes persistidas. Mientras tanto, puedes preparar la portada con la biblioteca disponible.</p>
                      </div>
                    </div>
                  ) : null}

                  {galleryLoading ? (
                    <div className="admin-model__image-modal-loading" role="status" aria-live="polite">
                      <span className="material-symbols-outlined" aria-hidden="true">sync</span>
                      <div>
                        <strong>Cargando galería</strong>
                        <p>Cargando galería de imágenes...</p>
                      </div>
                    </div>
                  ) : null}

                  {galleryError ? (
                    <div className="admin-model__image-modal-error" role="alert">
                      <span className="material-symbols-outlined" aria-hidden="true">warning</span>
                      <div>
                        <strong>No se pudo cargar la galería</strong>
                        <p>{galleryError}</p>
                      </div>
                    </div>
                  ) : null}

                  {libraryImages.length === 0 ? (
                    <div className="admin-model__image-modal-empty">
                      <span className="material-symbols-outlined" aria-hidden="true">photo_library</span>
                      <div>
                        <strong>Sin imágenes disponibles</strong>
                        <p>Aún no hay recursos visuales listos para reutilizar como portada.</p>
                      </div>
                    </div>
                  ) : (
                    <section className="admin-model__image-modal-gallery" aria-label="Galería de imágenes del modelo">
                      <div className="admin-model__image-modal-gallery-grid">
                        {libraryImages.map((image) => {
                          const galleryImage = image.galleryImage;
                          const isCurrentCover = currentImagePreviewUrl === image.url;
                          const isOriginalPersisted = persistedImageUrlTrimmed === image.url;
                          const isPlaceholderOption = adminModelTechnicalPlaceholderImage === image.url;
                          const isGalleryRecord = Boolean(galleryImage);
                          const cardTitle = galleryImage?.altText?.trim()
                            || (isPlaceholderOption
                              ? 'Placeholder técnico MotoAtlas'
                              : image.kind === 'persisted'
                                ? 'Imagen original del modelo'
                                : image.kind === 'draft'
                                  ? 'Imagen actual del borrador'
                                  : 'Imagen disponible');
                          const cardMeta = [
                            isGalleryRecord ? 'Galería' : null,
                            isPlaceholderOption ? 'Placeholder técnico' : null,
                            !isGalleryRecord && image.kind === 'draft' ? 'Imagen actual' : null,
                            isOriginalPersisted ? 'Imagen original' : null,
                            galleryImage ? getGalleryImageSourceLabel(galleryImage.source) : getCurrentImageOriginLabel(image.url),
                            galleryImage ? `Orden ${galleryImage.sortOrder}` : null,
                          ].filter(Boolean) as string[];
                          const actionLabel = isCurrentCover ? `Portada actual: ${cardTitle}` : `Usar como portada: ${cardTitle}`;

                          return (
                            <article key={image.key} className="admin-model__image-modal-gallery-card" aria-label={cardTitle}>
                              <div className="admin-model__image-modal-gallery-card-media">
                                <img src={image.url} alt={cardTitle} loading="lazy" />
                                <div className="admin-model__image-modal-gallery-card-overlays">
                                  <div className="admin-model__image-modal-gallery-card-badges">
                                    {isCurrentCover ? (
                                      <span className="admin-model__image-modal-gallery-card-badge admin-model__image-modal-gallery-card-badge--current">
                                        <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
                                        Portada actual
                                      </span>
                                    ) : null}
                                    {galleryImage?.isPrimary ? (
                                      <span className="admin-model__image-modal-gallery-card-badge admin-model__image-modal-gallery-card-badge--primary">
                                        <span className="material-symbols-outlined" aria-hidden="true">star</span>
                                        Principal
                                      </span>
                                    ) : null}
                                    {isOriginalPersisted && !isCurrentCover ? (
                                      <span className="admin-model__image-modal-gallery-card-badge">
                                        <span className="material-symbols-outlined" aria-hidden="true">history</span>
                                        Imagen original
                                      </span>
                                    ) : null}
                                    {isPlaceholderOption ? (
                                      <span className="admin-model__image-modal-gallery-card-badge">
                                        <span className="material-symbols-outlined" aria-hidden="true">construction</span>
                                        Placeholder técnico
                                      </span>
                                    ) : null}
                                  </div>
                                  {galleryImage ? (
                                    <span className="admin-model__image-modal-gallery-card-order">#{galleryImage.sortOrder}</span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="admin-model__image-modal-gallery-card-info">
                                <h4>{cardTitle}</h4>
                                <div className="admin-model__image-modal-gallery-card-meta">
                                  {cardMeta.map((item) => <span key={`${image.key}-${item}`}>{item}</span>)}
                                  {galleryImage ? <span>{formatGalleryImageDate(galleryImage.createdAt)}</span> : null}
                                  {galleryImage?.storagePath ? <span title={galleryImage.storagePath}>Storage</span> : null}
                                </div>
                                {galleryImage?.storagePath ? (
                                  <p className="admin-model__image-modal-gallery-card-path" title={galleryImage.storagePath}>{galleryImage.storagePath}</p>
                                ) : null}
                                <button
                                  type="button"
                                  className="account-page__button account-page__button--glass admin-model__image-modal-gallery-card-action"
                                  aria-label={actionLabel}
                                  disabled={isCurrentCover}
                                  onClick={() => handleUseLibraryImageAsCover(image.url)}
                                >
                                  <span className="material-symbols-outlined" aria-hidden="true">
                                    {isCurrentCover ? 'check_circle' : 'photo_library'}
                                  </span>
                                  {isCurrentCover ? 'Portada actual' : 'Usar como portada'}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </section>

                <div className="admin-model__image-modal-controls">
                  <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--selector" aria-labelledby="image-manager-source-title">
                    <div className="admin-model__image-modal-control-header">
                      <p id="image-manager-source-title" className="admin-model__image-modal-control-title">Fuente principal</p>
                      <p className="admin-model__image-modal-helper">Elige si vas a curar la portada con una URL manual o con un archivo local.</p>
                    </div>
                    <div className="admin-page__model-field admin-page__model-field--full" role="group" aria-label="Modo de selección de imagen">
                      <div className="container-actions admin-model__image-modal-mode-switch" role="radiogroup" aria-label="Modo de selección de imagen">
                        <button className="account-page__button account-page__button--glass admin-page__model-action-button" type="button" role="radio" aria-checked={imageMode === 'url'} onClick={() => setImageMode('url')}>
                          URL manual
                        </button>
                        <button className="account-page__button account-page__button--glass admin-page__model-action-button" type="button" role="radio" aria-checked={imageMode === 'upload'} onClick={() => setImageMode('upload')}>
                          Subir archivo
                        </button>
                      </div>
                    </div>
                    {fileError ? (
                      <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--alert">
                        <p role="alert" className="admin-page__model-field admin-page__model-field--full">{fileError}</p>
                      </section>
                    ) : null}

                    {imageMode === 'url' ? (
                      <>
                        <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--url" aria-labelledby="image-manager-url-title">
                          <div className="admin-model__image-modal-control-header">
                            <p id="image-manager-url-title" className="admin-model__image-modal-control-title">URL principal</p>
                            <p className="admin-model__image-modal-helper">Usa una ruta curada del catálogo o una URL externa válida para preparar la portada.</p>
                          </div>
                          <div className="admin-page__model-field-grid">
                            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-image-url">
                              <span className="admin-page__model-label">
                                <span className="material-symbols-outlined" aria-hidden="true">link_2</span>
                                Image URL
                              </span>
                              <input id="admin-model-image-url" aria-label="Image URL" type="url" value={draft.imageUrl} onChange={(event) => onDraftFieldChange('imageUrl', event.target.value)} placeholder="https://.../motorcycle.webp" />
                            </label>
                          </div>
                        </section>

                        <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--lock" aria-labelledby="image-manager-lock-title">
                          <div className="admin-model__image-modal-control-header">
                            <p id="image-manager-lock-title" className="admin-model__image-modal-control-title">Bloqueo y curación</p>
                            <p className="admin-model__image-modal-helper">Fija esta portada manual cuando no quieras que futuras sincronizaciones la sustituyan.</p>
                          </div>
                          <label className="admin-page__model-checkbox admin-page__model-checkbox--inline">
                            <input type="checkbox" checked={draft.imageLocked} onChange={(event) => onDraftCheckboxChange('imageLocked', event.target.checked)} />
                            <span className="content">
                              Imagen bloqueada / curada
                              <AdminModelInfoTooltip
                                ariaLabel="Más información sobre imagen bloqueada"
                                description="Evita que futuras sincronizaciones automáticas sustituyan esta imagen curada manualmente."
                              />
                            </span>
                          </label>
                        </section>
                      </>
                    ) : (
                      <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--upload" aria-labelledby="image-manager-upload-title">
                        <div className="admin-model__image-modal-control-header">
                          <p id="image-manager-upload-title" className="admin-model__image-modal-control-title">Carga local</p>
                          <p className="admin-model__image-modal-helper">Selecciona un archivo JPG, PNG o WebP para previsualizarlo y subirlo cuando el borrador esté listo.</p>
                        </div>
                        <div className="admin-page__model-field-grid">
                          <div className="admin-page__model-field admin-page__model-field--full">
                            <span className="admin-page__model-label">
                              <span className="material-symbols-outlined" aria-hidden="true">upload</span>
                              Seleccionar imagen del modelo
                            </span>
                            <div className="admin-page__image-file-control">
                              <input ref={fileInputRef} id="admin-model-image-file" type="file" className="admin-page__image-file-input" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar imagen del modelo" onChange={handleFileSelect} />
                              <label htmlFor="admin-model-image-file" className="admin-page__image-file-trigger">
                                <span className="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
                                Seleccionar imagen
                              </label>
                              <span className="admin-page__image-file-name" aria-live="polite">
                                {selectedFile ? `${selectedFile.name} - ${formatFileSize(selectedFile.size)}` : 'Ningún archivo seleccionado'}
                              </span>
                            </div>
                          </div>

                          {previewBlobUrl && selectedFile ? (
                            <div className="admin-page__model-image-preview admin-page__model-field--full">
                              <div className="admin-page__model-image-preview-media admin-page__model-image-preview-media--candidate">
                                <img src={previewBlobUrl} alt="Previsualización local del archivo seleccionado" />
                              </div>
                              <div className="admin-page__model-image-preview-copy">
                                <strong>Archivo seleccionado</strong>
                                <p>{selectedFile.name} — {formatFileSize(selectedFile.size)}</p>
                              </div>
                              <button type="button" className="account-page__button account-page__button--glass admin-page__model-action-button" disabled={isUploading || !onUploadImage} onClick={handleImageUpload}>
                                <span className="material-symbols-outlined" aria-hidden="true">cloud_upload</span>
                                {isUploading ? 'Subiendo imagen...' : 'Subir imagen'}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </section>
                    )}
                  </section>

                  <p className="admin-model__image-modal-note">La biblioteca permite reutilizar imágenes como portada. La gestión avanzada de galería llegará en una fase posterior.</p>
                </div>
              </div>
            </div>
            <footer className="admin-model__image-modal-footer">
              <button
                type="button"
                className="account-page__button account-page__button--glass"
                onClick={() => setIsImageManagerOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="account-page__button"
                onClick={() => setIsImageManagerOpen(false)}
              >
                Guardar cambios
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}

type OnMotorcyclesChange = (bike: Bike) => void;

export function AdminNewModelPage({ onMotorcyclesChange: onMotorcyclesChangeProp }: Readonly<{ onMotorcyclesChange?: OnMotorcyclesChange }> = {}) {
  const [draft, setDraft] = useState<AdminModelDraft>(emptyAdminModelDraft);
  const [localStatus, setLocalStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [sessionUploadedStorageImageUrl, setSessionUploadedStorageImageUrl] = useState<string | null>(null);
  const [hasCreatedGalleryRecordForSessionUpload, setHasCreatedGalleryRecordForSessionUpload] = useState(false);

  const { session, user } = useAuth();

  const suggestedModelId = useMemo(() => buildSuggestedModelId(draft), [draft]);

  const handleDraftFieldChange = useCallback((field: AdminModelDraftField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleDraftCheckboxChange = useCallback((field: 'pricePending' | 'imageLocked', value: boolean) => {
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleFeatureToggle = useCallback((feature: AdminModelFeatureKey, checked: boolean) => {
    setDraft((current) => ({
      ...current,
      features: {
        ...current.features,
        [feature]: checked,
      },
    }));
  }, []);

  const handleLocalAction = useCallback((message: string) => {
    setLocalStatus(message);
    if (message !== 'Publicación pendiente de persistencia.') {
      setPublishError('');
    }
  }, []);

  const handleDiscardChanges = useCallback(() => {
    setDraft(emptyAdminModelDraft);
    setLocalStatus('Cambios descartados.');
    setPublishError('');
    setSessionUploadedStorageImageUrl(null);
    setHasCreatedGalleryRecordForSessionUpload(false);
  }, []);

  const handlePublish = useCallback(async (autoUploadedUrl?: string) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      setPublishError('No hay sesión activa para publicar.');
      return;
    }

    const effectiveDraft = autoUploadedUrl
      ? { ...draft, imageUrl: autoUploadedUrl, imageLocked: true }
      : draft;

    const validation = validateAdminModelDraftForPublish(effectiveDraft, { mode: 'create', modelId: suggestedModelId });
    if (!validation.isValid) {
      setPublishError(validation.message);
      setLocalStatus(validation.message);
      return;
    }

    setSaving(true);
    setPublishError('');
    setLocalStatus('Publicando modelo...');

    try {
      const payload = draftToCreatePayload(effectiveDraft, suggestedModelId);
      const createdBike = await createAdminMotorcycle(payload, accessToken);
      let publishStatus = 'Modelo publicado correctamente.';
      const currentImageUrl = effectiveDraft.imageUrl.trim();
      const uploadedStorageObjectPath = sessionUploadedStorageImageUrl
        && currentImageUrl === sessionUploadedStorageImageUrl
        && !hasCreatedGalleryRecordForSessionUpload
        ? getMotorcycleImageObjectPath(sessionUploadedStorageImageUrl)
        : null;

      if (uploadedStorageObjectPath) {
        try {
          await createAdminMotorcycleGalleryImage({
            motorcycleId: createdBike.id,
            url: currentImageUrl,
            storagePath: uploadedStorageObjectPath,
            isPrimary: false,
            sortOrder: 0,
            source: 'manual',
            createdBy: user?.id ?? null,
          }, accessToken);
          setHasCreatedGalleryRecordForSessionUpload(true);
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'No se pudo registrar la imagen en la galería.';
          publishStatus = `Modelo publicado correctamente. La imagen se subió, pero no se pudo registrar en la galería. ${reason}`;
        }
      }

      setLocalStatus(publishStatus);
      onMotorcyclesChangeProp?.(createdBike);
      window.location.hash = `#/motos/${createdBike.id}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al publicar el modelo.';
      setPublishError(message);
      setLocalStatus(message);
    } finally {
      setSaving(false);
    }
  }, [
    draft,
    hasCreatedGalleryRecordForSessionUpload,
    onMotorcyclesChangeProp,
    sessionUploadedStorageImageUrl,
    session?.access_token,
    suggestedModelId,
    user?.id,
  ]);

  const handleUploadImage = useCallback(async (file: File) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para subir la imagen.');
    }

    const resolvedId = draft.modelId.trim() || suggestedModelId;

    if (!resolvedId) {
      throw new Error('El ID del modelo es obligatorio para subir la imagen.');
    }

    const publicUrl = await uploadMotorcycleImage(file, resolvedId, accessToken);
    setSessionUploadedStorageImageUrl(publicUrl);
    setHasCreatedGalleryRecordForSessionUpload(false);
    return publicUrl;
  }, [draft.modelId, suggestedModelId, session?.access_token]);

  const handleDeleteImage = useCallback(async (objectPath: string) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para eliminar la imagen.');
    }

    await deleteMotorcycleImage(objectPath, accessToken);
  }, [session?.access_token]);

  return (
    <AdminModelsWorkspace
      activeModelsItem="new"
      description="Crea, revisa y completa fichas técnicas del catálogo MotoAtlas."
      title="Nuevo modelo"
      titleId="admin-models-new-title"
    >
      {publishError ? <p className="admin-page__model-status admin-page__model-status--error" role="alert">{publishError}</p> : null}
      <AdminModelFormBody
        draft={draft}
        suggestedModelId={suggestedModelId}
        localStatus={localStatus}
        onDraftFieldChange={handleDraftFieldChange}
        onDraftCheckboxChange={handleDraftCheckboxChange}
        onFeatureToggle={handleFeatureToggle}
        onDiscardChanges={handleDiscardChanges}
        onLocalAction={handleLocalAction}
        onPublish={handlePublish}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
        saving={saving}
        toolbarKicker="Borrador local"
        workspaceHeading="Workspace de creación"
        workspaceHeadingId="admin-models-new-workspace-title"
        formLabel="Formulario de nuevo modelo"
        />
    </AdminModelsWorkspace>
  );
}

type RangeFilterPreset = {
  key: string;
  label: string;
  min: string;
  max: string;
};

const pricePresets: RangeFilterPreset[] = [
  { key: 'price-1', label: 'Hasta 5.000 €', min: '', max: '5000' },
  { key: 'price-2', label: '5.000 - 10.000 €', min: '5000', max: '10000' },
  { key: 'price-3', label: '10.000 - 15.000 €', min: '10000', max: '15000' },
  { key: 'price-4', label: '15.000 - 20.000 €', min: '15000', max: '20000' },
  { key: 'price-5', label: 'Más de 20.000 €', min: '20000', max: '' },
];

const powerPresets: RangeFilterPreset[] = [
  { key: 'power-1', label: 'Hasta 47 CV', min: '', max: '47' },
  { key: 'power-2', label: '48 - 75 CV', min: '48', max: '75' },
  { key: 'power-3', label: '76 - 115 CV', min: '76', max: '115' },
  { key: 'power-4', label: '116+ CV', min: '116', max: '' },
];

const weightPresets: RangeFilterPreset[] = [
  { key: 'weight-1', label: 'Menos de 180 kg', min: '', max: '180' },
  { key: 'weight-2', label: '180 - 210 kg', min: '180', max: '210' },
  { key: 'weight-3', label: '211 - 240 kg', min: '211', max: '240' },
  { key: 'weight-4', label: 'Más de 240 kg', min: '240', max: '' },
];

const seatHeightPresets: RangeFilterPreset[] = [
  { key: 'seat-1', label: 'Menos de 800 mm', min: '', max: '800' },
  { key: 'seat-2', label: '800 - 850 mm', min: '800', max: '850' },
  { key: 'seat-3', label: '851 - 900 mm', min: '851', max: '900' },
  { key: 'seat-4', label: 'Más de 900 mm', min: '900', max: '' },
];

const featureLabels: Record<keyof BikeFeatures, string> = {
  absCornering: 'ABS curva',
  cruiseControl: 'Control crucero',
  heatedGrips: 'Puños calefactables',
  quickshifter: 'Quickshifter',
  ridingModes: 'Modos conducción',
  tractionControl: 'Control tracción',
  tubelessWheels: 'Llantas tubeless',
};

const useLabels: Record<keyof BikeUseScores, string> = {
  beginner: 'Principiante',
  city: 'Ciudad',
  funFactor: 'Diversión',
  offroad: 'Off-road',
  passenger: 'Pasajero',
  sport: 'Deportivo',
  touring: 'Viaje',
};

const adminModelsEditSegmentIcon: Partial<Record<BikeSegment, string>> = {
  naked: 'bolt',
  sport: 'speed',
  'sport-touring': 'route',
  trail: 'terrain',
  custom: 'construction',
  scooter: 'two_wheeler',
  touring: 'explore',
};

type AdminModelsEditFilters = {
  searchText: string;
  selectedBrands: string[];
  selectedSegments: BikeSegment[];
  selectedLicenses: BikeLicense[];
  minPrice: string;
  maxPrice: string;
  minPower: string;
  maxPower: string;
  minWeight: string;
  maxWeight: string;
  minSeatHeight: string;
  maxSeatHeight: string;
  equipment: (keyof BikeFeatures)[];
  recommendedUses: (keyof BikeUseScores)[];
  dataSources: MotorcycleDataSource[];
};

function isRangePresetActive(min: string, max: string, preset: RangeFilterPreset): boolean {
  return min === preset.min && max === preset.max;
}

function getBrandOptions(catalog: readonly Bike[]): string[] {
  return [...new Set(catalog.map((b) => b.brand))].sort();
}

function AdminModelsEditFiltersPanel({
  filters,
  isOpen,
  brandOptions,
  onApplyFilters,
  onChange,
  onClearFilters,
  onClose,
}: Readonly<{
  filters: AdminModelsEditFilters;
  isOpen: boolean;
  brandOptions: readonly string[];
  onApplyFilters: () => void;
  onChange: (next: Partial<AdminModelsEditFilters>) => void;
  onClearFilters: () => void;
  onClose: () => void;
}>) {
  const hasActiveFilters = filters.searchText.length > 0
    || filters.selectedBrands.length > 0
    || filters.selectedSegments.length > 0
    || filters.selectedLicenses.length > 0
    || filters.minPrice.length > 0
    || filters.maxPrice.length > 0
    || filters.minPower.length > 0
    || filters.maxPower.length > 0
    || filters.minWeight.length > 0
    || filters.maxWeight.length > 0
    || filters.minSeatHeight.length > 0
    || filters.maxSeatHeight.length > 0
    || filters.equipment.length > 0
    || filters.recommendedUses.length > 0
    || filters.dataSources.length > 0;
  const panelClasses = ['admin-page__filters', isOpen ? 'admin-page__filters--open' : ''].filter(Boolean).join(' ');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen ? <button className="admin-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros" /> : null}
      <section
        className={panelClasses}
        aria-label="Filtros de modelos"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="admin-page__sheet-handle" aria-hidden="true" />
        <div className="admin-page__filters-header">
          <h2 id="admin-edit-models-filters-title">Filtros</h2>
          <button type="button" onClick={onClearFilters} disabled={!hasActiveFilters}>Limpiar filtros</button>
          <button className="admin-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="admin-page__filters-body">
          <label className="admin-page__search" htmlFor="admin-edit-models-search">
            Buscar por marca o modelo
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              id="admin-edit-models-search"
              type="search"
              value={filters.searchText}
              onChange={(event) => onChange({ searchText: event.target.value })}
              placeholder="Buscar por marca o modelo…"
            />
          </label>

          <FilterGroup title="Marca">
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.selectedBrands.length === 0}
                ariaLabel="Marca: Todas"
                classPrefix="admin-page"
                icon="apps"
                label="Todas"
                onClick={() => onChange({ selectedBrands: [] })}
              />
              {brandOptions.map((brand) => (
                <FilterOptionButton
                  active={filters.selectedBrands.includes(brand)}
                  ariaLabel={`Marca: ${brand}`}
                  classPrefix="admin-page"
                  key={brand}
                  label={brand}
                  onClick={() => {
                    onChange({
                      selectedBrands: filters.selectedBrands.includes(brand)
                        ? filters.selectedBrands.filter((b) => b !== brand)
                        : [...filters.selectedBrands, brand],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Segmento">
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.selectedSegments.length === 0}
                ariaLabel="Segmento: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ selectedSegments: [] })}
              />
              {BIKE_SEGMENTS.map((segment) => (
                <FilterOptionButton
                  active={filters.selectedSegments.includes(segment)}
                  ariaLabel={`Segmento: ${segmentLabels[segment]}`}
                  classPrefix="admin-page"
                  icon={adminModelsEditSegmentIcon[segment] ?? 'more_horiz'}
                  key={segment}
                  label={segmentLabels[segment]}
                  onClick={() => {
                    onChange({
                      selectedSegments: filters.selectedSegments.includes(segment)
                        ? filters.selectedSegments.filter((s) => s !== segment)
                        : [...filters.selectedSegments, segment],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Carnet" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.selectedLicenses.length === 0}
                ariaLabel="Carnet: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ selectedLicenses: [] })}
              />
              <FilterOptionButton
                active={filters.selectedLicenses.includes('A2')}
                ariaLabel="Carnet: Carnet A2"
                classPrefix="admin-page"
                label="Carnet A2"
                onClick={() => {
                  onChange({
                    selectedLicenses: filters.selectedLicenses.includes('A2')
                      ? filters.selectedLicenses.filter((l) => l !== 'A2')
                      : [...filters.selectedLicenses, 'A2'],
                  });
                }}
              />
              <FilterOptionButton
                active={filters.selectedLicenses.includes('A')}
                ariaLabel="Carnet: Carnet A"
                classPrefix="admin-page"
                label="Carnet A"
                onClick={() => {
                  onChange({
                    selectedLicenses: filters.selectedLicenses.includes('A')
                      ? filters.selectedLicenses.filter((l) => l !== 'A')
                      : [...filters.selectedLicenses, 'A'],
                  });
                }}
              />
            </div>
          </FilterGroup>

          <FilterGroup title="Precio" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.minPrice === '' && filters.maxPrice === ''}
                ariaLabel="Precio: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ minPrice: '', maxPrice: '' })}
              />
              {pricePresets.map((preset) => (
                <FilterOptionButton
                  active={isRangePresetActive(filters.minPrice, filters.maxPrice, preset)}
                  ariaLabel={`Precio: ${preset.label}`}
                  classPrefix="admin-page"
                  key={preset.key}
                  label={preset.label}
                  onClick={() => {
                    if (isRangePresetActive(filters.minPrice, filters.maxPrice, preset)) {
                      onChange({ minPrice: '', maxPrice: '' });
                    } else {
                      onChange({ minPrice: preset.min, maxPrice: preset.max });
                    }
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Potencia" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.minPower === '' && filters.maxPower === ''}
                ariaLabel="Potencia: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ minPower: '', maxPower: '' })}
              />
              {powerPresets.map((preset) => (
                <FilterOptionButton
                  active={isRangePresetActive(filters.minPower, filters.maxPower, preset)}
                  ariaLabel={`Potencia: ${preset.label}`}
                  classPrefix="admin-page"
                  key={preset.key}
                  label={preset.label}
                  onClick={() => {
                    if (isRangePresetActive(filters.minPower, filters.maxPower, preset)) {
                      onChange({ minPower: '', maxPower: '' });
                    } else {
                      onChange({ minPower: preset.min, maxPower: preset.max });
                    }
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Peso" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.minWeight === '' && filters.maxWeight === ''}
                ariaLabel="Peso: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ minWeight: '', maxWeight: '' })}
              />
              {weightPresets.map((preset) => (
                <FilterOptionButton
                  active={isRangePresetActive(filters.minWeight, filters.maxWeight, preset)}
                  ariaLabel={`Peso: ${preset.label}`}
                  classPrefix="admin-page"
                  key={preset.key}
                  label={preset.label}
                  onClick={() => {
                    if (isRangePresetActive(filters.minWeight, filters.maxWeight, preset)) {
                      onChange({ minWeight: '', maxWeight: '' });
                    } else {
                      onChange({ minWeight: preset.min, maxWeight: preset.max });
                    }
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Altura asiento" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.minSeatHeight === '' && filters.maxSeatHeight === ''}
                ariaLabel="Altura asiento: Todas"
                classPrefix="admin-page"
                icon="apps"
                label="Todas"
                onClick={() => onChange({ minSeatHeight: '', maxSeatHeight: '' })}
              />
              {seatHeightPresets.map((preset) => (
                <FilterOptionButton
                  active={isRangePresetActive(filters.minSeatHeight, filters.maxSeatHeight, preset)}
                  ariaLabel={`Altura asiento: ${preset.label}`}
                  classPrefix="admin-page"
                  key={preset.key}
                  label={preset.label}
                  onClick={() => {
                    if (isRangePresetActive(filters.minSeatHeight, filters.maxSeatHeight, preset)) {
                      onChange({ minSeatHeight: '', maxSeatHeight: '' });
                    } else {
                      onChange({ minSeatHeight: preset.min, maxSeatHeight: preset.max });
                    }
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Electrónica" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {(Object.keys(featureLabels) as (keyof BikeFeatures)[]).map((feature) => (
                <FilterOptionButton
                  active={filters.equipment.includes(feature)}
                  ariaLabel={`Electrónica: ${featureLabels[feature]}`}
                  classPrefix="admin-page"
                  icon={getMotorcycleTechnicalIcon('electronics')}
                  key={feature}
                  label={featureLabels[feature]}
                  onClick={() => {
                    onChange({
                      equipment: filters.equipment.includes(feature)
                        ? filters.equipment.filter((f) => f !== feature)
                        : [...filters.equipment, feature],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Uso recomendado" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {(Object.keys(useLabels) as (keyof BikeUseScores)[]).map((use) => (
                <FilterOptionButton
                  active={filters.recommendedUses.includes(use)}
                  ariaLabel={`Uso: ${useLabels[use]}`}
                  classPrefix="admin-page"
                  key={use}
                  label={useLabels[use]}
                  onClick={() => {
                    onChange({
                      recommendedUses: filters.recommendedUses.includes(use)
                        ? filters.recommendedUses.filter((u) => u !== use)
                        : [...filters.recommendedUses, use],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Calidad de datos" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {MOTORCYCLE_DATA_SOURCES.map((source) => (
                <FilterOptionButton
                  active={filters.dataSources.includes(source)}
                  ariaLabel={`Calidad de datos: ${dataQualityLabels[source]}`}
                  classPrefix="admin-page"
                  icon="fact_check"
                  key={source}
                  label={dataQualityLabels[source]}
                  onClick={() => {
                    onChange({
                      dataSources: filters.dataSources.includes(source)
                        ? filters.dataSources.filter((s) => s !== source)
                        : [...filters.dataSources, source],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>
        </div>

        <footer className="admin-page__filters-footer">
          <button type="button" onClick={onClearFilters} disabled={!hasActiveFilters}>Limpiar filtros</button>
          <button type="button" onClick={onApplyFilters}>Aplicar filtros</button>
        </footer>
      </section>
    </>
  );
}

export function AdminEditModelsPage({ motorcycles }: Readonly<{ motorcycles: readonly Bike[] }>) {
  const [searchText, setSearchText] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<BikeSegment[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<BikeLicense[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minPower, setMinPower] = useState('');
  const [maxPower, setMaxPower] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [minSeatHeight, setMinSeatHeight] = useState('');
  const [maxSeatHeight, setMaxSeatHeight] = useState('');
  const [equipment, setEquipment] = useState<(keyof BikeFeatures)[]>([]);
  const [recommendedUses, setRecommendedUses] = useState<(keyof BikeUseScores)[]>([]);
  const [dataSources, setDataSources] = useState<MotorcycleDataSource[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const ITEMS_PER_PAGE = 12;

  const brandOptions = useMemo(() => getBrandOptions(motorcycles), [motorcycles]);

  const filters = useMemo<AdminModelsEditFilters>(() => ({
    searchText,
    selectedBrands,
    selectedSegments,
    selectedLicenses,
    minPrice,
    maxPrice,
    minPower,
    maxPower,
    minWeight,
    maxWeight,
    minSeatHeight,
    maxSeatHeight,
    equipment,
    recommendedUses,
    dataSources,
  }), [
    searchText,
    selectedBrands,
    selectedSegments,
    selectedLicenses,
    minPrice,
    maxPrice,
    minPower,
    maxPower,
    minWeight,
    maxWeight,
    minSeatHeight,
    maxSeatHeight,
    equipment,
    recommendedUses,
    dataSources,
  ]);

  const filteredBikes = useMemo(() => {
    const normalizedText = normalizeText(searchText);

    return motorcycles.filter((bike) => {
      if (normalizedText && !normalizeText(`${bike.brand} ${bike.model}`).includes(normalizedText)) {
        return false;
      }

      if (selectedBrands.length > 0 && !selectedBrands.includes(bike.brand)) {
        return false;
      }

      if (selectedSegments.length > 0 && !selectedSegments.includes(bike.segment)) {
        return false;
      }

      if (selectedLicenses.length > 0 && !selectedLicenses.includes(bike.license)) {
        return false;
      }

      if (minPrice !== '' || maxPrice !== '') {
        const price = bike.priceEur;
        if (minPrice !== '' && price < Number(minPrice)) return false;
        if (maxPrice !== '' && price > Number(maxPrice)) return false;
      }

      if (minPower !== '' || maxPower !== '') {
        const power = bike.powerHp;
        if (minPower !== '' && power < Number(minPower)) return false;
        if (maxPower !== '' && power > Number(maxPower)) return false;
      }

      if (minWeight !== '' || maxWeight !== '') {
        const weight = bike.wetWeightKg;
        if (minWeight !== '' && weight < Number(minWeight)) return false;
        if (maxWeight !== '' && weight > Number(maxWeight)) return false;
      }

      if (minSeatHeight !== '' || maxSeatHeight !== '') {
        const seatHeight = bike.seatHeightMm;
        if (minSeatHeight !== '' && seatHeight < Number(minSeatHeight)) return false;
        if (maxSeatHeight !== '' && seatHeight > Number(maxSeatHeight)) return false;
      }

      if (equipment.length > 0 && !equipment.every((feature) => bike.features[feature])) {
        return false;
      }

      if (recommendedUses.length > 0 && !recommendedUses.some((use) => bike.useScores[use] >= 7)) {
        return false;
      }

      if (dataSources.length > 0) {
        const bikeDataSources: (MotorcycleDataSource | undefined)[] = [
          bike.specsSource,
          bike.priceSource,
          bike.imageSource,
          bike.scoresSource,
          bike.prosConsSource,
          bike.reliabilitySource,
        ];
        if (!dataSources.some((source) => bikeDataSources.includes(source))) {
          return false;
        }
      }

      return true;
    });
  }, [
    searchText,
    selectedBrands,
    selectedSegments,
    selectedLicenses,
    minPrice,
    maxPrice,
    minPower,
    maxPower,
    minWeight,
    maxWeight,
    minSeatHeight,
    maxSeatHeight,
    equipment,
    recommendedUses,
    dataSources,
    motorcycles,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredBikes.length / ITEMS_PER_PAGE));
  const paginatedBikes = useMemo(
    () => filteredBikes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [currentPage, filteredBikes],
  );

  const hasActiveFilters = searchText.length > 0
    || selectedBrands.length > 0
    || selectedSegments.length > 0
    || selectedLicenses.length > 0
    || minPrice.length > 0
    || maxPrice.length > 0
    || minPower.length > 0
    || maxPower.length > 0
    || minWeight.length > 0
    || maxWeight.length > 0
    || minSeatHeight.length > 0
    || maxSeatHeight.length > 0
    || equipment.length > 0
    || recommendedUses.length > 0
    || dataSources.length > 0;

  const clearFilters = useCallback(() => {
    setSearchText('');
    setSelectedBrands([]);
    setSelectedSegments([]);
    setSelectedLicenses([]);
    setMinPrice('');
    setMaxPrice('');
    setMinPower('');
    setMaxPower('');
    setMinWeight('');
    setMaxWeight('');
    setMinSeatHeight('');
    setMaxSeatHeight('');
    setEquipment([]);
    setRecommendedUses([]);
    setDataSources([]);
  }, []);

  const updateFilters = useCallback((next: Partial<AdminModelsEditFilters>) => {
    if (next.searchText !== undefined) setSearchText(next.searchText);
    if (next.selectedBrands !== undefined) setSelectedBrands(next.selectedBrands);
    if (next.selectedSegments !== undefined) setSelectedSegments(next.selectedSegments);
    if (next.selectedLicenses !== undefined) setSelectedLicenses(next.selectedLicenses);
    if (next.minPrice !== undefined) setMinPrice(next.minPrice);
    if (next.maxPrice !== undefined) setMaxPrice(next.maxPrice);
    if (next.minPower !== undefined) setMinPower(next.minPower);
    if (next.maxPower !== undefined) setMaxPower(next.maxPower);
    if (next.minWeight !== undefined) setMinWeight(next.minWeight);
    if (next.maxWeight !== undefined) setMaxWeight(next.maxWeight);
    if (next.minSeatHeight !== undefined) setMinSeatHeight(next.minSeatHeight);
    if (next.maxSeatHeight !== undefined) setMaxSeatHeight(next.maxSeatHeight);
    if (next.equipment !== undefined) setEquipment(next.equipment);
    if (next.recommendedUses !== undefined) setRecommendedUses(next.recommendedUses);
    if (next.dataSources !== undefined) setDataSources(next.dataSources);
    setCurrentPage(1);
  }, []);

  return (
    <AdminModelsWorkspace
      activeModelsItem="edit"
      description="Busca una moto del catálogo y abre su ficha interna de edición."
      title="Seleccionar modelo para editar"
      titleId="admin-models-edit-title"
      sidebarContent={(
        <AdminModelsEditFiltersPanel
          brandOptions={brandOptions}
          filters={filters}
          isOpen={isFilterPanelOpen}
          onApplyFilters={() => setIsFilterPanelOpen(false)}
          onChange={updateFilters}
          onClearFilters={clearFilters}
          onClose={() => setIsFilterPanelOpen(false)}
        />
      )}
    >
      <div className="admin-page__edit-models">
        <div className="admin-page__mobile-filter-trigger">
          <button type="button" onClick={() => setIsFilterPanelOpen(true)}>
            <span className="material-symbols-outlined" aria-hidden="true">tune</span>
            Filtros
          </button>
        </div>

        {filteredBikes.length > 0 ? (
          <>
            <p className="admin-page__results-summary" aria-live="polite">
              {filteredBikes.length === 1
                ? '1 modelo encontrado'
                : `${filteredBikes.length} modelos encontrados`}
            </p>

            <div className="admin-page__edit-grid">
              {paginatedBikes.map((bike) => (
                <AdminModelEditCard bike={bike} key={bike.id} />
              ))}
            </div>

            {totalPages > 1 ? (
              <AccountPagination
                ariaLabel="Paginación de edición de modelos"
                className="admin-page__pagination"
                currentClassName="admin-page__pagination-current"
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            ) : null}
          </>
        ) : (
          <article className="account-page__empty-state">
            <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">edit_note</span>
            <h3>No hay modelos que coincidan con los filtros.</h3>
            {hasActiveFilters ? (
              <button className="account-page__button" type="button" onClick={clearFilters}>
                Limpiar filtros
              </button>
            ) : (
              <p>El catálogo no contiene modelos todavía.</p>
            )}
          </article>
        )}
      </div>
    </AdminModelsWorkspace>
  );
}

function draftToUpdatePayload(draft: AdminModelDraft): AdminMotorcycleUpdatePayload {
  const payload: Record<string, unknown> = {};

  if (draft.brand.trim()) {
    payload.brand = draft.brand.trim();
  }

  if (draft.model.trim()) {
    payload.model = draft.model.trim();
  }

  const year = parseInt(draft.year, 10);
  if (!Number.isNaN(year) && year >= 1900 && year <= 2100) {
    payload.year = year;
  }

  if (draft.description.trim()) {
    payload.description = draft.description.trim();
  }

  if (draft.segment) {
    payload.segment = draft.segment;
  }

  if (draft.license) {
    payload.license = draft.license;
  }

  if (draft.engineType) {
    payload.engineType = draft.engineType;
  }

  const displacementCc = parseInt(draft.displacementCc, 10);
  if (!Number.isNaN(displacementCc) && displacementCc > 0) {
    payload.displacementCc = displacementCc;
  }

  const powerHp = parseFloat(draft.powerHp);
  if (!Number.isNaN(powerHp) && powerHp > 0) {
    payload.powerHp = powerHp;
  }

  const torqueNm = parseFloat(draft.torqueNm);
  if (!Number.isNaN(torqueNm) && torqueNm > 0) {
    payload.torqueNm = torqueNm;
  }

  const wetWeightKg = parseFloat(draft.wetWeightKg);
  if (!Number.isNaN(wetWeightKg) && wetWeightKg > 0) {
    payload.wetWeightKg = wetWeightKg;
  }

  const seatHeightMm = parseInt(draft.seatHeightMm, 10);
  if (!Number.isNaN(seatHeightMm) && seatHeightMm > 0) {
    payload.seatHeightMm = seatHeightMm;
  }

  const fuelTankLiters = parseFloat(draft.fuelTankLiters);
  if (!Number.isNaN(fuelTankLiters) && fuelTankLiters > 0) {
    payload.fuelTankLiters = fuelTankLiters;
  }

  if (!draft.pricePending) {
    const priceEur = parseInt(draft.priceEur, 10);
    if (!Number.isNaN(priceEur) && priceEur >= 0) {
      payload.priceEur = priceEur;
    }
  }

  if (draft.imageUrl.trim()) {
    payload.imageUrl = draft.imageUrl.trim();
  }

  payload.imageLocked = draft.imageLocked;
  payload.descriptionLocked = false;
  payload.priceSource = 'manual';
  payload.imageSource = 'manual';
  payload.specsSource = 'manual';
  payload.scoresSource = 'estimated';
  payload.prosConsSource = 'estimated';
  payload.reliabilitySource = 'estimated';
  payload.absCornering = draft.features.absCornering;
  payload.tractionControl = draft.features.tractionControl;
  payload.ridingModes = draft.features.ridingModes;
  payload.cruiseControl = draft.features.cruiseControl;
  payload.quickshifter = draft.features.quickshifter;
  payload.heatedGrips = draft.features.heatedGrips;
  payload.tubelessWheels = draft.features.tubelessWheels;

  return payload as AdminMotorcycleUpdatePayload;
}

function draftToCreatePayload(draft: AdminModelDraft, modelId: string): AdminMotorcycleCreatePayload {
  const id = draft.modelId.trim() || modelId || '';
  const brand = draft.brand.trim() || '';
  const model = draft.model.trim() || '';
  const year = parseInt(draft.year, 10);
  const description = draft.description.trim();
  const segment = draft.segment || '';
  const license = draft.license || '';
  const engineType = draft.engineType || '';
  const displacementCc = parseInt(draft.displacementCc, 10);
  const powerHp = parseFloat(draft.powerHp);
  const torqueNm = parseFloat(draft.torqueNm);
  const wetWeightKg = parseFloat(draft.wetWeightKg);
  const seatHeightMm = parseInt(draft.seatHeightMm, 10);
  const fuelTankLiters = parseFloat(draft.fuelTankLiters);
  const priceEur = draft.pricePending ? 0 : parseInt(draft.priceEur, 10) || 0;
  const imageUrl = draft.imageUrl.trim() || '';

  return {
    id,
    brand,
    model,
    year: Number.isNaN(year) ? 0 : year,
    description,
    segment,
    license,
    engineType,
    displacementCc: Number.isNaN(displacementCc) ? 0 : displacementCc,
    powerHp: Number.isNaN(powerHp) ? 0 : powerHp,
    torqueNm: Number.isNaN(torqueNm) ? 0 : torqueNm,
    wetWeightKg: Number.isNaN(wetWeightKg) ? 0 : wetWeightKg,
    seatHeightMm: Number.isNaN(seatHeightMm) ? 0 : seatHeightMm,
    fuelTankLiters: Number.isNaN(fuelTankLiters) ? 0 : fuelTankLiters,
    priceEur,
    imageUrl,
    imageLocked: draft.imageLocked,
    descriptionLocked: false,
    priceSource: 'manual',
    imageSource: 'manual',
    specsSource: 'manual',
    scoresSource: 'estimated',
    prosConsSource: 'estimated',
    reliabilitySource: 'estimated',
    absCornering: draft.features.absCornering,
    tractionControl: draft.features.tractionControl,
    ridingModes: draft.features.ridingModes,
    cruiseControl: draft.features.cruiseControl,
    quickshifter: draft.features.quickshifter,
    heatedGrips: draft.features.heatedGrips,
    tubelessWheels: draft.features.tubelessWheels,
  };
}

type ValidationResult =
  | { isValid: true }
  | { isValid: false; message: string };

function validateAdminModelDraftForPublish(
  draft: AdminModelDraft,
  options: { mode: 'create' | 'edit'; modelId?: string },
): ValidationResult {
  if (options.mode === 'create') {
    const id = draft.modelId.trim() || options.modelId || '';
    if (!id) {
      return { isValid: false, message: 'El ID del modelo es obligatorio.' };
    }
    if (id.includes(' ')) {
      return { isValid: false, message: 'El ID del modelo no puede contener espacios.' };
    }
  }

  if (!draft.brand.trim()) {
    return { isValid: false, message: 'La marca es obligatoria.' };
  }
  if (!draft.model.trim()) {
    return { isValid: false, message: 'El modelo es obligatorio.' };
  }
  if (!draft.description.trim()) {
    return { isValid: false, message: 'La descripción es obligatoria.' };
  }
  if (!draft.segment) {
    return { isValid: false, message: 'El segmento es obligatorio.' };
  }
  if (!draft.license) {
    return { isValid: false, message: 'El carnet es obligatorio.' };
  }
  if (!draft.engineType) {
    return { isValid: false, message: 'El tipo de motor es obligatorio.' };
  }

  const year = parseInt(draft.year, 10);
  if (Number.isNaN(year) || year < 1900 || year > 2100) {
    return { isValid: false, message: 'El año debe ser un número entre 1900 y 2100.' };
  }

  const displacementCc = parseInt(draft.displacementCc, 10);
  if (Number.isNaN(displacementCc) || displacementCc <= 0) {
    return { isValid: false, message: 'La cilindrada debe ser un número mayor a 0.' };
  }

  const powerHp = parseFloat(draft.powerHp);
  if (Number.isNaN(powerHp) || powerHp <= 0) {
    return { isValid: false, message: 'La potencia debe ser un número mayor a 0.' };
  }

  const torqueNm = parseFloat(draft.torqueNm);
  if (Number.isNaN(torqueNm) || torqueNm <= 0) {
    return { isValid: false, message: 'El par motor debe ser un número mayor a 0.' };
  }

  const wetWeightKg = parseFloat(draft.wetWeightKg);
  if (Number.isNaN(wetWeightKg) || wetWeightKg <= 0) {
    return { isValid: false, message: 'El peso debe ser un número mayor a 0.' };
  }

  const seatHeightMm = parseInt(draft.seatHeightMm, 10);
  if (Number.isNaN(seatHeightMm) || seatHeightMm <= 0) {
    return { isValid: false, message: 'La altura del asiento debe ser un número mayor a 0.' };
  }

  const fuelTankLiters = parseFloat(draft.fuelTankLiters);
  if (Number.isNaN(fuelTankLiters) || fuelTankLiters <= 0) {
    return { isValid: false, message: 'La capacidad del depósito debe ser un número mayor a 0.' };
  }

  if (!draft.pricePending) {
    const priceEur = parseInt(draft.priceEur, 10);
    if (Number.isNaN(priceEur) || priceEur < 0) {
      return { isValid: false, message: 'El precio debe ser un número igual o mayor a 0.' };
    }
  }

  const imageUrl = draft.imageUrl.trim();
  if (!imageUrl) {
    return { isValid: false, message: 'La URL de imagen es obligatoria.' };
  }
  if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return { isValid: false, message: 'La URL de imagen debe ser una URL absoluta o una ruta local comenzando con /.' };
  }

  return { isValid: true };
}

export function AdminEditMotorcyclePage({ motorcycleId, motorcycles, onMotorcyclesChange: onMotorcyclesChangeProp }: Readonly<{ motorcycleId: string | undefined; motorcycles: readonly Bike[]; onMotorcyclesChange?: OnMotorcyclesChange }>) {
  const originalDraft = useMemo(() => {
    if (!motorcycleId) {
      return undefined;
    }

    const bike = motorcycles.find((b) => b.id === motorcycleId);
    return bike ? createDraftFromBike(bike) : undefined;
  }, [motorcycleId, motorcycles]);

  const [draft, setDraft] = useState<AdminModelDraft | undefined>(originalDraft);
  const [localStatus, setLocalStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [persistedImageHasGalleryRecord, setPersistedImageHasGalleryRecord] = useState(false);
  const initializedMotorcycleIdRef = useRef<string | undefined>(motorcycleId);

  const { session, user } = useAuth();

  useEffect(() => {
    const previousMotorcycleId = initializedMotorcycleIdRef.current;
    const didMotorcycleChange = previousMotorcycleId !== motorcycleId;

    if (!motorcycleId) {
      initializedMotorcycleIdRef.current = undefined;
      setPersistedImageHasGalleryRecord(false);
      if (draft) {
        setDraft(undefined);
      }
      return;
    }

    if (didMotorcycleChange) {
      initializedMotorcycleIdRef.current = motorcycleId;
      setLocalStatus('');
      setPublishError('');
      setSaving(false);
      setPersistedImageHasGalleryRecord(false);
      setDraft(originalDraft ? cloneAdminModelDraft(originalDraft) : undefined);
      return;
    }

    if (!draft && originalDraft) {
      setDraft(cloneAdminModelDraft(originalDraft));
    }
  }, [draft, motorcycleId, originalDraft]);

  const suggestedModelId = useMemo(() => draft ? buildSuggestedModelId(draft) : '', [draft]);

  const handleDraftFieldChange = useCallback((field: AdminModelDraftField, value: string) => {
    setDraft((current) => current ? ({ ...current, [field]: value }) : current);
  }, []);

  const handleDraftCheckboxChange = useCallback((field: 'pricePending' | 'imageLocked', value: boolean) => {
    setDraft((current) => current ? ({ ...current, [field]: value }) : current);
  }, []);

  const handleFeatureToggle = useCallback((feature: AdminModelFeatureKey, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        features: {
          ...current.features,
          [feature]: checked,
        },
      };
    });
  }, []);

  const handleLocalAction = useCallback((message: string) => {
    setLocalStatus(message);
    if (message !== 'Publicación pendiente de persistencia.') {
      setPublishError('');
    }
  }, []);

  const handleDiscardChanges = useCallback(() => {
    if (originalDraft) {
      setDraft(cloneAdminModelDraft(originalDraft));
      setLocalStatus('Cambios descartados.');
      setPublishError('');
    }
  }, [originalDraft]);

  const handlePublish = useCallback(async (autoUploadedUrl?: string) => {
    if (!draft) return;

    const accessToken = session?.access_token;

    if (!accessToken) {
      setPublishError('No hay sesión activa para publicar.');
      return;
    }

    const effectiveDraft = autoUploadedUrl
      ? { ...draft, imageUrl: autoUploadedUrl, imageLocked: true }
      : draft;

    const validation = validateAdminModelDraftForPublish(effectiveDraft, { mode: 'edit' });
    if (!validation.isValid) {
      setPublishError(validation.message);
      setLocalStatus(validation.message);
      return;
    }

    setSaving(true);
    setPublishError('');
    setLocalStatus('Publicando modelo...');

    try {
      const payload = draftToUpdatePayload(effectiveDraft);
      const updatedBike = await updateAdminMotorcycle(motorcycleId!, payload, accessToken);
      const originalPersistedImageUrl = originalDraft?.imageUrl.trim() ?? '';
      const originalPersistedObjectPath = getMotorcycleImageObjectPath(originalPersistedImageUrl);
      const nextImageUrl = effectiveDraft.imageUrl.trim();
      const nextImageObjectPath = getMotorcycleImageObjectPath(nextImageUrl);

      if (
        originalPersistedObjectPath
        && nextImageUrl
        && nextImageUrl !== originalPersistedImageUrl
        && nextImageObjectPath !== originalPersistedObjectPath
        && !persistedImageHasGalleryRecord
      ) {
        void deleteMotorcycleImage(originalPersistedObjectPath, accessToken).catch(() => undefined);
      }

      setLocalStatus('Modelo actualizado correctamente.');
      onMotorcyclesChangeProp?.(updatedBike);
      window.location.hash = `#/motos/${motorcycleId}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al publicar el modelo.';
      setPublishError(message);
      setLocalStatus(message);
    } finally {
      setSaving(false);
    }
  }, [draft, motorcycleId, onMotorcyclesChangeProp, originalDraft?.imageUrl, persistedImageHasGalleryRecord, session?.access_token]);

  const handleUploadImage = useCallback(async (file: File) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para subir la imagen.');
    }

    return uploadMotorcycleImage(file, motorcycleId!, accessToken);
  }, [motorcycleId, session?.access_token]);

  const handleCreateGalleryRecord = useCallback(async ({
    motorcycleId: targetMotorcycleId,
    url,
    storagePath,
    isPrimary,
    sortOrder,
    source,
  }: {
    motorcycleId: string;
    url: string;
    storagePath: string;
    isPrimary: boolean;
    sortOrder: number;
    source: MotorcycleDataSource;
  }) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para registrar la imagen en la galería.');
    }

    return createAdminMotorcycleGalleryImage({
      motorcycleId: targetMotorcycleId,
      url,
      storagePath,
      isPrimary,
      sortOrder,
      source,
      createdBy: user?.id ?? null,
    }, accessToken);
  }, [session?.access_token, user?.id]);

  const handleDeleteImage = useCallback(async (objectPath: string) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para eliminar la imagen.');
    }

    await deleteMotorcycleImage(objectPath, accessToken);
  }, [session?.access_token]);

  const isDraftLoading = Boolean(
    motorcycleId
    && !draft
    && (motorcycles.length === 0 || Boolean(originalDraft)),
  );

  if (!motorcycleId) {
    return (
      <AdminModelsWorkspace
        activeModelsItem="edit"
        description="Seleccionar modelo para editar"
        title="Modelo no encontrado"
        titleId="admin-models-edit-notfound-title"
      >
        <article className="account-page__empty-state">
          <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">edit_note</span>
          <h2>Modelo no encontrado</h2>
          <p>No se encontró un modelo con el identificador especificado.</p>
          <a className="account-page__button" href="#/admin/modelos/editar">Volver a selección de modelos</a>
        </article>
      </AdminModelsWorkspace>
    );
  }

  if (isDraftLoading) {
    return (
      <AdminModelsWorkspace
        activeModelsItem="edit"
        description="Preparando edición del modelo..."
        title="Cargando modelo..."
        titleId="admin-models-edit-loading-title"
      >
        <article className="account-page__empty-state">
          <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">progress_activity</span>
          <h2>Cargando modelo...</h2>
          <p>Preparando edición del modelo...</p>
        </article>
      </AdminModelsWorkspace>
    );
  }

  if (!originalDraft || !draft) {
    return (
      <AdminModelsWorkspace
        activeModelsItem="edit"
        description="Seleccionar modelo para editar"
        title="Modelo no encontrado"
        titleId="admin-models-edit-notfound-title"
      >
        <article className="account-page__empty-state">
          <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">edit_note</span>
          <h2>Modelo no encontrado</h2>
          <p>No se encontró un modelo con el identificador especificado.</p>
          <a className="account-page__button" href="#/admin/modelos/editar">Volver a selección de modelos</a>
        </article>
      </AdminModelsWorkspace>
    );
  }

  const safeDraft = draft;
  const kickerText = `Editando ${safeDraft.brand} ${safeDraft.model} ${safeDraft.year}`;

  return (
    <AdminModelsWorkspace
      activeModelsItem="edit"
      description="Actualiza los datos disponibles de este modelo."
      title="Editar modelo"
      titleId="admin-models-edit-title"
    >
      {publishError ? <p className="admin-page__model-status admin-page__model-status--error" role="alert">{publishError}</p> : null}
      <AdminModelFormBody
        key={motorcycleId}
        draft={safeDraft}
        suggestedModelId={suggestedModelId}
        localStatus={localStatus}
        persistedImageLocked={originalDraft.imageLocked}
        persistedImageUrl={originalDraft.imageUrl}
        onDraftFieldChange={handleDraftFieldChange}
        onDraftCheckboxChange={handleDraftCheckboxChange}
        onFeatureToggle={handleFeatureToggle}
        onDiscardChanges={handleDiscardChanges}
        onLocalAction={handleLocalAction}
        onPublish={handlePublish}
        onUploadImage={handleUploadImage}
        onCreateGalleryRecord={handleCreateGalleryRecord}
        onPersistedImageGalleryStateChange={setPersistedImageHasGalleryRecord}
        onDeleteImage={handleDeleteImage}
        saving={saving}
        toolbarKicker={kickerText}
        workspaceHeading="Workspace de edición"
        workspaceHeadingId="admin-models-edit-workspace-title"
        formLabel="Formulario de edición de modelo"
      />
    </AdminModelsWorkspace>
  );
}

type AdminModelEditCardProps = Readonly<{
  bike: Bike;
}>;

function AdminModelEditCard({ bike }: AdminModelEditCardProps) {
  const displayName = getBikeDisplayName(bike);
  const editHref = `#/admin/modelos/${bike.id}/editar`;

  return (
    <article className="admin-page__model-edit-summary-card" data-testid="admin-model-edit-summary-card" aria-label={displayName}>
      <MotorcycleImage decorative className="admin-page__model-edit-summary-image" motorcycle={bike} />
      <div className="admin-page__model-edit-summary-overlay" aria-hidden="true" />

      <div className="admin-page__model-edit-summary-content">
        <header className="admin-page__model-edit-summary-header">
          <h2 className="admin-page__model-edit-summary-title">
            <span className='bike-brand'>{bike.brand}</span>
            <span className='bike-model'>{bike.model}</span>
          </h2>
        </header>

        <ul className="admin-page__model-edit-summary-meta" aria-label="Detalles del modelo">
          <li><span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>{bike.year}</li>
        </ul>


        <footer className="admin-page__model-edit-summary-actions">
          <a href={editHref} aria-label={`Editar modelo ${displayName}`}>
            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
            Editar modelo
          </a>
        </footer>
      </div>
    </article>
  );
}

function AdminModerationSidebar({
  filters,
  isOpen,
  onApplyFilters,
  onChange,
  onClearFilters,
  onClose,
}: Readonly<{
  filters: AdminFilters;
  isOpen: boolean;
  onApplyFilters: () => void;
  onChange: (next: Partial<AdminFilters>) => void;
  onClearFilters: () => void;
  onClose: () => void;
}>) {
  const panelClasses = ['admin-page__filters', isOpen ? 'admin-page__filters--open' : ''].filter(Boolean).join(' ');
  const clearButtonDisabled = !hasActiveFilters(filters);

  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Filtros de moderación">
      <AccountQuickLinksNav
        activeAdminItem="moderation"
        ariaLabel="Navegación de administración"
        includeAdmin
      />

      {isOpen ? <button className="admin-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros de moderación" /> : null}

      <section
        className={panelClasses}
        aria-label="Filtros admin"
        aria-labelledby="admin-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="admin-page__sheet-handle" aria-hidden="true" />
        <div className="admin-page__filters-header">
          <h2 id="admin-filters-title">Filtros</h2>
          <button type="button" onClick={onClearFilters} disabled={clearButtonDisabled}>Limpiar filtros</button>
          <button className="admin-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros de moderación">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="admin-page__filters-body">
          <FilterGroup title="Estado del reporte">
            <div className="admin-page__filter-options">
              {reportStatusOptions.map((option) => (
                <FilterOptionButton
                  active={filters.status === option.value}
                  ariaLabel={`Estado del reporte: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ status: option.value })}
                />
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Motivo" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {reasonOptions.map((option) => (
                <FilterOptionButton
                  active={filters.reason === option.value}
                  ariaLabel={`Motivo: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ reason: option.value })}
                />
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Orden" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {sortOptions.map((option) => (
                <FilterOptionButton
                  active={filters.sort === option.value}
                  ariaLabel={`Orden: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ sort: option.value })}
                />
              ))}
            </div>
          </FilterGroup>
        </div>

        <footer className="admin-page__filters-footer">
          <button type="button" onClick={onClearFilters} disabled={clearButtonDisabled}>Limpiar filtros</button>
          <button type="button" onClick={onApplyFilters}>Aplicar filtros</button>
        </footer>
      </section>

      <article className="account-page__notice admin-page__notice">
        <span className="material-symbols-outlined" aria-hidden="true">policy</span>
        <div>
          <p>Modera sin borrar datos.</p>
          <strong>Los reportes no son públicos y las reviews pueden ocultarse.</strong>
        </div>
      </article>
    </aside>
  );
}

function AdminReviewsSidebar({
  filters,
  isOpen,
  onApplyFilters,
  onChange,
  onClearFilters,
  onClose,
}: Readonly<{
  filters: AdminReviewsFilters;
  isOpen: boolean;
  onApplyFilters: () => void;
  onChange: (next: Partial<AdminReviewsFilters>) => void;
  onClearFilters: () => void;
  onClose: () => void;
}>) {
  const panelClasses = ['admin-page__filters', isOpen ? 'admin-page__filters--open' : ''].filter(Boolean).join(' ');
  const clearButtonDisabled = (
    filters.search === defaultReviewsFilters.search
    && filters.status === defaultReviewsFilters.status
    && filters.source === defaultReviewsFilters.source
    && filters.segment === defaultReviewsFilters.segment
    && filters.verified === defaultReviewsFilters.verified
    && filters.license === defaultReviewsFilters.license
    && filters.ridingStyle === defaultReviewsFilters.ridingStyle
    && filters.sort === defaultReviewsFilters.sort
  );

  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Filtros de reviews">
      <AccountQuickLinksNav
        activeAdminItem="reviews"
        ariaLabel="Navegación de administración"
        includeAdmin
      />

      {isOpen ? <button className="admin-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros de reviews" /> : null}

      <section
        className={panelClasses}
        aria-label="Filtros admin"
        aria-labelledby="admin-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="admin-page__sheet-handle" aria-hidden="true" />
        <div className="admin-page__filters-header">
          <h2 id="admin-filters-title">Filtros</h2>
          <button type="button" onClick={onClearFilters} disabled={clearButtonDisabled}>Limpiar filtros</button>
          <button className="admin-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros de reviews">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="admin-page__filters-body">
          <label className="admin-page__search" htmlFor="admin-reviews-search">
            Buscar por marca o modelo
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              id="admin-reviews-search"
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Buscar por marca o modelo"
            />
          </label>

          <FilterGroup title="Estado">
            <div className="admin-page__filter-options">
              {reviewStatusOptions.map((option) => (
                <FilterOptionButton
                  active={filters.status === option.value}
                  ariaLabel={`Estado: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ status: option.value as AdminReviewsFilters['status'] })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Origen" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {reviewSourceOptions.map((option) => (
                <FilterOptionButton
                  active={filters.source === option.value}
                  ariaLabel={`Origen: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ source: option.value as AdminReviewsFilters['source'] })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Segmento" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {motorcycleSegmentFilterOptions.map((option) => (
                <FilterOptionButton
                  active={filters.segment === option.value}
                  ariaLabel={`Segmento: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ segment: option.value as AdminReviewsFilters['segment'] })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Verificadas" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {reviewVerifiedOptions.map((option) => (
                <FilterOptionButton
                  active={filters.verified === option.value}
                  ariaLabel={`Verificadas: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ verified: option.value as AdminReviewsFilters['verified'] })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Carnet" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {adminLicenseOptions.map((option) => (
                <FilterOptionButton
                  active={filters.license === option.value}
                  ariaLabel={`Carnet: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ license: option.value as AdminReviewsFilters['license'] })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Uso principal" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {adminRidingStyleOptions.map((option) => (
                <FilterOptionButton
                  active={filters.ridingStyle === option.value}
                  ariaLabel={`Uso principal: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ ridingStyle: option.value as AdminReviewsFilters['ridingStyle'] })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Orden" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {reviewSortOptions.map((option) => (
                <FilterOptionButton
                  active={filters.sort === option.value}
                  ariaLabel={`Orden: ${option.label}`}
                  classPrefix="admin-page"
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ sort: option.value as AdminReviewsFilters['sort'] })}
                />
              ))}
            </div>
          </FilterGroup>
        </div>

        <footer className="admin-page__filters-footer">
          <button type="button" onClick={onClearFilters} disabled={clearButtonDisabled}>Limpiar filtros</button>
          <button type="button" onClick={onApplyFilters}>Aplicar filtros</button>
        </footer>
      </section>

      <article className="account-page__notice admin-page__notice">
        <span className="material-symbols-outlined" aria-hidden="true">policy</span>
        <div>
          <p>Filtra reviews por estado, origen, segmento, carnet y uso principal.</p>
          <strong>Los filtros no cambian datos en la base.</strong>
        </div>
      </article>
    </aside>
  );
}

function ReportStatusBadge({ status }: Readonly<{ status: ReviewReportStatus }>) {
  return <span className="admin-page__status-pill" data-status={status}>{reportStatusLabels[status]}</span>;
}

function ReviewStatusBadge({ status }: Readonly<{ status: MotorcycleReviewStatus }>) {
  return <span className="admin-page__status-pill admin-page__status-pill--review" data-status={status}>{reviewStatusLabels[status]}</span>;
}

function normalizeTextList(values: readonly string[] | null | undefined) {
  return (values ?? [])
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0 && value.toLowerCase() !== 'null');
}

function AdminReportCard({
  aspects,
  isExpanded,
  isPending,
  onToggle,
  onReportStatus,
  onReviewStatus,
  report,
}: Readonly<{
  aspects?: readonly MotorcycleReviewAspect[];
  isExpanded: boolean;
  isPending: boolean;
  onToggle: () => void;
  onReportStatus: (report: AdminReviewReport, status: Exclude<ReviewReportStatus, 'pending'>) => void;
  onReviewStatus: (report: AdminReviewReport, status: Exclude<MotorcycleReviewStatus, 'pending'>) => void;
  report: AdminReviewReport;
}>) {
  const motorcycleName = report.review?.motorcycle
    ? `${report.review.motorcycle.brand} ${report.review.motorcycle.model} ${report.review.motorcycle.year}`
    : report.review?.motorcycleId ?? 'Moto no disponible';
  const reviewStatus = report.review?.status;
  const reviewStatusLabel = reviewStatus ? reviewStatusLabels[reviewStatus] : 'Sin dato';
  const pros = normalizeTextList(report.review?.pros);
  const cons = normalizeTextList(report.review?.cons);
  const cardClasses = ['admin-page__report-card', isExpanded ? 'admin-page__report-card--expanded' : ''].filter(Boolean).join(' ');
  const detailsId = `admin-report-details-${report.id}`;

  return (
    <article className={cardClasses} data-testid="admin-report-card">
      <header className="admin-page__report-header">
        <h2>
          <button
            className="admin-page__report-toggle"
            type="button"
            aria-controls={detailsId}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Contraer' : 'Expandir'} reporte ${reasonLabels[report.reason]} de ${report.reporterDisplayName}`}
            onClick={onToggle}
          >
            <span className="admin-page__report-heading">
              <span className="admin-page__reason-line">
                <ReportStatusBadge status={report.status} />
                <span className="admin-page__reason-title">{reasonLabels[report.reason]}</span>
              </span>
              <span className="admin-page__reporter">
                Reportado por <strong title={report.reporterUserId}>{report.reporterDisplayName}</strong> · {formatDate(report.createdAt)}
              </span>
              <span className="admin-page__report-summary">
                {motorcycleName} · Review de @{report.review?.userName || 'usuario'} · ★ {report.review?.rating ?? 'N/D'} ·{' '}
                {reviewStatus ? <ReviewStatusBadge status={reviewStatus} /> : reviewStatusLabel}
              </span>
            </span>
            <span className="material-symbols-outlined admin-page__report-chevron" aria-hidden="true">expand_more</span>
          </button>
        </h2>
      </header>

      <div id={detailsId} className="admin-page__report-body-wrapper" aria-hidden={!isExpanded} inert={!isExpanded}>
        <div className="admin-page__report-body">
          <section className="admin-page__reported-review" aria-label="Review reportada">
            <p>“{report.review?.comment ?? 'Review no disponible.'}”</p>
          </section>

          {pros.length > 0 ? (
            <section className="admin-page__report-extra" aria-label="Pros reportados">
              <strong>Pros:</strong>
              <p>{pros.join(', ')}</p>
            </section>
          ) : null}

          {cons.length > 0 ? (
            <section className="admin-page__report-extra" aria-label="Contras reportados">
              <strong>Contras:</strong>
              <p>{cons.join(', ')}</p>
            </section>
          ) : null}

          {aspects && aspects.length > 0 ? (
            <div className="admin-page__report-aspects">
              <ReviewAspectSummary aspects={aspects} />
            </div>
          ) : null}

          {report.comment ? (
            <blockquote aria-label="Comentario del reporte">
              <strong>Comentario del reporte:</strong>
              <p>{report.comment}</p>
            </blockquote>
          ) : null}

          <footer>
            <div className="admin-page__action-group" aria-label="Acciones sobre reporte">
              <h3>Gestionar reporte</h3>
              <div>
                <button
                  className="admin-page__action-button admin-page__action-button--reviewed"
                  type="button"
                  disabled={isPending || report.status === 'reviewed'}
                  onClick={() => onReportStatus(report, 'reviewed')}
                >
                  Marcar revisado
                </button>
                <button
                  className="admin-page__action-button admin-page__action-button--dismiss"
                  type="button"
                  disabled={isPending || report.status === 'dismissed'}
                  onClick={() => onReportStatus(report, 'dismissed')}
                >
                  Descartar reporte
                </button>
                <button
                  className="admin-page__action-button admin-page__action-button--resolved"
                  type="button"
                  disabled={isPending || report.status === 'action_taken'}
                  onClick={() => onReportStatus(report, 'action_taken')}
                >
                  Marcar como resuelto
                </button>
              </div>
            </div>

            {report.review ? (
              <div className="admin-page__action-group" aria-label="Acciones sobre review">
                <h3>Gestionar review</h3>
                <div>
                  <button
                    className="admin-page__action-button admin-page__action-button--hide"
                    type="button"
                    disabled={isPending || reviewStatus === 'hidden'}
                    onClick={() => onReviewStatus(report, 'hidden')}
                  >
                    Ocultar
                  </button>
                  <button
                    className="admin-page__action-button admin-page__action-button--approve"
                    type="button"
                    disabled={isPending || reviewStatus === 'approved'}
                    onClick={() => onReviewStatus(report, 'approved')}
                  >
                    Aprobar
                  </button>
                  <button
                    className="admin-page__action-button admin-page__action-button--reject"
                    type="button"
                    disabled={isPending || reviewStatus === 'rejected'}
                    onClick={() => onReviewStatus(report, 'rejected')}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ) : null}
          </footer>
        </div>
      </div>
    </article>
  );
}

function AdminReplyCard({
  aspects,
  expanded,
  isPending,
  onApprove,
  onHide,
  onReject,
  onToggle,
  reply,
}: Readonly<{
  aspects?: readonly MotorcycleReviewAspect[];
  expanded: boolean;
  isPending: boolean;
  onApprove: () => void;
  onHide: () => void;
  onReject: () => void;
  onToggle: () => void;
  reply: AdminReviewReply;
}>) {
  const motorcycleName = reply.review?.motorcycle
    ? `${reply.review.motorcycle.brand} ${reply.review.motorcycle.model} ${reply.review.motorcycle.year}`
    : reply.review?.motorcycleId ?? 'Moto no disponible';
  const cardClasses = ['admin-page__report-card', expanded ? 'admin-page__report-card--expanded' : ''].filter(Boolean).join(' ');
  const detailsId = `admin-reply-details-${reply.id}`;

  return (
    <article className={cardClasses} data-testid="admin-reply-card">
      <header className="admin-page__report-header">
        <h2>
          <button
            className="admin-page__report-toggle"
            type="button"
            aria-controls={detailsId}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Contraer' : 'Expandir'} respuesta de ${reply.userDisplayName}`}
            onClick={onToggle}
          >
            <span className="admin-page__report-heading">
              <span className="admin-page__reason-line">
                <span className="admin-page__status-pill" data-status="pending">Pendiente</span>
                <span className="admin-page__reason-title">Respuesta a review</span>
              </span>
              <span className="admin-page__reporter">
                Respuesta de <strong>{reply.userDisplayName}</strong> · {formatDate(reply.createdAt)}
              </span>
              <span className="admin-page__report-summary">
                {motorcycleName} · Review de @{reply.review?.userName || 'usuario'} · ★ {reply.review?.rating ?? 'N/D'}
              </span>
            </span>
            <span className="material-symbols-outlined admin-page__report-chevron" aria-hidden="true">expand_more</span>
          </button>
        </h2>
      </header>

      <div id={detailsId} className="admin-page__report-body-wrapper" aria-hidden={!expanded} inert={!expanded}>
        <div className="admin-page__report-body">
          <section className="admin-page__reported-review" aria-label="Review original">
            <p>"{reply.review?.comment ?? 'Review no disponible.'}"</p>
          </section>

          {(reply.review?.pros?.length ?? 0) > 0 ? (
            <section className="admin-page__report-extra" aria-label="Pros de la review">
              <strong>Pros:</strong>
              <p>{reply.review!.pros!.join(', ')}</p>
            </section>
          ) : null}

          {(reply.review?.cons?.length ?? 0) > 0 ? (
            <section className="admin-page__report-extra" aria-label="Contras de la review">
              <strong>Contras:</strong>
              <p>{reply.review!.cons!.join(', ')}</p>
            </section>
          ) : null}

          {aspects && aspects.length > 0 ? (
            <div className="admin-page__report-aspects">
              <ReviewAspectSummary aspects={aspects} />
            </div>
          ) : null}

          <blockquote aria-label="Respuesta">
            <strong>Respuesta:</strong>
            <p>"{reply.comment}"</p>
          </blockquote>

          <footer>
            <div className="admin-page__action-group" aria-label="Acciones sobre respuesta">
              <h3>Gestionar respuesta</h3>
              <div>
                <button
                  className="admin-page__action-button admin-page__action-button--hide"
                  type="button"
                  disabled={isPending}
                  onClick={onHide}
                >
                  Ocultar
                </button>
                <button
                  className="admin-page__action-button admin-page__action-button--approve"
                  type="button"
                  disabled={isPending}
                  onClick={onApprove}
                >
                  Aprobar
                </button>
                <button
                  className="admin-page__action-button admin-page__action-button--reject"
                  type="button"
                  disabled={isPending}
                  onClick={onReject}
                >
                  Rechazar
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}

function AdminReviewSummaryCard({ item }: Readonly<{ item: AdminReviewGarageItem }>) {
  return (
    <article
      className="account-page__review-summary-card admin-page__review-summary-card"
      data-testid="admin-review-summary-card"
      aria-label={`${item.motorcycleName}: ${formatPendingReviewCount(item.pendingReviewCount)}`}
    >
      <MotorcycleImage decorative className="account-page__review-summary-image" motorcycle={item.imageSource} />
      <div className="account-page__review-summary-overlay" aria-hidden="true" />

      <div className="account-page__review-summary-content">
        <header className="account-page__review-summary-header">
          <h2>{item.motorcycleName}</h2>
          <div className="account-page__review-summary-rating" aria-label={formatPendingReviewCount(item.pendingReviewCount)}>
            <span className="material-symbols-outlined" aria-hidden="true">pending</span>
            <strong>{item.pendingReviewCount}</strong>
          </div>
        </header>

        <ul className="account-page__review-summary-meta admin-page__review-summary-meta" aria-label="Resumen de reviews a revisar">
          <li>{formatPendingReviewCount(item.pendingReviewCount)}</li>
          <li>{`Última review: ${formatDate(item.latestReviewAt)}`}</li>
        </ul>

        <footer className="account-page__review-summary-actions admin-page__review-summary-actions">
          <a href={`#/admin/reviews/${item.motorcycleId}`}>Revisar reviews</a>
          <a href={item.detailHref}>Ver ficha</a>
        </footer>
      </div>
    </article>
  );
}

export function AdminReviewsPage() {
  const { isAdmin, isAuthenticated, isLoading, session, user, profile } = useAuth();
  const [allReviews, setAllReviews] = useState<readonly MotorcycleReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewFilters, setReviewFilters] = useState<AdminReviewsFilters>(defaultReviewsFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const authContext = useMemo<CreateReviewAuthContext | null>(() => (
    user?.id && session?.access_token ? { accessToken: session.access_token, userId: user.id } : null
  ), [session?.access_token, user?.id]);

  const loadAllReviews = useCallback(() => {
    if (!authContext || !isAdmin) {
      return;
    }

    setIsLoadingReviews(true);
    setError(null);
    getAllReviews(authContext)
      .then((nextReviews) => setAllReviews(nextReviews))
      .catch(() => {
        setAllReviews([]);
        setError('No se pudieron cargar las reviews para admin.');
      })
      .finally(() => setIsLoadingReviews(false));
  }, [authContext, isAdmin]);

  useEffect(() => {
    loadAllReviews();
  }, [loadAllReviews]);

  useEffect(() => {
    if (!isFilterPanelOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterPanelOpen]);

  const filteredReviews = useMemo(() => {
    const base = allReviews ?? [];
    const normalizedSearch = reviewFilters.search.trim().toLowerCase();

    const filtered = base.filter((r) => {
      if (normalizedSearch) {
        const searchText = getReviewSearchText(r);
        if (!searchText.includes(normalizedSearch)) return false;
      }

      if (reviewFilters.status !== 'all' && r.status !== reviewFilters.status) {
        return false;
      }

      if (reviewFilters.source !== 'all') {
        if (r.source === undefined) return false;
        if (r.source !== reviewFilters.source) return false;
      }

      if (reviewFilters.segment !== 'all') {
        const segment = getReviewSegment(r);
        if (!matchesMotorcycleSegmentFilter(segment, reviewFilters.segment)) return false;
      }

      if (reviewFilters.verified !== 'all') {
        const isVerified = Boolean(r.verified);
        if ((reviewFilters.verified === 'verified') !== isVerified) return false;
      }

      if (reviewFilters.license !== 'all') {
        const a2Status = getReviewA2Status(r);
        if (a2Status !== reviewFilters.license) return false;
      }

      if (reviewFilters.ridingStyle !== 'all' && r.ridingStyle !== reviewFilters.ridingStyle) {
        return false;
      }

      return true;
    });

    if (reviewFilters.sort === 'old') {
      return [...filtered].sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt));
    }

    return [...filtered].sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
  }, [allReviews, reviewFilters]);

  const garageItems = useMemo(
    () => buildAdminReviewGarage(filteredReviews),
    [filteredReviews],
  );

  return (
    <AdminGate>
        <PageHero
          className="admin-page__community-hero admin-page__hero"
          titleId="admin-reviews-page-title"
          imageSrc={adminHeroImage}
          eyebrow="ADMIN STUDIO"
          title="Reviews por modelo"
          description="Revisa las motos con reviews pendientes o enviadas por la comunidad."
        >
          <div className="admin-page__hero-meta">
            <div className="admin-page__admin-chip" aria-label="Administrador activo">
              <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
              {getDisplayName(profile?.displayName, user?.email)}
            </div>
          </div>
        </PageHero>

        <main className="account-page admin-page admin-reviews-page" aria-labelledby="admin-reviews-page-title">
          <section className="account-page__dashboard admin-page__layout">
          <AdminReviewsSidebar
            filters={reviewFilters}
            isOpen={isFilterPanelOpen}
            onApplyFilters={() => setIsFilterPanelOpen(false)}
            onChange={(next) => {
              setReviewFilters((current) => ({ ...current, ...next }));
            }}
            onClearFilters={() => setReviewFilters(defaultReviewsFilters)}
            onClose={() => setIsFilterPanelOpen(false)}
          />
          <div className="account-page__main admin-reviews-page__main">
            <section className="account-page__section admin-reviews-page__garage" aria-labelledby="admin-reviews-garage-title">
              <div className="account-page__section-header">
                <div>
                  <span>Garage admin</span>
                  <h2 id="admin-reviews-garage-title">
                    <span className="material-symbols-outlined" aria-hidden="true">garage</span>
                    Reviews por modelo
                  </h2>
                </div>
                <div className="admin-page__mobile-filter-trigger">
                  <button type="button" aria-label="Abrir filtros de reviews" onClick={() => setIsFilterPanelOpen(true)}>
                    <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                    Filtros
                  </button>
                </div>
              </div>

              {error ? (
                <article className="account-page__empty-state account-page__empty-state--error" role="alert">
                  <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">error</span>
                  <h3>{error}</h3>
                  <button className="account-page__button" type="button" onClick={loadAllReviews}>Reintentar</button>
                </article>
              ) : isLoading || (isAuthenticated && isLoadingReviews) ? (
                <p className="admin-page__loading" role="status">Cargando reviews para admin...</p>
              ) : garageItems.length === 0 ? (
                <article className="account-page__empty-state">
                  <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">garage</span>
                  <h3>No hay reviews con estos filtros.</h3>
                </article>
              ) : (
                <div className="admin-reviews-page__garage-grid">
                  {garageItems.map((item) => (
                    <AdminReviewSummaryCard item={item} key={item.motorcycleId} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </AdminGate>
  );
}

const requestsDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const requestStatusLabels: Record<ModelRequestStatusType, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const requestSourceLabels: Record<ModelRequestType['source'], string> = {
  user: 'Usuario',
  admin: 'Admin',
  import: 'Import',
};

type RequestStatusFilterValue = ModelRequestStatusType | 'all';
type RequestSourceFilterValue = ModelRequestType['source'] | 'all';

type RequestStatusOption = Readonly<{
  icon: string;
  label: string;
  value: RequestStatusFilterValue;
}>;

type RequestSourceOption = Readonly<{
  icon: string;
  label: string;
  value: RequestSourceFilterValue;
}>;

const requestStatusOptions: readonly RequestStatusOption[] = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'pending', label: 'Pendientes', value: 'pending' },
  { icon: 'fact_check', label: 'Revisadas', value: 'reviewed' },
  { icon: 'task_alt', label: 'Aprobadas', value: 'approved' },
  { icon: 'cancel', label: 'Rechazadas', value: 'rejected' },
];

const requestSourceOptions: readonly RequestSourceOption[] = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'person', label: 'Usuario', value: 'user' },
  { icon: 'shield_person', label: 'Admin', value: 'admin' },
  { icon: 'cloud_upload', label: 'Import', value: 'import' },
];

type AdminRequestsFilters = {
  statuses: readonly ModelRequestStatusType[];
  sources: readonly ModelRequestType['source'][];
  search: string;
  createdFrom: string;
  createdTo: string;
};

const defaultRequestsFilters: AdminRequestsFilters = {
  statuses: [],
  sources: [],
  search: '',
  createdFrom: '',
  createdTo: '',
};

const REQUESTS_PER_PAGE = 10;

function hasActiveRequestsFilters(filters: AdminRequestsFilters) {
  return filters.statuses.length > 0
    || filters.sources.length > 0
    || filters.search !== defaultRequestsFilters.search
    || filters.createdFrom !== defaultRequestsFilters.createdFrom
    || filters.createdTo !== defaultRequestsFilters.createdTo;
}

function formatRequestDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha pendiente' : requestsDateFormatter.format(date);
}

function AdminRequestsFilterSidebar({
  filters,
  isOpen,
  onApplyFilters,
  onChange,
  onClearFilters,
  onClose,
}: Readonly<{
  filters: AdminRequestsFilters;
  isOpen: boolean;
  onApplyFilters: () => void;
  onChange: (next: Partial<AdminRequestsFilters>) => void;
  onClearFilters: () => void;
  onClose: () => void;
}>) {
  const panelClasses = ['admin-page__filters', isOpen ? 'admin-page__filters--open' : ''].filter(Boolean).join(' ');
  const clearButtonDisabled = !hasActiveRequestsFilters(filters);
  const allStatusActive = filters.statuses.length === 0;
  const allSourceActive = filters.sources.length === 0;

  const handleStatusToggle = (value: RequestStatusFilterValue) => {
    if (value === 'all') {
      onChange({ statuses: [] });
      return;
    }
    const isSelected = filters.statuses.includes(value);
    onChange({
      statuses: isSelected
        ? filters.statuses.filter((status) => status !== value)
        : [...filters.statuses, value],
    });
  };

  const handleSourceToggle = (value: RequestSourceFilterValue) => {
    if (value === 'all') {
      onChange({ sources: [] });
      return;
    }
    const isSelected = filters.sources.includes(value);
    onChange({
      sources: isSelected
        ? filters.sources.filter((source) => source !== value)
        : [...filters.sources, value],
    });
  };

  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Filtros de solicitudes">
      <AccountQuickLinksNav
        activeAdminItem="requests"
        ariaLabel="Navegación de administración"
        includeAdmin
      />

      {isOpen ? <button className="admin-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros de solicitudes" /> : null}

      <section
        className={panelClasses}
        aria-label="Filtros admin"
        aria-labelledby="admin-requests-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="admin-page__sheet-handle" aria-hidden="true" />
        <div className="admin-page__filters-header">
          <h2 id="admin-requests-filters-title">Filtros</h2>
          <button type="button" onClick={onClearFilters} disabled={clearButtonDisabled}>Limpiar filtros</button>
          <button className="admin-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros de solicitudes">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="admin-page__filters-body">
          <label className="admin-page__search" htmlFor="admin-requests-search">
            Buscar por marca o modelo
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              id="admin-requests-search"
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Buscar por marca o modelo"
            />
          </label>

          <FilterGroup title="Estado">
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={allStatusActive}
                ariaLabel="Estado: Todas"
                classPrefix="admin-page"
                icon="apps"
                label="Todas"
                onClick={() => handleStatusToggle('all')}
              />
              {requestStatusOptions
                .filter((option): option is RequestStatusOption & { value: ModelRequestStatusType } => option.value !== 'all')
                .map((option) => (
                  <FilterOptionButton
                    active={filters.statuses.includes(option.value)}
                    ariaLabel={`Estado: ${option.label}`}
                    classPrefix="admin-page"
                    icon={option.icon}
                    key={option.value}
                    label={option.label}
                    onClick={() => handleStatusToggle(option.value)}
                  />
                ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Origen" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={allSourceActive}
                ariaLabel="Origen: Todas"
                classPrefix="admin-page"
                icon="apps"
                label="Todas"
                onClick={() => handleSourceToggle('all')}
              />
              {requestSourceOptions
                .filter((option): option is RequestSourceOption & { value: ModelRequestType['source'] } => option.value !== 'all')
                .map((option) => (
                  <FilterOptionButton
                    active={filters.sources.includes(option.value)}
                    ariaLabel={`Origen: ${option.label}`}
                    classPrefix="admin-page"
                    icon={option.icon}
                    key={option.value}
                    label={option.label}
                    onClick={() => handleSourceToggle(option.value)}
                  />
                ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Fecha de creación" defaultOpen={false}>
            <div className="admin-page__date-range">
              <label htmlFor="admin-requests-created-from">
                Desde
                <input
                  id="admin-requests-created-from"
                  type="date"
                  value={filters.createdFrom}
                  onChange={(event) => onChange({ createdFrom: event.target.value })}
                  max={filters.createdTo || undefined}
                />
              </label>
              <label htmlFor="admin-requests-created-to">
                Hasta
                <input
                  id="admin-requests-created-to"
                  type="date"
                  value={filters.createdTo}
                  onChange={(event) => onChange({ createdTo: event.target.value })}
                  min={filters.createdFrom || undefined}
                />
              </label>
            </div>
          </FilterGroup>
        </div>

        <footer className="admin-page__filters-footer">
          <button type="button" onClick={onClearFilters} disabled={clearButtonDisabled}>Limpiar filtros</button>
          <button type="button" onClick={onApplyFilters}>Aplicar filtros</button>
        </footer>
      </section>
    </aside>
  );
}

function RequestStatusBadge({ status }: Readonly<{ status: ModelRequestStatusType }>) {
  return <span className="admin-page__status-pill" data-status={status}>{requestStatusLabels[status]}</span>;
}

function AdminRequestCard({
  expanded,
  isPending,
  onToggle,
  onStatusAction,
  request,
}: Readonly<{
  expanded: boolean;
  isPending: boolean;
  onToggle: () => void;
  onStatusAction: (request: ModelRequestType, status: Exclude<ModelRequestStatusType, 'pending'>) => void;
  request: ModelRequestType;
}>) {
  const cardClasses = ['admin-page__report-card', expanded ? 'admin-page__report-card--expanded' : ''].filter(Boolean).join(' ');
  const detailsId = `admin-request-details-${request.id}`;

  return (
    <article className={cardClasses} data-testid="admin-request-card">
      <header className="admin-page__report-header">
        <h2>
          <button
            className="admin-page__report-toggle"
            type="button"
            aria-controls={detailsId}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Contraer' : 'Expandir'} solicitud de ${request.brand} ${request.model}`}
            onClick={onToggle}
          >
            <span className="admin-page__report-heading">
              <span className="admin-page__reason-line">
                <RequestStatusBadge status={request.status} />
                <span className="admin-page__reason-title">{request.brand} {request.model} {request.year}</span>
              </span>
              <span className="admin-page__reporter">
                <span>@{request.userName || (request.userId ? 'Usuario' : 'Anónimo')}</span>
                {request.createdAt ? ` · ${formatRequestDate(request.createdAt)}` : ''}
              </span>
            </span>
            <span className="material-symbols-outlined admin-page__report-chevron" aria-hidden="true">expand_more</span>
          </button>
        </h2>
      </header>

      <div id={detailsId} className="admin-page__report-body-wrapper" aria-hidden={!expanded} inert={!expanded}>
        <div className="admin-page__report-body">
          <section className="admin-page__reported-review admin-page__request-detail" aria-label="Detalles de la solicitud">
            <div className="admin-page__request-detail-grid">
              <div className="admin-page__request-detail-field">
                <span className="admin-page__request-detail-label">Marca</span>
                <span className="admin-page__request-detail-value">{request.brand}</span>
              </div>
              <div className="admin-page__request-detail-field">
                <span className="admin-page__request-detail-label">Modelo</span>
                <span className="admin-page__request-detail-value">{request.model}</span>
              </div>
            </div>
            <div className="admin-page__request-detail-grid admin-page__request-detail-grid--three">
              <div className="admin-page__request-detail-field">
                <span className="admin-page__request-detail-label">Año</span>
                <span className="admin-page__request-detail-value">{request.year ?? 'No especificado'}</span>
              </div>
              <div className="admin-page__request-detail-field">
                <span className="admin-page__request-detail-label">Segmento</span>
                <span className="admin-page__request-detail-value">{request.segment ?? 'No especificado'}</span>
              </div>
              <div className="admin-page__request-detail-field">
                <span className="admin-page__request-detail-label">Origen</span>
                <span className="admin-page__request-detail-value">{requestSourceLabels[request.source]}</span>
              </div>
            </div>
            {request.userName || request.userId ? (
              <div className="admin-page__request-detail-field admin-page__request-detail-field--full">
                <span className="admin-page__request-detail-label">Usuario</span>
                <span className="admin-page__request-detail-value">{request.userName || 'Usuario MotoAtlas'}</span>
              </div>
            ) : null}
            {request.contactEmail ? (
              <div className="admin-page__request-detail-field admin-page__request-detail-field--full">
                <span className="admin-page__request-detail-label">Email de contacto</span>
                <span className="admin-page__request-detail-value">{request.contactEmail}</span>
              </div>
            ) : null}
            {request.officialUrl ? (
              <div className="admin-page__request-detail-field admin-page__request-detail-field--full">
                <span className="admin-page__request-detail-label">Página oficial o fuente</span>
                <span className="admin-page__request-detail-value">
                  <a href={request.officialUrl} target="_blank" rel="noopener noreferrer">
                    {request.officialUrl}
                    <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                  </a>
                </span>
              </div>
            ) : null}
            {request.comment ? (
              <div className="admin-page__request-detail-field admin-page__request-detail-field--full">
                <span className="admin-page__request-detail-label">Comentario</span>
                <div className="admin-page__request-detail-value admin-page__request-detail-value--comment">{request.comment}</div>
              </div>
            ) : null}
          </section>

          <footer>
            <div className="admin-page__action-group" aria-label="Acciones sobre solicitud">
              <h3>Gestionar solicitud</h3>
              <div>
                <button
                  className="admin-page__action-button admin-page__action-button--reviewed"
                  type="button"
                  disabled={isPending || request.status === 'reviewed'}
                  onClick={() => onStatusAction(request, 'reviewed')}
                >
                  Marcar revisada
                </button>
                <button
                  className="admin-page__action-button admin-page__action-button--approve"
                  type="button"
                  disabled={isPending || request.status === 'approved'}
                  onClick={() => onStatusAction(request, 'approved')}
                >
                  Aprobar
                </button>
                <button
                  className="admin-page__action-button admin-page__action-button--reject"
                  type="button"
                  disabled={isPending || request.status === 'rejected'}
                  onClick={() => onStatusAction(request, 'rejected')}
                >
                  Rechazar
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}

export function AdminRequestsPage() {
  const { isAdmin, isAuthenticated, isLoading, session, user, profile } = useAuth();
  const [requests, setRequests] = useState<readonly ModelRequestType[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});
  const [requestFilters, setRequestFilters] = useState<AdminRequestsFilters>(defaultRequestsFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const selectedRequestStatuses = requestFilters.statuses.join('|');
  const selectedRequestSources = requestFilters.sources.join('|');

  const authContext = useMemo<ModelRequestAuthContext | null>(() => (
    user?.id && session?.access_token ? { accessToken: session.access_token, userId: user.id } : null
  ), [session?.access_token, user?.id]);

  const loadRequests = useCallback(() => {
    if (!authContext || !isAdmin) {
      return;
    }

    setIsLoadingRequests(true);
    setError(null);

    const serviceFilters: ModelRequestFilters = {
      ...(requestFilters.statuses.length > 0 ? { statuses: requestFilters.statuses } : {}),
      ...(requestFilters.sources.length > 0 ? { sources: requestFilters.sources } : {}),
      ...(requestFilters.search ? { search: requestFilters.search } : {}),
      ...(requestFilters.createdFrom ? { createdFrom: requestFilters.createdFrom } : {}),
      ...(requestFilters.createdTo ? { createdTo: requestFilters.createdTo } : {}),
    };

    getAllModelRequests(authContext, serviceFilters)
      .then((nextRequests) => setRequests(nextRequests))
      .catch(() => {
        setRequests([]);
        setError('No se pudieron cargar las solicitudes.');
      })
      .finally(() => setIsLoadingRequests(false));
  }, [authContext, isAdmin, requestFilters]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedRequestStatuses,
    selectedRequestSources,
    requestFilters.search,
    requestFilters.createdFrom,
    requestFilters.createdTo,
  ]);

  useEffect(() => {
    setExpandedRequests({});
  }, [currentPage]);

  useEffect(() => {
    if (!isFilterPanelOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterPanelOpen]);

  const requestActionNotices: Record<Exclude<ModelRequestStatusType, 'pending'>, string> = {
    reviewed: 'Solicitud marcada como revisada.',
    approved: 'Solicitud aprobada.',
    rejected: 'Solicitud rechazada.',
  };

  const totalRequests = requests.length;
  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'pending').length,
    [requests],
  );
  const totalPages = Math.max(1, Math.ceil(totalRequests / REQUESTS_PER_PAGE));
  const rangeStart = totalRequests > 0 ? ((currentPage - 1) * REQUESTS_PER_PAGE) + 1 : 0;
  const rangeEnd = totalRequests > 0 ? Math.min(currentPage * REQUESTS_PER_PAGE, totalRequests) : 0;
  const paginatedRequests = useMemo(
    () => requests.slice((currentPage - 1) * REQUESTS_PER_PAGE, currentPage * REQUESTS_PER_PAGE),
    [currentPage, requests],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(nextPage);
  };

  const handleRequestStatus = async (request: ModelRequestType, status: Exclude<ModelRequestStatusType, 'pending'>) => {
    if (!authContext) {
      return;
    }

    setPendingAction(`${request.id}:request:${status}`);
    setNotice(null);
    setError(null);

    try {
      await updateModelRequestStatusService(request.id, status, authContext);
      setRequests((currentRequests) => currentRequests.map((currentRequest) => (
        currentRequest.id === request.id ? { ...currentRequest, status } : currentRequest
      )));
      setNotice(requestActionNotices[status]);
    } catch {
      setError('No se pudo completar la acción sobre la solicitud.');
    } finally {
      setPendingAction(null);
    }
  };

  const toggleRequestCard = (requestId: string) => {
    setExpandedRequests((currentState) => ({
      ...currentState,
      [requestId]: !currentState[requestId],
    }));
  };

  return (
    <AdminGate>
      <PageHero
        className="admin-page__community-hero admin-page__hero"
        titleId="admin-requests-page-title"
        imageSrc={adminHeroImage}
        eyebrow="ADMIN STUDIO"
        title="Solicitudes de modelos"
        description="Gestiona las solicitudes de nuevos modelos enviadas por la comunidad."
      >
        <div className="admin-page__hero-meta">
          <div className="admin-page__admin-chip" aria-label="Administrador activo">
            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
            {getDisplayName(profile?.displayName, user?.email)}
          </div>
        </div>
      </PageHero>

      <main className="account-page admin-page" aria-labelledby="admin-requests-page-title">
        <section className="account-page__dashboard admin-page__layout">
          <AdminRequestsFilterSidebar
            filters={requestFilters}
            isOpen={isFilterPanelOpen}
            onApplyFilters={() => setIsFilterPanelOpen(false)}
            onChange={(next) => {
              setRequestFilters((current) => ({ ...current, ...next }));
            }}
            onClearFilters={() => {
              setRequestFilters(defaultRequestsFilters);
              setCurrentPage(1);
              setExpandedRequests({});
            }}
            onClose={() => setIsFilterPanelOpen(false)}
          />
          <div className="account-page__main">
            <section className="account-page__section" aria-labelledby="admin-requests-list-title">
              <div className="account-page__section-header">
                <div>
                  <span>Model requests</span>
                  <h2 id="admin-requests-list-title">
                    <span className="material-symbols-outlined" aria-hidden="true">fact_check</span>
                    Solicitudes de modelos
                  </h2>
                </div>
                <div className="admin-page__mobile-filter-trigger">
                  <button type="button" aria-label="Abrir filtros de solicitudes" onClick={() => setIsFilterPanelOpen(true)}>
                    <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                    Filtros
                  </button>
                </div>
              </div>

              {notice ? <p className="admin-page__notice-message" role="status">{notice}</p> : null}
              {error ? (
                <article className="account-page__empty-state account-page__empty-state--error" role="alert">
                  <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">error</span>
                  <h3>{error}</h3>
                  <button className="account-page__button" type="button" onClick={loadRequests}>Reintentar</button>
                </article>
              ) : isLoading || (isAuthenticated && isLoadingRequests) ? (
                <p className="admin-page__loading" role="status">Cargando solicitudes...</p>
              ) : requests.length === 0 ? (
                <article className="account-page__empty-state">
                  <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">fact_check</span>
                  <h3>No hay solicitudes con estos filtros.</h3>
                </article>
              ) : (
                <>
                  <p className="admin-page__results-summary" aria-live="polite">
                    {totalRequests === 1
                      ? '1 solicitud cargada'
                      : `${totalRequests} solicitudes cargadas`}
                    {pendingCount > 0
                      ? ` · ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`
                      : ''}
                    {totalPages > 1
                      ? ` · Mostrando ${rangeStart}-${rangeEnd}`
                      : ''}
                  </p>
                  <div className="admin-page__report-list">
                    {paginatedRequests.map((req) => (
                      <AdminRequestCard
                        expanded={Boolean(expandedRequests[req.id])}
                        isPending={Boolean(pendingAction?.startsWith(`${req.id}:`))}
                        key={req.id}
                        onToggle={() => toggleRequestCard(req.id)}
                        onStatusAction={handleRequestStatus}
                        request={req}
                      />
                    ))}
                  </div>
                  <AccountPagination
                    ariaLabel="Paginación de solicitudes admin"
                    className="admin-page__pagination"
                    currentClassName="admin-page__pagination-current"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                </>
              )}
            </section>
          </div>
        </section>
      </main>
    </AdminGate>
  );
}

export function AdminModerationPage() {
  const { isAdmin, isAuthenticated, isLoading, session, user, profile } = useAuth();
  const [filters, setFilters] = useState<AdminFilters>(defaultFilters);
  const [reports, setReports] = useState<readonly AdminReviewReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [moderationTab, setModerationTab] = useState<'reports' | 'replies'>('reports');
  const [replies, setReplies] = useState<readonly AdminReviewReply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [repliesNotice, setRepliesNotice] = useState<string | null>(null);
  const [reviewAspects, setReviewAspects] = useState<ReviewAspectsMap>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const authContext = useMemo<CreateReviewAuthContext | null>(() => (
    user?.id && session?.access_token ? { accessToken: session.access_token, userId: user.id } : null
  ), [session?.access_token, user?.id]);
  const totalReports = reports.length;
  const totalPages = Math.max(1, Math.ceil(totalReports / REPORTS_PER_PAGE));
  const rangeStart = totalReports > 0 ? ((currentPage - 1) * REPORTS_PER_PAGE) + 1 : 0;
  const rangeEnd = totalReports > 0 ? Math.min(currentPage * REPORTS_PER_PAGE, totalReports) : 0;
  const paginatedReports = useMemo(
    () => reports.slice((currentPage - 1) * REPORTS_PER_PAGE, currentPage * REPORTS_PER_PAGE),
    [currentPage, reports],
  );

  useEffect(() => {
    if (!isFilterPanelOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterPanelOpen]);

  const loadReports = useCallback(() => {
    if (!authContext || !isAdmin) {
      return;
    }

    setIsLoadingReports(true);
    setError(null);
    getReviewReports(authContext, filters)
      .then((nextReports) => setReports(nextReports))
      .catch(() => {
        setReports([]);
        setError('No se pudieron cargar los reportes.');
      })
      .finally(() => setIsLoadingReports(false));
  }, [authContext, filters, isAdmin]);

  const loadReplies = useCallback(() => {
    if (!authContext || !isAdmin) {
      return;
    }

    setIsLoadingReplies(true);
    setRepliesError(null);
    getAdminPendingReplies(authContext)
      .then((nextReplies) => setReplies(nextReplies))
      .catch(() => {
        setReplies([]);
        setRepliesError('No se pudieron cargar las respuestas pendientes.');
      })
      .finally(() => setIsLoadingReplies(false));
  }, [authContext, isAdmin]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const reportReviewIds = useMemo(() => {
    return [...new Set(reports.map((r) => r.review?.id).filter(Boolean))] as string[];
  }, [reports]);

  useEffect(() => {
    if (reportReviewIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    getReviewAspectsByReviewIds(reportReviewIds, authContext)
      .then((aspects) => {
        if (!isMounted) {
          return;
        }
        const grouped: ReviewAspectsMap = {};
        for (const aspect of aspects) {
          if (!grouped[aspect.reviewId]) {
            grouped[aspect.reviewId] = [];
          }
          grouped[aspect.reviewId] = [...grouped[aspect.reviewId]!, aspect];
        }
        setReviewAspects((current) => ({ ...current, ...grouped }));
      })
      .catch(() => {
        if (isMounted) {
          setReviewAspects({});
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reportReviewIds.join('|'), authContext?.accessToken, authContext?.userId]);

  useEffect(() => {
    if (moderationTab === 'replies') {
      loadReplies();
    }
  }, [moderationTab, loadReplies]);

  const replyReviewIds = useMemo(() => {
    return [...new Set(replies.map((r) => r.reviewId).filter(Boolean))] as string[];
  }, [replies]);

  useEffect(() => {
    if (replyReviewIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    getReviewAspectsByReviewIds(replyReviewIds, authContext)
      .then((aspects) => {
        if (!isMounted) {
          return;
        }
        const grouped: ReviewAspectsMap = {};
        for (const aspect of aspects) {
          if (!grouped[aspect.reviewId]) {
            grouped[aspect.reviewId] = [];
          }
          grouped[aspect.reviewId] = [...grouped[aspect.reviewId]!, aspect];
        }
        setReviewAspects((current) => ({ ...current, ...grouped }));
      })
      .catch(() => {
        if (isMounted) {
          setReviewAspects({});
        }
      });

    return () => {
      isMounted = false;
    };
  }, [replyReviewIds.join('|'), authContext?.accessToken, authContext?.userId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setExpandedReports({});
  }, [currentPage]);

  const updateFilters = (next: Partial<AdminFilters>) => {
    setFilters((currentFilters) => ({ ...currentFilters, ...next }));
    setCurrentPage(1);
    setExpandedReports({});
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
    setExpandedReports({});
  };

  const applyFilters = () => {
    setIsFilterPanelOpen(false);
  };

  const toggleReportCard = (reportId: string) => {
    setExpandedReports((currentState) => ({
      ...currentState,
      [reportId]: !currentState[reportId],
    }));
  };

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(nextPage);
  };

  const reportActionNotices: Record<Exclude<ReviewReportStatus, 'pending'>, string> = {
    reviewed: 'Reporte marcado como revisado.',
    dismissed: 'Reporte descartado.',
    action_taken: 'Reporte marcado como resuelto.',
  };

  const reviewActionNotices: Record<Exclude<MotorcycleReviewStatus, 'pending'>, string> = {
    hidden: 'Review ocultada y reporte marcado como resuelto.',
    approved: 'Review aprobada y reporte marcado como resuelto.',
    rejected: 'Review rechazada y reporte marcado como resuelto.',
  };

  const replyActionNotices: Record<Exclude<ReviewReplyStatus, 'pending'>, string> = {
    hidden: 'Respuesta oculta.',
    approved: 'Respuesta aprobada.',
    rejected: 'Respuesta rechazada.',
  };

  const handleReportStatus = async (report: AdminReviewReport, status: Exclude<ReviewReportStatus, 'pending'>) => {
    if (!authContext) {
      return;
    }

    setPendingAction(`${report.id}:report:${status}`);
    setNotice(null);
    setError(null);

    try {
      await updateReviewReportStatus(report.id, status, authContext);
      setReports((currentReports) => currentReports.map((currentReport) => (
        currentReport.id === report.id ? { ...currentReport, status } : currentReport
      )));
      setNotice(reportActionNotices[status]);
    } catch {
      setError('No se pudo completar la acción de moderación.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleReviewStatus = async (report: AdminReviewReport, status: Exclude<MotorcycleReviewStatus, 'pending'>) => {
    if (!authContext || !report.review) {
      return;
    }

    setPendingAction(`${report.id}:review:${status}`);
    setNotice(null);
    setError(null);

    try {
      await resolveReportWithReviewStatus(report.id, report.review.id, status, authContext);
      setReports((currentReports) => currentReports.map((currentReport) => (
        currentReport.id === report.id && currentReport.review
          ? { ...currentReport, status: 'action_taken', review: { ...currentReport.review, status } }
          : currentReport
      )));
      setNotice(reviewActionNotices[status]);
    } catch {
      setError('No se pudo completar la acción de moderación.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleReplyStatus = async (reply: AdminReviewReply, status: Exclude<ReviewReplyStatus, 'pending'>) => {
    if (!authContext) {
      return;
    }

    setPendingAction(`${reply.id}:reply:${status}`);
    setRepliesNotice(null);
    setRepliesError(null);

    try {
      await updateReviewReplyStatus(reply.id, status, authContext);
      setReplies((currentReplies) => currentReplies.filter((currentReply) => currentReply.id !== reply.id));
      setRepliesNotice(replyActionNotices[status]);
    } catch {
      setRepliesError('No se pudo completar la acción de moderación.');
    } finally {
      setPendingAction(null);
    }
  };

  const toggleReplyCard = (replyId: string) => {
    setExpandedReplies((currentState) => ({
      ...currentState,
      [replyId]: !currentState[replyId],
    }));
  };

  return (
    <AdminGate>
        <PageHero
          className="admin-page__community-hero admin-page__hero"
          titleId="admin-moderation-title"
          imageSrc={adminHeroImage}
          eyebrow="ADMIN STUDIO"
          title="Moderación"
          description="Revisa reportes de la comunidad y gestiona el estado de las reviews."
        >
          <div className="admin-page__hero-meta">
            <div className="admin-page__admin-chip" aria-label="Administrador activo">
              <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
              {getDisplayName(profile?.displayName, user?.email)}
            </div>
          </div>
        </PageHero>

        <main className="account-page admin-page" aria-labelledby="admin-moderation-title">
          <section className="account-page__dashboard admin-page__layout">
          <AdminModerationSidebar
            filters={filters}
            isOpen={isFilterPanelOpen}
            onApplyFilters={applyFilters}
            onChange={updateFilters}
            onClearFilters={clearFilters}
            onClose={() => setIsFilterPanelOpen(false)}
          />
          <div className="account-page__main">
            <section className="account-page__section admin-page__moderation" aria-labelledby="admin-moderation-reports-title">
              <div className="admin-page__tab-bar" role="tablist" aria-label="Secciones de moderación">
                <button
                  aria-selected={moderationTab === 'reports'}
                  className={`admin-page__tab${moderationTab === 'reports' ? ' admin-page__tab--active' : ''}`}
                  id="admin-tab-reports"
                  onClick={() => setModerationTab('reports')}
                  role="tab"
                  type="button"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">flag</span>
                  Reportes de reviews
                </button>
                <button
                  aria-selected={moderationTab === 'replies'}
                  className={`admin-page__tab${moderationTab === 'replies' ? ' admin-page__tab--active' : ''}`}
                  id="admin-tab-replies"
                  onClick={() => setModerationTab('replies')}
                  role="tab"
                  type="button"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">forum</span>
                  Respuestas pendientes
                </button>
              </div>

              {moderationTab === 'reports' ? (
                <>
                  <div className="account-page__section-header">
                    <div>
                      <span>Review reports</span>
                      <h2 id="admin-moderation-reports-title">
                        <span className="material-symbols-outlined" aria-hidden="true">flag</span>
                        Reportes de reviews
                      </h2>
                    </div>
                    <div className="admin-page__mobile-filter-trigger">
                      <button type="button" aria-label="Abrir filtros de moderación" onClick={() => setIsFilterPanelOpen(true)}>
                        <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                        Filtros
                      </button>
                    </div>
                  </div>

                  {notice ? <p className="admin-page__notice-message" role="status">{notice}</p> : null}
                  {error ? (
                    <article className="account-page__empty-state account-page__empty-state--error" role="alert">
                      <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">error</span>
                      <h3>{error}</h3>
                      <button className="account-page__button" type="button" onClick={loadReports}>Reintentar</button>
                    </article>
                  ) : isLoading || (isAuthenticated && isLoadingReports) ? (
                    <p className="admin-page__loading" role="status">Cargando reportes...</p>
                  ) : reports.length === 0 ? (
                    <article className="account-page__empty-state">
                      <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">flag</span>
                      <h3>No hay reportes con estos filtros.</h3>
                    </article>
                  ) : (
                    <>
                      <p className="admin-page__results-summary" aria-live="polite">
                        Mostrando {rangeStart}-{rangeEnd} de {totalReports} reportes
                      </p>
                      <div className="admin-page__report-list">
                        {paginatedReports.map((report) => (
                          <AdminReportCard
                            aspects={report.review ? reviewAspects[report.review.id] : undefined}
                            isExpanded={Boolean(expandedReports[report.id])}
                            isPending={Boolean(pendingAction?.startsWith(`${report.id}:`))}
                            key={report.id}
                            onToggle={() => toggleReportCard(report.id)}
                            onReportStatus={handleReportStatus}
                            onReviewStatus={handleReviewStatus}
                            report={report}
                          />
                        ))}
                      </div>
                      <AccountPagination
                        ariaLabel="Paginación de reportes admin"
                        className="admin-page__pagination"
                        currentClassName="admin-page__pagination-current"
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="account-page__section-header">
                    <div>
                      <span>Reply moderation</span>
                      <h2 id="admin-moderation-replies-title">
                        <span className="material-symbols-outlined" aria-hidden="true">forum</span>
                        Respuestas pendientes
                      </h2>
                    </div>
                  </div>

                  {repliesNotice ? <p className="admin-page__notice-message" role="status">{repliesNotice}</p> : null}
                  {repliesError ? (
                    <article className="account-page__empty-state account-page__empty-state--error" role="alert">
                      <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">error</span>
                      <h3>{repliesError}</h3>
                      <button className="account-page__button" type="button" onClick={loadReplies}>Reintentar</button>
                    </article>
                  ) : isLoading || (isAuthenticated && isLoadingReplies) ? (
                    <p className="admin-page__loading" role="status">Cargando respuestas...</p>
                  ) : replies.length === 0 ? (
                    <article className="account-page__empty-state">
                      <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">forum</span>
                      <h3>No hay respuestas pendientes de moderación.</h3>
                    </article>
                  ) : (
                    <>
                      <p className="admin-page__results-summary" aria-live="polite">
                        {replies.length} respuesta{replies.length !== 1 ? 's' : ''} pendiente{replies.length !== 1 ? 's' : ''}
                      </p>
                      <div className="admin-page__report-list">
                        {replies.map((reply) => (
                          <AdminReplyCard
                            aspects={reviewAspects[reply.reviewId]}
                            expanded={Boolean(expandedReplies[reply.id])}
                            isPending={Boolean(pendingAction?.startsWith(`${reply.id}:`))}
                            key={reply.id}
                            onApprove={() => handleReplyStatus(reply, 'approved')}
                            onHide={() => handleReplyStatus(reply, 'hidden')}
                            onReject={() => handleReplyStatus(reply, 'rejected')}
                            onToggle={() => toggleReplyCard(reply.id)}
                            reply={reply}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        </section>
      </main>
    </AdminGate>
  );
}
