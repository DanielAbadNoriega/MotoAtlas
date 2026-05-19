import { afterEach, describe, expect, it, vi } from 'vitest';
import { createModelRequest } from './modelRequestService';

const validModelRequestInput = {
  brand: 'Honda',
  model: 'CBR600RR',
  year: 2026,
  segment: 'sport',
  contactEmail: 'rider@motoatlas.com',
  comment: 'Prioridad para mercado UE.',
} as const;

function stubSupabaseEnv() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
}

function getLastPayload(fetchMock: ReturnType<typeof vi.fn>) {
  const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return JSON.parse(String(lastCall?.[1]?.body));
}

describe('modelRequestService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('crea una solicitud anónima con user_id null', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const request = await createModelRequest(validModelRequestInput);

    expect(request).toMatchObject({
      brand: 'Honda',
      model: 'CBR600RR',
      source: 'user',
      status: 'pending',
      userId: null,
      year: 2026,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/model_requests',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(getLastPayload(fetchMock)).toMatchObject({
      brand: 'Honda',
      contact_email: 'rider@motoatlas.com',
      model: 'CBR600RR',
      source: 'user',
      status: 'pending',
      user_id: null,
    });
  });

  it('crea una solicitud autenticada con user_id correcto y token de sesión', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const request = await createModelRequest(validModelRequestInput, {
      accessToken: 'session-token',
      userId: 'user-123',
    });
    const [, requestInit] = fetchMock.mock.calls[0];

    expect(request).toMatchObject({
      status: 'pending',
      userId: 'user-123',
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
    });
  });

  it('ignora campos externos que intentan sobrescribir status/source/user_id', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await createModelRequest(
      {
        ...validModelRequestInput,
        source: 'admin',
        status: 'approved',
        userId: 'other-user',
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
    });
  });

  it('rechaza campos obligatorios inválidos antes de llamar a red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(createModelRequest({ ...validModelRequestInput, brand: ' ' })).rejects.toThrow('brand es obligatorio');
    await expect(createModelRequest({ ...validModelRequestInput, model: ' ' })).rejects.toThrow('model es obligatorio');
    await expect(createModelRequest({ ...validModelRequestInput, year: 1800 })).rejects.toThrow('year debe ser un entero');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propaga errores de Supabase', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('new row violates row-level security policy'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createModelRequest(validModelRequestInput)).rejects.toThrow(
      'Supabase model_requests request failed (403): new row violates row-level security policy',
    );
  });
});
