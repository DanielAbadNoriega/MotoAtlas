import type { MotorcycleDataSource } from '../types/bike';

export type AdminMotorcycleGalleryImageRow = Readonly<{
  id: string;
  motorcycle_id: string;
  url: string;
  storage_path: string | null;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  source: MotorcycleDataSource;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}>;

export type AdminMotorcycleGalleryImage = Readonly<{
  id: string;
  motorcycleId: string;
  url: string;
  storagePath: string | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  source: MotorcycleDataSource;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateAdminMotorcycleGalleryImageInput = Readonly<{
  motorcycleId: string;
  url: string;
  storagePath?: string | null;
  altText?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
  source?: MotorcycleDataSource;
  createdBy?: string | null;
}>;

export type UpdateAdminMotorcycleGalleryImageInput = Readonly<{
  motorcycleId?: string;
  url?: string;
  storagePath?: string | null;
  altText?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
  source?: MotorcycleDataSource;
}>;

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for admin motorcycle gallery operations.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function assertAccessToken(accessToken: string): asserts accessToken is string {
  if (!accessToken?.trim()) {
    throw new Error('Access token is required for admin motorcycle gallery operations.');
  }
}

function assertMotorcycleId(motorcycleId: string): asserts motorcycleId is string {
  if (!motorcycleId?.trim()) {
    throw new Error('Motorcycle id is required for gallery operations.');
  }
}

function assertImageId(imageId: string): asserts imageId is string {
  if (!imageId?.trim()) {
    throw new Error('Gallery image id is required for this operation.');
  }
}

async function assertResponseOk(response: Response) {
  if (response.ok) {
    return;
  }

  const errorBody = await response.text().catch(() => '');
  throw new Error(
    `Admin motorcycle gallery request failed (${response.status}): ${errorBody || response.statusText}`,
  );
}

function buildHeaders(
  config: ReturnType<typeof getSupabaseConfig>,
  accessToken?: string,
  extraHeaders?: Record<string, string>,
) {
  return {
    Accept: 'application/json',
    apikey: config.supabaseAnonKey,
    ...(accessToken?.trim() ? { Authorization: `Bearer ${accessToken.trim()}` } : {}),
    ...extraHeaders,
  };
}

function mapAdminMotorcycleGalleryImageRow(row: AdminMotorcycleGalleryImageRow): AdminMotorcycleGalleryImage {
  return {
    id: row.id,
    motorcycleId: row.motorcycle_id,
    url: row.url,
    storagePath: row.storage_path ?? null,
    altText: row.alt_text ?? null,
    isPrimary: Boolean(row.is_primary),
    sortOrder: row.sort_order,
    source: row.source,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCreateBody(input: CreateAdminMotorcycleGalleryImageInput) {
  return {
    motorcycle_id: input.motorcycleId,
    url: input.url,
    storage_path: input.storagePath ?? null,
    alt_text: input.altText ?? null,
    is_primary: input.isPrimary ?? false,
    sort_order: input.sortOrder ?? 0,
    source: input.source ?? 'manual',
    created_by: input.createdBy ?? null,
  };
}

function toUpdateBody(input: UpdateAdminMotorcycleGalleryImageInput) {
  const body: Record<string, unknown> = {};

  if (input.motorcycleId !== undefined) body.motorcycle_id = input.motorcycleId;
  if (input.url !== undefined) body.url = input.url;
  if (input.storagePath !== undefined) body.storage_path = input.storagePath;
  if (input.altText !== undefined) body.alt_text = input.altText;
  if (input.isPrimary !== undefined) body.is_primary = input.isPrimary;
  if (input.sortOrder !== undefined) body.sort_order = input.sortOrder;
  if (input.source !== undefined) body.source = input.source;

  return body;
}

export async function getAdminMotorcycleGalleryImages(
  motorcycleId: string,
  accessToken?: string,
): Promise<readonly AdminMotorcycleGalleryImage[]> {
  assertMotorcycleId(motorcycleId);
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    select: '*',
    motorcycle_id: `eq.${motorcycleId.trim()}`,
    order: 'sort_order.asc,created_at.asc',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_images?${params.toString()}`, {
    headers: buildHeaders(config, accessToken),
    method: 'GET',
  });

  await assertResponseOk(response);
  const rows = (await response.json()) as AdminMotorcycleGalleryImageRow[];

  return rows.map(mapAdminMotorcycleGalleryImageRow);
}

export async function createAdminMotorcycleGalleryImage(
  input: CreateAdminMotorcycleGalleryImageInput,
  accessToken: string,
): Promise<AdminMotorcycleGalleryImage> {
  assertAccessToken(accessToken);
  assertMotorcycleId(input.motorcycleId);
  const config = getSupabaseConfig();

  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_images`, {
    body: JSON.stringify(toCreateBody(input)),
    headers: buildHeaders(config, accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    method: 'POST',
  });

  await assertResponseOk(response);
  const rows = (await response.json()) as AdminMotorcycleGalleryImageRow[];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Admin motorcycle gallery create request returned no rows.');
  }

  return mapAdminMotorcycleGalleryImageRow(rows[0]);
}

export async function updateAdminMotorcycleGalleryImage(
  imageId: string,
  updates: UpdateAdminMotorcycleGalleryImageInput,
  accessToken: string,
): Promise<AdminMotorcycleGalleryImage> {
  assertAccessToken(accessToken);
  assertImageId(imageId);
  const config = getSupabaseConfig();

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/motorcycle_images?id=eq.${encodeURIComponent(imageId.trim())}`,
    {
      body: JSON.stringify(toUpdateBody(updates)),
      headers: buildHeaders(config, accessToken, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      method: 'PATCH',
    },
  );

  await assertResponseOk(response);
  const rows = (await response.json()) as AdminMotorcycleGalleryImageRow[];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`Motorcycle gallery image with id "${imageId}" not found for update.`);
  }

  return mapAdminMotorcycleGalleryImageRow(rows[0]);
}

export async function deleteAdminMotorcycleGalleryImageRecord(
  imageId: string,
  accessToken: string,
): Promise<void> {
  assertAccessToken(accessToken);
  assertImageId(imageId);
  const config = getSupabaseConfig();

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/motorcycle_images?id=eq.${encodeURIComponent(imageId.trim())}`,
    {
      headers: buildHeaders(config, accessToken),
      method: 'DELETE',
    },
  );

  await assertResponseOk(response);
}
