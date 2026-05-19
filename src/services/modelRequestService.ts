export type ModelRequestStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';
export type ModelRequestSource = 'user' | 'admin' | 'import';

export type ModelRequestInput = Readonly<{
  brand: string;
  model: string;
  year: number;
  segment?: string | null;
  contactEmail?: string | null;
  comment?: string | null;
}>;

export type ModelRequestAuthContext = Readonly<{
  userId: string;
  accessToken: string;
}>;

export type ModelRequest = Readonly<{
  id: string;
  userId: string | null;
  brand: string;
  model: string;
  year: number;
  segment: string | null;
  contactEmail: string | null;
  comment: string | null;
  status: ModelRequestStatus;
  source: ModelRequestSource;
  createdAt: string;
  updatedAt: string;
}>;

type ModelRequestPayload = Readonly<{
  user_id: string | null;
  brand: string;
  model: string;
  year: number;
  segment: string | null;
  contact_email: string | null;
  comment: string | null;
  status: 'pending';
  source: 'user';
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

function normalizeAuthContext(authContext: ModelRequestAuthContext | undefined) {
  const userId = authContext?.userId.trim();
  const accessToken = authContext?.accessToken.trim();

  if (!userId && !accessToken) {
    return null;
  }

  if (!userId || !accessToken) {
    throw new Error('userId y accessToken son obligatorios para solicitudes autenticadas.');
  }

  return { accessToken, userId };
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
}

function buildModelRequestPayload(input: ModelRequestInput, authContext?: ModelRequestAuthContext): ModelRequestPayload {
  const normalizedAuthContext = normalizeAuthContext(authContext);

  return {
    user_id: normalizedAuthContext?.userId ?? null,
    brand: input.brand.trim(),
    model: input.model.trim(),
    year: input.year,
    segment: normalizeOptionalText(input.segment),
    contact_email: normalizeOptionalText(input.contactEmail),
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

function mapPendingPayloadToModelRequest(payload: ModelRequestPayload): ModelRequest {
  const timestamp = new Date().toISOString();

  return {
    id: '',
    userId: payload.user_id,
    brand: payload.brand,
    model: payload.model,
    year: payload.year,
    segment: payload.segment,
    contactEmail: payload.contact_email,
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
