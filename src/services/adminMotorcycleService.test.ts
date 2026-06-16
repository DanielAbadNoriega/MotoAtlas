import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAdminMotorcycle, updateAdminMotorcycle } from './adminMotorcycleService';
import type { AdminMotorcycleCreatePayload, AdminMotorcycleUpdatePayload } from './adminMotorcycleService';

const validCreatePayload: AdminMotorcycleCreatePayload = {
  id: 'honda-cbr600rr-2026',
  brand: 'Honda',
  model: 'CBR600RR',
  year: 2026,
  description: 'Deportiva japonesa de alto rendimiento.',
  segment: 'sport',
  license: 'A',
  engineType: 'inline-four',
  displacementCc: 599,
  powerHp: 120,
  torqueNm: 64,
  wetWeightKg: 194,
  seatHeightMm: 820,
  fuelTankLiters: 18,
  priceEur: 12500,
  imageUrl: 'https://example.com/cbr600rr.jpg',
};

const validUpdatePayload: AdminMotorcycleUpdatePayload = {
  priceEur: 11900,
  description: 'Precio actualizado 2026.',
};

const motorcycleRow = {
  id: 'honda-cbr600rr-2026',
  brand: 'Honda',
  model: 'CBR600RR',
  year: 2026,
  segment: 'sport',
  license: 'A',
  is_a2_compatible: false,
  is_a2_limited_version: false,
  limited_power_hp: null,
  original_power_hp: null,
  engine_type: 'inline-four',
  displacement_cc: 599,
  power_hp: 120,
  torque_nm: 64,
  wet_weight_kg: 194,
  seat_height_mm: 820,
  fuel_tank_liters: 18,
  price_eur: 12500,
  image_url: 'https://example.com/cbr600rr.jpg',
  image_locked: false,
  description: 'Deportiva japonesa de alto rendimiento.',
  description_locked: false,
  specs_source: 'manual',
  price_source: 'manual',
  image_source: 'manual',
  scores_source: 'estimated',
  pros_cons_source: 'estimated',
  reliability_source: 'estimated',
  abs_cornering: false,
  traction_control: false,
  riding_modes: false,
  cruise_control: false,
  quickshifter: false,
  heated_grips: false,
  tubeless_wheels: false,
  use_scores: null,
  pros: null,
  cons: null,
  common_issues: null,
  report_count: 0,
  reliability_score: 0,
  official_url: null,
};

function stubSupabaseEnv() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
}

function jsonResponse(data: unknown, ok = true, status = 200) {
  return {
    json: () => Promise.resolve(data),
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

function getLastPayload(fetchMock: ReturnType<typeof vi.fn>) {
  const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return JSON.parse(String(lastCall?.[1]?.body));
}

describe('createAdminMotorcycle', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('llama al RPC create_admin_motorcycle con POST y headers correctos', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(motorcycleRow));
    vi.stubGlobal('fetch', fetchMock);

    const result = await createAdminMotorcycle(validCreatePayload, 'session-token');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/rest/v1/rpc/create_admin_motorcycle');
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer session-token',
        'Content-Type': 'application/json',
      },
    });
    expect(result.id).toBe('honda-cbr600rr-2026');
  });

  it('mapea payload camelCase a parámetros p_snake_case', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(motorcycleRow));
    vi.stubGlobal('fetch', fetchMock);

    await createAdminMotorcycle(validCreatePayload, 'session-token');
    const params = getLastPayload(fetchMock);

    expect(params).toMatchObject({
      p_id: 'honda-cbr600rr-2026',
      p_brand: 'Honda',
      p_model: 'CBR600RR',
      p_year: 2026,
      p_description: 'Deportiva japonesa de alto rendimiento.',
      p_segment: 'sport',
      p_license: 'A',
      p_engine_type: 'inline-four',
      p_displacement_cc: 599,
      p_power_hp: 120,
      p_torque_nm: 64,
      p_wet_weight_kg: 194,
      p_seat_height_mm: 820,
      p_fuel_tank_liters: 18,
      p_price_eur: 12500,
      p_image_url: 'https://example.com/cbr600rr.jpg',
    });
  });

  it('rellena defaults para campos opcionales no provistos', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(motorcycleRow));
    vi.stubGlobal('fetch', fetchMock);

    await createAdminMotorcycle(validCreatePayload, 'session-token');
    const params = getLastPayload(fetchMock);

    expect(params).toMatchObject({
      p_description_locked: false,
      p_image_locked: false,
      p_abs_cornering: false,
      p_traction_control: false,
      p_is_a2_compatible: false,
      p_limited_power_hp: null,
      p_original_power_hp: null,
    });
  });

  it('no llama a /rest/v1/motorcycles directo (solo RPC)', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(motorcycleRow));
    vi.stubGlobal('fetch', fetchMock);

    await createAdminMotorcycle(validCreatePayload, 'session-token');
    const [url] = fetchMock.mock.calls[0];
    expect(url).not.toContain('/rest/v1/motorcycles?');
    expect(url).toContain('/rpc/create_admin_motorcycle');
  });

  it('mapea fila retornada a tipo Bike', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(motorcycleRow));
    vi.stubGlobal('fetch', fetchMock);

    const bike = await createAdminMotorcycle(validCreatePayload, 'session-token');

    expect(bike).toMatchObject({
      id: 'honda-cbr600rr-2026',
      brand: 'Honda',
      model: 'CBR600RR',
      year: 2026,
      segment: 'sport',
      license: 'A',
      engineType: 'inline-four',
      displacementCc: 599,
      powerHp: 120,
      priceEur: 12500,
    });
    expect(bike.features).toBeDefined();
    expect(bike.useScores).toBeDefined();
    expect(bike.reliabilityReports).toBeDefined();
  });

  it('lanza error si falta access token', async () => {
    await expect(createAdminMotorcycle(validCreatePayload, '')).rejects.toThrow(
      'Access token is required',
    );
  });

  it('lanza error si falla la configuración de Supabase', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    await expect(createAdminMotorcycle(validCreatePayload, 'token')).rejects.toThrow(
      'Missing VITE_SUPABASE_URL',
    );
    vi.unstubAllEnvs();
  });

  it('lanza error en 403 forbidden', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Forbidden' }, false, 403));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createAdminMotorcycle(validCreatePayload, 'token')).rejects.toThrow(
      'Admin motorcycle request failed (403)',
    );
  });

  it('lanza error en 409 duplicate', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Duplicate key' }, false, 409));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createAdminMotorcycle(validCreatePayload, 'token')).rejects.toThrow(
      'Admin motorcycle request failed (409)',
    );
  });

  it('lanza error en fallo de red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network failure'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createAdminMotorcycle(validCreatePayload, 'token')).rejects.toThrow('Network failure');
  });
});

