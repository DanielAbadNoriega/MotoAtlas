import { useEffect, useMemo, useState } from 'react';
import rankingHeroImage from '../../../assets/hero-comunity.png';
import requestModelHeroImage from '../../../assets/hero-request-model.jpeg';
import { getBikeDisplayName } from '../../../data/bikes';
import {
  getApprovedReviewsByMotorcycleId,
  type MotorcycleReview,
} from '../../../services/motorcycleReviewService';
import { BIKE_SEGMENTS, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { formatReviewRating } from '../../../shared/reviews/reviewUtils';
import {
  buildTopRatedMotorcycles,
  defaultTopRatedFilters,
  type ReviewsByMotorcycleId,
  type TopRatedFilters,
  type TopRatedLicenseFilter,
  type TopRatedMotorcycle,
  type TopRatedSort,
} from '../../../shared/reviews/topRatedMotorcycles';
import type { Bike, BikeSegment } from '../../../types/bike';
import { CommunityHero } from '../../ui/CommunityHero/CommunityHero';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import './TopRatedMotorcyclesPage.scss';

type TopRatedMotorcyclesPageProps = Readonly<{
  motorcycles: readonly Bike[];
}>;

type RecentReviewItem = Readonly<{
  bike: Bike;
  review: MotorcycleReview;
}>;

const numberFormatter = new Intl.NumberFormat('es-ES');

const sortOptions = [
  { label: 'Mejor rating', value: 'rating' },
  { label: 'Más reviews', value: 'reviews' },
  { label: 'Tendencia', value: 'trend' },
  { label: 'Mejor para A2', value: 'a2' },
] satisfies readonly { label: string; value: TopRatedSort }[];

const licenseOptions = [
  { label: 'Todos los carnets', value: 'all' },
  { label: 'A', value: 'A' },
  { label: 'A2 compatible', value: 'A2' },
] satisfies readonly { label: string; value: TopRatedLicenseFilter }[];

const minReviewOptions = [
  { label: '1+ reviews', value: 1 },
  { label: '2+ reviews', value: 2 },
  { label: '5+ reviews', value: 5 },
] as const;

function getApprovedReviews(reviews: readonly MotorcycleReview[]) {
  return reviews.filter((review) => review.status === 'approved');
}

function getCommunityHref(bike: Pick<Bike, 'id'>) {
  return `#/comunidad/${bike.id}`;
}

function RankingStats({ item }: { item: TopRatedMotorcycle }) {
  return (
    <div className="top-rated__stats" aria-label={`Datos clave de ${getBikeDisplayName(item.bike)}`}>
      <div aria-label={`${item.reviewCount} reviews aprobadas`}>
        <span>Reviews</span>
        <strong>{numberFormatter.format(item.reviewCount)}</strong>
      </div>
      <div>
        <span>Potencia</span>
        <strong>{numberFormatter.format(item.bike.powerHp)} CV</strong>
      </div>
      <div>
        <span>Peso</span>
        <strong>{numberFormatter.format(item.bike.wetWeightKg)} kg</strong>
      </div>
    </div>
  );
}

function RatingPill({ item }: { item: TopRatedMotorcycle }) {
  return (
    <div className="top-rated__rating" aria-label={`Rating medio ${formatReviewRating(item.averageRating)} de 5`}>
      <span className="top-rated__rating-star" aria-hidden="true">★</span>
      <strong>{formatReviewRating(item.averageRating)}</strong>
    </div>
  );
}

function PodiumReviewsLink({ item }: { item: TopRatedMotorcycle }) {
  const bikeName = getBikeDisplayName(item.bike);

  return (
    <div className="top-rated__card-actions">
      <a href={getCommunityHref(item.bike)} aria-label={`Ver reviews de ${bikeName}`}>
        Ver reviews <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
      </a>
    </div>
  );
}

function PodiumCard({ item, variant = 'featured' }: { item: TopRatedMotorcycle; variant?: 'featured' | 'compact' }) {
  const bikeName = getBikeDisplayName(item.bike);

  return (
    <article className={`top-rated__podium-card top-rated__podium-card--${variant}`} aria-label={`Puesto ${item.rank}: ${bikeName}`}>
      <MotorcycleImage motorcycle={item.bike} alt={`Imagen de ${bikeName}`} loading={item.rank === 1 ? 'eager' : 'lazy'} />
      <div className="top-rated__podium-overlay" aria-hidden="true" />
      <div className="top-rated__rank-badge">
        <strong>{item.rank}</strong>
        <i aria-hidden="true" />
        <div>
          <span>Ranking global</span>
          <RatingPill item={item} />
        </div>
      </div>
      <div className="top-rated__podium-content">
        <div>
          <p>{item.bike.brand}</p>
          <h3>{item.bike.model}</h3>
          <span>
            {item.bike.year} · {segmentLabels[item.bike.segment]} · {numberFormatter.format(item.bike.displacementCc)} cc
          </span>
        </div>
        {variant === 'featured' ? <RankingStats item={item} /> : null}
        <PodiumReviewsLink item={item} />
      </div>
    </article>
  );
}

function TopRatedEmptyState({ hasActiveFilters, onReset }: { hasActiveFilters: boolean; onReset: () => void }) {
  return (
    <section className="top-rated__empty" aria-labelledby="top-rated-empty-title">
      <div className="top-rated__radar" aria-hidden="true">
        <span className="material-symbols-outlined">bar_chart</span>
      </div>
      <div>
        <span>Ranking en calibración</span>
        <h2 id="top-rated-empty-title">Aún no hay suficientes datos de comunidad.</h2>
        <p>
          El ranking solo utiliza reviews aprobadas. Ajusta los filtros o explora el catálogo mientras la comunidad genera más señales.
        </p>
        <div className="top-rated__empty-actions">
          {hasActiveFilters ? (
            <button className="button button--primary" type="button" onClick={onReset}>
              Limpiar filtros
            </button>
          ) : null}
          <a className="button button--ghost" href="#/buscador">
            Ir al buscador
          </a>
          <a className="button button--ghost" href="#/comunidad">
            Explorar comunidad
          </a>
        </div>
      </div>
    </section>
  );
}

function CommunityRadar({ isLoading, ranking }: { isLoading: boolean; ranking: readonly TopRatedMotorcycle[] }) {
  const mostReviewed = ranking.slice().sort((left, right) => right.reviewCount - left.reviewCount)[0];
  const topRated = ranking[0];
  const a2Signal = ranking.find((item) => item.bike.license === 'A2');

  const signals = [
    mostReviewed
      ? {
          href: getCommunityHref(mostReviewed.bike),
          icon: 'forum',
          label: 'MÁS DISCUTIDO',
          text: `${numberFormatter.format(mostReviewed.reviewCount)} reviews aprobadas`,
          title: getBikeDisplayName(mostReviewed.bike),
        }
      : null,
    topRated
      ? {
          href: getCommunityHref(topRated.bike),
          icon: 'military_tech',
          label: 'MEJOR VALORADO',
          text: `${formatReviewRating(topRated.averageRating)}/5 rating medio`,
          title: getBikeDisplayName(topRated.bike),
        }
      : null,
    a2Signal
      ? {
          href: getCommunityHref(a2Signal.bike),
          icon: 'verified',
          label: 'TENDENCIA A2',
          text: `${numberFormatter.format(a2Signal.reviewCount)} reviews de propietarios`,
          title: getBikeDisplayName(a2Signal.bike),
        }
      : null,
  ].filter(Boolean) as Array<{ href: string; icon: string; label: string; text: string; title: string }>;

  return (
    <section className="top-rated__community-radar" aria-labelledby="top-rated-radar-title">
      <div className="top-rated__community-heading">
        <span className="material-symbols-outlined" aria-hidden="true">trending_up</span>
        <h2 id="top-rated-radar-title">Trending</h2>
      </div>
      <div className="top-rated__radar-panel">
        <div>
          <span className="material-symbols-outlined" aria-hidden="true">radar</span>
          <h3>{signals.length > 0 ? 'TENDENCIAS ACTIVAS' : isLoading ? 'Calibrando señales' : 'Sin tendencias activas todavía'}</h3>
          <p>
            Reviews recientes, modelos solicitados y motos que empiezan a generar conversación.
          </p>
        </div>
        {signals.length > 0 ? (
          <div className="top-rated__radar-signals">
            {signals.map((signal) => (
              <a href={signal.href} key={signal.label}>
                <span className="material-symbols-outlined" aria-hidden="true">{signal.icon}</span>
                <small>{signal.label}</small>
                <strong>{signal.title}</strong>
                <em>{signal.text}</em>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ActiveCommunities({ ranking }: { ranking: readonly TopRatedMotorcycle[] }) {
  return (
    <section className="top-rated__active-communities" aria-labelledby="top-rated-active-title">
      <div className="top-rated__active-header">
        <div className="top-rated__community-heading">
          <span className="material-symbols-outlined" aria-hidden="true">groups</span>
          <h2 id="top-rated-active-title">Comunidades activas</h2>
        </div>
        <a href="#/buscador">Ver modelos</a>
      </div>
      <div>
        {ranking.slice(0, 3).map((item) => (
          <a className="top-rated__active-community-card" href={getCommunityHref(item.bike)} key={item.bike.id}>
            <MotorcycleImage motorcycle={item.bike} alt={`Imagen de ${getBikeDisplayName(item.bike)}`} loading="lazy" />
            <span>{segmentLabels[item.bike.segment]}</span>
            <h3>{getBikeDisplayName(item.bike)}</h3>
            <p>{numberFormatter.format(item.reviewCount)} reviews · {formatReviewRating(item.averageRating)}/5 rating</p>
          </a>
        ))}
        {ranking.length === 0 ? (
          <article className="top-rated__active-community-card top-rated__active-community-card--empty">
            <span className="material-symbols-outlined" aria-hidden="true">forum</span>
            <h3>Comunidades en formación</h3>
            <p>Cuando haya reviews aprobadas, los modelos con más actividad aparecerán aquí.</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function RecentReviews({ isLoading, recentReviews }: { isLoading: boolean; recentReviews: readonly RecentReviewItem[] }) {
  return (
    <section className="top-rated__recent-reviews" aria-labelledby="top-rated-recent-title">
      <div className="top-rated__recent-header">
        <div className="top-rated__community-heading">
          <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
          <h2 id="top-rated-recent-title">Reviews recientes</h2>
        </div>
        <a href="#/comunidad/reviews">Ver todas las reviews</a>
      </div>
      <div className="top-rated__recent-list">
        {recentReviews.length > 0 ? recentReviews.slice(0, 3).map(({ bike, review }) => (
          <article key={review.id}>
            <div>
              <span>{review.userName}</span>
              <small>{getBikeDisplayName(bike)}</small>
            </div>
            <p>“{review.comment}”</p>
            <div>
              <span className="top-rated__rating-star" aria-hidden="true">★</span>
              <small>{formatReviewRating(review.rating)}/5</small>
            </div>
          </article>
        )) : (
          <article>
            <div>
              <span>{isLoading ? 'Calibrando' : 'Sin reviews recientes'}</span>
              <small>Comunidad MotoAtlas</small>
            </div>
            <p>Las reviews aprobadas aparecerán aquí cuando la comunidad empiece a generar señales recientes.</p>
          </article>
        )}
      </div>
    </section>
  );
}

function ParticipationCtas() {
  return (
    <section className="top-rated__participation" aria-label="Participar en la comunidad MotoAtlas">
      <article className="top-rated__participation-card top-rated__participation-card--request">
        <img src={requestModelHeroImage} alt="" aria-hidden="true" />
        <div>
          <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
          <h2>¿No encuentras tu moto?</h2>
          <p>Ayúdanos a ampliar el catálogo MotoAtlas proponiendo nuevos modelos.</p>
          <a href="#/solicitar-modelo">Solicitar modelo</a>
        </div>
      </article>
      <article className="top-rated__participation-card">
        <div>
          <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
          <h2>Tu experiencia puede ayudar a otro motero</h2>
          <p>Comparte kilómetros, sensaciones, puntos fuertes y defectos reales.</p>
          <a href="#/buscador">Buscar moto para opinar</a>
        </div>
      </article>
    </section>
  );
}

function CommunityFeatureSections({
  isLoading,
  ranking,
  recentReviews,
}: {
  isLoading: boolean;
  ranking: readonly TopRatedMotorcycle[];
  recentReviews: readonly RecentReviewItem[];
}) {
  return (
    <>
      <CommunityRadar isLoading={isLoading} ranking={ranking} />
      <section className="top-rated__community-columns" aria-label="Actividad reciente de comunidad">
        <ActiveCommunities ranking={ranking} />
        <RecentReviews isLoading={isLoading} recentReviews={recentReviews} />
      </section>
      <ParticipationCtas />
    </>
  );
}

export function TopRatedMotorcyclesPage({ motorcycles }: TopRatedMotorcyclesPageProps) {
  const [reviewsByMotorcycleId, setReviewsByMotorcycleId] = useState<ReviewsByMotorcycleId>({});
  const [filters, setFilters] = useState<TopRatedFilters>(defaultTopRatedFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [hasReviewLoadError, setHasReviewLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasReviewLoadError(false);

    Promise.all(
      motorcycles.map(async (bike) => {
        try {
          const reviews = await getApprovedReviewsByMotorcycleId(bike.id);
          return { bikeId: bike.id, hasError: false, reviews: getApprovedReviews(reviews) };
        } catch {
          return { bikeId: bike.id, hasError: true, reviews: [] as readonly MotorcycleReview[] };
        }
      }),
    )
      .then((results) => {
        if (!isMounted) {
          return;
        }

        setReviewsByMotorcycleId(Object.fromEntries(results.map((result) => [result.bikeId, result.reviews])));
        setHasReviewLoadError(results.some((result) => result.hasError));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [motorcycles]);

  const podiumRanking = useMemo(
    () => buildTopRatedMotorcycles(motorcycles, reviewsByMotorcycleId, filters),
    [filters, motorcycles, reviewsByMotorcycleId],
  );

  const communityRanking = useMemo(
    () => buildTopRatedMotorcycles(motorcycles, reviewsByMotorcycleId, defaultTopRatedFilters),
    [motorcycles, reviewsByMotorcycleId],
  );

  const podium = podiumRanking.slice(0, 3);
  const hasActiveFilters =
    filters.segment !== defaultTopRatedFilters.segment ||
    filters.license !== defaultTopRatedFilters.license ||
    filters.minReviews !== defaultTopRatedFilters.minReviews ||
    filters.sort !== defaultTopRatedFilters.sort;

  const recentReviews = useMemo<readonly RecentReviewItem[]>(() => motorcycles
    .flatMap((bike) => (reviewsByMotorcycleId[bike.id] ?? []).map((review) => ({ bike, review })))
    .sort((a, b) => new Date(b.review.createdAt).getTime() - new Date(a.review.createdAt).getTime()),
  [motorcycles, reviewsByMotorcycleId]);

  const resetFilters = () => setFilters(defaultTopRatedFilters);
  const scrollToPodium = () => {
    document.getElementById('community-podium')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="top-rated" aria-labelledby="top-rated-title">
      <CommunityHero
        titleId="top-rated-title"
        imageSrc={rankingHeroImage}
        eyebrow="Opiniones reales"
        title="Comunidad MotoAtlas"
        description="Opiniones reales, rankings vivos y actividad de propietarios para elegir mejor."
        actions={[
          { label: 'Explorar comunidades', onClick: scrollToPodium },
          { label: 'Comparar motos', href: '#/comparador' },
        ]}
      />

      <section className="top-rated__content" id="community-podium" aria-label="Ranking de motos mejor valoradas">
        <div className="top-rated__toolbar">
          <div>
            <h2>
              <span className="material-symbols-outlined" aria-hidden="true">military_tech</span>
              Podium rankings
            </h2>
            <p>{isLoading ? 'Calibrando ranking...' : `${numberFormatter.format(podiumRanking.length)} motos con reviews aprobadas`}</p>
          </div>

          <form className="top-rated__filters" aria-label="Filtros del ranking" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="top-rated-sort">
              Ordenar por
              <select
                id="top-rated-sort"
                value={filters.sort}
                onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as TopRatedSort }))}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label htmlFor="top-rated-segment">
              Segmento
              <select
                id="top-rated-segment"
                value={filters.segment}
                onChange={(event) => setFilters((current) => ({ ...current, segment: event.target.value as BikeSegment | 'all' }))}
              >
                <option value="all">Todos los segmentos</option>
                {BIKE_SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>{segmentLabels[segment]}</option>
                ))}
              </select>
            </label>

            <label htmlFor="top-rated-license">
              Carnet
              <select
                id="top-rated-license"
                value={filters.license}
                onChange={(event) => setFilters((current) => ({ ...current, license: event.target.value as TopRatedLicenseFilter }))}
              >
                {licenseOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label htmlFor="top-rated-min-reviews">
              Reviews mínimas
              <select
                id="top-rated-min-reviews"
                value={filters.minReviews}
                onChange={(event) => setFilters((current) => ({ ...current, minReviews: Number(event.target.value) }))}
              >
                {minReviewOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </form>
        </div>

        {hasReviewLoadError && !isLoading ? (
          <p className="top-rated__notice" role="status">
            Algunas reviews no se han podido cargar. El ranking solo muestra datos aprobados disponibles.
          </p>
        ) : null}

        {isLoading ? (
          <p className="top-rated__loading" role="status">Calibrando ranking con reviews aprobadas...</p>
        ) : podiumRanking.length === 0 ? (
          <TopRatedEmptyState hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
        ) : (
          <>
            <section className="top-rated__podium" aria-label="Top 3 motos mejor valoradas">
              {podium[0] ? <PodiumCard item={podium[0]} /> : null}
              {podium.length > 1 ? (
                <div className="top-rated__podium-side">
                  {podium.slice(1).map((item) => (
                    <PodiumCard key={item.bike.id} item={item} variant="compact" />
                  ))}
                </div>
              ) : null}
            </section>

            <div className="top-rated__podium-cta">
              <a href="#/comunidad/rankings" className="top-rated__podium-cta-link">
                Ver rankings completos
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </a>
            </div>
          </>
        )}

        {!isLoading ? (
          <CommunityFeatureSections isLoading={isLoading} ranking={communityRanking} recentReviews={recentReviews} />
        ) : null}
      </section>
    </main>
  );
}
