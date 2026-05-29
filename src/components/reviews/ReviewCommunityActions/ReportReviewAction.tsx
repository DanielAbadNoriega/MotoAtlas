import type { ReportReviewActionProps } from './ReviewCommunityActions.types';

export function ReportReviewAction({
  hasReported,
  isOwnReview,
  isPending,
  onOpen,
}: ReportReviewActionProps) {
  if (isOwnReview) {
    return null;
  }

  if (hasReported) {
    return (
      <span className="motorcycle-community__helpful-action motorcycle-community__helpful-action--reported" aria-label="Review reportada">
        <span className="material-symbols-outlined" aria-hidden="true">flag</span>
        Reportada
      </span>
    );
  }

  return (
    <button
      className="motorcycle-community__helpful-action motorcycle-community__helpful-action--report"
      type="button"
      aria-label="Reportar review"
      disabled={isPending}
      onClick={onOpen}
    >
      <span className="material-symbols-outlined" aria-hidden="true">flag</span>
      Reportar
    </button>
  );
}
