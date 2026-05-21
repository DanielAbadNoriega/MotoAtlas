import type { CreateReviewAuthContext } from './motorcycleReviewService';

export type ReviewReactionSummary = Readonly<{
  reviewId: string;
  helpfulCount: number;
  hasReactedHelpful: boolean;
}>;

type ReviewReactionRow = Readonly<{
  review_id: string;
  user_id: string;
  type: 'helpful';
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
    const reviewRows = rows.filter((row) => row.review_id === reviewId && row.type === 'helpful');

    return {
      reviewId,
      helpfulCount: reviewRows.length,
      hasReactedHelpful: Boolean(userId && reviewRows.some((row) => row.user_id === userId)),
    };
  });
}

export async function getHelpfulReactionSummary(
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
    type: 'eq.helpful',
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reactions?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext?.accessToken ?? config.supabaseAnonKey}`,
    },
  });
  const rows = await parseSupabaseResponse<ReviewReactionRow[]>(response);

  return buildSummary(normalizedReviewIds, rows, normalizedAuthContext?.userId);
}

export async function toggleHelpfulReaction(
  reviewId: string,
  authContext: CreateReviewAuthContext,
): Promise<ReviewReactionSummary> {
  const normalizedReviewId = reviewId.trim();
  const normalizedAuthContext = normalizeAuthContext(authContext);

  if (!normalizedReviewId) {
    throw new Error('reviewId es obligatorio para reaccionar a reviews.');
  }

  if (!normalizedAuthContext) {
    throw new Error('userId y accessToken son obligatorios para reaccionar a reviews.');
  }

  const config = getSupabaseConfig();
  const [currentSummary] = await getHelpfulReactionSummary([normalizedReviewId], normalizedAuthContext);

  if (currentSummary?.hasReactedHelpful) {
    const params = new URLSearchParams({
      review_id: `eq.${normalizedReviewId}`,
      type: 'eq.helpful',
      user_id: `eq.${normalizedAuthContext.userId}`,
    });
    const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reactions?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${normalizedAuthContext.accessToken}`,
        Prefer: 'return=minimal',
      },
      method: 'DELETE',
    });
    await assertSupabaseOk(response);
  } else {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reactions`, {
      body: JSON.stringify({
        review_id: normalizedReviewId,
        type: 'helpful',
        user_id: normalizedAuthContext.userId,
      }),
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

  const [updatedSummary] = await getHelpfulReactionSummary([normalizedReviewId], normalizedAuthContext);

  return updatedSummary ?? { helpfulCount: 0, hasReactedHelpful: false, reviewId: normalizedReviewId };
}
