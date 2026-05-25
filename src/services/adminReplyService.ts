import type { CreateReviewAuthContext } from './motorcycleReviewService';
import type { ReviewReplyStatus } from './reviewReplyService';

export type AdminReviewReply = Readonly<{
  id: string;
  reviewId: string;
  userId: string;
  comment: string;
  status: ReviewReplyStatus;
  createdAt: string;
  updatedAt: string;
  review: {
    comment: string;
    userName: string;
    motorcycle: {
      brand: string;
      id: string;
      imageUrl: string;
      model: string;
      year: number;
    } | null;
    motorcycleId: string;
  } | null;
}>;

type MotorcycleRow = Readonly<{
  brand: string;
  id: string;
  image_url?: string | null;
  model: string;
  year: number;
}>;

type ReviewRow = Readonly<{
  comment: string;
  id: string;
  motorcycle_id: string;
  motorcycles?: MotorcycleRow | null;
  user_name: string;
}>;

type ReplyRow = Readonly<{
  id: string;
  review_id: string;
  user_id: string;
  comment: string;
  status: ReviewReplyStatus;
  created_at: string;
  updated_at: string;
  motorcycle_reviews?: ReviewRow | null;
}>;

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para administración de respuestas.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function normalizeAuthContext(authContext: CreateReviewAuthContext | null | undefined) {
  const userId = authContext?.userId.trim();
  const accessToken = authContext?.accessToken.trim();

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para administración de respuestas.');
  }

  return { accessToken, userId };
}

function buildHeaders(config: ReturnType<typeof getSupabaseConfig>, accessToken: string, extraHeaders?: Record<string, string>) {
  return {
    Accept: 'application/json',
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    ...extraHeaders,
  };
}

async function assertSupabaseOk(response: Response, resource: string) {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase ${resource} request failed (${response.status}): ${errorBody}`);
  }
}

function mapReplyRow(row: ReplyRow): AdminReviewReply {
  return {
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    review: row.motorcycle_reviews
      ? {
          comment: row.motorcycle_reviews.comment,
          userName: row.motorcycle_reviews.user_name,
          motorcycle: row.motorcycle_reviews.motorcycles
            ? {
                brand: row.motorcycle_reviews.motorcycles.brand,
                id: row.motorcycle_reviews.motorcycles.id,
                imageUrl: row.motorcycle_reviews.motorcycles.image_url ?? '',
                model: row.motorcycle_reviews.motorcycles.model,
                year: row.motorcycle_reviews.motorcycles.year,
              }
            : null,
          motorcycleId: row.motorcycle_reviews.motorcycle_id,
        }
      : null,
  };
}

export async function getAdminPendingReplies(
  authContext: CreateReviewAuthContext,
): Promise<readonly AdminReviewReply[]> {
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    order: 'created_at.asc',
    status: 'eq.pending',
    select: [
      'id',
      'review_id',
      'user_id',
      'comment',
      'status',
      'created_at',
      'updated_at',
      'motorcycle_reviews(id,user_name,comment,motorcycle_id,motorcycles(id,brand,model,year,image_url))',
    ].join(','),
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_replies?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext.accessToken),
  });
  await assertSupabaseOk(response, 'review_replies');
  const rows = (await response.json()) as ReplyRow[];

  return rows.map(mapReplyRow);
}

const validStatuses = new Set<ReviewReplyStatus>(['approved', 'hidden', 'rejected']);

export async function updateReviewReplyStatus(
  replyId: string,
  status: Exclude<ReviewReplyStatus, 'pending'>,
  authContext: CreateReviewAuthContext,
): Promise<void> {
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const config = getSupabaseConfig();

  if (!validStatuses.has(status)) {
    throw new Error(`Estado inválido: ${status}`);
  }

  const normalizedReplyId = replyId.trim();

  if (!normalizedReplyId) {
    throw new Error('replyId es obligatorio.');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_replies?id=eq.${normalizedReplyId}`, {
    body: JSON.stringify({ status }),
    headers: buildHeaders(config, normalizedAuthContext.accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    method: 'PATCH',
  });
  await assertSupabaseOk(response, 'review_replies');
}
