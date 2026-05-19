import { useEffect, useState } from 'react';
import { ModelRequestCard } from '../../model-requests/ModelRequestCard';
import { formatAccountDate, truncateAccountText } from '../../model-requests/modelRequestPresentation';
import accountHeroImage from '../../../assets/hero-metodology.png';
import { findBikeById, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import { useAuth } from '../../../features/auth';
import { getModelRequestsByUserId, type ModelRequest } from '../../../services/modelRequestService';
import { getReviewsByUserId, type MotorcycleReview, type MotorcycleReviewRidingStyle, type MotorcycleReviewStatus } from '../../../services/motorcycleReviewService';
import { AccountSidebar } from './AccountSidebar';
import './AccountPage.scss';

function getProfileName(profileName: string | null | undefined, email: string | undefined) {
  return profileName?.trim() || email || 'Usuario MotoAtlas';
}

type AccountReviewsStatus = 'idle' | 'loading' | 'success' | 'error';
type AccountRequestsStatus = 'idle' | 'loading' | 'success' | 'error';

const reviewStatusLabels: Record<MotorcycleReviewStatus, string> = {
  pending: 'Pendiente de revisión',
  approved: 'Publicada',
  rejected: 'Rechazada',
  hidden: 'Oculta',
};

const ridingStyleLabels: Record<MotorcycleReviewRidingStyle, string> = {
  ciudad: 'Ciudad',
  viaje: 'Viaje',
  offroad: 'Off-road',
  deportivo: 'Deportivo',
  pasajero: 'Pasajero',
  diario: 'Diario',
};

function getReviewMotorcycleDisplay(review: MotorcycleReview) {
  const catalogBike = findBikeById(review.motorcycleId);
  const motorcycle = review.motorcycle;
  const name = motorcycle
    ? `${motorcycle.brand} ${motorcycle.model}`
    : catalogBike
      ? getBikeDisplayName(catalogBike)
      : review.motorcycleId;
  const year = motorcycle?.year ?? catalogBike?.year;
  const detailHref = catalogBike ? getBikeDetailHash(catalogBike) : `#/motos/${review.motorcycleId}`;

  return {
    communityHref: `#/comunidad/${review.motorcycleId}`,
    detailHref,
    name,
    year,
  };
}

export function AccountPage() {
  const { isAuthenticated, isLoading, profile, session, signOut, user } = useAuth();
  const [error, setError] = useState('');
  const [modelRequests, setModelRequests] = useState<readonly ModelRequest[]>([]);
  const [modelRequestsError, setModelRequestsError] = useState('');
  const [modelRequestsStatus, setModelRequestsStatus] = useState<AccountRequestsStatus>('idle');
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsStatus, setReviewsStatus] = useState<AccountReviewsStatus>('idle');
  const displayName = getProfileName(profile?.displayName, user?.email);
  const email = user?.email ?? 'Email no disponible';
  const visibleModelRequests = modelRequests.filter((request) => request.userId === user?.id);
  const recentModelRequests = visibleModelRequests.slice(0, 2);
  const visibleReviews = reviews.filter((review) => review.userId === user?.id);

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
    if (isLoading || !isAuthenticated) {
      setModelRequests([]);
      setModelRequestsError('');
      setModelRequestsStatus('idle');
      return undefined;
    }

    if (!user?.id || !session?.access_token) {
      setModelRequests([]);
      setModelRequestsError('');
      setModelRequestsStatus('success');
      return undefined;
    }

    let isMounted = true;
    setModelRequestsStatus('loading');
    setModelRequestsError('');

    getModelRequestsByUserId({ accessToken: session.access_token, userId: user.id })
      .then((nextModelRequests) => {
        if (isMounted) {
          setModelRequests(nextModelRequests);
          setModelRequestsStatus('success');
        }
      })
      .catch((modelRequestsLoadError) => {
        if (isMounted) {
          setModelRequests([]);
          setModelRequestsError(
            modelRequestsLoadError instanceof Error ? modelRequestsLoadError.message : 'No se han podido cargar tus solicitudes.',
          );
          setModelRequestsStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading, session?.access_token, user?.id]);

  if (isLoading) {
    return (
      <main className="account-page" aria-labelledby="account-page-title">
        <section className="account-page__hero account-page__hero--empty" role="status">
          <img className="account-page__hero-image" src={accountHeroImage} alt="" aria-hidden="true" />
          <div className="account-page__hero-content">
            <span className="account-page__eyebrow">Mi cuenta</span>
            <h1 id="account-page-title">Cargando sesión...</h1>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="account-page" aria-labelledby="account-page-title">
        <section className="account-page__hero account-page__hero--empty">
          <img className="account-page__hero-image" src={accountHeroImage} alt="" aria-hidden="true" />
          <div className="account-page__hero-content">
            <span className="account-page__eyebrow">Acceso privado</span>
            <h1 id="account-page-title">Inicia sesión para ver Mi cuenta</h1>
            <p>Tu panel personal guardará futuras reviews, solicitudes de modelo y preferencias.</p>
            <a className="account-page__button" href="#/login">Iniciar sesión</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="account-page" aria-labelledby="account-page-title">
      <section className="account-page__hero">
        <img className="account-page__hero-image" src={accountHeroImage} alt="" aria-hidden="true" />
        <div className="account-page__hero-content">
          <div>
            <span className="account-page__eyebrow">Usuario</span>
            <h1 id="account-page-title">{displayName}</h1>
            <p>Panel de control de ingeniería personal. Gestiona tus especificaciones y reviews asociadas.</p>
          </div>
          <a className="account-page__button account-page__button--ghost" href="#/cuenta">
            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
            Editar perfil
          </a>
        </div>
      </section>

      {error ? <p className="account-page__alert" role="alert">{error}</p> : null}

      <section className="account-page__dashboard" aria-label="Panel de cuenta">
        <AccountSidebar
          activeItem="overview"
          displayName={displayName}
          email={email}
          onSignOut={handleSignOut}
          notice={{
            body: 'Cuando envíes una review con sesión iniciada, quedará asociada a tu cuenta automáticamente.',
            strong: 'Tu alias seguirá siendo el nombre visible para otros usuarios.',
          }}
        />

        <div className="account-page__main">
          <section className="account-page__section" aria-labelledby="account-reviews-title">
            <header className="account-page__section-header">
              <h2 id="account-reviews-title">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                Mis reviews
              </h2>
              <span>Total: {reviewsStatus === 'loading' ? '...' : visibleReviews.length}</span>
            </header>
            {reviewsStatus === 'loading' ? (
              <article className="account-page__empty-state" role="status">
                <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">sync</span>
                <h3>Cargando tus reviews...</h3>
                <p>Estamos recuperando las experiencias asociadas a tu cuenta.</p>
              </article>
            ) : reviewsStatus === 'error' ? (
              <article className="account-page__empty-state account-page__empty-state--error" role="alert">
                <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">warning</span>
                <h3>No se han podido cargar tus reviews.</h3>
                <p>{reviewsError || 'Inténtalo de nuevo en unos minutos.'}</p>
              </article>
            ) : visibleReviews.length === 0 ? (
              <article className="account-page__empty-state">
                <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">history</span>
                <h3>Aún no has enviado reviews</h3>
                <p>Cuando compartas tu experiencia con una moto, aparecerá aquí junto con su estado de revisión.</p>
                <a className="account-page__button" href="#/buscador">Explorar motos</a>
              </article>
            ) : (
              <div className="account-page__reviews-list">
                {visibleReviews.map((review) => {
                  const motorcycle = getReviewMotorcycleDisplay(review);

                  return (
                    <article className="account-page__review-card" key={review.id}>
                      <div className="account-page__review-main">
                        <span className={`account-page__status account-page__status--${review.status}`}>
                          {reviewStatusLabels[review.status]}
                        </span>
                        <h3>{motorcycle.name}</h3>
                        <p>{truncateAccountText(review.comment)}</p>
                      </div>
                      <dl className="account-page__review-meta">
                        <div>
                          <dt>Rating</dt>
                          <dd>{review.rating}/5</dd>
                        </div>
                        <div>
                          <dt>Alias</dt>
                          <dd>{review.userName}</dd>
                        </div>
                        <div>
                          <dt>Uso</dt>
                          <dd>{ridingStyleLabels[review.ridingStyle]}</dd>
                        </div>
                        <div>
                          <dt>Fecha</dt>
                          <dd>{formatAccountDate(review.createdAt)}</dd>
                        </div>
                      </dl>
                      <footer className="account-page__review-actions">
                        {motorcycle.year ? <span>MY {motorcycle.year}</span> : <span>{review.motorcycleId}</span>}
                        <a href={motorcycle.detailHref}>Ver ficha</a>
                        <a href={motorcycle.communityHref}>Ver comunidad</a>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="account-page__section" aria-labelledby="account-requests-title">
            <header className="account-page__section-header">
              <h2 id="account-requests-title">
                <span className="material-symbols-outlined" aria-hidden="true">analytics</span>
                Mis solicitudes
              </h2>
              <div className="account-page__section-actions">
                <span>Total: {modelRequestsStatus === 'loading' ? '...' : visibleModelRequests.length}</span>
                <a className="account-page__section-link-button" href="#/cuenta/solicitudes">Ver todas mis solicitudes</a>
              </div>
            </header>
            {modelRequestsStatus === 'loading' ? (
              <article className="account-page__empty-state" role="status">
                <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">sync</span>
                <h3>Cargando tus solicitudes...</h3>
                <p>Estamos recuperando los modelos solicitados desde tu cuenta.</p>
              </article>
            ) : modelRequestsStatus === 'error' ? (
              <article className="account-page__empty-state account-page__empty-state--error" role="alert">
                <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">warning</span>
                <h3>No se han podido cargar tus solicitudes.</h3>
                <p>{modelRequestsError || 'Inténtalo de nuevo en unos minutos.'}</p>
              </article>
            ) : visibleModelRequests.length === 0 ? (
              <div className="account-page__requests-summary-grid">
                <article className="account-page__empty-state account-page__empty-state--compact">
                  <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">add_chart</span>
                  <h3>Aún no has solicitado modelos.</h3>
                  <p>¿No encuentras una moto? Solicita su ficha técnica y aparecerá en tu radar.</p>
                </article>
                <a className="account-page__request-cta-card" href="#/solicitar-modelo">
                  <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
                  <h3>Solicitar otro modelo</h3>
                  <p>Propón una moto para ampliar la base de datos técnica.</p>
                </a>
              </div>
            ) : (
              <div className="account-page__requests-summary-grid">
                {recentModelRequests.map((request) => (
                  <ModelRequestCard
                    commentMaxLength={150}
                    headingLevel={3}
                    key={request.id}
                    request={request}
                    testId="account-request-summary-card"
                  />
                ))}
                <a className="account-page__request-cta-card" href="#/solicitar-modelo">
                  <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
                  <h3>Solicitar otro modelo</h3>
                  <p>¿No encuentras una moto? Propón un nuevo modelo para ampliar la base de datos.</p>
                </a>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
