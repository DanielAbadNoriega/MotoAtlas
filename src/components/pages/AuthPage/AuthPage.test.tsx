import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthContextValue, useAuth } from '../../../features/auth';
import {
  createAuthSnapshot,
  createAuthState,
  createAuthUser,
  createSession,
  mockUnauthenticatedAuthState,
} from '../../../test/fixtures/auth';
import { AuthPage } from './AuthPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const signInMock = vi.fn();
const signUpMock = vi.fn();
const signOutMock = vi.fn();
const refreshProfileMock = vi.fn();

function mockAuth(overrides: Partial<AuthContextValue> = {}) {
  useAuthMock.mockReturnValue(createAuthState({
    ...mockUnauthenticatedAuthState,
    signIn: signInMock,
    signUp: signUpMock,
    signOut: signOutMock,
    refreshProfile: refreshProfileMock,
    ...overrides,
  }) as never);
}

describe('AuthPage', () => {
  beforeEach(() => {
    window.location.hash = '';
    signInMock.mockReset().mockResolvedValue(
      createAuthSnapshot({
        user: createAuthUser({ email: 'rider@motoatlas.com', id: 'user-1' }),
        session: createSession({ access_token: 'signin-token' }),
      }),
    );
    signUpMock.mockReset().mockResolvedValue(
      createAuthSnapshot({
        user: createAuthUser({ email: 'new@motoatlas.com', id: 'user-1' }),
        session: createSession({ access_token: 'signup-token' }),
      }),
    );
    signOutMock.mockReset().mockResolvedValue(undefined);
    refreshProfileMock.mockReset().mockResolvedValue(null);
    mockAuth();
  });

  it('valida email y contraseña en login', async () => {
    const user = userEvent.setup();
    render(<AuthPage mode="login" />);

    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Revisa los campos obligatorios/i);
    expect(screen.getByText('El email es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('inicia sesión y redirige a Mi cuenta', async () => {
    const user = userEvent.setup();
    render(<AuthPage mode="login" />);

    await user.type(screen.getByLabelText('Email'), 'rider@motoatlas.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secret123');
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

    expect(signInMock).toHaveBeenCalledWith({ email: 'rider@motoatlas.com', password: 'secret123' });
    expect(await screen.findByRole('status')).toHaveTextContent(/Sesión iniciada/i);
    expect(window.location.hash).toBe('#/cuenta');
  });

  it('alterna hacia crear cuenta', () => {
    render(<AuthPage mode="login" />);

    expect(screen.getByRole('link', { name: /Crear cuenta/i })).toHaveAttribute('href', '#/registro');
  });

  it('valida alias y confirmación en registro', async () => {
    const user = userEvent.setup();
    render(<AuthPage mode="register" />);

    await user.type(screen.getByLabelText('Email'), 'new@motoatlas.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secret123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'secret456');
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }));

    expect(screen.getByText('El alias es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('envía registro con alias y muestra mensaje neutro seguro', async () => {
    const user = userEvent.setup();
    render(<AuthPage mode="register" />);

    await user.type(screen.getByLabelText(/Alias/i), 'MotoViajero');
    await user.type(screen.getByLabelText('Email'), 'new@motoatlas.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secret123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'secret123');
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }));

    expect(signUpMock).toHaveBeenCalledWith({ displayName: 'MotoViajero', email: 'new@motoatlas.com', password: 'secret123' });
    const status = await screen.findByRole('status');

    expect(status).toHaveTextContent('Si los datos son válidos, recibirás un correo con las instrucciones para continuar.');
    expect(status).not.toHaveTextContent(/Cuenta creada|Usuario creado|Tu cuenta se ha creado/i);
    expect(status).not.toHaveTextContent(/email ya existe/i);
  });

  it('muestra errores del servicio', async () => {
    signInMock.mockRejectedValue(new Error('Credenciales inválidas'));
    const user = userEvent.setup();
    render(<AuthPage mode="login" />);

    await user.type(screen.getByLabelText('Email'), 'rider@motoatlas.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secret123');
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
  });
});
