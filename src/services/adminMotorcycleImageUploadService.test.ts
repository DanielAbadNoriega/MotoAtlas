import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deleteMotorcycleImage,
  MOTORCYCLE_IMAGE_ALLOWED_TYPES,
  MOTORCYCLE_IMAGE_BUCKET,
  MOTORCYCLE_IMAGE_MAX_SIZE,
  uploadMotorcycleImage,
} from './adminMotorcycleImageUploadService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const TEST_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const MOCKED_PUBLIC_URL =
  'https://example.supabase.co/storage/v1/object/public/motorcycle-images/honda-cbr600rr-2026/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg';

function stubCrypto() {
  vi.stubGlobal('crypto', { randomUUID: () => TEST_UUID });
}

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

function createFile(
  name: string,
  type: string,
  size = 1024,
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('uploadMotorcycleImage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('lanza error si faltan env vars', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    await expect(
      uploadMotorcycleImage(createFile('test.jpg', 'image/jpeg'), 'honda-cbr600rr-2026', 'token'),
    ).rejects.toThrow('Faltan VITE_SUPABASE_URL');
  });

  it('lanza error si falta access token', async () => {
    await expect(
      uploadMotorcycleImage(createFile('test.jpg', 'image/jpeg'), 'honda-cbr600rr-2026', ''),
    ).rejects.toThrow('Se requiere un token de acceso');
  });

  it('lanza error si motorcycleId está vacío', async () => {
    stubSupabaseEnv();

    await expect(
      uploadMotorcycleImage(createFile('test.jpg', 'image/jpeg'), '', 'token'),
    ).rejects.toThrow('El ID de la motocicleta es obligatorio');
  });

  it('lanza error si motorcycleId contiene /', async () => {
    stubSupabaseEnv();

    await expect(
      uploadMotorcycleImage(createFile('test.jpg', 'image/jpeg'), 'honda/cbr', 'token'),
    ).rejects.toThrow('no puede contener "/"');
  });

  it('lanza error si motorcycleId contiene ..', async () => {
    stubSupabaseEnv();

    await expect(
      uploadMotorcycleImage(createFile('test.jpg', 'image/jpeg'), 'honda..cbr', 'token'),
    ).rejects.toThrow('no puede contener ".."');
  });

  it('lanza error si motorcycleId contiene espacios', async () => {
    stubSupabaseEnv();

    await expect(
      uploadMotorcycleImage(createFile('test.jpg', 'image/jpeg'), 'honda cbr', 'token'),
    ).rejects.toThrow('no puede contener espacios');
  });

  it('lanza error si file type no es soportado', async () => {
    stubSupabaseEnv();
    const gifFile = createFile('test.gif', 'image/gif');

    await expect(
      uploadMotorcycleImage(gifFile, 'honda-cbr600rr-2026', 'token'),
    ).rejects.toThrow('Formato de imagen no soportado');
  });

  it('lanza error si file es mayor a 5 MB', async () => {
    stubSupabaseEnv();
    const largeFile = createFile('large.jpg', 'image/jpeg', MOTORCYCLE_IMAGE_MAX_SIZE + 1);

    await expect(
      uploadMotorcycleImage(largeFile, 'honda-cbr600rr-2026', 'token'),
    ).rejects.toThrow('no puede superar los 5 MB');
  });

  it('sube JPEG preservando extensión .jpg', async () => {
    stubSupabaseEnv();
    stubCrypto();
    const file = createFile('moto.jpg', 'image/jpeg');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    const url = await uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'session-token');

    expect(url).toBe(MOCKED_PUBLIC_URL);
    const [requestUrl, init] = fetchMock.mock.calls[0];
    expect(requestUrl).toContain('.jpg');
    expect(init?.method).toBe('POST');
  });

  it('sube PNG preservando extensión .png', async () => {
    stubSupabaseEnv();
    stubCrypto();
    const file = createFile('moto.png', 'image/png');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    const url = await uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'session-token');

    expect(url).toContain('.png');
    const [requestUrl] = fetchMock.mock.calls[0];
    expect(requestUrl).toContain('.png');
  });

  it('sube WebP preservando extensión .webp', async () => {
    stubSupabaseEnv();
    stubCrypto();
    const file = createFile('moto.webp', 'image/webp');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    const url = await uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'session-token');

    expect(url).toContain('.webp');
    const [requestUrl] = fetchMock.mock.calls[0];
    expect(requestUrl).toContain('.webp');
  });

  it('envía anon key y Bearer token en headers', async () => {
    stubSupabaseEnv();
    stubCrypto();
    const file = createFile('moto.jpg', 'image/jpeg');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'session-token');

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).toMatchObject({
      apikey: 'anon-key',
      Authorization: 'Bearer session-token',
    });
  });

  it('envía Content-Type correcto según el archivo', async () => {
    stubSupabaseEnv();
    stubCrypto();
    const file = createFile('moto.png', 'image/png');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'session-token');

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).toMatchObject({
      'Content-Type': 'image/png',
    });
  });

  it('retorna la URL pública esperada', async () => {
    stubSupabaseEnv();
    stubCrypto();
    const file = createFile('moto.jpg', 'image/jpeg');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    const url = await uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'session-token');

    expect(url).toBe(
      'https://example.supabase.co/storage/v1/object/public/motorcycle-images/honda-cbr600rr-2026/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg',
    );
  });

  it('lanza error controlado si HTTP no es ok', async () => {
    stubSupabaseEnv();
    stubCrypto();
    const file = createFile('moto.jpg', 'image/jpeg');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, false, 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'token'),
    ).rejects.toThrow('Error al subir la imagen (401)');
  });

  it('propaga errores de red', async () => {
    stubSupabaseEnv();
    stubCrypto();
    const file = createFile('moto.jpg', 'image/jpeg');
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network failure'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'token'),
    ).rejects.toThrow('Network failure');
  });

  it('genera UUID válido incluso sin crypto.randomUUID', async () => {
    stubSupabaseEnv();
    stubCrypto();
    vi.stubGlobal('crypto', {}); // sin randomUUID
    const file = createFile('moto.jpg', 'image/jpeg');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    const url = await uploadMotorcycleImage(file, 'honda-cbr600rr-2026', 'session-token');

    const pathSegment = url.split('/').pop()!;
    const uuidPart = pathSegment.replace(/\.jpg$/, '');
    expect(uuidPart).toMatch(UUID_REGEX);
  });
});

