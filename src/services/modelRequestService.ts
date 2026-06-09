import { isBikeSegment } from '../shared/motorcycles/motorcycleTaxonomy';

export type ModelRequestStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';
export type ModelRequestSource = 'user' | 'admin' | 'import';

export type ModelRequestInput = Readonly<{
  brand: string;
  model: string;
  year: number;
  segment?: string | null;
  contactEmail?: string | null;
  officialUrl?: string | null;
  comment?: string | null;
}>;

export type ModelRequestAuthContext = Readonly<{
  userId: string;
  accessToken: string;
  userName?: string | null;
}>;

export type ModelRequestFilters = Readonly<{
  status?: ModelRequestStatus;
  source?: ModelRequestSource;
  statuses?: readonly ModelRequestStatus[];
  sources?: readonly ModelRequestSource[];
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}>;

export type ModelRequest = Readonly<{
  id: string;
  userId: string | null;
  userName: string | null;
  brand: string;
  model: string;
  year: number;
  segment: string | null;
  contactEmail: string | null;
  officialUrl: string | null;
  comment: string | null;
  status: ModelRequestStatus;
  source: ModelRequestSource;
  createdAt: string;
  updatedAt: string;
}>;

type ModelRequestPayload = Readonly<{
  user_id: string | null;
  user_name: string | null;
  brand: string;
  model: string;
  year: number;
  segment: string | null;
  contact_email: string | null;
  official_url: string | null;
  comment: string | null;
  status: 'pending';
  source: 'user';
}>;

type ModelRequestRow = Readonly<{
  id: string;
  user_id: string | null;
  user_name: string | null;
  brand: string;
  model: string;
  year: number;
  segment: string | null;
  contact_email: string | null;
  official_url: string | null;
  comment: string | null;
  status: ModelRequestStatus;
  source: ModelRequestSource;
  created_at: string;
  updated_at: string;
}>;

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para solicitudes de modelos.');
  }

  return { supabaseAnonKey, supabaseUrl: supabaseUrl.replace(/\/$/, '') };
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function normalizeSegment(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  if (normalized === null) {
    return null;
  }
  return isBikeSegment(normalized) ? normalized : null;
}

function normalizeAuthContext(authContext: ModelRequestAuthContext | undefined) {
  const userId = authContext?.userId.trim();
  const accessToken = authContext?.accessToken.trim();
  const userName = authContext?.userName?.trim() || null;

  if (!userId && !accessToken) {
    return null;
  }

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para solicitudes autenticadas.');
  }

  return { accessToken, userId, userName };
}

function assertValidModelRequest(input: ModelRequestInput) {
  if (!input.brand.trim()) {
    throw new Error('brand es obligatorio.');
  }

  if (!input.model.trim()) {
    throw new Error('model es obligatorio.');
  }

  if (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2100) {
    throw new Error('year debe ser un entero entre 1900 y 2100.');
  }

  const normalizedSegment = normalizeOptionalText(input.segment);
  if (normalizedSegment !== null && !isBikeSegment(normalizedSegment)) {
    throw new Error('segment debe ser una categoría válida de BIKE_SEGMENTS.');
  }
}

function buildModelRequestPayload(input: ModelRequestInput, authContext?: ModelRequestAuthContext): ModelRequestPayload {
  const normalizedAuthContext = normalizeAuthContext(authContext);

  return {
    user_id: normalizedAuthContext?.userId ?? null,
    user_name: normalizedAuthContext?.userName ?? null,
    brand: input.brand.trim(),
    model: input.model.trim(),
    year: input.year,
    segment: normalizeSegment(input.segment),
    contact_email: normalizeOptionalText(input.contactEmail),
    official_url: normalizeOptionalText(input.officialUrl),
    comment: normalizeOptionalText(input.comment),
    status: 'pending',
    source: 'user',
  };
}

async function assertSupabaseOk(response: Response) {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase model_requests request failed (${response.status}): ${errorBody}`);
  }
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  await assertSupabaseOk(response);
  return (await response.json()) as T;
}

function mapModelRequestRow(row: ModelRequestRow): ModelRequest {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? null,
    brand: row.brand,
    model: row.model,
    year: row.year,
    segment: row.segment,
    contactEmail: row.contact_email,
    officialUrl: row.official_url,
    comment: row.comment,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPendingPayloadToModelRequest(payload: ModelRequestPayload): ModelRequest {
  const timestamp = new Date().toISOString();

  return {
    id: '',
    userId: payload.user_id,
    userName: payload.user_name ?? null,
    brand: payload.brand,
    model: payload.model,
    year: payload.year,
    segment: payload.segment,
    contactEmail: payload.contact_email,
    officialUrl: payload.official_url,
    comment: payload.comment,
    status: payload.status,
    source: payload.source,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function createModelRequest(input: ModelRequestInput, authContext?: ModelRequestAuthContext): Promise<ModelRequest> {
  assertValidModelRequest(input);
  const config = getSupabaseConfig();
  const normalizedAuthContext = normalizeAuthContext(authContext);
  const payload = buildModelRequestPayload(input, normalizedAuthContext ?? undefined);
  const response = await fetch(`${config.supabaseUrl}/rest/v1/model_requests`, {
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

  return mapPendingPayloadToModelRequest(payload);
}

export async function getModelRequestsByUserId(authContext?: ModelRequestAuthContext | null): Promise<readonly ModelRequest[]> {
  if (!authContext?.userId.trim() || !authContext?.accessToken.trim()) {
    return [];
  }

  const normalizedAuthContext = normalizeAuthContext(authContext);
  if (!normalizedAuthContext) {
    return [];
  }
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    order: 'created_at.desc',
    select: 'id,user_id,user_name,brand,model,year,segment,contact_email,official_url,comment,status,source,created_at,updated_at',
    user_id: `eq.${normalizedAuthContext.userId}`,
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/model_requests?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext.accessToken}`,
    },
  });
  const rows = await parseSupabaseResponse<ModelRequestRow[]>(response);

  return rows.map(mapModelRequestRow);
}

