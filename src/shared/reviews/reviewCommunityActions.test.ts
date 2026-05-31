import { describe, expect, it } from 'vitest';
import type { ReviewReactionSummary } from '../../services/reviewReactionService';
import {
  buildReviewAuthContext,
  isDuplicateReviewReportError,
  isOwnReview,
  markReportsByReviewId,
  upsertReactionSummaryById,
  upsertReactionSummaryInList,
} from './reviewCommunityActions';

function createSummary(overrides: Partial<ReviewReactionSummary> = {}): ReviewReactionSummary {
  return {
    helpfulCount: 0,
    hasReactedHelpful: false,
    hasReactedNotHelpful: false,
    reviewId: 'review-1',
    ...overrides,
  };
}

describe('reviewCommunityActions', () => {
  describe('buildReviewAuthContext', () => {
    it('devuelve auth context cuando hay sesión válida', () => {
      expect(buildReviewAuthContext({
        accessToken: 'token-1',
        isAuthenticated: true,
        userId: 'user-1',
      })).toEqual({ accessToken: 'token-1', userId: 'user-1' });
    });

    it('devuelve null sin auth o campos incompletos', () => {
      expect(buildReviewAuthContext({ accessToken: 'token-1', isAuthenticated: false, userId: 'user-1' })).toBeNull();
      expect(buildReviewAuthContext({ accessToken: null, isAuthenticated: true, userId: 'user-1' })).toBeNull();
      expect(buildReviewAuthContext({ accessToken: 'token-1', isAuthenticated: true, userId: null })).toBeNull();
    });
  });

  describe('isOwnReview', () => {
    it('detecta ownership por igualdad estricta', () => {
      expect(isOwnReview({ userId: 'user-1' } as const, 'user-1')).toBe(true);
      expect(isOwnReview({ userId: 'user-1' } as const, 'user-2')).toBe(false);
    });

    it('devuelve false con review.userId o userId nulos', () => {
      expect(isOwnReview({ userId: null } as const, 'user-1')).toBe(false);
      expect(isOwnReview({ userId: 'user-1' } as const, null)).toBe(false);
      expect(isOwnReview({ userId: null } as const, null)).toBe(false);
    });
  });

  describe('isDuplicateReviewReportError', () => {
    it('detecta el mensaje de duplicado con Error', () => {
      expect(isDuplicateReviewReportError(new Error('Ya has reportado esta review.'))).toBe(true);
    });

    it('detecta el mensaje de duplicado con objeto error-like y string', () => {
      expect(isDuplicateReviewReportError({ message: 'Ya has reportado esta review.' })).toBe(true);
      expect(isDuplicateReviewReportError('Ya has reportado esta review.')).toBe(true);
    });

    it('devuelve false para otros errores', () => {
      expect(isDuplicateReviewReportError(new Error('Otro error'))).toBe(false);
      expect(isDuplicateReviewReportError({ message: 'Otro error' })).toBe(false);
      expect(isDuplicateReviewReportError(undefined)).toBe(false);
    });
  });

  describe('markReportsByReviewId', () => {
    it('marca reviews reportadas preservando flags existentes', () => {
      const result = markReportsByReviewId(
        { 'review-previa': true, 'review-libre': false },
        [{ reviewId: 'review-1' }, { reviewId: 'review-2' }],
      );

      expect(result).toEqual({
        'review-previa': true,
        'review-libre': false,
        'review-1': true,
        'review-2': true,
      });
    });
  });

  describe('upsertReactionSummaryInList', () => {
    it('inserta summary nueva al final', () => {
      const base = [createSummary({ reviewId: 'review-1' })];
      const next = createSummary({ helpfulCount: 2, reviewId: 'review-2' });

      expect(upsertReactionSummaryInList(base, next)).toEqual([
        createSummary({ reviewId: 'review-1' }),
        createSummary({ helpfulCount: 2, reviewId: 'review-2' }),
      ]);
    });

    it('reemplaza una summary existente y la deja al final', () => {
      const base = [
        createSummary({ reviewId: 'review-1' }),
        createSummary({ helpfulCount: 1, reviewId: 'review-2' }),
      ];
      const updated = createSummary({ helpfulCount: 3, reviewId: 'review-1' });

      expect(upsertReactionSummaryInList(base, updated)).toEqual([
        createSummary({ helpfulCount: 1, reviewId: 'review-2' }),
        createSummary({ helpfulCount: 3, reviewId: 'review-1' }),
      ]);
    });
  });

  describe('upsertReactionSummaryById', () => {
    it('inserta o actualiza summary por reviewId', () => {
      const base = {
        'review-1': createSummary({ reviewId: 'review-1' }),
      };
      const updated = createSummary({ helpfulCount: 5, reviewId: 'review-1' });

      expect(upsertReactionSummaryById(base, updated)).toEqual({
        'review-1': createSummary({ helpfulCount: 5, reviewId: 'review-1' }),
      });

      expect(upsertReactionSummaryById(base, createSummary({ reviewId: 'review-2' }))).toEqual({
        'review-1': createSummary({ reviewId: 'review-1' }),
        'review-2': createSummary({ reviewId: 'review-2' }),
      });
    });
  });
});
