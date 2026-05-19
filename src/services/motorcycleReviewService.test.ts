import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReview, getApprovedReviewsByMotorcycleId } from './motorcycleReviewService';

const reviewRow = {
  id: 'review-1',
  motorcycle_id: 'bmw-f-900-gs-2024',
  user_id: null,
  user_name: 'Dani',
  rating: 5,
  riding_style: 'viaje',
  ownership_months: 12,
  kilometers: 8500,
  comment: 'Muy completa para viajar y pistas fáciles.',
  pros: ['Motor lleno'],
  cons: ['Precio alto'],
  status: 'pending',
  created_at: '2026-05-14T10:00:00.000Z',
  updated_at: '2026-05-14T10:00:00.000Z',
};

const validReviewInput = {
  motorcycleId: 'bmw-f-900-gs-2024',
  userName: 'Dani',
  rating: 5,
  ridingStyle: 'viaje',
  ownershipMonths: 12,
  kilometers: 8500,
  comment: 'Muy completa para viajar y pistas fáciles.',
  pros: ['Motor lleno'],
  cons: ['Precio alto'],
} as const;

function stubSupabaseEnv() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
}

function getLastPayload(fetchMock: ReturnType<typeof vi.fn>) {
  const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return JSON.parse(String(lastCall?.[1]?.body));
}

describe('motorcycleReviewService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('crea una review válida como pendiente sin usar Supabase real', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([reviewRow]),
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    const review = await createReview(validReviewInput);

    expect(review).toMatchObject({
      motorcycleId: 'bmw-f-900-gs-2024',
      rating: 5,
      status: 'pending',
      userId: null,
      userName: 'Dani',
      verified: false,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/motorcycle_reviews',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"status":"pending"'),
      }),
    );
    expect(getLastPayload(fetchMock)).toMatchObject({
      riding_style: 'viaje',
      source: 'user',
      status: 'pending',
      user_id: null,
      user_name: 'Dani',
      verified: false,
    });
  });

  it('envía headers Supabase correctos para inserción pública sin leer la fila pending', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    await createReview({
      motorcycleId: 'bmw-f-900-gs-2024',
      userName: 'Dani',
      rating: 4,
      ridingStyle: 'diario',
      comment: 'Buena moto para uso diario.',
    });

    const [, requestInit] = fetchMock.mock.calls[0];

    expect(requestInit.headers).toMatchObject({
      Accept: 'application/json',
      apikey: 'anon-key',
      Authorization: 'Bearer anon-key',
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    });
    expect(requestInit.headers).not.toMatchObject({ Prefer: 'return=representation' });
  });

  it('envía user_id correcto y token de sesión para una review autenticada', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    const review = await createReview(validReviewInput, {
      accessToken: 'session-token',
      userId: 'user-123',
    });

    const [, requestInit] = fetchMock.mock.calls[0];

    expect(review).toMatchObject({
      status: 'pending',
      userId: 'user-123',
      verified: false,
    });
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      apikey: 'anon-key',
      Prefer: 'return=minimal',
    });
    expect(getLastPayload(fetchMock)).toMatchObject({
      source: 'user',
      status: 'pending',
      user_id: 'user-123',
      verified: false,
    });
  });

  it('ignora campos externos que intentarían sobrescribir moderation/source/user_id', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    await createReview(
      {
        ...validReviewInput,
        source: 'seed',
        status: 'approved',
        userId: 'other-user',
        verified: true,
      } as never,
      {
        accessToken: 'session-token',
        userId: 'user-123',
      },
    );

    expect(getLastPayload(fetchMock)).toMatchObject({
      source: 'user',
      status: 'pending',
      user_id: 'user-123',
      verified: false,
    });
  });

  it('rechaza contexto autenticado incompleto antes de llamar a red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(createReview(validReviewInput, { accessToken: 'session-token', userId: '   ' })).rejects.toThrow(
      'userId y accessToken son obligatorios para reviews autenticadas',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propaga un error Supabase legible si RLS rechaza el insert', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('new row violates row-level security policy for table "motorcycle_reviews"'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createReview({
        motorcycleId: 'bmw-f-900-gs-2024',
        userName: 'Dani',
        rating: 4,
        ridingStyle: 'diario',
        comment: 'Buena moto para uso diario.',
      }),
    ).rejects.toThrow(
      'Supabase motorcycle_reviews request failed (401): new row violates row-level security policy for table "motorcycle_reviews"',
    );
  });

  it('rechaza rating inválido antes de llamar a red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createReview({ motorcycleId: 'bmw-f-900-gs-2024', userName: 'Dani', rating: 6, ridingStyle: 'viaje', comment: 'Texto' }),
    ).rejects.toThrow('rating debe ser un entero entre 1 y 5');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza alias vacío antes de llamar a red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createReview({ motorcycleId: 'bmw-f-900-gs-2024', userName: '   ', rating: 5, ridingStyle: 'viaje', comment: 'Texto' }),
    ).rejects.toThrow('userName es obligatorio');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza riding_style inválido antes de llamar a red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createReview({
        motorcycleId: 'bmw-f-900-gs-2024',
        userName: 'Dani',
        rating: 5,
        ridingStyle: 'invalid' as never,
        comment: 'Texto',
      }),
    ).rejects.toThrow('ridingStyle es obligatorio');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lee solo reviews aprobadas de una moto', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([{ ...reviewRow, status: 'approved' }]),
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);

    const reviews = await getApprovedReviewsByMotorcycleId('bmw-f-900-gs-2024');

    expect(reviews[0]).toMatchObject({ motorcycleId: 'bmw-f-900-gs-2024', ridingStyle: 'viaje', status: 'approved', verified: false });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/rest/v1/motorcycle_reviews?'), expect.any(Object));
    expect(fetchMock.mock.calls[0][0]).toContain('status=eq.approved');
    expect(fetchMock.mock.calls[0][0]).toContain('motorcycle_id=eq.bmw-f-900-gs-2024');
  });
});
