import { describe, expect, it, vi } from 'vitest';
import { bikeCatalog } from '../data/bikes';
import { getMotorcycles } from './motorcycleService';

describe('motorcycleService fallback', () => {
  it('returns bikes.ts fallback when Supabase env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await getMotorcycles();

    expect(result.source).toBe('fallback');
    expect(result.motorcycles).toEqual(bikeCatalog);
    expect(result.error?.message).toMatch(/Missing VITE_SUPABASE_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns bikes.ts fallback when Supabase request fails', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('broken'),
      }),
    );

    const result = await getMotorcycles();

    expect(result.source).toBe('fallback');
    expect(result.motorcycles).toEqual(bikeCatalog);
    expect(result.error?.message).toContain('Supabase motorcycles request failed');
  });
});
