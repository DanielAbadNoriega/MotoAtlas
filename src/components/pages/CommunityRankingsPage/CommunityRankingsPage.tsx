import { useMemo, useState } from 'react';
import rankingHeroImage from '../../../assets/hero-comunity.png';
import { getBikeDisplayName } from '../../../data/bikes';
import { BIKE_SEGMENTS, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import {
  buildAllRankings,
  buildGlobalRanking,
  getPodiumEntries,
  RANKING_CATEGORIES,
  type CategoryRanking,
  type RankingCategory,
  type RankingEntry,
} from '../../../shared/reviews/communityRankings';
import type { Bike, BikeSegment } from '../../../types/bike';
import { formatReviewRating } from '../../../shared/reviews/reviewUtils';
import { CommunityHero } from '../../ui/CommunityHero/CommunityHero';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import './CommunityRankingsPage.scss';

type CommunityRankingsPageProps = Readonly<{
  motorcycles: readonly Bike[];
}>;

type RankingFilters = Readonly<{
  segment: BikeSegment | 'all';
  license: 'all' | 'A' | 'A2';
  use: 'all' | 'city' | 'touring' | 'offroad' | 'sport';
  search: string;
  sortBy: 'score' | 'reviews';
}>;

const defaultFilters: RankingFilters = {
  segment: 'all',
  license: 'all',
  use: 'all',
  search: '',
  sortBy: 'score',
};

const segmentOptions = [
  { label: 'Todos los segmentos', value: 'all' as const },
  ...BIKE_SEGMENTS.map((s) => ({ label: segmentLabels[s], value: s as BikeSegment | 'all' })),
];

const licenseOptions = [
  { label: 'Todos los carnets', value: 'all' as const },
  { label: 'Carnet A', value: 'A' as const },
  { label: 'A2 compatible', value: 'A2' as const },
];

const useOptions = [
  { label: 'Uso: Mixto', value: 'all' as const },
  { label: 'Ciudad', value: 'city' as const },
  { label: 'Viaje', value: 'touring' as const },
  { label: 'Offroad', value: 'offroad' as const },
  { label: 'Deportivo', value: 'sport' as const },
];

function filterMotorcycles(motorcycles: readonly Bike[], filters: RankingFilters): readonly Bike[] {
  return motorcycles.filter((bike) => {
    if (filters.segment !== 'all' && bike.segment !== filters.segment) return false;

    if (filters.license === 'A2' && bike.license !== 'A2' && !bike.isA2Compatible) return false;
    if (filters.license === 'A' && bike.license !== 'A') return false;

    if (filters.use !== 'all') {
      const useScore = bike.useScores[filters.use];
      if (useScore < 7) return false;
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const fullName = `${bike.brand} ${bike.model}`.toLowerCase();
      if (!fullName.includes(searchLower)) return false;
    }

    return true;
  });
}

function getFilteredRankings(rankings: readonly CategoryRanking[], filters: RankingFilters): readonly CategoryRanking[] {
  return rankings.map((ranking) => ({
    ...ranking,
    entries: ranking.entries.filter((entry) => {
      if (filters.segment !== 'all' && entry.bike.segment !== filters.segment) return false;
      if (filters.license === 'A2' && entry.bike.license !== 'A2' && !entry.bike.isA2Compatible) return false;
      if (filters.license === 'A' && entry.bike.license !== 'A') return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = `${entry.bike.brand} ${entry.bike.model}`.toLowerCase();
        if (!fullName.includes(searchLower)) return false;
      }
      return true;
    }).sort((a, b) => filters.sortBy === 'reviews' ? b.reviews - a.reviews : b.score - a.score),
  }));
}

function getCommunityHref(bike: Pick<Bike, 'id'>) {
  return `#/comunidad/${bike.id}`;
}

function PodiumCard({ entry, rank, variant = 'featured' }: { entry: RankingEntry; rank: number; variant?: 'featured' | 'compact' }) {
  const bikeName = getBikeDisplayName(entry.bike);

  return (
    <article className={`rankings__podium-card rankings__podium-card--${variant}`} aria-label={`Puesto ${rank}: ${bikeName}`}>
      <MotorcycleImage motorcycle={entry.bike} alt={`Imagen de ${bikeName}`} loading={rank === 1 ? 'eager' : 'lazy'} />
      <div className="rankings__podium-overlay" aria-hidden="true" />
      <div className="rankings__rank-badge">
        <strong>{String(rank).padStart(2, '0')}</strong>
      </div>
      <div className="rankings__podium-content">
        <div>
          <p>{entry.bike.brand}</p>
          <h3>{entry.bike.model}</h3>
          <span>{entry.bike.year} · {segmentLabels[entry.bike.segment]} · {entry.bike.displacementCc} cc</span>
        </div>
        <div className="rankings__podium-stats">
          <div>
            <span>Reviews</span>
            <strong>{entry.reviews}</strong>
          </div>
          <div>
            <span>Potencia</span>
            <strong>{entry.bike.powerHp} CV</strong>
          </div>
        </div>
        <div className="rankings__podium-rating">
          <span className="rankings__rating-star" aria-hidden="true">★</span>
          <strong>{formatReviewRating(entry.score / 10)}</strong>
        </div>
        <a href={getCommunityHref(entry.bike)} className="rankings__podium-action">
          Ver comunidad <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </a>
      </div>
    </article>
  );
}

