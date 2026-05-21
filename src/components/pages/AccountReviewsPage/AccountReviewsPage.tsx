import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccountSidebar } from '../AccountPage/AccountSidebar';
import { AccountPagination } from '../AccountPage/AccountPagination';
import '../AccountPage/AccountPage.scss';
import { accountReviewRidingStyleLabels, getAccountReviewMotorcycleDisplay } from '../../reviews/AccountReviewCard';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { useAuth } from '../../../features/auth';
import { getAccountMotorcycleReviewsHash } from '../../../shared/routing/routeUtils';
import {
  getReviewsByUserId,
  type MotorcycleReview,
  type MotorcycleReviewRidingStyle,
} from '../../../services/motorcycleReviewService';
import {
  matchesMotorcycleSegmentFilter,
  motorcycleLicenseFilterOptions,
  motorcycleSegmentFilterOptions,
  type MotorcycleSegmentFilterValue,
} from '../../../shared/filters/motorcycleFilterOptions';
import type { BikeA2Status } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { formatReviewRating, getReviewAggregate } from '../../../shared/reviews/reviewUtils';
import { AccountReviewsEmptyState } from './AccountReviewsEmptyState';
import './AccountReviewsPage.scss';

type AccountReviewsStatus = 'idle' | 'loading' | 'success' | 'error';
type LicenseFilter = 'all' | BikeA2Status;
type RatingFilter = 'all' | '5' | '4-plus' | '3-minus';
type RidingStyleFilter = 'all' | MotorcycleReviewRidingStyle;
type SortOption = 'recent' | 'rating-desc' | 'reviews-desc' | 'kilometers-desc';

type AccountReviewsFilters = Readonly<{
  license: LicenseFilter;
  rating: RatingFilter;
  ridingStyle: RidingStyleFilter;
  search: string;
  segment: MotorcycleSegmentFilterValue;
  sort: SortOption;
}>;

type AccountReviewMotorcycleSummary = Readonly<{
  averageRating: number;
  hasDeclaredKilometers: boolean;
  latestReviewAt: string;
  motorcycle: ReturnType<typeof getAccountReviewMotorcycleDisplay>;
  motorcycleId: string;
  reviewCount: number;
  reviews: readonly MotorcycleReview[];
  topRidingStyle?: Readonly<{
    count: number;
    label: string;
    value: MotorcycleReviewRidingStyle;
  }>;
  totalKilometers: number;
}>;

const GARAGE_ITEMS_PER_PAGE = 9;
const defaultFilters: AccountReviewsFilters = {
  license: 'all',
  rating: 'all',
  ridingStyle: 'all',
  search: '',
  segment: 'all',
  sort: 'recent',
};
const numberFormatter = new Intl.NumberFormat('es-ES');

const ratingOptions = [
  { ariaLabel: 'Todas las valoraciones', filledStars: 0, label: 'Todos', value: 'all' },
  { ariaLabel: '5 estrellas', filledStars: 5, label: '5 estrellas', value: '5' },
  { ariaLabel: '4 estrellas o más', filledStars: 4, label: '4 o más', value: '4-plus' },
  { ariaLabel: '3 estrellas o menos', filledStars: 3, label: '3 o menos', value: '3-minus' },
] satisfies readonly { ariaLabel: string; filledStars: number; label: string; value: RatingFilter }[];

const ridingStyleOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ciudad', value: 'ciudad' },
  { label: 'Viaje', value: 'viaje' },
  { label: 'Offroad', value: 'offroad' },
  { label: 'Deportivo', value: 'deportivo' },
  { label: 'Pasajero', value: 'pasajero' },
  { label: 'Diario', value: 'diario' },
] satisfies readonly { label: string; value: RidingStyleFilter }[];

const sortOptions = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Mejor valoradas', value: 'rating-desc' },
  { label: 'Más reviews', value: 'reviews-desc' },
  { label: 'Más kilómetros', value: 'kilometers-desc' },
] satisfies readonly { label: string; value: SortOption }[];

