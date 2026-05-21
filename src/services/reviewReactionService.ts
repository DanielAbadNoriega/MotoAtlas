import type { CreateReviewAuthContext } from './motorcycleReviewService';

export type ReviewReactionType = 'helpful' | 'not_helpful';

export type ReviewReactionSummary = Readonly<{
  reviewId: string;
  helpfulCount: number;
  hasReactedHelpful: boolean;
  hasReactedNotHelpful: boolean;
}>;

type ReviewReactionRow = Readonly<{
  review_id: string;
  user_id: string;
  type: ReviewReactionType;
}>;

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para reacciones de reviews.');
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
    throw new Error('userId y accessToken son obligatorios para reaccionar a reviews.');
  }

  return { accessToken, userId };
}

function normalizeReviewIds(reviewIds: readonly string[]) {
  return Array.from(new Set(reviewIds.map((reviewId) => reviewId.trim()).filter(Boolean)));
}

async function assertSupabaseOk(response: Response, resource = 'review_reactions') {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase ${resource} request failed (${response.status}): ${errorBody}`);
  }
}

async function parseSupabaseResponse<T>(response: Response, resource?: string): Promise<T> {
  await assertSupabaseOk(response, resource);
  return (await response.json()) as T;
}

function buildSummary(reviewIds: readonly string[], rows: readonly ReviewReactionRow[], userId?: string): readonly ReviewReactionSummary[] {
  return reviewIds.map((reviewId) => {
    const reviewRows = rows.filter((row) => row.review_id === reviewId);
    const ownRows = userId ? reviewRows.filter((row) => row.user_id === userId) : [];

    return {
      reviewId,
      helpfulCount: reviewRows.filter((row) => row.type === 'helpful').length,
      hasReactedHelpful: ownRows.some((row) => row.type === 'helpful'),
      hasReactedNotHelpful: ownRows.some((row) => row.type === 'not_helpful'),
    };
  });
}

function buildHeaders(config: ReturnType<typeof getSupabaseConfig>, accessToken?: string, extraHeaders?: Record<string, string>) {
  return {
    Accept: 'application/json',
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${accessToken ?? config.supabaseAnonKey}`,
    ...extraHeaders,
  };
}

export async function getReviewReactionSummary(
  reviewIds: readonly string[],
  authContext?: CreateReviewAuthContext | null,
): Promise<readonly ReviewReactionSummary[]> {
  const normalizedReviewIds = normalizeReviewIds(reviewIds);

  if (normalizedReviewIds.length === 0) {
    return [];
  }

  const config = getSupabaseConfig();
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const params = new URLSearchParams({
    review_id: `in.(${normalizedReviewIds.join(',')})`,
    select: 'review_id,user_id,type',
    type: normalizedAuthContext ? 'in.(helpful,not_helpful)' : 'eq.helpful',
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reactions?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext?.accessToken),
  });
  const rows = await parseSupabaseResponse<ReviewReactionRow[]>(response);

  return buildSummary(normalizedReviewIds, rows, normalizedAuthContext?.userId);
}

export function getHelpfulReactionSummary(
  reviewIds: readonly string[],
  authContext?: CreateReviewAuthContext | null,
): Promise<readonly ReviewReactionSummary[]> {
  return getReviewReactionSummary(reviewIds, authContext);
}

async function deleteOwnReaction(
  reviewId: string,
  authContext: NonNullable<ReturnType<typeof normalizeAuthContext>>,
  type: ReviewReactionType,
) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    review_id: `eq.${reviewId}`,
    type: `eq.${type}`,
    user_id: `eq.${authContext.userId}`,
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reactions?${params.toString()}`, {
    headers: buildHeaders(config, authContext.accessToken, { Prefer: 'return=minimal' }),
    method: 'DELETE',
  });

  await assertSupabaseOk(response);
}

async function insertOwnReaction(
  reviewId: string,
  authContext: NonNullable<ReturnType<typeof normalizeAuthContext>>,
  type: ReviewReactionType,
) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reactions`, {
    body: JSON.stringify({
      review_id: reviewId,
      type,
      user_id: authContext.userId,
    }),
    headers: buildHeaders(config, authContext.accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    method: 'POST',
  });

  await assertSupabaseOk(response);
}

async function toggleReaction(
  reviewId: string,
  authContext: CreateReviewAuthContext,
  type: ReviewReactionType,
): Promise<ReviewReactionSummary> {
  const normalizedReviewId = reviewId.trim();
  const normalizedAuthContext = normalizeAuthContext(authContext);

  if (!normalizedReviewId) {
    throw new Error('reviewId es obligatorio para reaccionar a reviews.');
  }

  if (!normalizedAuthContext) {
    throw new Error('userId y accessToken son obligatorios para reaccionar a reviews.');
  }

  const oppositeType: ReviewReactionType = type === 'helpful' ? 'not_helpful' : 'helpful';
  const [currentSummary] = await getReviewReactionSummary([normalizedReviewId], normalizedAuthContext);
  const isActive = type === 'helpful'
    ? currentSummary?.hasReactedHelpful
    : currentSummary?.hasReactedNotHelpful;
  const hasOppositeReaction = oppositeType === 'helpful'
    ? currentSummary?.hasReactedHelpful
    : currentSummary?.hasReactedNotHelpful;

  if (isActive) {
    await deleteOwnReaction(normalizedReviewId, normalizedAuthContext, type);
  } else {
    if (hasOppositeReaction) {
      await deleteOwnReaction(normalizedReviewId, normalizedAuthContext, oppositeType);
    }

    await insertOwnReaction(normalizedReviewId, normalizedAuthContext, type);
  }

  const [updatedSummary] = await getReviewReactionSummary([normalizedReviewId], normalizedAuthContext);

  return updatedSummary ?? {
    helpfulCount: 0,
    hasReactedHelpful: false,
    hasReactedNotHelpful: false,
    reviewId: normalizedReviewId,
  };
}

export function toggleHelpfulReaction(
  reviewId: string,
  authContext: CreateReviewAuthContext,
): Promise<ReviewReactionSummary> {
  return toggleReaction(reviewId, authContext, 'helpful');
}

export function toggleNotHelpfulReaction(
  reviewId: string,
  authContext: CreateReviewAuthContext,
): Promise<ReviewReactionSummary> {
  return toggleReaction(reviewId, authContext, 'not_helpful');
}

export async function clearMyReviewReaction(
  reviewId: string,
  authContext: CreateReviewAuthContext,
): Promise<ReviewReactionSummary> {
  const normalizedReviewId = reviewId.trim();
  const normalizedAuthContext = normalizeAuthContext(authContext);

  if (!normalizedReviewId) {
    throw new Error('reviewId es obligatorio para limpiar reacciones de reviews.');
  }

  if (!normalizedAuthContext) {
    throw new Error('userId y accessToken son obligatorios para limpiar reacciones de reviews.');
  }

  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    review_id: `eq.${normalizedReviewId}`,
    user_id: `eq.${normalizedAuthContext.userId}`,
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reactions?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext.accessToken, { Prefer: 'return=minimal' }),
    method: 'DELETE',
  });

  await assertSupabaseOk(response);

  const [updatedSummary] = await getReviewReactionSummary([normalizedReviewId], normalizedAuthContext);

  return updatedSummary ?? {
    helpfulCount: 0,
    hasReactedHelpful: false,
    hasReactedNotHelpful: false,
    reviewId: normalizedReviewId,
  };
}
