import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseClient } from '../../shared/supabase/supabaseClient';
import { createAuthUser, createSession, createUserProfile } from '../../test/fixtures/auth';
import { AuthProvider, useAuth } from './AuthProvider';

vi.mock('../../shared/supabase/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

const getSupabaseClientMock = vi.mocked(getSupabaseClient);

function Consumer() {
  const { isAuthenticated, isLoading, profile, user } = useAuth();

  if (isLoading) {
    return <p>Cargando auth</p>;
  }

  return <p>{isAuthenticated ? `${profile?.displayName ?? user?.email}` : 'Sin sesión'}</p>;
}

function createClientWithSession() {
  const unsubscribe = vi.fn();
  const user = createAuthUser({
    id: 'user-1',
    email: 'rider@motoatlas.com',
  });
  const session = createSession({
    access_token: 'token',
    user,
  });
  const profile = createUserProfile({
    id: user.id,
    avatarUrl: null,
    displayName: 'Rider Zero',
    role: 'user',
  });
  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        id: profile.id,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        role: profile.role,
      },
      error: null,
    }),
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } })),
    },
    from: vi.fn(() => profileQuery),
    unsubscribe,
  };
}

describe('AuthProvider', () => {
  beforeEach(() => {
    getSupabaseClientMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('carga estado no autenticado si no hay Supabase configurado', async () => {
    getSupabaseClientMock.mockReturnValue(null);

    render(<AuthProvider><Consumer /></AuthProvider>);

    expect(await screen.findByText('Sin sesión')).toBeInTheDocument();
  });

  it('carga sesión inicial y perfil', async () => {
    const client = createClientWithSession();
    getSupabaseClientMock.mockReturnValue(client as never);

    render(<AuthProvider><Consumer /></AuthProvider>);

    expect(await screen.findByText('Rider Zero')).toBeInTheDocument();
    expect(client.auth.getSession).toHaveBeenCalledTimes(1);
    expect(client.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('limpia la suscripción de auth al desmontar', async () => {
    const client = createClientWithSession();
    getSupabaseClientMock.mockReturnValue(client as never);

    const view = render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(client.auth.onAuthStateChange).toHaveBeenCalled());
    view.unmount();

    expect(client.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
