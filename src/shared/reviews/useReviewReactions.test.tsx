import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  toggleHelpfulReaction,
  toggleNotHelpfulReaction,
  type ReviewReactionSummary,
} from '../../services/reviewReactionService';
import type { CreateReviewAuthContext } from '../../services/motorcycleReviewService';
import { useReviewReactions, type UseReviewReactionsOptions } from './useReviewReactions';

vi.mock('../../services/reviewReactionService', () => ({
  toggleHelpfulReaction: vi.fn(),
  toggleNotHelpfulReaction: vi.fn(),
}));

const toggleHelpfulReactionMock = vi.mocked(toggleHelpfulReaction);
const toggleNotHelpfulReactionMock = vi.mocked(toggleNotHelpfulReaction);

const authContext: CreateReviewAuthContext = {
  accessToken: 'session-token',
  userId: 'user-1',
};

function createSummary(
  reviewId: string,
  helpfulCount = 2,
  hasReactedHelpful = false,
  hasReactedNotHelpful = false,
): ReviewReactionSummary {
  return {
    helpfulCount,
    hasReactedHelpful,
    hasReactedNotHelpful,
    reviewId,
  };
}

function setupHook(overrides: Partial<UseReviewReactionsOptions> = {}) {
  const initialProps: UseReviewReactionsOptions = {
    authContext,
    isReported: () => false,
    userId: 'user-1',
    ...overrides,
  };

  return renderHook((props: UseReviewReactionsOptions) => useReviewReactions(props), { initialProps });
}

