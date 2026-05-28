import { useState } from 'react';
import type { MotorcycleReview, MotorcycleReviewAspect } from '../../../services/motorcycleReviewService';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { ReviewAspectSummary } from '../ReviewAspectSummary';
import {
  accountReviewRidingStyleLabels,
  formatAccountReviewDate,
  formatAccountReviewKilometers,
  formatAccountReviewOwnershipMonths,
  getAccountReviewMotorcycleDisplay,
} from '../../reviews/AccountReviewCard/accountReviewPresentation';
import { formatReviewRating, getReviewUserName } from '../../../shared/reviews/reviewUtils';
import './FeaturedReviewCard.scss';

export type FeaturedReviewCardProps = Readonly<{
  headingLevel?: 2 | 3;
  review: MotorcycleReview;
  aspects?: readonly MotorcycleReviewAspect[] | null;
  actionsSlot?: React.ReactNode;
}>;

function formatCommunityAlias(userName: string) {
  const cleanName = getReviewUserName({ userName });
  return cleanName.startsWith('@') ? cleanName : `@${cleanName.replace(/\s+/g, '_')}`;
}

function getInitials(userName: string) {
  return getReviewUserName({ userName })
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getNonEmptyReviewItems(items?: readonly (string | null)[] | null): readonly string[] {
  return (items ?? [])
    .filter((item): item is string => item != null)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item) => item.toLowerCase() !== 'null' && item.toLowerCase() !== 'undefined');
}

function ReviewMetadata({ review }: Readonly<{ review: MotorcycleReview }>) {
  return (
    <ul className="featured-review-card__meta" aria-label="Metadatos de la review">
      <li>
        <span className="material-symbols-outlined" aria-hidden="true">route</span>
        {accountReviewRidingStyleLabels[review.ridingStyle]}
      </li>
      <li>
        <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
        {formatAccountReviewOwnershipMonths(review.ownershipMonths)}
      </li>
      <li>
        <span className="material-symbols-outlined" aria-hidden="true">speed</span>
        {formatAccountReviewKilometers(review.kilometers)}
      </li>
      <li>
        <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
        <time dateTime={review.createdAt}>{formatAccountReviewDate(review.createdAt)}</time>
      </li>
    </ul>
  );
}

export function FeaturedReviewCard({ headingLevel = 3, review, aspects, actionsSlot }: FeaturedReviewCardProps) {
  const Heading = `h${headingLevel}` as const;
  const motorcycle = getAccountReviewMotorcycleDisplay(review);
  const [isExpanded, setIsExpanded] = useState(false);
  const bodyId = `featured-review-body-${review.id}`;
  const pros = getNonEmptyReviewItems(review.pros);
  const cons = getNonEmptyReviewItems(review.cons);
  const hasPros = pros.length > 0;
  const hasCons = cons.length > 0;

  function handleToggle() {
    setIsExpanded((prev) => !prev);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  }

  return (
    <article className="featured-review-card" data-testid="featured-review-card">
      <div className="featured-review-card__media">
        <MotorcycleImage alt={motorcycle.name} className="featured-review-card__image" motorcycle={motorcycle.imageSource} />
        <div className="featured-review-card__gradient" aria-hidden="true" />
      </div>

      <div className="featured-review-card__content">
        <button
          className="featured-review-card__header"
          aria-expanded={isExpanded}
          aria-controls={bodyId}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          type="button"
        >
          <div className="featured-review-card__title-group">
            <div className="featured-review-card__title-row">
              <Heading className="featured-review-card__title">{motorcycle.name}</Heading>
              <span className="featured-review-card__rating" aria-label={`Rating ${formatReviewRating(review.rating)} de 5`}>
                <span className="featured-review-card__rating-icon" aria-hidden="true">★</span>
                {formatReviewRating(review.rating)}
              </span>
            </div>
            <ReviewMetadata review={review} />
          </div>
          <span className="material-symbols-outlined featured-review-card__expand-icon" aria-hidden="true">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        <div
          className="featured-review-card__body"
          id={bodyId}
          hidden={!isExpanded}
        >
          <p className="featured-review-card__comment">"{review.comment}"</p>

          {hasPros ? (
            <div className="featured-review-card__pros">
              <span className="featured-review-card__pros-label">Pros:</span>
              <span className="featured-review-card__pros-text">{pros.join(', ')}</span>
            </div>
          ) : null}

          {hasCons ? (
            <div className="featured-review-card__cons">
              <span className="featured-review-card__cons-label">Contras:</span>
              <span className="featured-review-card__cons-text">{cons.join(', ')}</span>
            </div>
          ) : null}

          {aspects && aspects.length > 0 ? (
            <ReviewAspectSummary aspects={aspects} />
          ) : null}
        </div>

        <footer className="featured-review-card__footer">
          <div className="featured-review-card__author">
            <span className="featured-review-card__author-avatar" aria-hidden="true">{getInitials(review.userName)}</span>
            <span className="featured-review-card__author-name">{formatCommunityAlias(review.userName)}</span>
          </div>
          <div className="featured-review-card__actions">
            {actionsSlot}
            <a href={motorcycle.detailHref}>Ver ficha</a>
            <a href={motorcycle.communityHref}>Más reviews</a>
          </div>
        </footer>
      </div>
    </article>
  );
}
