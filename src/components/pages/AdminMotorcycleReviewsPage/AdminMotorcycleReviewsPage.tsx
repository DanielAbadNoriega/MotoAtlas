import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getBikeDetailHash } from '../../../data/bikes';
import { useAuth } from '../../../features/auth';
import {
  getReviewsByMotorcycleId,
  type MotorcycleReview,
  type MotorcycleReviewStatus,
} from '../../../services/motorcycleReviewService';
import { formatReviewRating, getReviewAggregate, isReviewVerified } from '../../../shared/reviews/reviewUtils';
import type { Bike } from '../../../types/bike';
import {
  accountReviewRidingStyleLabels,
  formatAccountReviewDate,
  formatAccountReviewKilometers,
  formatAccountReviewOwnershipMonths,
} from '../../reviews/AccountReviewCard/accountReviewPresentation';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { AdminSidebar } from '../AdminPage';
import '../AccountPage/AccountPage.scss';
import '../AccountReviewsPage/AccountReviewsPage.scss';
import '../AdminPage/AdminPage.scss';
import '../MotorcycleCommunityPage/MotorcycleCommunityPage.scss';
import './AdminMotorcycleReviewsPage.scss';

type Props = Readonly<{
  bike?: Bike;
  motorcycleId?: string;
}>;

type Filters = Readonly<{
  status: 'all' | MotorcycleReviewStatus;
  sort: 'recent' | 'old';
}>;

type AdminMotorcycleReviewsStatus = 'idle' | 'loading' | 'success' | 'error';

const REVIEWS_PER_PAGE = 6;
const defaultFilters: Filters = { status: 'all', sort: 'recent' };

const statusFilterOptions: readonly {
  icon: string;
  label: string;
  value: Filters['status'];
}[] = [
    { icon: 'apps', label: 'Todas', value: 'all' },
    { icon: 'pending', label: 'Pendientes', value: 'pending' },
    { icon: 'task_alt', label: 'Publicadas', value: 'approved' },
    { icon: 'cancel', label: 'Rechazadas', value: 'rejected' },
    { icon: 'block', label: 'Ocultas', value: 'hidden' },
  ];

const sortFilterOptions: readonly {
  icon: string;
  label: string;
  value: Filters['sort'];
}[] = [
    { icon: 'schedule', label: 'Más recientes', value: 'recent' },
    { icon: 'history', label: 'Más antiguas', value: 'old' },
  ];

const statusLabels: Record<MotorcycleReviewStatus, string> = {
  approved: 'Publicada',
  hidden: 'Oculta',
  pending: 'Pendiente',
  rejected: 'Rechazada',
};

function getTimestamp(value: string) {
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function normalizeList(value: readonly unknown[] | string | null | undefined) {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
    .filter((item) => item.length > 0 && item.toLowerCase() !== 'null' && item.toLowerCase() !== 'undefined');
}

function hasActiveFilters(filters: Filters) {
  return filters.status !== defaultFilters.status || filters.sort !== defaultFilters.sort;
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

function RatingStars({ rating }: Readonly<{ rating: number }>) {
  return (
    <span className="motorcycle-community__stars" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          className="material-symbols-outlined"
          data-filled={rating >= star ? 'true' : 'false'}
          key={star}
          aria-hidden="true"
        >
          star
        </span>
      ))}
    </span>
  );
}

