import { useEffect, useMemo, useRef, useState } from 'react';
import { getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import {
  getApprovedReviewsByMotorcycleId,
  type MotorcycleReview,
  type MotorcycleReviewRidingStyle,
} from '../../../services/motorcycleReviewService';
import { getBikeA2Badge, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { getComparatorHashFromBikes } from '../../../shared/routing/routeUtils';
import { formatReviewAggregate, getReviewAggregate, getReviewUserName, isReviewVerified } from '../../../shared/reviews/reviewUtils';
import { getInitialsSafe, getTopCommunityItemsSafe, getMostCommonRidingStyleSafe, normalizeRidingStyleSafe } from '../../../shared/reviews/communityUtils';
import type { Bike } from '../../../types/bike';
import { ReviewModal } from '../../reviews/ReviewModal';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import './MotorcycleCommunityPage.scss';

type MotorcycleCommunityPageProps = Readonly<{
  bike?: Bike;
  motorcycleId?: string;
}>;

type CommunityMetric = Readonly<{
  label: string;
  value: string;
  detail?: string;
}>;

const numberFormatter = new Intl.NumberFormat('es-ES');
const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const ridingStyleLabels: Record<MotorcycleReviewRidingStyle, string> = {
  ciudad: 'Ciudad',
  deportivo: 'Deportivo',
  diario: 'Diario',
  offroad: 'Off-road',
  pasajero: 'Pasajero',
  viaje: 'Viaje',
};

function getApprovedReviews(reviews: readonly MotorcycleReview[]) {
  return (reviews ?? []).filter((review) => review?.status === 'approved');
}

function getAverage(values: readonly (number | null)[]) {
  const validValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (validValues.length === 0) {
    return null;
  }

  return Math.round(validValues.reduce((total, value) => total + value, 0) / validValues.length);
}

function getStarDistribution(reviews: readonly MotorcycleReview[]) {
  return [5, 4, 3, 2, 1].map((rating) => ({
    count: reviews.filter((review) => review.rating === rating).length,
    rating,
  }));
}

function getMostCommonRidingStyle(reviews: readonly MotorcycleReview[]) {
  return getMostCommonRidingStyleSafe(reviews);
}

function getInitials(name: string) {
  return getInitialsSafe(name);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente';
  }

  return dateFormatter.format(date);
}

function getTopCommunityItems(reviews: readonly MotorcycleReview[], field: 'pros' | 'cons') {
  return getTopCommunityItemsSafe(reviews, field);
}

function CommunityRootState() {
  return (
    <main className="motorcycle-community motorcycle-community--state" aria-labelledby="community-root-title">
      <section>
        <span>Comunidad MotoAtlas</span>
        <h1 id="community-root-title">Elige una moto para ver su comunidad</h1>
        <p>Las reviews viven asociadas a cada ficha técnica para que el contexto sea claro.</p>
        <a className="button button--primary" href="#/buscador">
          Ir al buscador
        </a>
      </section>
    </main>
  );
}

function NotFoundState({ motorcycleId }: { motorcycleId?: string }) {
  return (
    <main className="motorcycle-community motorcycle-community--state" aria-labelledby="community-not-found-title">
      <section>
        <span>404</span>
        <h1 id="community-not-found-title">Moto no encontrada</h1>
        <p>No existe comunidad para el registro {motorcycleId ? `“${motorcycleId}”` : 'solicitado'}.</p>
        <a className="button button--primary" href="#/buscador">
          Volver al buscador
        </a>
      </section>
    </main>
  );
}

function RatingStars({ rating }: { rating: number }) {
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

export function MotorcycleCommunityPage({ bike, motorcycleId }: MotorcycleCommunityPageProps) {
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasReviewError, setHasReviewError] = useState(false);
  const reviewSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bike) {
      return;
    }

    let isMounted = true;
    setHasReviewError(false);

    getApprovedReviewsByMotorcycleId(bike.id)
      .then((approvedReviews) => {
        if (isMounted) {
          setReviews(getApprovedReviews(approvedReviews));
        }
      })
      .catch(() => {
        if (isMounted) {
          setReviews([]);
          setHasReviewError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bike?.id]);

  const metrics = useMemo<readonly CommunityMetric[]>(() => {
    const aggregate = getReviewAggregate(reviews);
    const averageKilometers = getAverage(reviews.map((review) => review.kilometers));
    const averageOwnershipMonths = getAverage(reviews.map((review) => review.ownershipMonths));

    return [
      { label: 'Rating medio', value: formatReviewAggregate(aggregate), detail: 'Solo reviews aprobadas' },
      { label: 'Reviews aprobadas', value: numberFormatter.format(aggregate.reviewCount), detail: 'Moderación activa' },
      {
        label: 'Kilómetros medios',
        value: averageKilometers === null ? 'N/D' : `${numberFormatter.format(averageKilometers)} km`,
        detail: averageKilometers === null ? 'Datos pendientes' : 'Reportados por propietarios',
      },
      {
        label: 'Propiedad media',
        value: averageOwnershipMonths === null ? 'N/D' : `${numberFormatter.format(averageOwnershipMonths)} meses`,
        detail: averageOwnershipMonths === null ? 'Datos pendientes' : 'Experiencia acumulada',
      },
      { label: 'Uso más habitual', value: getMostCommonRidingStyle(reviews), detail: 'Según reviews aprobadas' },
    ];
  }, [reviews]);

  if (!motorcycleId) {
    return <CommunityRootState />;
  }

  if (!bike) {
    return <NotFoundState motorcycleId={motorcycleId} />;
  }

  const scrollReviews = (direction: -1 | 1) => {
    reviewSliderRef.current?.scrollBy({
      behavior: 'smooth',
      left: direction * Math.min(420, window.innerWidth * 0.86),
    });
  };

  const bikeName = getBikeDisplayName(bike);
  const aggregate = getReviewAggregate(reviews);
  const a2Badge = getBikeA2Badge(bike);
  const starDistribution = getStarDistribution(reviews);
  const topPros = getTopCommunityItems(reviews, 'pros');
  const topCons = getTopCommunityItems(reviews, 'cons');
  const commonIssues = (bike.reliabilityReports?.commonIssues) ?? [];

  return (
    <main className="motorcycle-community" aria-labelledby="motorcycle-community-title">
      <header className="motorcycle-community__hero">
        <div className="motorcycle-community__hero-media" aria-hidden="true">
          <MotorcycleImage motorcycle={bike} decorative loading="eager" />
          <div aria-hidden="true" />
        </div>
        <div className="motorcycle-community__hero-content">
          <div>
            <div className="motorcycle-community__hero-badges">
              <span>{segmentLabels[bike.segment]}</span>
              <span>{a2Badge.label}</span>
              <span>{bike.year}</span>
            </div>
            <span className="motorcycle-community__eyebrow">Owner registry</span>
            <h1 id="motorcycle-community-title">Reviews {bikeName}</h1>
            <p>Opiniones reales, problemas comunes y experiencia de propietarios de {bikeName}.</p>
          </div>
          <div className="motorcycle-community__hero-rating" aria-label="Resumen de rating">
            <strong>{aggregate.reviewCount > 0 ? aggregate.averageRating.toFixed(1) : 'N/D'}</strong>
            <div>
              <RatingStars rating={Math.round(aggregate.averageRating)} />
              <span>{numberFormatter.format(aggregate.reviewCount)} reviews aprobadas</span>
            </div>
          </div>
        </div>
      </header>

      <section className="motorcycle-community__hero-actions" aria-label="Acciones de comunidad">
        <a className="button button--ghost" href={getBikeDetailHash(bike)}>
          Volver a ficha
        </a>
        <a className="button button--ghost" href={getComparatorHashFromBikes([bike])}>
          Comparar esta moto
        </a>
        <button className="button button--ghost" type="button" onClick={() => setIsReviewModalOpen(true)}>
          Escribir review
        </button>
      </section>

      <section className="motorcycle-community__layout">
        <aside className="motorcycle-community__sidebar" aria-label="Resumen de comunidad">
          <section className="motorcycle-community__panel motorcycle-community__panel--hud" aria-labelledby="community-score-title">
            <h2 id="community-score-title">Resumen comunidad</h2>
            <div className="motorcycle-community__metrics">
              {metrics.map((metric) => (
                <article key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  {metric.detail ? <small>{metric.detail}</small> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="motorcycle-community__panel" aria-labelledby="community-distribution-title">
            <h2 id="community-distribution-title">Distribución rating</h2>
            <div className="motorcycle-community__distribution">
              {starDistribution.map(({ count, rating }) => (
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
        </aside>

        <div className="motorcycle-community__main">
          <section className="motorcycle-community__insights" aria-labelledby="community-insights-title">
            <div>
              <span>Community DNA</span>
              <h2 id="community-insights-title">Problemas comunes e insights</h2>
            </div>
            {commonIssues.length > 0 || topPros.length > 0 || topCons.length > 0 ? (
              <div className="motorcycle-community__insight-grid">
                <article>
                  <h3>Problemas comunes</h3>
                  {commonIssues.length > 0 ? (
                    <ul>
                      {commonIssues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Datos comunitarios pendientes.</p>
                  )}
                </article>
                <article>
                  <h3>Pros agregados</h3>
                  {topPros.length > 0 ? (
                    <ul>
                      {topPros.map((item) => (
                        <li key={item.label}>{item.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{((bike.pros ?? []) as readonly string[]).length > 0 ? (bike.pros ?? []).join(' · ') : 'Datos comunitarios pendientes.'}</p>
                  )}
                </article>
                <article>
                  <h3>Contras agregados</h3>
                  {topCons.length > 0 ? (
                    <ul>
                      {topCons.map((item) => (
                        <li key={item.label}>{item.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{((bike.cons ?? []) as readonly string[]).length > 0 ? (bike.cons ?? []).join(' · ') : 'Datos comunitarios pendientes.'}</p>
                  )}
                </article>
              </div>
            ) : (
              <p className="motorcycle-community__pending">Datos comunitarios pendientes.</p>
            )}
          </section>

          <section className="motorcycle-community__reviews" aria-labelledby="community-reviews-title">
            <div className="motorcycle-community__section-header">
              <div>
                <span>Verified owner reports</span>
                <h2 id="community-reviews-title">Reviews aprobadas</h2>
              </div>
              {reviews.length > 1 ? (
                <div className="motorcycle-community__review-controls" aria-label="Navegación de reviews">
                  <button type="button" onClick={() => scrollReviews(-1)} aria-label="Ver reviews anteriores">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      arrow_back
                    </span>
                  </button>
                  <button type="button" onClick={() => scrollReviews(1)} aria-label="Ver más reviews">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                </div>
              ) : null}
            </div>

            {hasReviewError ? (
              <p className="motorcycle-community__notice" role="status">
                No se han podido cargar las reviews. Mostramos la comunidad vacía de forma segura.
              </p>
            ) : null}

            {reviews.length > 0 ? (
              <div ref={reviewSliderRef} className="motorcycle-community__review-viewport" role="region" aria-label="Verified owner reports">
                <div className="motorcycle-community__review-list" role="list">
                {reviews.map((review) => {
                  const userName = getReviewUserName(review);

                  return (
                    <article className="motorcycle-community__review-card" key={review.id} role="listitem">
                      <header>
                        <div>
                          <span className="motorcycle-community__review-avatar" aria-hidden="true">
                            <span className="material-symbols-outlined">person</span>
                            <strong>{getInitials(userName)}</strong>
                          </span>
                          <div>
                            <h3>{userName}</h3>
                            <small>
                              {ridingStyleLabels[(review.ridingStyle ?? 'diario') as keyof typeof ridingStyleLabels]} · {formatDate(review.createdAt ?? '')}
                            </small>
                            {isReviewVerified(review) ? (
                              <span className="motorcycle-community__verified-badge">
                                <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                                Review verificada
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <RatingStars rating={review.rating} />
                          <strong>{review.rating}/5</strong>
                        </div>
                      </header>
                      <p>{(review.comment ?? '').toString().trim() || '—'}</p>
                      <dl>
                        <div>
                          <dt>Propiedad</dt>
                          <dd>{review.ownershipMonths === null ? 'N/D' : `${review.ownershipMonths} meses`}</dd>
                        </div>
                        <div>
                          <dt>Kilómetros</dt>
                          <dd>{review.kilometers === null ? 'N/D' : `${numberFormatter.format(review.kilometers)} km`}</dd>
                        </div>
                      </dl>
                      {review.pros.length > 0 || review.cons.length > 0 ? (
                        <div className="motorcycle-community__review-pros-cons">
                          {((review.pros ?? []) as readonly string[]).length > 0 ? (
                            <div>
                              <strong>Pros</strong>
                              <ul>
                                {((review.pros ?? []) as readonly any[]).map((pro, idx) => (
                                  <li key={String(pro) || String(idx)}>{String(pro)}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {((review.cons ?? []) as readonly string[]).length > 0 ? (
                            <div>
                              <strong>Contras</strong>
                              <ul>
                                {((review.cons ?? []) as readonly any[]).map((con, idx) => (
                                  <li key={String(con) || String(idx)}>{String(con)}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="motorcycle-community__empty">
                <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
                <h3>Aún no hay reviews aprobadas para esta moto.</h3>
                <p>Sé el primero en escribir una review. Entrará en moderación antes de publicarse.</p>
                <button className="button button--primary" type="button" onClick={() => setIsReviewModalOpen(true)}>
                  Sé el primero en escribir una review
                </button>
              </div>
            )}
          </section>
        </div>
      </section>

      <ReviewModal isOpen={isReviewModalOpen} motorcycle={bike} onClose={() => setIsReviewModalOpen(false)} />
    </main>
  );
}
