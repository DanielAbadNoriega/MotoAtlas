import type { Bike } from '../../../types/bike';
import type { RankingConfidence } from '../../../shared/reviews/communityRankings';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import './PodiumCard.scss';

export type PodiumCardVariant = 'large' | 'compact';

export type PodiumCardStat = Readonly<{
  label: string;
  value: string | number;
}>;

export interface PodiumCardProps {
  readonly bike: Bike;
  readonly rank: number;
  readonly variant?: PodiumCardVariant;
  readonly scoreLabel: string;
  readonly confidence: RankingConfidence;
  readonly confidenceTooltip: string;
  readonly stats: readonly PodiumCardStat[];
  readonly meta: string;
  readonly href: string;
  readonly ctaLabel?: string;
  readonly loading?: 'eager' | 'lazy';
  readonly statsAriaLabel?: string;
  readonly showConfidence?: boolean;
}

export function PodiumCard({
  bike,
  rank,
  variant = 'large',
  scoreLabel,
  confidence,
  confidenceTooltip,
  stats,
  meta,
  href,
  ctaLabel = 'Ver reviews',
  statsAriaLabel,
  showConfidence = true,
}: PodiumCardProps) {
  const rankPadded = String(rank).padStart(2, '0');

  return (
    <article className={`podium-card podium-card--${variant}`} aria-label={`Puesto ${rank}: ${bike.brand} ${bike.model}`}>
      <MotorcycleImage
        motorcycle={bike}
        alt={`Imagen de ${bike.brand} ${bike.model}`}
        loading={rank === 1 ? 'eager' : 'lazy'}
      />
      <div className="podium-card__overlay" aria-hidden="true" />
      <div className="podium-card__rank-badge">
        <strong>{rankPadded}</strong>
      </div>
      <div className="podium-card__content">
        <div className="podium-card__header">
          <p>{bike.brand}</p>
          <h3>{bike.model}</h3>
          <span>{meta}</span>
        </div>
        {stats.length > 0 && (
          <div className="podium-card__stats" aria-label={statsAriaLabel}>
            {stats.map((stat) => (
              <div key={stat.label} className="podium-card__stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        )}
        <div className="podium-card__score">
          <span className="material-symbols-outlined podium-card__score-icon" aria-hidden="true">analytics</span>
          <strong>{scoreLabel}</strong>
          {showConfidence ? (
            <span
              className={`podium-card__confidence-shield podium-card__confidence-shield--${confidence}`}
              aria-label={confidenceTooltip}
              tabIndex={0}
            >
              <span className="material-symbols-outlined" aria-hidden="true">shield</span>
              <span className="podium-card__confidence-tooltip" role="tooltip">
                {confidenceTooltip}
              </span>
            </span>
          ) : null}
        </div>
        <a href={href} className="podium-card__action">
          {ctaLabel} <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </a>
      </div>
    </article>
  );
}