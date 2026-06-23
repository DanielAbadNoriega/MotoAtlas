import { useCallback, useEffect, useMemo, useState } from 'react';
import adminHeroImage from '../../../assets/hero-admin.png';
import { useAuth } from '../../../features/auth';
import {
  getAllModelRequests,
  updateModelRequestStatus as updateModelRequestStatusService,
  type ModelRequest as ModelRequestType,
  type ModelRequestAuthContext,
  type ModelRequestFilters,
  type ModelRequestStatus as ModelRequestStatusType,
} from '../../../services/modelRequestService';
import { FilterGroup } from '../../../shared/ui/filters/FilterGroup';
import { FilterOptionButton } from '../../../shared/ui/filters/FilterOptionButton';
import { PageHero } from '../../ui/PageHero';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { AccountQuickLinksNav } from '../AccountPage/AccountQuickLinksNav';
import { AdminGate } from './adminSharedUi';
import { getDisplayName } from './adminPageUtils';
import {
  requestsDateFormatter,
  requestSourceLabels,
  requestSourceOptions,
  requestStatusLabels,
  requestStatusOptions,
  REQUESTS_PER_PAGE,
  type RequestStatusFilterValue,
  type RequestStatusOption,
  type RequestSourceFilterValue,
  type RequestSourceOption,
} from './adminPageConstants';
import '../AccountPage/AccountPage.scss';
import './AdminPage.scss';


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
