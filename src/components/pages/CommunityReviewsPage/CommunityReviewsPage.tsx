import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { AccountReviewsEmptyState } from '../AccountReviewsPage/AccountReviewsEmptyState';
import { AccountReviewCard, getAccountReviewMotorcycleDisplay } from '../../reviews/AccountReviewCard';
import {
  getApprovedCommunityReviews,
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
import './CommunityReviewsPage.scss';

type ReviewsStatus = 'idle' | 'loading' | 'success' | 'error';
type LicenseFilter = 'all' | BikeA2Status;
type RatingFilter = 'all' | '5' | '4-plus' | '3-minus';
type RidingStyleFilter = 'all' | MotorcycleReviewRidingStyle;
type SortOption = 'recent' | 'rating-desc' | 'kilometers-desc';

type CommunityReviewFilters = Readonly<{
  license: LicenseFilter;
  rating: RatingFilter;
  ridingStyle: RidingStyleFilter;
  search: string;
  segment: MotorcycleSegmentFilterValue;
  sort: SortOption;
}>;

const REVIEWS_PER_PAGE = 9;
const defaultFilters: CommunityReviewFilters = {
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
  { label: 'Más kilómetros', value: 'kilometers-desc' },
] satisfies readonly { label: string; value: SortOption }[];

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
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

    return getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
  });
}

function filterReviews(reviews: readonly MotorcycleReview[], filters: CommunityReviewFilters) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return reviews.filter((review) => {
    if (review.status !== 'approved') {
      return false;
    }

    const motorcycle = getAccountReviewMotorcycleDisplay(review);
    const matchesSearch = !normalizedSearch || motorcycle.searchText.includes(normalizedSearch);
    const matchesSegmentFilter = matchesMotorcycleSegmentFilter(motorcycle.segment, filters.segment);
    const matchesLicense = filters.license === 'all' || motorcycle.a2Status === filters.license;
    const matchesRidingStyle = filters.ridingStyle === 'all' || review.ridingStyle === filters.ridingStyle;

    return matchesSearch && matchesSegmentFilter && matchesLicense && matchesRating(review, filters.rating) && matchesRidingStyle;
  });
}

function hasActiveFilters(filters: CommunityReviewFilters) {
  return (
    Boolean(filters.search.trim()) ||
    filters.segment !== defaultFilters.segment ||
    filters.license !== defaultFilters.license ||
    filters.rating !== defaultFilters.rating ||
    filters.ridingStyle !== defaultFilters.ridingStyle ||
    filters.sort !== defaultFilters.sort
  );
}