describe('deleteMotorcycleImage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('lanza error si falta access token', async () => {
    await expect(deleteMotorcycleImage('honda-cbr600rr-2026/test.jpg', '')).rejects.toThrow(
      'Se requiere un token de acceso',
    );
  });

  it('lanza error si objectPath está vacío', async () => {
    stubSupabaseEnv();

    await expect(deleteMotorcycleImage('', 'token')).rejects.toThrow(
      'La ruta del objeto es obligatoria',
    );
  });

  it('lanza error si objectPath contiene ..', async () => {
    stubSupabaseEnv();

    await expect(deleteMotorcycleImage('../test.jpg', 'token')).rejects.toThrow(
      'no puede contener ".."',
    );
  });

  it('lanza error si objectPath comienza con /', async () => {
    stubSupabaseEnv();

    await expect(deleteMotorcycleImage('/honda/test.jpg', 'token')).rejects.toThrow(
      'no puede comenzar con "/"',
    );
  });

  it('lanza error si objectPath no tiene directorio', async () => {
    stubSupabaseEnv();

    await expect(deleteMotorcycleImage('test.jpg', 'token')).rejects.toThrow(
      'debe incluir un directorio de motocicleta',
    );
  });

  it('envía DELETE con anon key y Bearer token', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await deleteMotorcycleImage('honda-cbr600rr-2026/test.jpg', 'session-token');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://example.supabase.co/storage/v1/object/motorcycle-images/honda-cbr600rr-2026/test.jpg',
    );
    expect(init).toMatchObject({
      method: 'DELETE',
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer session-token',
      },
    });
  });

  it('resuelve void en success', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      deleteMotorcycleImage('honda-cbr600rr-2026/test.jpg', 'token'),
    ).resolves.toBeUndefined();
  });

  it('lanza error controlado si HTTP no es ok', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Not Found' }, false, 404));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      deleteMotorcycleImage('honda-cbr600rr-2026/test.jpg', 'token'),
    ).rejects.toThrow('Error al eliminar la imagen (404)');
  });

  it('lanza error en fallo de red', async () => {
    stubSupabaseEnv();
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network failure'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      deleteMotorcycleImage('honda-cbr600rr-2026/test.jpg', 'token'),
    ).rejects.toThrow('Network failure');
  });
});