function getProfileName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Usuario MotoAtlas';
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatGarageDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin dato';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatOwnReviewCount(value: number) {
  return value === 1 ? '1 review tuya' : `${numberFormatter.format(value)} reviews tuyas`;
}

function getTopRidingStyle(reviews: readonly MotorcycleReview[]) {
  const counts = new Map<MotorcycleReviewRidingStyle, number>();

  reviews.forEach((review) => {
    counts.set(review.ridingStyle, (counts.get(review.ridingStyle) ?? 0) + 1);
  });

  const topEntry = [...counts.entries()].sort((left, right) => (
    right[1] - left[1] ||
    accountReviewRidingStyleLabels[left[0]].localeCompare(accountReviewRidingStyleLabels[right[0]])
  ))[0];

  return topEntry
    ? {
        count: topEntry[1],
        label: accountReviewRidingStyleLabels[topEntry[0]],
        value: topEntry[0],
      }
    : undefined;
}

function buildAccountReviewGarage(reviews: readonly MotorcycleReview[]): readonly AccountReviewMotorcycleSummary[] {
  const reviewsByMotorcycle = new Map<string, MotorcycleReview[]>();

  reviews.forEach((review) => {
    const currentReviews = reviewsByMotorcycle.get(review.motorcycleId) ?? [];
    currentReviews.push(review);
    reviewsByMotorcycle.set(review.motorcycleId, currentReviews);
  });

  return [...reviewsByMotorcycle.entries()].map(([motorcycleId, motorcycleReviews]) => {
    const sortedByLatest = [...motorcycleReviews].sort((left, right) => getTimestamp(right.createdAt) - getTimestamp(left.createdAt));
    const referenceReview = sortedByLatest.find((review) => review.motorcycle) ?? sortedByLatest[0]!;
    const aggregate = getReviewAggregate(motorcycleReviews);
    const totalKilometers = motorcycleReviews.reduce((sum, review) => sum + (review.kilometers ?? 0), 0);
    const hasDeclaredKilometers = motorcycleReviews.some((review) => review.kilometers !== null);

    return {
      averageRating: aggregate.averageRating,
      hasDeclaredKilometers,
      latestReviewAt: sortedByLatest[0]?.createdAt ?? '',
      motorcycle: getAccountReviewMotorcycleDisplay(referenceReview),
      motorcycleId,
      reviewCount: aggregate.reviewCount,
      reviews: motorcycleReviews,
      topRidingStyle: getTopRidingStyle(motorcycleReviews),
      totalKilometers,
    };
  });
}

function matchesRatingValue(value: number, rating: RatingFilter) {
  if (rating === '5') {
    return value === 5;
  }

  if (rating === '4-plus') {
    return value >= 4;
  }

  if (rating === '3-minus') {
    return value <= 3;
  }

  return true;
}

function filterGarageItems(items: readonly AccountReviewMotorcycleSummary[], filters: AccountReviewsFilters) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch = !normalizedSearch || item.motorcycle.searchText.includes(normalizedSearch);
    const matchesSegment = matchesMotorcycleSegmentFilter(item.motorcycle.segment, filters.segment);
    const matchesLicense = filters.license === 'all' || item.motorcycle.a2Status === filters.license;
    const matchesRating = matchesRatingValue(item.averageRating, filters.rating);
    const matchesRidingStyle = filters.ridingStyle === 'all' || item.topRidingStyle?.value === filters.ridingStyle;

    return matchesSearch && matchesSegment && matchesLicense && matchesRating && matchesRidingStyle;
  });
}

function sortGarageItems(items: readonly AccountReviewMotorcycleSummary[], sort: SortOption) {
  return [...items].sort((left, right) => {
    if (sort === 'rating-desc') {
      return right.averageRating - left.averageRating || right.reviewCount - left.reviewCount || getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt);
    }

    if (sort === 'reviews-desc') {
      return right.reviewCount - left.reviewCount || right.averageRating - left.averageRating || getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt);
    }

    if (sort === 'kilometers-desc') {
      return right.totalKilometers - left.totalKilometers || getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt);
    }

    return getTimestamp(right.latestReviewAt) - getTimestamp(left.latestReviewAt) || right.reviewCount - left.reviewCount;
  });
}

