import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthContextValue, useAuth } from '../../../features/auth';
import {
  getReviewReports,
  resolveReportWithReviewStatus,
  updateReviewReportStatus,
  type AdminReviewReport,
} from '../../../services/adminModerationService';
import { getAllReviews } from '../../../services/adminReviewService';
import {
  getAdminPendingReplies,
  updateReviewReplyStatus,
  type AdminReviewReply,
} from '../../../services/adminReplyService';
import {
  getReviewAspectsByReviewIds,
  type MotorcycleReview,
} from '../../../services/motorcycleReviewService';
import { AdminDashboardPage, AdminModerationPage, AdminRequestsPage, AdminReviewsPage } from './AdminPage';

import {
  getAllModelRequests,
  updateModelRequestStatus,
  type ModelRequest,
  type ModelRequestStatus,
} from '../../../services/modelRequestService';
import { createAuthState, createAuthUser, createSession, createUserProfile, mockAdminAuthState } from '../../../test/fixtures/auth';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/adminModerationService', () => ({
  getReviewReports: vi.fn(),
  resolveReportWithReviewStatus: vi.fn(),
  updateReviewReportStatus: vi.fn(),
}));

vi.mock('../../../services/adminReviewService', () => ({
  getAllReviews: vi.fn(),
}));

vi.mock('../../../services/adminReplyService', () => ({
  getAdminPendingReplies: vi.fn(),
  updateReviewReplyStatus: vi.fn(),
}));

vi.mock('../../../services/modelRequestService', () => ({
  getAllModelRequests: vi.fn(),
  updateModelRequestStatus: vi.fn(),
}));

