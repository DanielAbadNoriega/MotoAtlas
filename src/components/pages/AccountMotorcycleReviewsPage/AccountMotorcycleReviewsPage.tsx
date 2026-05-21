import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getBikeDetailHash } from '../../../data/bikes';
import { useAuth } from '../../../features/auth';
import {
  getReviewsByUserId,
  type MotorcycleReview,
  type MotorcycleReviewRidingStyle,
  type MotorcycleReviewStatus,
} from '../../../services/motorcycleReviewService';
import {
  getReviewReactionSummary,
  type ReviewReactionSummary,
} from '../../../services/reviewReactionService';
import { formatReviewRating, getReviewAggregate } from '../../../shared/reviews/reviewUtils';
import type { Bike } from '../../../types/bike';
import {
  accountReviewRidingStyleLabels,
  accountReviewStatusLabels,
  formatAccountReviewDate,
  formatAccountReviewKilometers,
  formatAccountReviewOwnershipMonths,
} from '../../reviews/AccountReviewCard/accountReviewPresentation';
import { ReviewModal } from '../../reviews/ReviewModal';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { AccountPagination } from '../AccountPage/AccountPagination';
import '../AccountPage/AccountPage.scss';
import '../AccountReviewsPage/AccountReviewsPage.scss';
import '../MotorcycleCommunityPage/MotorcycleCommunityPage.scss';
import './AccountMotorcycleReviewsPage.scss';

type AccountMotorcycleReviewsPageProps = Readonly<{
  bike?: Bike;
  motorcycleId?: string;
}>;

type AccountMotorcycleReviewsStatus = 'idle' | 'loading' | 'success' | 'error';
type RatingFilter = 'all' | '5' | '4-plus' | '3-minus';
type SortOption = 'recent' | 'rating-desc' | 'kilometers-desc' | 'ownership-desc';
type ReviewFilters = Readonly<{
  rating: RatingFilter;
  sort: SortOption;
}>;
type ReactionSummaryMap = Record<string, ReviewReactionSummary>;

const REVIEWS_PER_PAGE = 5;
const defaultFilters: ReviewFilters = {
  rating: 'all',
  sort: 'recent',
};

const ratingOptions = [
  { ariaLabel: 'Todas las valoraciones', filledStars: 0, label: 'Todas', value: 'all' },
  { ariaLabel: '5 estrellas', filledStars: 5, label: '5 estrellas', value: '5' },
  { ariaLabel: '4 estrellas o más', filledStars: 4, label: '4 o más', value: '4-plus' },
  { ariaLabel: '3 estrellas o menos', filledStars: 3, label: '3 o menos', value: '3-minus' },
] satisfies readonly { ariaLabel: string; filledStars: number; label: string; value: RatingFilter }[];

const sortOptions = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Mejor valoradas', value: 'rating-desc' },
  { label: 'Más kilómetros', value: 'kilometers-desc' },
  { label: 'Más tiempo con la moto', value: 'ownership-desc' },
] satisfies readonly { label: string; value: SortOption }[];

const statusToneMap: Record<MotorcycleReviewStatus, 'approved' | 'hidden' | 'pending' | 'rejected'> = {
  approved: 'approved',
  hidden: 'hidden',
  pending: 'pending',
  rejected: 'rejected',
};

function getProfileName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Usuario MotoAtlas';
}

