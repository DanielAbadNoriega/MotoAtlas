import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { AccountPage } from './AccountPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const signOutMock = vi.fn();

function mockAuth(overrides = {}) {
  useAuthMock.mockReturnValue({
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: signOutMock,
    refreshProfile: vi.fn(),
    ...overrides,
  } as never);
}

describe('AccountPage', () => {
  beforeEach(() => {
    window.location.hash = '';
    signOutMock.mockReset().mockResolvedValue(undefined);
    mockAuth();
  });

  it('muestra estado controlado si no hay sesión', () => {
    render(<AccountPage />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para ver Mi cuenta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
  });

  it('muestra email, alias, resumen y placeholders si hay usuario', () => {
    mockAuth({
      isAuthenticated: true,
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(screen.getByRole('heading', { name: 'Rider Zero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Resumen de perfil/i })).toBeInTheDocument();
    expect(screen.getByText('rider@motoatlas.com')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mis reviews/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mis solicitudes/i })).toBeInTheDocument();
  });

  it('cierra sesión y vuelve al inicio', async () => {
    mockAuth({
      isAuthenticated: true,
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: null, avatarUrl: null, role: 'user' },
    });
    const user = userEvent.setup();
    render(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/');
  });
});