vi.mock('../../../services/motorcycleReviewService', () => ({
  getReviewAspectsByReviewIds: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const getReviewReportsMock = vi.mocked(getReviewReports);
const getAllReviewsMock = vi.mocked(getAllReviews);
const getReviewAspectsByReviewIdsMock = vi.mocked(getReviewAspectsByReviewIds);
const resolveReportWithReviewStatusMock = vi.mocked(resolveReportWithReviewStatus);
const updateReviewReportStatusMock = vi.mocked(updateReviewReportStatus);
const getAdminPendingRepliesMock = vi.mocked(getAdminPendingReplies);
const updateReviewReplyStatusMock = vi.mocked(updateReviewReplyStatus);
const getAllModelRequestsMock = vi.mocked(getAllModelRequests);
const updateModelRequestStatusMock = vi.mocked(updateModelRequestStatus);
const signInMock = vi.fn();
const signUpMock = vi.fn();
const signOutMock = vi.fn();
const refreshProfileMock = vi.fn();
const {
  signIn: _adminSignIn,
  signUp: _adminSignUp,
  signOut: _adminSignOut,
  refreshProfile: _adminRefreshProfile,
  ...adminAuthState
} = mockAdminAuthState;

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

function buildReview(overrides: Partial<MotorcycleReview> = {}): MotorcycleReview {
  return {
    id: overrides.id ?? 'review-1',
    motorcycleId: overrides.motorcycleId ?? 'test-bmw-f-900-gs',
    userId: overrides.userId ?? null,
    motorcycle: overrides.motorcycle ?? {
      id: 'test-bmw-f-900-gs',
      brand: 'BMW',
      model: 'F 900 GS',
      year: 2024,
      imageUrl: '/bmw.jpg',
    },
    userName: overrides.userName ?? 'Rider_X',
    rating: overrides.rating ?? 4,
    ridingStyle: overrides.ridingStyle ?? 'viaje',
    ownershipMonths: overrides.ownershipMonths ?? null,
    kilometers: overrides.kilometers ?? null,
    comment: overrides.comment ?? 'Review de prueba.',
    pros: overrides.pros ?? ['bueno'],
    cons: overrides.cons ?? ['malo'],
    verified: overrides.verified ?? false,
    status: overrides.status ?? 'pending',
    source: overrides.source ?? 'user',
    createdAt: overrides.createdAt ?? '2026-05-21T10:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-21T10:00:00.000Z',
  };
}

type MockAuthOverrides = Partial<AuthContextValue> & {
  user?: Partial<NonNullable<AuthContextValue['user']>> | null;
  session?: Partial<NonNullable<AuthContextValue['session']>> | null;
  profile?: Partial<NonNullable<AuthContextValue['profile']>> | null;
};

function mockAuth(overrides: MockAuthOverrides = {}) {
  const {
    user: userOverrides,
    session: sessionOverrides,
    profile: profileOverrides,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    ...stateOverrides
  } = overrides;

  const adminUser = createAuthUser({
    id: 'admin-1',
    email: 'admin@motoatlas.com',
    user_metadata: {
      display_name: 'Admin Rider',
      avatar_url: null,
    },
  });
  const adminProfile = createUserProfile({
    id: 'admin-1',
    displayName: 'Admin Rider',
    avatarUrl: null,
    role: 'admin',
  });
  const adminSession = createSession({ access_token: 'admin-token', user: adminUser });

  const resolvedUser = userOverrides === null
    ? null
    : createAuthUser({
        ...adminUser,
        ...(userOverrides ?? {}),
      });

  const resolvedProfile = profileOverrides === null
    ? null
    : createUserProfile({
        ...adminProfile,
        ...(profileOverrides ?? {}),
      });

  const resolvedSession = sessionOverrides === null
    ? null
    : createSession({
        ...adminSession,
        ...(sessionOverrides ?? {}),
        user: sessionOverrides?.user ?? resolvedUser ?? adminUser,
      });

  useAuthMock.mockReturnValue(createAuthState({
    ...adminAuthState,
    ...stateOverrides,
    user: resolvedUser,
    session: resolvedSession,
    profile: resolvedProfile,
    isAuthenticated: stateOverrides.isAuthenticated ?? true,
    isAdmin: stateOverrides.isAdmin ?? true,
    isLoading: stateOverrides.isLoading ?? false,
    signIn: signIn ?? signInMock,
    signUp: signUp ?? signUpMock,
    signOut: signOut ?? signOutMock,
    refreshProfile: refreshProfile ?? refreshProfileMock,
  }) as never);
}

describe('AdminPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    signInMock.mockReset();
    signUpMock.mockReset();
    signOutMock.mockReset().mockResolvedValue(undefined);
    refreshProfileMock.mockReset();
    getReviewReportsMock.mockReset().mockResolvedValue(reports);
    getAllReviewsMock.mockReset().mockResolvedValue([]);
    resolveReportWithReviewStatusMock.mockReset().mockResolvedValue(undefined);
    updateReviewReportStatusMock.mockReset().mockResolvedValue(undefined);
    getAdminPendingRepliesMock.mockReset().mockResolvedValue([]);
    updateReviewReplyStatusMock.mockReset().mockResolvedValue(undefined);
    getAllModelRequestsMock.mockReset().mockResolvedValue(requestFixtures);
    updateModelRequestStatusMock.mockReset().mockResolvedValue(undefined);
    getReviewAspectsByReviewIdsMock.mockReset().mockResolvedValue([]);
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
    expect(getAllReviewsMock).not.toHaveBeenCalled();
    expect(getReviewReportsMock).not.toHaveBeenCalled();
  });

  it('bloquea admin reviews para usuario no admin', () => {
    mockAuth({
      profile: { id: 'user-1', displayName: 'User', avatarUrl: null, role: 'user' },
      isAdmin: false,
    });

    render(<AdminReviewsPage />);

    expect(screen.getByRole('heading', { name: /No tienes permisos para acceder a esta zona/i })).toBeInTheDocument();
    expect(getAllReviewsMock).not.toHaveBeenCalled();
    expect(getReviewReportsMock).not.toHaveBeenCalled();
  });

  it('renderiza dashboard admin mínimo', () => {
    render(<AdminDashboardPage />);

    expect(screen.getByRole('heading', { name: 'Panel de administración' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a moderación/i })).toHaveAttribute('href', '#/admin/moderacion');
    expect(screen.getByRole('navigation', { name: /Navegación de administración/i })).toBeInTheDocument();
  });

  it('muestra el toggle de datos demo en preview y persiste la preferencia', async () => {
    vi.stubEnv('VITE_APP_ENV', 'preview');
    vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'false');
    const user = userEvent.setup();

    render(<AdminDashboardPage />);

    const toggle = screen.getByRole('checkbox', { name: /Incluir datos demo/i });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/Solo disponible en development\/preview\. En producción nunca habilita datos demo\./i)).toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(window.localStorage.getItem('motoatlas.includeDemoData')).toBe('true');
  });

  it('respeta la preferencia local para datos demo en preview', () => {
    vi.stubEnv('VITE_APP_ENV', 'preview');
    vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'false');
    window.localStorage.setItem('motoatlas.includeDemoData', 'true');

    render(<AdminDashboardPage />);

    expect(screen.getByRole('checkbox', { name: /Incluir datos demo/i })).toBeChecked();
  });

  it('oculta el toggle de datos demo en producción aunque exista preferencia local', () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'true');
    window.localStorage.setItem('motoatlas.includeDemoData', 'true');

    render(<AdminDashboardPage />);

    expect(screen.queryByRole('checkbox', { name: /Incluir datos demo/i })).not.toBeInTheDocument();
  });

  it('admin ve reviews agrupadas por moto con pendientes y última review', async () => {
    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({
        id: 'review-bike-1-pending',
        createdAt: '2026-05-20T08:00:00.000Z',
        motorcycleId: 'test-bmw-f-900-gs',
        status: 'pending',
      }),
      buildReview({
        id: 'review-bike-1-approved',
        createdAt: '2026-05-19T08:00:00.000Z',
        motorcycleId: 'test-bmw-f-900-gs',
        status: 'approved',
      }),
      buildReview({
        id: 'review-bike-2-pending',
        createdAt: '2026-05-21T09:00:00.000Z',
        motorcycleId: 'test-aprilia-tuareg-660',
        motorcycle: { id: 'test-aprilia-tuareg-660', brand: 'Aprilia', model: 'Tuareg 660', year: 2024, imageUrl: '/aprilia.jpg' },
        status: 'pending',
      }),
    ]);
    render(<AdminReviewsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Reviews por modelo' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Aprilia Tuareg 660 2024' })).toBeInTheDocument();
    expect(getAllReviewsMock).toHaveBeenCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
    );
    expect(getReviewReportsMock).not.toHaveBeenCalled();

    const cards = screen.getAllByTestId('admin-review-summary-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveClass('account-page__review-summary-card');
    expect(cards[0]).toHaveClass('admin-page__review-summary-card');

    expect(within(cards[0]).getByText('1 review nueva')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Última review: 21 may 2026')).toBeInTheDocument();
    expect(within(cards[0]).getByRole('link', { name: 'Revisar reviews' })).toHaveAttribute('href', '#/admin/reviews/test-aprilia-tuareg-660');
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
    const statusGroup = within(filters).getByText('Estado del reporte', { selector: '.filter-group__title' }).closest('details') as HTMLDetailsElement | null;
    const reasonGroup = within(filters).getByText('Motivo', { selector: '.filter-group__title' }).closest('details') as HTMLDetailsElement | null;
    const orderGroup = within(filters).getByText('Orden', { selector: '.filter-group__title' }).closest('details') as HTMLDetailsElement | null;

    expect(statusGroup).not.toBeNull();
    expect(reasonGroup).not.toBeNull();
    expect(orderGroup).not.toBeNull();
    expect(filters.querySelectorAll('.material-symbols-outlined').length).toBeGreaterThan(0);
    expect(statusGroup).toHaveAttribute('open');
    expect(reasonGroup).not.toHaveAttribute('open');
    expect(orderGroup).not.toHaveAttribute('open');

    await user.click(within(filters).getByRole('button', { name: /Estado del reporte: Resueltos/i }));
    await user.click(within(filters).getByRole('button', { name: /Motivo: Ofensivo/i }));
    await user.click(within(filters).getByRole('button', { name: /Orden: Más antiguos/i }));
    expect(within(filters).getByRole('button', { name: /Estado del reporte: Resueltos/i })).toHaveAttribute('aria-pressed', 'true');

    await waitFor(() => expect(getReviewReportsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { reason: 'offensive', sort: 'oldest', status: 'action_taken' },
    ));
  });

  it('permite abrir y cerrar secciones desplegables de filtros admin', async () => {
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    await screen.findByText('Información falsa');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    const statusGroup = within(filters).getByText('Estado del reporte', { selector: '.filter-group__title' }).closest('details') as HTMLDetailsElement | null;
    const reasonGroup = within(filters).getByText('Motivo', { selector: '.filter-group__title' }).closest('details') as HTMLDetailsElement | null;
    const orderGroup = within(filters).getByText('Orden', { selector: '.filter-group__title' }).closest('details') as HTMLDetailsElement | null;

    expect(statusGroup).toHaveAttribute('open');
    expect(reasonGroup).not.toHaveAttribute('open');
    expect(orderGroup).not.toHaveAttribute('open');

    const reasonSummary = within(reasonGroup as HTMLElement).getByText('Motivo', { selector: '.filter-group__title' });
    await user.click(reasonSummary);
    const orderSummary = within(orderGroup as HTMLElement).getByText('Orden', { selector: '.filter-group__title' });
    await user.click(orderSummary);
    expect(reasonGroup).toHaveAttribute('open');
    expect(orderGroup).toHaveAttribute('open');

    const statusSummary = within(statusGroup as HTMLElement).getByText('Estado del reporte', { selector: '.filter-group__title' });
    await user.click(statusSummary);
    expect(statusGroup).not.toHaveAttribute('open');
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

  it('muestra y aplica filtros en la página de reviews (estado, origen, verificación)', async () => {
    const user = userEvent.setup();

    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({
        id: 'rev1',
        createdAt: '2026-05-22T09:00:00.000Z',
        motorcycleId: 'bike-1',
        motorcycle: { id: 'bike-1', brand: 'A', model: 'M1', year: 2024, imageUrl: '/a.jpg' },
        status: 'pending',
        source: 'user',
        verified: true,
      }),
      buildReview({
        id: 'rev2',
        createdAt: '2026-05-21T09:00:00.000Z',
        motorcycleId: 'bike-2',
        motorcycle: { id: 'bike-2', brand: 'B', model: 'M2', year: 2023, imageUrl: '/b.jpg' },
        status: 'approved',
        source: 'mock',
        verified: false,
      }),
      buildReview({
        id: 'rev3',
        createdAt: '2026-05-20T09:00:00.000Z',
        motorcycleId: 'bike-3',
        motorcycle: { id: 'bike-3', brand: 'C', model: 'M3', year: 2022, imageUrl: '/c.jpg' },
        status: 'pending',
        source: 'seed',
        verified: false,
      }),
    ]);
    render(<AdminReviewsPage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Reviews por modelo' })).toBeInTheDocument();
    // inicialmente hay 3 tarjetas (una por moto)
    expect(await screen.findAllByTestId('admin-review-summary-card')).toHaveLength(3);

    const filters = screen.getByRole('region', { name: /Filtros/i });
    expect(within(filters).getByRole('heading', { name: 'Filtros' })).toBeInTheDocument();

    // filtrar por estado: Pendientes
    const statusGroup = within(filters).getByText('Estado', { selector: '.filter-group__title' }).closest('details');
    expect(statusGroup).not.toBeNull();
    await user.click(within(filters).getByRole('button', { name: /Estado: Pendientes/i }));

    // ahora solo deben quedar las motos con reviews pendientes (bike-1 y bike-3)
    await waitFor(() => expect(screen.getAllByTestId('admin-review-summary-card')).toHaveLength(2));
    expect(screen.getByRole('heading', { name: 'A M1 2024' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'C M3 2022' })).toBeInTheDocument();

    // limpiar filtros vuelve a mostrar las 3 tarjetas
    const clearButtons = within(filters).getAllByRole('button', { name: 'Limpiar filtros' });
    await user.click(clearButtons[0]);
    await waitFor(() => expect(screen.getAllByTestId('admin-review-summary-card')).toHaveLength(3));

    // abrir sección Origen y filtrar por 'Mock'
    const sourceGroup = within(filters).getByText('Origen', { selector: '.filter-group__title' }).closest('details');
    const sourceSummary = within(sourceGroup as HTMLElement).getByText('Origen', { selector: '.filter-group__title' });
    await user.click(sourceSummary);
    await user.click(within(filters).getByRole('button', { name: /Origen: Mock/i }));
    await waitFor(() => expect(screen.getAllByTestId('admin-review-summary-card')).toHaveLength(1));
    expect(screen.getByRole('heading', { name: 'B M2 2023' })).toBeInTheDocument();

    // probar filtro de verificación
    await user.click(clearButtons[0]);
    const verifiedGroup = within(filters).getByText('Verificadas', { selector: '.filter-group__title' }).closest('details');
    const verifiedSummary = within(verifiedGroup as HTMLElement).getByText('Verificadas', { selector: '.filter-group__title' });
    await user.click(verifiedSummary);
    await user.click(within(filters).getByRole('button', { name: /Verificadas: Verificadas/i }));
    await waitFor(() => expect(screen.getAllByTestId('admin-review-summary-card')).toHaveLength(1));
    expect(screen.getByRole('heading', { name: 'A M1 2024' })).toBeInTheDocument();
  });

  it('muestra reviews de todos los estados con filtro "Todas" sin depender de reportes', async () => {
    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({ id: 'r1', motorcycleId: 'bike-x', status: 'pending', motorcycle: { id: 'bike-x', brand: 'X', model: 'MotoX', year: 2024, imageUrl: '/x.jpg' } }),
      buildReview({ id: 'r2', motorcycleId: 'bike-x', status: 'approved', motorcycle: { id: 'bike-x', brand: 'X', model: 'MotoX', year: 2024, imageUrl: '/x.jpg' } }),
      buildReview({ id: 'r3', motorcycleId: 'bike-x', status: 'rejected', motorcycle: { id: 'bike-x', brand: 'X', model: 'MotoX', year: 2024, imageUrl: '/x.jpg' } }),
      buildReview({ id: 'r4', motorcycleId: 'bike-x', status: 'hidden', motorcycle: { id: 'bike-x', brand: 'X', model: 'MotoX', year: 2024, imageUrl: '/x.jpg' } }),
      buildReview({ id: 'r5', motorcycleId: 'bike-y', status: 'approved', motorcycle: { id: 'bike-y', brand: 'Y', model: 'MotoY', year: 2023, imageUrl: '/y.jpg' } }),
    ]);
    render(<AdminReviewsPage />);

    expect(await screen.findAllByTestId('admin-review-summary-card')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'X MotoX 2024' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Y MotoY 2023' })).toBeInTheDocument();
    expect(getAllReviewsMock).toHaveBeenCalledWith({ accessToken: 'admin-token', userId: 'admin-1' });
    expect(getReviewReportsMock).not.toHaveBeenCalled();
  });

  it('muestra motos con reviews aunque no tengan reportes asociados', async () => {
    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({
        id: 'r1',
        motorcycleId: 'test-bmw-f-900-gs',
        status: 'approved',
        createdAt: '2026-04-01T00:00:00.000Z',
      }),
    ]);
    render(<AdminReviewsPage />);

    expect(await screen.findByRole('heading', { name: 'BMW F 900 GS 2024' })).toBeInTheDocument();
    const card = screen.getByTestId('admin-review-summary-card');
    expect(within(card).getByText('0 reviews nuevas')).toBeInTheDocument();
    expect(within(card).getByText('Última review: 01 abr 2026')).toBeInTheDocument();
    expect(getReviewReportsMock).not.toHaveBeenCalled();
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
    const reasonGroup = within(filters).getByText('Motivo', { selector: '.filter-group__title' }).closest('details') as HTMLDetailsElement | null;
    expect(reasonGroup).not.toBeNull();
    const reasonSummary = within(reasonGroup as HTMLElement).getByText('Motivo', { selector: '.filter-group__title' });
    await user.click(reasonSummary);
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

  it('admin ve todos los filtros en el orden indicado en reviews', async () => {
    getAllReviewsMock.mockResolvedValueOnce([buildReview()]);
    render(<AdminReviewsPage />);

    await screen.findByTestId('admin-review-summary-card');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    const body = filters.querySelector('.admin-page__filters-body');
    expect(body).not.toBeNull();

    const children = Array.from(body!.children);
    expect(children).toHaveLength(8);
    expect(children[0].querySelector('input')).toHaveAttribute('id', 'admin-reviews-search');
    expect(children[1]).toHaveTextContent('Estado');
    expect(children[2]).toHaveTextContent('Origen');
    expect(children[3]).toHaveTextContent('Segmento');
    expect(children[4]).toHaveTextContent('Verificadas');
    expect(children[5]).toHaveTextContent('Carnet');
    expect(children[6]).toHaveTextContent('Uso principal');
    expect(children[7]).toHaveTextContent('Orden');
  });

  it('busca por marca o modelo en reviews', async () => {
    const user = userEvent.setup();
    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({
        id: 'r1',
        createdAt: '2026-05-22T09:00:00.000Z',
        motorcycleId: 'bike-a',
        motorcycle: { id: 'bike-a', brand: 'BMW', model: 'M 1000 XR', year: 2024, imageUrl: '/bmw.jpg' },
        status: 'approved',
      }),
      buildReview({
        id: 'r2',
        createdAt: '2026-05-21T09:00:00.000Z',
        motorcycleId: 'bike-b',
        motorcycle: { id: 'bike-b', brand: 'Aprilia', model: 'Tuareg 660', year: 2024, imageUrl: '/aprilia.jpg' },
        status: 'approved',
      }),
    ]);
    render(<AdminReviewsPage />);

    expect(await screen.findAllByTestId('admin-review-summary-card')).toHaveLength(2);

    const searchInput = screen.getByPlaceholderText('Buscar por marca o modelo');
    await user.type(searchInput, 'BMW');

    await waitFor(() => expect(screen.getAllByTestId('admin-review-summary-card')).toHaveLength(1));
    expect(screen.getByRole('heading', { name: 'BMW M 1000 XR 2024' })).toBeInTheDocument();
  });

  it('filtra por segmento en reviews', async () => {
    const user = userEvent.setup();
    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({
        id: 'r1',
        createdAt: '2026-05-22T09:00:00.000Z',
        motorcycleId: 'bike-a',
        motorcycle: { id: 'bike-a', brand: 'TrailBike', model: 'X', year: 2024, imageUrl: '/a.jpg', segment: 'trail' },
        status: 'approved',
      }),
      buildReview({
        id: 'r2',
        createdAt: '2026-05-21T09:00:00.000Z',
        motorcycleId: 'bike-b',
        motorcycle: { id: 'bike-b', brand: 'SportBike', model: 'Y', year: 2024, imageUrl: '/b.jpg', segment: 'sport' },
        status: 'approved',
      }),
    ]);
    render(<AdminReviewsPage />);

    expect(await screen.findAllByTestId('admin-review-summary-card')).toHaveLength(2);

    const filters = screen.getByRole('region', { name: /Filtros/i });
    const segmentGroup = within(filters).getByText('Segmento', { selector: '.filter-group__title' }).closest('details');
    const segmentSummary = within(segmentGroup as HTMLElement).getByText('Segmento', { selector: '.filter-group__title' });
    await user.click(segmentSummary);
    await user.click(within(filters).getByRole('button', { name: /Segmento: Trail/i }));

    await waitFor(() => expect(screen.getAllByTestId('admin-review-summary-card')).toHaveLength(1));
    expect(screen.getByRole('heading', { name: 'TrailBike X 2024' })).toBeInTheDocument();
  });

  it('filtra por carnet en reviews', async () => {
    const user = userEvent.setup();
    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({
        id: 'r1',
        createdAt: '2026-05-22T09:00:00.000Z',
        motorcycleId: 'bike-a',
        motorcycle: { id: 'bike-a', brand: 'BikeA', model: 'M1', year: 2024, imageUrl: '/a.jpg', license: 'A' },
        status: 'approved',
      }),
      buildReview({
        id: 'r2',
        createdAt: '2026-05-21T09:00:00.000Z',
        motorcycleId: 'bike-b',
        motorcycle: { id: 'bike-b', brand: 'BikeB', model: 'M2', year: 2024, imageUrl: '/b.jpg', license: 'A2' },
        status: 'approved',
      }),
    ]);
    render(<AdminReviewsPage />);

    expect(await screen.findAllByTestId('admin-review-summary-card')).toHaveLength(2);

    const filters = screen.getByRole('region', { name: /Filtros/i });
    const licenseGroup = within(filters).getByText('Carnet', { selector: '.filter-group__title' }).closest('details');
    const licenseSummary = within(licenseGroup as HTMLElement).getByText('Carnet', { selector: '.filter-group__title' });
    await user.click(licenseSummary);
    await user.click(within(filters).getByRole('button', { name: /Carnet: Carnet A$/i }));

    await waitFor(() => expect(screen.getAllByTestId('admin-review-summary-card')).toHaveLength(1));
    expect(screen.getByRole('heading', { name: 'BikeA M1 2024' })).toBeInTheDocument();
  });

  it('filtra por uso principal en reviews', async () => {
    const user = userEvent.setup();
    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({
        id: 'r1',
        createdAt: '2026-05-22T09:00:00.000Z',
        motorcycleId: 'bike-a',
        motorcycle: { id: 'bike-a', brand: 'Viajero', model: 'M1', year: 2024, imageUrl: '/a.jpg' },
        status: 'approved',
        ridingStyle: 'viaje',
      }),
      buildReview({
        id: 'r2',
        createdAt: '2026-05-21T09:00:00.000Z',
        motorcycleId: 'bike-b',
        motorcycle: { id: 'bike-b', brand: 'Urbano', model: 'M2', year: 2024, imageUrl: '/b.jpg' },
        status: 'approved',
        ridingStyle: 'ciudad',
      }),
    ]);
    render(<AdminReviewsPage />);

    expect(await screen.findAllByTestId('admin-review-summary-card')).toHaveLength(2);

    const filters = screen.getByRole('region', { name: /Filtros/i });
    const ridingStyleGroup = within(filters).getByText('Uso principal', { selector: '.filter-group__title' }).closest('details');
    const ridingStyleSummary = within(ridingStyleGroup as HTMLElement).getByText('Uso principal', { selector: '.filter-group__title' });
    await user.click(ridingStyleSummary);
    await user.click(within(filters).getByRole('button', { name: /Uso principal: Ciudad/i }));

    await waitFor(() => expect(screen.getAllByTestId('admin-review-summary-card')).toHaveLength(1));
    expect(screen.getByRole('heading', { name: 'Urbano M2 2024' })).toBeInTheDocument();
  });

  it('cambia orden a antiguas en reviews', async () => {
    const user = userEvent.setup();
    getAllReviewsMock.mockResolvedValueOnce([buildReview()]);
    render(<AdminReviewsPage />);

    await screen.findByTestId('admin-review-summary-card');

    const filters = screen.getByRole('region', { name: /Filtros/i });
    const sortGroup = within(filters).getByText('Orden', { selector: '.filter-group__title' }).closest('details');
    const sortSummary = within(sortGroup as HTMLElement).getByText('Orden', { selector: '.filter-group__title' });
    await user.click(sortSummary);

    const oldButton = within(filters).getByRole('button', { name: /Orden: Más antiguos/i });
    expect(oldButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(oldButton);
    expect(oldButton).toHaveAttribute('aria-pressed', 'true');
    expect(within(filters).getByRole('button', { name: /Orden: Más recientes/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('muestra empty state en reviews sin coincidencias con filtros', async () => {
    const user = userEvent.setup();
    getAllReviewsMock.mockResolvedValueOnce([
      buildReview({
        id: 'r1',
        motorcycleId: 'bike-a',
        motorcycle: { id: 'bike-a', brand: 'BMW', model: 'M1', year: 2024, imageUrl: '/a.jpg' },
        status: 'approved',
      }),
    ]);
    render(<AdminReviewsPage />);

    expect(await screen.findByTestId('admin-review-summary-card')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Buscar por marca o modelo');
    await user.type(searchInput, 'XYZnoexiste');

    await waitFor(() => expect(screen.getByRole('heading', { name: /No hay reviews con estos filtros/i })).toBeInTheDocument());
  });

  const pendingReplies: readonly AdminReviewReply[] = [
    {
      id: 'reply-1',
      reviewId: 'review-10',
      userId: 'reply-user-id',
      userDisplayName: 'ReplyWriter',
      comment: 'Gracias por la review, muy útil!',
      status: 'pending',
      createdAt: '2026-05-23T10:00:00.000Z',
      updatedAt: '2026-05-23T10:00:00.000Z',
      review: {
        comment: 'Excelente moto, la recomiendo.',
        pros: ['manillar alto', 'cómodo'],
        cons: ['consumo algo alto'],
        rating: 4,
        userName: 'RiderUno',
        motorcycle: {
          brand: 'BMW',
          id: 'test-bike',
          imageUrl: '/bmw.jpg',
          model: 'F 900 GS',
          year: 2024,
        },
        motorcycleId: 'test-bike',
      },
    },
  ];

  const requestFixtures: readonly ModelRequest[] = [
    {
      id: 'req-1',
      userId: 'user-1',
      userName: 'Carlos Ruiz',
      brand: 'Honda',
      model: 'Transalp 750',
      year: 2025,
      segment: 'trail',
      contactEmail: 'user@example.com',
      officialUrl: null,
      comment: 'Sería genial tener esta moto en el catálogo.',
      status: 'pending',
      source: 'user',
      createdAt: '2026-05-24T10:00:00.000Z',
      updatedAt: '2026-05-24T10:00:00.000Z',
    },
    {
      id: 'req-2',
      userId: 'admin-1',
      userName: null,
      brand: 'KTM',
      model: '1390 Super Duke R',
      year: 2025,
      segment: 'hypernaked',
      contactEmail: null,
      officialUrl: 'https://www.ktm.com',
      comment: null,
      status: 'reviewed',
      source: 'admin',
      createdAt: '2026-05-23T10:00:00.000Z',
      updatedAt: '2026-05-24T10:00:00.000Z',
    },
  ];

  function buildRequest(index: number, overrides: Partial<ModelRequest> = {}): ModelRequest {
    const base = requestFixtures[0];
    return {
      ...base,
      id: `req-${index}`,
      brand: `Brand_${index}`,
      model: `Model_${index}`,
      ...overrides,
    } as ModelRequest;
  }

  it('admin ve barra de tabs con Reportes y Respuestas pendientes', async () => {
    render(<AdminModerationPage />);

    const tabList = screen.getByRole('tablist', { name: 'Secciones de moderación' });
    expect(tabList).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Reportes de reviews' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Respuestas pendientes' })).toHaveAttribute('aria-selected', 'false');
  });

  it('admin ve empty state al cambiar a pestaña de respuestas sin datos', async () => {
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const repliesTab = screen.getByRole('tab', { name: 'Respuestas pendientes' });
    await user.click(repliesTab);

    expect(await screen.findByText('No hay respuestas pendientes de moderación.')).toBeInTheDocument();
    expect(getAdminPendingRepliesMock).toHaveBeenCalledWith({ accessToken: 'admin-token', userId: 'admin-1' });
  });

  it('admin ve respuestas pendientes con datos de review y moto', async () => {
    getAdminPendingRepliesMock.mockResolvedValue(pendingReplies);
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const repliesTab = screen.getByRole('tab', { name: 'Respuestas pendientes' });
    await user.click(repliesTab);

    const cards = await screen.findAllByTestId('admin-reply-card');
    expect(cards).toHaveLength(1);
    expect(screen.getByText('BMW F 900 GS 2024 · Review de @RiderUno · ★ 4')).toBeInTheDocument();
    expect(cards[0]).toHaveTextContent(/Respuesta de ReplyWriter/);

    const card = cards[0];
    const toggleButton = within(card).getByRole('button', { name: /Expandir respuesta de ReplyWriter/i });
    await user.click(toggleButton);

    expect(within(card).getByText(/Respuesta:/i)).toBeInTheDocument();
    expect(within(card).getByText(/Gracias por la review/i)).toBeInTheDocument();
    expect(within(card).getByText(/Excelente moto/i)).toBeVisible();
    expect(within(card).getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Ocultar' })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
  });

  it('admin puede aprobar una respuesta pendiente', async () => {
    getAdminPendingRepliesMock.mockResolvedValue(pendingReplies);
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const repliesTab = screen.getByRole('tab', { name: 'Respuestas pendientes' });
    await user.click(repliesTab);

    const card = (await screen.findAllByTestId('admin-reply-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Aprobar' }));

    expect(updateReviewReplyStatusMock).toHaveBeenCalledWith('reply-1', 'approved', { accessToken: 'admin-token', userId: 'admin-1' });
    await waitFor(() => expect(screen.getByText('Respuesta aprobada.')).toBeInTheDocument());
    expect(screen.queryByTestId('admin-reply-card')).not.toBeInTheDocument();
  });

  it('admin puede ocultar una respuesta pendiente', async () => {
    getAdminPendingRepliesMock.mockResolvedValue(pendingReplies);
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const repliesTab = screen.getByRole('tab', { name: 'Respuestas pendientes' });
    await user.click(repliesTab);

    const card = (await screen.findAllByTestId('admin-reply-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Ocultar' }));

    expect(updateReviewReplyStatusMock).toHaveBeenCalledWith('reply-1', 'hidden', { accessToken: 'admin-token', userId: 'admin-1' });
    await waitFor(() => expect(screen.getByText('Respuesta oculta.')).toBeInTheDocument());
  });

  it('admin puede rechazar una respuesta pendiente', async () => {
    getAdminPendingRepliesMock.mockResolvedValue(pendingReplies);
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const repliesTab = screen.getByRole('tab', { name: 'Respuestas pendientes' });
    await user.click(repliesTab);

    const card = (await screen.findAllByTestId('admin-reply-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Rechazar' }));

    expect(updateReviewReplyStatusMock).toHaveBeenCalledWith('reply-1', 'rejected', { accessToken: 'admin-token', userId: 'admin-1' });
    await waitFor(() => expect(screen.getByText('Respuesta rechazada.')).toBeInTheDocument());
  });

  it('muestra error si falla carga de respuestas', async () => {
    getAdminPendingRepliesMock.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const repliesTab = screen.getByRole('tab', { name: 'Respuestas pendientes' });
    await user.click(repliesTab);

    expect(await screen.findByText('No se pudieron cargar las respuestas pendientes.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('muestra error si falla acción de moderación de respuesta', async () => {
    getAdminPendingRepliesMock.mockResolvedValue(pendingReplies);
    updateReviewReplyStatusMock.mockRejectedValueOnce(new Error('Fail'));
    const user = userEvent.setup();
    render(<AdminModerationPage />);

    const repliesTab = screen.getByRole('tab', { name: 'Respuestas pendientes' });
    await user.click(repliesTab);

    await screen.findByTestId('admin-reply-card');
    const card = screen.getByTestId('admin-reply-card');
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Aprobar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo completar la acción de moderación.');
  });

  it('bloquea solicitudes sin sesión', () => {
    mockAuth({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
    });

    render(<AdminRequestsPage />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para acceder al panel admin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
    expect(getAllModelRequestsMock).not.toHaveBeenCalled();
  });

  it('bloquea solicitudes para usuario no admin', () => {
    mockAuth({
      profile: { id: 'user-1', displayName: 'User', avatarUrl: null, role: 'user' },
      isAdmin: false,
    });

    render(<AdminRequestsPage />);

    expect(screen.getByRole('heading', { name: /No tienes permisos para acceder a esta zona/i })).toBeInTheDocument();
    expect(getAllModelRequestsMock).not.toHaveBeenCalled();
  });

  it('renderiza lista de solicitudes con datos', async () => {
    render(<AdminRequestsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Solicitudes de modelos' })).toBeInTheDocument();
    expect(await screen.findByText('Honda Transalp 750 2025')).toBeInTheDocument();
    expect(screen.getByText('KTM 1390 Super Duke R 2025')).toBeInTheDocument();
    expect(getAllModelRequestsMock).toHaveBeenCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      {},
    );
  });

  it('expande y colapsa card de solicitud', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const cards = await screen.findAllByTestId('admin-request-card');
    expect(cards).toHaveLength(2);

    const toggleButton = within(cards[0]).getByRole('button', { name: /Expandir solicitud de Honda Transalp 750/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(cards[0]).getByText(/user@example.com/)).toBeVisible();
    expect(within(cards[0]).getByText(/Sería genial tener esta moto/)).toBeVisible();
    expect(within(cards[0]).getByRole('button', { name: 'Marcar revisada' })).toBeInTheDocument();
    expect(within(cards[0]).getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
    expect(within(cards[0]).getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('marca solicitud como revisada', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Marcar revisada' }));

    expect(updateModelRequestStatusMock).toHaveBeenCalledWith('req-1', 'reviewed', { accessToken: 'admin-token', userId: 'admin-1' });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Solicitud marcada como revisada.'));
  });

  it('aprueba solicitud', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Aprobar' }));

    expect(updateModelRequestStatusMock).toHaveBeenCalledWith('req-1', 'approved', { accessToken: 'admin-token', userId: 'admin-1' });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Solicitud aprobada.'));
  });

  it('rechaza solicitud', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Rechazar' }));

    expect(updateModelRequestStatusMock).toHaveBeenCalledWith('req-1', 'rejected', { accessToken: 'admin-token', userId: 'admin-1' });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Solicitud rechazada.'));
  });

  it('deshabilita acción del estado actual', async () => {
    getAllModelRequestsMock.mockResolvedValueOnce([{
      ...requestFixtures[0],
      status: 'approved',
    }]);
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await userEvent.setup().click(within(card).getByRole('button', { name: /Expandir/i }));
    expect(within(card).getByRole('button', { name: 'Aprobar' })).toBeDisabled();
    expect(within(card).getByRole('button', { name: 'Rechazar' })).not.toBeDisabled();
    expect(within(card).getByRole('button', { name: 'Marcar revisada' })).not.toBeDisabled();
  });

  it('muestra empty state', async () => {
    getAllModelRequestsMock.mockResolvedValueOnce([]);
    render(<AdminRequestsPage />);

    expect(await screen.findByRole('heading', { name: /No hay solicitudes con estos filtros/i })).toBeInTheDocument();
  });

  it('muestra loading y error state', async () => {
    getAllModelRequestsMock.mockImplementationOnce(() => new Promise(() => undefined));
    render(<AdminRequestsPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando solicitudes...');
    vi.unstubAllGlobals(); // cleanup from previous test
    getAllModelRequestsMock.mockReset();

    getAllModelRequestsMock.mockRejectedValueOnce(new Error('permission denied'));
    render(<AdminRequestsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las solicitudes.');
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('filtra por estado en solicitudes', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    await user.click(within(filters).getByRole('button', { name: /Estado: Pendientes/i }));

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { statuses: ['pending'] },
    ));
  });

  it('selecciona múltiples estados con multi-select', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    await user.click(within(filters).getByRole('button', { name: /Estado: Pendientes/i }));
    await user.click(within(filters).getByRole('button', { name: /Estado: Revisadas/i }));

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { statuses: ['pending', 'reviewed'] },
    ));
  });

  it('click en Estado: Todas limpia los estados específicos', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    await user.click(within(filters).getByRole('button', { name: /Estado: Pendientes/i }));
    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { statuses: ['pending'] },
    ));

    await user.click(within(filters).getByRole('button', { name: /Estado: Todas/i }));

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      {},
    ));
  });

  it('filtra por origen en solicitudes', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    const sourceGroup = within(filters).getByText('Origen', { selector: '.filter-group__title' }).closest('details');
    const sourceSummary = within(sourceGroup as HTMLElement).getByText('Origen', { selector: '.filter-group__title' });
    await user.click(sourceSummary);
    await user.click(within(filters).getByRole('button', { name: /Origen: Admin/i }));

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { sources: ['admin'] },
    ));
  });

  it('selecciona múltiples orígenes con multi-select', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    const sourceGroup = within(filters).getByText('Origen', { selector: '.filter-group__title' }).closest('details');
    const sourceSummary = within(sourceGroup as HTMLElement).getByText('Origen', { selector: '.filter-group__title' });
    await user.click(sourceSummary);
    await user.click(within(filters).getByRole('button', { name: /Origen: Usuario/i }));
    await user.click(within(filters).getByRole('button', { name: /Origen: Import/i }));

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { sources: ['user', 'import'] },
    ));
  });

  it('click en Origen: Todas limpia los orígenes específicos', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    const sourceGroup = within(filters).getByText('Origen', { selector: '.filter-group__title' }).closest('details');
    const sourceSummary = within(sourceGroup as HTMLElement).getByText('Origen', { selector: '.filter-group__title' });
    await user.click(sourceSummary);
    await user.click(within(filters).getByRole('button', { name: /Origen: Admin/i }));
    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { sources: ['admin'] },
    ));

    await user.click(within(filters).getByRole('button', { name: /Origen: Todas/i }));

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      {},
    ));
  });

  it('busca por texto en solicitudes', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');
    const searchInput = screen.getByPlaceholderText('Buscar por marca o modelo');
    await user.type(searchInput, 'Honda');

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { search: 'Honda' },
    ));
  });

  it('filtra por rango de fechas en solicitudes', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    const dateGroup = within(filters).getByText('Fecha de creación', { selector: '.filter-group__title' }).closest('details');
    const dateSummary = within(dateGroup as HTMLElement).getByText('Fecha de creación', { selector: '.filter-group__title' });
    await user.click(dateSummary);

    const fromInput = within(filters).getByLabelText('Desde');
    const toInput = within(filters).getByLabelText('Hasta');
    await user.type(fromInput, '2026-05-01');
    await user.type(toInput, '2026-05-31');

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { createdFrom: '2026-05-01', createdTo: '2026-05-31' },
    ));
  });

  it('renderiza summary con total y pendientes', async () => {
    getAllModelRequestsMock.mockReset().mockResolvedValue([
      requestFixtures[0],
      { ...requestFixtures[1], status: 'reviewed' },
    ]);
    render(<AdminRequestsPage />);

    await screen.findByText('Honda Transalp 750 2025');

    expect(await screen.findByText(/2 solicitudes cargadas · 1 pendiente/)).toBeInTheDocument();
  });

  it('página la lista cuando hay más de 10 solicitudes', async () => {
    const manyRequests: ModelRequest[] = Array.from({ length: 12 }, (_, index) => buildRequest(index + 1, {
      brand: `Brand_${index + 1}`,
      model: `Model_${index + 1}`,
    }));
    getAllModelRequestsMock.mockReset().mockResolvedValue(manyRequests);
    render(<AdminRequestsPage />);

    const cards = await screen.findAllByTestId('admin-request-card');
    expect(cards).toHaveLength(10);

    const pagination = screen.getByRole('navigation', { name: /Paginación de solicitudes admin/i });
    expect(pagination).toBeInTheDocument();
    const nextButton = within(pagination).getByRole('button', { name: /Página siguiente/i });
    await userEvent.setup().click(nextButton);

    await waitFor(() => expect(screen.getAllByTestId('admin-request-card')).toHaveLength(2));
  });

  it('aplicar filtros resetea la paginación a página 1', async () => {
    const manyRequests: ModelRequest[] = Array.from({ length: 12 }, (_, index) => buildRequest(index + 1, {
      brand: `Brand_${index + 1}`,
      model: `Model_${index + 1}`,
    }));
    getAllModelRequestsMock.mockReset().mockResolvedValue(manyRequests);
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const initialCards = await screen.findAllByTestId('admin-request-card');
    expect(initialCards).toHaveLength(10);

    const pagination = screen.getByRole('navigation', { name: /Paginación de solicitudes admin/i });
    await user.click(within(pagination).getByRole('button', { name: /Página siguiente/i }));
    await waitFor(() => expect(screen.getAllByTestId('admin-request-card')).toHaveLength(2));

    const filters = screen.getByRole('region', { name: /Filtros/i });
    await user.click(within(filters).getByRole('button', { name: /Estado: Pendientes/i }));

    await waitFor(() => expect(screen.getAllByTestId('admin-request-card')).toHaveLength(10));
  });

  it('resetea la paginación al reemplazar un estado seleccionado por otro', async () => {
    const manyRequests: ModelRequest[] = Array.from({ length: 12 }, (_, index) => buildRequest(index + 1, {
      brand: `Brand_${index + 1}`,
      model: `Model_${index + 1}`,
    }));
    getAllModelRequestsMock.mockReset().mockResolvedValue(manyRequests);
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findAllByTestId('admin-request-card');
    const filters = screen.getByRole('region', { name: /Filtros/i });
    await user.click(within(filters).getByRole('button', { name: /Estado: Pendientes/i }));
    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { statuses: ['pending'] },
    ));

    const pagination = screen.getByRole('navigation', { name: /Paginación de solicitudes admin/i });
    await user.click(within(pagination).getByRole('button', { name: /Página siguiente/i }));
    await waitFor(() => expect(screen.getAllByTestId('admin-request-card')).toHaveLength(2));

    await user.click(within(filters).getByRole('button', { name: /Estado: Revisadas/i }));
    await user.click(within(filters).getByRole('button', { name: /Estado: Pendientes/i }));

    await waitFor(() => expect(getAllModelRequestsMock).toHaveBeenLastCalledWith(
      { accessToken: 'admin-token', userId: 'admin-1' },
      { statuses: ['reviewed'] },
    ));
    expect(screen.getAllByTestId('admin-request-card')).toHaveLength(10);
  });

  it('cambiar de página colapsa las solicitudes expandidas', async () => {
    const manyRequests: ModelRequest[] = Array.from({ length: 12 }, (_, index) => buildRequest(index + 1, {
      brand: `Brand_${index + 1}`,
      model: `Model_${index + 1}`,
      comment: `Comentario_${index + 1}`,
    }));
    getAllModelRequestsMock.mockReset().mockResolvedValue(manyRequests);
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const firstCard = (await screen.findAllByTestId('admin-request-card'))[0];
    const toggle = within(firstCard).getByRole('button', { name: /Expandir solicitud/i });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(firstCard).getByText('Comentario_1')).toBeVisible();

    const pagination = screen.getByRole('navigation', { name: /Paginación de solicitudes admin/i });
    await user.click(within(pagination).getByRole('button', { name: /Página siguiente/i }));

    await waitFor(() => expect(screen.queryByText('Comentario_1')).not.toBeInTheDocument());
    expect(screen.getAllByTestId('admin-request-card')).toHaveLength(2);
  });

  it('navegación admin contiene Solicitudes en el sidebar', () => {
    render(<AdminDashboardPage />);

    const nav = screen.getByRole('navigation', { name: /Navegación de administración/i });
    const solicitudesLink = within(nav).getByRole('link', { name: 'Solicitudes' });
    expect(solicitudesLink).toHaveAttribute('href', '#/admin/solicitudes');
  });

  it('navegación admin contiene Mi cuenta al final', () => {
    render(<AdminDashboardPage />);

    const nav = screen.getByRole('navigation', { name: /Navegación de administración/i });
    const miCuentaLink = within(nav).getByRole('link', { name: 'Mi cuenta' });
    expect(miCuentaLink).toHaveAttribute('href', '#/cuenta');
    expect(miCuentaLink).not.toHaveAttribute('aria-current');
  });

  it('sidebar de solicitudes muestra enlace activo', () => {
    render(<AdminRequestsPage />);

    const nav = screen.getByRole('navigation', { name: /Navegación de administración/i });
    const activeLink = within(nav).getByRole('link', { name: 'Solicitudes' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('renderiza Marca, Modelo, Año y Segmento en los detalles expandidos', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));

    const brandValues = within(card).getAllByText('Honda');
    expect(brandValues.length).toBeGreaterThanOrEqual(1);
    const modelValues = within(card).getAllByText('Transalp 750');
    expect(modelValues.length).toBeGreaterThanOrEqual(1);
    const yearValues = within(card).getAllByText('2025');
    expect(yearValues.length).toBeGreaterThanOrEqual(1);
    const segmentLabels = within(card).getAllByText('trail');
    expect(segmentLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza email de contacto si existe', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));

    expect(within(card).getByText('user@example.com')).toBeInTheDocument();
  });

  it('renderiza URL oficial si existe', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[1];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));

    const urlLink = within(card).getByRole('link', { name: /https:\/\/www\.ktm\.com/i });
    expect(urlLink).toHaveAttribute('href', 'https://www.ktm.com');
    expect(urlLink).toHaveAttribute('target', '_blank');
    expect(urlLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renderiza comentario si existe', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));

    expect(within(card).getByText(/Sería genial tener esta moto/)).toBeInTheDocument();
  });

  it('no muestra texto literal null en los detalles', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));

    expect(within(card).queryByText(/^null$/i)).not.toBeInTheDocument();
  });

  it('muestra el nombre de usuario en los detalles si existe', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));

    expect(within(card).getByText('Carlos Ruiz')).toBeInTheDocument();
  });

  it('muestra "Usuario MotoAtlas" si el usuario está autenticado pero sin displayName', async () => {
    getAllModelRequestsMock.mockResolvedValueOnce([
      { ...requestFixtures[1] },
    ]);
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));

    expect(within(card).getByText('Usuario MotoAtlas')).toBeInTheDocument();
  });

  it('acciones siguen funcionando tras el cambio visual', async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Marcar revisada' }));

    expect(updateModelRequestStatusMock).toHaveBeenCalledWith('req-1', 'reviewed', { accessToken: 'admin-token', userId: 'admin-1' });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Solicitud marcada como revisada.'));
  });

  it('error en acción de solicitud muestra alerta', async () => {
    updateModelRequestStatusMock.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const card = (await screen.findAllByTestId('admin-request-card'))[0];
    await user.click(within(card).getByRole('button', { name: /Expandir/i }));
    await user.click(within(card).getByRole('button', { name: 'Marcar revisada' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo completar la acción sobre la solicitud.'));
  });
});
