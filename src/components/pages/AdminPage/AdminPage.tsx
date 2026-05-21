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
  { label: 'Pendientes', value: 'pending' },
  { label: 'Revisados', value: 'reviewed' },
  { label: 'Descartados', value: 'dismissed' },
  { label: 'Resueltos', value: 'action_taken' },
  { label: 'Todos', value: 'all' },
] satisfies readonly { label: string; value: AdminReportStatusFilter }[];

const reasonOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Spam', value: 'spam' },
  { label: 'Ofensivo', value: 'offensive' },
  { label: 'Información falsa', value: 'false_information' },
  { label: 'Acoso', value: 'harassment' },
  { label: 'Otro', value: 'other' },
] satisfies readonly { label: string; value: AdminReportReasonFilter }[];

const sortOptions = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Más antiguos', value: 'oldest' },
] satisfies readonly { label: string; value: AdminReportSort }[];

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
  label,
  onChange,
  options,
  value,
}: Readonly<{
  label: string;
  onChange: (value: T) => void;
  options: readonly { label: string; value: T }[];
  value: T;
}>) {
  return (
    <div className="admin-page__filter-group">
      <h2>{label}</h2>
      <div>
        {options.map((option) => (
          <button
            className={value === option.value ? 'admin-page__filter-chip admin-page__filter-chip--active' : 'admin-page__filter-chip'}
            type="button"
            aria-pressed={value === option.value}
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminModerationSidebar({
  filters,
  onChange,
}: Readonly<{
  filters: AdminFilters;
  onChange: (next: Partial<AdminFilters>) => void;
}>) {
  return (
    <aside className="account-page__sidebar admin-page__sidebar" aria-label="Filtros de moderación">
      <nav className="account-page__quick-links" aria-label="Navegación de administración">
        <a className="account-page__quick-link" href="#/admin">Panel admin</a>
        <a className="account-page__quick-link account-page__quick-link--active" href="#/admin/moderacion" aria-current="page">Moderación</a>
      </nav>

      <section className="account-page__card admin-page__filters" aria-label="Filtros admin">
        <AdminFilterGroup label="Estado del reporte" options={reportStatusOptions} value={filters.status} onChange={(status) => onChange({ status })} />
        <AdminFilterGroup label="Motivo" options={reasonOptions} value={filters.reason} onChange={(reason) => onChange({ reason })} />
        <AdminFilterGroup label="Orden" options={sortOptions} value={filters.sort} onChange={(sort) => onChange({ sort })} />
      </section>

      <article className="account-page__notice admin-page__notice">
        <span className="material-symbols-outlined" aria-hidden="true">policy</span>
        <div>
          <p>Moderá sin borrar datos.</p>
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
  isPending,
  onReportStatus,
  onReviewStatus,
  report,
}: Readonly<{
  isPending: boolean;
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

  return (
    <article className="admin-page__report-card" data-testid="admin-report-card">
      <header>
        <div className="admin-page__report-heading">
          <div className="admin-page__reason-line">
            <ReportStatusBadge status={report.status} />
            <h2>{reasonLabels[report.reason]}</h2>
          </div>
          <p className="admin-page__reporter">
            Reportado por <strong title={report.reporterUserId}>{report.reporterDisplayName}</strong> · {formatDate(report.createdAt)}
          </p>
        </div>
      </header>

      <section className="admin-page__review-context">
        <h3>{motorcycleName}</h3>
        <p>
          Review de @{report.review?.userName || 'usuario'} · ★ {report.review?.rating ?? 'N/D'} ·{' '}
          {reviewStatus ? <ReviewStatusBadge status={reviewStatus} /> : reviewStatusLabel}
        </p>
      </section>

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
              className="admin-page__action-button admin-page__action-button--report-info"
              type="button"
              disabled={isPending || report.status === 'reviewed'}
              onClick={() => onReportStatus(report, 'reviewed')}
            >
              Marcar revisado
            </button>
            <button
              className="admin-page__action-button admin-page__action-button--report-danger"
              type="button"
              disabled={isPending || report.status === 'dismissed'}
              onClick={() => onReportStatus(report, 'dismissed')}
            >
              Descartar reporte
            </button>
            <button
              className="admin-page__action-button admin-page__action-button--report-success"
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
                className="admin-page__action-button admin-page__action-button--review-neutral"
                type="button"
                disabled={isPending || reviewStatus === 'hidden'}
                onClick={() => onReviewStatus(report, 'hidden')}
              >
                Ocultar
              </button>
              <button
                className="admin-page__action-button admin-page__action-button--review-success"
                type="button"
                disabled={isPending || reviewStatus === 'approved'}
                onClick={() => onReviewStatus(report, 'approved')}
              >
                Aprobar
              </button>
              <button
                className="admin-page__action-button admin-page__action-button--review-danger"
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
  const authContext = useMemo<CreateReviewAuthContext | null>(() => (
    user?.id && session?.access_token ? { accessToken: session.access_token, userId: user.id } : null
  ), [session?.access_token, user?.id]);

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
          <AdminModerationSidebar filters={filters} onChange={updateFilters} />
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
                      isPending={Boolean(pendingAction?.startsWith(`${report.id}:`))}
                      key={report.id}
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