const validAdminStatuses = new Set<ModelRequestStatus>(['pending', 'reviewed', 'approved', 'rejected']);
const validAdminSources = new Set<ModelRequestSource>(['user', 'admin', 'import']);

function assertValidAdminStatus(status: ModelRequestStatus) {
  if (!validAdminStatuses.has(status)) {
    throw new Error(`Estado inválido: ${status}`);
  }
}

function sanitizeAdminStatuses(values: readonly ModelRequestStatus[] | undefined): readonly ModelRequestStatus[] {
  if (!values || values.length === 0) {
    return [];
  }
  return values.filter((value): value is ModelRequestStatus => validAdminStatuses.has(value));
}

function sanitizeAdminSources(values: readonly ModelRequestSource[] | undefined): readonly ModelRequestSource[] {
  if (!values || values.length === 0) {
    return [];
  }
  return values.filter((value): value is ModelRequestSource => validAdminSources.has(value));
}

function normalizeIsoDateBoundary(value: string | undefined, boundary: 'from' | 'to'): string | null {
  if (!value || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (dateOnly) {
    if (boundary === 'from') {
      return `${trimmed}T00:00:00.000Z`;
    }
    return `${trimmed}T23:59:59.999Z`;
  }

  return parsed.toISOString();
}

function normalizeAuthContextStrict(authContext: ModelRequestAuthContext) {
  const userId = authContext?.userId?.trim();
  const accessToken = authContext?.accessToken?.trim();

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para administración de solicitudes.');
  }

  return { accessToken, userId };
}

export async function getAllModelRequests(
  authContext: ModelRequestAuthContext,
  filters?: ModelRequestFilters,
): Promise<readonly ModelRequest[]> {
  const normalizedAuthContext = normalizeAuthContextStrict(authContext);
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    order: 'created_at.desc',
    select: 'id,user_id,user_name,brand,model,year,segment,contact_email,official_url,comment,status,source,created_at,updated_at',
  });

  const sanitizedStatuses = sanitizeAdminStatuses(filters?.statuses);
  const sanitizedSources = sanitizeAdminSources(filters?.sources);

  if (filters?.status && sanitizedStatuses.length === 0) {
    params.set('status', `eq.${filters.status}`);
  } else if (sanitizedStatuses.length === 1) {
    params.set('status', `eq.${sanitizedStatuses[0]}`);
  } else if (sanitizedStatuses.length > 1) {
    params.set('status', `in.(${sanitizedStatuses.join(',')})`);
  }

  if (filters?.source && sanitizedSources.length === 0) {
    params.set('source', `eq.${filters.source}`);
  } else if (sanitizedSources.length === 1) {
    params.set('source', `eq.${sanitizedSources[0]}`);
  } else if (sanitizedSources.length > 1) {
    params.set('source', `in.(${sanitizedSources.join(',')})`);
  }

  const createdFrom = normalizeIsoDateBoundary(filters?.createdFrom, 'from');
  const createdTo = normalizeIsoDateBoundary(filters?.createdTo, 'to');

  if (createdFrom && createdTo) {
    params.set('and', `(created_at.gte.${createdFrom},created_at.lte.${createdTo})`);
  } else if (createdFrom) {
    params.set('created_at', `gte.${createdFrom}`);
  } else if (createdTo) {
    params.set('created_at', `lte.${createdTo}`);
  }

  if (filters?.search?.trim()) {
    const term = filters.search.trim();
    params.set('or', `(brand.ilike.*${term}*,model.ilike.*${term}*)`);
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/model_requests?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext.accessToken}`,
    },
  });
  const rows = await parseSupabaseResponse<ModelRequestRow[]>(response);

  return rows.map(mapModelRequestRow);
}

export async function updateModelRequestStatus(
  id: string,
  status: ModelRequestStatus,
  authContext: ModelRequestAuthContext,
): Promise<void> {
  const normalizedAuthContext = normalizeAuthContextStrict(authContext);
  const config = getSupabaseConfig();

  assertValidAdminStatus(status);

  const normalizedId = id.trim();

  if (!normalizedId) {
    throw new Error('id es obligatorio.');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/model_requests?id=eq.${normalizedId}`, {
    body: JSON.stringify({ status }),
    headers: {
      Accept: 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${normalizedAuthContext.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    method: 'PATCH',
  });
  await assertSupabaseOk(response);
}
