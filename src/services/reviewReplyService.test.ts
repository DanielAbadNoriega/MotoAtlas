import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReviewReply, getMyRepliesByMotorcycleId, getRepliesByReviewId, getRepliesByReviewIds } from './reviewReplyService';

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

  it('crea respuesta con status pending, bearer token, user_name y user_id propio', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(emptyOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    const reply = await createReviewReply(
      { comment: '  Gran review!  ', reviewId: ' review-1 ', userName: 'Carlos Ruiz' },
      { accessToken: 'session-token', userId: 'user-1' },
    );
    const [url, requestInit] = fetchMock.mock.calls[0];

    expect(url).toBe('https://example.supabase.co/rest/v1/review_replies');
    expect(requestInit).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        review_id: 'review-1',
        user_id: 'user-1',
        user_name: 'Carlos Ruiz',
        comment: 'Gran review!',
      }),
    });
    expect(requestInit.body).not.toContain('status');
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      Prefer: 'return=minimal',
      apikey: 'anon-key',
    });
    expect(reply).toMatchObject({
      reviewId: 'review-1',
      userId: 'user-1',
      userName: 'Carlos Ruiz',
      comment: 'Gran review!',
      status: 'pending',
    });
  });

  it('usa fallback Usuario MotoAtlas cuando no se provee user_name', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(emptyOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    const reply = await createReviewReply(
      { comment: 'texto', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    );
    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body as string);

    expect(body.user_name).toBe('');
    expect(reply.userName).toBe('Usuario MotoAtlas');
  });

  it('no envía status en el POST — el default de DB aplica pending', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(emptyOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    await createReviewReply(
      { comment: 'texto', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    );
    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body as string);

    expect(body).not.toHaveProperty('status');
    expect(body).toMatchObject({
      review_id: 'review-1',
      user_id: 'user-1',
      comment: 'texto',
    });
  });

  it('no crea respuesta sin userId/accessToken', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReviewReply(
      { comment: 'texto', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: '   ' },
    )).rejects.toThrow('userId y accessToken son obligatorios para responder reviews.');
    await expect(createReviewReply(
      { comment: 'texto', reviewId: 'review-1' },
      { accessToken: '', userId: 'user-1' },
    )).rejects.toThrow('userId y accessToken son obligatorios para responder reviews.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('valida reviewId y comment antes de llamar a Supabase', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReviewReply(
      { comment: 'texto', reviewId: '   ' },
      { accessToken: 'session-token', userId: 'user-1' },
    )).rejects.toThrow('reviewId es obligatorio para responder reviews.');
    await expect(createReviewReply(
      { comment: '   ', reviewId: 'review-1' },
      { accessToken: 'session-token', userId: 'user-1' },
    )).rejects.toThrow('comment es obligatorio para responder reviews.');
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
        user_name: 'María García',
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
        userName: 'María García',
        comment: 'Coincido totalmente',
        status: 'approved',
        createdAt: '2026-05-21T10:00:00.000Z',
        updatedAt: '2026-05-21T10:00:00.000Z',
      },
    ]);
    expect(decodeURIComponent(String(url))).toContain('/rest/v1/review_replies?');
    expect(decodeURIComponent(String(url))).toContain('review_id=eq.review-1');
    expect(decodeURIComponent(String(url))).toContain('order=created_at.asc');
    expect(decodeURIComponent(String(url))).toContain('select=id,review_id,user_id,user_name,comment,status,created_at,updated_at');
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
        user_name: 'Carlos Ruiz',
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
        userName: 'Carlos Ruiz',
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

  it('usa fallback Usuario MotoAtlas cuando user_name es vacío en row', async () => {
    stubSupabaseEnv();
    const longUserId = 'abcdef12-3456-7890-abcd-ef1234567890';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      {
        id: 'reply-1',
        review_id: 'review-1',
        user_id: longUserId,
        user_name: '',
        comment: 'Sin nombre',
        status: 'approved',
        created_at: '2026-05-21T10:00:00.000Z',
        updated_at: '2026-05-21T10:00:00.000Z',
      },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const replies = await getRepliesByReviewId('review-1');

    expect(replies[0].userName).toBe('Usuario MotoAtlas');
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

  describe('getRepliesByReviewIds', () => {
    it('retorna array vacío si reviewIds está vacío', async () => {
      const result = await getRepliesByReviewIds([]);
      expect(result).toEqual([]);
    });

    it('retorna array vacío si todos los IDs son whitespace', async () => {
      const result = await getRepliesByReviewIds(['  ', '']);
      expect(result).toEqual([]);
    });

    it('construye URL con in.(...) y select correcto sin autenticación', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
        {
          id: 'reply-1',
          review_id: 'review-a',
          user_id: 'user-2',
          user_name: 'Ana López',
          comment: 'Coincido',
          status: 'approved',
          created_at: '2026-05-21T10:00:00.000Z',
          updated_at: '2026-05-21T10:00:00.000Z',
        },
      ]));
      vi.stubGlobal('fetch', fetchMock);

      const result = await getRepliesByReviewIds(['review-a', 'review-b']);
      const [url, requestInit] = fetchMock.mock.calls[0];
      const decodedUrl = decodeURIComponent(String(url));

      expect(decodedUrl).toContain('/rest/v1/review_replies?');
      expect(decodedUrl).toContain('review_id=in.(review-a,review-b)');
      expect(decodedUrl).toContain('order=created_at.asc');
      expect(decodedUrl).toContain('select=id,review_id,user_id,user_name,comment,status,created_at,updated_at');
      expect(requestInit.headers).toMatchObject({
        Authorization: 'Bearer anon-key',
        apikey: 'anon-key',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'reply-1',
        reviewId: 'review-a',
        userId: 'user-2',
        userName: 'Ana López',
        comment: 'Coincido',
        status: 'approved',
      });
    });

    it('usa accessToken del authContext cuando se proporciona', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
      vi.stubGlobal('fetch', fetchMock);

      await getRepliesByReviewIds(['review-1'], {
        accessToken: 'session-token',
        userId: 'user-1',
      });
      const [, requestInit] = fetchMock.mock.calls[0];
      expect(requestInit.headers).toMatchObject({
        Authorization: 'Bearer session-token',
        apikey: 'anon-key',
      });
    });

    it('no llama a fetch si reviewIds está vacío', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await getRepliesByReviewIds([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('maneja errores de Supabase', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('db error'),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(getRepliesByReviewIds(['review-1'])).rejects.toThrow(
        'Supabase review_replies request failed (500): db error',
      );
    });

    it('filtra IDs con whitespace y usa solo IDs válidos', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
      vi.stubGlobal('fetch', fetchMock);

      await getRepliesByReviewIds(['review-1', '  ', 'review-2', '']);
      const [url] = fetchMock.mock.calls[0];
      const decodedUrl = decodeURIComponent(String(url));

      expect(decodedUrl).toContain('review_id=in.(review-1,review-2)');
    });
  });

  describe('getMyRepliesByMotorcycleId', () => {
    function makeReviewRow(id: string, overrides: Record<string, unknown> = {}) {
      return {
        id,
        user_id: 'user-other',
        user_name: 'Otro Usuario',
        rating: 4,
        comment: `Review ${id}`,
        created_at: '2026-05-20T10:00:00.000Z',
        ...overrides,
      };
    }

    function makeReplyRow(overrides: Record<string, unknown> = {}) {
      return {
        id: 'reply-1',
        review_id: 'review-1',
        user_id: 'user-1',
        user_name: 'Mi Nombre',
        comment: 'Mi respuesta',
        status: 'approved',
        created_at: '2026-05-21T10:00:00.000Z',
        updated_at: '2026-05-21T10:00:00.000Z',
        ...overrides,
      };
    }

    it('retorna array vacío si motorcycleId es vacío', async () => {
      const result = await getMyRepliesByMotorcycleId('  ', { accessToken: 'token', userId: 'user-1' });
      expect(result).toEqual([]);
    });

    it('retorna array vacío sin authContext válido', async () => {
      const result = await getMyRepliesByMotorcycleId('motorcycle-1', { accessToken: '', userId: '' });
      expect(result).toEqual([]);
    });

    it('consulta motorcycle_reviews y luego review_replies con user_id propio', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(jsonResponse([
          makeReviewRow('review-1'),
          makeReviewRow('review-2', { comment: 'Segunda review' }),
        ]))
        .mockResolvedValueOnce(jsonResponse([
          makeReplyRow({ review_id: 'review-1', comment: 'Respondí a review-1' }),
          makeReplyRow({ id: 'reply-2', review_id: 'review-2', comment: 'Respondí a review-2' }),
        ]));
      vi.stubGlobal('fetch', fetchMock);

      const result = await getMyRepliesByMotorcycleId('motorcycle-1', { accessToken: 'session-token', userId: 'user-1' });

      expect(fetchMock).toHaveBeenCalledTimes(2);

      const [reviewsUrl] = fetchMock.mock.calls[0];
      expect(decodeURIComponent(String(reviewsUrl))).toContain('/rest/v1/motorcycle_reviews?');
      expect(decodeURIComponent(String(reviewsUrl))).toContain('motorcycle_id=eq.motorcycle-1');

      const [replyUrl] = fetchMock.mock.calls[1];
      expect(decodeURIComponent(String(replyUrl))).toContain('/rest/v1/review_replies?');
      expect(decodeURIComponent(String(replyUrl))).toContain('review_id=in.(review-1,review-2)');
      expect(decodeURIComponent(String(replyUrl))).toContain('user_id=eq.user-1');

      expect(result).toHaveLength(2);
      expect(result[0].reply.comment).toBe('Respondí a review-1');
      expect(result[0].review.userName).toBe('Otro Usuario');
      expect(result[0].review.rating).toBe(4);
    });

    it('retorna array vacío si no hay reviews para esa moto', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([]));
      vi.stubGlobal('fetch', fetchMock);

      const result = await getMyRepliesByMotorcycleId('motorcycle-empty', { accessToken: 'token', userId: 'user-1' });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('retorna array vacío si no hay replies del usuario', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(jsonResponse([makeReviewRow('review-1')]))
        .mockResolvedValueOnce(jsonResponse([]));
      vi.stubGlobal('fetch', fetchMock);

      const result = await getMyRepliesByMotorcycleId('motorcycle-1', { accessToken: 'token', userId: 'user-1' });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual([]);
    });

    it('incluye datos de contexto de review aunque review_id no esté en el índice', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(jsonResponse([makeReviewRow('review-1')]))
        .mockResolvedValueOnce(jsonResponse([
          makeReplyRow({ review_id: 'review-999', comment: 'Review huérfana' }),
        ]));
      vi.stubGlobal('fetch', fetchMock);

      const result = await getMyRepliesByMotorcycleId('motorcycle-1', { accessToken: 'token', userId: 'user-1' });

      expect(result).toHaveLength(1);
      expect(result[0].review.id).toBe('review-999');
      expect(result[0].review.userName).toBe('');
      expect(result[0].review.rating).toBe(0);
      expect(result[0].review.comment).toBe('');
    });

    it('usa accessToken para ambas consultas', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn()
        .mockResolvedValue(jsonResponse([makeReviewRow('review-1')]));
      vi.stubGlobal('fetch', fetchMock);

      await getMyRepliesByMotorcycleId('motorcycle-1', { accessToken: 'custom-token', userId: 'user-1' });

      for (const [, requestInit] of fetchMock.mock.calls) {
        expect(requestInit.headers.Authorization).toBe('Bearer custom-token');
      }
    });

    it('maneja error de Supabase en primera consulta', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('db error'),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        getMyRepliesByMotorcycleId('motorcycle-1', { accessToken: 'token', userId: 'user-1' }),
      ).rejects.toThrow('Supabase review_replies request failed (500): db error');
    });

    it('maneja error de Supabase en segunda consulta', async () => {
      stubSupabaseEnv();
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(jsonResponse([makeReviewRow('review-1')]))
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: () => Promise.resolve('forbidden'),
        });
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        getMyRepliesByMotorcycleId('motorcycle-1', { accessToken: 'token', userId: 'user-1' }),
      ).rejects.toThrow('Supabase review_replies request failed (403): forbidden');
    });
  });
