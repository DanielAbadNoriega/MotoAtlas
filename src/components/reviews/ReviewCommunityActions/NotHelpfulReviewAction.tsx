import type { NotHelpfulReviewActionProps } from './ReviewCommunityActions.types';

export function NotHelpfulReviewAction({
  isBlocked,
  isOwnReview,
  isPending,
  onToggle,
  summary,
}: NotHelpfulReviewActionProps) {
  if (isOwnReview || isBlocked) {
    return null;
  }

  return (
    <button
      className="motorcycle-community__helpful-action motorcycle-community__helpful-action--not-helpful"
      type="button"
      aria-label={summary.hasReactedNotHelpful ? 'Quitar no útil' : 'Marcar como no útil'}
      aria-pressed={summary.hasReactedNotHelpful}
      data-active={summary.hasReactedNotHelpful ? 'true' : 'false'}
      disabled={isPending}
      onClick={onToggle}
    >
      <span className="material-symbols-outlined" aria-hidden="true">thumb_down</span>
      No útil
    </button>
  );
}
