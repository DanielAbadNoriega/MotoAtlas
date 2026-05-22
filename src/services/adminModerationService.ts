import type { CreateReviewAuthContext, MotorcycleReviewStatus } from './motorcycleReviewService';
import type { ReviewReportReason, ReviewReportStatus } from './reviewReportService';

export type AdminReportStatusFilter = ReviewReportStatus | 'all';
export type AdminReportReasonFilter = ReviewReportReason | 'all';
export type AdminReportSort = 'recent' | 'oldest';

export type AdminReviewReportFilters = Readonly<{
  reason?: AdminReportReasonFilter;
  sort?: AdminReportSort;
  status?: AdminReportStatusFilter;
}>;

export type AdminReviewReport = Readonly<{
  comment: string | null;
  createdAt: string;
  id: string;
  reason: ReviewReportReason;
  reporterDisplayName: string;
  reporterUserId: string;
  review: {
    comment: string;
    cons: readonly string[];
    createdAt?: string;
    id: string;
    motorcycle: {
      brand: string;
      id: string;
      imageUrl: string;
      model: string;
      year: number;
    } | null;
    motorcycleId: string;
    pros: readonly string[];
    rating: number;
    status: MotorcycleReviewStatus;
    userName: string;
  } | null;
  reviewId: string;
  status: ReviewReportStatus;
  updatedAt: string;
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
  cons: readonly string[] | null;
  created_at?: string;
  id: string;
  motorcycle_id: string;
  motorcycles?: MotorcycleRow | null;
  pros: readonly string[] | null;
  rating: number;
  status: MotorcycleReviewStatus;
  user_name: string;
}>;

type ReportRow = Readonly<{
  comment: string | null;
  created_at: string;
  id: string;
  motorcycle_reviews?: ReviewRow | null;
  reason: ReviewReportReason;
  review_id: string;
  status: ReviewReportStatus;
  updated_at: string;
  user_id: string;
}>;

type UserProfileRow = Readonly<{
  id: string;
  display_name: string | null;
}>;