function hasActiveFilters(filters: AccountReviewsFilters) {
  return (
    Boolean(filters.search.trim()) ||
    filters.segment !== defaultFilters.segment ||
    filters.license !== defaultFilters.license ||
    filters.rating !== defaultFilters.rating ||
    filters.ridingStyle !== defaultFilters.ridingStyle ||
    filters.sort !== defaultFilters.sort
  );
}

function AccountReviewMotorcycleSummaryCard({ item }: Readonly<{ item: AccountReviewMotorcycleSummary }>) {
  const reviewLabel = formatOwnReviewCount(item.reviewCount);
  const ratingLabel = formatReviewRating(item.averageRating);

  return (
    <article className="account-page__review-summary-card" data-testid="account-review-summary-card" aria-label={`${item.motorcycle.name}: ${reviewLabel}`}>
      <MotorcycleImage decorative className="account-page__review-summary-image" motorcycle={item.motorcycle.imageSource} />
      <div className="account-page__review-summary-overlay" aria-hidden="true" />

      <div className="account-page__review-summary-content">
        <header className="account-page__review-summary-header">
          <h2>{item.motorcycle.name}</h2>
          <div className="account-page__review-summary-rating" aria-label={`Rating medio ${ratingLabel} de 5`}>
            <span aria-hidden="true">★</span>
            <strong>{ratingLabel}</strong>
          </div>
        </header>

        <ul className="account-page__review-summary-meta" aria-label="Resumen de tus reviews de esta moto">
          <li>{reviewLabel}</li>
          <li>{`Última review: ${formatGarageDate(item.latestReviewAt)}`}</li>
        </ul>

        <footer className="account-page__review-summary-actions">
          <a href={getAccountMotorcycleReviewsHash(item.motorcycleId)}>Ver mis reviews</a>
          <a href={item.motorcycle.detailHref}>Ver ficha</a>
        </footer>
      </div>
    </article>
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
  icon,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  icon?: string;
  label: string;
  onClick: () => void;
}>) {
  const buttonClasses = ['account-reviews-page__filter-option', active ? 'account-reviews-page__filter-option--active' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClasses} type="button" aria-label={ariaLabel} aria-pressed={active} onClick={onClick}>
      {icon ? <span className="material-symbols-outlined" aria-hidden="true">{icon}</span> : null}
      <span>{label}</span>
      {children}
    </button>
  );
}

function RatingStars({ filledStars }: Readonly<{ filledStars: number }>) {
  return (
    <span className="account-reviews-page__filter-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < filledStars ? 'account-reviews-page__filter-star--filled' : undefined} key={index}>star</span>
      ))}
    </span>
  );
}

