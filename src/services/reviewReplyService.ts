import type { CreateReviewAuthContext } from './motorcycleReviewService';

export type ReviewReplyStatus = 'pending' | 'approved' | 'hidden' | 'rejected';

export type CreateReviewReplyInput = Readonly<{
  comment: string;
  reviewId: string;
}>;

export type ReviewReply = Readonly<{
  id: string;
  reviewId: string;
  userId: string;
  comment: string;
  status: ReviewReplyStatus;
  createdAt: string;
  updatedAt: string;
}>;

type ReviewReplyRow = Readonly<{
  id: string;
  review_id: string;
  user_id: string;
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

  const config = getSupabaseConfig();
  const now = new Date().toISOString();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_replies`, {
    body: JSON.stringify({
      review_id: reviewId,
      user_id: normalizedAuthContext.userId,
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
    select: 'id,review_id,user_id,comment,status,created_at,updated_at',
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_replies?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext?.accessToken),
  });
  const rows = await parseSupabaseResponse<ReviewReplyRow[]>(response);

  return rows.map(mapReplyRow);
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
    select: 'id,review_id,user_id,comment,status,created_at,updated_at',
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_replies?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext?.accessToken),
  });
  const rows = await parseSupabaseResponse<ReviewReplyRow[]>(response);

  return rows.map(mapReplyRow);
}
