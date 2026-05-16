export type MotorcycleReviewStatus = 'pending' | 'approved' | 'rejected';
export type MotorcycleReviewRidingStyle = 'ciudad' | 'viaje' | 'offroad' | 'deportivo' | 'pasajero' | 'diario';

export type MotorcycleReviewInput = Readonly<{
  motorcycleId: string;
  userName: string;
  rating: number;
  ridingStyle: MotorcycleReviewRidingStyle;
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
  ridingStyle: MotorcycleReviewRidingStyle;
  ownershipMonths: number | null;
  kilometers: number | null;
  comment: string;
  pros: readonly string[];
  cons: readonly string[];
  verified: boolean;
  status: MotorcycleReviewStatus;
  createdAt: string;
  updatedAt: string;
}>;

type MotorcycleReviewRow = Readonly<{
  id: string;
  motorcycle_id: string;
  user_name: string;
  rating: number;
  riding_style?: MotorcycleReviewRidingStyle;
  ownership_months: number | null;
  kilometers: number | null;
  comment: string;
  pros: readonly string[] | null;
  cons: readonly string[] | null;
  verified?: boolean | null;
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

function isValidRidingStyle(value: unknown): value is MotorcycleReviewRidingStyle {
  return ['ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario'].includes(String(value));
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

  if (!isValidRidingStyle(input.ridingStyle)) {
    throw new Error('ridingStyle es obligatorio.');
  }

  if (
    input.ownershipMonths !== undefined &&
    input.ownershipMonths !== null &&
    (!Number.isFinite(input.ownershipMonths) || input.ownershipMonths < 0)
  ) {
    throw new Error('ownershipMonths debe ser mayor o igual que 0.');
  }

  if (
    input.kilometers !== undefined &&
    input.kilometers !== null &&
    (!Number.isFinite(input.kilometers) || input.kilometers < 0)
  ) {
    throw new Error('kilometers debe ser mayor o igual que 0.');
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
    ridingStyle: row.riding_style ?? 'diario',
    ownershipMonths: row.ownership_months,
    kilometers: row.kilometers,
    comment: row.comment,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    verified: row.verified === true,
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
    riding_style: input.ridingStyle,
    ownership_months: input.ownershipMonths ?? null,
    kilometers: input.kilometers ?? null,
    comment: input.comment.trim(),
    pros: normalizeTextArray(input.pros),
    cons: normalizeTextArray(input.cons),
    status: 'pending' as const satisfies MotorcycleReviewStatus,
  };
}

type ReviewPayload = ReturnType<typeof buildReviewPayload>;

async function assertSupabaseOk(response: Response) {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase motorcycle_reviews request failed (${response.status}): ${errorBody}`);
  }
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  await assertSupabaseOk(response);
  return (await response.json()) as T;
}

function mapPendingPayloadToReview(payload: ReviewPayload): MotorcycleReview {
  const timestamp = new Date().toISOString();

  return {
    id: '',
    motorcycleId: payload.motorcycle_id,
    userName: payload.user_name,
    rating: payload.rating,
    ridingStyle: payload.riding_style,
    ownershipMonths: payload.ownership_months,
    kilometers: payload.kilometers,
    comment: payload.comment,
    pros: payload.pros,
    cons: payload.cons,
    verified: false,
    status: payload.status,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function createReview(input: MotorcycleReviewInput): Promise<MotorcycleReview> {
  assertValidReview(input);
  const config = getSupabaseConfig();
  const payload = buildReviewPayload(input);
  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews`, {
    body: JSON.stringify(payload),
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    method: 'POST',
  });
  await assertSupabaseOk(response);

  return mapPendingPayloadToReview(payload);
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