function AccountReviewsFiltersPanel({
  filters,
  isOpen,
  onApply,
  onChange,
  onClearFilters,
  onClose,
}: Readonly<{
  filters: AccountReviewsFilters;
  isOpen: boolean;
  onApply: () => void;
  onChange: (next: Partial<AccountReviewsFilters>) => void;
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
        aria-labelledby="account-reviews-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="account-reviews-page__sheet-handle" aria-hidden="true" />
        <div className="account-reviews-page__filters-header">
          <h2 id="account-reviews-filters-title">Filtros</h2>
          <button type="button" aria-label="Limpiar filtros de reviews" onClick={onClearFilters}>Limpiar filtros</button>
          <button className="account-reviews-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="account-reviews-page__filters-body">
          <label className="account-reviews-page__search" htmlFor="account-reviews-search">
            Buscar por marca o modelo
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              id="account-reviews-search"
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="BMW, Tuareg, MT-09..."
            />
          </label>

          <FilterGroup title="Segmento">
            <div className="account-reviews-page__segment-grid">
              {motorcycleSegmentFilterOptions.map((option) => (
                <FilterOptionButton
                  active={filters.segment === option.value}
                  ariaLabel={`Segmento: ${option.label}`}
                  icon={option.icon}
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ segment: option.value })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Carnet">
            <div className="account-reviews-page__pill-list">
              {motorcycleLicenseFilterOptions.map((option) => (
                <FilterOptionButton
                  active={filters.license === option.value}
                  ariaLabel={option.label}
                  className="account-reviews-page__filter-option--pill"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ license: filters.license === option.value ? 'all' : option.value })}
                />
              ))}
            </div>
          </FilterGroup>

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
                  <RatingStars filledStars={option.filledStars} />
                </FilterOptionButton>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Uso principal">
            <div className="account-reviews-page__pill-list">
              {ridingStyleOptions.map((option) => (
                <FilterOptionButton
                  active={filters.ridingStyle === option.value}
                  ariaLabel={`Uso principal: ${option.label}`}
                  className="account-reviews-page__filter-option--pill"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ ridingStyle: option.value })}
                />
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

function ReviewSkeletonList() {
  return (
    <div className="account-reviews-page__garage-grid" aria-label="Cargando reviews">
      {Array.from({ length: 3 }, (_, index) => (
        <article className="account-reviews-page__skeleton-card" key={index} role="status">
          <div />
          <div>
            <span />
            <span />
            <span />
          </div>
        </article>
      ))}
    </div>
  );
}

