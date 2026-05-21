import type { CreateReviewAuthContext } from './motorcycleReviewService';

export type ReviewReportReason = 'spam' | 'offensive' | 'false_information' | 'harassment' | 'other';
export type ReviewReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

export type CreateReviewReportInput = Readonly<{
  comment?: string | null;
  reason: ReviewReportReason;
  reviewId: string;
}>;

export type ReviewReport = Readonly<{
  comment: string | null;
  createdAt?: string;
  id?: string;
  reason: ReviewReportReason;
  reviewId: string;
  status: ReviewReportStatus;
  updatedAt?: string;
  userId: string;
}>;

type ReviewReportRow = Readonly<{
  comment: string | null;
  created_at?: string;
  id?: string;
  reason: ReviewReportReason;
  review_id: string;
  status: ReviewReportStatus;
  updated_at?: string;
  user_id: string;
}>;

const reviewReportReasons = new Set<ReviewReportReason>(['spam', 'offensive', 'false_information', 'harassment', 'other']);

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para reportes de reviews.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function normalizeAuthContext(authContext: CreateReviewAuthContext | null | undefined) {
  const userId = authContext?.userId.trim();
  const accessToken = authContext?.accessToken.trim();

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para reportar reviews.');
  }

  return { accessToken, userId };
}

function normalizeReviewIds(reviewIds: readonly string[]) {
  return Array.from(new Set(reviewIds.map((reviewId) => reviewId.trim()).filter(Boolean)));
}

function normalizeComment(comment: string | null | undefined) {
  const normalizedComment = comment?.trim();
  return normalizedComment ? normalizedComment : null;
}

function buildHeaders(config: ReturnType<typeof getSupabaseConfig>, accessToken: string, extraHeaders?: Record<string, string>) {
  return {
    Accept: 'application/json',
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    ...extraHeaders,
  };
}

function mapReportRow(row: ReviewReportRow): ReviewReport {
  return {
    comment: row.comment,
    createdAt: row.created_at,
    id: row.id,
    reason: row.reason,
    reviewId: row.review_id,
    status: row.status,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

function isDuplicateReportError(status: number, errorBody: string) {
  const normalizedError = errorBody.toLowerCase();

  return status === 409
    || normalizedError.includes('23505')
    || normalizedError.includes('review_reports_review_id_user_id_key')
    || normalizedError.includes('duplicate key');
}

async function assertReviewReportOk(response: Response) {
  if (response.ok) {
    return;
  }

  const errorBody = await response.text();

  if (isDuplicateReportError(response.status, errorBody)) {
    throw new Error('Ya has reportado esta review.');
  }

  throw new Error(`Supabase review_reports request failed (${response.status}): ${errorBody}`);
}

export async function createReviewReport(
  input: CreateReviewReportInput,
  authContext: CreateReviewAuthContext,
): Promise<ReviewReport> {
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const reviewId = input.reviewId.trim();

  if (!reviewId) {
    throw new Error('reviewId es obligatorio para reportar reviews.');
  }

  if (!reviewReportReasons.has(input.reason)) {
    throw new Error('Motivo de reporte inválido.');
  }

  const report: ReviewReport = {
    comment: normalizeComment(input.comment),
    reason: input.reason,
    reviewId,
    status: 'pending',
    userId: normalizedAuthContext.userId,
  };
  const config = getSupabaseConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reports`, {
    body: JSON.stringify({
      comment: report.comment,
      reason: report.reason,
      review_id: report.reviewId,
      status: 'pending',
      user_id: report.userId,
    }),
    headers: buildHeaders(config, normalizedAuthContext.accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    method: 'POST',
  });

  await assertReviewReportOk(response);

  return report;
}

export async function getMyReviewReports(
  reviewIds: readonly string[],
  authContext: CreateReviewAuthContext,
): Promise<readonly ReviewReport[]> {
  const normalizedReviewIds = normalizeReviewIds(reviewIds);

  if (normalizedReviewIds.length === 0) {
    return [];
  }

  const normalizedAuthContext = normalizeAuthContext(authContext);
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    review_id: `in.(${normalizedReviewIds.join(',')})`,
    select: 'id,review_id,user_id,reason,comment,status,created_at,updated_at',
    user_id: `eq.${normalizedAuthContext.userId}`,
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reports?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext.accessToken),
  });

  await assertReviewReportOk(response);

  return ((await response.json()) as ReviewReportRow[]).map(mapReportRow);
}
