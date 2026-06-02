import type { ReviewReactionSummary } from '../../../services/reviewReactionService';
import type { MotorcycleReview } from '../../../services/motorcycleReviewService';
import {
  HelpfulReviewAction,
  NotHelpfulReviewAction,
  ReportReviewAction,
} from '../ReviewCommunityActions';

export type FeaturedReviewCardActionsProps = Readonly<{
  review: MotorcycleReview;
  isOwn: boolean;
  hasReported: boolean;
  isPending: boolean;
  summary: ReviewReactionSummary | null;
  canInteract: boolean;
  onToggleHelpful: (review: MotorcycleReview) => void;
  onToggleNotHelpful: (review: MotorcycleReview) => void;
  onOpenReport?: (review: MotorcycleReview) => void;
}>;

export function FeaturedReviewCardCommunityActions({
  review,
  isOwn,
  hasReported,
  isPending,
  summary,
  canInteract,
  onToggleHelpful,
  onToggleNotHelpful,
  onOpenReport,
}: FeaturedReviewCardActionsProps) {
  const effectiveSummary = summary ?? {
    reviewId: review.id,
    helpfulCount: 0,
    hasReactedHelpful: false,
    hasReactedNotHelpful: false,
  };

  return (
    <>
      <HelpfulReviewAction
        isBlocked={!canInteract}
        isOwnReview={isOwn}
        isPending={isPending}
        onToggle={() => onToggleHelpful(review)}
        summary={effectiveSummary}
      />
      {canInteract ? (
        <NotHelpfulReviewAction
          isBlocked={hasReported}
          isOwnReview={isOwn}
          isPending={isPending}
          onToggle={() => onToggleNotHelpful(review)}
          summary={effectiveSummary}
        />
      ) : null}
      {canInteract && onOpenReport ? (
        <ReportReviewAction
          hasReported={hasReported}
          isOwnReview={isOwn}
          isPending={isPending}
          onOpen={() => onOpenReport(review)}
        />
      ) : null}
    </>
  );
}