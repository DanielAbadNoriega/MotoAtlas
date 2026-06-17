import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./adminMotorcycleImageUploadService', () => ({
  deleteMotorcycleImage: vi.fn(),
  uploadMotorcycleImage: vi.fn(),
}));

import {
  createAdminMotorcycleGalleryImage,
  deleteAdminMotorcycleGalleryImageRecord,
  getAdminMotorcycleGalleryImages,
  updateAdminMotorcycleGalleryImage,
} from './adminMotorcycleGalleryService';
import {
  deleteMotorcycleImage,
  uploadMotorcycleImage,
} from './adminMotorcycleImageUploadService';

const galleryRow = {
  id: 'image-1',
  motorcycle_id: 'honda-cbr600rr-2026',
  url: 'https://example.supabase.co/storage/v1/object/public/motorcycle-images/honda-cbr600rr-2026/image-1.jpg',
  storage_path: 'honda-cbr600rr-2026/image-1.jpg',
  alt_text: 'Honda CBR600RR lateral',
  is_primary: true,
  sort_order: 0,
  source: 'manual',
  created_by: 'user-1',
  created_at: '2026-06-17T10:00:00.000Z',
  updated_at: '2026-06-17T10:30:00.000Z',
} as const;

function stubSupabaseEnv() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
}

