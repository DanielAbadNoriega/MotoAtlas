import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReview, getApprovedReviewsByMotorcycleId } from './motorcycleReviewService';

const reviewRow = {
  id: 'review-1',
  motorcycle_id: 'bmw-f-900-gs-2024',
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

function stubSupabaseEnv() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
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

    const review = await createReview({
      motorcycleId: 'bmw-f-900-gs-2024',
      userName: 'Dani',
      rating: 5,
      ridingStyle: 'viaje',
      ownershipMonths: 12,
      kilometers: 8500,
      comment: 'Muy completa para viajar y pistas fáciles.',
      pros: ['Motor lleno'],
      cons: ['Precio alto'],
    });

    expect(review).toMatchObject({
      motorcycleId: 'bmw-f-900-gs-2024',
      rating: 5,
      status: 'pending',
      userName: 'Dani',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/motorcycle_reviews?select=*',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"status":"pending"'),
      }),
    );
    expect(fetchMock.mock.calls[0][1].body).toContain('"riding_style":"viaje"');
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

  it('rechaza riding_style inválido antes de llamar a red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createReview({
        motorcycleId: 'bmw-f-900-gs-2024',
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

    expect(reviews[0]).toMatchObject({ motorcycleId: 'bmw-f-900-gs-2024', ridingStyle: 'viaje', status: 'approved' });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/rest/v1/motorcycle_reviews?'), expect.any(Object));
    expect(fetchMock.mock.calls[0][0]).toContain('status=eq.approved');
    expect(fetchMock.mock.calls[0][0]).toContain('motorcycle_id=eq.bmw-f-900-gs-2024');
  });
});