export function AccountReviewsPage() {
  const { isAuthenticated, isLoading, profile, session, signOut, user } = useAuth();
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsStatus, setReviewsStatus] = useState<AccountReviewsStatus>('idle');
  const [filters, setFilters] = useState<AccountReviewsFilters>(defaultFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const displayName = getProfileName(profile?.displayName, user?.email);
  const email = user?.email ?? 'Email no disponible';
  const visibleReviews = reviews.filter((review) => review.userId === user?.id);
  const approvedCount = visibleReviews.filter((review) => review.status === 'approved').length;
  const garageItems = useMemo(() => buildAccountReviewGarage(visibleReviews), [visibleReviews]);
  const filteredGarageItems = useMemo(
    () => sortGarageItems(filterGarageItems(garageItems, filters), filters.sort),
    [filters, garageItems],
  );
  const totalPages = Math.max(1, Math.ceil(filteredGarageItems.length / GARAGE_ITEMS_PER_PAGE));
  const paginatedGarageItems = filteredGarageItems.slice((currentPage - 1) * GARAGE_ITEMS_PER_PAGE, currentPage * GARAGE_ITEMS_PER_PAGE);
  const activeFilters = hasActiveFilters(filters);

  const updateFilters = (nextFilters: Partial<AccountReviewsFilters>) => {
    setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const handleSignOut = async () => {
    setError('');

    try {
      await signOut();
      window.location.hash = '#/';
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'No se ha podido cerrar sesión.');
    }
  };

  const retryLoadReviews = () => {
    if (!user?.id || !session?.access_token) {
      return;
    }

    setReviewsStatus('loading');
    setReviewsError('');
    getReviewsByUserId({ accessToken: session.access_token, userId: user.id })
      .then((nextReviews) => {
        setReviews(nextReviews);
        setReviewsStatus('success');
      })
      .catch((reviewsLoadError) => {
        setReviews([]);
        setReviewsError(reviewsLoadError instanceof Error ? reviewsLoadError.message : 'No se han podido cargar tus reviews.');
        setReviewsStatus('error');
      });
  };

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

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <main className="account-reviews-page" aria-labelledby="account-reviews-page-title">
        <section className="account-reviews-page__private-state" role="status">
          <span className="account-page__eyebrow">Mis reviews</span>
          <h1 id="account-reviews-page-title">Cargando sesión...</h1>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="account-reviews-page" aria-labelledby="account-reviews-page-title">
        <section className="account-reviews-page__private-state">
          <span className="account-page__eyebrow">Acceso privado</span>
          <h1 id="account-reviews-page-title">Inicia sesión para ver tus reviews</h1>
          <p>Solo las reviews asociadas a tu cuenta aparecen en este panel.</p>
          <a className="account-page__button" href="#/login">Iniciar sesión</a>
        </section>
      </main>
    );
  }

  return (
    <main className="account-reviews-page" aria-labelledby="account-reviews-page-title">
      {error ? <p className="account-page__alert" role="alert">{error}</p> : null}
      <section className="account-page__dashboard" aria-label="Panel de reviews">
        <AccountSidebar
          activeItem="reviews"
          beforeNotice={(
            <AccountReviewsFiltersPanel
              filters={filters}
              isOpen={isFilterPanelOpen}
              onApply={() => setCurrentPage(1)}
              onChange={updateFilters}
              onClearFilters={clearFilters}
              onClose={() => setIsFilterPanelOpen(false)}
            />
          )}
          displayName={displayName}
          email={email}
          onSignOut={handleSignOut}
          notice={{
            body: 'Tus reviews autenticadas quedan asociadas a tu cuenta y solo vos ves su estado completo.',
            strong: 'Las reviews publicadas siguen siendo visibles en comunidad.',
          }}
        />

        <div className="account-reviews-page__main">
          <header className="account-reviews-page__header">
            <div>
              <span className="account-page__eyebrow">My garage</span>
              <h1 id="account-reviews-page-title">Mi garaje de reviews</h1>
              <p>Explora las motos sobre las que has compartido opiniones y revisa tus experiencias por modelo.</p>
            </div>
            <div className="account-reviews-page__stats" aria-label="Resumen de reviews">
              <article>
                <span>Reviews</span>
                <strong>{reviewsStatus === 'loading' ? '...' : visibleReviews.length}</strong>
              </article>
              <article>
                <span>Motos</span>
                <strong>{reviewsStatus === 'loading' ? '...' : garageItems.length}</strong>
              </article>
              <article>
                <span>Publicadas</span>
                <strong>{reviewsStatus === 'loading' ? '...' : approvedCount}</strong>
              </article>
            </div>
          </header>

          <div className="account-reviews-page__mobile-filter-trigger">
            <button type="button" onClick={() => setIsFilterPanelOpen(true)}>
              <span className="material-symbols-outlined" aria-hidden="true">tune</span>
              Filtros
            </button>
          </div>

          {reviewsStatus === 'loading' ? (
            <ReviewSkeletonList />
          ) : reviewsStatus === 'error' ? (
            <article className="account-reviews-page__error" role="alert">
              <span className="material-symbols-outlined" aria-hidden="true">warning</span>
              <h2>No se han podido cargar tus reviews.</h2>
              <p>{reviewsError || 'Inténtalo de nuevo en unos minutos.'}</p>
              <button type="button" onClick={retryLoadReviews}>Reintentar</button>
            </article>
          ) : visibleReviews.length === 0 ? (
            <AccountReviewsEmptyState
              title="Aún no has valorado ninguna moto"
              description="Cuando compartas una experiencia, aparecerá aquí agrupada por modelo."
            />
          ) : filteredGarageItems.length === 0 ? (
            <AccountReviewsEmptyState
              title="No hay motos con esos filtros"
              description="Prueba a cambiar el segmento, el uso o la búsqueda para encontrar tus reviews."
              onClearFilters={activeFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <section className="account-reviews-page__garage-grid" aria-label="Mi garaje de reviews">
                {paginatedGarageItems.map((item) => <AccountReviewMotorcycleSummaryCard item={item} key={item.motorcycleId} />)}
              </section>
              {totalPages > 1 ? (
                <AccountPagination
                  ariaLabel="Paginación de motos con reviews"
                  className="account-reviews-page__pagination"
                  currentClassName="account-reviews-page__pagination-current"
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
