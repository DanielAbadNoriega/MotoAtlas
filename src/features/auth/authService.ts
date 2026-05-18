import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../shared/supabase/supabaseClient';

export type UserProfileRole = 'user' | 'admin';

export type UserProfile = Readonly<{
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserProfileRole;
  createdAt?: string;
  updatedAt?: string;
}>;

export type AuthStateSnapshot = Readonly<{
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
}>;

export type SignInInput = Readonly<{
  email: string;
  password: string;
}>;

export type SignUpInput = Readonly<{
  displayName: string;
  email: string;
  password: string;
}>;

type UserProfileRow = Readonly<{
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserProfileRole;
  created_at?: string;
  updated_at?: string;
}>;

function requireSupabaseClient() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para autenticación.');
  }

  return client;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function assertValidEmailPassword(input: SignInInput) {
  if (!normalizeEmail(input.email)) {
    throw new Error('El email es obligatorio.');
  }

  if (!input.password.trim()) {
    throw new Error('La contraseña es obligatoria.');
  }
}

export function assertValidSignUp(input: SignUpInput) {
  assertValidEmailPassword(input);

  if (!input.displayName.trim()) {
    throw new Error('El alias es obligatorio.');
  }

  if (input.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId.trim()) {
    return null;
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('user_profiles')
    .select('id, display_name, avatar_url, role, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data as UserProfileRow) : null;
}

export async function updateOwnProfile(input: { displayName?: string | null; avatarUrl?: string | null }): Promise<UserProfile | null> {
  const client = requireSupabaseClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const userId = sessionData.session?.user.id;

  if (!userId) {
    throw new Error('No hay sesión activa para actualizar el perfil.');
  }

  const payload = {
    ...(input.displayName !== undefined ? { display_name: input.displayName?.trim() || null } : {}),
    ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl?.trim() || null } : {}),
  };

  const { data, error } = await client
    .from('user_profiles')
    .update(payload)
    .eq('id', userId)
    .select('id, display_name, avatar_url, role, created_at, updated_at')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data as UserProfileRow) : null;
}

async function buildSnapshot(session: Session | null): Promise<AuthStateSnapshot> {
  const user = session?.user ?? null;
  let profile: UserProfile | null = null;

  if (user) {
    try {
      profile = await getUserProfile(user.id);
    } catch {
      profile = null;
    }
  }

  return { session, user, profile };
}

export async function getCurrentAuthSnapshot(): Promise<AuthStateSnapshot> {
  const client = getSupabaseClient();

  if (!client) {
    return { session: null, user: null, profile: null };
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  return buildSnapshot(data.session ?? null);
}

export async function signInWithEmailAndPassword(input: SignInInput): Promise<AuthStateSnapshot> {
  assertValidEmailPassword(input);
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizeEmail(input.email),
    password: input.password,
  });

  if (error) {
    throw error;
  }

  return buildSnapshot(data.session ?? null);
}

export async function signUpWithEmailAndPassword(input: SignUpInput): Promise<AuthStateSnapshot> {
  assertValidSignUp(input);
  const displayName = input.displayName.trim();
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email: normalizeEmail(input.email),
    password: input.password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (data.session?.user && displayName) {
    try {
      await updateOwnProfile({ displayName });
    } catch {
      // El trigger de Supabase también crea el perfil. No bloqueamos el alta si la confirmación por email retrasa la sesión.
    }
  }

  return buildSnapshot(data.session ?? null);
}

export async function signOutCurrentUser() {
  const client = requireSupabaseClient();
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}
