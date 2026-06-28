import { useCallback, useEffect, useMemo, useState } from 'react';
import adminHeroImage from '../../../assets/hero-admin.png';
import { useAuth } from '../../../features/auth';
import { findBikeById, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import { getAllReviews } from '../../../services/adminReviewService';
import {
  type CreateReviewAuthContext,
  MotorcycleReview,
  MotorcycleReviewRidingStyle,
} from '../../../services/motorcycleReviewService';
import {
  matchesMotorcycleSegmentFilter,
  motorcycleLicenseFilterOptions,
  motorcycleSegmentFilterOptions,
  type MotorcycleSegmentFilterValue,
} from '../../../shared/filters/motorcycleFilterOptions';
import { getBikeA2Status, type BikeA2Status } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { FilterGroup } from '../../../shared/ui/filters/FilterGroup';
import { FilterOptionButton } from '../../../shared/ui/filters/FilterOptionButton';
import { PageHero } from '../../ui/PageHero';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { AccountQuickLinksNav } from '../AccountPage/AccountQuickLinksNav';
import { AdminGate } from './adminSharedUi';
import {
  getDisplayName,
  getTimestamp,
  formatDate,
  formatPendingReviewCount,
} from './adminPageUtils';
import {
  adminLicenseOptions,
  adminRidingStyleOptions,
  reviewSortOptions,
  reviewSourceOptions,
  reviewStatusOptions,
  reviewVerifiedOptions,
} from './adminPageConstants';
import '../AccountPage/AccountPage.scss';
import './AdminPage.scss';


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