function getMotorcycleName(bike: Bike) {
  return `${bike.brand} ${bike.model} ${bike.year}`;
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeReviewList(items: readonly unknown[] | string | null | undefined) {
  const list = Array.isArray(items) ? items : [items];

  return list
    .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
    .filter((item) => item.length > 0 && item.toLowerCase() !== 'null' && item.toLowerCase() !== 'undefined');
}

function matchesRating(review: MotorcycleReview, rating: RatingFilter) {
  if (rating === '5') {
    return review.rating === 5;
  }

  if (rating === '4-plus') {
    return review.rating >= 4;
  }

  if (rating === '3-minus') {
    return review.rating <= 3;
  }

  return true;
}

function sortReviews(reviews: readonly MotorcycleReview[], sort: SortOption) {
  return [...reviews].sort((left, right) => {
    if (sort === 'rating-desc') {
      return right.rating - left.rating || getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    }

    if (sort === 'kilometers-desc') {
      return (right.kilometers ?? -1) - (left.kilometers ?? -1) || getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    }

    if (sort === 'ownership-desc') {
      return (right.ownershipMonths ?? -1) - (left.ownershipMonths ?? -1) || getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    }

    return getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
  });
}

function filterReviews(reviews: readonly MotorcycleReview[], filters: ReviewFilters) {
  return sortReviews(reviews.filter((review) => matchesRating(review, filters.rating)), filters.sort);
}

function hasActiveFilters(filters: ReviewFilters) {
  return filters.rating !== defaultFilters.rating || filters.sort !== defaultFilters.sort;
}

function formatPublishedPendingLabel(reviews: readonly MotorcycleReview[]) {
  const approvedCount = reviews.filter((review) => review.status === 'approved').length;
  const pendingCount = reviews.filter((review) => review.status === 'pending').length;
  const approvedLabel = `${approvedCount} ${approvedCount === 1 ? 'publicada' : 'publicadas'}`;
  const pendingLabel = `${pendingCount} ${pendingCount === 1 ? 'pendiente' : 'pendientes'}`;

  return `${approvedLabel} · ${pendingLabel}`;
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

function FilterGroup({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <details className="account-reviews-page__filter-group" open>
      <summary>
        <span>{title}</span>
        <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </summary>
      <div className="account-reviews-page__filter-group-body">{children}</div>
    </details>
  );
}

function FilterOptionButton({
  active,
  ariaLabel,
  children,
  className = '',
  label,
  onClick,
}: Readonly<{
  active: boolean;
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  label: string;
  onClick: () => void;
}>) {
  const buttonClasses = ['account-reviews-page__filter-option', active ? 'account-reviews-page__filter-option--active' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClasses} type="button" aria-label={ariaLabel} aria-pressed={active} onClick={onClick}>
      <span>{label}</span>
      {children}
    </button>
  );
}

function FilterRatingStars({ filledStars }: Readonly<{ filledStars: number }>) {
  return (
    <span className="account-reviews-page__filter-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < filledStars ? 'account-reviews-page__filter-star--filled' : undefined} key={index}>star</span>
      ))}
    </span>
  );
}

function PrivateReviewFiltersPanel({
  filters,
  isOpen,
  onApply,
  onChange,
  onClearFilters,
  onClose,
}: Readonly<{
  filters: ReviewFilters;
  isOpen: boolean;
  onApply: () => void;
  onChange: (next: Partial<ReviewFilters>) => void;
  onClearFilters: () => void;
  onClose: () => void;
}>) {
  const panelClasses = ['account-reviews-page__filters', isOpen ? 'account-reviews-page__filters--open' : ''].filter(Boolean).join(' ');

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

  const applyFilters = () => {
    onApply();
    onClose();
  };

  return (
    <>
      {isOpen ? <button className="account-reviews-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros" /> : null}
      <section
        className={panelClasses}
        aria-label="Filtros de reviews"
        aria-labelledby="account-motorcycle-reviews-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="account-reviews-page__sheet-handle" aria-hidden="true" />
        <div className="account-reviews-page__filters-header">
          <h2 id="account-motorcycle-reviews-filters-title">Filtros</h2>
          <button type="button" aria-label="Limpiar filtros de reviews" onClick={onClearFilters}>Limpiar filtros</button>
          <button className="account-reviews-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="account-reviews-page__filters-body">
          <FilterGroup title="Rating">
            <div className="account-reviews-page__rating-grid">
              {ratingOptions.map((option) => (
                <FilterOptionButton
                  active={filters.rating === option.value}
                  ariaLabel={option.ariaLabel}
                  className="account-reviews-page__filter-option--rating"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ rating: option.value })}
                >
                  <FilterRatingStars filledStars={option.filledStars} />
                </FilterOptionButton>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Orden">
            <div className="account-reviews-page__sort-grid">
              {sortOptions.map((option) => (
                <FilterOptionButton
                  active={filters.sort === option.value}
                  ariaLabel={`Orden: ${option.label}`}
                  className="account-reviews-page__filter-option--sort"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ sort: option.value })}
                />
              ))}
            </div>
          </FilterGroup>
        </div>

        <footer className="account-reviews-page__filters-footer">
          <button type="button" aria-label="Restablecer filtros de reviews" onClick={onClearFilters}>Limpiar filtros</button>
          <button type="button" onClick={applyFilters}>Aplicar filtros</button>
        </footer>
      </section>
    </>
  );
}

