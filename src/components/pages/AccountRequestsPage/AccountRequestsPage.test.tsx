import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { getModelRequestsByUserId, type ModelRequest, type ModelRequestStatus } from '../../../services/modelRequestService';
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

function createModelRequest(overrides: Partial<ModelRequest> = {}): ModelRequest {
  const id = overrides.id ?? 'request-1';
  const index = Number(id.replace(/\D/g, '')) || 1;

  return {
    id,
    userId: overrides.userId ?? 'user-1',
    userName: overrides.userName ?? null,
    brand: overrides.brand ?? 'Ducati',
    model: overrides.model ?? `Model ${index}`,
    year: overrides.year ?? 2020 + index,
    segment: overrides.segment ?? 'naked',
    contactEmail: overrides.contactEmail ?? null,
    officialUrl: overrides.officialUrl ?? null,
    comment: overrides.comment ?? null,
    status: overrides.status ?? 'pending',
    source: overrides.source ?? 'user',
    createdAt: overrides.createdAt ?? `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T10:00:00.000Z`,
    updatedAt: overrides.updatedAt ?? `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T10:00:00.000Z`,
  };
}

function buildModelRequestSet(count: number, getOverrides: (index: number) => Partial<ModelRequest> = () => ({})) {
  const statuses: ModelRequestStatus[] = ['pending', 'reviewed', 'approved', 'rejected'];

  return Array.from({ length: count }, (_, index) => createModelRequest({
    id: `request-${index + 1}`,
    brand: index % 2 === 0 ? 'Ducati' : 'Honda',
    model: `Request ${index + 1}`,
    status: statuses[index % statuses.length],
    year: 2020 + index,
    createdAt: `2026-05-${String(Math.min(index + 1, 28)).padStart(2, '0')}T10:00:00.000Z`,
    updatedAt: `2026-05-${String(Math.min(index + 1, 28)).padStart(2, '0')}T10:00:00.000Z`,
    ...getOverrides(index),
  }));
}

const modelRequests: readonly ModelRequest[] = [
  createModelRequest({
    id: 'request-1',
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
  }),
  createModelRequest({
    id: 'request-2',
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
  }),
  createModelRequest({
    id: 'request-3',
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
  }),
];

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
    expect(screen.queryByRole('button', { name: 'Página siguiente' })).not.toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: 'Página siguiente' })).not.toBeInTheDocument();
  });

  it('muestra empty state si los filtros no devuelven resultados', async () => {
    const user = userEvent.setup();
    render(<AccountRequestsPage />);

    await screen.findByText('Ducati Monster');
    await user.type(screen.getByLabelText('Buscar'), 'kawasaki');

    expect(screen.getByRole('heading', { name: /No hay solicitudes con esos filtros/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Solicitar otro modelo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Página siguiente' })).not.toBeInTheDocument();
  });

  it('pagina 8 solicitudes reales y deja el CTA como novena card visual sin alterar contadores', async () => {
    const user = userEvent.setup();
    getModelRequestsByUserIdMock.mockResolvedValue(buildModelRequestSet(9, () => ({ status: 'pending' })));

    render(<AccountRequestsPage />);

    await screen.findAllByTestId('model-request-card');

    const list = screen.getByRole('region', { name: 'Listado de solicitudes' });
    const cta = within(list).getByRole('link', { name: /Solicitar otro modelo/i });

    expect(within(list).getAllByTestId('model-request-card')).toHaveLength(8);
    expect(list.children).toHaveLength(9);
    expect(list.lastElementChild).toBe(cta);
    expect(screen.getAllByRole('link', { name: /Solicitar otro modelo/i })).toHaveLength(1);
    expect(screen.getByLabelText('Resumen de solicitudes')).toHaveTextContent(/Total\s*9/);
    expect(screen.getByLabelText('Resumen de solicitudes')).toHaveTextContent(/Pendientes\s*9/);
    expect(cta).toHaveAttribute('href', '#/solicitar-modelo');

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));

    const secondPageList = screen.getByRole('region', { name: 'Listado de solicitudes' });
    expect(within(secondPageList).getAllByTestId('model-request-card')).toHaveLength(1);
    expect(secondPageList.children).toHaveLength(2);
    expect(secondPageList.lastElementChild).toBe(within(secondPageList).getByRole('link', { name: /Solicitar otro modelo/i }));
  });

  it.each([
    [16, 2],
    [17, 3],
  ])('calcula %i solicitudes reales como %i páginas', async (requestCount, expectedPages) => {
    getModelRequestsByUserIdMock.mockResolvedValue(buildModelRequestSet(requestCount));

    render(<AccountRequestsPage />);

    await screen.findAllByTestId('model-request-card');

    expect(screen.getAllByRole('button', { name: /^Página \d+$/ })).toHaveLength(expectedPages);
    expect(screen.getByRole('button', { name: `Página ${expectedPages}` })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: `Página ${expectedPages + 1}` })).not.toBeInTheDocument();
  });

  it('navega con primera/anterior/siguiente/última y limita los números visibles a 5', async () => {
    const user = userEvent.setup();
    getModelRequestsByUserIdMock.mockResolvedValue(buildModelRequestSet(49));

    render(<AccountRequestsPage />);

    await screen.findAllByTestId('model-request-card');

    expect(screen.getAllByTestId('model-request-card')).toHaveLength(8);
    expect(screen.getAllByRole('button', { name: /^Página \d+$/ })).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Primera página' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Última página' }));
    expect(screen.getByRole('button', { name: 'Página 7' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Última página' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(screen.getByRole('button', { name: 'Página 6' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Primera página' }));
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('vuelve a página 1 al cambiar búsqueda, filtro u ordenación', async () => {
    const user = userEvent.setup();
    getModelRequestsByUserIdMock.mockResolvedValue(buildModelRequestSet(20, (index) => ({
      brand: 'Ducati',
      status: index < 12 ? 'pending' : 'approved',
    })));

    render(<AccountRequestsPage />);

    await screen.findAllByTestId('model-request-card');

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    await user.type(screen.getByLabelText('Buscar'), 'ducati');
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await user.selectOptions(screen.getByLabelText('Estado'), 'pending');
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await user.selectOptions(screen.getByLabelText('Orden'), 'oldest');
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
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
