import { useEffect, useMemo, useState } from 'react';
import { ModelRequestCard } from '../../model-requests/ModelRequestCard';
import { useAuth } from '../../../features/auth';
import { getModelRequestsByUserId, type ModelRequest, type ModelRequestStatus } from '../../../services/modelRequestService';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { AccountSidebar } from '../AccountPage/AccountSidebar';
import '../AccountPage/AccountPage.scss';
import './AccountRequestsPage.scss';

type AccountRequestsStatus = 'idle' | 'loading' | 'success' | 'error';
type StatusFilter = 'all' | ModelRequestStatus;
type SortOption = 'recent' | 'oldest' | 'year-desc' | 'year-asc';

const REQUESTS_PER_PAGE = 8;

function getProfileName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Usuario MotoAtlas';
}

function sortModelRequests(requests: readonly ModelRequest[], sort: SortOption) {
  return [...requests].sort((left, right) => {
    if (sort === 'oldest') {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    }

    if (sort === 'year-desc') {
      return right.year - left.year || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (sort === 'year-asc') {
      return left.year - right.year || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function filterModelRequests(requests: readonly ModelRequest[], search: string, status: StatusFilter) {
  const normalizedSearch = search.trim().toLowerCase();

  return requests.filter((request) => {
    const matchesStatus = status === 'all' || request.status === status;
    const matchesSearch = !normalizedSearch || `${request.brand} ${request.model}`.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
}

function RequestCtaCard() {
  return (
    <a className="account-requests-page__cta-card" href="#/solicitar-modelo">
      <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
      <h2>Solicitar otro modelo</h2>
      <p>¿No encuentras una moto? Propón un nuevo modelo para ampliar la base de datos.</p>
    </a>
  );
}

export function AccountRequestsPage() {
  const { isAuthenticated, isLoading, profile, session, signOut, user } = useAuth();
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<readonly ModelRequest[]>([]);
  const [requestsError, setRequestsError] = useState('');
  const [requestsStatus, setRequestsStatus] = useState<AccountRequestsStatus>('idle');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const displayName = getProfileName(profile?.displayName, user?.email);
  const email = user?.email ?? 'Email no disponible';
  const visibleRequests = requests.filter((request) => request.userId === user?.id);
  const pendingCount = visibleRequests.filter((request) => request.status === 'pending').length;
  const filteredRequests = useMemo(
    () => sortModelRequests(filterModelRequests(visibleRequests, search, statusFilter), sort),
    [search, sort, statusFilter, visibleRequests],
  );
  const requestPageCount = Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * REQUESTS_PER_PAGE, currentPage * REQUESTS_PER_PAGE);

  const resetPagination = () => setCurrentPage(1);

  const handleSignOut = async () => {
    setError('');

    try {
      await signOut();
      window.location.hash = '#/';
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'No se ha podido cerrar sesión.');
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      setRequests([]);
      setRequestsError('');
      setRequestsStatus('idle');
      return undefined;
    }

    if (!user?.id || !session?.access_token) {
      setRequests([]);
      setRequestsError('');
      setRequestsStatus('success');
      return undefined;
    }

    let isMounted = true;
    setRequestsStatus('loading');
    setRequestsError('');

    getModelRequestsByUserId({ accessToken: session.access_token, userId: user.id })
      .then((nextRequests) => {
        if (isMounted) {
          setRequests(nextRequests);
          setRequestsStatus('success');
        }
      })
      .catch((requestsLoadError) => {
        if (isMounted) {
          setRequests([]);
          setRequestsError(requestsLoadError instanceof Error ? requestsLoadError.message : 'No se han podido cargar tus solicitudes.');
          setRequestsStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading, session?.access_token, user?.id]);

  useEffect(() => {
    if (currentPage > requestPageCount) {
      setCurrentPage(Math.max(1, requestPageCount));
    }
  }, [currentPage, requestPageCount]);

  if (isLoading) {
    return (
      <main className="account-requests-page" aria-labelledby="account-requests-page-title">
        <section className="account-requests-page__private-state" role="status">
          <span className="account-page__eyebrow">Mis solicitudes</span>
          <h1 id="account-requests-page-title">Cargando sesión...</h1>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="account-requests-page" aria-labelledby="account-requests-page-title">
        <section className="account-requests-page__private-state">
          <span className="account-page__eyebrow">Acceso privado</span>
          <h1 id="account-requests-page-title">Inicia sesión para ver tus solicitudes</h1>
          <p>Solo las solicitudes asociadas a tu cuenta aparecen en este panel.</p>
          <a className="account-page__button" href="#/login">Iniciar sesión</a>
        </section>
      </main>
    );
  }

  return (
    <main className="account-requests-page" aria-labelledby="account-requests-page-title">
      {error ? <p className="account-page__alert" role="alert">{error}</p> : null}
      <section className="account-page__dashboard" aria-label="Panel de solicitudes">
        <AccountSidebar
          activeItem="requests"
          displayName={displayName}
          email={email}
          onSignOut={handleSignOut}
          notice={{
            body: 'Las solicitudes autenticadas quedan asociadas a tu cuenta y solo vos podés ver su estado completo.',
            strong: 'Las solicitudes anónimas no aparecen aquí porque no tienen user_id.',
          }}
        />

        <div className="account-requests-page__main">
          <header className="account-requests-page__header">
            <div>
              <span className="account-page__eyebrow">Model requests</span>
              <h1 id="account-requests-page-title">Todas mis solicitudes</h1>
              <p>Consulta los modelos que has propuesto para ampliar el catálogo MotoAtlas.</p>
            </div>
            <div className="account-requests-page__stats" aria-label="Resumen de solicitudes">
              <article>
                <span>Total</span>
                <strong>{requestsStatus === 'loading' ? '...' : visibleRequests.length}</strong>
              </article>
              <article>
                <span>Pendientes</span>
                <strong>{requestsStatus === 'loading' ? '...' : pendingCount}</strong>
              </article>
            </div>
          </header>

          <section className="account-requests-page__filters" aria-label="Filtros de solicitudes">
            <label htmlFor="account-requests-search">
              Buscar
              <input
                id="account-requests-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPagination();
                }}
                placeholder="Marca o modelo"
              />
            </label>
            <label htmlFor="account-requests-status">
              Estado
              <select
                id="account-requests-status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  resetPagination();
                }}
              >
                <option value="all">Todas</option>
                <option value="pending">Pendiente</option>
                <option value="reviewed">Revisada</option>
                <option value="approved">Aprobada</option>
                <option value="rejected">Rechazada</option>
              </select>
            </label>
            <label htmlFor="account-requests-sort">
              Orden
              <select
                id="account-requests-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortOption);
                  resetPagination();
                }}
              >
                <option value="recent">Más recientes</option>
                <option value="oldest">Más antiguas</option>
                <option value="year-desc">Año más reciente</option>
                <option value="year-asc">Año más antiguo</option>
              </select>
            </label>
          </section>

          {requestsStatus === 'loading' ? (
            <article className="account-page__empty-state" role="status">
              <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">sync</span>
              <h2>Cargando tus solicitudes...</h2>
              <p>Estamos recuperando tus propuestas de catálogo.</p>
            </article>
          ) : requestsStatus === 'error' ? (
            <article className="account-page__empty-state account-page__empty-state--error" role="alert">
              <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">warning</span>
              <h2>No se han podido cargar tus solicitudes.</h2>
              <p>{requestsError || 'Inténtalo de nuevo en unos minutos.'}</p>
            </article>
          ) : visibleRequests.length === 0 ? (
            <div className="account-requests-page__empty-layout">
              <article className="account-page__empty-state">
                <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">add_chart</span>
                <h2>Aún no has solicitado modelos.</h2>
                <p>Cuando propongas una moto con sesión iniciada, aparecerá aquí junto con su estado.</p>
              </article>
              <RequestCtaCard />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="account-requests-page__empty-layout">
              <article className="account-page__empty-state">
                <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">filter_alt_off</span>
                <h2>No hay solicitudes con esos filtros.</h2>
                <p>Probá cambiando la búsqueda, el estado o el orden.</p>
              </article>
              <RequestCtaCard />
            </div>
          ) : (
            <>
              <section className="account-requests-page__grid" aria-label="Listado de solicitudes">
                {paginatedRequests.map((request) => <ModelRequestCard request={request} key={request.id} />)}
                <RequestCtaCard />
              </section>
              <AccountPagination
                ariaLabel="Paginación de solicitudes"
                className="account-requests-page__pagination"
                currentClassName="account-requests-page__pagination-current"
                currentPage={currentPage}
                totalPages={requestPageCount}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