describe('updateAdminMotorcycle', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const updatedRow = { ...motorcycleRow, price_eur: 11900, description: 'Precio actualizado 2026.' };

  it('llama a PATCH /rest/v1/motorcycles?id=eq.<id> con headers correctos', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([updatedRow]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await updateAdminMotorcycle('honda-cbr600rr-2026', validUpdatePayload, 'session-token');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/rest/v1/motorcycles?id=eq.honda-cbr600rr-2026');
    expect(init).toMatchObject({
      method: 'PATCH',
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer session-token',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    });
    expect(result.id).toBe('honda-cbr600rr-2026');
  });

  it('mapea payload camelCase a snake_case en el body', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([updatedRow]));
    vi.stubGlobal('fetch', fetchMock);

    await updateAdminMotorcycle('honda-cbr600rr-2026', validUpdatePayload, 'session-token');
    const body = getLastPayload(fetchMock);

    expect(body).not.toHaveProperty('id');
    expect(body).toMatchObject({
      price_eur: 11900,
      description: 'Precio actualizado 2026.',
    });
  });

  it('no envía id, created_at ni updated_at en el body', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([updatedRow]));
    vi.stubGlobal('fetch', fetchMock);

    await updateAdminMotorcycle('honda-cbr600rr-2026', validUpdatePayload, 'session-token');
    const body = getLastPayload(fetchMock);

    expect(body).not.toHaveProperty('id');
    expect(body).not.toHaveProperty('created_at');
    expect(body).not.toHaveProperty('updated_at');
  });

  it('mapea fila retornada a tipo Bike', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([updatedRow]));
    vi.stubGlobal('fetch', fetchMock);

    const bike = await updateAdminMotorcycle('honda-cbr600rr-2026', validUpdatePayload, 'session-token');

    expect(bike).toMatchObject({
      id: 'honda-cbr600rr-2026',
      priceEur: 11900,
      description: 'Precio actualizado 2026.',
    });
  });

  it('lanza error si el array retornado está vacío', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateAdminMotorcycle('nonexistent-id', validUpdatePayload, 'session-token')).rejects.toThrow(
      'not found for update',
    );
  });

  it('lanza error si falta access token', async () => {
    await expect(updateAdminMotorcycle('some-id', validUpdatePayload, '')).rejects.toThrow(
      'Access token is required',
    );
  });

  it('lanza error si el id está vacío', async () => {
    await expect(updateAdminMotorcycle('', validUpdatePayload, 'token')).rejects.toThrow(
      'Motorcycle id is required',
    );
  });

  it('lanza error en 403 forbidden', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Forbidden' }, false, 403));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateAdminMotorcycle('some-id', validUpdatePayload, 'token')).rejects.toThrow(
      'Admin motorcycle request failed (403)',
    );
  });

  it('lanza error en fallo de red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network failure'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateAdminMotorcycle('some-id', validUpdatePayload, 'token')).rejects.toThrow('Network failure');
  });
});
