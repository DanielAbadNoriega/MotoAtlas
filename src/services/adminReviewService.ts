import type { CreateReviewAuthContext, MotorcycleReview, MotorcycleReviewStatus } from './motorcycleReviewService';

export type AdminReviewFilters = Readonly<{
  status: 'all' | MotorcycleReviewStatus;
  source: 'all' | 'user' | 'mock' | 'seed' | 'import';
  verified: 'all' | 'verified' | 'unverified';
  sort: 'recent' | 'old';
}>;

type MotorcycleReviewMotorcycleRow = Readonly<{
  id: string;
  brand: string;
  model: string;
  year: number;
  image_url?: string | null;
}>;

type MotorcycleReviewRow = Readonly<{
  id: string;
  motorcycle_id: string;
  user_id?: string | null;
  motorcycles?: MotorcycleReviewMotorcycleRow | null;
  user_name: string;
  rating: number;
  riding_style?: string;
  ownership_months: number | null;
  kilometers: number | null;
  comment: string;
  pros: readonly string[] | null;
  cons: readonly string[] | null;
  verified?: boolean | null;
  status: MotorcycleReviewStatus;
  source?: string | null;
  created_at: string;
  updated_at: string;
}>;

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para admin reviews.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function normalizeAuthContext(authContext: CreateReviewAuthContext | null | undefined) {
  const userId = authContext?.userId.trim();
  const accessToken = authContext?.accessToken.trim();

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para admin reviews.');
  }

  return { accessToken, userId };
}

async function assertSupabaseOk(response: Response, resource: string) {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase ${resource} request failed (${response.status}): ${errorBody}`);
  }
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  await assertSupabaseOk(response, 'motorcycle_reviews');
  return (await response.json()) as T;
}

function mapReviewRow(row: MotorcycleReviewRow): MotorcycleReview {
  const motorcycle = row.motorcycles;

  return {
    id: row.id,
    motorcycleId: row.motorcycle_id,
    userId: row.user_id ?? null,
    motorcycle: motorcycle
      ? {
          id: motorcycle.id,
          brand: motorcycle.brand,
          model: motorcycle.model,
          year: motorcycle.year,
          imageUrl: motorcycle.image_url ?? '',
        }
      : null,
    userName: row.user_name,
    rating: row.rating,
    ridingStyle: (row.riding_style as MotorcycleReview['ridingStyle']) ?? 'diario',
    ownershipMonths: row.ownership_months,
    kilometers: row.kilometers,
    comment: row.comment,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    verified: row.verified === true,
    status: row.status,
    source: (row.source as MotorcycleReview['source']) ?? 'user',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const adminUpdateStatuses = new Set<MotorcycleReviewStatus>(['approved', 'rejected', 'hidden']);

export async function updateAdminReviewStatus(
  reviewId: string,
  status: MotorcycleReviewStatus,
  authContext: CreateReviewAuthContext,
): Promise<void> {
  const normalizedReviewId = reviewId.trim();
  const normalizedAuthContext = normalizeAuthContext(authContext);

  if (!normalizedReviewId) {
    throw new Error('reviewId es obligatorio para admin reviews.');
  }

  if (!adminUpdateStatuses.has(status)) {
    throw new Error(`Estado inválido para actualizar review admin: ${status}`);
  }

  const config = getSupabaseConfig();
  const params = new URLSearchParams({ id: `eq.${normalizedReviewId}` });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews?${params.toString()}`, {
    body: JSON.stringify({ status }),
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    method: 'PATCH',
  });

  await assertSupabaseOk(response, 'motorcycle_reviews');
}

export async function getAllReviews(
  authContext: CreateReviewAuthContext,
): Promise<readonly MotorcycleReview[]> {
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    order: 'created_at.desc',
    select: [
      'id',
      'motorcycle_id',
      'user_id',
      'user_name',
      'rating',
      'riding_style',
      'ownership_months',
      'kilometers',
      'comment',
      'pros',
      'cons',
      'verified',
      'status',
      'source',
      'created_at',
      'updated_at',
      'motorcycles(id,brand,model,year,image_url)',
    ].join(','),
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext.accessToken}`,
    },
  });
  const rows = await parseSupabaseResponse<MotorcycleReviewRow[]>(response);

  return rows.map(mapReviewRow);
}
