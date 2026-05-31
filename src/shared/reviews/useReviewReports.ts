import { useEffect, useMemo, useState } from 'react';
import { createReviewReport, getMyReviewReports, type ReviewReportReason } from '../../services/reviewReportService';
import type { CreateReviewAuthContext, MotorcycleReview } from '../../services/motorcycleReviewService';
import { isDuplicateReviewReportError, isOwnReview, markReportsByReviewId } from './reviewCommunityActions';

export type ReportGuardReason = 'unauthenticated' | 'own_review' | 'already_reported';

export type ReviewReportFormState = Readonly<{
  comment: string;
  isSubmitting: boolean;
  reason: ReviewReportReason;
  reviewId: string;
}>;

type OpenReportFormResult =
  | { ok: true }
  | { ok: false; reason: ReportGuardReason };

type SubmitReportResult =
  | { outcome: 'success'; reviewId: string; cleanupError?: unknown }
  | { outcome: 'duplicate'; reviewId: string; message: string; cleanupError?: unknown }
  | { outcome: 'blocked'; reason: ReportGuardReason }
  | { outcome: 'error'; error: unknown };

export type UseReviewReportsOptions = Readonly<{
  reviewIds: readonly string[];
  authContext: CreateReviewAuthContext | null;
  userId: string | null | undefined;
  onClearReactionAfterReport?: (input: {
    reviewId: string;
    authContext: CreateReviewAuthContext;
  }) => Promise<void>;
}>;

export type UseReviewReportsReturn = Readonly<{
  reportedReviewIds: Readonly<Record<string, boolean>>;
  reportForm: ReviewReportFormState | null;
  reportPendingIds: readonly string[];
  hasReported: (reviewId: string) => boolean;
  openReportForm: (review: Pick<MotorcycleReview, 'id' | 'userId'>) => OpenReportFormResult;
  cancelReportForm: () => void;
  updateReportReason: (reason: ReviewReportReason) => void;
  updateReportComment: (comment: string) => void;
  submitReport: (review: Pick<MotorcycleReview, 'id' | 'userId'>) => Promise<SubmitReportResult>;
}>;

function normalizeReviewIds(reviewIds: readonly string[]) {
  return Array.from(new Set(reviewIds.map((reviewId) => reviewId.trim()).filter(Boolean)));
}

function asError(value: unknown, fallbackMessage: string) {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return new Error(value.trim());
  }

  return new Error(fallbackMessage);
}

export function useReviewReports({
  authContext,
  onClearReactionAfterReport,
  reviewIds,
  userId,
}: UseReviewReportsOptions): UseReviewReportsReturn {
  const [reportedReviewIds, setReportedReviewIds] = useState<Record<string, boolean>>({});
  const [reportForm, setReportForm] = useState<ReviewReportFormState | null>(null);
  const [reportPendingIds, setReportPendingIds] = useState<readonly string[]>([]);

  const normalizedReviewIds = useMemo(() => normalizeReviewIds(reviewIds), [reviewIds]);
  const reviewIdsDependencyKey = normalizedReviewIds.join('|');

  useEffect(() => {
    if (!authContext) {
      setReportedReviewIds({});
      setReportForm(null);
      setReportPendingIds([]);
      return undefined;
    }

    if (normalizedReviewIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    getMyReviewReports(normalizedReviewIds, authContext)
      .then((reports) => {
        if (!isMounted) {
          return;
        }

        setReportedReviewIds((currentReports) => markReportsByReviewId(currentReports, reports));
      })
      .catch(() => {
      });

    return () => {
      isMounted = false;
    };
  }, [authContext?.accessToken, authContext?.userId, reviewIdsDependencyKey]);

  const hasReported = (reviewId: string) => Boolean(reportedReviewIds[reviewId]);

  const openReportForm = (review: Pick<MotorcycleReview, 'id' | 'userId'>): OpenReportFormResult => {
    if (!authContext) {
      return { ok: false, reason: 'unauthenticated' };
    }

    if (isOwnReview(review, userId)) {
      return { ok: false, reason: 'own_review' };
    }

    if (hasReported(review.id)) {
      return { ok: false, reason: 'already_reported' };
    }

    setReportForm({
      comment: '',
      isSubmitting: false,
      reason: 'spam',
      reviewId: review.id,
    });

    return { ok: true };
  };

  const cancelReportForm = () => {
    setReportForm(null);
  };

  const updateReportReason = (reason: ReviewReportReason) => {
    setReportForm((currentForm) => (currentForm ? { ...currentForm, reason } : currentForm));
  };

  const updateReportComment = (comment: string) => {
    setReportForm((currentForm) => (currentForm ? { ...currentForm, comment } : currentForm));
  };

  const submitReport = async (review: Pick<MotorcycleReview, 'id' | 'userId'>): Promise<SubmitReportResult> => {
    if (!authContext) {
      return { outcome: 'blocked', reason: 'unauthenticated' };
    }

    if (isOwnReview(review, userId)) {
      return { outcome: 'blocked', reason: 'own_review' };
    }

    if (hasReported(review.id)) {
      return { outcome: 'blocked', reason: 'already_reported' };
    }

    if (!reportForm || reportForm.reviewId !== review.id) {
      return { outcome: 'error', error: new Error('No hay formulario de reporte abierto para esta review.') };
    }

    setReportForm((currentForm) => (
      currentForm && currentForm.reviewId === review.id
        ? { ...currentForm, isSubmitting: true }
        : currentForm
    ));
    setReportPendingIds((currentIds) => [...new Set([...currentIds, review.id])]);

    const runCleanup = async () => {
      if (!onClearReactionAfterReport) {
        return undefined;
      }

      try {
        await onClearReactionAfterReport({ authContext, reviewId: review.id });
        return undefined;
      } catch (cleanupError) {
        return cleanupError;
      }
    };

    try {
      await createReviewReport(
        {
          comment: reportForm.comment,
          reason: reportForm.reason,
          reviewId: review.id,
        },
        authContext,
      );

      const cleanupError = await runCleanup();
      setReportedReviewIds((currentReports) => ({ ...currentReports, [review.id]: true }));
      setReportForm(null);

      return cleanupError
        ? { cleanupError, outcome: 'success', reviewId: review.id }
        : { outcome: 'success', reviewId: review.id };
    } catch (error) {
      if (isDuplicateReviewReportError(error)) {
        const cleanupError = await runCleanup();
        setReportedReviewIds((currentReports) => ({ ...currentReports, [review.id]: true }));
        setReportForm(null);

        const duplicateMessage = asError(error, 'Ya has reportado esta review.').message;

        return cleanupError
          ? { cleanupError, message: duplicateMessage, outcome: 'duplicate', reviewId: review.id }
          : { message: duplicateMessage, outcome: 'duplicate', reviewId: review.id };
      }

      setReportForm((currentForm) => (
        currentForm && currentForm.reviewId === review.id
          ? { ...currentForm, isSubmitting: false }
          : currentForm
      ));

      return { outcome: 'error', error };
    } finally {
      setReportPendingIds((currentIds) => currentIds.filter((id) => id !== review.id));
    }
  };

  return {
    reportedReviewIds,
    reportForm,
    reportPendingIds,
    hasReported,
    openReportForm,
    cancelReportForm,
    updateReportReason,
    updateReportComment,
    submitReport,
  };
}