function RatingDistribution({ reviews }: Readonly<{ reviews: readonly MotorcycleReview[] }>) {
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    count: reviews.filter((review) => review.rating === rating).length,
    rating,
  }));

  return (
    <section className="account-page__card account-motorcycle-reviews-page__rating-panel" aria-labelledby="account-motorcycle-rating-title">
      <h2 id="account-motorcycle-rating-title">Tu distribución rating</h2>
      <div className="motorcycle-community__distribution account-motorcycle-reviews-page__distribution">
        {distribution.map(({ count, rating }) => (
          <div key={rating}>
            <span>{rating}★</span>
            <div aria-hidden="true">
              <span style={{ width: reviews.length === 0 ? '0%' : `${(count / reviews.length) * 100}%` }} />
            </div>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccountPrivateSidebar({
  displayName,
  email,
  filters,
  isFilterPanelOpen,
  onApplyFilters,
  onChangeFilters,
  onClearFilters,
  onCloseFilters,
  onSignOut,
  reviews,
}: Readonly<{
  displayName: string;
  email: string;
  filters: ReviewFilters;
  isFilterPanelOpen: boolean;
  onApplyFilters: () => void;
  onChangeFilters: (next: Partial<ReviewFilters>) => void;
  onClearFilters: () => void;
  onCloseFilters: () => void;
  onSignOut: () => void | Promise<void>;
  reviews: readonly MotorcycleReview[];
}>) {
  return (
    <aside className="account-page__sidebar" aria-label="Panel privado de reviews">
      <PrivateReviewFiltersPanel
        filters={filters}
        isOpen={isFilterPanelOpen}
        onApply={onApplyFilters}
        onChange={onChangeFilters}
        onClearFilters={onClearFilters}
        onClose={onCloseFilters}
      />

      <RatingDistribution reviews={reviews} />

      <article className="account-page__card account-page__profile-card">
        <span className="account-page__ghost-icon material-symbols-outlined" aria-hidden="true">settings_input_component</span>
        <h2>
          <span aria-hidden="true" />
          Resumen de perfil
        </h2>
        <dl>
          <div>
            <dt>Alias de piloto</dt>
            <dd>{displayName}</dd>
          </div>
          <div>
            <dt>Email de acceso</dt>
            <dd>{email}</dd>
          </div>
        </dl>
        <div className="account-page__profile-actions">
          <button className="account-page__button account-page__button--glass" type="button" onClick={onSignOut}>
            <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            Cerrar sesión
          </button>
        </div>
      </article>

      <nav className="account-page__quick-links" aria-label="Navegación de cuenta">
        <a className="account-page__quick-link" href="#/cuenta">Mi cuenta</a>
        <a className="account-page__quick-link account-page__quick-link--active" href="#/cuenta/reviews" aria-current="page">Mis reviews</a>
        <a className="account-page__quick-link" href="#/cuenta/solicitudes">Mis solicitudes</a>
      </nav>

      <article className="account-page__notice">
        <span className="material-symbols-outlined" aria-hidden="true">info</span>
        <div>
          <p>Tus reviews autenticadas quedan asociadas a tu cuenta y solo vos ves su estado completo.</p>
          <strong>Las reviews publicadas siguen siendo visibles en comunidad.</strong>
        </div>
      </article>
    </aside>
  );
}

function ReviewListBlock({ items, title }: Readonly<{ items: readonly string[]; title: string }>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <p>
      <strong>{title}:</strong> {items.join(', ')}
    </p>
  );
}

function ReviewStatusBadge({ status }: Readonly<{ status: MotorcycleReviewStatus }>) {
  return (
    <span className={`account-motorcycle-reviews-page__status account-motorcycle-reviews-page__status--${statusToneMap[status]}`}>
      {accountReviewStatusLabels[status]}
    </span>
  );
}

function getDefaultReactionSummary(reviewId: string): ReviewReactionSummary {
  return {
    helpfulCount: 0,
    hasReactedHelpful: false,
    hasReactedNotHelpful: false,
    reviewId,
  };
}

function HelpfulReceivedMetric({ summary }: Readonly<{ summary: ReviewReactionSummary }>) {
  return (
    <span className="motorcycle-community__helpful-action motorcycle-community__helpful-action--passive account-motorcycle-reviews-page__helpful-metric" aria-label={`Útil ${summary.helpfulCount}`}>
      <span className="material-symbols-outlined" aria-hidden="true">thumb_up</span>
      Útil {summary.helpfulCount}
    </span>
  );
}

function PrivateReviewRow({
  index,
  reactionSummary,
  review,
}: Readonly<{
  index: number;
  reactionSummary: ReviewReactionSummary;
  review: MotorcycleReview;
}>) {
  const pros = normalizeReviewList(review.pros as readonly unknown[]);
  const cons = normalizeReviewList(review.cons as readonly unknown[]);

  return (
    <article
      className="motorcycle-community__owner-report-row account-motorcycle-reviews-page__review-row"
      data-testid="account-motorcycle-review-row"
      data-row-tone={index % 2 === 0 ? 'even' : 'odd'}
      role="listitem"
    >
      <div className="motorcycle-community__owner-report-identity account-motorcycle-reviews-page__review-identity">
        <div className="account-motorcycle-reviews-page__review-heading">
          <ReviewStatusBadge status={review.status} />
          <div className="motorcycle-community__owner-report-rating">
            <RatingStars rating={review.rating} />
            <strong>{review.rating}/5</strong>
          </div>
        </div>

        <ul className="motorcycle-community__owner-report-meta" aria-label="Metadatos de tu review">
          <li>
            <span className="material-symbols-outlined" aria-hidden="true">route</span>
            {accountReviewRidingStyleLabels[review.ridingStyle]}
          </li>
          <li>
            <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
            {formatAccountReviewOwnershipMonths(review.ownershipMonths)}
          </li>
          <li>
            <span className="material-symbols-outlined" aria-hidden="true">speed</span>
            {formatAccountReviewKilometers(review.kilometers)}
          </li>
          <li>
            <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
            {formatAccountReviewDate(review.createdAt)}
          </li>
        </ul>
      </div>

      <div className="motorcycle-community__owner-report-summary">
        <p>{(review.comment ?? '').toString().trim() || '—'}</p>
        <div className="motorcycle-community__owner-report-pros-cons">
          <ReviewListBlock title="Pros" items={pros} />
          <ReviewListBlock title="Contras" items={cons} />
        </div>
        <div className="motorcycle-community__owner-report-actions" aria-label="Métricas de tu review">
          <HelpfulReceivedMetric summary={reactionSummary} />
        </div>
      </div>
    </article>
  );
}

function PrivateState({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="account-reviews-page" aria-labelledby="account-motorcycle-reviews-page-title">
      <section className="account-reviews-page__private-state">{children}</section>
    </main>
  );
}

export function AccountMotorcycleReviewsPage({ bike, motorcycleId }: AccountMotorcycleReviewsPageProps) {
  const { isAuthenticated, isLoading, profile, session, signOut, user } = useAuth();
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsStatus, setReviewsStatus] = useState<AccountMotorcycleReviewsStatus>('idle');
  const [filters, setFilters] = useState<ReviewFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reactionSummaries, setReactionSummaries] = useState<ReactionSummaryMap>({});
  const displayName = getProfileName(profile?.displayName, user?.email);
  const email = user?.email ?? 'Email no disponible';

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      setReviews([]);
      setReviewsError('');
      setReviewsStatus('idle');
      return undefined;
    }

    if (!user?.id || !session?.access_token) {
      setReviews([]);
      setReviewsError('');
      setReviewsStatus('success');
      return undefined;
    }

    let isMounted = true;
    setReviewsStatus('loading');
    setReviewsError('');

    getReviewsByUserId({ accessToken: session.access_token, userId: user.id })
      .then((nextReviews) => {
        if (isMounted) {
          setReviews(nextReviews);
          setReviewsStatus('success');
        }
      })
      .catch((reviewsLoadError) => {
        if (isMounted) {
          setReviews([]);
          setReviewsError(reviewsLoadError instanceof Error ? reviewsLoadError.message : 'No se han podido cargar tus reviews.');
          setReviewsStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading, session?.access_token, user?.id]);

  const ownMotorcycleReviews = useMemo(
    () => reviews.filter((review) => review.userId === user?.id && review.motorcycleId === motorcycleId),
    [motorcycleId, reviews, user?.id],
  );
  const filteredReviews = useMemo(() => filterReviews(ownMotorcycleReviews, filters), [filters, ownMotorcycleReviews]);
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);
  const paginatedReviewIds = useMemo(() => paginatedReviews.map((review) => review.id), [paginatedReviews]);
  const activeFilters = hasActiveFilters(filters);
  const aggregate = getReviewAggregate(ownMotorcycleReviews);
  const averageRatingLabel = ownMotorcycleReviews.length > 0 ? formatReviewRating(aggregate.averageRating) : 'N/D';
  const reactionAuthContext = isAuthenticated && user?.id && session?.access_token
    ? { accessToken: session.access_token, userId: user.id }
    : null;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const updateFilters = (nextFilters: Partial<ReviewFilters>) => {
    setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (paginatedReviewIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    getReviewReactionSummary(paginatedReviewIds, reactionAuthContext)
      .then((summaries) => {
        if (!isMounted) {
          return;
        }

        setReactionSummaries((currentSummaries) => ({
          ...currentSummaries,
          ...Object.fromEntries(summaries.map((summary) => [summary.reviewId, summary])),
        }));
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [paginatedReviewIds.join('|'), reactionAuthContext?.accessToken, reactionAuthContext?.userId]);

  const handleSignOut = async () => {
    setError('');

    try {
      await signOut();
      window.location.hash = '#/';
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'No se ha podido cerrar sesión.');
    }
  };

  if (isLoading) {
    return (
      <PrivateState>
        <span className="account-page__eyebrow">Mis reviews</span>
        <h1 id="account-motorcycle-reviews-page-title">Cargando sesión...</h1>
      </PrivateState>
    );
  }

  if (!isAuthenticated) {
    return (
      <PrivateState>
        <span className="account-page__eyebrow">Acceso privado</span>
        <h1 id="account-motorcycle-reviews-page-title">Inicia sesión para ver tus reviews de esta moto</h1>
        <p>Solo las reviews asociadas a tu cuenta aparecen en este panel privado.</p>
        <a className="account-page__button" href="#/login">Iniciar sesión</a>
      </PrivateState>
    );
  }

  if (!motorcycleId || !bike) {
    return (
      <PrivateState>
        <span className="account-page__eyebrow">Mis reviews</span>
        <h1 id="account-motorcycle-reviews-page-title">Moto no encontrada</h1>
        <p>No encontramos el modelo solicitado dentro del catálogo de MotoAtlas.</p>
        <a className="account-page__button" href="#/cuenta/reviews">Volver a mis reviews</a>
      </PrivateState>
    );
  }

  const bikeName = getMotorcycleName(bike);

  return (
    <main className="account-motorcycle-reviews-page" aria-labelledby="account-motorcycle-reviews-page-title">
      <header className="motorcycle-community__hero account-motorcycle-reviews-page__hero">
        <div className="motorcycle-community__hero-media" aria-hidden="true">
          <MotorcycleImage motorcycle={bike} decorative loading="eager" />
          <div aria-hidden="true" />
        </div>
        <div className="motorcycle-community__hero-content account-motorcycle-reviews-page__hero-content">
          <div>
            <span className="account-page__eyebrow">Mi garaje privado</span>
            <h1 id="account-motorcycle-reviews-page-title">{bikeName}</h1>
          </div>
          <div className="motorcycle-community__hero-rating" aria-label="Resumen de tus reviews de esta moto">
            <strong>{averageRatingLabel}</strong>
            <div>
              <RatingStars rating={Math.round(aggregate.averageRating)} />
              <span>{formatPublishedPendingLabel(ownMotorcycleReviews)}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="motorcycle-community__hero-actions account-motorcycle-reviews-page__hero-actions" aria-label="Acciones de tus reviews">
        <a className="button button--ghost" href={getBikeDetailHash(bike)}>Ver ficha</a>
        <button className="button button--primary" type="button" onClick={() => setIsReviewModalOpen(true)}>Escribir review</button>
        <a className="button button--ghost" href={`#/comunidad/${motorcycleId}`}>Ver reviews públicas</a>
      </section>

      {error ? <p className="account-page__alert" role="alert">{error}</p> : null}

      <section className="account-page__dashboard account-motorcycle-reviews-page__dashboard" aria-label="Panel privado de reviews por moto">
        <AccountPrivateSidebar
          displayName={displayName}
          email={email}
          filters={filters}
          isFilterPanelOpen={isFilterPanelOpen}
          onApplyFilters={() => setCurrentPage(1)}
          onChangeFilters={updateFilters}
          onClearFilters={clearFilters}
          onCloseFilters={() => setIsFilterPanelOpen(false)}
          onSignOut={handleSignOut}
          reviews={ownMotorcycleReviews}
        />

        <div className="account-motorcycle-reviews-page__main">
          <div className="account-reviews-page__mobile-filter-trigger">
            <button type="button" onClick={() => setIsFilterPanelOpen(true)}>
              <span className="material-symbols-outlined" aria-hidden="true">tune</span>
              Filtros
            </button>
          </div>

          <section className="motorcycle-community__reviews" aria-labelledby="account-motorcycle-reviews-title">
            <div className="motorcycle-community__section-header account-motorcycle-reviews-page__section-header">
              <div>
                <h2 id="account-motorcycle-reviews-title">Mis reviews de esta moto</h2>
              </div>
            </div>

            {reviewsStatus === 'loading' ? (
              <div className="account-motorcycle-reviews-page__loading" role="status">Cargando tus reviews...</div>
            ) : reviewsStatus === 'error' ? (
              <article className="account-reviews-page__error" role="alert">
                <span className="material-symbols-outlined" aria-hidden="true">warning</span>
                <h2>No se han podido cargar tus reviews.</h2>
                <p>{reviewsError || 'Inténtalo de nuevo en unos minutos.'}</p>
              </article>
            ) : ownMotorcycleReviews.length === 0 ? (
              <article className="account-motorcycle-reviews-page__empty">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                <h2>Aún no has valorado esta moto</h2>
                <p>Cuando escribas una review sobre este modelo, aparecerá aquí.</p>
                <button className="account-page__button" type="button" onClick={() => setIsReviewModalOpen(true)}>Escribir review</button>
              </article>
            ) : filteredReviews.length === 0 ? (
              <article className="account-motorcycle-reviews-page__empty">
                <span className="material-symbols-outlined" aria-hidden="true">filter_alt_off</span>
                <h2>No hay reviews con esos filtros</h2>
                <p>Prueba a cambiar el rating o el orden para revisar tus experiencias.</p>
                {activeFilters ? <button className="account-page__button" type="button" onClick={clearFilters}>Limpiar filtros</button> : null}
              </article>
            ) : (
              <>
                <div className="motorcycle-community__owner-report-list" role="list" aria-label="Listado compacto de mis reviews de esta moto">
                  {paginatedReviews.map((review, index) => (
                    <PrivateReviewRow
                      index={(currentPage - 1) * REVIEWS_PER_PAGE + index}
                      key={review.id}
                      reactionSummary={reactionSummaries[review.id] ?? getDefaultReactionSummary(review.id)}
                      review={review}
                    />
                  ))}
                </div>
                {totalPages > 1 ? (
                  <AccountPagination
                    ariaLabel="Paginación de mis reviews de esta moto"
                    className="account-reviews-page__pagination"
                    currentClassName="account-reviews-page__pagination-current"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                ) : null}
              </>
            )}
          </section>
        </div>
      </section>

      <ReviewModal isOpen={isReviewModalOpen} motorcycle={bike} onClose={() => setIsReviewModalOpen(false)} />
    </main>
  );
}
