import { MotoIcon } from '../../../shared/ui/icons/MotoIcon';
import type { HelpfulReviewActionProps } from './ReviewCommunityActions.types';

const numberFormatter = new Intl.NumberFormat('es-ES');

export function HelpfulReviewAction({
  disabled = false,
  isBlocked,
  isOwnReview,
  isPending,
  onToggle,
  summary,
}: HelpfulReviewActionProps) {
  const count = numberFormatter.format(summary.helpfulCount);

  if (isOwnReview || isBlocked) {
    return (
      <span className="motorcycle-community__helpful-action motorcycle-community__helpful-action--passive" aria-label={`Útil ${count}`}>
        <MotoIcon name="thumb_up" />
        Útil {count}
      </span>
    );
  }

  return (
    <button
      className="motorcycle-community__helpful-action"
      type="button"
      aria-label={summary.hasReactedHelpful ? `Quitar útil. Útil ${count}` : `Marcar como útil. Útil ${count}`}
      aria-pressed={summary.hasReactedHelpful}
      data-active={summary.hasReactedHelpful ? 'true' : 'false'}
      disabled={disabled || isPending}
      onClick={onToggle}
    >
      <MotoIcon name="thumb_up" />
      Útil {count}
    </button>
  );
}
