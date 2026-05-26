import type { BikeLicense, BikeSegment } from '../types/bike';

export type MotorcycleReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export type MotorcycleReviewRidingStyle = 'ciudad' | 'viaje' | 'offroad' | 'deportivo' | 'pasajero' | 'diario';
export type MotorcycleReviewSource = 'user' | 'mock' | 'seed' | 'import';
export type MotorcycleReviewAspectCategory = 'engine' | 'ergonomics' | 'consumption' | 'braking' | 'suspension' | 'electronics' | 'aerodynamics' | 'passenger' | 'maintenance' | 'price' | 'weight' | 'design';
export type MotorcycleReviewAspectSentiment = 'positive' | 'negative';

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

export type CreateReviewAuthContext = Readonly<{
  userId: string;
  accessToken: string;
}>;

export type MotorcycleReview = Readonly<{
  id: string;
  motorcycleId: string;
  userId?: string | null;
  motorcycle?: MotorcycleReviewMotorcycle | null;
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
  source?: MotorcycleReviewSource;
  createdAt: string;
  updatedAt: string;
}>;

export type MotorcycleReviewMotorcycle = Readonly<{
  id: string;
  brand: string;
  model: string;
  year: number;
  imageUrl: string;
  license?: BikeLicense | null;
  segment?: BikeSegment | null;
}>;

type MotorcycleReviewMotorcycleRow = Readonly<{
  id: string;
  brand: string;
  model: string;
  year: number;
  image_url?: string | null;
  license?: BikeLicense | null;
  segment?: BikeSegment | null;
}>;

type MotorcycleReviewRow = Readonly<{
  id: string;
  motorcycle_id: string;
  user_id?: string | null;
  motorcycles?: MotorcycleReviewMotorcycleRow | null;
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
  source?: MotorcycleReviewSource | null;
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
  return Array.isArray(value) ? value.filter((item) => String(item ?? '').trim().length > 0) : [];
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

function normalizeAuthContext(authContext: CreateReviewAuthContext | null | undefined) {
  const userId = authContext?.userId.trim();
  const accessToken = authContext?.accessToken.trim();

  if (!userId && !accessToken) {
    return null;
  }

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para reviews autenticadas.');
  }

  return { accessToken, userId };
}

function mapMotorcycleRow(row: MotorcycleReviewMotorcycleRow | null | undefined): MotorcycleReviewMotorcycle | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    brand: row.brand,
    license: row.license ?? null,
    model: row.model,
    segment: row.segment ?? null,
    year: row.year,
    imageUrl: row.image_url ?? '',
  };
}

