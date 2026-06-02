import { useEffect, useState, useRef, useCallback } from 'react';
import { getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import { getApprovedReviewsByMotorcycleId, type MotorcycleReview } from '../../../services/motorcycleReviewService';
import { getBrowseSearchHash, getCompareSearchHash } from '../../../utils/compareQueue';
import type { Bike } from '../../../types/bike';
import { getBikeA2Badge, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { getMotorcycleTechnicalIcon, type MotorcycleTechnicalIconKey } from '../../../shared/motorcycles/motorcycleTechnicalIcons';
import { isPendingPrice, pendingPriceLabel } from '../../../shared/dataQuality/dataQualityLabels';
import { formatReviewAggregate, formatReviewRating, getReviewAggregate } from '../../../shared/reviews/reviewUtils';
import { getRankingConfidence, type RankingConfidence } from '../../../shared/reviews/communityRankings';
import { buildReviewAuthContext, isOwnReview } from '../../../shared/reviews/reviewCommunityActions';
import { useReviewReactions } from '../../../shared/reviews/useReviewReactions';
import { useReviewReports } from '../../../shared/reviews/useReviewReports';
import { getReviewReactionSummary, type ReviewReactionSummary } from '../../../services/reviewReactionService';
import { useAuth } from '../../../features/auth';
import { ReviewModal } from '../../reviews/ReviewModal';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { FeaturedReviewCard } from '../../reviews/FeaturedReviewCard';
import { FeaturedReviewCardCommunityActions } from '../../reviews/FeaturedReviewCard/FeaturedReviewCardActions';
import './BikeDetailPage.scss';

type BikeDetailPageProps = {
  bike?: Bike;
  motorcycles: readonly Bike[];
};

type UseScoreKey = keyof Bike['useScores'];
type FeatureKey = keyof Bike['features'];

type DetailSpec = Readonly<{
  label: string;
  value: string;
}>;

type DetailSpecGroup = Readonly<{
  title: string;
  items: readonly DetailSpec[];
}>;

const numberFormatter = new Intl.NumberFormat('es-ES');
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const engineTypeLabels: Record<Bike['engineType'], string> = {
  'boxer-twin': 'Bicilíndrico bóxer',
  'inline-four': 'Cuatro en línea',
  'inline-three': 'Tres en línea',
  'l-twin': 'Bicilíndrico en L',
  'parallel-twin': 'Bicilíndrico paralelo',
  'single-cylinder': 'Monocilíndrico',
  'v-twin': 'Bicilíndrico en V',
};

const useScoreLabels: Record<UseScoreKey, string> = {
  beginner: 'Principiante',
  city: 'Ciudad',
  funFactor: 'Diversión',
  offroad: 'Off-road',
  passenger: 'Pasajero',
  sport: 'Sport',
  touring: 'Touring',
};

const featureLabels: Record<FeatureKey, string> = {
  absCornering: 'ABS en curva',
  cruiseControl: 'Control crucero',
  heatedGrips: 'Puños calefactables',
  quickshifter: 'Quickshifter',
  ridingModes: 'Modos de conducción',
  tractionControl: 'Control de tracción',
  tubelessWheels: 'Llantas tubeless',
};

const segmentProfile: Record<Bike['segment'], string> = {
  adventure: 'Para quien quiere una maxitrail o trail viajera con margen para rutas largas y pistas sencillas.',
  cruiser: 'Para rodar con calma, mucho par y una posición baja pensada para carretera tranquila.',
  custom: 'Para quien prioriza estilo, personalización y conducción relajada por encima de prestaciones puras.',
  'dual-sport': 'Para quien necesita una moto ligera y útil tanto en asfalto roto como en pistas.',
  enduro: 'Para uso campero exigente, peso contenido y prioridad absoluta fuera del asfalto.',
  hypernaked: 'Para pilotos con experiencia que buscan una naked extrema, directa y muy prestacional.',
  naked: 'Para pilotos que priorizan agilidad, respuesta directa y una moto viva en ciudad y carreteras de curvas.',
  'neo-retro': 'Para quien busca estética clásica con tecnología moderna y uso diario razonable.',
  retro: 'Para quien valora sencillez, estética clásica y una conducción más emocional que cronometrada.',
  scooter: 'Para desplazamientos urbanos y periurbanos con practicidad, protección y bajo esfuerzo.',
  scrambler: 'Para un uso mixto ligero, estética clásica y pistas fáciles sin pretensiones de enduro.',
  sport: 'Para conducción dinámica y carreteras de curvas con ergonomía más exigente.',
  'sport-touring': 'Para viajar rápido con protección, estabilidad y prestaciones sin renunciar al ritmo deportivo.',
  supersport: 'Para uso deportivo intenso, circuito ocasional y una ergonomía claramente prestacional.',
  touring: 'Para viajar largo, cómodo y con carga, priorizando protección y estabilidad.',
  trail: 'Para quien quiere una moto polivalente: viajar, cargar equipaje y salir del asfalto con margen real.',
};

function getUseScoreEntries(bike: Bike) {
  return Object.entries(bike.useScores) as [UseScoreKey, number][];
}

function getFeatureEntries(bike: Bike) {
  return Object.entries(bike.features) as [FeatureKey, boolean][];
}

function clampScore(score: number) {
  return Math.max(0, Math.min(score, 10));
}

function scorePercent(score: number) {
  return `${clampScore(score) * 10}%`;
}

function getOverallScore(bike: Bike) {
  const scores = Object.values(bike.useScores);
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function getBestUse(bike: Bike) {
  const [key, value] = getUseScoreEntries(bike).sort((first, second) => second[1] - first[1])[0];
  return { label: useScoreLabels[key], value };
}

function getReliabilityLevel(score: number) {
  if (score >= 8.5) {
    return 'Excelente';
  }

  if (score >= 7.5) {
    return 'Muy buena';
  }

  if (score >= 6.5) {
    return 'Correcta';
  }

  return 'A vigilar';
}

function SpecCard({
  icon,
  label,
  value,
  unit,
  variant,
}: {
  icon: MotorcycleTechnicalIconKey;
  label: string;
  value: string;
  unit?: string;
  variant?: 'accent';
}) {
  return (
    <article className={variant === 'accent' ? 'bike-detail__spec-card bike-detail__spec-card--accent' : 'bike-detail__spec-card'}>
      <div className="bike-detail__spec-card-header">
        <span className="material-symbols-outlined" aria-hidden="true">
          {getMotorcycleTechnicalIcon(icon)}
        </span>
      </div>
      <p className="bike-detail__spec-label">{label}</p>
      <div className="bike-detail__spec-value-row">
        <span className="bike-detail__spec-value">{value}</span>
        {unit && <span className="bike-detail__spec-unit">{unit}</span>}
      </div>
    </article>
  );
}

function SpecificationsTab({ bike }: { bike: Bike }) {
  const priceLabel = isPendingPrice(bike.priceEur, bike.priceSource)
    ? pendingPriceLabel
    : currencyFormatter.format(bike.priceEur);

  const enabledFeatures = getFeatureEntries(bike).filter(([, isEnabled]) => isEnabled);

  const a2Badge = getBikeA2Badge(bike);
  const hasA2Data = bike.isA2Compatible || bike.isA2LimitedVersion;

  return (
    <div className="bike-detail__specs-tab">
      <div className="bike-detail__specs-bento">
        <SpecCard icon="engine" label="MOTOR" value={String(bike.displacementCc)} unit="CC" />
        <SpecCard icon="power" label="POTENCIA" value={String(bike.powerHp)} unit="HP" />
        <SpecCard icon="torque" label="TORQUE" value={String(bike.torqueNm)} unit="NM" />
        <SpecCard icon="weight" label="PESO" value={String(bike.wetWeightKg)} unit="KG" />
        <SpecCard icon="seatHeight" label="ALTURA ASIENTO" value={String(bike.seatHeightMm)} unit="MM" />
        <SpecCard icon="fuelTank" label="DEPÓSITO" value={String(bike.fuelTankLiters)} unit="L" />
        <SpecCard icon="license" label="CARNET" value={a2Badge.label} />
        <SpecCard
          icon="price"
          label="PRECIO BASE"
          value={isPendingPrice(bike.priceEur, bike.priceSource) ? priceLabel : numberFormatter.format(bike.priceEur)}
          unit={isPendingPrice(bike.priceEur, bike.priceSource) ? undefined : '€'}
          variant={isPendingPrice(bike.priceEur, bike.priceSource) ? undefined : 'accent'}
        />

        {enabledFeatures.length > 0 && (
          <article className="bike-detail__spec-card bike-detail__spec-card--electronics">
            <div className="bike-detail__spec-card-header">
              <span className="material-symbols-outlined" aria-hidden="true">
                {getMotorcycleTechnicalIcon('electronics')}
              </span>
            </div>
            <p className="bike-detail__spec-label">ELECTRÓNICA</p>
            <div className="bike-detail__electronics-chips">
              {enabledFeatures.map(([key]) => (
                <span key={key} className="bike-detail__electronics-chip">
                  {featureLabels[key]}
                </span>
              ))}
            </div>
          </article>
        )}

        {hasA2Data && (
          <article className="bike-detail__spec-card bike-detail__spec-card--a2">
            <div className="bike-detail__spec-card-header">
              <span className="material-symbols-outlined" aria-hidden="true">
                {getMotorcycleTechnicalIcon('license')}
              </span>
            </div>
            <p className="bike-detail__spec-label">COMPATIBILIDAD A2</p>
            <div className="bike-detail__a2-info">
              <span className="bike-detail__a2-badge">{a2Badge.label}</span>
              {bike.isA2LimitedVersion && bike.limitedPowerHp !== null && (
                <span className="bike-detail__a2-limited">
                  Limitada a {bike.limitedPowerHp} CV
                  {bike.originalPowerHp !== null && ` (orig. ${bike.originalPowerHp} CV)`}
                </span>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

function CompareTab({ relatedBikes }: { relatedBikes: readonly Bike[] }) {
  if (relatedBikes.length === 0) {
    return (
      <div className="bike-detail__compare-tab">
        <p className="bike-detail__compare-empty">Sin modelos relacionados del mismo segmento por ahora.</p>
      </div>
    );
  }

  return (
    <div className="bike-detail__compare-tab">
      <div className="bike-detail__compare-header">
        <h2 id="bike-detail-related-title">Rivales del mismo segmento</h2>
        <p>Para comparar con criterio: mismo uso, distinta ejecución.</p>
      </div>
      <div className="bike-detail__related-list">
        {relatedBikes.map((relatedBike) => (
          <article key={relatedBike.id}>
            <MotorcycleImage motorcycle={relatedBike} loading="lazy" />
            <span>{segmentLabels[relatedBike.segment]}</span>
            <h3>{getBikeDisplayName(relatedBike)}</h3>
            <dl>
              <div>
                <dt>Potencia</dt>
                <dd>{numberFormatter.format(relatedBike.powerHp)} CV</dd>
              </div>
              <div>
                <dt>Peso</dt>
                <dd>{numberFormatter.format(relatedBike.wetWeightKg)} kg</dd>
              </div>
            </dl>
            <a href={getBikeDetailHash(relatedBike)}>Ver ficha</a>
          </article>
        ))}
      </div>
    </div>
  );
}

function CommunityTab({
  bike,
  reviews,
  onWriteReview,
  reactionSummaries,
  reactionPendingIds,
  reportedReviewIds,
  session,
  onToggleHelpful,
  onToggleNotHelpful,
}: {
  bike: Bike;
  reviews: readonly MotorcycleReview[];
  onWriteReview: () => void;
  reactionSummaries: readonly ReviewReactionSummary[];
  reactionPendingIds: readonly string[];
  reportedReviewIds: Readonly<Record<string, boolean>>;
  session: { user?: { id?: string } } | null;
  onToggleHelpful: (review: MotorcycleReview) => void;
  onToggleNotHelpful: (review: MotorcycleReview) => void;
}) {
  const userId = session?.user?.id ?? null;
  const aggregate = getReviewAggregate(reviews);
  const confidence = getRankingConfidence(aggregate.reviewCount);
  const confidenceLabel =
    confidence === 'high' ? 'Alta confianza' : confidence === 'medium' ? 'Media confianza' : 'Baja confianza';

  const hasReports = bike.reliabilityReports.reportCount > 0;
  const hasIssues = bike.reliabilityReports.commonIssues.length > 0;

  return (
    <div className="bike-detail__community-tab">
      <div className="bike-detail__community-summary">
        <div className="bike-detail__community-rating">
          {aggregate.reviewCount > 0 && aggregate.averageRating > 0 ? (
            <>
              <span className="bike-detail__community-stars" aria-hidden="true">
                ★
              </span>
              <strong>{formatReviewRating(aggregate.averageRating)}</strong>
              <span>/5</span>
            </>
          ) : (
            <span>Sin rating</span>
          )}
        </div>
        <div className="bike-detail__community-meta">
          <span>{aggregate.reviewCount > 0 ? `${aggregate.reviewCount} reviews` : 'Sin reviews'}</span>
          {aggregate.reviewCount > 0 && (
            <span
              className={`bike-detail__confidence-shield bike-detail__confidence-shield--${confidence}`}
              aria-label={confidenceLabel}
            >
              <span aria-hidden="true">{confidence === 'high' ? '●' : confidence === 'medium' ? '◐' : '○'}</span>
              <span>{confidenceLabel}</span>
            </span>
          )}
        </div>
      </div>

      <section className="bike-detail__reliability" aria-labelledby="bike-detail-reliability-title">
        <div>
          <h2 id="bike-detail-reliability-title">Fiabilidad comunidad</h2>
          <p>Datos agregados de reportes técnicos de usuarios.</p>
          <div className="bike-detail__reliability-index">
            <strong>{Math.round(bike.reliabilityReports.reliabilityScore * 10)}</strong>
            <span>
              Fiabilidad · {getReliabilityLevel(bike.reliabilityReports.reliabilityScore)} ·{' '}
              {numberFormatter.format(bike.reliabilityReports.reportCount)} reportes
            </span>
          </div>
        </div>

        {hasReports && hasIssues ? (
          <div className="bike-detail__issues">
            {bike.reliabilityReports.commonIssues.map((issue, index) => (
              <article key={issue}>
                <span>{index === 0 ? 'A vigilar' : 'Reporte frecuente'}</span>
                <p>{issue}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="bike-detail__reliability-empty">Sin reportes de fiabilidad todavía.</p>
        )}
      </section>

      <section className="bike-detail__reviews" aria-labelledby="bike-detail-reviews-title">
        <div className="bike-detail__reviews-header">
          <h2 id="bike-detail-reviews-title">Reviews de propietarios</h2>
          <button className="button button--primary" type="button" onClick={onWriteReview}>
            Escribir review
          </button>
        </div>
        <div className="bike-detail__reviews-list" aria-live="polite">
          {reviews.length > 0 ? (
            reviews.map((review) => {
              const isOwn = isOwnReview(review, userId);
              const hasReported = Boolean(reportedReviewIds[review.id]);
              const isPending = reactionPendingIds.includes(review.id);
              const summary = reactionSummaries.find((s) => s.reviewId === review.id) ?? null;
              const hasReactionAuth = Boolean(session);
              const canInteractHelpful = hasReactionAuth && !isOwn && !hasReported;

              return (
                <FeaturedReviewCard
                  key={review.id}
                  review={review}
                  hideImage
                  hideLinks
                  isOwnReview={isOwn}
                  actionsSlot={
                    <FeaturedReviewCardCommunityActions
                      review={review}
                      isOwn={isOwn}
                      hasReported={hasReported}
                      isPending={isPending}
                      summary={summary}
                      canInteract={canInteractHelpful}
                      onToggleHelpful={onToggleHelpful}
                      onToggleNotHelpful={onToggleNotHelpful}
                    />
                  }
                />
              );
            })
          ) : (
            <p className="bike-detail__reviews-empty">Sin reviews aprobadas todavía.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function getSpecGroups(bike: Bike): readonly DetailSpecGroup[] {
  const a2Badge = getBikeA2Badge(bike);

  return [
    {
      title: 'Motor & transmisión',
      items: [
        { label: 'Tipo', value: engineTypeLabels[bike.engineType] },
        { label: 'Cilindrada', value: `${numberFormatter.format(bike.displacementCc)} cc` },
        { label: 'Potencia máxima', value: `${numberFormatter.format(bike.powerHp)} CV` },
        { label: 'Par máximo', value: `${numberFormatter.format(bike.torqueNm)} Nm` },
      ],
    },
    {
      title: 'Chasis & ergonomía',
      items: [
        { label: 'Peso en orden de marcha', value: `${numberFormatter.format(bike.wetWeightKg)} kg` },
        { label: 'Altura de asiento', value: `${numberFormatter.format(bike.seatHeightMm)} mm` },
        { label: 'Depósito', value: `${numberFormatter.format(bike.fuelTankLiters)} L` },
        { label: 'Segmento', value: segmentLabels[bike.segment] },
      ],
    },
    {
      title: 'Mercado & registro',
      items: [
        { label: 'Carnet', value: a2Badge.label },
        { label: 'Año', value: String(bike.year) },
        {
          label: 'Precio estimado',
          value: isPendingPrice(bike.priceEur, bike.priceSource) ? pendingPriceLabel : currencyFormatter.format(bike.priceEur),
        },
        { label: 'Reportes comunidad', value: numberFormatter.format(bike.reliabilityReports.reportCount) },
      ],
    },
  ];
}

function NotFoundDetail() {
  return (
    <main className="bike-detail bike-detail--not-found">
      <section className="bike-detail__not-found">
        <span>404</span>
        <h1>Moto no encontrada</h1>
        <p>Ese registro no existe en el catálogo mock actual.</p>
        <a className="button button--primary" href="#/buscador">
          Volver al buscador
        </a>
      </section>
    </main>
  );
}

export type BikeDetailTab = 'resumen' | 'especificaciones' | 'comunidad' | 'comparar';

export function BikeDetailPage({ bike, motorcycles }: BikeDetailPageProps) {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<readonly MotorcycleReview[]>([]);
  const [reactionSummaries, setReactionSummaries] = useState<readonly ReviewReactionSummary[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BikeDetailTab>('resumen');
  const [reportedReviewIds, setReportedReviewIds] = useState<Readonly<Record<string, boolean>>>({});

  const reactionAuthContext = buildReviewAuthContext({
    accessToken: session?.access_token,
    isAuthenticated: Boolean(session),
    userId: session?.user?.id,
  });

  const {
    reactionPendingIds,
    toggleHelpful: toggleHelpfulReaction,
    toggleNotHelpful: toggleNotHelpfulReaction,
  } = useReviewReactions({
    authContext: reactionAuthContext,
    isReported: (reviewId) => Boolean(reportedReviewIds[reviewId]),
    userId: session?.user?.id,
  });

  const { hasReported } = useReviewReports({
    authContext: reactionAuthContext,
    reviewIds: reviews.map((r) => r.id),
    userId: session?.user?.id,
  });

  useEffect(() => {
    if (!bike) {
      return;
    }

    let isMounted = true;
    getApprovedReviewsByMotorcycleId(bike.id)
      .then((approvedReviews) => {
        if (isMounted) {
          setReviews(approvedReviews);
        }
        return approvedReviews;
      })
      .then((approvedReviews) => {
        if (approvedReviews.length === 0) return;
        return getReviewReactionSummary(approvedReviews.map((r) => r.id));
      })
      .then((summaries) => {
        if (isMounted && summaries) {
          setReactionSummaries(summaries ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReviews([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bike?.id]);

  const getSummaryForReview = useCallback(
    (reviewId: string): ReviewReactionSummary | null => {
      return reactionSummaries.find((s) => s.reviewId === reviewId) ?? null;
    },
    [reactionSummaries],
  );

  const handleToggleHelpful = useCallback(
    async (review: MotorcycleReview) => {
      const outcome = await toggleHelpfulReaction(review);
      if (outcome.outcome === 'success') {
        setReactionSummaries((current) =>
          current.map((s) => (s.reviewId === outcome.summary.reviewId ? outcome.summary : s)),
        );
      }
    },
    [toggleHelpfulReaction],
  );

  const handleToggleNotHelpful = useCallback(
    async (review: MotorcycleReview) => {
      const outcome = await toggleNotHelpfulReaction(review);
      if (outcome.outcome === 'success') {
        setReactionSummaries((current) =>
          current.map((s) => (s.reviewId === outcome.summary.reviewId ? outcome.summary : s)),
        );
      }
    },
    [toggleNotHelpfulReaction],
  );

  const handleOpenReport = useCallback((_review: MotorcycleReview) => {
    // Report form not wired in this phase - placeholder for future
  }, []);

  if (!bike) {
    return <NotFoundDetail />;
  }

  const bikeName = getBikeDisplayName(bike);
  const overallScore = getOverallScore(bike);
  const bestUse = getBestUse(bike);
  const a2Badge = getBikeA2Badge(bike);
  const priceLabel = isPendingPrice(bike.priceEur, bike.priceSource)
    ? pendingPriceLabel
    : currencyFormatter.format(bike.priceEur);
  const reviewAggregate = getReviewAggregate(reviews);
  const enabledFeatures = getFeatureEntries(bike).filter(([, isEnabled]) => isEnabled);
  const relatedBikes = motorcycles.filter((item) => item.segment === bike.segment && item.id !== bike.id).slice(0, 3);

  return (
    <main className="bike-detail" aria-labelledby="bike-detail-title">
      <header className="bike-detail__hero">
        <div className="bike-detail__hero-media" aria-hidden="true">
          <MotorcycleImage motorcycle={bike} decorative />
        </div>

        <div className="bike-detail__hero-content">
          <a className="bike-detail__back" href="#/buscador">
            ← Volver al catálogo
          </a>

          <div className="bike-detail__badges">
            <span>{segmentLabels[bike.segment]}</span>
            <span>{a2Badge.label}</span>
            <span>{bike.year}</span>
          </div>

          <h1 id="bike-detail-title">
            {bike.brand} <strong>{bike.model}</strong>
          </h1>
          <p>{bike.description}</p>

          <div className="bike-detail__hero-specs" role="group" aria-label="Datos principales">
            <div>
              <span>Potencia</span>
              <strong>
                {numberFormatter.format(bike.powerHp)} <small>CV</small>
              </strong>
            </div>
            <div>
              <span>Peso</span>
              <strong>
                {numberFormatter.format(bike.wetWeightKg)} <small>kg</small>
              </strong>
            </div>
            <div>
              <span>Motor</span>
              <strong>
                {numberFormatter.format(bike.displacementCc)} <small>cc</small>
              </strong>
            </div>
            <div>
              <span>Precio</span>
              <strong>{priceLabel}</strong>
            </div>
          </div>

          <div className="bike-detail__actions" role="group" aria-label="Acciones principales de la ficha">
            <a className="button button--primary" href={getCompareSearchHash(bike)}>
              Añadir al comparador
            </a>
            <a className="button button--ghost" href={`#/comunidad/${bike.id}`}>
              Ver reviews
            </a>
            {bike.officialUrl ? (
              <a className="button button--ghost" href={bike.officialUrl} target="_blank" rel="noopener noreferrer">
                Página oficial
              </a>
            ) : null}
            <a className="button button--ghost" href={getBrowseSearchHash()}>
              Ver más motos
            </a>
          </div>
        </div>
      </header>

      <nav className="bike-detail__tabs" role="tablist" aria-label="Secciones de la ficha">
        <button
          role="tab"
          aria-selected={activeTab === 'resumen'}
          aria-controls="tabpanel-resumen"
          id="tab-resumen"
          className={activeTab === 'resumen' ? 'bike-detail__tab bike-detail__tab--active' : 'bike-detail__tab'}
          onClick={() => setActiveTab('resumen')}
          type="button"
        >
          Resumen
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'especificaciones'}
          aria-controls="tabpanel-especificaciones"
          id="tab-especificaciones"
          className={activeTab === 'especificaciones' ? 'bike-detail__tab bike-detail__tab--active' : 'bike-detail__tab'}
          onClick={() => setActiveTab('especificaciones')}
          type="button"
        >
          Especificaciones
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'comunidad'}
          aria-controls="tabpanel-comunidad"
          id="tab-comunidad"
          className={activeTab === 'comunidad' ? 'bike-detail__tab bike-detail__tab--active' : 'bike-detail__tab'}
          onClick={() => setActiveTab('comunidad')}
          type="button"
        >
          Comunidad
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'comparar'}
          aria-controls="tabpanel-comparar"
          id="tab-comparar"
          className={activeTab === 'comparar' ? 'bike-detail__tab bike-detail__tab--active' : 'bike-detail__tab'}
          onClick={() => setActiveTab('comparar')}
          type="button"
        >
          Comparar
        </button>
      </nav>

      <div
        role="tabpanel"
        id="tabpanel-resumen"
        aria-labelledby="tab-resumen"
        className="bike-detail__tab-content"
      >
        {activeTab === 'resumen' && (
          <>
            <section className="bike-detail__riding" aria-labelledby="bike-detail-riding-title">
              <div className="bike-detail__score-card">
                <span>Riding profile</span>
                <h2 id="bike-detail-riding-title">Perfil dinámico</h2>
                <p>Nuestra lectura técnica basada en uso real, ergonomía y enfoque de segmento.</p>
                <strong>{overallScore.toFixed(1)}</strong>
                <small>Overall performance</small>
              </div>

              <div className="bike-detail__score-list">
                {getUseScoreEntries(bike).map(([key, value]) => (
                  <div className="bike-detail__score-row" key={key}>
                    <div>
                      <span>{useScoreLabels[key]}</span>
                      <strong>{value.toFixed(1)}</strong>
                    </div>
                    <div aria-hidden="true">
                      <span style={{ width: scorePercent(value) }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bike-detail__fit" aria-labelledby="bike-detail-fit-title">
              <h2 id="bike-detail-fit-title">¿Es esta moto para ti?</h2>
              <div className="bike-detail__fit-grid">
                <article>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    person_pin
                  </span>
                  <h3>El perfil</h3>
                  <p>{segmentProfile[bike.segment]}</p>
                </article>
                <article>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    explore
                  </span>
                  <h3>Mejor uso</h3>
                  <p>
                    Destaca en <strong>{bestUse.label}</strong> con {bestUse.value.toFixed(1)}/10 dentro del catálogo.
                  </p>
                </article>
                <article>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    add_circle
                  </span>
                  <h3>Fortalezas</h3>
                  <ul>
                    {bike.pros.map((pro) => (
                      <li key={pro}>{pro}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    do_not_disturb_on
                  </span>
                  <h3>Limitaciones</h3>
                  <ul>
                    {bike.cons.map((con) => (
                      <li key={con}>{con}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          </>
        )}
        {activeTab === 'especificaciones' && <SpecificationsTab bike={bike} />}
        {activeTab === 'comunidad' && (
          <CommunityTab
            bike={bike}
            reviews={reviews}
            onWriteReview={() => setIsReviewModalOpen(true)}
            reactionSummaries={reactionSummaries}
            reactionPendingIds={reactionPendingIds}
            reportedReviewIds={reportedReviewIds}
            session={session}
            onToggleHelpful={handleToggleHelpful}
            onToggleNotHelpful={handleToggleNotHelpful}
          />
        )}
        {activeTab === 'comparar' && (
          <CompareTab relatedBikes={relatedBikes} />
        )}
      </div>

      <section className="bike-detail__specs" aria-labelledby="bike-detail-specs-title">
        <h2 id="bike-detail-specs-title">Especificaciones detalladas</h2>
        <div className="bike-detail__spec-groups">
          {getSpecGroups(bike).map((group) => (
            <article key={group.title}>
              <h3>{group.title}</h3>
              <dl>
                {group.items.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
