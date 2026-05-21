import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReviewReport, getMyReviewReports } from './reviewReportService';

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

function emptyOkResponse(status = 201) {
  return { ok: true, status, text: () => Promise.resolve('') };
}

describe('reviewReportService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('crea reporte con bearer token, user_id propio y status pending', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(emptyOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    const report = await createReviewReport(
      { comment: '  contexto extra  ', reason: 'false_information', reviewId: ' review-1 ' },
      { accessToken: 'session-token', userId: 'user-1' },
    );
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(url).toBe('https://example.supabase.co/rest/v1/review_reports');
    expect(requestInit).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        comment: 'contexto extra',
        reason: 'false_information',
        review_id: 'review-1',
        status: 'pending',
        user_id: 'user-1',
      }),
    });
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      Prefer: 'return=minimal',
      apikey: 'anon-key',
    });
    expect(report).toEqual({
      comment: 'contexto extra',
      reason: 'false_information',
      reviewId: 'review-1',
      status: 'pending',
      userId: 'user-1',
    });
  });

  it('normaliza comentario vacío a null', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(emptyOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    await createReviewReport(
      { comment: '   ', reason: 'spam', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    );

    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({
      comment: null,
      reason: 'spam',
      review_id: 'review-1',
      status: 'pending',
      user_id: 'user-1',
    }));
  });

  it('no crea reporte sin userId/accessToken', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReviewReport(
      { reason: 'spam', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: '   ' },
    )).rejects.toThrow('userId y accessToken son obligatorios para reportar reviews');
    await expect(createReviewReport(
      { reason: 'spam', reviewId: 'review-1' },
      { accessToken: '', userId: 'user-1' },
    )).rejects.toThrow('userId y accessToken son obligatorios para reportar reviews');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('valida reviewId y motivo antes de llamar a Supabase', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReviewReport(
      { reason: 'spam', reviewId: '   ' },
      { accessToken: 'session-token', userId: 'user-1' },
    )).rejects.toThrow('reviewId es obligatorio para reportar reviews');
    await expect(createReviewReport(
      { reason: 'invalid' as never, reviewId: 'review-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    )).rejects.toThrow('Motivo de reporte inválido');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maneja duplicados con mensaje controlado', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: () => Promise.resolve('duplicate key value violates unique constraint "review_reports_review_id_user_id_key"'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReviewReport(
      { reason: 'harassment', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    )).rejects.toThrow('Ya has reportado esta review.');
  });

  it('devuelve reportes propios por reviewId', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      {
        comment: null,
        created_at: '2026-05-21T10:00:00.000Z',
        id: 'report-1',
        reason: 'offensive',
        review_id: 'review-1',
        status: 'pending',
        updated_at: '2026-05-21T10:00:00.000Z',
        user_id: 'user-1',
      },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const reports = await getMyReviewReports(['review-1', 'review-2', 'review-1'], {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(reports).toEqual([
      {
        comment: null,
        createdAt: '2026-05-21T10:00:00.000Z',
        id: 'report-1',
        reason: 'offensive',
        reviewId: 'review-1',
        status: 'pending',
        updatedAt: '2026-05-21T10:00:00.000Z',
        userId: 'user-1',
      },
    ]);
    expect(decodeURIComponent(String(url))).toContain('/rest/v1/review_reports?');
    expect(decodeURIComponent(String(url))).toContain('review_id=in.(review-1,review-2)');
    expect(decodeURIComponent(String(url))).toContain('user_id=eq.user-1');
    expect(decodeURIComponent(String(url))).toContain('select=id,review_id,user_id,reason,comment,status,created_at,updated_at');
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      apikey: 'anon-key',
    });
  });

  it('no consulta Supabase si no hay reviewIds al leer reportes propios', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMyReviewReports([], { accessToken: 'session-token', userId: 'user-1' })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maneja errores de Supabase', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('permission denied'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMyReviewReports(['review-1'], { accessToken: 'session-token', userId: 'user-1' })).rejects.toThrow(
      'Supabase review_reports request failed (403): permission denied',
    );
  });
});