function ReviewSkeletonList() {
  return (
    <div className="community-reviews-page__list" aria-label="Cargando reviews de comunidad">
      {Array.from({ length: 3 }, (_, index) => (
        <article className="community-reviews-page__skeleton-card" key={index} role="status">
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

function FilterGroup({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <details className="community-reviews-page__filter-group" open>
      <summary>
        <span>{title}</span>
        <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </summary>
      <div className="community-reviews-page__filter-group-body">{children}</div>
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
  const buttonClasses = ['community-reviews-page__filter-option', active ? 'community-reviews-page__filter-option--active' : '', className]
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
    <span className="community-reviews-page__filter-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < filledStars ? 'community-reviews-page__filter-star--filled' : undefined} key={index}>star</span>
      ))}
    </span>
  );
}

function CommunityReviewFiltersPanel({
  filters,
  isOpen,
  onApply,
  onChange,
  onClose,
  onReset,
}: Readonly<{
  filters: CommunityReviewFilters;
  isOpen: boolean;
  onApply: () => void;
  onChange: (next: Partial<CommunityReviewFilters>) => void;
  onClose: () => void;
  onReset: () => void;
}>) {
  const panelClasses = ['community-reviews-page__filters', isOpen ? 'community-reviews-page__filters--open' : ''].filter(Boolean).join(' ');

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
      {isOpen ? <button className="community-reviews-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros" /> : null}
      <aside
        className={panelClasses}
        aria-label="Filtros de reviews"
        aria-labelledby="community-reviews-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="community-reviews-page__sheet-handle" aria-hidden="true" />
        <div className="community-reviews-page__filters-header">
          <h2 id="community-reviews-filters-title">Filtros</h2>
          <button type="button" aria-label="Limpiar filtros de reviews" onClick={onReset}>Limpiar filtros</button>
          <button className="community-reviews-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="community-reviews-page__filters-body">
          <label className="community-reviews-page__search" htmlFor="community-reviews-search">
            Buscar por marca o modelo
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              id="community-reviews-search"
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="BMW, Tuareg, MT-09..."
            />
          </label>

          <FilterGroup title="Segmento">
            <div className="community-reviews-page__segment-grid">
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
            <div className="community-reviews-page__pill-list">
              {motorcycleLicenseFilterOptions.map((option) => (
                <FilterOptionButton
                  active={filters.license === option.value}
                  ariaLabel={option.label}
                  className="community-reviews-page__filter-option--pill"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ license: filters.license === option.value ? 'all' : option.value })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Rating">
            <div className="community-reviews-page__rating-grid">
              {ratingOptions.map((option) => (
                <FilterOptionButton
                  active={filters.rating === option.value}
                  ariaLabel={option.ariaLabel}
                  className="community-reviews-page__filter-option--rating"
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
            <div className="community-reviews-page__pill-list">
              {ridingStyleOptions.map((option) => (
                <FilterOptionButton
                  active={filters.ridingStyle === option.value}
                  ariaLabel={`Uso principal: ${option.label}`}
                  className="community-reviews-page__filter-option--pill"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ ridingStyle: option.value })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Orden">
            <div className="community-reviews-page__sort-grid">
              {sortOptions.map((option) => (
                <FilterOptionButton
                  active={filters.sort === option.value}
                  ariaLabel={`Orden: ${option.label}`}
                  className="community-reviews-page__filter-option--sort"
                  key={option.value}
                  label={option.label}
                  onClick={() => onChange({ sort: option.value })}
                />
              ))}
            </div>
          </FilterGroup>
        </div>

        <footer className="community-reviews-page__filters-footer">
          <button type="button" aria-label="Restablecer filtros de reviews" onClick={onReset}>Limpiar filtros</button>
          <button type="button" onClick={applyFilters}>Aplicar filtros</button>
        </footer>
      </aside>
    </>
  );
}

export function CommunityReviewsPage() {
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [status, setStatus] = useState<ReviewsStatus>('idle');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<CommunityReviewFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const loadReviews = () => {
    setStatus('loading');
    setError('');

    getApprovedCommunityReviews()
      .then((nextReviews) => {
        setReviews(nextReviews.filter((review) => review.status === 'approved'));
        setStatus('success');
      })
      .catch((reviewsError) => {
        setReviews([]);
        setError(reviewsError instanceof Error ? reviewsError.message : 'No se han podido cargar las reviews de comunidad.');
        setStatus('error');
      });
  };

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');
    setError('');

    getApprovedCommunityReviews()
      .then((nextReviews) => {
        if (isMounted) {
          setReviews(nextReviews.filter((review) => review.status === 'approved'));
          setStatus('success');
        }
      })
      .catch((reviewsError) => {
        if (isMounted) {
          setReviews([]);
          setError(reviewsError instanceof Error ? reviewsError.message : 'No se han podido cargar las reviews de comunidad.');
          setStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReviews = useMemo(() => sortReviews(filterReviews(reviews, filters), filters.sort), [filters, reviews]);
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);
  const activeFilters = hasActiveFilters(filters);

  const updateFilters = (next: Partial<CommunityReviewFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="community-reviews-page" aria-labelledby="community-reviews-title">
      <section className="community-reviews-page__hero">
        <div>
          <span>Archivo público</span>
          <h1 id="community-reviews-title">Reviews de la comunidad</h1>
          <p>
            Opiniones aprobadas de propietarios reales: kilómetros, uso, pros y contras para elegir con más contexto.
          </p>
          <a href="#/buscador">Buscar moto para opinar</a>
        </div>
      </section>

      <div className="community-reviews-page__mobile-filter-trigger">
        <button type="button" onClick={() => setIsFilterPanelOpen(true)}>
          <span className="material-symbols-outlined" aria-hidden="true">tune</span>
          Filtros de reviews
        </button>
      </div>

      <section className="community-reviews-page__content" aria-label="Archivo de reviews aprobadas">
        <CommunityReviewFiltersPanel
          filters={filters}
          isOpen={isFilterPanelOpen}
          onApply={() => undefined}
          onChange={updateFilters}
          onClose={() => setIsFilterPanelOpen(false)}
          onReset={clearFilters}
        />

        <div className="community-reviews-page__results">
          <header className="community-reviews-page__results-header">
            <div>
              <span>Últimos reportes</span>
              <h2>{numberFormatter.format(filteredReviews.length)} reviews aprobadas</h2>
              <p>Orden inicial por fecha: las opiniones más recientes aparecen primero.</p>
            </div>
          </header>

          {status === 'loading' || status === 'idle' ? (
            <ReviewSkeletonList />
          ) : status === 'error' ? (
            <article className="community-reviews-page__error" role="alert">
              <span className="material-symbols-outlined" aria-hidden="true">warning</span>
              <h2>No se han podido cargar las reviews.</h2>
              <p>{error || 'Inténtalo de nuevo en unos minutos.'}</p>
              <button type="button" onClick={loadReviews}>Reintentar</button>
            </article>
          ) : filteredReviews.length === 0 ? (
            <AccountReviewsEmptyState
              title="No hay reviews con estos filtros"
              description="Prueba a cambiar el segmento, el uso principal o la búsqueda para descubrir más opiniones."
              onClearFilters={activeFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <section className="community-reviews-page__list" aria-label="Listado público de reviews aprobadas">
                {paginatedReviews.map((review) => (
                  <AccountReviewCard headingLevel={3} key={review.id} review={review} variant="community" />
                ))}
              </section>
              <AccountPagination
                ariaLabel="Paginación de reviews de comunidad"
                className="community-reviews-page__pagination"
                currentClassName="community-reviews-page__pagination-current"
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
