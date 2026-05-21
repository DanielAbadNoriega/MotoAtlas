import { afterEach, describe, expect, it, vi } from 'vitest';
import { getReviewReports, updateReportedReviewStatus, updateReviewReportStatus } from './adminModerationService';

function stubSupabaseEnv() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
}

function jsonResponse(data: unknown, ok = true, status = 200) {
  return {
    json: () => Promise.resolve(data),
    ok,
    status,
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

function emptyOkResponse(status = 204) {
  return { ok: true, status, text: () => Promise.resolve('') };
}

describe('adminModerationService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('no consulta sin authContext válido', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getReviewReports({ accessToken: '', userId: 'admin-1' })).rejects.toThrow(
      'userId y accessToken son obligatorios para moderación admin',
    );
    await expect(updateReviewReportStatus('report-1', 'reviewed', { accessToken: 'token', userId: ' ' })).rejects.toThrow(
      'userId y accessToken son obligatorios para moderación admin',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('obtiene reportes con bearer token, filtros y orden pending primero', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      {
        id: 'report-reviewed',
        review_id: 'review-2',
        user_id: 'reporter-2',
        reason: 'spam',
        comment: null,
        status: 'reviewed',
        created_at: '2026-05-21T09:00:00.000Z',
        updated_at: '2026-05-21T09:00:00.000Z',
        motorcycle_reviews: {
          id: 'review-2',
          motorcycle_id: 'bike-2',
          user_name: 'Ana',
          rating: 4,
          comment: 'Comentario 2',
          pros: ['motor'],
          cons: [],
          status: 'approved',
          motorcycles: { id: 'bike-2', brand: 'Yamaha', model: 'MT-09', year: 2024, image_url: '/mt.jpg' },
        },
      },
      {
        id: 'report-pending',
        review_id: 'review-1',
        user_id: 'reporter-1',
        reason: 'false_information',
        comment: 'No coincide con ficha.',
        status: 'pending',
        created_at: '2026-05-21T08:00:00.000Z',
        updated_at: '2026-05-21T08:00:00.000Z',
        motorcycle_reviews: {
          id: 'review-1',
          motorcycle_id: 'bike-1',
          user_name: 'Dani',
          rating: 5,
          comment: 'Comentario 1',
          pros: null,
          cons: ['peso'],
          status: 'approved',
          motorcycles: { id: 'bike-1', brand: 'BMW', model: 'F 900 GS', year: 2024, image_url: '/bmw.jpg' },
        },
      },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const reports = await getReviewReports(
      { accessToken: 'session-token', userId: 'admin-1' },
      { reason: 'false_information', sort: 'oldest', status: 'all' },
    );
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(reports.map((report) => report.id)).toEqual(['report-pending', 'report-reviewed']);
    expect(reports[0]).toMatchObject({
      comment: 'No coincide con ficha.',
      reason: 'false_information',
      reporterUserId: 'reporter-1',
      review: {
        comment: 'Comentario 1',
        motorcycle: { brand: 'BMW', model: 'F 900 GS', year: 2024 },
        status: 'approved',
        userName: 'Dani',
      },
      status: 'pending',
    });
    expect(decodeURIComponent(String(url))).toContain('/rest/v1/review_reports?');
    expect(decodeURIComponent(String(url))).toContain('reason=eq.false_information');
    expect(decodeURIComponent(String(url))).not.toContain('status=eq.');
    expect(decodeURIComponent(String(url))).toContain('order=created_at.asc');
    expect(decodeURIComponent(String(url))).toContain('motorcycle_reviews(');
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      apikey: 'anon-key',
    });
  });

  it('filtra por status pending por defecto', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await getReviewReports({ accessToken: 'session-token', userId: 'admin-1' });

    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain('status=eq.pending');
  });

  it('actualiza status de reporte', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(emptyOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    await updateReviewReportStatus(' report-1 ', 'action_taken', {
      accessToken: 'session-token',
      userId: 'admin-1',
    });
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(decodeURIComponent(String(url))).toContain('/rest/v1/review_reports?id=eq.report-1');
    expect(requestInit).toMatchObject({
      body: JSON.stringify({ status: 'action_taken' }),
      method: 'PATCH',
    });
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      Prefer: 'return=minimal',
    });
  });

  it('actualiza status de review reportada', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(emptyOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    await updateReportedReviewStatus(' review-1 ', 'hidden', {
      accessToken: 'session-token',
      userId: 'admin-1',
    });
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(decodeURIComponent(String(url))).toContain('/rest/v1/motorcycle_reviews?id=eq.review-1');
    expect(requestInit).toMatchObject({
      body: JSON.stringify({ status: 'hidden' }),
      method: 'PATCH',
    });
  });

  it('valida estados y maneja errores de Supabase', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('permission denied'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateReviewReportStatus('', 'reviewed', { accessToken: 'token', userId: 'admin-1' })).rejects.toThrow(
      'reportId es obligatorio',
    );
    await expect(updateReviewReportStatus('report-1', 'invalid' as never, { accessToken: 'token', userId: 'admin-1' })).rejects.toThrow(
      'Estado de reporte inválido',
    );
    await expect(updateReportedReviewStatus('review-1', 'pending', { accessToken: 'token', userId: 'admin-1' })).rejects.toThrow(
      'Estado de review inválido',
    );
    await expect(getReviewReports({ accessToken: 'token', userId: 'admin-1' })).rejects.toThrow(
      'Supabase review_reports request failed (403): permission denied',
    );
  });
});
