import { useRef, useState } from 'react';
import type { CreateReviewAuthContext, MotorcycleReview } from '../../services/motorcycleReviewService';
import {
  toggleHelpfulReaction,
  toggleNotHelpfulReaction,
  type ReviewReactionSummary,
} from '../../services/reviewReactionService';
import { isOwnReview } from './reviewCommunityActions';

export type ReactionBlockReason = 'unauthenticated' | 'own_review' | 'reported' | 'pending';

export type ToggleReactionResult =
  | { outcome: 'success'; summary: ReviewReactionSummary }
  | { outcome: 'blocked'; reason: ReactionBlockReason }
  | { outcome: 'error'; error: unknown };

export type UseReviewReactionsOptions = Readonly<{
  authContext: CreateReviewAuthContext | null;
  userId: string | null | undefined;
  isReported: (reviewId: string) => boolean;
}>;

export type UseReviewReactionsReturn = Readonly<{
  reactionPendingIds: readonly string[];
  isReactionPending: (reviewId: string) => boolean;
  toggleHelpful: (review: Pick<MotorcycleReview, 'id' | 'userId'>) => Promise<ToggleReactionResult>;
  toggleNotHelpful: (review: Pick<MotorcycleReview, 'id' | 'userId'>) => Promise<ToggleReactionResult>;
}>;

type ToggleReactionService = (
  reviewId: string,
  authContext: CreateReviewAuthContext,
) => Promise<ReviewReactionSummary>;

function addPendingId(currentIds: readonly string[], reviewId: string) {
  return currentIds.includes(reviewId) ? currentIds : [...currentIds, reviewId];
}

function removePendingId(currentIds: readonly string[], reviewId: string) {
  return currentIds.filter((id) => id !== reviewId);
}

export function useReviewReactions({
  authContext,
  isReported,
  userId,
}: UseReviewReactionsOptions): UseReviewReactionsReturn {
  const [reactionPendingIds, setReactionPendingIds] = useState<readonly string[]>([]);
  const reactionPendingIdsRef = useRef<readonly string[]>([]);

  const isReactionPending = (reviewId: string) => reactionPendingIdsRef.current.includes(reviewId);

  const toggleReaction = async (
    review: Pick<MotorcycleReview, 'id' | 'userId'>,
    service: ToggleReactionService,
  ): Promise<ToggleReactionResult> => {
    if (!authContext) {
      return { outcome: 'blocked', reason: 'unauthenticated' };
    }

    if (isOwnReview(review, userId)) {
      return { outcome: 'blocked', reason: 'own_review' };
    }

    if (isReported(review.id)) {
      return { outcome: 'blocked', reason: 'reported' };
    }

    if (isReactionPending(review.id)) {
      return { outcome: 'blocked', reason: 'pending' };
    }

    setReactionPendingIds((currentIds) => {
      const nextIds = addPendingId(currentIds, review.id);
      reactionPendingIdsRef.current = nextIds;
      return nextIds;
    });

    try {
      const summary = await service(review.id, authContext);
      return { outcome: 'success', summary };
    } catch (error) {
      return { outcome: 'error', error };
    } finally {
      setReactionPendingIds((currentIds) => {
        const nextIds = removePendingId(currentIds, review.id);
        reactionPendingIdsRef.current = nextIds;
        return nextIds;
      });
    }
  };

  const toggleHelpful = (review: Pick<MotorcycleReview, 'id' | 'userId'>) => (
    toggleReaction(review, toggleHelpfulReaction)
  );

  const toggleNotHelpful = (review: Pick<MotorcycleReview, 'id' | 'userId'>) => (
    toggleReaction(review, toggleNotHelpfulReaction)
  );

  return {
    reactionPendingIds,
    isReactionPending,
    toggleHelpful,
    toggleNotHelpful,
  };
}
