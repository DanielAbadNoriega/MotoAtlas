import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseClient } from '../../shared/supabase/supabaseClient';
import {
  getCurrentAuthSnapshot,
  signInWithEmailAndPassword,
  signOutCurrentUser,
  signUpWithEmailAndPassword,
} from './authService';

vi.mock('../../shared/supabase/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

const getSupabaseClientMock = vi.mocked(getSupabaseClient);

function createMockClient() {
  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        display_name: 'Rider Zero',
        avatar_url: null,
        role: 'user',
        created_at: '2026-05-18T00:00:00.000Z',
        updated_at: '2026-05-18T00:00:00.000Z',
      },
      error: null,
    }),
    update: vi.fn().mockReturnThis(),
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: 'user-1', email: 'rider@motoatlas.com' } } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: 'user-1', email: 'rider@motoatlas.com' } } },
        error: null,
      }),
    },
    from: vi.fn(() => profileQuery),
    profileQuery,
  };
}

describe('authService', () => {
  beforeEach(() => {
    getSupabaseClientMock.mockReset();
  });

  it('devuelve sesión vacía si no hay cliente Supabase configurado', async () => {
    getSupabaseClientMock.mockReturnValue(null);

    await expect(getCurrentAuthSnapshot()).resolves.toEqual({ session: null, user: null, profile: null });
  });

  it('signIn llama a Supabase Auth con email normalizado y carga perfil', async () => {
    const client = createMockClient();
    getSupabaseClientMock.mockReturnValue(client as never);

    const snapshot = await signInWithEmailAndPassword({ email: ' Rider@MotoAtlas.COM ', password: 'secret123' });

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'rider@motoatlas.com', password: 'secret123' });
    expect(client.from).toHaveBeenCalledWith('user_profiles');
    expect(snapshot.user?.email).toBe('rider@motoatlas.com');
    expect(snapshot.profile?.displayName).toBe('Rider Zero');
  });

  it('signUp llama a Supabase Auth con display_name para el trigger de perfil', async () => {
    const client = createMockClient();
    getSupabaseClientMock.mockReturnValue(client as never);

    await signUpWithEmailAndPassword({ displayName: 'MotoViajero', email: 'new@motoatlas.com', password: 'secret123' });

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: 'new@motoatlas.com',
      password: 'secret123',
      options: { data: { display_name: 'MotoViajero' } },
    });
  });

  it('signOut llama a Supabase Auth', async () => {
    const client = createMockClient();
    getSupabaseClientMock.mockReturnValue(client as never);

    await signOutCurrentUser();

    expect(client.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('valida email y contraseña antes de llamar a Supabase', async () => {
    const client = createMockClient();
    getSupabaseClientMock.mockReturnValue(client as never);

    await expect(signInWithEmailAndPassword({ email: '', password: '' })).rejects.toThrow('El email es obligatorio');
    expect(client.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});
