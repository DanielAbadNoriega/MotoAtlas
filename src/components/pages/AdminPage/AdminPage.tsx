import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import adminHeroImage from '../../../assets/hero-admin.png';
import { useAuth } from '../../../features/auth';
import { findBikeById, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
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
import type { ReviewReplyStatus } from '../../../services/reviewReplyService';
import type { ReviewReportReason, ReviewReportStatus } from '../../../services/reviewReportService';
import {
  matchesMotorcycleSegmentFilter,
  motorcycleLicenseFilterOptions,
  motorcycleSegmentFilterOptions,
  type MotorcycleSegmentFilterValue,
} from '../../../shared/filters/motorcycleFilterOptions';
import { getBikeA2Status, type BikeA2Status } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { CommunityHero } from '../../ui/CommunityHero/CommunityHero';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { ReviewAspectSummary } from '../../reviews/ReviewAspectSummary';
import '../AccountPage/AccountPage.scss';
import './AdminPage.scss';

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

type AdminFilterSectionId = 'reason' | 'sort' | 'status' | 'source' | 'verified' | 'segment' | 'license' | 'ridingStyle';
type AdminSidebarActiveItem = 'dashboard' | 'moderation' | 'reviews' | 'requests';

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

export function AdminSidebar({ active, children }: Readonly<{ active: AdminSidebarActiveItem; children?: ReactNode }>) {
  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Navegación admin">
      <article className="account-page__notice admin-page__notice">
        <span className="material-symbols-outlined" aria-hidden="true">shield_person</span>
        <div>
          <p>Zona privada de administración.</p>
          <strong>Las acciones quedan protegidas por rol admin y RLS.</strong>
        </div>
      </article>

      <nav className="account-page__quick-links" aria-label="Navegación de administración">
        <a className={active === 'dashboard' ? 'account-page__quick-link account-page__quick-link--active' : 'account-page__quick-link'} href="#/admin" aria-current={active === 'dashboard' ? 'page' : undefined}>
          Panel admin
        </a>
        <a className={active === 'moderation' ? 'account-page__quick-link account-page__quick-link--active' : 'account-page__quick-link'} href="#/admin/moderacion" aria-current={active === 'moderation' ? 'page' : undefined}>
          Moderación
        </a>
        <a className={active === 'reviews' ? 'account-page__quick-link account-page__quick-link--active' : 'account-page__quick-link'} href="#/admin/reviews" aria-current={active === 'reviews' ? 'page' : undefined}>
          Reviews
        </a>
        <a className={active === 'requests' ? 'account-page__quick-link account-page__quick-link--active' : 'account-page__quick-link'} href="#/admin/solicitudes" aria-current={active === 'requests' ? 'page' : undefined}>
          Solicitudes
        </a>
        <a className="account-page__quick-link" href="#/cuenta">
          Mi cuenta
        </a>
      </nav>
      {children}
    </aside>
  );
}

// Nota: usamos `CommunityHero` para el hero en las páginas admin (estilos base
// compartidos). El chip de admin se inyecta como `children` cuando se necesita.