function FilterChipButton<T extends string>({
  active,
  icon,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      className={active ? 'admin-page__filter-option admin-page__filter-option--active' : 'admin-page__filter-option'}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function AdminMotorcycleSidebar({
  filters,
  isFilterPanelOpen,
  onApplyFilters,
  onChangeFilters,
  onClearFilters,
  onCloseFilters,
  reviews,
  bike,
  motorcycleId,
}: Readonly<{
  filters: Filters;
  isFilterPanelOpen: boolean;
  onApplyFilters: () => void;
  onChangeFilters: (next: Partial<Filters>) => void;
  onClearFilters: () => void;
  onCloseFilters: () => void;
  reviews: readonly MotorcycleReview[];
  bike?: Bike;
  motorcycleId?: string;
}>) {
  const clearDisabled = !hasActiveFilters(filters);
  const onCloseRef = useRef(onCloseFilters);
  onCloseRef.current = onCloseFilters;

  const stateSummary = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const rejected = reviews.filter((r) => r.status === 'rejected').length;
    const hidden = reviews.filter((r) => r.status === 'hidden').length;
    return { approved, hidden, pending, rejected, total };
  }, [reviews]);

  useEffect(() => {
    if (!isFilterPanelOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterPanelOpen]);

  const panelClasses = ['admin-page__filters', isFilterPanelOpen ? 'admin-page__filters--open' : ''].filter(Boolean).join(' ');

  return (
    <AdminSidebar active="reviews">

      {isFilterPanelOpen ? <button className="admin-page__filters-backdrop" type="button" onClick={onCloseFilters} aria-label="Cerrar filtros" /> : null}

      <section
        className={panelClasses}
        aria-label="Filtros de reviews admin"
        aria-labelledby="admin-moto-filters-title"
        aria-modal={isFilterPanelOpen ? 'true' : undefined}
        role={isFilterPanelOpen ? 'dialog' : undefined}
      >
        <div className="admin-page__sheet-handle" aria-hidden="true" />
        <div className="admin-page__filters-header">
          <h2 id="admin-moto-filters-title">Filtros</h2>
          <button type="button" onClick={onClearFilters} disabled={clearDisabled}>Limpiar filtros</button>
          <button className="admin-page__filters-close" type="button" onClick={onCloseFilters} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="admin-page__filters-body">
          <section className="admin-page__filter-group admin-page__filter-group--open" aria-label="Estado">
            <h3>
              <button className="admin-page__filter-group-toggle" type="button" aria-expanded aria-disabled>
                <span>Estado</span>
                <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
              </button>
            </h3>
            <div className="admin-page__filter-group-body">
              <div className="admin-page__filter-options">
                {statusFilterOptions.map((option) => (
                  <FilterChipButton
                    active={filters.status === option.value}
                    icon={option.icon}
                    key={option.value}
                    label={option.label}
                    onClick={() => onChangeFilters({ status: option.value })}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="admin-page__filter-group admin-page__filter-group--open" aria-label="Orden">
            <h3>
              <button className="admin-page__filter-group-toggle" type="button" aria-expanded aria-disabled>
                <span>Orden</span>
                <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
              </button>
            </h3>
            <div className="admin-page__filter-group-body">
              <div className="admin-page__filter-options">
                {sortFilterOptions.map((option) => (
                  <FilterChipButton
                    active={filters.sort === option.value}
                    icon={option.icon}
                    key={option.value}
                    label={option.label}
                    onClick={() => onChangeFilters({ sort: option.value })}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

        <footer className="admin-page__filters-footer">
          <button type="button" onClick={onClearFilters} disabled={clearDisabled}>Limpiar filtros</button>
          <button type="button" onClick={onApplyFilters}>Aplicar filtros</button>
        </footer>
      </section>

      <article className="account-page__card" aria-label="Resumen de estados">
        <h3 className="admin-moto-reviews__summary-title">Estado de reviews</h3>
        <dl className="admin-moto-reviews__summary-grid">
          <div className="admin-moto-reviews__summary-item">
            <dt>Total</dt>
            <dd>{stateSummary.total}</dd>
          </div>
          <div className="admin-moto-reviews__summary-item admin-moto-reviews__summary-item--pending">
            <dt>Pendientes</dt>
            <dd>{stateSummary.pending}</dd>
          </div>
          <div className="admin-moto-reviews__summary-item admin-moto-reviews__summary-item--approved">
            <dt>Publicadas</dt>
            <dd>{stateSummary.approved}</dd>
          </div>
          <div className="admin-moto-reviews__summary-item admin-moto-reviews__summary-item--rejected">
            <dt>Rechazadas</dt>
            <dd>{stateSummary.rejected}</dd>
          </div>
          <div className="admin-moto-reviews__summary-item admin-moto-reviews__summary-item--hidden">
            <dt>Ocultas</dt>
            <dd>{stateSummary.hidden}</dd>
          </div>
        </dl>
      </article>
    </AdminSidebar>
  );
}

function ReviewStatusBadge({ status }: Readonly<{ status: MotorcycleReviewStatus }>) {
  return (
    <span className="admin-page__status-pill admin-page__status-pill--review" data-status={status}>
      {statusLabels[status]}
    </span>
  );
}

function ReviewSourceBadge({ source }: Readonly<{ source?: string | null }>) {
  return <span className="admin-moto-reviews__source-badge">{source ?? 'user'}</span>;
}

function AdminReviewCard({ index, review }: Readonly<{ index: number; review: MotorcycleReview }>) {
  const pros = normalizeList(review.pros as readonly unknown[]);
  const cons = normalizeList(review.cons as readonly unknown[]);
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = `admin-moto-review-details-${review.id}`;
  const cardClasses = [
    'admin-motorcycle-reviews-page__review-card',
    isExpanded ? 'admin-motorcycle-reviews-page__review-card--expanded' : '',
  ].filter(Boolean).join(' ');

  return (
    <article
      className={cardClasses}
      data-testid="admin-moto-review-row"
      data-row-tone={index % 2 === 0 ? 'even' : 'odd'}
    >
      <header>
        <button
          className="admin-motorcycle-reviews-page__review-card-toggle"
          type="button"
          aria-controls={detailsId}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Contraer' : 'Expandir'} review de ${review.userName || 'Anónimo'}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="admin-motorcycle-reviews-page__review-card-heading">
            <span className="admin-motorcycle-reviews-page__review-card-line">
              <span className="admin-motorcycle-reviews-page__review-card-row">
                <span className="admin-motorcycle-reviews-page__review-card-user">
                  {review.userName || 'Anónimo'}
                  {isReviewVerified(review) ? (
                    <span className="motorcycle-community__owner-verified-icon motorcycle-community__owner-verified-icon--verified" aria-label="Usuario verificado">
                      <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                    </span>
                  ) : (
                    <span className="motorcycle-community__owner-verified-icon motorcycle-community__owner-verified-icon--unverified" aria-label="Usuario no verificado">
                      <span className="material-symbols-outlined" aria-hidden="true">person</span>
                    </span>
                  )}
                </span>
              </span>
              <span className="admin-motorcycle-reviews-page__review-card-row">
                <ReviewStatusBadge status={review.status} />
                {review.verified ? (
                  <span className="admin-moto-reviews__verified-badge" aria-label="Review verificada">
                    <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                    Verificada
                  </span>
                ) : (
                  <span className="admin-moto-reviews__verified-badge admin-moto-reviews__verified-badge--unverified" aria-label="Review no verificada">
                    <span className="material-symbols-outlined" aria-hidden="true">person</span>
                    No verificada
                  </span>
                )}
              </span>
              <span className="admin-motorcycle-reviews-page__review-card-row">
                <ReviewSourceBadge source={review.source} />
              </span>
              <span className="motorcycle-community__owner-report-rating">
                <RatingStars rating={review.rating} />
                <strong>{review.rating}/5</strong>
              </span>
            </span>
            <span className="admin-motorcycle-reviews-page__review-card-meta">
              <span className="material-symbols-outlined" aria-hidden="true">route</span>
              {accountReviewRidingStyleLabels[review.ridingStyle]}
              <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
              {formatAccountReviewOwnershipMonths(review.ownershipMonths)}
              <span className="material-symbols-outlined" aria-hidden="true">speed</span>
              {formatAccountReviewKilometers(review.kilometers)}
              <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
              {formatAccountReviewDate(review.createdAt)}
            </span>
          </span>
          <span className="material-symbols-outlined admin-motorcycle-reviews-page__review-card-chevron" aria-hidden="true">expand_more</span>
        </button>
      </header>

      <div id={detailsId} className="admin-motorcycle-reviews-page__review-card-body-wrapper" aria-hidden={!isExpanded} inert={!isExpanded ? true : undefined}>
        <div className="admin-motorcycle-reviews-page__review-card-body">
          <section className="admin-page__reported-review" aria-label="Comentario de la review">
            <p>{(review.comment ?? '').toString().trim() || '—'}</p>
          </section>

          {pros.length > 0 ? (
            <section className="admin-page__report-extra" aria-label="Pros">
              <strong>Pros:</strong>
              <p>{pros.join(', ')}</p>
            </section>
          ) : null}

          {cons.length > 0 ? (
            <section className="admin-page__report-extra" aria-label="Contras">
              <strong>Contras:</strong>
              <p>{cons.join(', ')}</p>
            </section>
          ) : null}

          <footer>
            <div className="admin-page__action-group" aria-label="Acciones sobre la review">
              <h3>Gestionar review</h3>
              <div>
                <button className="admin-page__action-button admin-page__action-button--approve" type="button" disabled>Aprobar</button>
                <button className="admin-page__action-button admin-page__action-button--hide" type="button" disabled>Ocultar</button>
                <button className="admin-page__action-button admin-page__action-button--reject" type="button" disabled>Rechazar</button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}

export function AdminMotorcycleReviewsPage({ bike, motorcycleId }: Props) {
  const { isAdmin, isAuthenticated, isLoading, session, user } = useAuth();
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [status, setStatus] = useState<AdminMotorcycleReviewsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const authContext = useMemo(
    () => (user?.id && session?.access_token)
      ? { accessToken: session.access_token, userId: user.id }
      : null,
    [user?.id, session?.access_token],
  );

  useEffect(() => {
    if (!isAuthenticated || isLoading || !isAdmin || !authContext || !motorcycleId) {
      setReviews([]);
      setStatus('idle');
      return undefined;
    }

    let mounted = true;
    setStatus('loading');
    setError(null);

    getReviewsByMotorcycleId(motorcycleId, authContext)
      .then((next) => {
        if (!mounted) return;
        setReviews(next);
        setStatus('success');
      })
      .catch(() => {
        if (!mounted) return;
        setError('No se pudieron cargar las reviews.');
        setReviews([]);
        setStatus('error');
      });

    return () => { mounted = false; };
  }, [authContext, isAdmin, isAuthenticated, isLoading, motorcycleId]);

  const aggregate = useMemo(() => {
    const approved = reviews.filter((r) => r.status === 'approved');
    const aggregateRating = getReviewAggregate(approved);
    const pendingCount = reviews.filter((r) => r.status === 'pending').length;
    return {
      averageLabel: approved.length > 0 ? formatReviewRating(aggregateRating.averageRating) : 'N/D',
      averageRating: aggregateRating.averageRating,
      approvedCount: approved.length,
      pendingCount,
    };
  }, [reviews]);

  const filtered = useMemo(() => {
    const byStatus = filters.status === 'all' ? reviews : reviews.filter((r) => r.status === filters.status);
    return [...byStatus].sort((a, b) => (
      filters.sort === 'recent'
        ? getTimestamp(b.createdAt) - getTimestamp(a.createdAt)
        : getTimestamp(a.createdAt) - getTimestamp(b.createdAt)
    ));
  }, [reviews, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / REVIEWS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const updateFilters = (next: Partial<Filters>) => {
    setFilters((c) => ({ ...c, ...next }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const bikeName = bike ? `${bike.brand} ${bike.model} ${bike.year}` : motorcycleId ?? 'Moto';

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
        <p>Necesitás una sesión de administrador para revisar reviews.</p>
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

  return (
    <main className="admin-moto-reviews" aria-labelledby="admin-moto-reviews-title">
      <header className="motorcycle-community__hero admin-moto-reviews__hero">
        {bike ? (
          <div className="motorcycle-community__hero-media" aria-hidden="true">
            <MotorcycleImage motorcycle={bike} decorative loading="eager" />
            <div aria-hidden="true" />
          </div>
        ) : null}
        <div className="motorcycle-community__hero-content">
          <div>
            <span className="account-page__eyebrow">ADMIN STUDIO</span>
            <h1 id="admin-moto-reviews-title">{bikeName}</h1>
          </div>
          {reviews.length > 0 ? (
            <div className="motorcycle-community__hero-rating" aria-label="Resumen de reviews comunidad">
              <strong>{aggregate.averageLabel}</strong>
              <div>
                <RatingStars rating={Math.round(aggregate.averageRating)} />
                <span>{aggregate.approvedCount} {aggregate.approvedCount === 1 ? 'publicada' : 'publicadas'} · {aggregate.pendingCount} {aggregate.pendingCount === 1 ? 'pendiente' : 'pendientes'}</span>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <section className="motorcycle-community__hero-actions admin-moto-reviews__hero-actions" aria-label="Acciones admin">
        {bike ? <a className="button button--ghost" href={getBikeDetailHash(bike)}>Ver ficha</a> : null}
        {motorcycleId ? <a className="button button--ghost" href={`#/comunidad/${motorcycleId}`}>Ver reviews públicas</a> : null}
      </section>

      <section className="account-page__dashboard admin-moto-reviews__dashboard">
        <AdminMotorcycleSidebar
          bike={bike}
          filters={filters}
          isFilterPanelOpen={isFilterPanelOpen}
          motorcycleId={motorcycleId}
          onApplyFilters={() => setIsFilterPanelOpen(false)}
          onChangeFilters={updateFilters}
          onClearFilters={clearFilters}
          onCloseFilters={() => setIsFilterPanelOpen(false)}
          reviews={reviews}
        />

        <div className="admin-moto-reviews__main">
          <div className="admin-page__mobile-filter-trigger">
            <button type="button" onClick={() => setIsFilterPanelOpen(true)}>
              <span className="material-symbols-outlined" aria-hidden="true">tune</span>
              Filtros
            </button>
          </div>

          <section className="motorcycle-community__reviews" aria-labelledby="admin-motorcycle-reviews-title">
            <div className="motorcycle-community__section-header">
              <div>
                <h2 id="admin-motorcycle-reviews-title" className="admin-motorcycle-reviews-title">Reviews totales del modelo</h2>
              </div>
            </div>

            {status === 'loading' ? (
              <div className="admin-moto-reviews__state" role="status">Cargando reviews...</div>
            ) : status === 'error' ? (
              <article className="admin-moto-reviews__state" role="alert">
                <span className="material-symbols-outlined" aria-hidden="true">warning</span>
                <h2>Error al cargar reviews</h2>
                <p>{error || 'Inténtalo de nuevo en unos minutos.'}</p>
              </article>
            ) : filtered.length === 0 ? (
              <article className="admin-moto-reviews__state">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                <h2>No hay reviews{filters.status !== 'all' ? ' con ese filtro' : ''}</h2>
                {filters.status !== 'all' ? (
                  <p>Probá con otro estado o limpiá los filtros.</p>
                ) : (
                  <p>Esta moto no tiene reviews todavía.</p>
                )}
                {hasActiveFilters(filters) ? (
                  <button className="account-page__button" type="button" onClick={clearFilters}>Limpiar filtros</button>
                ) : null}
              </article>
            ) : (
              <section aria-label={`Reviews de ${bikeName}`}>
                <div className="admin-moto-reviews__list" role="list">
                  {paginated.map((review, index) => (
                    <AdminReviewCard key={review.id || `${review.userName}-${review.createdAt}`} index={index} review={review} />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <AccountPagination
                    ariaLabel="Paginación de reviews admin"
                    className="admin-page__pagination"
                    currentClassName="admin-page__pagination-current"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ left: 0, top: 0 });
                    }}
                  />
                ) : null}
              </section>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
