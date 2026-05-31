import type { CreateReviewAuthContext, MotorcycleReview } from '../../services/motorcycleReviewService';
import type { ReviewReactionSummary } from '../../services/reviewReactionService';
import type { ReviewReport } from '../../services/reviewReportService';

const duplicateReviewReportMessage = 'Ya has reportado esta review.';

type BuildReviewAuthContextInput = Readonly<{
  accessToken?: string | null;
  isAuthenticated: boolean;
  userId?: string | null;
}>;

export function buildReviewAuthContext({
  accessToken,
  isAuthenticated,
  userId,
}: BuildReviewAuthContextInput): CreateReviewAuthContext | null {
  if (!isAuthenticated || !userId || !accessToken) {
    return null;
  }

  return { accessToken, userId };
}

export function isOwnReview(
  review: Pick<MotorcycleReview, 'userId'>,
  userId: string | null | undefined,
) {
  return review.userId !== null && review.userId !== undefined && userId !== null && userId !== undefined && review.userId === userId;
}

function getErrorMessage(error: unknown): string | null {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return null;
}

export function isDuplicateReviewReportError(error: unknown) {
  const message = getErrorMessage(error);
  return message?.trim() === duplicateReviewReportMessage;
}

export function markReportsByReviewId<T extends Pick<ReviewReport, 'reviewId'>>(
  currentReports: Readonly<Record<string, boolean>>,
  reports: readonly T[],
) {
  return {
    ...currentReports,
    ...Object.fromEntries(reports.map((report) => [report.reviewId, true] as const)),
  };
}

export function upsertReactionSummaryInList(
  currentSummaries: readonly ReviewReactionSummary[],
  summary: ReviewReactionSummary,
) {
  const filtered = currentSummaries.filter((current) => current.reviewId !== summary.reviewId);
  return [...filtered, summary];
}

export function upsertReactionSummaryById(
  currentSummaries: Readonly<Record<string, ReviewReactionSummary>>,
  summary: ReviewReactionSummary,
) {
  return {
    ...currentSummaries,
    [summary.reviewId]: summary,
  };
}
