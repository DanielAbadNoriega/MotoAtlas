import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHelpfulReactionSummary, toggleHelpfulReaction } from './reviewReactionService';

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

describe('reviewReactionService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('obtiene contador helpful por review y marca hasReactedHelpful para el usuario autenticado', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      { review_id: 'review-1', user_id: 'user-1', type: 'helpful' },
      { review_id: 'review-1', user_id: 'user-2', type: 'helpful' },
      { review_id: 'review-2', user_id: 'user-2', type: 'helpful' },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await getHelpfulReactionSummary(['review-1', 'review-2'], {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(summary).toEqual([
      { helpfulCount: 2, hasReactedHelpful: true, reviewId: 'review-1' },
      { helpfulCount: 1, hasReactedHelpful: false, reviewId: 'review-2' },
    ]);
    expect(decodeURIComponent(String(url))).toContain('/rest/v1/review_reactions?');
    expect(decodeURIComponent(String(url))).toContain('review_id=in.(review-1,review-2)');
    expect(decodeURIComponent(String(url))).toContain('type=eq.helpful');
    expect(decodeURIComponent(String(url))).toContain('select=review_id,user_id,type');
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      apikey: 'anon-key',
    });
  });

  it('devuelve hasReactedHelpful false sin usuario y usa anon key', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      { review_id: 'review-1', user_id: 'user-1', type: 'helpful' },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await getHelpfulReactionSummary(['review-1']);
    const [, requestInit] = fetchMock.mock.calls[0];

    expect(summary).toEqual([{ helpfulCount: 1, hasReactedHelpful: false, reviewId: 'review-1' }]);
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer anon-key',
      apikey: 'anon-key',
    });
  });

  it('no consulta Supabase si no hay reviewIds', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getHelpfulReactionSummary([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('inserta helpful si el usuario no reaccionó', async () => {
    stubSupabaseEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce({ ok: true, status: 201, text: () => Promise.resolve('') })
      .mockResolvedValueOnce(jsonResponse([{ review_id: 'review-1', user_id: 'user-1', type: 'helpful' }]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await toggleHelpfulReaction('review-1', {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    const [, insertRequest] = fetchMock.mock.calls[1];

    expect(summary).toEqual({ helpfulCount: 1, hasReactedHelpful: true, reviewId: 'review-1' });
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

  it('borra helpful si el usuario ya reaccionó', async () => {
    stubSupabaseEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ review_id: 'review-1', user_id: 'user-1', type: 'helpful' }]))
      .mockResolvedValueOnce({ ok: true, status: 204, text: () => Promise.resolve('') })
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const summary = await toggleHelpfulReaction('review-1', {
      accessToken: 'session-token',
      userId: 'user-1',
    });
    const [deleteUrl, deleteRequest] = fetchMock.mock.calls[1];

    expect(summary).toEqual({ helpfulCount: 0, hasReactedHelpful: false, reviewId: 'review-1' });
    expect(deleteRequest).toMatchObject({ method: 'DELETE' });
    expect(decodeURIComponent(String(deleteUrl))).toContain('review_id=eq.review-1');
    expect(decodeURIComponent(String(deleteUrl))).toContain('user_id=eq.user-1');
    expect(decodeURIComponent(String(deleteUrl))).toContain('type=eq.helpful');
    expect(deleteRequest.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      Prefer: 'return=minimal',
    });
  });

  it('no hace toggle sin userId/accessToken', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(toggleHelpfulReaction('review-1', { accessToken: 'session-token', userId: '   ' })).rejects.toThrow(
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

    await expect(getHelpfulReactionSummary(['review-1'])).rejects.toThrow(
      'Supabase review_reactions request failed (403): permission denied',
    );
  });
});
