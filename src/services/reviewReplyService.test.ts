import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReviewReply, getRepliesByReviewId } from './reviewReplyService';

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

describe('reviewReplyService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('crea respuesta con status pending, bearer token y user_id propio', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(emptyOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    const reply = await createReviewReply(
      { comment: '  Gran review!  ', reviewId: ' review-1 ' },
      { accessToken: 'session-token', userId: 'user-1' },
    );
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(url).toBe('https://example.supabase.co/rest/v1/review_replies');
    expect(requestInit).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        review_id: 'review-1',
        user_id: 'user-1',
        comment: 'Gran review!',
        status: 'pending',
      }),
    });
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      Prefer: 'return=minimal',
      apikey: 'anon-key',
    });
    expect(reply).toMatchObject({
      reviewId: 'review-1',
      userId: 'user-1',
      comment: 'Gran review!',
      status: 'pending',
    });
  });

  it('no crea respuesta sin userId/accessToken', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReviewReply(
      { comment: 'texto', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: '   ' },
    )).rejects.toThrow('userId y accessToken son obligatorios para responder reviews');
    await expect(createReviewReply(
      { comment: 'texto', reviewId: 'review-1' },
      { accessToken: '', userId: 'user-1' },
    )).rejects.toThrow('userId y accessToken son obligatorios para responder reviews');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('valida reviewId y comment antes de llamar a Supabase', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReviewReply(
      { comment: 'texto', reviewId: '   ' },
      { accessToken: 'session-token', userId: 'user-1' },
    )).rejects.toThrow('reviewId es obligatorio para responder reviews');
    await expect(createReviewReply(
      { comment: '   ', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    )).rejects.toThrow('comment es obligatorio para responder reviews');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maneja errores de Supabase en createReviewReply', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('permission denied'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReviewReply(
      { comment: 'texto', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    )).rejects.toThrow('Supabase review_replies request failed (403): permission denied');
  });

  it('obtiene respuestas por reviewId sin autenticación', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      {
        id: 'reply-1',
        review_id: 'review-1',
        user_id: 'user-2',
        comment: 'Coincido totalmente',
        status: 'approved',
        created_at: '2026-05-21T10:00:00.000Z',
        updated_at: '2026-05-21T10:00:00.000Z',
      },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const replies = await getRepliesByReviewId('review-1');
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(replies).toEqual([
      {
        id: 'reply-1',
        reviewId: 'review-1',
        userId: 'user-2',
        comment: 'Coincido totalmente',
        status: 'approved',
        createdAt: '2026-05-21T10:00:00.000Z',
        updatedAt: '2026-05-21T10:00:00.000Z',
      },
    ]);
    expect(decodeURIComponent(String(url))).toContain('/rest/v1/review_replies?');
    expect(decodeURIComponent(String(url))).toContain('review_id=eq.review-1');
    expect(decodeURIComponent(String(url))).toContain('order=created_at.asc');
    expect(decodeURIComponent(String(url))).toContain('select=id,review_id,user_id,comment,status,created_at,updated_at');
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer anon-key',
      apikey: 'anon-key',
    });
  });

  it('obtiene respuestas con sesión autenticada', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      {
        id: 'reply-1',
        review_id: 'review-1',
        user_id: 'user-1',
        comment: 'Gracias por el comentario',
        status: 'pending',
        created_at: '2026-05-21T11:00:00.000Z',
        updated_at: '2026-05-21T11:00:00.000Z',
      },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const replies = await getRepliesByReviewId('review-1', {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(replies).toEqual([
      {
        id: 'reply-1',
        reviewId: 'review-1',
        userId: 'user-1',
        comment: 'Gracias por el comentario',
        status: 'pending',
        createdAt: '2026-05-21T11:00:00.000Z',
        updatedAt: '2026-05-21T11:00:00.000Z',
      },
    ]);
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      apikey: 'anon-key',
    });
  });

  it('rechaza reviewId vacío en getRepliesByReviewId', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getRepliesByReviewId('   ')).rejects.toThrow('reviewId es obligatorio.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maneja errores de Supabase en getRepliesByReviewId', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('internal error'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getRepliesByReviewId('review-1')).rejects.toThrow(
      'Supabase review_replies request failed (500): internal error',
    );
  });
});