const reportStatuses = new Set<ReviewReportStatus>(['reviewed', 'dismissed', 'action_taken']);
const reviewStatuses = new Set<MotorcycleReviewStatus>(['approved', 'rejected', 'hidden']);
const reporterNameFallback = 'Usuario sin alias';

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para moderación admin.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function normalizeAuthContext(authContext: CreateReviewAuthContext | null | undefined) {
  const userId = authContext?.userId.trim();
  const accessToken = authContext?.accessToken.trim();

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para moderación admin.');
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

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortReports(reports: readonly AdminReviewReport[], sort: AdminReportSort) {
  return [...reports].sort((left, right) => {
    if (left.status === 'pending' && right.status !== 'pending') {
      return -1;
    }

    if (left.status !== 'pending' && right.status === 'pending') {
      return 1;
    }

    return sort === 'oldest'
      ? getTimestamp(left.createdAt) - getTimestamp(right.createdAt)
      : getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
  });
}

function mapReportRow(row: ReportRow): AdminReviewReport {
  const review = row.motorcycle_reviews;
  const motorcycle = review?.motorcycles;

  return {
    comment: row.comment,
    createdAt: row.created_at,
    id: row.id,
    reason: row.reason,
    reporterDisplayName: reporterNameFallback,
    reporterUserId: row.user_id,
    review: review
      ? {
          comment: review.comment,
          cons: review.cons ?? [],
          createdAt: review.created_at,
          id: review.id,
          motorcycle: motorcycle
            ? {
                brand: motorcycle.brand,
                id: motorcycle.id,
                imageUrl: motorcycle.image_url ?? '',
                model: motorcycle.model,
                year: motorcycle.year,
              }
            : null,
          motorcycleId: review.motorcycle_id,
          pros: review.pros ?? [],
          rating: review.rating,
          status: review.status,
          userName: review.user_name,
        }
      : null,
    reviewId: row.review_id,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function getReporterDisplayName(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : reporterNameFallback;
}

async function getReporterDisplayNameMap(
  reporterIds: readonly string[],
  config: ReturnType<typeof getSupabaseConfig>,
  accessToken: string,
) {
  if (reporterIds.length === 0) {
    return new Map<string, string>();
  }

  const normalizedReporterIds = Array.from(new Set(
    reporterIds
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  ));

  if (normalizedReporterIds.length === 0) {
    return new Map<string, string>();
  }

  const params = new URLSearchParams({
    select: 'id,display_name',
    id: `in.(${normalizedReporterIds.join(',')})`,
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/user_profiles?${params.toString()}`, {
    headers: buildHeaders(config, accessToken),
  });
  await assertSupabaseOk(response, 'user_profiles');

  return ((await response.json()) as UserProfileRow[]).reduce((accumulator, profile) => {
    accumulator.set(profile.id, getReporterDisplayName(profile.display_name));
    return accumulator;
  }, new Map<string, string>());
}

export async function getReviewReports(
  authContext: CreateReviewAuthContext,
  filters: AdminReviewReportFilters = {},
): Promise<readonly AdminReviewReport[]> {
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const config = getSupabaseConfig();
  const status = filters.status ?? 'pending';
  const reason = filters.reason ?? 'all';
  const sort = filters.sort ?? 'recent';
  const params = new URLSearchParams({
    order: sort === 'oldest' ? 'created_at.asc' : 'created_at.desc',
    select: [
      'id',
      'review_id',
      'user_id',
      'reason',
      'comment',
      'status',
      'created_at',
      'updated_at',
      'motorcycle_reviews(id,motorcycle_id,user_name,rating,comment,pros,cons,status,created_at,motorcycles(id,brand,model,year,image_url))',
    ].join(','),
  });

  if (status !== 'all') {
    params.set('status', `eq.${status}`);
  }

  if (reason !== 'all') {
    params.set('reason', `eq.${reason}`);
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reports?${params.toString()}`, {
    headers: buildHeaders(config, normalizedAuthContext.accessToken),
  });

  await assertSupabaseOk(response, 'review_reports');
  const mappedReports = ((await response.json()) as ReportRow[]).map(mapReportRow);
  const reporterDisplayNameMap = await getReporterDisplayNameMap(
    mappedReports.map((report) => report.reporterUserId),
    config,
    normalizedAuthContext.accessToken,
  );

  return sortReports(mappedReports.map((report) => ({
    ...report,
    reporterDisplayName: reporterDisplayNameMap.get(report.reporterUserId) ?? reporterNameFallback,
  })), sort);
}

export async function updateReviewReportStatus(
  reportId: string,
  status: ReviewReportStatus,
  authContext: CreateReviewAuthContext,
): Promise<void> {
  const normalizedReportId = reportId.trim();
  const normalizedAuthContext = normalizeAuthContext(authContext);

  if (!normalizedReportId) {
    throw new Error('reportId es obligatorio para moderación admin.');
  }

  if (!reportStatuses.has(status)) {
    throw new Error('Estado de reporte inválido.');
  }

  const config = getSupabaseConfig();
  const params = new URLSearchParams({ id: `eq.${normalizedReportId}` });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/review_reports?${params.toString()}`, {
    body: JSON.stringify({ status }),
    headers: buildHeaders(config, normalizedAuthContext.accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    method: 'PATCH',
  });

  await assertSupabaseOk(response, 'review_reports');
}

export async function updateReportedReviewStatus(
  reviewId: string,
  status: MotorcycleReviewStatus,
  authContext: CreateReviewAuthContext,
): Promise<void> {
  const normalizedReviewId = reviewId.trim();
  const normalizedAuthContext = normalizeAuthContext(authContext);

  if (!normalizedReviewId) {
    throw new Error('reviewId es obligatorio para moderación admin.');
  }

  if (!reviewStatuses.has(status)) {
    throw new Error('Estado de review inválido.');
  }

  const config = getSupabaseConfig();
  const params = new URLSearchParams({ id: `eq.${normalizedReviewId}` });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/motorcycle_reviews?${params.toString()}`, {
    body: JSON.stringify({ status }),
    headers: buildHeaders(config, normalizedAuthContext.accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    method: 'PATCH',
  });

  await assertSupabaseOk(response, 'motorcycle_reviews');
}

export async function resolveReportWithReviewStatus(
  reportId: string,
  reviewId: string,
  reviewStatus: MotorcycleReviewStatus,
  authContext: CreateReviewAuthContext,
): Promise<void> {
  await updateReportedReviewStatus(reviewId, reviewStatus, authContext);
  await updateReviewReportStatus(reportId, 'action_taken', authContext);
}
