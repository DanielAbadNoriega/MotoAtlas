import type { MotorcycleReview } from '../../../services/motorcycleReviewService';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import {
  accountReviewRidingStyleLabels,
  accountReviewStatusLabels,
  formatAccountReviewDate,
  formatAccountReviewKilometers,
  formatAccountReviewOwnershipMonths,
  getAccountReviewMotorcycleDisplay,
} from './accountReviewPresentation';
import { formatReviewRating, getReviewUserName } from '../../../shared/reviews/reviewUtils';
import './AccountReviewCard.scss';

type AccountReviewCardProps = Readonly<{
  headingLevel?: 2 | 3;
  review: MotorcycleReview;
  variant?: 'compact' | 'community' | 'communityCompact' | 'full';
}>;

function ReviewChips({ items, tone }: Readonly<{ items: readonly string[]; tone: 'positive' | 'negative' }>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="account-review-card__chips" aria-label={tone === 'positive' ? 'Pros' : 'Contras'}>
      {items.map((item) => (
        <span className={`account-review-card__chip account-review-card__chip--${tone}`} key={item}>
          {tone === 'positive' ? '+' : '-'} {item}
        </span>
      ))}
    </div>
  );
}

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

function RatingBadge({ rating }: Readonly<{ rating: number }>) {
  return (
    <span className="account-review-card__rating" aria-label={`Rating ${formatReviewRating(rating)} de 5`}>
      <span className="account-review-card__rating-icon" aria-hidden="true">★</span>
      {formatReviewRating(rating)}
    </span>
  );
}

function ReviewMetadata({ review }: Readonly<{ review: MotorcycleReview }>) {
  return (
    <ul className="account-review-card__meta" aria-label="Metadatos de la review">
      <li>
        <span className="material-symbols-outlined" aria-hidden="true">speed</span>
        {formatAccountReviewKilometers(review.kilometers)}
      </li>
      <li>
        <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
        {formatAccountReviewOwnershipMonths(review.ownershipMonths)}
      </li>
      <li>
        <span className="material-symbols-outlined" aria-hidden="true">route</span>
        {accountReviewRidingStyleLabels[review.ridingStyle]}
      </li>
      <li>
        <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
        <time dateTime={review.createdAt}>{formatAccountReviewDate(review.createdAt)}</time>
      </li>
    </ul>
  );
}

function ReviewAuthor({ userName }: Readonly<{ userName: string }>) {
  return (
    <div className="account-review-card__author">
      <span className="account-review-card__author-avatar" aria-hidden="true">{getInitials(userName)}</span>
      <span className="account-review-card__author-name">{formatCommunityAlias(userName)}</span>
    </div>
  );
}

export function AccountReviewCard({ headingLevel = 2, review, variant = 'full' }: AccountReviewCardProps) {
  const Heading = `h${headingLevel}` as const;
  const motorcycle = getAccountReviewMotorcycleDisplay(review);
  const isCommunityVariant = variant === 'community' || variant === 'communityCompact';
  const footerClasses = [
    'account-review-card__footer',
    isCommunityVariant ? 'account-review-card__footer--with-author' : 'account-review-card__footer--actions-only',
  ].join(' ');

  return (
    <article className={`account-review-card account-review-card--${variant}`} data-testid="account-review-card">
      <div className="account-review-card__media">
        <MotorcycleImage alt={motorcycle.name} className="account-review-card__image" motorcycle={motorcycle.imageSource} />
        <div className="account-review-card__gradient" aria-hidden="true" />
      </div>

      <div className="account-review-card__body">
        <header className="account-review-card__header">
          <div className="account-review-card__title-group">
            {isCommunityVariant ? null : (
              <span className={`account-review-card__status account-review-card__status--${review.status}`}>
                {accountReviewStatusLabels[review.status]}
              </span>
            )}
            <div className="account-review-card__title-row">
              <Heading>{motorcycle.name}</Heading>
              <RatingBadge rating={review.rating} />
            </div>
          </div>
        </header>

        <ReviewMetadata review={review} />

        <p className="account-review-card__comment">“{review.comment}”</p>

        <div className="account-review-card__chips-row">
          <ReviewChips items={review.pros} tone="positive" />
          <ReviewChips items={review.cons} tone="negative" />
        </div>

        <footer className={footerClasses}>
          {isCommunityVariant ? <ReviewAuthor userName={review.userName} /> : null}
          <div className="account-review-card__actions">
            <a href={motorcycle.detailHref}>Ver ficha</a>
            <a href={motorcycle.communityHref}>Más reviews</a>
          </div>
        </footer>
      </div>
    </article>
  );
}