function mapReviewRow(row: MotorcycleReviewRow): MotorcycleReview {
  return {
    id: row.id,
    motorcycleId: row.motorcycle_id,
    userId: row.user_id ?? null,
    motorcycle: mapMotorcycleRow(row.motorcycles),
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
    source: row.source ?? 'user',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildReviewPayload(input: MotorcycleReviewInput, authContext?: CreateReviewAuthContext) {
  const normalizedAuthContext = normalizeAuthContext(authContext);

  return {
    motorcycle_id: input.motorcycleId,
    user_id: normalizedAuthContext?.userId ?? null,
    user_name: input.userName.trim(),
    rating: input.rating,
    riding_style: input.ridingStyle,
    ownership_months: input.ownershipMonths ?? null,
    kilometers: input.kilometers ?? null,
    comment: input.comment.trim(),
    pros: normalizeTextArray(input.pros),
    cons: normalizeTextArray(input.cons),
    source: 'user' as const,
    verified: false,
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
    userId: payload.user_id,
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
    source: payload.source,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function createReview(input: MotorcycleReviewInput, authContext?: CreateReviewAuthContext): Promise<MotorcycleReview> {
  assertValidReview(input);
  const config = getSupabaseConfig();
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const payload = buildReviewPayload(input, normalizedAuthContext ?? undefined);
  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews`, {
    body: JSON.stringify(payload),
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext?.accessToken ?? config.supabaseAnonKey}`,
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

export async function getApprovedCommunityReviews(): Promise<readonly MotorcycleReview[]> {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    order: 'created_at.desc',
    select: 'id,motorcycle_id,user_id,user_name,rating,riding_style,ownership_months,kilometers,comment,pros,cons,status,verified,source,created_at,updated_at,motorcycles(id,brand,model,year,segment,license,image_url)',
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

  return rows.map(mapReviewRow).filter((review) => review.status === 'approved');
}

export async function getReviewsByUserId(authContext?: CreateReviewAuthContext | null): Promise<readonly MotorcycleReview[]> {
  if (!authContext?.userId.trim()) {
    return [];
  }

  const normalizedAuthContext = normalizeAuthContext(authContext);
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    order: 'created_at.desc',
    select: 'id,motorcycle_id,user_id,user_name,rating,riding_style,ownership_months,kilometers,comment,pros,cons,status,verified,source,created_at,updated_at,motorcycles(id,brand,model,year,image_url)',
    user_id: `eq.${normalizedAuthContext?.userId}`,
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext?.accessToken}`,
    },
  });
  const rows = await parseSupabaseResponse<MotorcycleReviewRow[]>(response);

  return rows.map(mapReviewRow);
}

export async function getReviewsByMotorcycleId(motorcycleId: string, authContext?: CreateReviewAuthContext | null): Promise<readonly MotorcycleReview[]> {
  if (!motorcycleId.trim()) {
    throw new Error('motorcycleId es obligatorio.');
  }

  const normalizedAuthContext = normalizeAuthContext(authContext);
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    motorcycle_id: `eq.${motorcycleId}`,
    order: 'created_at.desc',
    select: 'id,motorcycle_id,user_id,user_name,rating,riding_style,ownership_months,kilometers,comment,pros,cons,status,verified,source,created_at,updated_at,motorcycles(id,brand,model,year,image_url)',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext?.accessToken ?? config.supabaseAnonKey}`,
    },
  });

  const rows = await parseSupabaseResponse<MotorcycleReviewRow[]>(response);

  return rows.map(mapReviewRow);
}

export type MotorcycleReviewAspectInput = Readonly<{
  category: MotorcycleReviewAspectCategory;
  sentiment: MotorcycleReviewAspectSentiment;
  comment?: string | null;
}>;

const VALID_ASPECT_CATEGORIES: readonly string[] = [
  'engine', 'ergonomics', 'consumption', 'braking', 'suspension',
  'electronics', 'aerodynamics', 'passenger', 'maintenance',
  'price', 'weight', 'design',
];

const VALID_ASPECT_SENTIMENTS: readonly string[] = ['positive', 'negative'];

function isValidAspectCategory(value: unknown): value is MotorcycleReviewAspectCategory {
  return VALID_ASPECT_CATEGORIES.includes(String(value));
}

function isValidAspectSentiment(value: unknown): value is MotorcycleReviewAspectSentiment {
  return VALID_ASPECT_SENTIMENTS.includes(String(value));
}

function buildAspectsPayload(reviewId: string, aspects: readonly MotorcycleReviewAspectInput[]) {
  return aspects.map((aspect) => ({
    review_id: reviewId,
    category: aspect.category,
    sentiment: aspect.sentiment,
    comment: aspect.comment != null && String(aspect.comment).trim() !== '' ? String(aspect.comment).trim() : null,
  }));
}

export async function createMotorcycleReviewAspects(
  reviewId: string,
  aspects: readonly MotorcycleReviewAspectInput[],
  authContext?: CreateReviewAuthContext | null,
): Promise<void> {
  if (!reviewId.trim()) {
    throw new Error('reviewId es obligatorio.');
  }

  if (!Array.isArray(aspects) || aspects.length === 0) {
    return;
  }

  const normalizedAuthContext = normalizeAuthContext(authContext);
  if (!normalizedAuthContext) {
    throw new Error('authContext es obligatorio para insertar aspectos de review.');
  }

  for (const aspect of aspects) {
    if (!isValidAspectCategory(aspect.category)) {
      throw new Error(`Categoría de aspecto inválida: ${aspect.category}.`);
    }

    if (!isValidAspectSentiment(aspect.sentiment)) {
      throw new Error(`Sentimiento de aspecto inválido: ${aspect.sentiment}.`);
    }
  }

  const config = getSupabaseConfig();
  const payload = buildAspectsPayload(reviewId, aspects);

  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_review_aspects`, {
    body: JSON.stringify(payload),
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    method: 'POST',
  });

  await assertSupabaseOk(response);
}
