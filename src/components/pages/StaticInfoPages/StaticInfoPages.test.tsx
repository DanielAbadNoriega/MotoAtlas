import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { createModelRequest } from '../../../services/modelRequestService';
import {
  DataMethodologyPage,
  DataSourcesPage,
  PrivacyPage,
  RequestModelPage,
  TermsPage,
} from './StaticInfoPages';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/modelRequestService', () => ({
  createModelRequest: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const createModelRequestMock = vi.mocked(createModelRequest);

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
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  } as never);
}

describe('StaticInfoPages', () => {
  beforeEach(() => {
    createModelRequestMock.mockReset().mockResolvedValue({
      id: 'request-1',
      userId: null,
      brand: 'Honda',
      model: 'CBR600RR',
      year: 2026,
      segment: 'sport',
      contactEmail: null,
      comment: null,
      status: 'pending',
      source: 'user',
      createdAt: '2026-05-19T10:00:00.000Z',
      updatedAt: '2026-05-19T10:00:00.000Z',
    });
    mockAuth();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renderiza metodología con etiquetas de procedencia de datos', () => {
    render(<DataMethodologyPage />);

    expect(screen.getByRole('heading', { name: /Datos técnicos con contexto/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Explorar motos/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('api').length).toBeGreaterThan(0);
    expect(screen.getAllByText('manual').length).toBeGreaterThan(0);
    expect(screen.getAllByText('estimated').length).toBeGreaterThan(0);
    expect(screen.getAllByText('user').length).toBeGreaterThan(0);
    expect(screen.getAllByText('placeholder').length).toBeGreaterThan(0);
  });

  it('renderiza fuentes de datos con bloque de transparencia', () => {
    render(<DataSourcesPage />);

    expect(screen.getByRole('heading', { name: /Sabe de dónde viene cada dato/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Source Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Data Architecture/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Confidence Index Protocol/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Explorar motos/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Precio en euros con `price_source`/i)).toBeInTheDocument();
    expect(screen.getByText(/Solo el contenido approved se muestra públicamente/i)).toBeInTheDocument();
    expect(screen.getByText(/verifica siempre la información con el fabricante o concesionario/i)).toBeInTheDocument();
  });

  it('renderiza privacidad y términos como páginas legales sobrias', () => {
    const { rerender } = render(<PrivacyPage />);

    expect(screen.getByRole('heading', { name: 'Privacidad' })).toBeInTheDocument();
    expect(screen.getAllByText(/Esta política podrá actualizarse/i).length).toBeGreaterThan(0);

    rerender(<TermsPage />);

    expect(screen.getByRole('heading', { name: /Términos de uso/i })).toBeInTheDocument();
    expect(screen.getByText(/no sustituye la verificación oficial/i)).toBeInTheDocument();
  });

  it('navega por el índice legal sin romper la ruta hash actual', async () => {
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const user = userEvent.setup();

    window.location.hash = '#/terminos';
    const { rerender } = render(<TermsPage />);

    await user.click(screen.getByRole('link', { name: /01 · Uso de MotoAtlas/i }));

    expect(window.location.hash).toBe('#/terminos');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    window.location.hash = '#/privacidad';
    rerender(<PrivacyPage />);

    await user.click(screen.getByRole('link', { name: /01 · Datos que podemos recoger/i }));

    expect(window.location.hash).toBe('#/privacidad');
    expect(scrollIntoView).toHaveBeenCalledTimes(2);

    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('valida campos obligatorios en Solicitar modelo', async () => {
    const user = userEvent.setup();
    render(<RequestModelPage />);

    await user.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Revisa los campos obligatorios/i);
    expect(screen.getByText('La marca es obligatoria.')).toBeInTheDocument();
    expect(screen.getByText('El modelo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('El año es obligatorio.')).toBeInTheDocument();
  });

  it('envía solicitud anónima y muestra success real', async () => {
    const user = userEvent.setup();
    render(<RequestModelPage />);

    await user.type(screen.getByLabelText('Marca'), 'Honda');
    await user.type(screen.getByLabelText('Modelo'), 'CBR600RR');
    await user.type(screen.getByLabelText('Año'), '2026');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'sport');
    await user.type(screen.getByLabelText(/Email de contacto opcional/i), 'rider@motoatlas.com');
    await user.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(createModelRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: 'Honda',
        contactEmail: 'rider@motoatlas.com',
        model: 'CBR600RR',
        segment: 'sport',
        year: 2026,
      }),
      undefined,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/Solicitud enviada/i);
  });

  it('muestra loading mientras envía solicitud de modelo', async () => {
    createModelRequestMock.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<RequestModelPage />);

    await user.type(screen.getByLabelText('Marca'), 'Honda');
    await user.type(screen.getByLabelText('Modelo'), 'CBR600RR');
    await user.type(screen.getByLabelText('Año'), '2026');
    await user.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(screen.getByRole('button', { name: /Enviando/i })).toBeDisabled();
  });

  it('muestra error si falla el envío real de solicitud', async () => {
    createModelRequestMock.mockRejectedValue(new Error('RLS rejected'));
    const user = userEvent.setup();
    render(<RequestModelPage />);

    await user.type(screen.getByLabelText('Marca'), 'Honda');
    await user.type(screen.getByLabelText('Modelo'), 'CBR600RR');
    await user.type(screen.getByLabelText('Año'), '2026');
    await user.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('RLS rejected');
  });

  it('pasa authContext al service cuando el usuario está autenticado', async () => {
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-123', email: 'rider@motoatlas.com' },
    });
    const user = userEvent.setup();
    render(<RequestModelPage />);

    expect(screen.getByText(/Esta solicitud quedará asociada a tu cuenta/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Email de contacto opcional/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Marca'), 'Honda');
    await user.type(screen.getByLabelText('Modelo'), 'CBR600RR');
    await user.type(screen.getByLabelText('Año'), '2026');
    await user.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(createModelRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: 'Honda',
        model: 'CBR600RR',
        year: 2026,
      }),
      { accessToken: 'session-token', userId: 'user-123' },
    );
  });
});
