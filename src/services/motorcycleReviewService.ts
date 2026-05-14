export type MotorcycleReviewStatus = 'pending' | 'approved' | 'rejected';

export type MotorcycleReviewInput = Readonly<{
  motorcycleId: string;
  userName: string;
  rating: number;
  ownershipMonths?: number | null;
  kilometers?: number | null;
  comment: string;
  pros?: readonly string[];
  cons?: readonly string[];
}>;

export type MotorcycleReview = Readonly<{
  id: string;
  motorcycleId: string;
  userName: string;
  rating: number;
  ownershipMonths: number | null;
  kilometers: number | null;
  comment: string;
  pros: readonly string[];
  cons: readonly string[];
  status: MotorcycleReviewStatus;
  createdAt: string;
  updatedAt: string;
}>;

type MotorcycleReviewRow = Readonly<{
  id: string;
  motorcycle_id: string;
  user_name: string;
  rating: number;
  ownership_months: number | null;
  kilometers: number | null;
  comment: string;
  pros: readonly string[] | null;
  cons: readonly string[] | null;
  status: MotorcycleReviewStatus;
  created_at: string;
  updated_at: string;
}>;

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para reviews.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function normalizeTextArray(value: readonly string[] | undefined) {
  return Array.isArray(value) ? value.filter((item) => item.trim().length > 0) : [];
}

function assertValidReview(input: MotorcycleReviewInput) {
  if (!input.motorcycleId.trim()) {
    throw new Error('motorcycleId es obligatorio.');
  }

  if (!input.userName.trim()) {
    throw new Error('userName es obligatorio.');
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('rating debe ser un entero entre 1 y 5.');
  }

  if (!input.comment.trim()) {
    throw new Error('comment es obligatorio.');
  }
}

function mapReviewRow(row: MotorcycleReviewRow): MotorcycleReview {
  return {
    id: row.id,
    motorcycleId: row.motorcycle_id,
    userName: row.user_name,
    rating: row.rating,
    ownershipMonths: row.ownership_months,
    kilometers: row.kilometers,
    comment: row.comment,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildReviewPayload(input: MotorcycleReviewInput) {
  return {
    motorcycle_id: input.motorcycleId,
    user_name: input.userName.trim(),
    rating: input.rating,
    ownership_months: input.ownershipMonths ?? null,
    kilometers: input.kilometers ?? null,
    comment: input.comment.trim(),
    pros: normalizeTextArray(input.pros),
    cons: normalizeTextArray(input.cons),
    status: 'pending' satisfies MotorcycleReviewStatus,
  };
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase motorcycle_reviews request failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as T;
}

export async function createReview(input: MotorcycleReviewInput): Promise<MotorcycleReview> {
  assertValidReview(input);
  const config = getSupabaseConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews?select=*`, {
    body: JSON.stringify(buildReviewPayload(input)),
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    method: 'POST',
  });
  const rows = await parseSupabaseResponse<MotorcycleReviewRow[]>(response);
  const review = rows[0];

  if (!review) {
    throw new Error('Supabase no devolvió la review creada.');
  }

  return mapReviewRow(review);
}

export async function getApprovedReviewsByMotorcycleId(motorcycleId: string): Promise<readonly MotorcycleReview[]> {
  if (!motorcycleId.trim()) {
    throw new Error('motorcycleId es obligatorio.');
  }

  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    motorcycle_id: `eq.${motorcycleId}`,
    order: 'created_at.desc',
    select: '*',
    status: 'eq.approved',
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
  });
  const rows = await parseSupabaseResponse<MotorcycleReviewRow[]>(response);

  return rows.map(mapReviewRow);
}
