import { useEffect, useMemo, useState } from 'react';
import rankingHeroImage from '../../../assets/hero-comunity.png';
import { getBikeDisplayName } from '../../../data/bikes';
import { BIKE_SEGMENTS, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import {
  buildAllRankings,
  buildAspectSignalsByMotorcycleId,
  buildReviewSignalsByMotorcycleId,
  getPodiumEntries,
  getRankingConfidence,
  RANKING_CATEGORIES,
  type CategoryRanking,
  type RankingAspectSignalsByMotorcycleId,
  type RankingCategory,
  type RankingEntry,
  type RankingReviewSignal,
} from '../../../shared/reviews/communityRankings';
import { getApprovedCommunityReviews, getReviewAspectsByReviewIds } from '../../../services/motorcycleReviewService';
import type { MotorcycleReview, MotorcycleReviewAspect } from '../../../services/motorcycleReviewService';
import type { Bike, BikeSegment } from '../../../types/bike';

import { MotoIcon } from '../../../shared/ui/icons/MotoIcon';
import { PageHero } from '../../ui/PageHero';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { PodiumCard } from '../../rankings/PodiumCard/PodiumCard';
import { RadarState } from '../../../shared/ui/states/RadarState';
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

const numberFormatter = new Intl.NumberFormat('es-ES');

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

function getFilteredRankings(rankings: readonly CategoryRanking[], filters: RankingFilters): readonly CategoryRanking[] {
  return rankings.map((ranking) => ({
    ...ranking,
    entries: ranking.entries.filter((entry) => {
      if (filters.segment !== 'all' && entry.bike.segment !== filters.segment) return false;
      if (filters.license === 'A2' && entry.bike.license !== 'A2' && !entry.bike.isA2Compatible) return false;
      if (filters.license === 'A' && entry.bike.license !== 'A') return false;
      if (filters.use !== 'all') {
        const useScore = entry.bike.useScores[filters.use];
        if (useScore < 7) return false;
      }
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

function formatRankingScore(score: number): string {
  const clamped = Math.max(0, Math.min(10, score / 10));
  const rounded = Math.round(clamped * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const CONFIDENCE_TOOLTIPS: Record<string, string> = {
  high: 'Alta confianza',
  medium: 'Media confianza',
  low: 'Baja confianza',
};

const RANKING_TOOLTIPS: Record<string, string> = {
  global: 'Valoración ponderada por reviews, aspectos y confianza',
  daily: 'Uso diario + reviews + confianza',
  travel: 'Viajes + confort + confianza',
  sport: 'Prestaciones + reviews + confianza',
  a2: 'Equilibrio A2 + reviews + confianza',
  'power-weight': 'Relación peso/potencia + confianza',
  reliability: 'Incidencias + reviews + confianza',
  passenger: 'Confort pasajero + reviews + confianza',
};

function CategoryCard({ ranking }: { ranking: CategoryRanking }) {
  const tooltip = RANKING_TOOLTIPS[ranking.category.id] ?? '';

  return (
    <article className="rankings__category-card" title={tooltip}>
      <div className="rankings__category-header">
        <span className="material-symbols-outlined" aria-hidden="true">{ranking.category.icon}</span>
      </div>
      <h3 className="rankings__category-title">{ranking.category.label}</h3>
      <p className="rankings__category-desc">{ranking.category.description}</p>
      <ul className="rankings__category-list">
        {ranking.entries.slice(0, 3).map((entry, index) => (
          <li key={entry.bike.id} className="rankings__category-item">
            <span>{index + 1}. {entry.bike.brand} {entry.bike.model}</span>
            <span className={index === 0 ? 'rankings__category-score--top' : ''}>{formatRankingScore(entry.score)}</span>
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
          El índice MotoAtlas se expresa en una escala 0–10. Combina datos técnicos de la moto, reviews aprobadas,
          aspectos técnicos agregados por propietarios y una señal de confianza basada en volumen. Las estrellas
          pertenecen a las reviews individuales; el índice es una puntuación calculada para comparar motos dentro de cada categoría.
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
      <RadarState
        className="rankings__technical-empty-state"
        description="No hay resultados para los filtros seleccionados."
        title="Sin resultados"
        titleId="community-rankings-empty-title"
      />
    );
  }

  return (
    <section className="rankings__technical-list" aria-label="Listado técnico de rankings">
      {flatEntries.map((entry, index) => (
        <article key={`${entry.bike.id}-${index}`} className="rankings__technical-card">
          <div className="rankings__technical-rank">{String(index + 1).padStart(2, '0')}</div>
          <div className="rankings__technical-image">
            <MotorcycleImage motorcycle={entry.bike} alt="" />
          </div>
          <div className="rankings__technical-info">
            <strong>{entry.bike.brand} {entry.bike.model}</strong>
            <span>{entry.bike.year} · {segmentLabels[entry.bike.segment]} · {entry.bike.powerHp} CV</span>
          </div>
          <div className="rankings__technical-stats">
            <div className="rankings__technical-score">
              <span className="material-symbols-outlined" aria-hidden="true">analytics</span>
              <strong>{formatRankingScore(entry.score)}</strong>
            </div>
            <div className="rankings__technical-reviews">
              <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
              <span>{entry.reviews}</span>
            </div>
            <div className="rankings__technical-signal">
              <span className="material-symbols-outlined" aria-hidden="true">trending_up</span>
              <span>{entry.keySignal}</span>
            </div>
          </div>
          <a href={getCommunityHref(entry.bike)} className="rankings__technical-action">
            Ver reviews <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </a>
        </article>
      ))}
    </section>
  );
}

export function CommunityRankingsPage({ motorcycles }: CommunityRankingsPageProps) {
  const [filters, setFilters] = useState<RankingFilters>(defaultFilters);
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [aspects, setAspects] = useState<readonly MotorcycleReviewAspect[]>([]);

  useEffect(() => {
    let isMounted = true;
    getApprovedCommunityReviews()
      .then((nextReviews) => {
        if (isMounted) {
          const approvedReviews = nextReviews.filter((review) => review.status === 'approved');
          setReviews(approvedReviews);

          const reviewIds = approvedReviews.map((r) => r.id);
          if (reviewIds.length > 0) {
            return getReviewAspectsByReviewIds(reviewIds)
              .then((nextAspects) => {
                if (isMounted) {
                  setAspects(nextAspects);
                }
              })
              .catch(() => {
                if (isMounted) {
                  setAspects([]);
                }
              });
          } else {
            setAspects([]);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setReviews([]);
          setAspects([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const reviewSignals = useMemo<Record<string, RankingReviewSignal>>(
    () => buildReviewSignalsByMotorcycleId(reviews),
    [reviews],
  );

  const aspectSignals = useMemo<RankingAspectSignalsByMotorcycleId>(
    () => buildAspectSignalsByMotorcycleId(reviews, aspects),
    [reviews, aspects],
  );

  const allRankings = useMemo(
    () => buildAllRankings(motorcycles, reviewSignals, aspectSignals),
    [motorcycles, reviewSignals, aspectSignals],
  );

  const podiumEntries = useMemo(
    () => getPodiumEntries(motorcycles, reviewSignals, aspectSignals),
    [motorcycles, reviewSignals, aspectSignals],
  );

  const filteredRankings = useMemo(() => getFilteredRankings(allRankings, filters), [allRankings, filters]);

  const handleFilterChange = <K extends keyof RankingFilters>(key: K, value: RankingFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <main className="rankings" aria-labelledby="rankings-title">
      <PageHero
        titleId="rankings-title"
        imageSrc={rankingHeroImage}
        eyebrow="RANKINGS DE COMUNIDAD"
        title="Las motos mejor valoradas por la comunidad"
        description="Rankings creados a partir de experiencias reales, puntuaciones, uso diario y señales de propietarios. Datos puros sin filtros de marca."
      />

      {podiumEntries.length > 0 && (
        <section className="rankings__podium-section" aria-labelledby="podium-title">
          <div className="rankings__podium-grid">
            {podiumEntries[1] ? (
              <PodiumCard
                bike={podiumEntries[1].bike}
                confidence={getRankingConfidence(podiumEntries[1].reviewCount)}
                confidenceTooltip={CONFIDENCE_TOOLTIPS[getRankingConfidence(podiumEntries[1].reviewCount)] ?? ''}
                href={getCommunityHref(podiumEntries[1].bike)}
                meta={`${podiumEntries[1].bike.year} · ${segmentLabels[podiumEntries[1].bike.segment]} · ${podiumEntries[1].bike.displacementCc} cc`}
                rank={2}
                scoreLabel={formatRankingScore(podiumEntries[1].score)}
                showConfidence={podiumEntries[1].reviewCount > 0}
                stats={[ { label: 'Reviews', value: numberFormatter.format(podiumEntries[1].reviews) }, { label: 'Potencia', value: `${podiumEntries[1].bike.powerHp} CV` } ]}
                statsAriaLabel={`${podiumEntries[1].reviewCount} reviews aprobadas`}
                variant="compact"
              />
            ) : null}
            {podiumEntries[0] ? (
              <PodiumCard
                bike={podiumEntries[0].bike}
                confidence={getRankingConfidence(podiumEntries[0].reviewCount)}
                confidenceTooltip={CONFIDENCE_TOOLTIPS[getRankingConfidence(podiumEntries[0].reviewCount)] ?? ''}
                href={getCommunityHref(podiumEntries[0].bike)}
                meta={`${podiumEntries[0].bike.year} · ${segmentLabels[podiumEntries[0].bike.segment]} · ${podiumEntries[0].bike.displacementCc} cc`}
                rank={1}
                scoreLabel={formatRankingScore(podiumEntries[0].score)}
                showConfidence={podiumEntries[0].reviewCount > 0}
                stats={[ { label: 'Reviews', value: numberFormatter.format(podiumEntries[0].reviews) }, { label: 'Potencia', value: `${podiumEntries[0].bike.powerHp} CV` } ]}
                statsAriaLabel={`${podiumEntries[0].reviewCount} reviews aprobadas`}
                variant="large"
              />
            ) : null}
            {podiumEntries[2] ? (
              <PodiumCard
                bike={podiumEntries[2].bike}
                confidence={getRankingConfidence(podiumEntries[2].reviewCount)}
                confidenceTooltip={CONFIDENCE_TOOLTIPS[getRankingConfidence(podiumEntries[2].reviewCount)] ?? ''}
                href={getCommunityHref(podiumEntries[2].bike)}
                meta={`${podiumEntries[2].bike.year} · ${segmentLabels[podiumEntries[2].bike.segment]} · ${podiumEntries[2].bike.displacementCc} cc`}
                rank={3}
                scoreLabel={formatRankingScore(podiumEntries[2].score)}
                showConfidence={podiumEntries[2].reviewCount > 0}
                stats={[ { label: 'Reviews', value: numberFormatter.format(podiumEntries[2].reviews) }, { label: 'Potencia', value: `${podiumEntries[2].bike.powerHp} CV` } ]}
                statsAriaLabel={`${podiumEntries[2].reviewCount} reviews aprobadas`}
                variant="compact"
              />
            ) : null}
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
              <MotoIcon name="search" aria-hidden="true" />
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
