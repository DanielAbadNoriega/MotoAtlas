import { afterEach, describe, expect, it, vi } from 'vitest';
import { createModelRequest, getAllModelRequests, getModelRequestsByUserId, updateModelRequestStatus } from './modelRequestService';

const validModelRequestInput = {
  brand: 'Honda',
  model: 'CBR600RR',
  year: 2026,
  segment: 'sport',
  contactEmail: 'rider@motoatlas.com',
  comment: 'Prioridad para mercado UE.',
} as const;

const modelRequestRow = {
  id: 'request-1',
  user_id: 'user-123',
  brand: 'Honda',
  model: 'CBR600RR',
  year: 2026,
  segment: 'sport',
  contact_email: 'rider@motoatlas.com',
  official_url: 'https://honda.example/cbr600rr',
  comment: 'Prioridad para mercado UE.',
  status: 'pending',
  source: 'user',
  created_at: '2026-05-15T10:00:00.000Z',
  updated_at: '2026-05-15T10:00:00.000Z',
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
      official_url: null,
      source: 'user',
      status: 'pending',
      user_id: null,
    });
  });

  it('envía official_url cuando la solicitud incluye una fuente oficial', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const request = await createModelRequest({
      ...validModelRequestInput,
      officialUrl: ' https://honda.example/cbr600rr ',
    });

    expect(request.officialUrl).toBe('https://honda.example/cbr600rr');
    expect(getLastPayload(fetchMock)).toMatchObject({
      official_url: 'https://honda.example/cbr600rr',
      status: 'pending',
      source: 'user',
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

  it('devuelve [] sin consultar si falta userId', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getModelRequestsByUserId({ accessToken: 'session-token', userId: ' ' })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('devuelve [] sin consultar si falta accessToken', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getModelRequestsByUserId({ accessToken: ' ', userId: 'user-123' })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('consulta model_requests filtrando por user_id, ordena por created_at desc y usa bearer token', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([modelRequestRow]),
    });
    vi.stubGlobal('fetch', fetchMock);

    const requests = await getModelRequestsByUserId({ accessToken: 'session-token', userId: 'user-123' });
    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));

    expect(url.pathname).toBe('/rest/v1/model_requests');
    expect(url.searchParams.get('user_id')).toBe('eq.user-123');
    expect(url.searchParams.get('order')).toBe('created_at.desc');
    expect(url.searchParams.get('select')).toContain('contact_email');
    expect(url.searchParams.get('select')).toContain('official_url');
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      apikey: 'anon-key',
    });
    expect(requests).toEqual([
      {
        id: 'request-1',
        userId: 'user-123',
        brand: 'Honda',
        model: 'CBR600RR',
        year: 2026,
        segment: 'sport',
        contactEmail: 'rider@motoatlas.com',
        officialUrl: 'https://honda.example/cbr600rr',
        comment: 'Prioridad para mercado UE.',
        status: 'pending',
        source: 'user',
        createdAt: '2026-05-15T10:00:00.000Z',
        updatedAt: '2026-05-15T10:00:00.000Z',
      },
    ]);
  });

  it('devuelve [] cuando Supabase no devuelve solicitudes del usuario', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getModelRequestsByUserId({ accessToken: 'session-token', userId: 'user-123' })).resolves.toEqual([]);
  });

  it('maneja errores de Supabase al consultar solicitudes del usuario', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('permission denied'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getModelRequestsByUserId({ accessToken: 'session-token', userId: 'user-123' })).rejects.toThrow(
      'Supabase model_requests request failed (403): permission denied',
    );
  });

  it('admin lista todas las solicitudes sin filtros', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([modelRequestRow]),
    });
    vi.stubGlobal('fetch', fetchMock);

    const requests = await getAllModelRequests({ accessToken: 'admin-token', userId: 'admin-1' });
    const [requestUrl] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));

    expect(url.pathname).toBe('/rest/v1/model_requests');
    expect(url.searchParams.get('order')).toBe('created_at.desc');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requests).toHaveLength(1);
    expect(requests[0].brand).toBe('Honda');
  });

  it('admin filtra solicitudes por status', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', fetchMock);

    await getAllModelRequests({ accessToken: 'admin-token', userId: 'admin-1' }, { status: 'pending' });
    const [requestUrl] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));

    expect(url.searchParams.get('status')).toBe('eq.pending');
  });

  it('admin filtra solicitudes por búsqueda textual', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', fetchMock);

    await getAllModelRequests({ accessToken: 'admin-token', userId: 'admin-1' }, { search: 'Honda' });
    const [requestUrl] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));

    expect(url.searchParams.get('or')).toBe('(brand.ilike.*Honda*,model.ilike.*Honda*)');
  });

  it('admin actualiza status correctamente con PATCH', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await updateModelRequestStatus('request-1', 'approved', { accessToken: 'admin-token', userId: 'admin-1' });
    const [requestUrl, requestInit] = fetchMock.mock.calls[0];

    expect(requestInit.method).toBe('PATCH');
    expect(new URL(String(requestUrl)).searchParams.get('id')).toBe('eq.request-1');
    expect(JSON.parse(String(requestInit.body))).toEqual({ status: 'approved' });
    expect(requestInit.headers).toMatchObject({
      Authorization: 'Bearer admin-token',
      Prefer: 'return=minimal',
    });
  });

  it('updateModelRequestStatus rechaza status inválido sin llamar fetch', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateModelRequestStatus('request-1', 'invalid' as never, { accessToken: 'admin-token', userId: 'admin-1' })).rejects.toThrow(
      'Estado inválido',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('getAllModelRequests sin authContext lanza error', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAllModelRequests({ accessToken: '', userId: '' })).rejects.toThrow(
      'userId y accessToken son obligatorios para administración de solicitudes.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('updateModelRequestStatus sin authContext lanza error', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateModelRequestStatus('request-1', 'approved', { accessToken: '', userId: '' })).rejects.toThrow(
      'userId y accessToken son obligatorios para administración de solicitudes.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
