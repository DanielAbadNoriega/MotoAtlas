import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../../../features/auth';
import {
  getReviewReports,
  resolveReportWithReviewStatus,
  updateReviewReportStatus,
  type AdminReportReasonFilter,
  type AdminReportSort,
  type AdminReportStatusFilter,
  type AdminReviewReport,
} from '../../../services/adminModerationService';
import type { CreateReviewAuthContext, MotorcycleReviewStatus } from '../../../services/motorcycleReviewService';
import type { ReviewReportReason, ReviewReportStatus } from '../../../services/reviewReportService';
import '../AccountPage/AccountPage.scss';
import './AdminPage.scss';

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

type AdminFilterSectionId = 'reason' | 'sort' | 'status';

const defaultFilters: AdminFilters = {
  reason: 'all',
  sort: 'recent',
  status: 'pending',
};

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

function hasActiveFilters(filters: AdminFilters) {
  return filters.reason !== defaultFilters.reason
    || filters.sort !== defaultFilters.sort
    || filters.status !== defaultFilters.status;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha pendiente' : dateFormatter.format(date);
}

function getDisplayName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Admin MotoAtlas';
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

function AdminSidebar({ active }: Readonly<{ active: 'dashboard' | 'moderation' }>) {
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
      </nav>
    </aside>
  );
}

function AdminHero({ subtitle, title }: Readonly<{ subtitle: string; title: string }>) {
  const { profile, user } = useAuth();

  return (
    <header className="account-page__hero admin-page__hero">
      <div className="account-page__hero-content">
        <div>
          <span className="account-page__eyebrow">Admin MotoAtlas</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="admin-page__admin-chip" aria-label="Administrador activo">
          <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
          {getDisplayName(profile?.displayName, user?.email)}
        </div>
      </div>
    </header>
  );
}

export function AdminDashboardPage() {
  return (
    <AdminGate>
      <main className="account-page admin-page" aria-labelledby="admin-dashboard-title">
        <AdminHero
          title="Panel admin"
          subtitle="Primer panel privado para revisar señales de comunidad y preparar moderación."
        />

        <section className="account-page__dashboard">
          <AdminSidebar active="dashboard" />
          <div className="account-page__main">
            <section className="admin-page__dashboard-grid" aria-labelledby="admin-dashboard-title">
              <article className="account-page__card admin-page__summary-card">
                <span className="material-symbols-outlined" aria-hidden="true">flag</span>
                <h2 id="admin-dashboard-title">Reportes pendientes</h2>
                <p>Revisá reportes de reviews, actualizá su estado y actuá sobre la review si corresponde.</p>
                <a className="account-page__button" href="#/admin/moderacion">Ir a moderación</a>
              </article>
              <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                <h2>Reviews pendientes</h2>
                <p>Panel específico pendiente para una fase posterior.</p>
              </article>
              <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
                <span className="material-symbols-outlined" aria-hidden="true">fact_check</span>
                <h2>Solicitudes pendientes</h2>
                <p>Moderación de solicitudes queda fuera de esta fase.</p>
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
  options,
  sectionId,
  value,
}: Readonly<{
  isOpen: boolean;
  label: string;
  onChange: (value: T) => void;
  onToggle: () => void;
  options: readonly AdminFilterOption<T>[];
  sectionId: AdminFilterSectionId;
  value: T;
}>) {
  const sectionContentId = `admin-filters-${sectionId}-content`;

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
        <div className="admin-page__filter-options">
          {options.map((option) => (
            <button
              className={value === option.value ? 'admin-page__filter-option admin-page__filter-option--active' : 'admin-page__filter-option'}
              type="button"
              aria-label={`${label}: ${option.label}`}
              aria-pressed={value === option.value}
              key={option.value}
              onClick={() => onChange(option.value)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
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
  isExpanded,
  isPending,
  onToggle,
  onReportStatus,
  onReviewStatus,
  report,
}: Readonly<{
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

export function AdminModerationPage() {
  const { isAdmin, isAuthenticated, isLoading, session, user } = useAuth();
  const [filters, setFilters] = useState<AdminFilters>(defaultFilters);
  const [reports, setReports] = useState<readonly AdminReviewReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const authContext = useMemo<CreateReviewAuthContext | null>(() => (
    user?.id && session?.access_token ? { accessToken: session.access_token, userId: user.id } : null
  ), [session?.access_token, user?.id]);

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

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateFilters = (next: Partial<AdminFilters>) => {
    setFilters((currentFilters) => ({ ...currentFilters, ...next }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
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

  return (
    <AdminGate>
      <main className="account-page admin-page" aria-labelledby="admin-moderation-title">
        <AdminHero
          title="Moderación"
          subtitle="Revisa reportes de la comunidad y gestiona el estado de las reviews."
        />

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
            <section className="account-page__section admin-page__moderation" aria-labelledby="admin-moderation-title">
              <div className="account-page__section-header">
                <div>
                  <span>Review reports</span>
                  <h2 id="admin-moderation-title">
                    <span className="material-symbols-outlined" aria-hidden="true">flag</span>
                    Reportes de reviews
                  </h2>
                </div>
                <button
                  className="admin-page__mobile-filter-trigger"
                  type="button"
                  aria-label="Abrir filtros de moderación"
                  onClick={() => setIsFilterPanelOpen(true)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                  Filtros
                </button>
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
                <div className="admin-page__report-list">
                  {reports.map((report) => (
                    <AdminReportCard
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
              )}
            </section>
          </div>
        </section>
      </main>
    </AdminGate>
  );
}