function CategoryCard({ ranking }: { ranking: CategoryRanking }) {
  return (
    <article className="rankings__category-card">
      <div className="rankings__category-header">
        <span className="material-symbols-outlined" aria-hidden="true">{ranking.category.icon}</span>
        <span className="rankings__category-tag">{ranking.category.tag}</span>
      </div>
      <h3 className="rankings__category-title">{ranking.category.label}</h3>
      <p className="rankings__category-desc">{ranking.category.description}</p>
      <ul className="rankings__category-list">
        {ranking.entries.slice(0, 3).map((entry, index) => (
          <li key={entry.bike.id} className="rankings__category-item">
            <span>{index + 1}. {entry.bike.brand} {entry.bike.model}</span>
            <span className={index === 0 ? 'rankings__category-score--top' : ''}>{formatReviewRating(entry.score / 10)}</span>
          </li>
        ))}
      </ul>
      <div className="rankings__category-hover-bar" aria-hidden="true" />
    </article>
  );
}

function MethodologyBlock() {
  return (
    <section className="rankings__methodology" aria-labelledby="methodology-title">
      <div className="rankings__methodology-inner">
        <span className="material-symbols-outlined" aria-hidden="true">gavel</span>
        <h3 id="methodology-title">Nuestra Metodología</h3>
        <p>
          Los rankings de MotoAtlas no están influenciados por acuerdos publicitarios ni patrocinios de marcas.
          Utilizamos un algoritmo que procesa datos de <strong>verificación de propiedad</strong>, puntuaciones de{' '}
          <strong>usuario final</strong>, y métricas de <strong>fiabilidad técnica</strong> a largo plazo.
          Tu opinión construye la fuente de verdad más fiable del sector.
        </p>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="rankings__cta" aria-labelledby="cta-title">
      <div className="rankings__cta-bg" aria-hidden="true" />
      <h2 id="cta-title">Tu experiencia también cuenta</h2>
      <p>Ayuda a otros moteros a tomar la mejor decisión compartiendo tu día a día.</p>
      <a href="#/comunidad/reviews" className="rankings__cta-button">
        Publicar review
        <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
      </a>
    </section>
  );
}

