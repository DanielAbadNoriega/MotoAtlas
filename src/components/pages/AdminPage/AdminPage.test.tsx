import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import {
  getReviewReports,
  resolveReportWithReviewStatus,
  updateReviewReportStatus,
  type AdminReviewReport,
} from '../../../services/adminModerationService';
import { AdminDashboardPage, AdminModerationPage, AdminReviewsPage } from './AdminPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/adminModerationService', () => ({
  getReviewReports: vi.fn(),
  resolveReportWithReviewStatus: vi.fn(),
  updateReviewReportStatus: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const getReviewReportsMock = vi.mocked(getReviewReports);
const resolveReportWithReviewStatusMock = vi.mocked(resolveReportWithReviewStatus);
const updateReviewReportStatusMock = vi.mocked(updateReviewReportStatus);

const adminAuth = {
  user: { id: 'admin-1', email: 'admin@motoatlas.com' },
  session: { access_token: 'admin-token' },
  profile: { id: 'admin-1', displayName: 'Admin Rider', avatarUrl: null, role: 'admin' },
  isAuthenticated: true,
  isAdmin: true,
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

const reports: readonly AdminReviewReport[] = [
  {
    comment: 'Dice que tiene control de crucero y no es cierto.',
    createdAt: '2026-05-21T10:00:00.000Z',
    id: 'report-1',
    reason: 'false_information',
    reporterDisplayName: 'Fromen_01',
    reporterUserId: 'reporter-1',
    review: {
      comment: 'Tiene cruise control de serie.',
      cons: ['peso', 'calor'],
      id: 'review-1',
      motorcycle: {
        brand: 'BMW',
        id: 'test-bmw-f-900-gs',
        imageUrl: '/bmw.jpg',
        model: 'F 900 GS',
        year: 2024,
      },
      motorcycleId: 'test-bmw-f-900-gs',
      pros: ['fiabilidad', 'consumo'],
      rating: 4,
      status: 'approved',
      userName: 'Curvasypuños',
    },
    reviewId: 'review-1',
    status: 'pending',
    updatedAt: '2026-05-21T10:00:00.000Z',
  },
];

function buildReport(index: number, overrides: Partial<AdminReviewReport> = {}): AdminReviewReport {
  const baseReport = reports[0];

  return {
    ...baseReport,
    id: `report-${index}`,
    reporterDisplayName: `Reporter_${index}`,
    reporterUserId: `reporter-${index}`,
    review: baseReport.review
      ? {
          ...baseReport.review,
          id: `review-${index}`,
          userName: `Rider_${index}`,
        }
      : baseReport.review,
    reviewId: `review-${index}`,
    ...overrides,
  };
}

function mockAuth(overrides = {}) {
  useAuthMock.mockReturnValue({ ...adminAuth, ...overrides } as never);
}

describe('AdminPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    getReviewReportsMock.mockReset().mockResolvedValue(reports);
    resolveReportWithReviewStatusMock.mockReset().mockResolvedValue(undefined);
    updateReviewReportStatusMock.mockReset().mockResolvedValue(undefined);
    mockAuth();
  });

  it('bloquea moderación sin sesión', () => {
    mockAuth({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
    });

    render(<AdminModerationPage />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para acceder al panel admin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
    expect(getReviewReportsMock).not.toHaveBeenCalled();
  });

  it('bloquea usuario autenticado que no es admin', () => {
    mockAuth({
      profile: { id: 'user-1', displayName: 'User', avatarUrl: null, role: 'user' },
      isAdmin: false,
    });

    render(<AdminModerationPage />);

    expect(screen.getByRole('heading', { name: /No tienes permisos para acceder a esta zona/i })).toBeInTheDocument();
    expect(getReviewReportsMock).not.toHaveBeenCalled();
  });

  it('bloquea admin reviews sin sesión', () => {
    mockAuth({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
    });

    render(<AdminReviewsPage />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para acceder al panel admin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
    expect(getReviewReportsMock).not.toHaveBeenCalled();
  });

  it('bloquea admin reviews para usuario no admin', () => {
    mockAuth({
      profile: { id: 'user-1', displayName: 'User', avatarUrl: null, role: 'user' },
      isAdmin: false,
    });

    render(<AdminReviewsPage />);

    expect(screen.getByRole('heading', { name: /No tienes permisos para acceder a esta zona/i })).toBeInTheDocument();
    expect(getReviewReportsMock).not.toHaveBeenCalled();
  });

  it('renderiza dashboard admin mínimo', () => {
    render(<AdminDashboardPage />);

    expect(screen.getByRole('heading', { name: 'Panel de administración' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a moderación/i })).toHaveAttribute('href', '#/admin/moderacion');
    expect(screen.getByRole('navigation', { name: /Navegación de administración/i })).toBeInTheDocument();
  });

  it('admin ve reviews agrupadas por moto con pendientes y última review', async () => {
    getReviewReportsMock.mockResolvedValueOnce([
      {
        ...reports[0],
        createdAt: '2026-05-21T10:00:00.000Z',
        id: 'report-bike-1-pending',
        review: reports[0].review
          ? {
              ...reports[0].review,
              createdAt: '2026-05-20T08:00:00.000Z',
              id: 'review-bike-1-pending',
              motorcycleId: 'test-bmw-f-900-gs',
              status: 'pending',
            }
          : null,
        reviewId: 'review-bike-1-pending',
      },
      {
        ...reports[0],
        createdAt: '2026-05-20T10:00:00.000Z',
        id: 'report-bike-1-approved',
        review: reports[0].review
          ? {
              ...reports[0].review,
              createdAt: '2026-05-19T08:00:00.000Z',
              id: 'review-bike-1-approved',
              motorcycleId: 'test-bmw-f-900-gs',
              status: 'approved',
            }
          : null,
        reviewId: 'review-bike-1-approved',
      },
      {
        ...reports[0],
        createdAt: '2026-05-22T10:00:00.000Z',
        id: 'report-bike-2-pending',
        review: reports[0].review
          ? {
              ...reports[0].review,
              createdAt: '2026-05-21T09:00:00.000Z',
              id: 'review-bike-2-pending',
              motorcycle: {
                brand: 'Aprilia',
                id: 'test-aprilia-tuareg-660',
                imageUrl: '/aprilia.jpg',
                model: 'Tuareg 660',
                year: 2024,
              },
              motorcycleId: 'test-aprilia-tuareg-660',
              status: 'pending',
            }
          : null,
        reviewId: 'review-bike-2-pending',
      },
      {
        ...reports[0],
        createdAt: '2026-05-22T11:00:00.000Z',
        id: 'report-bike-2-duplicate',
        review: reports[0].review
          ? {
              ...reports[0].review,
              createdAt: '2026-05-21T09:00:00.000Z',
              id: 'review-bike-2-pending',
              motorcycle: {
                brand: 'Aprilia',
                id: 'test-aprilia-tuareg-660',
                imageUrl: '/aprilia.jpg',
                model: 'Tuareg 660',
                year: 2024,
              },
              motorcycleId: 'test-aprilia-tuareg-660',
              status: 'pending',
            }
          : null,
        reviewId: 'review-bike-2-pending',
      },
    ]);
    render(<AdminReviewsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Reviews por modelo' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Aprilia Tuareg 660 2024' })).toBeInTheDocument();
    expect(getReviewReportsMock).toHaveBeenCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { reason: 'all', sort: 'recent', status: 'all' },
    );

    const cards = screen.getAllByTestId('admin-review-summary-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveClass('account-page__review-summary-card');
    expect(cards[0]).toHaveClass('admin-page__review-summary-card');

    expect(within(cards[0]).getByText('1 review nueva')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Última review: 21 may 2026')).toBeInTheDocument();
    expect(within(cards[0]).getByRole('link', { name: 'Revisar reviews' })).toHaveAttribute('href', '#/admin/reviews');
    expect(within(cards[0]).getByRole('link', { name: 'Ver ficha' })).toHaveAttribute('href', '#/motos/test-aprilia-tuareg-660');

    expect(within(cards[1]).getByRole('heading', { name: 'BMW F 900 GS 2024' })).toBeInTheDocument();
    expect(within(cards[1]).getByText('1 review nueva')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Última review: 20 may 2026')).toBeInTheDocument();
  });

  it('admin ve moderación y reportes con datos de review', async () => {
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    expect(screen.getByRole('heading', { name: 'Moderación' })).toBeInTheDocument();
    expect(await screen.findByText('Información falsa')).toBeInTheDocument();
    expect(screen.getByText(/Reportado por/i)).toBeInTheDocument();
    const reporterName = screen.getByText('Fromen_01');
    expect(reporterName).toBeInTheDocument();
    expect(reporterName).toHaveAttribute('title', 'reporter-1');
    expect(screen.getByText(/BMW F 900 GS 2024 · Review de @Curvasypuños · ★ 4/i)).toBeInTheDocument();
    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(getReviewReportsMock).toHaveBeenCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { reason: 'all', sort: 'recent', status: 'pending' },
    );

    const card = (await screen.findAllByTestId('admin-report-card'))[0];
    const toggleButton = within(card).getByRole('button', { name: /Expandir reporte Información falsa de Fromen_01/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(within(card).queryByRole('button', { name: /Marcar revisado/i })).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(card).getByText(/Tiene cruise control de serie/i)).toBeVisible();
    expect(within(card).getByText('Pros:')).toBeInTheDocument();
    expect(within(card).getByText('fiabilidad, consumo')).toBeInTheDocument();
    expect(within(card).getByText('Contras:')).toBeInTheDocument();
    expect(within(card).getByText('peso, calor')).toBeInTheDocument();
    expect(within(card).getByText(/Dice que tiene control de crucero/i)).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Descartar reporte' })).toHaveClass('admin-page__action-button--dismiss');
    expect(within(card).getByRole('button', { name: 'Marcar como resuelto' })).toHaveClass('admin-page__action-button--resolved');
    expect(within(card).getByRole('heading', { name: 'Gestionar reporte' })).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: 'Gestionar review' })).toBeInTheDocument();
    expect(screen.queryByText('Acción tomada')).not.toBeInTheDocument();
    expect(screen.queryByText(/^null$/i)).not.toBeInTheDocument();
  });

  it('filtra por estado, motivo y orden', async () => {
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    await screen.findByText('Información falsa');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    expect(within(filters).getByRole('heading', { name: 'Filtros' })).toBeInTheDocument();
    expect(filters.querySelector('.admin-page__filters-header')).toBeInTheDocument();
    expect(filters.querySelector('.admin-page__filters-body')).toBeInTheDocument();
    expect(filters.querySelector('.admin-page__filters-footer')).toBeInTheDocument();
    expect(within(filters).getAllByRole('button', { name: 'Limpiar filtros' }).length).toBeGreaterThan(0);
    expect(within(filters).getByRole('button', { name: 'Aplicar filtros' })).toBeInTheDocument();
    const statusGroup = within(filters).getByRole('heading', { name: 'Estado del reporte' }).closest('.admin-page__filter-group');
    const reasonGroup = within(filters).getByRole('heading', { name: 'Motivo' }).closest('.admin-page__filter-group');
    const orderGroup = within(filters).getByRole('heading', { name: 'Orden' }).closest('.admin-page__filter-group');

    expect(statusGroup).not.toBeNull();
    expect(reasonGroup).not.toBeNull();
    expect(orderGroup).not.toBeNull();
    expect(filters.querySelectorAll('.material-symbols-outlined').length).toBeGreaterThan(0);
    expect(within(statusGroup as HTMLElement).getByRole('button', { name: 'Estado del reporte' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(reasonGroup as HTMLElement).getByRole('button', { name: 'Motivo' })).toHaveAttribute('aria-expanded', 'false');
    expect(within(orderGroup as HTMLElement).getByRole('button', { name: 'Orden' })).toHaveAttribute('aria-expanded', 'false');

    await user.click(within(reasonGroup as HTMLElement).getByRole('button', { name: 'Motivo' }));
    await user.click(within(orderGroup as HTMLElement).getByRole('button', { name: 'Orden' }));
    expect(within(reasonGroup as HTMLElement).getByRole('button', { name: 'Motivo' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(orderGroup as HTMLElement).getByRole('button', { name: 'Orden' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(within(statusGroup as HTMLElement).getByRole('button', { name: /Estado del reporte: Todos/i }));
    await user.click(within(reasonGroup as HTMLElement).getByRole('button', { name: /Motivo: Ofensivo/i }));
    await user.click(within(orderGroup as HTMLElement).getByRole('button', { name: /Orden: Más antiguos/i }));
    expect(within(statusGroup as HTMLElement).getByRole('button', { name: /Estado del reporte: Resueltos/i })).toBeInTheDocument();

    await waitFor(() => expect(getReviewReportsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { reason: 'offensive', sort: 'oldest', status: 'all' },
    ));
  });

  it('permite abrir y cerrar secciones desplegables de filtros admin', async () => {
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    await screen.findByText('Información falsa');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    const statusToggle = within(filters).getByRole('button', { name: 'Estado del reporte' });
    const reasonToggle = within(filters).getByRole('button', { name: 'Motivo' });
    const sortToggle = within(filters).getByRole('button', { name: 'Orden' });

    expect(statusToggle).toHaveAttribute('aria-expanded', 'true');
    expect(reasonToggle).toHaveAttribute('aria-expanded', 'false');
    expect(sortToggle).toHaveAttribute('aria-expanded', 'false');
    expect(statusToggle).toHaveAttribute('aria-controls');
    expect(reasonToggle).toHaveAttribute('aria-controls');
    expect(sortToggle).toHaveAttribute('aria-controls');

    await user.click(reasonToggle);
    await user.click(sortToggle);
    expect(reasonToggle).toHaveAttribute('aria-expanded', 'true');
    expect(sortToggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(statusToggle);
    expect(statusToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('permite cambiar estado de reporte y de review con feedback claro', async () => {
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const card = (await screen.findAllByTestId('admin-report-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir reporte/i }));
    await user.click(within(card).getByRole('button', { name: /Marcar revisado/i }));

    expect(updateReviewReportStatusMock).toHaveBeenCalledWith('report-1', 'reviewed', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Reporte marcado como revisado.'));

    await user.click(within(card).getByRole('button', { name: 'Descartar reporte' }));
    expect(updateReviewReportStatusMock).toHaveBeenCalledWith('report-1', 'dismissed', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Reporte descartado.'));

    await user.click(within(card).getByRole('button', { name: 'Marcar como resuelto' }));
    expect(updateReviewReportStatusMock).toHaveBeenCalledWith('report-1', 'action_taken', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Reporte marcado como resuelto.'));

    await user.click(within(card).getByRole('button', { name: /^Ocultar$/i }));
    expect(resolveReportWithReviewStatusMock).toHaveBeenCalledWith('report-1', 'review-1', 'hidden', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Review ocultada y reporte marcado como resuelto.'));

    await user.click(within(card).getByRole('button', { name: /^Aprobar$/i }));
    expect(resolveReportWithReviewStatusMock).toHaveBeenCalledWith('report-1', 'review-1', 'approved', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Review aprobada y reporte marcado como resuelto.'));

    await user.click(within(card).getByRole('button', { name: /^Rechazar$/i }));
    expect(resolveReportWithReviewStatusMock).toHaveBeenCalledWith('report-1', 'review-1', 'rejected', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Review rechazada y reporte marcado como resuelto.'));
  });

  it('muestra empty, loading y error', async () => {
    getReviewReportsMock.mockResolvedValueOnce([]);
    const { unmount } = render(<AdminModerationPage />);

    expect(await screen.findByRole('heading', { name: /No hay reportes con estos filtros/i })).toBeInTheDocument();
    unmount();

    getReviewReportsMock.mockImplementationOnce(() => new Promise(() => undefined));
    render(<AdminModerationPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando reportes...');
    unmount();

    getReviewReportsMock.mockRejectedValueOnce(new Error('permission denied'));
    render(<AdminModerationPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los reportes.');
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('deshabilita acciones redundantes según estado actual', async () => {
    getReviewReportsMock.mockResolvedValueOnce([{
      ...reports[0],
      status: 'action_taken',
      review: reports[0].review ? { ...reports[0].review, status: 'hidden' } : reports[0].review,
    }]);
    render(<AdminModerationPage />);

    const card = (await screen.findAllByTestId('admin-report-card'))[0];
    await userEvent.setup().click(within(card).getByRole('button', { name: /Expandir reporte/i }));
    expect(within(card).getByRole('button', { name: 'Marcar como resuelto' })).toBeDisabled();
    expect(within(card).getByRole('button', { name: /^Ocultar$/i })).toBeDisabled();
    expect(within(card).getByText('Resuelto')).toBeInTheDocument();
  });

  it('oculta comentario/pros/contras cuando vienen vacíos y usa fallback de reportante', async () => {
    getReviewReportsMock.mockResolvedValueOnce([{
      ...reports[0],
      comment: null,
      reporterDisplayName: 'Usuario sin alias',
      review: reports[0].review
        ? {
            ...reports[0].review,
            pros: [],
            cons: ['null'],
          }
        : reports[0].review,
    }]);
    render(<AdminModerationPage />);

    expect(await screen.findByText('Usuario sin alias')).toBeInTheDocument();
    expect(screen.queryByLabelText('Comentario del reporte')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Pros reportados')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Contras reportados')).not.toBeInTheDocument();
    expect(screen.queryByText(/^null$/i)).not.toBeInTheDocument();
  });

  it('muestra error claro si falla una acción de moderación', async () => {
    updateReviewReportStatusMock.mockRejectedValueOnce(new Error('permission denied'));
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const card = (await screen.findAllByTestId('admin-report-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir reporte/i }));
    await user.click(within(card).getByRole('button', { name: /Marcar revisado/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo completar la acción de moderación.'));
  });

  it('permite expandir y colapsar cards, y abrir varias a la vez', async () => {
    const user = userEvent.setup();
    getReviewReportsMock.mockResolvedValueOnce([
      reports[0],
      {
        ...reports[0],
        id: 'report-2',
        reporterDisplayName: 'RoadWolf',
        reporterUserId: 'reporter-2',
      },
    ]);
    render(<AdminModerationPage />);

    const cards = await screen.findAllByTestId('admin-report-card');
    expect(cards).toHaveLength(2);

    const firstToggle = within(cards[0]).getByRole('button', { name: /Expandir reporte/i });
    const secondToggle = within(cards[1]).getByRole('button', { name: /Expandir reporte/i });

    expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    expect(secondToggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(firstToggle);
    await user.click(secondToggle);

    expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
    expect(secondToggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(firstToggle);
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('pagina reportes de 6 en 6 y actualiza resumen', async () => {
    const user = userEvent.setup();
    getReviewReportsMock.mockResolvedValueOnce(Array.from({ length: 13 }, (_, index) => buildReport(index + 1)));
    render(<AdminModerationPage />);

    expect(await screen.findByText('Información falsa')).toBeInTheDocument();
    expect(screen.getAllByTestId('admin-report-card')).toHaveLength(6);
    expect(screen.getByText('Mostrando 1-6 de 13 reportes')).toBeInTheDocument();

    const pagination = screen.getByRole('navigation', { name: 'Paginación de reportes admin' });
    expect(pagination).toBeInTheDocument();
    expect(within(pagination).getByRole('button', { name: /Primera página/i })).toBeDisabled();
    expect(within(pagination).getByRole('button', { name: /Página anterior/i })).toBeDisabled();
    expect(within(pagination).getByRole('button', { name: /Página 1/i })).toHaveAttribute('aria-current', 'page');

    await user.click(within(pagination).getByRole('button', { name: /Página siguiente/i }));
    expect(screen.getAllByTestId('admin-report-card')).toHaveLength(6);
    expect(screen.getByText('Mostrando 7-12 de 13 reportes')).toBeInTheDocument();
    expect(within(pagination).getByRole('button', { name: /Página 2/i })).toHaveAttribute('aria-current', 'page');

    await user.click(within(pagination).getByRole('button', { name: /Página siguiente/i }));
    expect(screen.getAllByTestId('admin-report-card')).toHaveLength(1);
    expect(screen.getByText('Mostrando 13-13 de 13 reportes')).toBeInTheDocument();
    expect(within(pagination).getByRole('button', { name: /Última página/i })).toBeDisabled();
    expect(within(pagination).getByRole('button', { name: /Página 3/i })).toHaveAttribute('aria-current', 'page');

    await user.click(within(pagination).getByRole('button', { name: /Página anterior/i }));
    expect(screen.getByText('Mostrando 7-12 de 13 reportes')).toBeInTheDocument();
    expect(within(pagination).getByRole('button', { name: /Página 2/i })).toHaveAttribute('aria-current', 'page');
  });

  it('no muestra paginación cuando hay 6 reportes o menos', async () => {
    getReviewReportsMock.mockResolvedValueOnce(Array.from({ length: 6 }, (_, index) => buildReport(index + 1)));
    render(<AdminModerationPage />);

    expect(await screen.findByText('Información falsa')).toBeInTheDocument();
    expect(screen.getAllByTestId('admin-report-card')).toHaveLength(6);
    expect(screen.queryByRole('navigation', { name: 'Paginación de reportes admin' })).not.toBeInTheDocument();
  });

  it('resetea a página 1 al cambiar filtros o limpiar filtros', async () => {
    const user = userEvent.setup();
    getReviewReportsMock.mockResolvedValue(Array.from({ length: 13 }, (_, index) => buildReport(index + 1)));
    render(<AdminModerationPage />);

    expect(await screen.findByText('Información falsa')).toBeInTheDocument();
    let pagination = screen.getByRole('navigation', { name: 'Paginación de reportes admin' });
    await user.click(within(pagination).getByRole('button', { name: /Página siguiente/i }));
    expect(screen.getByText('Mostrando 7-12 de 13 reportes')).toBeInTheDocument();

    const filters = screen.getByRole('region', { name: /Filtros/i });
    const reasonGroup = within(filters).getByRole('heading', { name: 'Motivo' }).closest('.admin-page__filter-group');
    expect(reasonGroup).not.toBeNull();
    await user.click(within(reasonGroup as HTMLElement).getByRole('button', { name: 'Motivo' }));
    await user.click(within(reasonGroup as HTMLElement).getByRole('button', { name: /Motivo: Ofensivo/i }));
    expect(screen.getByText('Mostrando 1-6 de 13 reportes')).toBeInTheDocument();

    pagination = screen.getByRole('navigation', { name: 'Paginación de reportes admin' });
    await user.click(within(pagination).getByRole('button', { name: /Página siguiente/i }));
    expect(screen.getByText('Mostrando 7-12 de 13 reportes')).toBeInTheDocument();

    const clearButtons = within(filters).getAllByRole('button', { name: 'Limpiar filtros' });
    await user.click(clearButtons[0]);
    expect(screen.getByText('Mostrando 1-6 de 13 reportes')).toBeInTheDocument();
    expect(getReviewReportsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { reason: 'all', sort: 'recent', status: 'pending' },
    );
  });

  it('cierra cards abiertas cuando cambia de página', async () => {
    const user = userEvent.setup();
    getReviewReportsMock.mockResolvedValueOnce(Array.from({ length: 13 }, (_, index) => buildReport(index + 1)));
    render(<AdminModerationPage />);

    const firstPageCards = await screen.findAllByTestId('admin-report-card');
    expect(firstPageCards).toHaveLength(6);
    const firstCardToggle = within(firstPageCards[0]).getByRole('button', { name: /Expandir reporte/i });
    await user.click(firstCardToggle);
    expect(firstCardToggle).toHaveAttribute('aria-expanded', 'true');

    const pagination = screen.getByRole('navigation', { name: 'Paginación de reportes admin' });
    await user.click(within(pagination).getByRole('button', { name: /Página siguiente/i }));

    await user.click(within(pagination).getByRole('button', { name: /Página anterior/i }));
    const firstPageCardsAgain = await screen.findAllByTestId('admin-report-card');
    const firstCardToggleAgain = within(firstPageCardsAgain[0]).getByRole('button', { name: /Expandir reporte/i });
    expect(firstCardToggleAgain).toHaveAttribute('aria-expanded', 'false');
  });
});
