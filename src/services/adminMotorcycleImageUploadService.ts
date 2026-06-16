export const MOTORCYCLE_IMAGE_BUCKET = 'motorcycle-images';
export const MOTORCYCLE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const MOTORCYCLE_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AllowedMimeType = (typeof MOTORCYCLE_IMAGE_ALLOWED_TYPES)[number];

const MIME_TO_EXTENSION: Record<AllowedMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function getExtensionFromMime(mime: string): string | undefined {
  return MIME_TO_EXTENSION[mime as AllowedMimeType];
}

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para subir imágenes.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function assertAccessToken(accessToken: string): asserts accessToken is string {
  if (!accessToken?.trim()) {
    throw new Error('Se requiere un token de acceso para subir imágenes.');
  }
}

function assertMotorcycleId(motorcycleId: string): asserts motorcycleId is string {
  if (!motorcycleId?.trim()) {
    throw new Error('El ID de la motocicleta es obligatorio.');
  }

  if (motorcycleId.includes('/')) {
    throw new Error('El ID de la motocicleta no puede contener "/".');
  }

  if (motorcycleId.includes('..')) {
    throw new Error('El ID de la motocicleta no puede contener "..".');
  }

  if (/\s/.test(motorcycleId)) {
    throw new Error('El ID de la motocicleta no puede contener espacios.');
  }
}

function assertFile(file: File) {
  if (!file) {
    throw new Error('El archivo es obligatorio.');
  }

  if (file.size > MOTORCYCLE_IMAGE_MAX_SIZE) {
    throw new Error(
      `La imagen no puede superar los 5 MB. El archivo tiene ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
    );
  }

  if (!MOTORCYCLE_IMAGE_ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    throw new Error(
      `Formato de imagen no soportado. Permitidos: ${MOTORCYCLE_IMAGE_ALLOWED_TYPES.join(', ')}. Recibido: ${file.type}.`,
    );
  }
}

function generateUUID(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function generateObjectPath(motorcycleId: string, extension: string): string {
  const uuid = generateUUID();
  return `${motorcycleId}/${uuid}${extension}`;
}

function buildPublicUrl(supabaseUrl: string, objectPath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${MOTORCYCLE_IMAGE_BUCKET}/${objectPath}`;
}

function assertObjectPath(objectPath: string): asserts objectPath is string {
  if (!objectPath?.trim()) {
    throw new Error('La ruta del objeto es obligatoria.');
  }

  if (objectPath.includes('..')) {
    throw new Error('La ruta del objeto no puede contener "..".');
  }

  if (objectPath.startsWith('/')) {
    throw new Error('La ruta del objeto no puede comenzar con "/".');
  }

  if (!objectPath.includes('/')) {
    throw new Error('La ruta del objeto debe incluir un directorio de motocicleta.');
  }
}

export async function uploadMotorcycleImage(
  file: File,
  motorcycleId: string,
  accessToken: string,
): Promise<string> {
  assertAccessToken(accessToken);
  assertMotorcycleId(motorcycleId);
  assertFile(file);

  const config = getSupabaseConfig();
  const extension = getExtensionFromMime(file.type);

  if (!extension) {
    throw new Error(`Formato de imagen no soportado: ${file.type}.`);
  }

  const objectPath = generateObjectPath(motorcycleId, extension);

  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/${MOTORCYCLE_IMAGE_BUCKET}/${objectPath}`,
    {
      body: file,
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': file.type,
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Error al subir la imagen (${response.status}): ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`,
    );
  }

  return buildPublicUrl(config.supabaseUrl, objectPath);
}

export async function deleteMotorcycleImage(
  objectPath: string,
  accessToken: string,
): Promise<void> {
  assertAccessToken(accessToken);
  assertObjectPath(objectPath);

  const config = getSupabaseConfig();

  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/${MOTORCYCLE_IMAGE_BUCKET}/${objectPath}`,
    {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Error al eliminar la imagen (${response.status}): ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`,
    );
  }
}