function TechnicalTable({ rankings, filters }: { rankings: readonly CategoryRanking[]; filters: RankingFilters }) {
  const flatEntries = useMemo(() => {
    const filtered = getFilteredRankings(rankings, filters);
    return filtered
      .flatMap((r) => r.entries.map((e) => ({ ...e, category: r.category.label })))
      .sort((a, b) => filters.sortBy === 'reviews' ? b.reviews - a.reviews : b.score - a.score)
      .slice(0, 20);
  }, [rankings, filters]);

  if (flatEntries.length === 0) {
    return (
      <div className="rankings__table-empty">
        <p>No hay resultados para los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <table className="rankings__table" aria-label="Listado técnico de rankings">
      <thead>
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">Modelo</th>
          <th scope="col">Segmento</th>
          <th scope="col" className="rankings__table-center">Rating</th>
          <th scope="col">Reviews</th>
          <th scope="col">Señal Clave</th>
          <th scope="col" className="rankings__table-right">Acción</th>
        </tr>
      </thead>
      <tbody>
        {flatEntries.map((entry, index) => (
          <tr key={`${entry.bike.id}-${index}`}>
            <td className="rankings__table-rank">{String(index + 1).padStart(2, '0')}</td>
            <td>
              <div className="rankings__table-bike">
                <div className="rankings__table-image">
                  <MotorcycleImage motorcycle={entry.bike} alt="" />
                </div>
                <div>
                  <strong>{entry.bike.brand} {entry.bike.model}</strong>
                  <span>{entry.bike.year} · {entry.bike.powerHp} HP</span>
                </div>
              </div>
            </td>
            <td className="rankings__table-segment">{segmentLabels[entry.bike.segment]}</td>
            <td className="rankings__table-center">
              <span className="rankings__table-rating">{formatReviewRating(entry.score / 10)}</span>
            </td>
            <td className="rankings__table-reviews">{entry.reviews}</td>
            <td>
              <span className="rankings__table-signal">
                <span className="material-symbols-outlined" aria-hidden="true">trending_up</span>
                {entry.keySignal}
              </span>
            </td>
            <td className="rankings__table-right">
              <a href={getCommunityHref(entry.bike)} className="rankings__table-action">Ver comunidad</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CommunityRankingsPage({ motorcycles }: CommunityRankingsPageProps) {
  const [filters, setFilters] = useState<RankingFilters>(defaultFilters);

  const allRankings = useMemo(() => buildAllRankings(motorcycles), [motorcycles]);
  const podiumEntries = useMemo(() => getPodiumEntries(motorcycles), [motorcycles]);

  const filteredRankings = useMemo(() => getFilteredRankings(allRankings, filters), [allRankings, filters]);

  const handleFilterChange = <K extends keyof RankingFilters>(key: K, value: RankingFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <main className="rankings" aria-labelledby="rankings-title">
      <CommunityHero
        titleId="rankings-title"
        imageSrc={rankingHeroImage}
        eyebrow="RANKINGS DE COMUNIDAD"
        title="Las motos mejor valoradas por la comunidad"
        description="Rankings creados a partir de experiencias reales, puntuaciones, uso diario y señales de propietarios. Datos puros sin filtros de marca."
        actions={[
          { label: 'Explorar rankings', href: '#rankings-categories' },
          { label: 'Ver comunidad', href: '#/comunidad' },
        ]}
      />

      {podiumEntries.length > 0 && (
        <section className="rankings__podium-section" aria-labelledby="podium-title">
          <div className="rankings__podium-grid">
            {podiumEntries[1] && <PodiumCard entry={podiumEntries[1]} rank={2} variant="compact" />}
            {podiumEntries[0] && <PodiumCard entry={podiumEntries[0]} rank={1} variant="featured" />}
            {podiumEntries[2] && <PodiumCard entry={podiumEntries[2]} rank={3} variant="compact" />}
          </div>
        </section>
      )}

      <section className="rankings__categories-section" id="rankings-categories" aria-labelledby="categories-title">
        <div className="rankings__categories-header">
          <div>
            <span className="rankings__eyebrow">CATEGORÍAS DE RENDIMIENTO</span>
            <h2 id="categories-title">Selección por especialidad</h2>
          </div>
          <p className="rankings__categories-intro">
            Segmentos específicos analizados por expertos y usuarios reales para encontrar la máquina perfecta.
          </p>
        </div>
        <div className="rankings__categories-grid">
          {filteredRankings.map((ranking) => (
            <CategoryCard key={ranking.category.id} ranking={ranking} />
          ))}
        </div>
      </section>

      <section className="rankings__filters-bar" aria-label="Filtros de rankings">
        <div className="rankings__filters-inner">
          <div className="rankings__filters-left">
            <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
            <select
              aria-label="Segmento"
              value={filters.segment}
              onChange={(e) => handleFilterChange('segment', e.target.value as BikeSegment | 'all')}
            >
              {segmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              aria-label="Carnet"
              value={filters.license}
              onChange={(e) => handleFilterChange('license', e.target.value as 'all' | 'A' | 'A2')}
            >
              {licenseOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              aria-label="Uso"
              value={filters.use}
              onChange={(e) => handleFilterChange('use', e.target.value as RankingFilters['use'])}
            >
              {useOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="rankings__filters-right">
            <div className="rankings__search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                type="text"
                placeholder="BUSCAR MODELO..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                aria-label="Buscar modelo"
              />
            </div>
            <div className="rankings__filters-divider" aria-hidden="true" />
            <button
              className="rankings__sort-button"
              onClick={() => handleFilterChange('sortBy', filters.sortBy === 'score' ? 'reviews' : 'score')}
              aria-label={`Ordenar por ${filters.sortBy === 'score' ? 'reviews' : 'puntuación'}`}
            >
              <span className="material-symbols-outlined" aria-hidden="true">sort</span>
              {filters.sortBy === 'score' ? 'Puntuación' : 'Reviews'}
            </button>
          </div>
        </div>
      </section>

      <section className="rankings__table-section" aria-label="Listado técnico">
        <TechnicalTable rankings={allRankings} filters={filters} />
      </section>

      <MethodologyBlock />
      <FinalCta />
    </main>
  );
}
