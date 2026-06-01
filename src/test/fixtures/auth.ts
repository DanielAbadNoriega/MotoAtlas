import type { Session, User } from '@supabase/supabase-js';
import type { AuthContextValue, AuthStateSnapshot, UserProfile } from '../../features/auth';

const DEFAULT_TIMESTAMP = '2026-01-01T10:00:00.000Z';

function defaultAppMetadata() {
  return {
    provider: 'email',
    providers: ['email'],
  };
}

function defaultUserMetadata() {
  return {
    display_name: 'Rider MotoAtlas',
    avatar_url: null,
  };
}

export function createAuthUser(overrides: Partial<User> = {}): User {
  const base = {
    id: 'user-1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'rider@motoatlas.com',
    phone: '',
    created_at: DEFAULT_TIMESTAMP,
    updated_at: DEFAULT_TIMESTAMP,
    confirmed_at: DEFAULT_TIMESTAMP,
    last_sign_in_at: DEFAULT_TIMESTAMP,
    app_metadata: defaultAppMetadata(),
    user_metadata: defaultUserMetadata(),
    identities: [],
    is_anonymous: false,
  };

  return {
    ...base,
    ...overrides,
    app_metadata: {
      ...base.app_metadata,
      ...((overrides.app_metadata as Record<string, unknown> | undefined) ?? {}),
    },
    user_metadata: {
      ...base.user_metadata,
      ...((overrides.user_metadata as Record<string, unknown> | undefined) ?? {}),
    },
  } as User;
}

export function createUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    displayName: 'Rider MotoAtlas',
    avatarUrl: 'https://cdn.motoatlas.test/avatars/rider.webp',
    role: 'user',
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createSession(overrides: Partial<Session> = {}): Session {
  const base = {
    access_token: 'test-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 1893495600,
    refresh_token: 'test-refresh-token',
    user: createAuthUser(),
  };

  return {
    ...base,
    ...overrides,
    user: overrides.user ?? base.user,
  } as Session;
}

export function createAuthSnapshot(overrides: Partial<AuthStateSnapshot> = {}): AuthStateSnapshot {
  return {
    session: null,
    user: null,
    profile: null,
    ...overrides,
  };
}

export function createAuthState(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  const user = overrides.user ?? null;
  const session = overrides.session ?? null;
  const profile = overrides.profile ?? null;

  return {
    user,
    session,
    profile,
    isAuthenticated: overrides.isAuthenticated ?? Boolean(user),
    isAdmin: overrides.isAdmin ?? profile?.role === 'admin',
    isLoading: overrides.isLoading ?? false,
    signIn: overrides.signIn ?? (async () => createAuthSnapshot({ session, user, profile })),
    signUp: overrides.signUp ?? (async () => createAuthSnapshot({ session, user, profile })),
    signOut: overrides.signOut ?? (async () => undefined),
    refreshProfile: overrides.refreshProfile ?? (async () => profile),
  };
}

export const authUserFixture = createAuthUser();

export const adminUserFixture = createAuthUser({
  email: 'admin@motoatlas.com',
  id: 'admin-1',
  user_metadata: {
    ...defaultUserMetadata(),
    display_name: 'Admin MotoAtlas',
  },
} as Partial<User>);

export const userWithoutDisplayNameFixture = createAuthUser({
  user_metadata: {
    ...defaultUserMetadata(),
    display_name: null,
  },
} as Partial<User>);

export const userWithAvatarFixture = createAuthUser({
  user_metadata: {
    ...defaultUserMetadata(),
    avatar_url: 'https://cdn.motoatlas.test/avatars/with-avatar.webp',
  },
} as Partial<User>);

export const userWithoutAvatarFixture = createAuthUser({
  user_metadata: {
    ...defaultUserMetadata(),
    avatar_url: null,
  },
} as Partial<User>);

export const basicProfileFixture = createUserProfile();

export const adminProfileFixture = createUserProfile({
  avatarUrl: 'https://cdn.motoatlas.test/avatars/admin.webp',
  displayName: 'Admin MotoAtlas',
  id: 'admin-1',
  role: 'admin',
});

export const profileWithoutDisplayNameFixture = createUserProfile({
  displayName: null,
});

export const profileWithoutAvatarFixture = createUserProfile({
  avatarUrl: null,
});

export const incompleteProfileFixture = createUserProfile({
  avatarUrl: null,
  displayName: null,
});

export const mockSessionFixture = createSession();

export const mockUnauthenticatedAuthState = createAuthState();

export const mockAuthenticatedAuthState = createAuthState({
  isAuthenticated: true,
  profile: basicProfileFixture,
  session: mockSessionFixture,
  user: authUserFixture,
});

export const mockAdminAuthState = createAuthState({
  isAdmin: true,
  isAuthenticated: true,
  profile: adminProfileFixture,
  session: createSession({ access_token: 'admin-access-token', user: adminUserFixture }),
  user: adminUserFixture,
});
