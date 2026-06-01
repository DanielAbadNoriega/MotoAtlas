import { describe, expect, it } from 'vitest';
import {
  adminProfileFixture,
  adminUserFixture,
  authUserFixture,
  createAuthState,
  createAuthUser,
  createSession,
  createUserProfile,
  incompleteProfileFixture,
  mockAdminAuthState,
  mockAuthenticatedAuthState,
  mockSessionFixture,
  mockUnauthenticatedAuthState,
  profileWithoutAvatarFixture,
  profileWithoutDisplayNameFixture,
  userWithAvatarFixture,
  userWithoutAvatarFixture,
  userWithoutDisplayNameFixture,
} from './auth';

describe('auth test fixtures', () => {
  it('crea usuario auth con overrides mínimos', () => {
    const user = createAuthUser({ email: 'custom@motoatlas.com', id: 'user-custom' });

    expect(user.id).toBe('user-custom');
    expect(user.email).toBe('custom@motoatlas.com');
    expect(user.app_metadata.provider).toBe('email');
  });

  it('crea perfil y sesión componibles', () => {
    const profile = createUserProfile({ displayName: 'Piloto Test' });
    const session = createSession({ access_token: 'custom-token', user: createAuthUser({ id: 'user-session' }) });

    expect(profile.displayName).toBe('Piloto Test');
    expect(session.access_token).toBe('custom-token');
    expect(session.user.id).toBe('user-session');
  });

  it('deriva estado auth por defecto y admin cuando corresponde', () => {
    const unauth = createAuthState();
    const adminState = createAuthState({ user: adminUserFixture, profile: adminProfileFixture, session: mockSessionFixture });

    expect(unauth.isAuthenticated).toBe(false);
    expect(unauth.isAdmin).toBe(false);

    expect(adminState.isAuthenticated).toBe(true);
    expect(adminState.isAdmin).toBe(true);
    expect(adminState.profile?.role).toBe('admin');
  });

  it('expone fixtures predefinidos para casos comunes', () => {
    expect(authUserFixture.email).toBeTruthy();
    expect(userWithoutDisplayNameFixture.user_metadata.display_name).toBeNull();
    expect(userWithAvatarFixture.user_metadata.avatar_url).toContain('avatars');
    expect(userWithoutAvatarFixture.user_metadata.avatar_url).toBeNull();

    expect(profileWithoutDisplayNameFixture.displayName).toBeNull();
    expect(profileWithoutAvatarFixture.avatarUrl).toBeNull();
    expect(incompleteProfileFixture.displayName).toBeNull();
    expect(incompleteProfileFixture.avatarUrl).toBeNull();

    expect(mockUnauthenticatedAuthState.isAuthenticated).toBe(false);
    expect(mockAuthenticatedAuthState.isAuthenticated).toBe(true);
    expect(mockAdminAuthState.isAdmin).toBe(true);
  });
});
