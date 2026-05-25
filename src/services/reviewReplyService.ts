import type { CreateReviewAuthContext } from './motorcycleReviewService';

const FALLBACK_USER_NAME = 'Usuario MotoAtlas';

function replyNameFallback(): string {
  return FALLBACK_USER_NAME;
}

export type ReviewReplyStatus = 'pending' | 'approved' | 'hidden' | 'rejected';

export type CreateReviewReplyInput = Readonly<{
  comment: string;
  reviewId: string;
  userName?: string;
}>;

export type ReviewReply = Readonly<{
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  comment: string;
  status: ReviewReplyStatus;
  createdAt: string;
  updatedAt: string;
}>;

type ReviewReplyRow = Readonly<{
  id: string;
  review_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  status: ReviewReplyStatus;
  created_at: string;
  updated_at: string;
}>;

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para respuestas de reviews.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function normalizeAuthContext(authContext: CreateReviewAuthContext | null | undefined) {
  const userId = authContext?.userId.trim();
  const accessToken = authContext?.accessToken.trim();

  if (!userId && !accessToken) {
    return null;
  }

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para responder reviews.');
  }

  return { accessToken, userId };
}

function mapReplyRow(row: ReviewReplyRow): ReviewReply {
  return {
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    userName: row.user_name.trim() || replyNameFallback(),
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildHeaders(config: ReturnType<typeof getSupabaseConfig>, accessToken?: string, extraHeaders?: Record<string, string>) {
  return {
    Accept: 'application/json',
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${accessToken ?? config.supabaseAnonKey}`,
    ...extraHeaders,
  };
}

async function assertSupabaseOk(response: Response) {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase review_replies request failed (${response.status}): ${errorBody}`);
  }
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  await assertSupabaseOk(response);
  return (await response.json()) as T;
}

export async function createReviewReply(
  input: CreateReviewReplyInput,
  authContext: CreateReviewAuthContext,
): Promise<ReviewReply> {
  const normalizedAuthContext = normalizeAuthContext(authContext);

  if (!normalizedAuthContext) {
    throw new Error('userId y accessToken son obligatorios para responder reviews.');
  }

  const reviewId = input.reviewId.trim();

  if (!reviewId) {
    throw new Error('reviewId es obligatorio para responder reviews.');
  }

  const comment = input.comment.trim();

  if (!comment) {
    throw new Error('comment es obligatorio para responder reviews.');
  }

  const userName = input.userName?.trim() || '';

  const config = getSupabaseConfig();
  const now = new Date().toISOString();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_replies`, {
    body: JSON.stringify({
      review_id: reviewId,
      user_id: normalizedAuthContext.userId,
      user_name: userName,
      comment,
    }),
    headers: buildHeaders(config, normalizedAuthContext.accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    method: 'POST',
  });

  await assertSupabaseOk(response);

  return {
    id: '',
    reviewId,
    userId: normalizedAuthContext.userId,
    userName: userName || replyNameFallback(),
    comment,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}

export async function getRepliesByReviewId(
  reviewId: string,
  authContext?: CreateReviewAuthContext | null,
): Promise<readonly ReviewReply[]> {
  const normalizedReviewId = reviewId.trim();

  if (!normalizedReviewId) {
    throw new Error('reviewId es obligatorio.');
  }

  const config = getSupabaseConfig();
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const params = new URLSearchParams({
    order: 'created_at.asc',
    review_id: `eq.${normalizedReviewId}`,
    select: 'id,review_id,user_id,user_name,comment,status,created_at,updated_at',
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_replies?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext?.accessToken),
  });
  const rows = await parseSupabaseResponse<ReviewReplyRow[]>(response);

  return rows.map(mapReplyRow);
}

export type ReviewReplyWithReview = Readonly<{
  reply: ReviewReply;
  review: Readonly<{
    id: string;
    userId: string | null;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}>;

type MotorcycleReviewForReplyRow = Readonly<{
  id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}>;

export async function getMyRepliesByMotorcycleId(
  motorcycleId: string,
  authContext: CreateReviewAuthContext,
): Promise<readonly ReviewReplyWithReview[]> {
  const normalizedMotorcycleId = motorcycleId.trim();

  if (!normalizedMotorcycleId) {
    return [];
  }

  const normalizedAuth = normalizeAuthContext(authContext);

  if (!normalizedAuth) {
    return [];
  }

  const config = getSupabaseConfig();
  const { accessToken, userId } = normalizedAuth;

  const reviewParams = new URLSearchParams({
    motorcycle_id: `eq.${normalizedMotorcycleId}`,
    order: 'created_at.desc',
    select: 'id,user_id,user_name,rating,comment,created_at',
  });

  const reviewResponse = await fetch(
    `${config.supabaseUrl}/rest/v1/motorcycle_reviews?${reviewParams.toString()}`,
    { headers: buildHeaders(config, accessToken) },
  );

  const reviewRows = await parseSupabaseResponse<MotorcycleReviewForReplyRow[]>(reviewResponse);

  if (reviewRows.length === 0) {
    return [];
  }

  const reviewIds = reviewRows.map((r) => r.id);
  const reviewById: Record<string, MotorcycleReviewForReplyRow> = {};

  for (const review of reviewRows) {
    reviewById[review.id] = review;
  }

  const replyParams = new URLSearchParams({
    order: 'created_at.asc',
    review_id: `in.(${reviewIds.join(',')})`,
    user_id: `eq.${userId}`,
    select: 'id,review_id,user_id,user_name,comment,status,created_at,updated_at',
  });

  const replyResponse = await fetch(
    `${config.supabaseUrl}/rest/v1/review_replies?${replyParams.toString()}`,
    { headers: buildHeaders(config, accessToken) },
  );

  const replyRows = await parseSupabaseResponse<ReviewReplyRow[]>(replyResponse);

  return replyRows.map((replyRow) => {
    const review = reviewById[replyRow.review_id];

    return {
      reply: mapReplyRow(replyRow),
      review: {
        id: replyRow.review_id,
        userId: review?.user_id ?? null,
        userName: review?.user_name ?? '',
        rating: review?.rating ?? 0,
        comment: review?.comment ?? '',
        createdAt: review?.created_at ?? '',
      },
    };
  });
}

export async function getRepliesByReviewIds(
  reviewIds: readonly string[],
  authContext?: CreateReviewAuthContext | null,
): Promise<readonly ReviewReply[]> {
  const normalizedIds = reviewIds.map((id) => id.trim()).filter(Boolean);

  if (normalizedIds.length === 0) {
    return [];
  }

  const config = getSupabaseConfig();
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const params = new URLSearchParams({
    order: 'created_at.asc',
    review_id: `in.(${normalizedIds.join(',')})`,
    select: 'id,review_id,user_id,user_name,comment,status,created_at,updated_at',
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_replies?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext?.accessToken),
  });
  const rows = await parseSupabaseResponse<ReviewReplyRow[]>(response);

  return rows.map(mapReplyRow);
}
