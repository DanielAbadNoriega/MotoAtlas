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
import { AdminDashboardPage, AdminModerationPage } from './AdminPage';

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

  it('renderiza dashboard admin mínimo', () => {
    render(<AdminDashboardPage />);

    expect(screen.getByRole('heading', { name: 'Panel admin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a moderación/i })).toHaveAttribute('href', '#/admin/moderacion');
    expect(screen.getByRole('navigation', { name: /Navegación de administración/i })).toBeInTheDocument();
  });

  it('admin ve moderación y reportes con datos de review', async () => {
    render(<AdminModerationPage />);

    expect(screen.getByRole('heading', { name: 'Moderación' })).toBeInTheDocument();
    expect(await screen.findByText('Información falsa')).toBeInTheDocument();
    expect(screen.getByText(/Reportado por/i)).toBeInTheDocument();
    const reporterName = screen.getByText('Fromen_01');
    expect(reporterName).toBeInTheDocument();
    expect(reporterName).toHaveAttribute('title', 'reporter-1');
    expect(screen.getByText('BMW F 900 GS 2024')).toBeInTheDocument();
    expect(screen.getByText(/Review de @Curvasypuños · ★ 4/i)).toBeInTheDocument();
    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText(/Tiene cruise control de serie/i)).toBeInTheDocument();
    expect(screen.getByText('Pros:')).toBeInTheDocument();
    expect(screen.getByText('fiabilidad, consumo')).toBeInTheDocument();
    expect(screen.getByText('Contras:')).toBeInTheDocument();
    expect(screen.getByText('peso, calor')).toBeInTheDocument();
    expect(screen.getByText(/Dice que tiene control de crucero/i)).toBeInTheDocument();
    expect(getReviewReportsMock).toHaveBeenCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { reason: 'all', sort: 'recent', status: 'pending' },
    );
    expect(screen.getByRole('button', { name: 'Descartar reporte' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar como resuelto' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gestionar reporte' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gestionar review' })).toBeInTheDocument();
    expect(screen.queryByText('Acción tomada')).not.toBeInTheDocument();
    expect(screen.queryByText(/^null$/i)).not.toBeInTheDocument();
  });

  it('filtra por estado, motivo y orden', async () => {
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    await screen.findByText('Información falsa');
    const filters = screen.getByLabelText('Filtros admin');
    const statusGroup = within(filters).getByRole('heading', { name: 'Estado del reporte' }).closest('.admin-page__filter-group');
    const reasonGroup = within(filters).getByRole('heading', { name: 'Motivo' }).closest('.admin-page__filter-group');
    const orderGroup = within(filters).getByRole('heading', { name: 'Orden' }).closest('.admin-page__filter-group');

    expect(statusGroup).not.toBeNull();
    expect(reasonGroup).not.toBeNull();
    expect(orderGroup).not.toBeNull();

    await user.click(within(statusGroup as HTMLElement).getByRole('button', { name: 'Todos' }));
    await user.click(within(reasonGroup as HTMLElement).getByRole('button', { name: 'Ofensivo' }));
    await user.click(within(orderGroup as HTMLElement).getByRole('button', { name: 'Más antiguos' }));
    expect(within(statusGroup as HTMLElement).getByRole('button', { name: 'Resueltos' })).toBeInTheDocument();

    await waitFor(() => expect(getReviewReportsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { reason: 'offensive', sort: 'oldest', status: 'all' },
    ));
  });

  it('permite cambiar estado de reporte y de review con feedback claro', async () => {
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const card = (await screen.findAllByTestId('admin-report-card'))[0];
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
    await user.click(within(card).getByRole('button', { name: /Marcar revisado/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo completar la acción de moderación.'));
  });
});
