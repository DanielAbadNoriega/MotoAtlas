import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReviewReport, getMyReviewReports, type ReviewReport } from '../../services/reviewReportService';
import type { CreateReviewAuthContext } from '../../services/motorcycleReviewService';
import { useReviewReports, type UseReviewReportsOptions } from './useReviewReports';

vi.mock('../../services/reviewReportService', () => ({
  createReviewReport: vi.fn(),
  getMyReviewReports: vi.fn(),
}));

const createReviewReportMock = vi.mocked(createReviewReport);
const getMyReviewReportsMock = vi.mocked(getMyReviewReports);

const authContext: CreateReviewAuthContext = {
  accessToken: 'session-token',
  userId: 'user-1',
};

function createReport(reviewId: string, userId = 'user-1'): ReviewReport {
  return {
    comment: null,
    reason: 'spam',
    reviewId,
    status: 'pending',
    userId,
  };
}

function setupHook(overrides: Partial<UseReviewReportsOptions> = {}) {
  const initialProps: UseReviewReportsOptions = {
    reviewIds: ['review-1'],
    authContext,
    userId: 'user-1',
    ...overrides,
  };

  return renderHook((props: UseReviewReportsOptions) => useReviewReports(props), { initialProps });
}

describe('useReviewReports', () => {
  beforeEach(() => {
    createReviewReportMock.mockReset();
    getMyReviewReportsMock.mockReset();
    getMyReviewReportsMock.mockResolvedValue([]);
    createReviewReportMock.mockResolvedValue(createReport('review-1'));
  });

  it('no llama getMyReviewReports sin auth', async () => {
    setupHook({
      authContext: null,
      reviewIds: ['review-1', 'review-2'],
      userId: null,
    });

    await waitFor(() => expect(getMyReviewReportsMock).not.toHaveBeenCalled());
  });

  it('hidrata reportes con auth + ids normalizados', async () => {
    getMyReviewReportsMock.mockResolvedValue([createReport('review-1')]);

    const { result } = setupHook({
      reviewIds: [' review-1 ', 'review-1', 'review-2'],
      userId: 'user-9',
    });

    await waitFor(() => {
      expect(getMyReviewReportsMock).toHaveBeenCalledWith(
        ['review-1', 'review-2'],
        authContext,
      );
    });
    await waitFor(() => expect(result.current.hasReported('review-1')).toBe(true));
    expect(result.current.hasReported('review-2')).toBe(false);
  });

  it('mergea reportes previos sin mutar estado anterior', async () => {
    getMyReviewReportsMock
      .mockResolvedValueOnce([createReport('review-1')])
      .mockResolvedValueOnce([createReport('review-2')]);

    const { result, rerender } = setupHook({
      reviewIds: ['review-1'],
      userId: 'user-9',
    });

    await waitFor(() => expect(result.current.reportedReviewIds).toEqual({ 'review-1': true }));
    const previousSnapshot = result.current.reportedReviewIds;

    rerender({
      reviewIds: ['review-2'],
      authContext,
      userId: 'user-9',
    });

    await waitFor(() => expect(result.current.reportedReviewIds).toEqual({
      'review-1': true,
      'review-2': true,
    }));
    expect(previousSnapshot).toEqual({ 'review-1': true });
    expect(previousSnapshot).not.toHaveProperty('review-2');
  });

  it('evita recargas innecesarias si ids normalizados no cambian', async () => {
    const { rerender } = setupHook({
      reviewIds: ['review-1', 'review-1'],
      userId: 'user-9',
    });

    await waitFor(() => expect(getMyReviewReportsMock).toHaveBeenCalledTimes(1));

    rerender({
      reviewIds: [' review-1 '],
      authContext,
      userId: 'user-9',
    });

    await waitFor(() => expect(getMyReviewReportsMock).toHaveBeenCalledTimes(1));
  });

  it('openReportForm bloquea no-auth', async () => {
    const { result } = setupHook({
      authContext: null,
      userId: null,
    });

    let openResult: ReturnType<typeof result.current.openReportForm> | null = null;
    act(() => {
      openResult = result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
    });

    expect(openResult).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(result.current.reportForm).toBeNull();
  });

  it('openReportForm bloquea own review', async () => {
    const { result } = setupHook({ userId: 'user-1' });

    let openResult: ReturnType<typeof result.current.openReportForm> | null = null;
    act(() => {
      openResult = result.current.openReportForm({ id: 'review-1', userId: 'user-1' });
    });

    expect(openResult).toEqual({ ok: false, reason: 'own_review' });
    expect(result.current.reportForm).toBeNull();
  });

  it('openReportForm bloquea already_reported', async () => {
    getMyReviewReportsMock.mockResolvedValue([createReport('review-1')]);
    const { result } = setupHook({ userId: 'user-9' });

    await waitFor(() => expect(result.current.hasReported('review-1')).toBe(true));

    let openResult: ReturnType<typeof result.current.openReportForm> | null = null;
    act(() => {
      openResult = result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
    });

    expect(openResult).toEqual({ ok: false, reason: 'already_reported' });
    expect(result.current.reportForm).toBeNull();
  });

  it('openReportForm abre form en review ajena con auth', async () => {
    const { result } = setupHook({ userId: 'user-9' });

    let openResult: ReturnType<typeof result.current.openReportForm> | null = null;
    act(() => {
      openResult = result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
    });

    expect(openResult).toEqual({ ok: true });
    expect(result.current.reportForm).toEqual({
      comment: '',
      isSubmitting: false,
      reason: 'spam',
      reviewId: 'review-1',
    });
  });

  it('updateReportReason actualiza reason', async () => {
    const { result } = setupHook({ userId: 'user-9' });
    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
      result.current.updateReportReason('harassment');
    });

    expect(result.current.reportForm?.reason).toBe('harassment');
  });

  it('updateReportComment actualiza comment', async () => {
    const { result } = setupHook({ userId: 'user-9' });
    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
      result.current.updateReportComment('Contexto extra');
    });

    expect(result.current.reportForm?.comment).toBe('Contexto extra');
  });

  it('cancelReportForm cierra form', async () => {
    const { result } = setupHook({ userId: 'user-9' });
    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
      result.current.cancelReportForm();
    });

    expect(result.current.reportForm).toBeNull();
  });

  it('submitReport devuelve blocked sin auth y no llama servicio ni cleanup', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const { result } = setupHook({
      authContext: null,
      userId: null,
      onClearReactionAfterReport: cleanup,
    });

    let submitResult: Awaited<ReturnType<typeof result.current.submitReport>> | undefined;
    await act(async () => {
      submitResult = await result.current.submitReport({ id: 'review-1', userId: 'other-user' });
    });

    expect(submitResult).toEqual({ outcome: 'blocked', reason: 'unauthenticated' });
    expect(createReviewReportMock).not.toHaveBeenCalled();
    expect(cleanup).not.toHaveBeenCalled();
    expect(result.current.reportPendingIds).toEqual([]);
    expect(result.current.reportForm).toBeNull();
    expect(result.current.hasReported('review-1')).toBe(false);
  });

  it('submitReport success: reporta, cierra form, limpia reacción y devuelve success', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const { result } = setupHook({
      userId: 'user-9',
      onClearReactionAfterReport: cleanup,
    });

    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
      result.current.updateReportReason('false_information');
      result.current.updateReportComment('Datos incorrectos');
    });

    let submitResult: Awaited<ReturnType<typeof result.current.submitReport>> | undefined;
    await act(async () => {
      submitResult = await result.current.submitReport({ id: 'review-1', userId: 'other-user' });
    });

    expect(createReviewReportMock).toHaveBeenCalledWith(
      { comment: 'Datos incorrectos', reason: 'false_information', reviewId: 'review-1' },
      authContext,
    );
    expect(cleanup).toHaveBeenCalledWith({
      authContext,
      reviewId: 'review-1',
    });
    expect(submitResult).toEqual({ outcome: 'success', reviewId: 'review-1' });
    expect(result.current.reportForm).toBeNull();
    expect(result.current.hasReported('review-1')).toBe(true);
  });

  it('submitReport duplicate: marca reportada, cierra form, limpia reacción y devuelve duplicate', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    createReviewReportMock.mockRejectedValue(new Error('Ya has reportado esta review.'));
    const { result } = setupHook({
      userId: 'user-9',
      onClearReactionAfterReport: cleanup,
    });

    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
    });

    let submitResult: Awaited<ReturnType<typeof result.current.submitReport>> | undefined;
    await act(async () => {
      submitResult = await result.current.submitReport({ id: 'review-1', userId: 'other-user' });
    });

    expect(cleanup).toHaveBeenCalledWith({
      authContext,
      reviewId: 'review-1',
    });
    expect(submitResult).toEqual({
      outcome: 'duplicate',
      reviewId: 'review-1',
      message: 'Ya has reportado esta review.',
    });
    expect(result.current.reportForm).toBeNull();
    expect(result.current.hasReported('review-1')).toBe(true);
  });

  it('submitReport error no duplicado: devuelve error, no marca reportada y mantiene form abierta', async () => {
    const failure = new Error('No se pudo enviar');
    createReviewReportMock.mockRejectedValue(failure);
    const { result } = setupHook({ userId: 'user-9' });

    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
    });

    let submitResult: Awaited<ReturnType<typeof result.current.submitReport>> | undefined;
    await act(async () => {
      submitResult = await result.current.submitReport({ id: 'review-1', userId: 'other-user' });
    });

    expect(submitResult).toEqual({ outcome: 'error', error: failure });
    expect(result.current.hasReported('review-1')).toBe(false);
    expect(result.current.reportForm).toEqual({
      comment: '',
      isSubmitting: false,
      reason: 'spam',
      reviewId: 'review-1',
    });
  });

  it('submitReport con error no duplicado y cleanup callback presente no llama cleanup', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const failure = new Error('No se pudo enviar');
    createReviewReportMock.mockRejectedValue(failure);
    const { result } = setupHook({
      userId: 'user-9',
      onClearReactionAfterReport: cleanup,
    });

    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
      result.current.updateReportComment('Contexto');
    });

    let submitResult: Awaited<ReturnType<typeof result.current.submitReport>> | undefined;
    await act(async () => {
      submitResult = await result.current.submitReport({ id: 'review-1', userId: 'other-user' });
    });

    expect(submitResult).toEqual({ outcome: 'error', error: failure });
    expect(cleanup).not.toHaveBeenCalled();
    expect(result.current.hasReported('review-1')).toBe(false);
    expect(result.current.reportForm).toEqual({
      comment: 'Contexto',
      isSubmitting: false,
      reason: 'spam',
      reviewId: 'review-1',
    });
  });

  it('cleanup failure no rompe success y devuelve cleanupError', async () => {
    const cleanupFailure = new Error('cleanup failed');
    const cleanup = vi.fn().mockRejectedValue(cleanupFailure);
    const { result } = setupHook({
      userId: 'user-9',
      onClearReactionAfterReport: cleanup,
    });

    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
    });

    let submitResult: Awaited<ReturnType<typeof result.current.submitReport>> | undefined;
    await act(async () => {
      submitResult = await result.current.submitReport({ id: 'review-1', userId: 'other-user' });
    });

    expect(submitResult).toEqual({
      outcome: 'success',
      reviewId: 'review-1',
      cleanupError: cleanupFailure,
    });
    expect(result.current.hasReported('review-1')).toBe(true);
    expect(result.current.reportForm).toBeNull();
  });

  it('reportPendingIds entra y sale alrededor de submitReport', async () => {
    let resolveCreateReport: ((value: ReviewReport) => void) | null = null;
    createReviewReportMock.mockImplementation(
      () => new Promise((resolve) => {
        resolveCreateReport = resolve;
      }),
    );
    const { result } = setupHook({ userId: 'user-9' });

    act(() => {
      result.current.openReportForm({ id: 'review-1', userId: 'other-user' });
    });

    let submitPromise: Promise<Awaited<ReturnType<typeof result.current.submitReport>>> | null = null;
    act(() => {
      submitPromise = result.current.submitReport({ id: 'review-1', userId: 'other-user' });
    });

    await waitFor(() => expect(result.current.reportPendingIds).toContain('review-1'));
    expect(submitPromise).not.toBeNull();

    await act(async () => {
      resolveCreateReport?.(createReport('review-1'));
      await submitPromise!;
    });

    await waitFor(() => expect(result.current.reportPendingIds).toEqual([]));
  });
});
