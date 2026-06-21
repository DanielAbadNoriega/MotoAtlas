import { MotoIcon } from '../../../shared/ui/icons/MotoIcon';
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
        <MotoIcon name="flag" />
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
      <MotoIcon name="flag" />
      Reportar
    </button>
  );
}
