import { useCallback, useEffect, useMemo, useState } from 'react';
import adminHeroImage from '../../../assets/hero-admin.png';
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
import {
  getAdminPendingReplies,
  updateReviewReplyStatus,
  type AdminReviewReply,
} from '../../../services/adminReplyService';
import {
  getReviewAspectsByReviewIds,
  type MotorcycleReviewAspect,
  type MotorcycleReviewStatus,
} from '../../../services/motorcycleReviewService';
import type { ReviewReplyStatus } from '../../../services/reviewReplyService';
import type { ReviewReportStatus } from '../../../services/reviewReportService';
import { FilterGroup } from '../../../shared/ui/filters/FilterGroup';
import { FilterOptionButton } from '../../../shared/ui/filters/FilterOptionButton';
import { PageHero } from '../../ui/PageHero';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { AccountQuickLinksNav } from '../AccountPage/AccountQuickLinksNav';
import { ReviewAspectSummary } from '../../reviews/ReviewAspectSummary';
import { AdminGate, AdminSidebar, ReviewStatusBadge } from './adminSharedUi';
import { formatDate, getDisplayName, normalizeTextList } from './adminPageUtils';
import {
  reasonLabels,
  reasonOptions,
  reportStatusLabels,
  reportStatusOptions,
  reviewStatusLabels,
  reviewStatusOptions,
  sortOptions,
  REPORTS_PER_PAGE,
} from './adminPageConstants';
import '../AccountPage/AccountPage.scss';
import './AdminPage.scss';

type ReviewAspectsMap = Record<string, readonly MotorcycleReviewAspect[]>;

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

function hasActiveFilters(filters: AdminFilters) {
  return filters.reason !== defaultFilters.reason
    || filters.sort !== defaultFilters.sort
    || filters.status !== defaultFilters.status;
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

function ReportStatusBadge({ status }: Readonly<{ status: ReviewReportStatus }>) {
  return <span className="admin-page__status-pill" data-status={status}>{reportStatusLabels[status]}</span>;
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
  const authContext = useMemo(() => (
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
