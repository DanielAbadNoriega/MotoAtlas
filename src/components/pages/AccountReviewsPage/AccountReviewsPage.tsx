import { useEffect, useMemo, useState } from 'react';
import { AccountSidebar } from '../AccountPage/AccountSidebar';
import { AccountPagination } from '../AccountPage/AccountPagination';
import '../AccountPage/AccountPage.scss';
import { AccountReviewCard, getAccountReviewMotorcycleDisplay } from '../../reviews/AccountReviewCard';
import { useAuth } from '../../../features/auth';
import {
  getReviewsByUserId,
  type MotorcycleReview,
  type MotorcycleReviewRidingStyle,
  type MotorcycleReviewStatus,
} from '../../../services/motorcycleReviewService';
import { AccountReviewsEmptyState } from './AccountReviewsEmptyState';
import './AccountReviewsPage.scss';

type AccountReviewsStatus = 'idle' | 'loading' | 'success' | 'error';
type StatusFilter = 'all' | MotorcycleReviewStatus;
type RidingStyleFilter = 'all' | MotorcycleReviewRidingStyle;
type SortOption = 'recent' | 'oldest' | 'rating-desc' | 'rating-asc' | 'kilometers-desc';

const REVIEWS_PER_PAGE = 5;

function getProfileName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Usuario MotoAtlas';
}

function sortReviews(reviews: readonly MotorcycleReview[], sort: SortOption) {
  return [...reviews].sort((left, right) => {
    if (sort === 'oldest') {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    }

    if (sort === 'rating-desc') {
      return right.rating - left.rating || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (sort === 'rating-asc') {
      return left.rating - right.rating || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (sort === 'kilometers-desc') {
      return (right.kilometers ?? -1) - (left.kilometers ?? -1) || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function filterReviews(
  reviews: readonly MotorcycleReview[],
  search: string,
  status: StatusFilter,
  ridingStyle: RidingStyleFilter,
) {
  const normalizedSearch = search.trim().toLowerCase();

  return reviews.filter((review) => {
    const motorcycle = getAccountReviewMotorcycleDisplay(review);
    const matchesSearch = !normalizedSearch || motorcycle.searchText.includes(normalizedSearch);
    const matchesStatus = status === 'all' || review.status === status;
    const matchesRidingStyle = ridingStyle === 'all' || review.ridingStyle === ridingStyle;

    return matchesSearch && matchesStatus && matchesRidingStyle;
  });
}

function ReviewSkeletonList() {
  return (
    <div className="account-reviews-page__list" aria-label="Cargando reviews">
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ridingStyleFilter, setRidingStyleFilter] = useState<RidingStyleFilter>('all');
  const [sort, setSort] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const displayName = getProfileName(profile?.displayName, user?.email);
  const email = user?.email ?? 'Email no disponible';
  const visibleReviews = reviews.filter((review) => review.userId === user?.id);
  const pendingCount = visibleReviews.filter((review) => review.status === 'pending').length;
  const approvedCount = visibleReviews.filter((review) => review.status === 'approved').length;
  const filteredReviews = useMemo(
    () => sortReviews(filterReviews(visibleReviews, search, statusFilter, ridingStyleFilter), sort),
    [ridingStyleFilter, search, sort, statusFilter, visibleReviews],
  );
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);
  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== 'all' || ridingStyleFilter !== 'all' || sort !== 'recent';

  const resetPagination = () => setCurrentPage(1);
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRidingStyleFilter('all');
    setSort('recent');
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
              <span className="account-page__eyebrow">My reviews</span>
              <h1 id="account-reviews-page-title">Todas mis reviews</h1>
              <p>Consulta tus opiniones enviadas, su estado de revisión y la experiencia registrada con cada moto.</p>
            </div>
            <div className="account-reviews-page__stats" aria-label="Resumen de reviews">
              <article>
                <span>Total</span>
                <strong>{reviewsStatus === 'loading' ? '...' : visibleReviews.length}</strong>
              </article>
              <article>
                <span>Pendientes</span>
                <strong>{reviewsStatus === 'loading' ? '...' : pendingCount}</strong>
              </article>
              <article>
                <span>Publicadas</span>
                <strong>{reviewsStatus === 'loading' ? '...' : approvedCount}</strong>
              </article>
            </div>
          </header>

          <section className="account-reviews-page__filters" aria-label="Filtros de reviews">
            <label className="account-reviews-page__search" htmlFor="account-reviews-search">
              Buscar
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                id="account-reviews-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPagination();
                }}
                placeholder="Marca o modelo"
              />
            </label>
            <label htmlFor="account-reviews-status">
              Estado
              <select
                id="account-reviews-status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  resetPagination();
                }}
              >
                <option value="all">Todas</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Publicada</option>
                <option value="rejected">Rechazada</option>
                <option value="hidden">Oculta</option>
              </select>
            </label>
            <label htmlFor="account-reviews-riding-style">
              Uso
              <select
                id="account-reviews-riding-style"
                value={ridingStyleFilter}
                onChange={(event) => {
                  setRidingStyleFilter(event.target.value as RidingStyleFilter);
                  resetPagination();
                }}
              >
                <option value="all">Todos</option>
                <option value="ciudad">Ciudad</option>
                <option value="viaje">Viaje</option>
                <option value="offroad">Offroad</option>
                <option value="deportivo">Deportivo</option>
                <option value="pasajero">Pasajero</option>
                <option value="diario">Diario</option>
              </select>
            </label>
            <label htmlFor="account-reviews-sort">
              Orden
              <select
                id="account-reviews-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortOption);
                  resetPagination();
                }}
              >
                <option value="recent">Recientes</option>
                <option value="oldest">Antiguas</option>
                <option value="rating-desc">Rating alto</option>
                <option value="rating-asc">Rating bajo</option>
                <option value="kilometers-desc">Más kilómetros</option>
              </select>
            </label>
          </section>

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
              title="Aún no has enviado reviews"
              description="Cuando compartas tu experiencia con una moto, aparecerá aquí junto con su estado de revisión."
            />
          ) : filteredReviews.length === 0 ? (
            <AccountReviewsEmptyState onClearFilters={hasActiveFilters ? clearFilters : undefined} />
          ) : (
            <>
              <section className="account-reviews-page__list" aria-label="Listado de reviews">
                {paginatedReviews.map((review) => <AccountReviewCard review={review} key={review.id} />)}
              </section>
              <AccountPagination
                ariaLabel="Paginación de reviews"
                className="account-reviews-page__pagination"
                currentClassName="account-reviews-page__pagination-current"
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
