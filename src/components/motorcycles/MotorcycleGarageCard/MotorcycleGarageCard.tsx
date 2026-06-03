import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react';
import type { MotorcycleImageSource } from '../../../shared/images/getMotorcycleImage';
import { getRankingConfidence, type RankingConfidence } from '../../../shared/reviews/communityRankings';
import { formatReviewRating } from '../../../shared/reviews/reviewUtils';
import { Button } from '../../ui/Button';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import './MotorcycleGarageCard.scss';

export interface MotorcycleGarageCardProps {
  readonly as?: ElementType;
  readonly footerActions?: ReactNode;
  readonly title: string;
  readonly imageSource: MotorcycleImageSource | null;
  readonly imageAlt: string;
  readonly rating: number;
  readonly reviewCount: number;
  readonly primaryUseLabel?: string | null;
  readonly lastReviewDate?: string | Date | null;
  readonly reviewsHref: string;
  readonly detailHref: string;
}

export type MotorcycleGarageCardActionVariant = 'primary' | 'secondary';

export interface MotorcycleGarageCardActionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  readonly children: ReactNode;
  readonly variant?: MotorcycleGarageCardActionVariant;
  readonly isCompareAction?: boolean;
}

export function MotorcycleGarageCardAction({
  children,
  variant = 'primary',
  isCompareAction = false,
  className = '',
  ...props
}: MotorcycleGarageCardActionProps) {
  const classes = [
    'motorcycle-garage-card__action',
    `motorcycle-garage-card__action--${variant}`,
    isCompareAction ? 'motorcycle-garage-card__compare-action' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Button className={classes} type="button" {...props}>
      {children}
    </Button>
  );
}

const CONFIDENCE_LABELS: Record<RankingConfidence, string> = {
  high: 'Alta confianza',
  low: 'Baja confianza',
  medium: 'Media confianza',
};

function formatDateShort(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}

export function MotorcycleGarageCard({
  as = 'article',
  footerActions,
  title,
  imageSource,
  imageAlt,
  rating,
  reviewCount,
  primaryUseLabel,
  lastReviewDate,
  reviewsHref,
  detailHref,
}: MotorcycleGarageCardProps) {
  const RootTag = as;
  const confidence = getRankingConfidence(reviewCount);
  const confidenceLabel = CONFIDENCE_LABELS[confidence];
  const reviewLabel = reviewCount === 1 ? '1 review' : `${reviewCount} reviews`;
  const dateLabel = formatDateShort(lastReviewDate);
  const usageLabel = primaryUseLabel ?? 'Uso mixto';

  return (
    <RootTag className="motorcycle-garage-card" data-testid="motorcycle-garage-card" aria-label={`${title}: ${reviewLabel}`}>
      <MotorcycleImage
        alt={imageAlt}
        className="motorcycle-garage-card__image"
        decorative
        motorcycle={imageSource ?? { name: imageAlt }}
      />
      <div className="motorcycle-garage-card__overlay" aria-hidden="true" />

      <div className="motorcycle-garage-card__content">
        <header className="motorcycle-garage-card__header">
          <div>
            <h3>{title}</h3>
          </div>
          <div className="motorcycle-garage-card__rating" aria-label={`Rating medio ${formatReviewRating(rating)} de 5`}>
            <span className="motorcycle-garage-card__rating-star" aria-hidden="true">★</span>
            <strong>{formatReviewRating(rating)}</strong>
            <span
              aria-label={confidenceLabel}
              className={`motorcycle-garage-card__confidence motorcycle-garage-card__confidence--${confidence}`}
              role="img"
            >
              <span className="material-symbols-outlined" aria-hidden="true">shield</span>
              <span className="motorcycle-garage-card__confidence-tooltip" role="tooltip">{confidenceLabel}</span>
            </span>
          </div>
        </header>

        <div className="motorcycle-garage-card__meta-row">
          <span className="motorcycle-garage-card__meta-item">
            <span className="material-symbols-outlined" aria-hidden="true">explore</span>
            <span>{usageLabel}</span>
          </span>
          <span className="motorcycle-garage-card__meta-item">
            <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
            <span>{reviewLabel}</span>
          </span>
          {dateLabel ? (
            <span className="motorcycle-garage-card__meta-item">
              <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
              <span>{dateLabel}</span>
            </span>
          ) : null}
        </div>

        <footer className="motorcycle-garage-card__actions">
          <a className="motorcycle-garage-card__action motorcycle-garage-card__action--primary" href={reviewsHref}>
            <span className="material-symbols-outlined" aria-hidden="true">rate_review</span>
            <span>Reviews</span>
          </a>
          <a
            className="motorcycle-garage-card__action motorcycle-garage-card__action--secondary"
            href={detailHref}
            aria-label="Ver ficha técnica"
          >
            <span className="material-symbols-outlined" aria-hidden="true">list_alt</span>
            <span>Ficha</span>
          </a>
          {footerActions}
        </footer>
      </div>
    </RootTag>
  );
}