export function AdminDashboardPage() {
  const { profile, user } = useAuth();

  return (
    <AdminGate>
        <CommunityHero
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
        </CommunityHero>

        <main className="account-page admin-page" aria-labelledby="admin-dashboard-title">
          <section className="account-page__dashboard">
          <AdminSidebar active="dashboard" />
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

function AdminFilterGroup<T extends string>({
  isOpen,
  label,
  onChange,
  onToggle,
  optionClassName,
  options,
  optionsClassName,
  sectionId,
  value,
}: Readonly<{
  isOpen: boolean;
  label: string;
  onChange: (value: T) => void;
  onToggle: () => void;
  optionClassName?: string;
  options: readonly AdminFilterOption<T>[];
  optionsClassName?: string;
  sectionId: AdminFilterSectionId;
  value: T;
}>) {
  const sectionContentId = `admin-filters-${sectionId}-content`;
  const containerClasses = ['admin-page__filter-options', optionsClassName].filter(Boolean).join(' ');

  return (
    <section className={isOpen ? 'admin-page__filter-group admin-page__filter-group--open' : 'admin-page__filter-group'} aria-label={label}>
      <h3>
        <button
          className="admin-page__filter-group-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls={sectionContentId}
          onClick={onToggle}
        >
          <span>{label}</span>
          <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
        </button>
      </h3>
      <div id={sectionContentId} className="admin-page__filter-group-body" aria-hidden={!isOpen} inert={!isOpen}>
        <div className={containerClasses}>
          {options.map((option) => {
            const buttonClasses = [
              'admin-page__filter-option',
              value === option.value ? 'admin-page__filter-option--active' : '',
              optionClassName ?? '',
            ].filter(Boolean).join(' ');
            return (
              <button
                className={buttonClasses}
                type="button"
                aria-label={`${label}: ${option.label}`}
                aria-pressed={value === option.value}
                key={option.value}
                onClick={() => onChange(option.value)}
              >
                {option.icon ? <span className="material-symbols-outlined" aria-hidden="true">{option.icon}</span> : null}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
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
  const [filterSectionsOpenState, setFilterSectionsOpenState] = useState<Record<AdminFilterSectionId, boolean>>({
    status: true,
    reason: false,
    sort: false,
    source: false,
    verified: false,
    segment: false,
    license: false,
    ridingStyle: false,
  });

  const toggleFilterSection = (sectionId: AdminFilterSectionId) => {
    setFilterSectionsOpenState((currentState) => ({
      ...currentState,
      [sectionId]: !currentState[sectionId],
    }));
  };

  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Filtros de moderación">
      <nav className="account-page__quick-links" aria-label="Navegación de administración">
        <a className="account-page__quick-link" href="#/admin">Panel admin</a>
        <a className="account-page__quick-link account-page__quick-link--active" href="#/admin/moderacion" aria-current="page">Moderación</a>
        <a className="account-page__quick-link" href="#/admin/reviews">Reviews</a>
        <a className="account-page__quick-link" href="#/admin/solicitudes">Solicitudes</a>
        <a className="account-page__quick-link" href="#/cuenta">Mi cuenta</a>
      </nav>

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
          <AdminFilterGroup
            sectionId="status"
            isOpen={filterSectionsOpenState.status}
            label="Estado del reporte"
            options={reportStatusOptions}
            value={filters.status}
            onToggle={() => toggleFilterSection('status')}
            onChange={(status) => onChange({ status })}
          />
          <AdminFilterGroup
            sectionId="reason"
            isOpen={filterSectionsOpenState.reason}
            label="Motivo"
            options={reasonOptions}
            value={filters.reason}
            onToggle={() => toggleFilterSection('reason')}
            onChange={(reason) => onChange({ reason })}
          />
          <AdminFilterGroup
            sectionId="sort"
            isOpen={filterSectionsOpenState.sort}
            label="Orden"
            options={sortOptions}
            value={filters.sort}
            onToggle={() => toggleFilterSection('sort')}
            onChange={(sort) => onChange({ sort })}
          />
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

  const [filterSectionsOpenState, setFilterSectionsOpenState] = useState<Record<AdminFilterSectionId, boolean>>({
    status: true,
    reason: false,
    source: false,
    verified: false,
    sort: false,
    segment: false,
    license: false,
    ridingStyle: false,
  });

  const toggleFilterSection = (sectionId: AdminFilterSectionId) => {
    setFilterSectionsOpenState((currentState) => ({
      ...currentState,
      [sectionId]: !currentState[sectionId],
    }));
  };

  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Filtros de reviews">
      <nav className="account-page__quick-links" aria-label="Navegación de administración">
        <a className="account-page__quick-link" href="#/admin">Panel admin</a>
        <a className="account-page__quick-link" href="#/admin/moderacion">Moderación</a>
        <a className="account-page__quick-link account-page__quick-link--active" href="#/admin/reviews" aria-current="page">Reviews</a>
        <a className="account-page__quick-link" href="#/cuenta">Mi cuenta</a>
      </nav>

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

          <AdminFilterGroup
            sectionId="status"
            isOpen={filterSectionsOpenState.status}
            label="Estado"
            options={reviewStatusOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.status}
            onToggle={() => toggleFilterSection('status')}
            onChange={(status) => onChange({ status: status as AdminReviewsFilters['status'] })}
          />

          <AdminFilterGroup
            sectionId="source"
            isOpen={filterSectionsOpenState.source}
            label="Origen"
            options={reviewSourceOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.source}
            onToggle={() => toggleFilterSection('source')}
            onChange={(source) => onChange({ source: source as AdminReviewsFilters['source'] })}
          />

          <AdminFilterGroup
            sectionId="segment"
            isOpen={filterSectionsOpenState.segment}
            label="Segmento"
            options={motorcycleSegmentFilterOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.segment}
            onToggle={() => toggleFilterSection('segment')}
            onChange={(segment) => onChange({ segment: segment as AdminReviewsFilters['segment'] })}
          />

          <AdminFilterGroup
            sectionId="verified"
            isOpen={filterSectionsOpenState.verified}
            label="Verificadas"
            options={reviewVerifiedOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.verified}
            onToggle={() => toggleFilterSection('verified')}
            onChange={(verified) => onChange({ verified: verified as AdminReviewsFilters['verified'] })}
          />

          <AdminFilterGroup
            sectionId="license"
            isOpen={filterSectionsOpenState.license}
            label="Carnet"
            options={adminLicenseOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.license}
            onToggle={() => toggleFilterSection('license')}
            onChange={(license) => onChange({ license: license as AdminReviewsFilters['license'] })}
          />

          <AdminFilterGroup
            sectionId="ridingStyle"
            isOpen={filterSectionsOpenState.ridingStyle}
            label="Uso principal"
            options={adminRidingStyleOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.ridingStyle}
            onToggle={() => toggleFilterSection('ridingStyle')}
            onChange={(ridingStyle) => onChange({ ridingStyle: ridingStyle as AdminReviewsFilters['ridingStyle'] })}
          />

          <AdminFilterGroup
            sectionId="sort"
            isOpen={filterSectionsOpenState.sort}
            label="Orden"
            options={reviewSortOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.sort}
            onToggle={() => toggleFilterSection('sort')}
            onChange={(sort) => onChange({ sort: sort as AdminReviewsFilters['sort'] })}
          />
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
        <CommunityHero
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
        </CommunityHero>

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

const requestStatusOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'pending', label: 'Pendientes', value: 'pending' },
  { icon: 'fact_check', label: 'Revisadas', value: 'reviewed' },
  { icon: 'task_alt', label: 'Aprobadas', value: 'approved' },
  { icon: 'cancel', label: 'Rechazadas', value: 'rejected' },
] as const;

const requestSourceOptions = [
  { icon: 'apps', label: 'Todas', value: 'all' },
  { icon: 'person', label: 'Usuario', value: 'user' },
  { icon: 'shield_person', label: 'Admin', value: 'admin' },
  { icon: 'cloud_upload', label: 'Import', value: 'import' },
] as const;

type AdminRequestsFilters = {
  status: ModelRequestStatusType | 'all';
  source: ModelRequestType['source'] | 'all';
  search: string;
};

const defaultRequestsFilters: AdminRequestsFilters = {
  status: 'all',
  source: 'all',
  search: '',
};

function hasActiveRequestsFilters(filters: AdminRequestsFilters) {
  return filters.status !== defaultRequestsFilters.status
    || filters.source !== defaultRequestsFilters.source
    || filters.search !== defaultRequestsFilters.search;
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
  const [filterSectionsOpenState, setFilterSectionsOpenState] = useState<Record<string, boolean>>({
    status: true,
    source: false,
  });

  const toggleFilterSection = (sectionId: string) => {
    setFilterSectionsOpenState((currentState) => ({
      ...currentState,
      [sectionId]: !currentState[sectionId],
    }));
  };

  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Filtros de solicitudes">
      <nav className="account-page__quick-links" aria-label="Navegación de administración">
        <a className="account-page__quick-link" href="#/admin">Panel admin</a>
        <a className="account-page__quick-link" href="#/admin/moderacion">Moderación</a>
        <a className="account-page__quick-link" href="#/admin/reviews">Reviews</a>
        <a className="account-page__quick-link account-page__quick-link--active" href="#/admin/solicitudes" aria-current="page">Solicitudes</a>
        <a className="account-page__quick-link" href="#/cuenta">Mi cuenta</a>
      </nav>

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

          <AdminFilterGroup
            sectionId="status"
            isOpen={filterSectionsOpenState.status}
            label="Estado"
            options={requestStatusOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.status}
            onToggle={() => toggleFilterSection('status')}
            onChange={(status) => onChange({ status: status as ModelRequestStatusType | 'all' })}
          />

          <AdminFilterGroup
            sectionId="source"
            isOpen={filterSectionsOpenState.source}
            label="Origen"
            options={requestSourceOptions as unknown as readonly AdminFilterOption<string>[]}
            value={filters.source}
            onToggle={() => toggleFilterSection('source')}
            onChange={(source) => onChange({ source: source as ModelRequestType['source'] | 'all' })}
          />
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
      ...(requestFilters.status !== 'all' ? { status: requestFilters.status } : {}),
      ...(requestFilters.source !== 'all' ? { source: requestFilters.source } : {}),
      ...(requestFilters.search ? { search: requestFilters.search } : {}),
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
      <CommunityHero
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
      </CommunityHero>

      <main className="account-page admin-page" aria-labelledby="admin-requests-page-title">
        <section className="account-page__dashboard admin-page__layout">
          <AdminRequestsFilterSidebar
            filters={requestFilters}
            isOpen={isFilterPanelOpen}
            onApplyFilters={() => setIsFilterPanelOpen(false)}
            onChange={(next) => {
              setRequestFilters((current) => ({ ...current, ...next }));
            }}
            onClearFilters={() => setRequestFilters(defaultRequestsFilters)}
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
                <div className="admin-page__report-list">
                  {requests.map((req) => (
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
        <CommunityHero
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
        </CommunityHero>

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
