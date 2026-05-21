import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getHelpfulReactionSummary,
  getReviewReactionSummary,
  toggleHelpfulReaction,
  toggleNotHelpfulReaction,
} from './reviewReactionService';

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

describe('reviewReactionService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('obtiene contador helpful y estado helpful/not_helpful del usuario autenticado', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      { review_id: 'review-1', user_id: 'user-1', type: 'helpful' },
      { review_id: 'review-1', user_id: 'user-2', type: 'helpful' },
      { review_id: 'review-2', user_id: 'user-1', type: 'not_helpful' },
      { review_id: 'review-2', user_id: 'user-2', type: 'helpful' },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await getReviewReactionSummary(['review-1', 'review-2'], {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(summary).toEqual([
      { helpfulCount: 2, hasReactedHelpful: true, hasReactedNotHelpful: false, reviewId: 'review-1' },
      { helpfulCount: 1, hasReactedHelpful: false, hasReactedNotHelpful: true, reviewId: 'review-2' },
    ]);
    expect(summary[1]).not.toHaveProperty('notHelpfulCount');
    expect(decodeURIComponent(String(url))).toContain('/rest/v1/review_reactions?');
    expect(decodeURIComponent(String(url))).toContain('review_id=in.(review-1,review-2)');
    expect(decodeURIComponent(String(url))).toContain('type=in.(helpful,not_helpful)');
    expect(decodeURIComponent(String(url))).toContain('select=review_id,user_id,type');
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      apikey: 'anon-key',
    });
  });

  it('devuelve hasReacted false sin usuario, usa anon key y no pide not_helpful', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      { review_id: 'review-1', user_id: 'user-1', type: 'helpful' },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await getHelpfulReactionSummary(['review-1']);
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(summary).toEqual([{ helpfulCount: 1, hasReactedHelpful: false, hasReactedNotHelpful: false, reviewId: 'review-1' }]);
    expect(decodeURIComponent(String(url))).toContain('type=eq.helpful');
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer anon-key',
      apikey: 'anon-key',
    });
  });

  it('no consulta Supabase si no hay reviewIds', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getReviewReactionSummary([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('toggle helpful inserta helpful si el usuario no reaccionó', async () => {
    stubSupabaseEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(emptyOkResponse(201))
      .mockResolvedValueOnce(jsonResponse([{ review_id: 'review-1', user_id: 'user-1', type: 'helpful' }]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await toggleHelpfulReaction('review-1', {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    const [, insertRequest] = fetchMock.mock.calls[1];

    expect(summary).toEqual({ helpfulCount: 1, hasReactedHelpful: true, hasReactedNotHelpful: false, reviewId: 'review-1' });
    expect(fetchMock.mock.calls[1][0]).toBe('https://example.supabase.co/rest/v1/review_reactions');
    expect(insertRequest).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ review_id: 'review-1', type: 'helpful', user_id: 'user-1' }),
    });
    expect(insertRequest.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      Prefer: 'return=minimal',
    });
  });

  it('toggle helpful borra helpful si ya existe', async () => {
    stubSupabaseEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ review_id: 'review-1', user_id: 'user-1', type: 'helpful' }]))
      .mockResolvedValueOnce(emptyOkResponse())
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await toggleHelpfulReaction('review-1', {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    const [deleteUrl, deleteRequest] = fetchMock.mock.calls[1];

    expect(summary).toEqual({ helpfulCount: 0, hasReactedHelpful: false, hasReactedNotHelpful: false, reviewId: 'review-1' });
    expect(deleteRequest).toMatchObject({ method: 'DELETE' });
    expect(decodeURIComponent(String(deleteUrl))).toContain('review_id=eq.review-1');
    expect(decodeURIComponent(String(deleteUrl))).toContain('user_id=eq.user-1');
    expect(decodeURIComponent(String(deleteUrl))).toContain('type=eq.helpful');
  });

  it('toggle helpful elimina not_helpful previo antes de insertar helpful', async () => {
    stubSupabaseEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ review_id: 'review-1', user_id: 'user-1', type: 'not_helpful' }]))
      .mockResolvedValueOnce(emptyOkResponse())
      .mockResolvedValueOnce(emptyOkResponse(201))
      .mockResolvedValueOnce(jsonResponse([{ review_id: 'review-1', user_id: 'user-1', type: 'helpful' }]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await toggleHelpfulReaction('review-1', { accessToken: 'session-token', userId: 'user-1' });
    const [deleteUrl] = fetchMock.mock.calls[1];
    const [, insertRequest] = fetchMock.mock.calls[2];

    expect(decodeURIComponent(String(deleteUrl))).toContain('type=eq.not_helpful');
    expect(insertRequest).toMatchObject({ method: 'POST', body: JSON.stringify({ review_id: 'review-1', type: 'helpful', user_id: 'user-1' }) });
    expect(summary).toEqual({ helpfulCount: 1, hasReactedHelpful: true, hasReactedNotHelpful: false, reviewId: 'review-1' });
  });

  it('toggle not_helpful inserta not_helpful si el usuario no reaccionó', async () => {
    stubSupabaseEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(emptyOkResponse(201))
      .mockResolvedValueOnce(jsonResponse([{ review_id: 'review-1', user_id: 'user-1', type: 'not_helpful' }]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await toggleNotHelpfulReaction('review-1', { accessToken: 'session-token', userId: 'user-1' });
    const [, insertRequest] = fetchMock.mock.calls[1];

    expect(insertRequest).toMatchObject({ method: 'POST', body: JSON.stringify({ review_id: 'review-1', type: 'not_helpful', user_id: 'user-1' }) });
    expect(summary).toEqual({ helpfulCount: 0, hasReactedHelpful: false, hasReactedNotHelpful: true, reviewId: 'review-1' });
  });

  it('toggle not_helpful borra not_helpful si ya existe', async () => {
    stubSupabaseEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ review_id: 'review-1', user_id: 'user-1', type: 'not_helpful' }]))
      .mockResolvedValueOnce(emptyOkResponse())
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await toggleNotHelpfulReaction('review-1', { accessToken: 'session-token', userId: 'user-1' });
    const [deleteUrl] = fetchMock.mock.calls[1];

    expect(decodeURIComponent(String(deleteUrl))).toContain('type=eq.not_helpful');
    expect(summary).toEqual({ helpfulCount: 0, hasReactedHelpful: false, hasReactedNotHelpful: false, reviewId: 'review-1' });
  });

  it('toggle not_helpful elimina helpful previo antes de insertar not_helpful', async () => {
    stubSupabaseEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([
        { review_id: 'review-1', user_id: 'user-1', type: 'helpful' },
        { review_id: 'review-1', user_id: 'user-2', type: 'helpful' },
      ]))
      .mockResolvedValueOnce(emptyOkResponse())
      .mockResolvedValueOnce(emptyOkResponse(201))
      .mockResolvedValueOnce(jsonResponse([
        { review_id: 'review-1', user_id: 'user-2', type: 'helpful' },
        { review_id: 'review-1', user_id: 'user-1', type: 'not_helpful' },
      ]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await toggleNotHelpfulReaction('review-1', { accessToken: 'session-token', userId: 'user-1' });
    const [deleteUrl] = fetchMock.mock.calls[1];
    const [, insertRequest] = fetchMock.mock.calls[2];

    expect(decodeURIComponent(String(deleteUrl))).toContain('type=eq.helpful');
    expect(insertRequest).toMatchObject({ method: 'POST', body: JSON.stringify({ review_id: 'review-1', type: 'not_helpful', user_id: 'user-1' }) });
    expect(summary).toEqual({ helpfulCount: 1, hasReactedHelpful: false, hasReactedNotHelpful: true, reviewId: 'review-1' });
  });

  it('no hace toggle sin userId/accessToken', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(toggleHelpfulReaction('review-1', { accessToken: 'session-token', userId: '   ' })).rejects.toThrow(
      'userId y accessToken son obligatorios para reaccionar a reviews',
    );
    await expect(toggleNotHelpfulReaction('review-1', { accessToken: '', userId: 'user-1' })).rejects.toThrow(
      'userId y accessToken son obligatorios para reaccionar a reviews',
    );
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

    await expect(getReviewReactionSummary(['review-1'])).rejects.toThrow(
      'Supabase review_reactions request failed (403): permission denied',
    );
  });
});