function jsonResponse(data: unknown, ok = true, status = 200, statusText = 'OK') {
  return {
    json: () => Promise.resolve(data),
    ok,
    status,
    statusText,
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

function getLastCall(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
}

function getLastRequestUrl(fetchMock: ReturnType<typeof vi.fn>) {
  const [url] = getLastCall(fetchMock);
  return new URL(String(url));
}

function getLastRequestInit(fetchMock: ReturnType<typeof vi.fn>) {
  const [, init] = getLastCall(fetchMock);
  return init;
}

describe('adminMotorcycleGalleryService', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('lista imágenes con filtro motorcycle_id y orden sort_order/created_at', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([galleryRow]));
    vi.stubGlobal('fetch', fetchMock);

    await getAdminMotorcycleGalleryImages('honda-cbr600rr-2026');

    const url = getLastRequestUrl(fetchMock);
    expect(url.pathname).toBe('/rest/v1/motorcycle_images');
    expect(url.searchParams.get('motorcycle_id')).toBe('eq.honda-cbr600rr-2026');
    expect(url.searchParams.get('order')).toBe('sort_order.asc,created_at.asc');
    expect(url.searchParams.get('select')).toBe('*');
  });

  it('mapea filas snake_case a camelCase al listar', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ ...galleryRow, storage_path: null, created_by: null }]));
    vi.stubGlobal('fetch', fetchMock);

    const images = await getAdminMotorcycleGalleryImages('honda-cbr600rr-2026');

    expect(images).toEqual([
      {
        id: 'image-1',
        motorcycleId: 'honda-cbr600rr-2026',
        url: galleryRow.url,
        storagePath: null,
        altText: 'Honda CBR600RR lateral',
        isPrimary: true,
        sortOrder: 0,
        source: 'manual',
        createdBy: null,
        createdAt: '2026-06-17T10:00:00.000Z',
        updatedAt: '2026-06-17T10:30:00.000Z',
      },
    ]);
  });

  it('create envía POST con auth, apikey, Prefer y body snake_case', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([galleryRow]));
    vi.stubGlobal('fetch', fetchMock);

    await createAdminMotorcycleGalleryImage(
      {
        motorcycleId: 'honda-cbr600rr-2026',
        url: galleryRow.url,
        storagePath: galleryRow.storage_path,
        altText: galleryRow.alt_text,
        isPrimary: true,
        sortOrder: 0,
        source: 'manual',
        createdBy: 'user-1',
      },
      'session-token',
    );

    const url = getLastRequestUrl(fetchMock);
    const init = getLastRequestInit(fetchMock);
    const body = JSON.parse(String(init?.body));

    expect(url.pathname).toBe('/rest/v1/motorcycle_images');
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer session-token',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    });
    expect(body).toEqual({
      motorcycle_id: 'honda-cbr600rr-2026',
      url: galleryRow.url,
      storage_path: 'honda-cbr600rr-2026/image-1.jpg',
      alt_text: 'Honda CBR600RR lateral',
      is_primary: true,
      sort_order: 0,
      source: 'manual',
      created_by: 'user-1',
    });
    expect(body).not.toHaveProperty('image_url');
  });

  it('create mapea la fila retornada a camelCase', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ ...galleryRow, storage_path: null, created_by: null }]));
    vi.stubGlobal('fetch', fetchMock);

    const image = await createAdminMotorcycleGalleryImage(
      {
        motorcycleId: 'honda-cbr600rr-2026',
        url: galleryRow.url,
      },
      'session-token',
    );

    expect(image.storagePath).toBeNull();
    expect(image.createdBy).toBeNull();
    expect(image.motorcycleId).toBe('honda-cbr600rr-2026');
  });

  it('update envía PATCH por id con auth y payload snake_case', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ ...galleryRow, alt_text: 'Vista frontal', sort_order: 2 }]));
    vi.stubGlobal('fetch', fetchMock);

    await updateAdminMotorcycleGalleryImage(
      'image-1',
      {
        altText: 'Vista frontal',
        sortOrder: 2,
        storagePath: null,
      },
      'session-token',
    );

    const url = getLastRequestUrl(fetchMock);
    const init = getLastRequestInit(fetchMock);
    const body = JSON.parse(String(init?.body));

    expect(url.pathname).toBe('/rest/v1/motorcycle_images');
    expect(url.searchParams.get('id')).toBe('eq.image-1');
    expect(init).toMatchObject({
      method: 'PATCH',
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer session-token',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    });
    expect(body).toEqual({
      alt_text: 'Vista frontal',
      sort_order: 2,
      storage_path: null,
    });
  });

  it('delete envía DELETE por id con auth header y no toca storage', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse('', true, 204, 'No Content'));
    vi.stubGlobal('fetch', fetchMock);

    await deleteAdminMotorcycleGalleryImageRecord('image-1', 'session-token');

    const url = getLastRequestUrl(fetchMock);
    const init = getLastRequestInit(fetchMock);

    expect(url.pathname).toBe('/rest/v1/motorcycle_images');
    expect(url.searchParams.get('id')).toBe('eq.image-1');
    expect(init).toMatchObject({
      method: 'DELETE',
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer session-token',
      },
    });
    expect(deleteMotorcycleImage).not.toHaveBeenCalled();
    expect(uploadMotorcycleImage).not.toHaveBeenCalled();
  });

  it('las escrituras fallan con error controlado si falta access token', async () => {
    await expect(
      createAdminMotorcycleGalleryImage({ motorcycleId: 'honda-cbr600rr-2026', url: galleryRow.url }, ''),
    ).rejects.toThrow('Access token is required');

    await expect(
      updateAdminMotorcycleGalleryImage('image-1', { altText: 'x' }, ''),
    ).rejects.toThrow('Access token is required');

    await expect(
      deleteAdminMotorcycleGalleryImageRecord('image-1', ''),
    ).rejects.toThrow('Access token is required');
  });

  it('maneja env faltante de forma consistente', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    await expect(getAdminMotorcycleGalleryImages('honda-cbr600rr-2026')).rejects.toThrow(
      'Missing VITE_SUPABASE_URL',
    );
  });

  it('propaga errores útiles de API en list/create/update/delete', async () => {
    stubSupabaseEnv();

    const listFetch = vi.fn().mockResolvedValue(jsonResponse({ message: 'forbidden' }, false, 403, 'Forbidden'));
    vi.stubGlobal('fetch', listFetch);
    await expect(getAdminMotorcycleGalleryImages('honda-cbr600rr-2026')).rejects.toThrow(
      'Admin motorcycle gallery request failed (403)',
    );

    const createFetch = vi.fn().mockResolvedValue(jsonResponse({ error: 'duplicate' }, false, 409, 'Conflict'));
    vi.stubGlobal('fetch', createFetch);
    await expect(
      createAdminMotorcycleGalleryImage({ motorcycleId: 'honda-cbr600rr-2026', url: galleryRow.url }, 'token'),
    ).rejects.toThrow('Admin motorcycle gallery request failed (409)');

    const updateFetch = vi.fn().mockResolvedValue(jsonResponse({ error: 'forbidden' }, false, 403, 'Forbidden'));
    vi.stubGlobal('fetch', updateFetch);
    await expect(
      updateAdminMotorcycleGalleryImage('image-1', { altText: 'x' }, 'token'),
    ).rejects.toThrow('Admin motorcycle gallery request failed (403)');

    const deleteFetch = vi.fn().mockResolvedValue(jsonResponse({ error: 'forbidden' }, false, 403, 'Forbidden'));
    vi.stubGlobal('fetch', deleteFetch);
    await expect(deleteAdminMotorcycleGalleryImageRecord('image-1', 'token')).rejects.toThrow(
      'Admin motorcycle gallery request failed (403)',
    );
  });

  it('no llama al servicio de upload ni modifica motorcycles.image_url', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([galleryRow]));
    vi.stubGlobal('fetch', fetchMock);

    await createAdminMotorcycleGalleryImage(
      {
        motorcycleId: 'honda-cbr600rr-2026',
        url: galleryRow.url,
      },
      'session-token',
    );

    const url = getLastRequestUrl(fetchMock);
    const init = getLastRequestInit(fetchMock);
    const body = JSON.parse(String(init?.body));

    expect(url.pathname).toBe('/rest/v1/motorcycle_images');
    expect(String(url)).not.toContain('/rest/v1/motorcycles');
    expect(body).not.toHaveProperty('image_url');
    expect(uploadMotorcycleImage).not.toHaveBeenCalled();
    expect(deleteMotorcycleImage).not.toHaveBeenCalled();
  });
});
