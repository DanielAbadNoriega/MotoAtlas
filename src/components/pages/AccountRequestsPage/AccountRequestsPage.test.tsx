import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { getModelRequestsByUserId } from '../../../services/modelRequestService';
import { AccountRequestsPage } from './AccountRequestsPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/modelRequestService', () => ({
  getModelRequestsByUserId: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const getModelRequestsByUserIdMock = vi.mocked(getModelRequestsByUserId);
const signOutMock = vi.fn();

const modelRequests = [
  {
    id: 'request-1',
    userId: 'user-1',
    brand: 'Ducati',
    model: 'Monster',
    year: 2026,
    segment: 'naked',
    contactEmail: 'rider@motoatlas.com',
    officialUrl: 'https://ducati.example/monster',
    comment: 'Mercado: España\n\nMe interesa para comparar contra la competencia A2.',
    status: 'pending',
    source: 'user',
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'request-2',
    userId: 'user-1',
    brand: 'Honda',
    model: 'CBR600RR',
    year: 2024,
    segment: 'sport',
    contactEmail: null,
    officialUrl: null,
    comment: 'Versión europea si vuelve al catálogo.',
    status: 'approved',
    source: 'user',
    createdAt: '2026-05-16T10:00:00.000Z',
    updatedAt: '2026-05-16T10:00:00.000Z',
  },
  {
    id: 'request-3',
    userId: 'user-1',
    brand: 'Yamaha',
    model: 'R9',
    year: 2025,
    segment: 'sport',
    contactEmail: null,
    officialUrl: null,
    comment: null,
    status: 'rejected',
    source: 'user',
    createdAt: '2026-05-17T10:00:00.000Z',
    updatedAt: '2026-05-17T10:00:00.000Z',
  },
] as const;

function mockAuth(overrides = {}) {
  useAuthMock.mockReturnValue({
    user: { id: 'user-1', email: 'rider@motoatlas.com' },
    session: { access_token: 'session-token' },
    profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    isAuthenticated: true,
    isAdmin: false,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: signOutMock,
    refreshProfile: vi.fn(),
    ...overrides,
  } as never);
}

describe('AccountRequestsPage', () => {
  beforeEach(() => {
    window.location.hash = '';
    signOutMock.mockReset().mockResolvedValue(undefined);
    getModelRequestsByUserIdMock.mockReset().mockResolvedValue(modelRequests);
    mockAuth();
  });

  it('mantiene estado controlado sin sesión y no consulta solicitudes', () => {
    mockAuth({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
    });

    render(<AccountRequestsPage />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para ver tus solicitudes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
    expect(getModelRequestsByUserIdMock).not.toHaveBeenCalled();
  });

  it('renderiza título, contadores, solicitudes, official_url y skeleton CTA sin imágenes', async () => {
    render(<AccountRequestsPage />);

    expect(await screen.findByRole('heading', { name: 'Todas mis solicitudes' })).toBeInTheDocument();
    expect(screen.getByText(/Consulta los modelos que has propuesto/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Resumen de solicitudes')).toHaveTextContent(/Total\s*3/);
    expect(screen.getByLabelText('Resumen de solicitudes')).toHaveTextContent(/Pendientes\s*1/);
    expect(screen.getByText('Ducati Monster')).toBeInTheDocument();
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0);
    expect(screen.getByText('España')).toBeInTheDocument();
    expect(screen.getAllByText('rider@motoatlas.com').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Página oficial/i })).toHaveAttribute('href', 'https://ducati.example/monster');
    expect(screen.getByRole('link', { name: /Solicitar otro modelo/i })).toHaveAttribute('href', '#/solicitar-modelo');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('filtra por estado', async () => {
    const user = userEvent.setup();
    render(<AccountRequestsPage />);

    await screen.findByText('Ducati Monster');
    await user.selectOptions(screen.getByLabelText('Estado'), 'rejected');

    expect(screen.getByText('Yamaha R9')).toBeInTheDocument();
    expect(screen.getAllByText('Rechazada').length).toBeGreaterThan(0);
    expect(screen.queryByText('Ducati Monster')).not.toBeInTheDocument();
  });

  it('busca por marca o modelo', async () => {
    const user = userEvent.setup();
    render(<AccountRequestsPage />);

    await screen.findByText('Ducati Monster');
    await user.type(screen.getByLabelText('Buscar'), 'honda');

    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument();
    expect(screen.queryByText('Ducati Monster')).not.toBeInTheDocument();
  });

  it('ordena por fecha y año', async () => {
    const user = userEvent.setup();
    render(<AccountRequestsPage />);

    await screen.findByText('Ducati Monster');
    await user.selectOptions(screen.getByLabelText('Orden'), 'oldest');
    expect(within(screen.getAllByTestId('model-request-card')[0]).getByText('Honda CBR600RR')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Orden'), 'year-desc');
    expect(within(screen.getAllByTestId('model-request-card')[0]).getByText('Ducati Monster')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Orden'), 'year-asc');
    expect(within(screen.getAllByTestId('model-request-card')[0]).getByText('Honda CBR600RR')).toBeInTheDocument();
  });

  it('muestra empty state si no hay solicitudes', async () => {
    getModelRequestsByUserIdMock.mockResolvedValue([]);

    render(<AccountRequestsPage />);

    expect(await screen.findByRole('heading', { name: 'Aún no has solicitado modelos.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Solicitar otro modelo/i })).toBeInTheDocument();
  });

  it('muestra empty state si los filtros no devuelven resultados', async () => {
    const user = userEvent.setup();
    render(<AccountRequestsPage />);

    await screen.findByText('Ducati Monster');
    await user.type(screen.getByLabelText('Buscar'), 'kawasaki');

    expect(screen.getByRole('heading', { name: /No hay solicitudes con esos filtros/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Solicitar otro modelo/i })).toBeInTheDocument();
  });

  it('muestra loading mientras carga solicitudes', () => {
    getModelRequestsByUserIdMock.mockReturnValue(new Promise(() => undefined));
    render(<AccountRequestsPage />);

    expect(screen.getByText('Cargando tus solicitudes...')).toBeInTheDocument();
    expect(getModelRequestsByUserIdMock).toHaveBeenCalledWith({ accessToken: 'session-token', userId: 'user-1' });
  });

  it('muestra errores de carga', async () => {
    getModelRequestsByUserIdMock.mockRejectedValue(new Error('RLS rejected'));
    render(<AccountRequestsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('RLS rejected');
  });

  it('marca Mis solicitudes como activo y cierra sesión desde el sidebar', async () => {
    const user = userEvent.setup();
    render(<AccountRequestsPage />);

    expect(screen.getByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '#/cuenta');
    expect(screen.getByRole('link', { name: 'Mis reviews' })).toHaveAttribute('href', '#/cuenta/reviews');
    expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/');
  });
});
