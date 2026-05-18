import { useEffect, useMemo, useState } from 'react';
import rankingHeroImage from '../../../assets/comparison-hero.png';
import { getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import {
  getApprovedReviewsByMotorcycleId,
  type MotorcycleReview,
} from '../../../services/motorcycleReviewService';
import { BIKE_SEGMENTS, getBikeA2Badge, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
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
import {
  getComparatorHashFromIds,
  loadCompareQueue,
  mergeCompareQueue,
  saveCompareQueue,
} from '../../../utils/compareQueue';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import './TopRatedMotorcyclesPage.scss';

type TopRatedMotorcyclesPageProps = Readonly<{
  motorcycles: readonly Bike[];
}>;

type ActiveFilterChip = Readonly<{
  id: string;
  label: string;
  onRemove: () => void;
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

function getFilterLabel(filters: TopRatedFilters) {
  const segment = filters.segment === 'all' ? 'todos los segmentos' : segmentLabels[filters.segment];
  const license = licenseOptions.find((option) => option.value === filters.license)?.label ?? 'todos los carnets';

  return `${segment} · ${license}`;
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
      <span className="material-symbols-outlined" aria-hidden="true">star</span>
      <strong>{formatReviewRating(item.averageRating)}</strong>
    </div>
  );
}

function RankingActions({ item, onCompare }: { item: TopRatedMotorcycle; onCompare: (bike: Bike) => void }) {
  const bikeName = getBikeDisplayName(item.bike);

  return (
    <div className="top-rated__card-actions">
      <a href={getBikeDetailHash(item.bike)}>Ver ficha</a>
      <a href={getCommunityHref(item.bike)}>Ver comunidad</a>
      <button type="button" onClick={() => onCompare(item.bike)} aria-label={`Comparar ${bikeName}`}>
        Comparar
      </button>
    </div>
  );
}

function PodiumCard({ item, onCompare, variant = 'featured' }: { item: TopRatedMotorcycle; onCompare: (bike: Bike) => void; variant?: 'featured' | 'compact' }) {
  const bikeName = getBikeDisplayName(item.bike);

  return (
    <article className={`top-rated__podium-card top-rated__podium-card--${variant}`} aria-label={`Puesto ${item.rank}: ${bikeName}`}>
      <MotorcycleImage motorcycle={item.bike} alt={`Imagen de ${bikeName}`} loading={item.rank === 1 ? 'eager' : 'lazy'} />
      <div className="top-rated__podium-overlay" aria-hidden="true" />
      <div className="top-rated__rank-badge">
        <strong>{item.rank}</strong>
        <span>Global rank</span>
      </div>
      <div className="top-rated__podium-content">
        <div>
          <p>{item.bike.brand}</p>
          <h3>{item.bike.model}</h3>
          <span>
            {item.bike.year} · {segmentLabels[item.bike.segment]} · {numberFormatter.format(item.bike.displacementCc)} cc
          </span>
        </div>
        <RatingPill item={item} />
        {variant === 'featured' ? <RankingStats item={item} /> : null}
        <div className="top-rated__badges" aria-label={`Badges de ${bikeName}`}>
          {item.badges.slice(0, variant === 'featured' ? 4 : 2).map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
        <RankingActions item={item} onCompare={onCompare} />
      </div>
    </article>
  );
}

function RegistryRow({ item, onCompare }: { item: TopRatedMotorcycle; onCompare: (bike: Bike) => void }) {
  const bikeName = getBikeDisplayName(item.bike);

  return (
    <article className="top-rated__registry-row" aria-label={`Puesto ${item.rank}: ${bikeName}`}>
      <div className="top-rated__registry-rank">{String(item.rank).padStart(2, '0')}</div>
      <MotorcycleImage motorcycle={item.bike} alt={`Imagen de ${bikeName}`} loading="lazy" />
      <div className="top-rated__registry-main">
        <h3>{bikeName}</h3>
        <p>
          {item.bike.year} · {segmentLabels[item.bike.segment]} · {getBikeA2Badge(item.bike).label}
        </p>
      </div>
      <div className="top-rated__registry-score">
        <RatingPill item={item} />
        <span>{numberFormatter.format(item.reviewCount)} reviews</span>
      </div>
      <div className="top-rated__badges top-rated__badges--row">
        {item.badges.slice(0, 3).map((badge) => (
          <span key={badge}>{badge}</span>
        ))}
      </div>
      <RankingActions item={item} onCompare={onCompare} />
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

export function TopRatedMotorcyclesPage({ motorcycles }: TopRatedMotorcyclesPageProps) {
  const [reviewsByMotorcycleId, setReviewsByMotorcycleId] = useState<ReviewsByMotorcycleId>({});
  const [filters, setFilters] = useState<TopRatedFilters>(defaultTopRatedFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [hasReviewLoadError, setHasReviewLoadError] = useState(false);
  const [compareMessage, setCompareMessage] = useState('');

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

  const ranking = useMemo(
    () => buildTopRatedMotorcycles(motorcycles, reviewsByMotorcycleId, filters),
    [filters, motorcycles, reviewsByMotorcycleId],
  );

  const podium = ranking.slice(0, 3);
  const registry = ranking.slice(3);
  const hasActiveFilters =
    filters.segment !== defaultTopRatedFilters.segment ||
    filters.license !== defaultTopRatedFilters.license ||
    filters.minReviews !== defaultTopRatedFilters.minReviews ||
    filters.sort !== defaultTopRatedFilters.sort;

  const activeFilterChips = useMemo<readonly ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (filters.segment !== 'all') {
      chips.push({
        id: 'segment',
        label: segmentLabels[filters.segment],
        onRemove: () => setFilters((current) => ({ ...current, segment: 'all' })),
      });
    }

    if (filters.license !== 'all') {
      chips.push({
        id: 'license',
        label: licenseOptions.find((option) => option.value === filters.license)?.label ?? filters.license,
        onRemove: () => setFilters((current) => ({ ...current, license: 'all' })),
      });
    }

    if (filters.minReviews !== defaultTopRatedFilters.minReviews) {
      chips.push({
        id: 'min-reviews',
        label: `${filters.minReviews}+ reviews`,
        onRemove: () => setFilters((current) => ({ ...current, minReviews: defaultTopRatedFilters.minReviews })),
      });
    }

    if (filters.sort !== defaultTopRatedFilters.sort) {
      chips.push({
        id: 'sort',
        label: sortOptions.find((option) => option.value === filters.sort)?.label ?? 'Orden personalizado',
        onRemove: () => setFilters((current) => ({ ...current, sort: defaultTopRatedFilters.sort })),
      });
    }

    return chips;
  }, [filters]);

  const resetFilters = () => setFilters(defaultTopRatedFilters);

  const compareBike = (bike: Bike) => {
    const currentQueue = loadCompareQueue();
    const { queue, rejectedIds } = mergeCompareQueue(currentQueue, [bike.id]);
    saveCompareQueue(queue);
    window.location.hash = getComparatorHashFromIds(queue);
    setCompareMessage(
      rejectedIds.length > 0
        ? 'La comparativa ya tiene 3 motos. Te llevamos a modificarla.'
        : `${getBikeDisplayName(bike)} añadido a la comparativa.`,
    );
  };

  return (
    <main className="top-rated" aria-labelledby="top-rated-title">
      <section className="top-rated__hero">
        <img src={rankingHeroImage} alt="" aria-hidden="true" />
        <div>
          <span>Top rated</span>
          <h1 id="top-rated-title">Motos mejor valoradas</h1>
          <p>
            Descubre las motos con mejor feedback de propietarios, equilibrio técnico y confianza real de comunidad.
          </p>
        </div>
      </section>

      <section className="top-rated__content" aria-label="Ranking de motos mejor valoradas">
        <div className="top-rated__toolbar">
          <div>
            <h2>
              <span className="material-symbols-outlined" aria-hidden="true">military_tech</span>
              Podium rankings
            </h2>
            <p>{isLoading ? 'Calibrando ranking...' : `${numberFormatter.format(ranking.length)} motos con reviews aprobadas`}</p>
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

        {activeFilterChips.length > 0 ? (
          <div className="top-rated__active-filters" aria-label="Filtros activos">
            {activeFilterChips.map((chip) => (
              <button key={chip.id} type="button" onClick={chip.onRemove} aria-label={`Quitar filtro ${chip.label}`}>
                {chip.label} ×
              </button>
            ))}
            <button type="button" onClick={resetFilters}>Limpiar filtros</button>
          </div>
        ) : null}

        {compareMessage ? <p className="top-rated__status" role="status">{compareMessage}</p> : null}
        {hasReviewLoadError && !isLoading ? (
          <p className="top-rated__notice" role="status">
            Algunas reviews no se han podido cargar. El ranking solo muestra datos aprobados disponibles.
          </p>
        ) : null}

        {isLoading ? (
          <p className="top-rated__loading" role="status">Calibrando ranking con reviews aprobadas...</p>
        ) : ranking.length === 0 ? (
          <TopRatedEmptyState hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
        ) : (
          <>
            <p className="top-rated__showing">Mostrando {getFilterLabel(filters)}</p>
            <section className="top-rated__podium" aria-label="Top 3 motos mejor valoradas">
              {podium[0] ? <PodiumCard item={podium[0]} onCompare={compareBike} /> : null}
              {podium.length > 1 ? (
                <div className="top-rated__podium-side">
                  {podium.slice(1).map((item) => (
                    <PodiumCard key={item.bike.id} item={item} onCompare={compareBike} variant="compact" />
                  ))}
                </div>
              ) : null}
            </section>

            {registry.length > 0 ? (
              <section className="top-rated__registry" aria-labelledby="top-rated-registry-title">
                <h2 id="top-rated-registry-title">Global registry</h2>
                <div className="top-rated__registry-header" aria-hidden="true">
                  <span>Rank</span>
                  <span>Modelo</span>
                  <span>Score</span>
                  <span>Señales</span>
                  <span>Acciones</span>
                </div>
                <div role="list" aria-label="Ranking completo">
                  {registry.map((item) => (
                    <RegistryRow key={item.bike.id} item={item} onCompare={compareBike} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