describe('useReviewReactions', () => {
  beforeEach(() => {
    toggleHelpfulReactionMock.mockReset();
    toggleNotHelpfulReactionMock.mockReset();
    toggleHelpfulReactionMock.mockResolvedValue(createSummary('review-1'));
    toggleNotHelpfulReactionMock.mockResolvedValue(createSummary('review-1'));
  });

  it('devuelve blocked unauthenticated sin llamar servicios', async () => {
    const { result } = setupHook({
      authContext: null,
      userId: null,
    });

    let toggleResult: Awaited<ReturnType<typeof result.current.toggleHelpful>> | undefined;
    await act(async () => {
      toggleResult = await result.current.toggleHelpful({ id: 'review-1', userId: 'other-user' });
    });

    expect(toggleResult).toEqual({ outcome: 'blocked', reason: 'unauthenticated' });
    expect(toggleHelpfulReactionMock).not.toHaveBeenCalled();
    expect(toggleNotHelpfulReactionMock).not.toHaveBeenCalled();
    expect(result.current.reactionPendingIds).toEqual([]);
    expect(result.current.isReactionPending('review-1')).toBe(false);
  });

  it('devuelve blocked own_review sin llamar servicios', async () => {
    const { result } = setupHook({ userId: 'user-1' });

    let toggleResult: Awaited<ReturnType<typeof result.current.toggleHelpful>> | undefined;
    await act(async () => {
      toggleResult = await result.current.toggleHelpful({ id: 'review-1', userId: 'user-1' });
    });

    expect(toggleResult).toEqual({ outcome: 'blocked', reason: 'own_review' });
    expect(toggleHelpfulReactionMock).not.toHaveBeenCalled();
    expect(result.current.reactionPendingIds).toEqual([]);
  });

  it('devuelve blocked reported sin llamar servicios', async () => {
    const { result } = setupHook({
      isReported: (reviewId) => reviewId === 'review-1',
      userId: 'user-9',
    });

    let toggleResult: Awaited<ReturnType<typeof result.current.toggleNotHelpful>> | undefined;
    await act(async () => {
      toggleResult = await result.current.toggleNotHelpful({ id: 'review-1', userId: 'other-user' });
    });

    expect(toggleResult).toEqual({ outcome: 'blocked', reason: 'reported' });
    expect(toggleNotHelpfulReactionMock).not.toHaveBeenCalled();
    expect(result.current.reactionPendingIds).toEqual([]);
  });

  it('devuelve blocked pending y no dispara doble request al mismo reviewId', async () => {
    let resolveToggle: ((summary: ReviewReactionSummary) => void) | null = null;
    toggleHelpfulReactionMock.mockImplementation(() => new Promise((resolve) => {
      resolveToggle = resolve;
    }));
    const { result } = setupHook({ userId: 'user-9' });

    let firstTogglePromise: Promise<Awaited<ReturnType<typeof result.current.toggleHelpful>>> | null = null;
    act(() => {
      firstTogglePromise = result.current.toggleHelpful({ id: 'review-1', userId: 'other-user' });
    });

    await waitFor(() => expect(result.current.reactionPendingIds).toContain('review-1'));

    let secondToggleResult: Awaited<ReturnType<typeof result.current.toggleHelpful>> | undefined;
    await act(async () => {
      secondToggleResult = await result.current.toggleHelpful({ id: 'review-1', userId: 'other-user' });
    });

    expect(secondToggleResult).toEqual({ outcome: 'blocked', reason: 'pending' });
    expect(toggleHelpfulReactionMock).toHaveBeenCalledTimes(1);

    let firstToggleResult: Awaited<ReturnType<typeof result.current.toggleHelpful>> | undefined;
    await act(async () => {
      resolveToggle?.(createSummary('review-1', 3, true, false));
      firstToggleResult = await firstTogglePromise!;
    });

    expect(firstToggleResult).toEqual({
      outcome: 'success',
      summary: createSummary('review-1', 3, true, false),
    });
    await waitFor(() => expect(result.current.reactionPendingIds).toEqual([]));
    expect(result.current.isReactionPending('review-1')).toBe(false);
  });

  it('toggleHelpful success: llama servicio, devuelve summary y pending entra/sale', async () => {
    let resolveToggle: ((summary: ReviewReactionSummary) => void) | null = null;
    toggleHelpfulReactionMock.mockImplementation(() => new Promise((resolve) => {
      resolveToggle = resolve;
    }));
    const { result } = setupHook({ userId: 'user-9' });

    let togglePromise: Promise<Awaited<ReturnType<typeof result.current.toggleHelpful>>> | null = null;
    act(() => {
      togglePromise = result.current.toggleHelpful({ id: 'review-1', userId: 'other-user' });
    });

    await waitFor(() => expect(result.current.isReactionPending('review-1')).toBe(true));
    expect(result.current.reactionPendingIds).toContain('review-1');
    expect(toggleHelpfulReactionMock).toHaveBeenCalledWith('review-1', authContext);

    let toggleResult: Awaited<ReturnType<typeof result.current.toggleHelpful>> | undefined;
    const summary = createSummary('review-1', 6, true, false);
    await act(async () => {
      resolveToggle?.(summary);
      toggleResult = await togglePromise!;
    });

    expect(toggleResult).toEqual({ outcome: 'success', summary });
    await waitFor(() => expect(result.current.isReactionPending('review-1')).toBe(false));
    expect(result.current.reactionPendingIds).toEqual([]);
  });

  it('toggleNotHelpful success: llama servicio, devuelve summary y pending entra/sale', async () => {
    let resolveToggle: ((summary: ReviewReactionSummary) => void) | null = null;
    toggleNotHelpfulReactionMock.mockImplementation(() => new Promise((resolve) => {
      resolveToggle = resolve;
    }));
    const { result } = setupHook({ userId: 'user-9' });

    let togglePromise: Promise<Awaited<ReturnType<typeof result.current.toggleNotHelpful>>> | null = null;
    act(() => {
      togglePromise = result.current.toggleNotHelpful({ id: 'review-1', userId: 'other-user' });
    });

    await waitFor(() => expect(result.current.isReactionPending('review-1')).toBe(true));
    expect(result.current.reactionPendingIds).toContain('review-1');
    expect(toggleNotHelpfulReactionMock).toHaveBeenCalledWith('review-1', authContext);

    let toggleResult: Awaited<ReturnType<typeof result.current.toggleNotHelpful>> | undefined;
    const summary = createSummary('review-1', 1, false, true);
    await act(async () => {
      resolveToggle?.(summary);
      toggleResult = await togglePromise!;
    });

    expect(toggleResult).toEqual({ outcome: 'success', summary });
    await waitFor(() => expect(result.current.isReactionPending('review-1')).toBe(false));
    expect(result.current.reactionPendingIds).toEqual([]);
  });

  it('toggleHelpful error: devuelve error y pending sale', async () => {
    let rejectToggle: ((error: unknown) => void) | null = null;
    const failure = new Error('No se pudo marcar útil');
    toggleHelpfulReactionMock.mockImplementation(() => new Promise((_, reject) => {
      rejectToggle = reject;
    }));
    const { result } = setupHook({ userId: 'user-9' });

    let togglePromise: Promise<Awaited<ReturnType<typeof result.current.toggleHelpful>>> | null = null;
    act(() => {
      togglePromise = result.current.toggleHelpful({ id: 'review-1', userId: 'other-user' });
    });

    await waitFor(() => expect(result.current.isReactionPending('review-1')).toBe(true));

    let toggleResult: Awaited<ReturnType<typeof result.current.toggleHelpful>> | undefined;
    await act(async () => {
      rejectToggle?.(failure);
      toggleResult = await togglePromise!;
    });

    expect(toggleResult).toEqual({ outcome: 'error', error: failure });
    await waitFor(() => expect(result.current.reactionPendingIds).toEqual([]));
    expect(result.current.isReactionPending('review-1')).toBe(false);
  });

  it('toggleNotHelpful error: devuelve error y pending sale', async () => {
    let rejectToggle: ((error: unknown) => void) | null = null;
    const failure = new Error('No se pudo marcar no útil');
    toggleNotHelpfulReactionMock.mockImplementation(() => new Promise((_, reject) => {
      rejectToggle = reject;
    }));
    const { result } = setupHook({ userId: 'user-9' });

    let togglePromise: Promise<Awaited<ReturnType<typeof result.current.toggleNotHelpful>>> | null = null;
    act(() => {
      togglePromise = result.current.toggleNotHelpful({ id: 'review-1', userId: 'other-user' });
    });

    await waitFor(() => expect(result.current.isReactionPending('review-1')).toBe(true));

    let toggleResult: Awaited<ReturnType<typeof result.current.toggleNotHelpful>> | undefined;
    await act(async () => {
      rejectToggle?.(failure);
      toggleResult = await togglePromise!;
    });

    expect(toggleResult).toEqual({ outcome: 'error', error: failure });
    await waitFor(() => expect(result.current.reactionPendingIds).toEqual([]));
    expect(result.current.isReactionPending('review-1')).toBe(false);
  });
});
