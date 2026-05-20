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
import './AccountReviewCard.scss';

type AccountReviewCardProps = Readonly<{
  headingLevel?: 2 | 3;
  review: MotorcycleReview;
  variant?: 'compact' | 'full';
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

export function AccountReviewCard({ headingLevel = 2, review, variant = 'full' }: AccountReviewCardProps) {
  const Heading = `h${headingLevel}` as const;
  const motorcycle = getAccountReviewMotorcycleDisplay(review);

  return (
    <article className={`account-review-card account-review-card--${variant}`} data-testid="account-review-card">
      <div className="account-review-card__media">
        <MotorcycleImage alt={motorcycle.name} className="account-review-card__image" motorcycle={motorcycle.imageSource} />
        <div className="account-review-card__gradient" aria-hidden="true" />
      </div>

      <div className="account-review-card__body">
        <header className="account-review-card__header">
          <div>
            <div className="account-review-card__kicker">
              <span className={`account-review-card__status account-review-card__status--${review.status}`}>
                {accountReviewStatusLabels[review.status]}
              </span>
              <span className="account-review-card__rating">{review.rating}/5 rating</span>
            </div>
            <Heading>{motorcycle.name}</Heading>
          </div>
          <time dateTime={review.createdAt}>{formatAccountReviewDate(review.createdAt)}</time>
        </header>

        <dl className="account-review-card__specs">
          <div>
            <dt>Tiempo con la moto</dt>
            <dd>{formatAccountReviewOwnershipMonths(review.ownershipMonths)}</dd>
          </div>
          <div>
            <dt>Kilómetros</dt>
            <dd>{formatAccountReviewKilometers(review.kilometers)}</dd>
          </div>
          <div>
            <dt>Uso principal</dt>
            <dd>{accountReviewRidingStyleLabels[review.ridingStyle]}</dd>
          </div>
        </dl>

        <p className="account-review-card__comment">“{review.comment}”</p>

        <div className="account-review-card__chips-row">
          <ReviewChips items={review.pros} tone="positive" />
          <ReviewChips items={review.cons} tone="negative" />
        </div>

        <footer className="account-review-card__actions">
          <a href={motorcycle.detailHref}>Ver ficha</a>
          <a href={motorcycle.communityHref}>Ver comunidad</a>
        </footer>
      </div>
    </article>
  );
}
