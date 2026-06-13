import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from './authService';
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

function StateConsumer() {
  const { isAuthenticated, isAdmin, isLoading, profile, user } = useAuth();

  return (
    <>
      <p>Estado carga: {isLoading ? 'cargando' : 'listo'}</p>
      <p>Autenticado: {isAuthenticated ? 'sí' : 'no'}</p>
      <p>Perfil: {profile?.displayName ?? 'sin perfil'}</p>
      <p>Rol admin: {isAdmin ? 'sí' : 'no'}</p>
      <p>Usuario: {user?.email ?? 'sin usuario'}</p>
    </>
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

type ProfileQueryResult = {
  data: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    role: UserProfile['role'];
  } | null;
  error: null;
};

function toProfileQueryResult(profile: UserProfile | null): ProfileQueryResult {
  return {
    data: profile
      ? {
          id: profile.id,
          display_name: profile.displayName,
          avatar_url: profile.avatarUrl,
          role: profile.role,
        }
      : null,
    error: null,
  };
}

function createClient(options: {
  initialSession?: Session | null;
  profileResponses?: Array<Promise<ProfileQueryResult> | ProfileQueryResult>;
} = {}) {
  const { initialSession = null, profileResponses = [] } = options;
  const unsubscribe = vi.fn();
  let authStateChangeHandler: ((event: string, nextSession: Session | null) => void) | null = null;
  const pendingProfileResponses = [...profileResponses];
  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() => {
      const nextResponse = pendingProfileResponses.shift();

      if (!nextResponse) {
        return Promise.resolve({ data: null, error: null });
      }

      return nextResponse instanceof Promise ? nextResponse : Promise.resolve(nextResponse);
    }),
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: initialSession },
        error: null,
      }),
      onAuthStateChange: vi.fn((handler: (event: string, nextSession: Session | null) => void) => {
        authStateChangeHandler = handler;
        return { data: { subscription: { unsubscribe } } };
      }),
    },
    from: vi.fn(() => profileQuery),
    unsubscribe,
    emitAuthStateChange(nextSession: Session | null, event = 'SIGNED_IN') {
      if (!authStateChangeHandler) {
        throw new Error('onAuthStateChange todavía no fue registrado');
      }

      act(() => {
        authStateChangeHandler?.(event, nextSession);
      });
    },
  };
}

function createSessionUser(overrides: Partial<User> = {}) {
  return createAuthUser({
    id: 'user-1',
    email: 'rider@motoatlas.com',
    ...overrides,
  });
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
    const user = createSessionUser();
    const session = createSession({ access_token: 'token', user });
    const profile = createUserProfile({
      id: user.id,
      avatarUrl: null,
      displayName: 'Rider Zero',
      role: 'user',
    });
    const client = createClient({
      initialSession: session,
      profileResponses: [toProfileQueryResult(profile)],
    });
    getSupabaseClientMock.mockReturnValue(client as never);

    render(<AuthProvider><Consumer /></AuthProvider>);

    expect(await screen.findByText('Rider Zero')).toBeInTheDocument();
    expect(client.auth.getSession).toHaveBeenCalledTimes(1);
    expect(client.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('mantiene loading durante onAuthStateChange hasta resolver el perfil y luego deriva admin', async () => {
    const deferredProfile = createDeferred<ProfileQueryResult>();
    const user = createSessionUser({ id: 'admin-1', email: 'admin@motoatlas.com' });
    const session = createSession({ access_token: 'admin-token', user });
    const profile = createUserProfile({
      id: user.id,
      displayName: 'Admin MotoAtlas',
      avatarUrl: null,
      role: 'admin',
    });
    const client = createClient({ profileResponses: [deferredProfile.promise] });
    getSupabaseClientMock.mockReturnValue(client as never);

    render(
      <AuthProvider>
        <StateConsumer />
      </AuthProvider>,
    );

    expect(await screen.findByText('Estado carga: listo')).toBeInTheDocument();
    expect(screen.getByText('Autenticado: no')).toBeInTheDocument();
    expect(screen.getByText('Perfil: sin perfil')).toBeInTheDocument();

    client.emitAuthStateChange(session);

    expect(screen.getByText('Estado carga: cargando')).toBeInTheDocument();
    expect(screen.getByText('Autenticado: no')).toBeInTheDocument();
    expect(screen.getByText('Perfil: sin perfil')).toBeInTheDocument();
    expect(screen.getByText('Rol admin: no')).toBeInTheDocument();

    deferredProfile.resolve(toProfileQueryResult(profile));

    expect(await screen.findByText('Estado carga: listo')).toBeInTheDocument();
    expect(screen.getByText('Autenticado: sí')).toBeInTheDocument();
    expect(screen.getByText('Perfil: Admin MotoAtlas')).toBeInTheDocument();
    expect(screen.getByText('Rol admin: sí')).toBeInTheDocument();
    expect(screen.getByText('Usuario: admin@motoatlas.com')).toBeInTheDocument();
  });

  it('liquida onAuthStateChange sin sesión limpiando auth y loading', async () => {
    const user = createSessionUser();
    const session = createSession({ access_token: 'token', user });
    const profile = createUserProfile({
      id: user.id,
      avatarUrl: null,
      displayName: 'Rider Zero',
      role: 'user',
    });
    const client = createClient({
      initialSession: session,
      profileResponses: [toProfileQueryResult(profile)],
    });
    getSupabaseClientMock.mockReturnValue(client as never);

    render(
      <AuthProvider>
        <StateConsumer />
      </AuthProvider>,
    );

    expect(await screen.findByText('Perfil: Rider Zero')).toBeInTheDocument();
    expect(screen.getByText('Autenticado: sí')).toBeInTheDocument();

    client.emitAuthStateChange(null, 'SIGNED_OUT');

    await waitFor(() => {
      expect(screen.getByText('Estado carga: listo')).toBeInTheDocument();
      expect(screen.getByText('Autenticado: no')).toBeInTheDocument();
      expect(screen.getByText('Perfil: sin perfil')).toBeInTheDocument();
      expect(screen.getByText('Rol admin: no')).toBeInTheDocument();
      expect(screen.getByText('Usuario: sin usuario')).toBeInTheDocument();
    });
  });

  it('limpia la suscripción de auth al desmontar', async () => {
    const user = createSessionUser();
    const session = createSession({ access_token: 'token', user });
    const profile = createUserProfile({
      id: user.id,
      avatarUrl: null,
      displayName: 'Rider Zero',
      role: 'user',
    });
    const client = createClient({
      initialSession: session,
      profileResponses: [toProfileQueryResult(profile)],
    });
    getSupabaseClientMock.mockReturnValue(client as never);

    const view = render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(client.auth.onAuthStateChange).toHaveBeenCalled());
    view.unmount();

    expect(client.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
