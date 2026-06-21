import type { MotorcycleReview, MotorcycleReviewRidingStyle } from '../../../services/motorcycleReviewService';
import { MotoIcon } from '../../../shared/ui/icons/MotoIcon';
import { getInitialsSafe } from '../../../shared/reviews/communityUtils';
import { getReviewUserName, isReviewVerified } from '../../../shared/reviews/reviewUtils';
import './MotorcycleReviewCard.scss';

type MotorcycleReviewCardProps = Readonly<{
  review: MotorcycleReview;
  variant?: 'compact' | 'full';
}>;

const numberFormatter = new Intl.NumberFormat('es-ES');
const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const ridingStyleLabels: Record<MotorcycleReviewRidingStyle, string> = {
  ciudad: 'Ciudad',
  deportivo: 'Deportivo',
  diario: 'Diario',
  offroad: 'Off-road',
  pasajero: 'Pasajero',
  viaje: 'Viaje',
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente';
  }

  return dateFormatter.format(date);
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="motorcycle-review-card__stars" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MotoIcon className="motorcycle-review-card__star" data-filled={rating >= star ? 'true' : 'false'} key={star} name="star" />
      ))}
    </span>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="motorcycle-review-card__user-icon" viewBox="0 0 24 24" focusable="false">
      <path d="M12 12.25c2.42 0 4.38-1.96 4.38-4.38S14.42 3.5 12 3.5 7.62 5.46 7.62 7.87 9.58 12.25 12 12.25Zm0 2.1c-3.36 0-6.9 1.64-6.9 4.05v1.1h13.8v-1.1c0-2.41-3.54-4.05-6.9-4.05Z" />
    </svg>
  );
}

function ListBlock({ items, title }: { items: readonly string[]; title: string }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <strong>{title}</strong>
      <ul>
        {items.map((item, index) => (
          <li key={item || index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function MotorcycleReviewCard({ review, variant = 'full' }: MotorcycleReviewCardProps) {
  const userName = getReviewUserName(review);
  const pros = (review.pros ?? []).map(String).filter(Boolean);
  const cons = (review.cons ?? []).map(String).filter(Boolean);
  const shouldShowDetails = variant === 'full';

  return (
    <article className={`motorcycle-review-card motorcycle-review-card--${variant}`} role="listitem">
      <header>
        <div>
          <span className="motorcycle-review-card__avatar" aria-hidden="true">
            <UserIcon />
            <strong>{getInitialsSafe(userName)}</strong>
          </span>
          <div>
            <h3>{userName}</h3>
            <small>
              {ridingStyleLabels[(review.ridingStyle ?? 'diario') as MotorcycleReviewRidingStyle]} · {formatDate(review.createdAt ?? '')}
            </small>
            {isReviewVerified(review) ? (
              <span className="motorcycle-review-card__verified-badge">
                <MotoIcon name="verified" />
                Review verificada
              </span>
            ) : null}
          </div>
        </div>
        <div>
          <RatingStars rating={review.rating} />
          <strong>{review.rating}/5</strong>
        </div>
      </header>

      <p>{(review.comment ?? '').toString().trim() || '—'}</p>

      {shouldShowDetails ? (
        <dl>
          <div>
            <dt>Propiedad</dt>
            <dd>{review.ownershipMonths === null ? 'N/D' : `${review.ownershipMonths} meses`}</dd>
          </div>
          <div>
            <dt>Kilómetros</dt>
            <dd>{review.kilometers === null ? 'N/D' : `${numberFormatter.format(review.kilometers)} km`}</dd>
          </div>
        </dl>
      ) : null}

      {shouldShowDetails && (pros.length > 0 || cons.length > 0) ? (
        <div className="motorcycle-review-card__pros-cons">
          <ListBlock title="Pros" items={pros} />
          <ListBlock title="Contras" items={cons} />
        </div>
      ) : null}
    </article>
  );
}
