import { config as loadEnv } from 'dotenv';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { importPaths, readJsonFile } from '../src/features/import/importUtils';
import type { ImportLogger } from '../src/features/import/motorcycleImportTypes';
import { MOTORCYCLE_IMAGE_FALLBACK_URL } from '../src/shared/images/getMotorcycleImage';
import {
  getMotorcycleLocalImageFileName,
  getMotorcycleLocalImageUrl,
} from '../src/shared/images/motorcycleImageNaming';
import type { Bike } from '../src/types/bike';

loadEnv({ path: '.env.import', quiet: true });

type ExistingImageRow = Readonly<{
  id: string;
  image_locked: boolean;
  image_url: string;
}>;

type ImageUpdatePayload = Readonly<{
  id: string;
  image_source: 'manual' | 'placeholder';
  image_url: string;
}>;

type SupabaseImageClient = Readonly<{
  from: (table: 'motorcycles') => {
    select: (columns: string) => { in: (column: 'id', values: readonly string[]) => Promise<{ data: readonly ExistingImageRow[] | null; error: { message: string } | null }> };
    update: (payload: Omit<ImageUpdatePayload, 'id'>) => { eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }> };
  };
}>;

export type SyncMotorcycleImagesResult = Readonly<{
  detectedLocalCount: number;
  fallbackCount: number;
  lockedCount: number;
  readCount: number;
  updatedCount: number;
  updates: readonly ImageUpdatePayload[];
}>;

export type SyncMotorcycleImagesOptions = Readonly<{
  dryRun?: boolean;
  env?: NodeJS.ProcessEnv;
  existingRows?: readonly ExistingImageRow[];
  imageDirectory?: string;
  logger?: ImportLogger;
  motorcycles?: readonly Bike[];
  readLocalImage?: (filePath: string) => Promise<boolean>;
  supabase?: SupabaseImageClient;
}>;

const defaultImageDirectory = path.resolve(process.cwd(), 'public/images/motorcycles');

function getSupabaseImportConfig(env: NodeJS.ProcessEnv) {
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Revisa .env.import.');
  }

  return { serviceRoleKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function createImageSupabaseClient(env: NodeJS.ProcessEnv): SupabaseImageClient {
  const { serviceRoleKey, supabaseUrl } = getSupabaseImportConfig(env);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as SupabaseImageClient;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export { getMotorcycleLocalImageFileName, getMotorcycleLocalImageUrl };

async function readExistingRows(client: SupabaseImageClient, ids: readonly string[]) {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await client.from('motorcycles').select('id,image_url,image_locked').in('id', ids);

  if (error) {
    throw new Error(`No se pudieron leer imágenes existentes: ${error.message}`);
  }

  return data ?? [];
}

export async function syncMotorcycleImages({
  dryRun = false,
  env = process.env,
  existingRows,
  imageDirectory = defaultImageDirectory,
  logger = console,
  motorcycles,
  readLocalImage = fileExists,
  supabase,
}: SyncMotorcycleImagesOptions = {}): Promise<SyncMotorcycleImagesResult> {
  const sourceMotorcycles = motorcycles ?? (await readJsonFile<readonly Bike[]>(importPaths.motorcyclesFileUrl));
  const client = dryRun ? supabase : supabase ?? createImageSupabaseClient(env);
  const rows = existingRows ?? (client ? await readExistingRows(client, sourceMotorcycles.map((motorcycle) => motorcycle.id)) : []);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const updates: ImageUpdatePayload[] = [];
  let lockedCount = 0;
  let detectedLocalCount = 0;
  let fallbackCount = 0;

  for (const motorcycle of sourceMotorcycles) {
    const existing = rowsById.get(motorcycle.id);

    if (existing?.image_locked) {
      lockedCount += 1;
      logger.log(`🔒 image_url protegido: ${motorcycle.id}`);
      continue;
    }

    const fileName = getMotorcycleLocalImageFileName(motorcycle);
    const localImagePath = path.join(imageDirectory, fileName);
    const hasLocalImage = await readLocalImage(localImagePath);
    const imageUrl = hasLocalImage ? getMotorcycleLocalImageUrl(motorcycle) : MOTORCYCLE_IMAGE_FALLBACK_URL;
    const imageSource = hasLocalImage ? 'manual' : 'placeholder';

    if (hasLocalImage) {
      detectedLocalCount += 1;
    } else {
      fallbackCount += 1;
    }

    updates.push({ id: motorcycle.id, image_source: imageSource, image_url: imageUrl });
  }

  logger.log(`📦 Motos leídas: ${sourceMotorcycles.length}`);
  logger.log(`🖼️ Imágenes locales detectadas: ${detectedLocalCount}`);
  logger.log(`🧩 Fallbacks técnicos: ${fallbackCount}`);
  logger.log(`🔒 Protegidas: ${lockedCount}`);

  if (!dryRun) {
    if (!client) {
      throw new Error('No hay cliente Supabase para sincronizar imágenes.');
    }

    for (const update of updates) {
      const { error } = await client
        .from('motorcycles')
        .update({ image_source: update.image_source, image_url: update.image_url })
        .eq('id', update.id);

      if (error) {
        throw new Error(`No se pudo actualizar imagen de ${update.id}: ${error.message}`);
      }
    }
  } else {
    logger.log('🧪 Dry run: no se ha actualizado Supabase.');
  }

  logger.log(`✅ Imágenes sincronizadas: ${dryRun ? 0 : updates.length}`);

  return {
    detectedLocalCount,
    fallbackCount,
    lockedCount,
    readCount: sourceMotorcycles.length,
    updatedCount: dryRun ? 0 : updates.length,
    updates,
  };
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isDirectRun) {
  syncMotorcycleImages({ dryRun: process.argv.includes('--dry-run') }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Sincronización de imágenes fallida: ${message}`);
    process.exitCode = 1;
  });
}
