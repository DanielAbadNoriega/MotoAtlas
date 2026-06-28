import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminMotorcycle, updateAdminMotorcycle } from '../../../services/adminMotorcycleService';
import { createAdminMotorcycleGalleryImage, deleteAdminMotorcycleGalleryImageRecord, getAdminMotorcycleGalleryImages, updateAdminMotorcycleGalleryImage } from '../../../services/adminMotorcycleGalleryService';
import { deleteMotorcycleImage, uploadMotorcycleImage } from '../../../services/adminMotorcycleImageUploadService';
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
import type { Bike } from '../../../types/bike';
import { bikeCatalog } from '../../../data/bikes';
import { AdminDashboardPage, AdminEditModelsPage, AdminEditMotorcyclePage, AdminModelsPage, AdminModerationPage, AdminNewModelPage, AdminRequestsPage, AdminReviewsPage } from './AdminPage';

import {
  getAllModelRequests,
  updateModelRequestStatus,
  type ModelRequest,
  type ModelRequestStatus,
} from '../../../services/modelRequestService';
import { adminProfileFixture, adminUserFixture, createAuthState, createAuthUser, createSession, createUserProfile, mockAdminAuthState } from '../../../test/fixtures/auth';

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

vi.mock('../../../services/adminMotorcycleService', () => ({
  createAdminMotorcycle: vi.fn(),
  updateAdminMotorcycle: vi.fn(),
}));

vi.mock('../../../services/adminMotorcycleGalleryService', () => ({
  createAdminMotorcycleGalleryImage: vi.fn(),
  deleteAdminMotorcycleGalleryImageRecord: vi.fn(),
  getAdminMotorcycleGalleryImages: vi.fn(),
  updateAdminMotorcycleGalleryImage: vi.fn(),
}));

vi.mock('../../../services/adminMotorcycleImageUploadService', () => ({
  MOTORCYCLE_IMAGE_BUCKET: 'motorcycle-images',
  deleteMotorcycleImage: vi.fn(),
  uploadMotorcycleImage: vi.fn(),
}));

const createAdminMotorcycleGalleryImageMock = vi.mocked(createAdminMotorcycleGalleryImage);
const deleteAdminMotorcycleGalleryImageRecordMock = vi.mocked(deleteAdminMotorcycleGalleryImageRecord);
const getAdminMotorcycleGalleryImagesMock = vi.mocked(getAdminMotorcycleGalleryImages);
const updateAdminMotorcycleGalleryImageMock = vi.mocked(updateAdminMotorcycleGalleryImage);
const uploadMotorcycleImageMock = vi.mocked(uploadMotorcycleImage);
const deleteMotorcycleImageMock = vi.mocked(deleteMotorcycleImage);

const useAuthMock = vi.mocked(useAuth);
const getReviewReportsMock = vi.mocked(getReviewReports);
const getAllReviewsMock = vi.mocked(getAllReviews);
const getReviewAspectsByReviewIdsMock = vi.mocked(getReviewAspectsByReviewIds);
const updateAdminMotorcycleMock = vi.mocked(updateAdminMotorcycle);
const createAdminMotorcycleMock = vi.mocked(createAdminMotorcycle);
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

async function openImageManager(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Gestionar imágenes' }));
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
    createAdminMotorcycleGalleryImageMock.mockReset().mockImplementation(async (input) => ({
      id: 'gallery-image-created',
      motorcycleId: input.motorcycleId,
      url: input.url,
      storagePath: input.storagePath ?? null,
      altText: input.altText ?? null,
      isPrimary: input.isPrimary ?? false,
      sortOrder: input.sortOrder ?? 0,
      source: input.source ?? 'manual',
      createdBy: input.createdBy ?? null,
      createdAt: '2026-06-17T10:00:00.000Z',
      updatedAt: '2026-06-17T10:00:00.000Z',
    }));
    deleteAdminMotorcycleGalleryImageRecordMock.mockReset().mockResolvedValue(undefined);
    updateAdminMotorcycleGalleryImageMock.mockReset().mockImplementation(async (_imageId, updates) => ({
      id: _imageId,
      motorcycleId: 'test-motorcycle-id',
      url: updates.url ?? '',
      storagePath: updates.storagePath ?? null,
      altText: updates.altText ?? null,
      isPrimary: updates.isPrimary ?? false,
      sortOrder: updates.sortOrder ?? 0,
      source: updates.source ?? 'manual',
      createdBy: null,
      createdAt: '2026-06-17T10:00:00.000Z',
      updatedAt: '2026-06-17T10:00:00.000Z',
    }));
    uploadMotorcycleImageMock.mockReset();
    deleteMotorcycleImageMock.mockReset().mockResolvedValue(undefined);
    getAdminMotorcycleGalleryImagesMock.mockReset().mockResolvedValue([]);
    updateAdminMotorcycleMock.mockReset().mockResolvedValue({
      id: 'bmw-f-900-gs-2024', brand: 'BMW', model: 'F 900 GS', year: 2024,
      segment: 'trail' as const, license: 'A' as const, engineType: 'parallel-twin' as const,
      displacementCc: 895, powerHp: 105, torqueNm: 92, wetWeightKg: 219, seatHeightMm: 815,
      fuelTankLiters: 15, priceEur: 12490, imageUrl: '/bmw.jpg', imageLocked: false,
      description: 'Test', descriptionLocked: false,
      specsSource: 'manual' as const, priceSource: 'manual' as const, imageSource: 'manual' as const,
      scoresSource: 'estimated' as const, prosConsSource: 'estimated' as const, reliabilitySource: 'estimated' as const,
      isA2Compatible: false, isA2LimitedVersion: false, limitedPowerHp: null, originalPowerHp: null,
      officialUrl: null,
      useScores: { beginner: 0, city: 0, funFactor: 0, offroad: 0, passenger: 0, sport: 0, touring: 0 },
      features: { absCornering: false, cruiseControl: false, heatedGrips: false, quickshifter: false, ridingModes: false, tractionControl: false, tubelessWheels: false },
      pros: [], cons: [],
      reliabilityReports: { commonIssues: [], reportCount: 0, reliabilityScore: 0 },
    });
    createAdminMotorcycleMock.mockReset().mockResolvedValue({
      id: 'new-model', brand: 'Test', model: 'Model', year: 2025,
      segment: 'naked' as const, license: 'A' as const, engineType: 'parallel-twin' as const,
      displacementCc: 500, powerHp: 50, torqueNm: 45, wetWeightKg: 180, seatHeightMm: 800,
      fuelTankLiters: 15, priceEur: 8000, imageUrl: '/test.jpg', imageLocked: false,
      description: 'Test', descriptionLocked: false,
      specsSource: 'manual' as const, priceSource: 'manual' as const, imageSource: 'manual' as const,
      scoresSource: 'estimated' as const, prosConsSource: 'estimated' as const, reliabilitySource: 'estimated' as const,
      isA2Compatible: false, isA2LimitedVersion: false, limitedPowerHp: null, originalPowerHp: null,
      officialUrl: null,
      useScores: { beginner: 0, city: 0, funFactor: 0, offroad: 0, passenger: 0, sport: 0, touring: 0 },
      features: { absCornering: false, cruiseControl: false, heatedGrips: false, quickshifter: false, ridingModes: false, tractionControl: false, tubelessWheels: false },
      pros: [], cons: [],
      reliabilityReports: { commonIssues: [], reportCount: 0, reliabilityScore: 0 },
    });
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

  it('navegación admin contiene grupos y subgrupo de modelos en el orden esperado', () => {
    render(<AdminDashboardPage />);

    const nav = screen.getByRole('navigation', { name: /Navegación de administración/i });
    expect(screen.getByText('Mi cuenta')).toBeInTheDocument();
    expect(screen.getByText('Panel Admin')).toBeInTheDocument();
    expect(screen.getByText('Modelos')).toBeInTheDocument();
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Resumen',
      'Mis reviews',
      'Mis solicitudes',
      'Panel admin',
      'Moderación',
      'Reviews',
      'Solicitudes',
      'Vista general',
      'Nuevo modelo',
      'Editar modelo',
    ]);
    expect(within(nav).getByRole('link', { name: 'Resumen' })).toHaveAttribute('href', '#/cuenta');
    expect(within(nav).getByRole('link', { name: 'Vista general' })).toHaveAttribute('href', '#/admin/modelos');
    expect(within(nav).getByRole('link', { name: 'Nuevo modelo' })).toHaveAttribute('href', '#/admin/modelos/nuevo');
    expect(within(nav).getByRole('link', { name: 'Editar modelo' })).toHaveAttribute('href', '#/admin/modelos/editar');
  });

  it('sidebar de solicitudes muestra enlace activo', () => {
    render(<AdminRequestsPage />);

    const nav = screen.getByRole('navigation', { name: /Navegación de administración/i });
    const activeLink = within(nav).getByRole('link', { name: 'Solicitudes' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('renderiza el hub mínimo de Estudio de modelos para admin', () => {
    render(<AdminModelsPage />);

    expect(screen.getByRole('heading', { name: 'Estudio de modelos' })).toBeInTheDocument();
    expect(screen.getByText('Gestiona las fichas técnicas del catálogo MotoAtlas.')).toBeInTheDocument();
    expect(screen.getByText('Workspace futuro')).toBeInTheDocument();
    expect(screen.getByText('Editar modelo existente')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vista general' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Seleccionar modelo' })).toHaveAttribute('href', '#/admin/modelos/editar');
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Marca/i)).not.toBeInTheDocument();
  });

  it('renderiza el scaffold UI-only de Nuevo modelo para admin', () => {
    render(<AdminNewModelPage />);

    expect(screen.getByRole('heading', { name: 'Nuevo modelo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Workspace de creación' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Formulario de nuevo modelo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '01. MODELO' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '03. MOTOR & RENDIMIENTO' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '04. ELECTRONICA & EQUIPAMIENTO' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '05. PRECIO' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descartar cambios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vista previa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar modelo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nuevo modelo' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Más información sobre 01\. MODELO/i })).toBeInTheDocument();
    expect(screen.getByText('Base de naming y copy inicial para alimentar el preview local antes de decidir persistencia o validación real.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Más información sobre ID sugerido/i })).toBeInTheDocument();
    expect(screen.getByText(/^Sugerencia automática:/)).toBeInTheDocument();
  });

  it('muestra fallbacks en el preview local al iniciar', () => {
    render(<AdminNewModelPage />);

    expect(screen.getByRole('heading', { name: 'Marca Modelo' })).toBeInTheDocument();
    expect(screen.getByText('Segmento pendiente')).toBeInTheDocument();
    expect(screen.getByText('Carnet pendiente')).toBeInTheDocument();
    expect(screen.getByText('Descripción pendiente de completar')).toBeInTheDocument();
    expect(screen.getByText('Precio pendiente')).toBeInTheDocument();
    expect(screen.getByText('Preview local')).toBeInTheDocument();
    expect(screen.queryByText('Borrador sin guardar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vista previa' })).toBeInTheDocument();
  });

  it('actualiza el preview local al cambiar campos del formulario', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.type(screen.getByLabelText('Marca'), 'Ducati');
    await user.type(screen.getByLabelText('Modelo'), 'DesertX');
    await user.type(screen.getByLabelText('Descripción'), 'Trail travel preparada para enlazar asfalto y tierra.');
    await openImageManager(user);
    await user.type(screen.getByLabelText('Image URL'), 'https://cdn.motoatlas.test/desertx.webp');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'adventure');
    await user.selectOptions(screen.getByLabelText('Carnet'), 'A');
    await user.type(screen.getByLabelText('Potencia (hp)'), '110');

    const previewHeading = screen.getByRole('heading', { name: 'Ducati DesertX' });
    const previewSection = previewHeading.closest('section');

    expect(previewHeading).toBeInTheDocument();
    expect(previewSection).not.toBeNull();
    expect(within(previewSection as HTMLElement).getByText('Trail travel preparada para enlazar asfalto y tierra.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Preview local de Ducati DesertX' })).toHaveAttribute('src', 'https://cdn.motoatlas.test/desertx.webp');
    expect(within(previewSection as HTMLElement).getByText('110 CV')).toBeInTheDocument();
  });

  it('renderiza preview de imagen actual cuando draft.imageUrl existe', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await openImageManager(user);
    await user.type(screen.getByLabelText('Image URL'), 'https://cdn.motoatlas.test/current-image.webp');

    expect(screen.getByRole('region', { name: 'Imagen actual del modelo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', 'https://cdn.motoatlas.test/current-image.webp');
  });

  it('mantiene visible la entrada del formulario para imagen y el trigger del gestor', () => {
    render(<AdminNewModelPage />);

    expect(screen.getByRole('region', { name: 'Imagen actual del modelo' })).toBeInTheDocument();
    expect(screen.getByText('Imagen no disponible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gestionar imágenes' })).toBeInTheDocument();
  });

  it('abrir Gestionar imágenes muestra el modal shell sin galería fake', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.click(screen.getByRole('button', { name: 'Gestionar imágenes' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Galería de imágenes' })).toBeInTheDocument();
    expect(screen.getByText('Visualiza la galería de imágenes y gestiona la imagen principal del modelo.')).toBeInTheDocument();
    expect(screen.getByText('Cuando el modelo exista se cargarán aquí sus imágenes persistidas. Mientras tanto, puedes preparar la portada con la biblioteca disponible.')).toBeInTheDocument();
    expect(screen.getByText('La biblioteca permite reutilizar imágenes como portada. La gestión avanzada de galería llegará en una fase posterior.')).toBeInTheDocument();
    expect(screen.queryByText(/Imagen 4/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Imagen 5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/8 imágenes/i)).not.toBeInTheDocument();
  });

  it('el botón de cerrar cierra el modal de imágenes', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.click(screen.getByRole('button', { name: 'Gestionar imágenes' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar gestor de imágenes' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Cancelar cierra el modal de imágenes', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.click(screen.getByRole('button', { name: 'Gestionar imágenes' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Guardar cambios cierra el modal de imágenes sin publicar', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.click(screen.getByRole('button', { name: 'Gestionar imágenes' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
    expect(updateAdminMotorcycleMock).not.toHaveBeenCalled();
  });

  it('mantiene Guardar borrador y Vista previa como acciones locales sin llamar servicios', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    expect(screen.getByRole('status')).toHaveTextContent('Borrador local actualizado.');

    await user.type(screen.getByLabelText('Marca'), 'Honda');
    expect(screen.getByLabelText('Marca')).toHaveValue('Honda');

    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }));
    expect(screen.getByRole('status')).toHaveTextContent('Cambios descartados.');
    expect(screen.getByLabelText('Marca')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Vista previa' }));
    expect(screen.getByRole('status')).toHaveTextContent('Vista previa actualizada.');
  });

  it('imagen local/catalog no muestra acción destructiva de Storage', async () => {
    const user = userEvent.setup();
    render(<AdminEditMotorcyclePage motorcycleId="bmw-f-900-gs-2024" motorcycles={bikeCatalog} onMotorcyclesChange={vi.fn()} />);

    expect(screen.getByRole('region', { name: 'Imagen actual del modelo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar imagen actual' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));
    expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
  });

  it('publicar modelo en create llama a createAdminMotorcycle y muestra éxito', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.type(screen.getByLabelText('Marca'), 'Ducati');
    await user.type(screen.getByLabelText('Modelo'), 'DesertX');
    await user.type(screen.getByLabelText('Año'), '2025');
    await user.type(screen.getByLabelText('Descripción'), 'Trail travel.');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'adventure');
    await user.selectOptions(screen.getByLabelText('Carnet'), 'A');
    await user.selectOptions(screen.getByLabelText('Tipo de motor'), 'parallel-twin');
    await user.type(screen.getByLabelText('Cilindrada (cc)'), '937');
    await user.type(screen.getByLabelText('Potencia (hp)'), '110');
    await user.type(screen.getByLabelText('Torque (nm)'), '92');
    await user.type(screen.getByLabelText('Peso (kg)'), '210');
    await user.type(screen.getByLabelText('Altura asiento (mm)'), '875');
    await user.type(screen.getByLabelText('Depósito (l)'), '16');
    await openImageManager(user);
    await user.type(screen.getByLabelText('Image URL'), '/images/ducati-desertx.webp');

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(createAdminMotorcycleMock).toHaveBeenCalledWith(
        expect.objectContaining({ brand: 'Ducati', model: 'DesertX', powerHp: 110 }),
        'admin-token',
      );
    });
    expect(screen.getByRole('status')).toHaveTextContent('Modelo publicado correctamente.');
  });

  it('publicar modelo en create muestra error si falla createAdminMotorcycle', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage onMotorcyclesChange={vi.fn()} />);

    createAdminMotorcycleMock.mockRejectedValueOnce(new Error('connection failed'));

    await user.type(screen.getByLabelText('Marca'), 'Test');
    await user.type(screen.getByLabelText('Modelo'), 'Moto');
    await user.type(screen.getByLabelText('Año'), '2025');
    await user.type(screen.getByLabelText('Descripción'), 'Test model.');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'naked');
    await user.selectOptions(screen.getByLabelText('Carnet'), 'A');
    await user.selectOptions(screen.getByLabelText('Tipo de motor'), 'parallel-twin');
    await user.type(screen.getByLabelText('Cilindrada (cc)'), '500');
    await user.type(screen.getByLabelText('Potencia (hp)'), '50');
    await user.type(screen.getByLabelText('Torque (nm)'), '45');
    await user.type(screen.getByLabelText('Peso (kg)'), '180');
    await user.type(screen.getByLabelText('Altura asiento (mm)'), '800');
    await user.type(screen.getByLabelText('Depósito (l)'), '15');
    await openImageManager(user);
    await user.type(screen.getByLabelText('Image URL'), '/images/test.webp');

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('connection failed');
    });
    expect(window.location.hash).toBe('');
  });

  it('publicar modelo en create no ejecuta servicio sin sesión activa', () => {
    mockAuth({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
    });
    render(<AdminNewModelPage />);

    expect(screen.queryByRole('button', { name: 'Publicar modelo' })).not.toBeInTheDocument();
    expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
  });

  it('create publish con modeloId vacío muestra error de validación', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('El ID del modelo es obligatorio.');
    });
    expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
  });

  it('create publish con modeloId con espacios muestra error de validación', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.type(screen.getByLabelText('Marca'), 'Ducati');
    await user.type(screen.getByLabelText('Modelo'), 'DesertX');
    await user.type(screen.getByLabelText('Año'), '2025');
    await user.type(screen.getByLabelText('Descripción'), 'Test.');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'adventure');
    await user.selectOptions(screen.getByLabelText('Carnet'), 'A');
    await user.selectOptions(screen.getByLabelText('Tipo de motor'), 'parallel-twin');
    await user.type(screen.getByLabelText('Cilindrada (cc)'), '937');
    await user.type(screen.getByLabelText('Potencia (hp)'), '110');
    await user.type(screen.getByLabelText('Torque (nm)'), '92');
    await user.type(screen.getByLabelText('Peso (kg)'), '210');
    await user.type(screen.getByLabelText('Altura asiento (mm)'), '875');
    await user.type(screen.getByLabelText('Depósito (l)'), '16');
    await openImageManager(user);
    await user.type(screen.getByLabelText('Image URL'), '/images/test.webp');
    await user.type(screen.getByLabelText('ID sugerido'), 'invalid id with spaces');

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('El ID del modelo no puede contener espacios.');
    });
    expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
  });

  it('create publish sin marca muestra error de validación', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.type(screen.getByLabelText('ID sugerido'), 'test-model');
    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('La marca es obligatoria.');
    });
    expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
  });

  it('create publish con año inválido muestra error de validación', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.type(screen.getByLabelText('ID sugerido'), 'test-model');
    await user.type(screen.getByLabelText('Marca'), 'Ducati');
    await user.type(screen.getByLabelText('Modelo'), 'DesertX');
    await user.type(screen.getByLabelText('Descripción'), 'Test.');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'adventure');
    await user.selectOptions(screen.getByLabelText('Carnet'), 'A');
    await user.selectOptions(screen.getByLabelText('Tipo de motor'), 'parallel-twin');
    await user.type(screen.getByLabelText('Cilindrada (cc)'), '937');
    await user.type(screen.getByLabelText('Potencia (hp)'), '110');
    await user.type(screen.getByLabelText('Torque (nm)'), '92');
    await user.type(screen.getByLabelText('Peso (kg)'), '210');
    await user.type(screen.getByLabelText('Altura asiento (mm)'), '875');
    await user.type(screen.getByLabelText('Depósito (l)'), '16');
    await openImageManager(user);
    await user.type(screen.getByLabelText('Image URL'), '/images/test.webp');

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('El año debe ser un número entre 1900 y 2100.');
    });
    expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
  });

  it('create publish acepta imageUrl local comenzando con /', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    await user.type(screen.getByLabelText('ID sugerido'), 'valid-model');
    await user.type(screen.getByLabelText('Marca'), 'Yamaha');
    await user.type(screen.getByLabelText('Modelo'), 'MT-07');
    await user.type(screen.getByLabelText('Año'), '2025');
    await user.type(screen.getByLabelText('Descripción'), 'Test.');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'naked');
    await user.selectOptions(screen.getByLabelText('Carnet'), 'A');
    await user.selectOptions(screen.getByLabelText('Tipo de motor'), 'parallel-twin');
    await user.type(screen.getByLabelText('Cilindrada (cc)'), '689');
    await user.type(screen.getByLabelText('Potencia (hp)'), '73');
    await user.type(screen.getByLabelText('Torque (nm)'), '68');
    await user.type(screen.getByLabelText('Peso (kg)'), '184');
    await user.type(screen.getByLabelText('Altura asiento (mm)'), '805');
    await user.type(screen.getByLabelText('Depósito (l)'), '14');
    await openImageManager(user);
    await user.type(screen.getByLabelText('Image URL'), '/images/motorcycles/mt-07.webp');

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(createAdminMotorcycleMock).toHaveBeenCalled();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Modelo publicado correctamente.');
  });

  it('create publish success navega a la ficha del modelo creado', async () => {
    const createdId = 'yamaha-mt-07-2025';
    createAdminMotorcycleMock.mockResolvedValueOnce({ id: createdId, brand: 'Yamaha', model: 'MT-07', year: 2025, segment: 'naked' as const, license: 'A' as const, engineType: 'parallel-twin' as const, displacementCc: 689, powerHp: 73, torqueNm: 68, wetWeightKg: 184, seatHeightMm: 805, fuelTankLiters: 14, priceEur: 7490, imageUrl: '/images/mt-07.webp', imageLocked: false, description: 'Naked motorcycle.', descriptionLocked: false, specsSource: 'manual' as const, priceSource: 'manual' as const, imageSource: 'manual' as const, scoresSource: 'estimated' as const, prosConsSource: 'estimated' as const, reliabilitySource: 'estimated' as const, isA2Compatible: false, isA2LimitedVersion: false, limitedPowerHp: null, originalPowerHp: null, officialUrl: null, useScores: { beginner: 0, city: 0, funFactor: 0, offroad: 0, passenger: 0, sport: 0, touring: 0 }, features: { absCornering: false, cruiseControl: false, heatedGrips: false, quickshifter: false, ridingModes: false, tractionControl: false, tubelessWheels: false }, pros: [], cons: [], reliabilityReports: { commonIssues: [], reportCount: 0, reliabilityScore: 0 } } as unknown as Bike);
    const user = userEvent.setup();
    render(<AdminNewModelPage onMotorcyclesChange={vi.fn()} />);

    await user.type(screen.getByLabelText('ID sugerido'), createdId);
    await user.type(screen.getByLabelText('Marca'), 'Yamaha');
    await user.type(screen.getByLabelText('Modelo'), 'MT-07');
    await user.type(screen.getByLabelText('Año'), '2025');
    await user.type(screen.getByLabelText('Descripción'), 'Naked motorcycle.');
    await user.selectOptions(screen.getByLabelText('Segmento'), 'naked');
    await user.selectOptions(screen.getByLabelText('Carnet'), 'A');
    await user.selectOptions(screen.getByLabelText('Tipo de motor'), 'parallel-twin');
    await user.type(screen.getByLabelText('Cilindrada (cc)'), '689');
    await user.type(screen.getByLabelText('Potencia (hp)'), '73');
    await user.type(screen.getByLabelText('Torque (nm)'), '68');
    await user.type(screen.getByLabelText('Peso (kg)'), '184');
    await user.type(screen.getByLabelText('Altura asiento (mm)'), '805');
    await user.type(screen.getByLabelText('Depósito (l)'), '14');
    await openImageManager(user);
    await user.type(screen.getByLabelText('Image URL'), '/images/mt-07.webp');

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(createAdminMotorcycleMock).toHaveBeenCalled();
    });
    expect(window.location.hash).toBe(`#/motos/${createdId}`);
  });

  it('create publish validation failure no navega', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage onMotorcyclesChange={vi.fn()} />);

    await user.type(screen.getByLabelText('ID sugerido'), 'test-model');
    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('La marca es obligatoria.');
    });
    expect(window.location.hash).toBe('');
    expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
  });

  it('edit publish con potencia inválida muestra error de validación', async () => {
    const user = userEvent.setup();
    render(<AdminEditMotorcyclePage motorcycleId="bmw-f-900-gs-2024" motorcycles={bikeCatalog} onMotorcyclesChange={vi.fn()} />);

    await user.clear(screen.getByLabelText('Potencia (hp)'));
    await user.type(screen.getByLabelText('Potencia (hp)'), '0');

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('La potencia debe ser un número mayor a 0.');
    });
    expect(updateAdminMotorcycleMock).not.toHaveBeenCalled();
  });

  it('edit publish no requiere validación de modeloId', async () => {
    const user = userEvent.setup();
    render(<AdminEditMotorcyclePage motorcycleId="bmw-f-900-gs-2024" motorcycles={bikeCatalog} onMotorcyclesChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

    await waitFor(() => {
      expect(updateAdminMotorcycleMock).toHaveBeenCalled();
    });
  });

  it('renderiza la página de selección de modelos para editar', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    expect(screen.getByRole('heading', { name: 'Seleccionar modelo para editar' })).toBeInTheDocument();
    expect(screen.getByText('Busca una moto del catálogo y abre su ficha interna de edición.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar modelo' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByPlaceholderText(/Buscar por marca o modelo/i)).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /Buscar por marca o modelo/i })).toBeInTheDocument();
  });

  it('muestra al menos un resultado de catálogo en la página de edición', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const cards = screen.getAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);
    const editLinks = screen.getAllByRole('link', { name: /^Editar modelo /i });
    expect(editLinks.length).toBeGreaterThan(0);
  });

  it('usa la misma jerarquía de encabezado que AccountReviewMotorcycleSummaryCard (h2)', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const cards = screen.getAllByTestId('admin-model-edit-summary-card');
    expect(cards.length).toBeGreaterThan(0);

    cards.forEach((card) => {
      expect(within(card).getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  it('incluye la capa overlay en cada card como la referencia', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const overlays = document.querySelectorAll('.admin-page__model-edit-summary-overlay');
    expect(overlays.length).toBeGreaterThan(0);
  });

  it('no renderiza texto de segmento en la card de edición', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const segmentLabels = ['Naked', 'Sport', 'Trail', 'Adventure', 'Scooter', 'Touring', 'Custom', 'Cruiser', 'Retro'];
    const cards = screen.getAllByTestId('admin-model-edit-summary-card');

    cards.forEach((card) => {
      segmentLabels.forEach((label) => {
        expect(within(card).queryByText(label)).not.toBeInTheDocument();
      });
    });
  });

  it('cada card Editar modelo enlaza a la ruta de edición interna', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const editLinks = screen.getAllByRole('link', { name: /^Editar modelo /i });
    editLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^#\/admin\/modelos\/.+\/editar$/));
    });
  });

  it('cada card usa directamente la imageUrl de la moto sin sobrescribirla con getMotorcycleLocalImageUrl', () => {
    const customBikes = [
      { ...bikeCatalog[0], imageUrl: '/images/motorcycles/resolved-custom-image.webp' },
      ...bikeCatalog.slice(1),
    ];
    render(<AdminEditModelsPage motorcycles={customBikes} />);

    const cards = screen.getAllByTestId('admin-model-edit-summary-card');
    expect(cards.length).toBeGreaterThan(0);

    const firstCardImg = cards[0].querySelector('img');
    expect(firstCardImg).not.toBeNull();
    const src = firstCardImg!.getAttribute('src') ?? '';
    expect(src).toBe('/images/motorcycles/resolved-custom-image.webp');
  });

  it('filtra resultados al escribir en la búsqueda', async () => {
    const user = userEvent.setup();
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const initialLinks = screen.getAllByRole('link', { name: /^Editar modelo /i });
    expect(initialLinks.length).toBeGreaterThan(1);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'ZZZZ_NO_EXISTE');

    expect(screen.queryByRole('link', { name: /^Editar modelo /i })).not.toBeInTheDocument();
    expect(screen.getByText('No hay modelos que coincidan con los filtros.')).toBeInTheDocument();
  });

  it('muestra resumen de resultados con el total de modelos encontrados', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    expect(screen.getByText(/\d+ modelos encontrados/)).toBeInTheDocument();
  });

  it('muestra botón Limpiar filtros en el panel cuando hay filtros activos y restaura resultados', async () => {
    const user = userEvent.setup();
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'BMW');
    const clearButtons = screen.getAllByRole('button', { name: 'Limpiar filtros' });
    expect(clearButtons.length).toBeGreaterThan(0);

    await user.click(clearButtons[0]);
    expect(searchInput).toHaveValue('');
    expect(screen.getByText(/\d+ modelos encontrados/)).toBeInTheDocument();
  });

  it('renderiza los filtros en el panel del sidebar, no como bloque full-width', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const filterSection = screen.getByRole('region', { name: 'Filtros de modelos' });
    expect(filterSection).toBeInTheDocument();
    expect(filterSection).toHaveClass('admin-page__filters');
    expect(within(filterSection).getByRole('heading', { name: 'Filtros' })).toBeInTheDocument();
    expect(within(filterSection).getByRole('button', { name: 'Aplicar filtros' })).toBeInTheDocument();
    expect(within(filterSection).getAllByRole('button', { name: 'Limpiar filtros' }).length).toBeGreaterThan(0);

    const searchInput = within(filterSection).getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    expect(within(filterSection).getByPlaceholderText(/Buscar por marca o modelo/i)).toBeInTheDocument();

    const segmentGroup = within(filterSection).getByText('Segmento', { selector: '.filter-group__title' }).closest('details');
    expect(segmentGroup).not.toBeNull();

    const licenseGroup = within(filterSection).getByText('Carnet', { selector: '.filter-group__title' }).closest('details');
    expect(licenseGroup).not.toBeNull();

    expect(filterSection.querySelector('.admin-page__filters-header')).toBeInTheDocument();
    expect(filterSection.querySelector('.admin-page__filters-body')).toBeInTheDocument();
    expect(filterSection.querySelector('.admin-page__filters-footer')).toBeInTheDocument();
  });

  it('renderiza el trigger de filtros móvil en el contenido principal', () => {
    render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

    const mobileTrigger = screen.getByRole('button', { name: 'Filtros' });
    expect(mobileTrigger).toBeInTheDocument();
    expect(mobileTrigger.querySelector('.material-symbols-outlined')).toHaveTextContent('tune');
  });

  describe('filtros extendidos de #/admin/modelos/editar', () => {
    function getFilterPanel() {
      return screen.getByRole('region', { name: 'Filtros de modelos' });
    }

    function getResultsHeading() {
      return screen.getByText(/\d+ modelos encontrados/);
    }

    function countResults() {
      return screen.getAllByRole('link', { name: /^Editar modelo /i }).length;
    }

    it('renderiza todos los grupos de filtro (Marca, Segmento, Carnet, Precio, Potencia, Peso, Altura asiento, Electrónica, Uso recomendado, Calidad de datos)', () => {
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const filterPanel = getFilterPanel();
      const titles = ['Marca', 'Segmento', 'Carnet', 'Precio', 'Potencia', 'Peso', 'Altura asiento', 'Electrónica', 'Uso recomendado', 'Calidad de datos'];
      titles.forEach((title) => {
        expect(within(filterPanel).getByText(title, { selector: '.filter-group__title' })).toBeInTheDocument();
      });
    });

    it('filtrar por marca reduce los resultados', async () => {
      const user = userEvent.setup();
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const initialCount = countResults();
      const filterPanel = getFilterPanel();

      const yamahaBtn = within(filterPanel).getByRole('button', { name: 'Marca: Yamaha' });
      await user.click(yamahaBtn);

      const newCount = countResults();
      expect(newCount).toBeGreaterThan(0);
      expect(newCount).toBeLessThan(initialCount);
    });

    it('filtrar por segmento reduce los resultados', async () => {
      const user = userEvent.setup();
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const initialCount = countResults();
      const filterPanel = getFilterPanel();

      const nakedBtn = within(filterPanel).getByRole('button', { name: 'Segmento: Naked' });
      await user.click(nakedBtn);

      const newCount = countResults();
      expect(newCount).toBeGreaterThan(0);
      expect(newCount).toBeLessThan(initialCount);
    });

    it('filtrar por carnet reduce los resultados', async () => {
      const user = userEvent.setup();
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const initialCount = countResults();
      const filterPanel = getFilterPanel();

      const a2Btn = within(filterPanel).getByRole('button', { name: 'Carnet: Carnet A2' });
      await user.click(a2Btn);

      const newCount = countResults();
      expect(newCount).toBeGreaterThan(0);
      expect(newCount).toBeLessThan(initialCount);
    });

    it('filtrar por potencia reduce los resultados', async () => {
      const user = userEvent.setup();
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const initialCount = countResults();
      const filterPanel = getFilterPanel();

      const presetBtn = within(filterPanel).getByRole('button', { name: /Potencia: 116\+ CV/ });
      await user.click(presetBtn);

      const newCount = countResults();
      expect(newCount).toBeGreaterThan(0);
      expect(newCount).toBeLessThan(initialCount);
    });

    it('filtrar por equipo reduce los resultados', async () => {
      const user = userEvent.setup();
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const initialCount = countResults();
      const filterPanel = getFilterPanel();

      const heatedGripsBtn = within(filterPanel).getByRole('button', { name: 'Electrónica: Puños calefactables' });
      await user.click(heatedGripsBtn);

      const newCount = countResults();
      expect(newCount).toBeGreaterThan(0);
      expect(newCount).toBeLessThan(initialCount);
    });

    it('combinar filtros de marca y segmento reduce aún más los resultados', async () => {
      const user = userEvent.setup();
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const initialCount = countResults();
      const filterPanel = getFilterPanel();

      const bmwBtn = within(filterPanel).getByRole('button', { name: 'Marca: BMW' });
      await user.click(bmwBtn);

      const afterBrand = countResults();
      expect(afterBrand).toBeLessThan(initialCount);

      const trailBtn = within(filterPanel).getByRole('button', { name: 'Segmento: Trail' });
      await user.click(trailBtn);

      const combinedCount = countResults();
      expect(combinedCount).toBeLessThanOrEqual(afterBrand);
    });

    it('Limpiar filtros restaura todos los resultados', async () => {
      const user = userEvent.setup();
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const filterPanel = getFilterPanel();

      const initialCount = countResults();
      const brandBtn = within(filterPanel).getByRole('button', { name: 'Marca: KTM' });
      await user.click(brandBtn);

      expect(countResults()).toBeLessThan(initialCount);

      const clearButtons = within(filterPanel).getAllByRole('button', { name: 'Limpiar filtros' });
      await user.click(clearButtons[0]);

      expect(countResults()).toBe(initialCount);
    });

    it('muestra empty state cuando los filtros producen cero resultados', async () => {
      const user = userEvent.setup();
      render(<AdminEditModelsPage motorcycles={bikeCatalog} />);

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'ZZZZ_NO_EXISTE');

      expect(screen.getByText('No hay modelos que coincidan con los filtros.')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Limpiar filtros' }).length).toBeGreaterThan(0);
    });
  });

  it.each([
    ['Estudio de modelos', () => <AdminModelsPage />],
    ['Nuevo modelo', () => <AdminNewModelPage />],
    ['Seleccionar modelo para editar', () => <AdminEditModelsPage motorcycles={bikeCatalog} />],
  ])('mantiene el guard admin en %s para usuarios sin rol admin', (_title, pageFactory) => {
    mockAuth({ isAdmin: false });

    render(pageFactory());

    expect(screen.getByRole('heading', { name: 'No tienes permisos para acceder a esta zona.' })).toBeInTheDocument();
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

  it('las secciones del formulario son expandibles y están abiertas por defecto', async () => {
    const user = userEvent.setup();
    render(<AdminNewModelPage />);

    const section = screen.getByText('01. MODELO').closest('details');
    expect(section).not.toBeNull();
    expect(section).toHaveAttribute('open');

    await user.click(screen.getByText('01. MODELO'));
    expect(section).not.toHaveAttribute('open');

    await user.click(screen.getByText('01. MODELO'));
    expect(section).toHaveAttribute('open');
  });

  it('muestra el tooltip de imagen bloqueada / curada', () => {
    render(<AdminNewModelPage />);

    expect(screen.queryByRole('button', { name: /Más información sobre imagen bloqueada/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Evita que futuras sincronizaciones automáticas sustituyan esta imagen curada manualmente.')).not.toBeInTheDocument();
  });

  describe('image upload UI shell — mode switch and local preview', () => {
    let createObjectURLSpy: ReturnType<typeof vi.fn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

    function stubURL() {
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-preview-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    afterEach(() => {
      createObjectURLSpy?.mockRestore();
      revokeObjectURLSpy?.mockRestore();
    });

    it('los controles de URL manual no son visibles hasta abrir el modal y luego aparecen dentro', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      expect(screen.queryByRole('radio', { name: 'URL manual' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Image URL')).not.toBeInTheDocument();

      await openImageManager(user);

      expect(screen.getByRole('radio', { name: 'URL manual' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Subir archivo' })).toBeInTheDocument();
      expect(screen.getByLabelText('Image URL')).toBeInTheDocument();
    });

    it('URL manual mode mantiene el input de Image URL funcional', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.type(screen.getByLabelText('Image URL'), 'https://example.com/bike.webp');
      expect(screen.getByLabelText('Image URL')).toHaveValue('https://example.com/bike.webp');
    });

    it('switching a Subir archivo muestra el input file', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));

      expect(screen.getByLabelText('Seleccionar imagen del modelo')).toBeInTheDocument();
      expect(screen.queryByLabelText('Image URL')).not.toBeInTheDocument();
    });

    it('upload mode renderiza el trigger visual y estado vacío', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));

      expect(screen.getByText('Seleccionar imagen')).toBeInTheDocument();
      expect(screen.getByText('Ningún archivo seleccionado')).toBeInTheDocument();
    });

    function selectFile(input: HTMLElement, file: File) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    it('seleccionar JPEG válido muestra preview y metadatos', async () => {
      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));

      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'test-image.jpg', { type: 'image/jpeg' });
      selectFile(fileInput, file);

      expect(createObjectURLSpy).toHaveBeenCalledWith(file);
      expect(screen.getByAltText('Previsualización local del archivo seleccionado')).toHaveAttribute('src', 'blob:mock-preview-url');
      expect(screen.getAllByText(/test-image\.jpg/)).toHaveLength(2);
    });

    it('seleccionar PNG válido muestra preview', async () => {
      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));

      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      selectFile(fileInput, file);

      expect(screen.getByAltText('Previsualización local del archivo seleccionado')).toHaveAttribute('src', 'blob:mock-preview-url');
    });

    it('seleccionar WebP válido muestra preview', async () => {
      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));

      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'test.webp', { type: 'image/webp' });
      selectFile(fileInput, file);

      expect(screen.getByAltText('Previsualización local del archivo seleccionado')).toHaveAttribute('src', 'blob:mock-preview-url');
    });

    it('tipo no soportado muestra role="alert" sin preview', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));

      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'test.gif', { type: 'image/gif' });
      selectFile(fileInput, file);

      expect(screen.getByRole('alert')).toHaveTextContent('Tipo de archivo no soportado. Usa: JPEG, PNG o WebP.');
      expect(screen.queryByAltText('Previsualización local del archivo seleccionado')).not.toBeInTheDocument();
    });

    it('archivo mayor a 5 MB muestra role="alert" sin preview', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));

      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const largeContent = new ArrayBuffer(6 * 1024 * 1024);
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      selectFile(fileInput, file);

      expect(screen.getByRole('alert')).toHaveTextContent('El archivo supera el límite de 5 MB.');
      expect(screen.queryByAltText('Previsualización local del archivo seleccionado')).not.toBeInTheDocument();
    });

    it('volver a URL manual preserva el valor del input Image URL', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.type(screen.getByLabelText('Image URL'), 'https://example.com/bike.webp');

      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      expect(screen.queryByLabelText('Image URL')).not.toBeInTheDocument();

      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue('https://example.com/bike.webp');
    });

    it('seleccionar archivo no llama al servicio de upload', async () => {
      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      selectFile(fileInput, file);

      expect(screen.getByAltText('Previsualización local del archivo seleccionado')).toBeInTheDocument();
    });
  });

  describe('upload wiring — explicit Subir imagen action', () => {
    const publicUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/moto-id/uuid.jpg';
    const editPublicUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/uuid.jpg';
    let createObjectURLSpy: ReturnType<typeof vi.fn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
    });

    function stubURL() {
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-preview');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    afterEach(() => {
      createObjectURLSpy?.mockRestore();
      revokeObjectURLSpy?.mockRestore();
      uploadMotorcycleImageMock.mockReset();
    });

    function selectFile(input: HTMLElement, file: File) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    async function setupCreateWithFile() {
      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await user.type(screen.getByLabelText('Marca'), 'Ducati');
      await user.type(screen.getByLabelText('Modelo'), 'DesertX');

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'bike.jpg', { type: 'image/jpeg' });
      selectFile(fileInput, file);

      return { user, file };
    }

    async function setupEditWithFile() {
      stubURL();
      const user = userEvent.setup();
      render(<AdminEditMotorcyclePage motorcycleId="bmw-f-900-gs-2024" motorcycles={bikeCatalog} />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'bike.jpg', { type: 'image/jpeg' });
      selectFile(fileInput, file);

      return { user, file };
    }

    it('upload mode renderiza Subir imagen tras seleccionar archivo válido', async () => {
      const user = userEvent.setup();
      stubURL();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      selectFile(fileInput, new File(['dummy'], 'bike.jpg', { type: 'image/jpeg' }));

      expect(screen.getByRole('button', { name: 'Subir imagen' })).toBeInTheDocument();
    });

    it('create upload pasa modelId de draft.modelId a uploadMotorcycleImage', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      const { user, file } = await setupCreateWithFile();
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx-2025');

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(uploadMotorcycleImageMock).toHaveBeenCalledWith(file, 'ducati-desertx-2025', 'admin-token');
      });
    });

    it('create upload fallback a suggestedModelId cuando draft.modelId está vacío', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      const { user, file } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(uploadMotorcycleImageMock).toHaveBeenCalledWith(file, expect.stringContaining('ducati-desertx'), 'admin-token');
      });
    });

    it('edit upload pasa motorcycleId de ruta a uploadMotorcycleImage', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(editPublicUrl);
      const { user, file } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(uploadMotorcycleImageMock).toHaveBeenCalledWith(file, 'bmw-f-900-gs-2024', 'admin-token');
      });
    });

    it('edit explicit upload crea un gallery record con params correctos', async () => {
      const existingGallery = [
        {
          id: 'img-1',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/first.webp',
          storagePath: 'bmw-f-900-gs-2024/first.webp',
          altText: 'Primera imagen',
          isPrimary: true,
          sortOrder: 0,
          source: 'manual' as const,
          createdBy: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'img-2',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/second.webp',
          storagePath: 'bmw-f-900-gs-2024/second.webp',
          altText: 'Segunda imagen',
          isPrimary: false,
          sortOrder: 1,
          source: 'manual' as const,
          createdBy: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ] as const;

      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(existingGallery);
      createAdminMotorcycleGalleryImageMock.mockResolvedValueOnce({
        id: 'img-3',
        motorcycleId: 'bmw-f-900-gs-2024',
        url: editPublicUrl,
        storagePath: 'bmw-f-900-gs-2024/uuid.jpg',
        altText: null,
        isPrimary: false,
        sortOrder: 2,
        source: 'manual',
        createdBy: 'admin-1',
        createdAt: '2026-06-17T10:00:00.000Z',
        updatedAt: '2026-06-17T10:00:00.000Z',
      });
      uploadMotorcycleImageMock.mockResolvedValueOnce(editPublicUrl);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(createAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith({
          motorcycleId: 'bmw-f-900-gs-2024',
          url: editPublicUrl,
          storagePath: 'bmw-f-900-gs-2024/uuid.jpg',
          isPrimary: false,
          sortOrder: 2,
          source: 'manual',
          createdBy: 'admin-1',
        }, 'admin-token');
      });
    });

    it('edit explicit upload añade el gallery record al modal sin refetch', async () => {
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);
      createAdminMotorcycleGalleryImageMock.mockResolvedValueOnce({
        id: 'img-new',
        motorcycleId: 'bmw-f-900-gs-2024',
        url: editPublicUrl,
        storagePath: 'bmw-f-900-gs-2024/uuid.jpg',
        altText: 'Nueva vista lateral',
        isPrimary: false,
        sortOrder: 0,
        source: 'manual',
        createdBy: 'admin-1',
        createdAt: '2026-06-17T10:00:00.000Z',
        updatedAt: '2026-06-17T10:00:00.000Z',
      });
      uploadMotorcycleImageMock.mockResolvedValueOnce(editPublicUrl);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
      expect(screen.getByRole('article', { name: 'Nueva vista lateral' })).toBeInTheDocument();
      expect(getAdminMotorcycleGalleryImagesMock).toHaveBeenCalledTimes(1);
    });

    it('upload exitoso actualiza Image URL y marca Imagen bloqueada', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue(publicUrl);
      expect(screen.getByRole('checkbox', { name: /Imagen bloqueada/ })).toBeChecked();
    });

    it('upload exitoso en edit actualiza Image URL y marca Imagen bloqueada', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(editPublicUrl);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue(editPublicUrl);
      expect(screen.getByRole('checkbox', { name: /Imagen bloqueada/ })).toBeChecked();
    });

    it('edit explicit upload con fallo de gallery record sigue siendo no bloqueante', async () => {
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);
      createAdminMotorcycleGalleryImageMock.mockRejectedValueOnce(new Error('Gallery DB error'));
      uploadMotorcycleImageMock.mockResolvedValueOnce(editPublicUrl);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Imagen subida correctamente, pero no se pudo registrar en la galería.');
      });

      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue(editPublicUrl);
      expect(screen.getByRole('checkbox', { name: /Imagen bloqueada/i })).toBeChecked();
      expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', editPublicUrl);
    });

    it('upload error muestra role alert sin perder preview', async () => {
      uploadMotorcycleImageMock.mockRejectedValueOnce(new Error('Storage error'));
      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Storage error');
      });

      expect(screen.getByAltText('Previsualización local del archivo seleccionado')).toBeInTheDocument();
    });

    it('upload permite reintentar tras error', async () => {
      uploadMotorcycleImageMock.mockRejectedValueOnce(new Error('Network error'));
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error');
      });

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });
    });

    it('upload sin access token muestra error controlado', async () => {
      useAuthMock.mockReturnValue(createAuthState({
        user: adminUserFixture,
        session: null,
        profile: adminProfileFixture,
        isAuthenticated: true,
        isAdmin: true,
        isLoading: false,
        signIn: signInMock,
        signUp: signUpMock,
        signOut: signOutMock,
        refreshProfile: refreshProfileMock,
      }));

      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('No hay sesión activa para subir la imagen.');
      });

      expect(uploadMotorcycleImageMock).not.toHaveBeenCalled();
    });

    it('upload no llama a createAdminMotorcycle ni updateAdminMotorcycle', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
      expect(updateAdminMotorcycleMock).not.toHaveBeenCalled();
    });

    it('create explicit upload no crea gallery record todavía', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
    });

    it('edit explicit upload appended at end of gallery library order', async () => {
      const galleryOrderFixtures = [
        { id: 'g-1', motorcycleId: 'bmw-f-900-gs-2024', url: '/storage/v1/object/public/motorcycle-images/bmw-1.webp', storagePath: 'bmw-1.webp', altText: 'BMW lateral', isPrimary: true, sortOrder: 0, source: 'api' as const, createdBy: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'g-2', motorcycleId: 'bmw-f-900-gs-2024', url: '/storage/v1/object/public/motorcycle-images/bmw-2.webp', storagePath: 'bmw-2.webp', altText: 'BMW trasera', isPrimary: false, sortOrder: 1, source: 'manual' as const, createdBy: 'admin-1', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
        { id: 'g-3', motorcycleId: 'bmw-f-900-gs-2024', url: '/storage/v1/object/public/motorcycle-images/bmw-3.webp', storagePath: 'bmw-3.webp', altText: 'BMW detalle', isPrimary: false, sortOrder: 2, source: 'api' as const, createdBy: null, createdAt: '2026-01-03T00:00:00.000Z', updatedAt: '2026-01-03T00:00:00.000Z' },
      ];
      const uploadOrderUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/new-upload.webp';
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryOrderFixtures);
      createAdminMotorcycleGalleryImageMock.mockResolvedValueOnce({
        id: 'g-new', motorcycleId: 'bmw-f-900-gs-2024', url: uploadOrderUrl, storagePath: 'bmw-f-900-gs-2024/new-upload.webp', altText: null, isPrimary: false, sortOrder: 3, source: 'manual' as const, createdBy: 'admin-1', createdAt: '2026-06-18T10:00:00.000Z', updatedAt: '2026-06-18T10:00:00.000Z',
      });
      uploadMotorcycleImageMock.mockResolvedValueOnce(uploadOrderUrl);
      const { user } = await setupEditWithFile();

      const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });

      const getGalleryUrls = () => within(galleryRegion)
        .getAllByRole('article')
        .map((card) => card.getAttribute('data-library-image-url') ?? '')
        .filter((url) => url.startsWith('/storage/') || url.startsWith('https://supabase.test'));

      const beforeUrls = getGalleryUrls();

      const uploadBtn = await screen.findByRole('button', { name: 'Subir imagen' });
      await user.click(uploadBtn);

      await waitFor(() => {
        expect(createAdminMotorcycleGalleryImageMock).toHaveBeenCalled();
      });

      const afterUrls = getGalleryUrls();
      expect(afterUrls).toEqual([...beforeUrls, uploadOrderUrl]);
    });

    it('upload success muestra estado y limpia el preview/file tras la subida', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      const { user } = await setupCreateWithFile();

      expect(screen.getByAltText('Previsualización local del archivo seleccionado')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Subir imagen' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      expect(screen.queryByAltText('Previsualización local del archivo seleccionado')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Subir imagen' })).not.toBeInTheDocument();
      expect(screen.getByText('Ningún archivo seleccionado')).toBeInTheDocument();
    });

    it('upload warning muestra role alert en el panel de estado', async () => {
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);
      createAdminMotorcycleGalleryImageMock.mockRejectedValueOnce(new Error('Gallery DB error'));
      uploadMotorcycleImageMock.mockResolvedValueOnce(editPublicUrl);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Imagen subida correctamente, pero no se pudo registrar en la galería.');
      });
    });

    it('seleccionar nuevo archivo resetea el upload success status', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo') as HTMLInputElement;
      const secondFile = new File(['dummy'], 'replacement.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [secondFile] } });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByAltText('Previsualización local del archivo seleccionado')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Subir imagen' })).toBeInTheDocument();
    });
  });

  describe('current image preview + delete cleanup', () => {
    const bucketUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/uuid.jpg';
    const replacedUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/replaced.jpg';
    const createUploadedUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/ducati-desertx-2025/uploaded.jpg';
    const technicalPlaceholderImage = '/images/placeholders/motorcycle-technical-pending.jpg';
    let createObjectURLSpy: ReturnType<typeof vi.fn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
    });

    function stubURL() {
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-preview');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    function renderEditWithBucketImage() {
      const bucketBike = {
        ...bikeCatalog[0],
        id: 'bmw-f-900-gs-2024',
        imageUrl: bucketUrl,
        imageLocked: true,
      };

      render(
        <AdminEditMotorcyclePage
          motorcycleId="bmw-f-900-gs-2024"
          motorcycles={[bucketBike]}
          onMotorcyclesChange={vi.fn()}
        />,
      );
    }

    async function setupCreateWithUploadedImage() {
      stubURL();
      uploadMotorcycleImageMock.mockResolvedValueOnce(createUploadedUrl);
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await user.type(screen.getByLabelText('Marca'), 'Ducati');
      await user.type(screen.getByLabelText('Modelo'), 'DesertX');
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx-2025');
      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'replacement.jpg', { type: 'image/jpeg' })] },
      });
      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      return { user };
    }

    afterEach(() => {
      createObjectURLSpy?.mockRestore();
      revokeObjectURLSpy?.mockRestore();
      uploadMotorcycleImageMock.mockReset();
      deleteMotorcycleImageMock.mockReset();
      vi.unstubAllEnvs();
    });

    it('imagen persistida de bucket en edit muestra quitar del formulario, no delete inmediato', () => {
      renderEditWithBucketImage();

      expect(screen.getByRole('button', { name: 'Quitar imagen del formulario' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Eliminar imagen actual' })).not.toBeInTheDocument();
    });

    it('imagen persistida de bucket en edit no llama deleteMotorcycleImage al quitarla del formulario', async () => {
      const user = userEvent.setup();
      renderEditWithBucketImage();

      await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));

      expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent('Imagen quitada del formulario.');
      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue(technicalPlaceholderImage);
      expect(screen.getByRole('checkbox', { name: /Imagen bloqueada/i })).not.toBeChecked();
    });

    it('manual external URL no llama deleteMotorcycleImage al quitarla del formulario', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.type(screen.getByLabelText('Image URL'), 'https://cdn.example.com/manual-image.webp');
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
      await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));

      expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue(technicalPlaceholderImage);
    });

    it('replace flow sigue funcionando cuando ya existe una imagen actual', async () => {
      stubURL();
      uploadMotorcycleImageMock.mockResolvedValueOnce(replacedUrl);
      const user = userEvent.setup();
      renderEditWithBucketImage();

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'replacement.jpg', { type: 'image/jpeg' })] },
      });

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', replacedUrl);

      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue(replacedUrl);
      expect(screen.getByRole('checkbox', { name: /Imagen bloqueada/i })).toBeChecked();
    });

    it('publish failure tras reemplazar imagen persistida no elimina la imagen vieja de Storage', async () => {
      stubURL();
      uploadMotorcycleImageMock.mockResolvedValueOnce(replacedUrl);
      updateAdminMotorcycleMock.mockRejectedValueOnce(new Error('Update failed'));
      const user = userEvent.setup();
      renderEditWithBucketImage();

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'replacement.jpg', { type: 'image/jpeg' })] },
      });
      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Update failed');
      });

      expect(deleteMotorcycleImageMock).not.toHaveBeenCalledWith('bmw-f-900-gs-2024/uuid.jpg', 'admin-token');
    });

    it('publish success tras reemplazar imagen persistida elimina la imagen vieja después del update', async () => {
      stubURL();
      uploadMotorcycleImageMock.mockResolvedValueOnce(replacedUrl);
      updateAdminMotorcycleMock.mockResolvedValueOnce({
        ...(bikeCatalog[0] as Bike),
        id: 'bmw-f-900-gs-2024',
        imageUrl: replacedUrl,
      });
      const user = userEvent.setup();
      renderEditWithBucketImage();

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'replacement.jpg', { type: 'image/jpeg' })] },
      });
      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(deleteMotorcycleImageMock).toHaveBeenCalledWith('bmw-f-900-gs-2024/uuid.jpg', 'admin-token');
      });
    });

    it('publish success no elimina la imagen vieja si ya está respaldada por la galería', async () => {
      stubURL();
      getAdminMotorcycleGalleryImagesMock.mockResolvedValue([
        {
          id: 'img-original',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: bucketUrl,
          storagePath: 'bmw-f-900-gs-2024/uuid.jpg',
          altText: 'Imagen original en galería',
          isPrimary: false,
          sortOrder: 0,
          source: 'manual',
          createdBy: 'admin-1',
          createdAt: '2026-06-17T10:00:00.000Z',
          updatedAt: '2026-06-17T10:00:00.000Z',
        },
      ]);
      uploadMotorcycleImageMock.mockResolvedValueOnce(replacedUrl);
      updateAdminMotorcycleMock.mockResolvedValueOnce({
        ...(bikeCatalog[0] as Bike),
        id: 'bmw-f-900-gs-2024',
        imageUrl: replacedUrl,
      });
      const user = userEvent.setup();
      renderEditWithBucketImage();

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'replacement.jpg', { type: 'image/jpeg' })] },
      });
      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalled();
      });

      expect(deleteMotorcycleImageMock).not.toHaveBeenCalledWith('bmw-f-900-gs-2024/uuid.jpg', 'admin-token');
    });

    it('publish success con misma imagen de Storage y query distinta no elimina el objeto persistido', async () => {
      const user = userEvent.setup();
      renderEditWithBucketImage();

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      const imageUrlInput = screen.getByLabelText('Image URL');
      await user.clear(imageUrlInput);
      await user.type(imageUrlInput, `${bucketUrl}?cache=2#preview`);
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalled();
      });

      expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
    });

    it('imagen de otro proyecto Supabase no dispara cleanup destructivo al publicar reemplazo', async () => {
      stubURL();
      uploadMotorcycleImageMock.mockResolvedValueOnce(replacedUrl);
      const foreignBucketBike = {
        ...bikeCatalog[0],
        id: 'bmw-f-900-gs-2024',
        imageUrl: 'https://other-project.supabase.co/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/foreign.jpg',
        imageLocked: true,
      };
      const user = userEvent.setup();

      render(
        <AdminEditMotorcyclePage
          motorcycleId="bmw-f-900-gs-2024"
          motorcycles={[foreignBucketBike]}
          onMotorcyclesChange={vi.fn()}
        />,
      );

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'replacement.jpg', { type: 'image/jpeg' })] },
      });
      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalled();
      });

      expect(deleteMotorcycleImageMock).not.toHaveBeenCalledWith('bmw-f-900-gs-2024/foreign.jpg', 'admin-token');
    });

    it('imagen subida en la sesión se puede eliminar inmediatamente', async () => {
      deleteMotorcycleImageMock.mockResolvedValueOnce();
      const { user } = await setupCreateWithUploadedImage();

      await user.click(screen.getByRole('button', { name: 'Eliminar imagen actual' }));

      await waitFor(() => {
        expect(deleteMotorcycleImageMock).toHaveBeenCalledWith('ducati-desertx-2025/uploaded.jpg', 'admin-token');
      });

      expect(screen.getByRole('status')).toHaveTextContent('Imagen eliminada correctamente.');
      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue(technicalPlaceholderImage);
      expect(screen.getByRole('checkbox', { name: /Imagen bloqueada/i })).not.toBeChecked();
    });

    it('imagen subida y guardada en galería no se elimina físicamente desde el flujo anterior', async () => {
      stubURL();
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);
      createAdminMotorcycleGalleryImageMock.mockResolvedValueOnce({
        id: 'img-gallery-backed',
        motorcycleId: 'bmw-f-900-gs-2024',
        url: replacedUrl,
        storagePath: 'bmw-f-900-gs-2024/replaced.jpg',
        altText: 'Imagen persistida en galería',
        isPrimary: false,
        sortOrder: 0,
        source: 'manual',
        createdBy: 'admin-1',
        createdAt: '2026-06-17T10:00:00.000Z',
        updatedAt: '2026-06-17T10:00:00.000Z',
      });
      uploadMotorcycleImageMock.mockResolvedValueOnce(replacedUrl);
      const user = userEvent.setup();
      renderEditWithBucketImage();

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'replacement.jpg', { type: 'image/jpeg' })] },
      });
      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      expect(screen.queryByRole('button', { name: 'Eliminar imagen actual' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Quitar imagen del formulario' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));

      expect(deleteMotorcycleImageMock).not.toHaveBeenCalledWith('bmw-f-900-gs-2024/replaced.jpg', 'admin-token');
      expect(screen.getByRole('status')).toHaveTextContent('Imagen quitada del formulario.');
    });

    it('al quitar la portada actual aplica el placeholder técnico como fallback', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      await user.type(screen.getByLabelText('Image URL'), 'https://cdn.example.com/manual-image.webp');
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));

      expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', technicalPlaceholderImage);
      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      expect(screen.getByLabelText('Image URL')).toHaveValue(technicalPlaceholderImage);
      expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
    });

    it('al quitar la portada actual no crea un gallery record para el placeholder', async () => {
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'URL manual' }));
      await user.type(screen.getByLabelText('Image URL'), 'https://cdn.example.com/manual-image.webp');
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));

      expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
    });

    it('al quitar la portada actual no muta la metadata existente de galería', async () => {
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([
        {
          id: 'img-original',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: bucketUrl,
          storagePath: 'bmw-f-900-gs-2024/uuid.jpg',
          altText: 'Imagen original en galería',
          isPrimary: true,
          sortOrder: 0,
          source: 'manual',
          createdBy: 'admin-1',
          createdAt: '2026-06-17T10:00:00.000Z',
          updatedAt: '2026-06-17T10:00:00.000Z',
        },
      ]);
      const user = userEvent.setup();
      renderEditWithBucketImage();

      await openImageManager(user);
      const galleryBefore = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
      expect(within(galleryBefore).getAllByRole('article')).toHaveLength(2);
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));

      expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
      expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();

      await openImageManager(user);
      const galleryAfter = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
      expect(within(galleryAfter).getAllByRole('article')).toHaveLength(2);
      expect(screen.getByRole('img', { name: 'Portada activa del modelo' })).toHaveAttribute('src', technicalPlaceholderImage);
    });

    it('delete failure de imagen subida en la sesión mantiene la UI y muestra role alert', async () => {
      deleteMotorcycleImageMock.mockRejectedValueOnce(new Error('Delete failed'));
      const { user } = await setupCreateWithUploadedImage();

      await user.click(screen.getByRole('button', { name: 'Eliminar imagen actual' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Delete failed');
      });

      expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', createUploadedUrl);
    });

    it('descartar cambios limpia archivo local pendiente y estado de upload', async () => {
      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'pending-upload.jpg', { type: 'image/jpeg' })] },
      });

      expect(screen.getAllByText(/pending-upload\.jpg/)).toHaveLength(2);
      expect(screen.getByText('Archivo seleccionado')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Descartar cambios' }));

      expect(screen.getByText('Ningún archivo seleccionado')).toBeInTheDocument();
      expect(screen.queryByText('Archivo seleccionado')).not.toBeInTheDocument();
      expect(uploadMotorcycleImageMock).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent('Cambios descartados.');
    });
  });

  describe('auto-upload before publish', () => {
    const publicUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/moto-id/uuid.jpg';

    let createObjectURLSpy: ReturnType<typeof vi.fn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
    });

    function stubURL() {
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-preview');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    afterEach(() => {
      createObjectURLSpy?.mockRestore();
      revokeObjectURLSpy?.mockRestore();
      uploadMotorcycleImageMock.mockReset();
      createAdminMotorcycleMock.mockReset();
      updateAdminMotorcycleMock.mockReset();
    });

    function selectFile(input: HTMLElement, file: File) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByLabelText('Marca'), 'Ducati');
      await user.type(screen.getByLabelText('Modelo'), 'DesertX');
      await user.type(screen.getByLabelText('Año'), '2025');
      await user.type(screen.getByLabelText('Descripción'), 'Adventure bike.');
      await user.selectOptions(screen.getByLabelText('Segmento'), 'adventure');
      await user.selectOptions(screen.getByLabelText('Carnet'), 'A');
      await user.selectOptions(screen.getByLabelText('Tipo de motor'), 'parallel-twin');
      await user.type(screen.getByLabelText('Cilindrada (cc)'), '937');
      await user.type(screen.getByLabelText('Potencia (hp)'), '110');
      await user.type(screen.getByLabelText('Torque (nm)'), '92');
      await user.type(screen.getByLabelText('Peso (kg)'), '210');
      await user.type(screen.getByLabelText('Altura asiento (mm)'), '875');
      await user.type(screen.getByLabelText('Depósito (l)'), '21');
    }

    async function setupCreateWithFile() {
      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage onMotorcyclesChange={vi.fn()} />);

      await fillCreateForm(user);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'bike.jpg', { type: 'image/jpeg' });
      selectFile(fileInput, file);

      return { user, file };
    }

    async function setupEditWithFile() {
      stubURL();
      const user = userEvent.setup();
      render(<AdminEditMotorcyclePage motorcycleId="bmw-f-900-gs-2024" motorcycles={bikeCatalog} onMotorcyclesChange={vi.fn()} />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'bike.jpg', { type: 'image/jpeg' });
      selectFile(fileInput, file);

      return { user, file };
    }

    it('URL manual mode publish no llama a uploadMotorcycleImage', async () => {
      createAdminMotorcycleMock.mockResolvedValueOnce({ id: 'created-id', brand: 'Ducati', model: 'DesertX', year: 2025, segment: 'trail', license: 'A', engineType: 'parallel-twin', displacementCc: 937, powerHp: 110, torqueNm: 92, wetWeightKg: 210, seatHeightMm: 875, fuelTankLiters: 21, priceEur: 15000, imageUrl: '/images/ducati-desertx.webp', imageLocked: true } as unknown as Bike);
      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage onMotorcyclesChange={vi.fn()} />);

      await fillCreateForm(user);
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx');
      await openImageManager(user);
      await user.type(screen.getByLabelText('Image URL'), '/images/ducati-desertx.webp');
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(createAdminMotorcycleMock).toHaveBeenCalled();
      });
      expect(uploadMotorcycleImageMock).not.toHaveBeenCalled();
      expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
    });

    it('upload mode with selected file auto-calls uploadMotorcycleImage before publish', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      createAdminMotorcycleMock.mockResolvedValueOnce({ id: 'created-id' } as unknown as Bike);
      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(uploadMotorcycleImageMock).toHaveBeenCalled();
      });
      expect(createAdminMotorcycleMock).toHaveBeenCalled();
    });

    it('create auto-upload usa draft.modelId cuando está presente', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      createAdminMotorcycleMock.mockResolvedValueOnce({ id: 'created-id' } as unknown as Bike);
      const { user } = await setupCreateWithFile();
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx-2025');

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(uploadMotorcycleImageMock).toHaveBeenCalledWith(expect.any(File), 'ducati-desertx-2025', 'admin-token');
      });
      expect(createAdminMotorcycleMock).toHaveBeenCalled();
    });

    it('create auto-upload fallback a suggestedModelId cuando draft.modelId vacío', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      createAdminMotorcycleMock.mockResolvedValueOnce({ id: 'created-id' } as unknown as Bike);
      const { user } = await setupCreateWithFile();

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(uploadMotorcycleImageMock).toHaveBeenCalledWith(expect.any(File), expect.stringContaining('ducati-desertx'), 'admin-token');
      });
      expect(createAdminMotorcycleMock).toHaveBeenCalled();
    });

    it('edit auto-upload usa route motorcycleId', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      updateAdminMotorcycleMock.mockResolvedValueOnce({ id: 'bmw-f-900-gs-2024' } as unknown as Bike);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(uploadMotorcycleImageMock).toHaveBeenCalledWith(expect.any(File), 'bmw-f-900-gs-2024', 'admin-token');
      });
      expect(updateAdminMotorcycleMock).toHaveBeenCalled();
    });

    it('create auto-upload success llama a createAdminMotorcycle con publicUrl retornado y imageLocked true', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      createAdminMotorcycleMock.mockResolvedValueOnce({ id: 'created-id' } as unknown as Bike);
      const { user } = await setupCreateWithFile();
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx');

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(createAdminMotorcycleMock).toHaveBeenCalledWith(
          expect.objectContaining({ imageUrl: publicUrl, imageLocked: true }),
          expect.any(String),
        );
      });
    });

    it('edit auto-upload success llama a updateAdminMotorcycle con publicUrl retornado y imageLocked true', async () => {
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);
      uploadMotorcycleImageMock.mockResolvedValueOnce('https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/uuid.jpg');
      updateAdminMotorcycleMock.mockResolvedValueOnce({ id: 'bmw-f-900-gs-2024' } as unknown as Bike);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalledWith(
          'bmw-f-900-gs-2024',
          expect.objectContaining({
            imageUrl: 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/uuid.jpg',
            imageLocked: true,
          }),
          'admin-token',
        );
      });
    });

    it('create publish con imagen subida en sesión crea gallery record después del create', async () => {
      const createdBike = { id: 'created-id' } as Bike;
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      createAdminMotorcycleMock.mockResolvedValueOnce(createdBike);
      const { user } = await setupCreateWithFile();
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx');

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(createAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith({
          motorcycleId: 'created-id',
          url: publicUrl,
          storagePath: 'moto-id/uuid.jpg',
          isPrimary: true,
          sortOrder: 0,
          source: 'manual',
          createdBy: 'admin-1',
        }, 'admin-token');
      });
      expect(createAdminMotorcycleMock.mock.invocationCallOrder[0]).toBeLessThan(
        createAdminMotorcycleGalleryImageMock.mock.invocationCallOrder[0]!,
      );
    });

    it('edit auto-upload before publish crea gallery record y luego llama updateAdminMotorcycle', async () => {
      const editUploadUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/auto.jpg';
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([
        {
          id: 'img-1',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/existing.webp',
          storagePath: 'bmw-f-900-gs-2024/existing.webp',
          altText: 'Existente',
          isPrimary: true,
          sortOrder: 0,
          source: 'manual',
          createdBy: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
      uploadMotorcycleImageMock.mockResolvedValueOnce(editUploadUrl);
      updateAdminMotorcycleMock.mockResolvedValueOnce({ id: 'bmw-f-900-gs-2024' } as unknown as Bike);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(createAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith({
          motorcycleId: 'bmw-f-900-gs-2024',
          url: editUploadUrl,
          storagePath: 'bmw-f-900-gs-2024/auto.jpg',
          isPrimary: false,
          sortOrder: 1,
          source: 'manual',
          createdBy: 'admin-1',
        }, 'admin-token');
      });
      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalled();
      });
      expect(createAdminMotorcycleGalleryImageMock.mock.invocationCallOrder[0]).toBeLessThan(
        updateAdminMotorcycleMock.mock.invocationCallOrder[0]!,
      );
    });

    it('edit auto-upload sincroniza isPrimary con la galería — regresión stale galleryImagesRef', async () => {
      const editUploadUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/regression.jpg';
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([
        {
          id: 'img-primary',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/old-primary.webp',
          storagePath: 'bmw-f-900-gs-2024/old-primary.webp',
          altText: 'Primaria existente',
          isPrimary: true,
          sortOrder: 0,
          source: 'manual',
          createdBy: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
      createAdminMotorcycleGalleryImageMock.mockResolvedValueOnce({
        id: 'img-new-regression',
        motorcycleId: 'bmw-f-900-gs-2024',
        url: editUploadUrl,
        storagePath: 'bmw-f-900-gs-2024/regression.jpg',
        altText: null,
        isPrimary: false,
        sortOrder: 1,
        source: 'manual',
        createdBy: 'admin-1',
        createdAt: '2026-06-17T10:00:00.000Z',
        updatedAt: '2026-06-17T10:00:00.000Z',
      });
      uploadMotorcycleImageMock.mockResolvedValueOnce(editUploadUrl);
      updateAdminMotorcycleMock.mockResolvedValueOnce({ id: 'bmw-f-900-gs-2024' } as unknown as Bike);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(createAdminMotorcycleGalleryImageMock).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(updateAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith(
          'img-primary',
          { isPrimary: false },
          'admin-token',
        );
      });

      await waitFor(() => {
        expect(updateAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith(
          'img-new-regression',
          { isPrimary: true },
          'admin-token',
        );
      });

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalledWith(
          'bmw-f-900-gs-2024',
          expect.objectContaining({
            imageUrl: editUploadUrl,
            imageLocked: true,
          }),
          'admin-token',
        );
      });

      const galleryUpdateCalls = updateAdminMotorcycleGalleryImageMock.mock.calls;
      galleryUpdateCalls.forEach((call) => {
        const updates = call[1] as Record<string, unknown>;
        expect(updates).not.toHaveProperty('sortOrder');
      });

      expect(createAdminMotorcycleGalleryImageMock).toHaveBeenCalledTimes(1);
    });

    it('auto-upload failure previene create/update y muestra role alert', async () => {
      uploadMotorcycleImageMock.mockRejectedValueOnce(new Error('Upload storage error'));
      const { user } = await setupCreateWithFile();
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx');

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Upload storage error');
      });
      expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
      expect(updateAdminMotorcycleMock).not.toHaveBeenCalled();
      expect(window.location.hash).toBe('');
    });

    it('missing access token previene upload y publish', async () => {
      useAuthMock.mockReturnValue(createAuthState({
        user: adminUserFixture,
        session: null,
        profile: adminProfileFixture,
        isAuthenticated: true,
        isAdmin: true,
        isLoading: false,
        signIn: signInMock,
        signUp: signUpMock,
        signOut: signOutMock,
        refreshProfile: refreshProfileMock,
      }));

      stubURL();
      const user = userEvent.setup();
      render(<AdminNewModelPage onMotorcyclesChange={vi.fn()} />);

      await fillCreateForm(user);
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx');
      await openImageManager(user);
      await user.type(screen.getByLabelText('Image URL'), '/images/ducati-desertx.webp');
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      const fileInput = screen.getByLabelText('Seleccionar imagen del modelo');
      const file = new File(['dummy'], 'bike.jpg', { type: 'image/jpeg' });
      selectFile(fileInput, file);

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('No hay sesión activa para subir la imagen.');
      });
      expect(uploadMotorcycleImageMock).not.toHaveBeenCalled();
      expect(createAdminMotorcycleMock).not.toHaveBeenCalled();
    });

    it('explicit Subir imagen + publish posterior funciona correctamente', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      createAdminMotorcycleMock.mockResolvedValueOnce({ id: 'created-id' } as unknown as Bike);
      const { user } = await setupCreateWithFile();
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx');

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(createAdminMotorcycleMock).toHaveBeenCalledWith(
          expect.objectContaining({ imageUrl: publicUrl, imageLocked: true }),
          expect.any(String),
        );
      });
      expect(uploadMotorcycleImageMock).toHaveBeenCalledTimes(1);
    });

    it('edit explicit upload no crea un gallery record duplicado al publicar después', async () => {
      const editUploadUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/explicit.jpg';
      getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);
      createAdminMotorcycleGalleryImageMock.mockResolvedValueOnce({
        id: 'img-explicit',
        motorcycleId: 'bmw-f-900-gs-2024',
        url: editUploadUrl,
        storagePath: 'bmw-f-900-gs-2024/explicit.jpg',
        altText: null,
        isPrimary: false,
        sortOrder: 0,
        source: 'manual',
        createdBy: 'admin-1',
        createdAt: '2026-06-17T10:00:00.000Z',
        updatedAt: '2026-06-17T10:00:00.000Z',
      });
      uploadMotorcycleImageMock.mockResolvedValueOnce(editUploadUrl);
      updateAdminMotorcycleMock.mockResolvedValueOnce({ id: 'bmw-f-900-gs-2024' } as unknown as Bike);
      const { user } = await setupEditWithFile();

      await user.click(screen.getByRole('button', { name: 'Subir imagen' }));
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Imagen subida correctamente y añadida a la galería.');
      });

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalled();
      });

      expect(createAdminMotorcycleGalleryImageMock).toHaveBeenCalledTimes(1);
    });

    it('auto-upload limpia el estado de archivo seleccionado tras publicar', async () => {
      uploadMotorcycleImageMock.mockResolvedValueOnce(publicUrl);
      createAdminMotorcycleMock.mockResolvedValueOnce({ id: 'created-id' } as unknown as Bike);
      const { user } = await setupCreateWithFile();
      await user.type(screen.getByLabelText('ID sugerido'), 'ducati-desertx');

      expect(screen.getByAltText('Previsualización local del archivo seleccionado')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(createAdminMotorcycleMock).toHaveBeenCalled();
      });

      expect(screen.queryByAltText('Previsualización local del archivo seleccionado')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Subir imagen' })).not.toBeInTheDocument();
    });
  });

  describe('AdminEditMotorcyclePage — #/admin/modelos/{motorcycleId}/editar', () => {
    const existingId = 'bmw-f-900-gs-2024';
    const unknownId = 'non-existent-motorcycle';
    const sharedProps = { motorcycles: bikeCatalog, onMotorcyclesChange: vi.fn() };
    const secondBike = bikeCatalog[1]!;

    it('renderiza el formulario de edición con modo edit para un modelo existente', () => {
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      expect(screen.getByRole('heading', { name: 'Editar modelo' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Workspace de edición' })).toBeInTheDocument();
      expect(screen.getByRole('form', { name: 'Formulario de edición de modelo' })).toBeInTheDocument();
      expect(screen.getByText('Actualiza los datos disponibles de este modelo.')).toBeInTheDocument();
      expect(screen.getByText(/^Editando /)).toBeInTheDocument();
    });

    it('no crashea si el draft no está disponible al primer render y se inicializa cuando llega la moto', () => {
      const { rerender } = render(
        <AdminEditMotorcyclePage
          motorcycleId={existingId}
          motorcycles={[]}
          onMotorcyclesChange={vi.fn()}
        />,
      );

      expect(screen.getAllByRole('heading', { name: 'Cargando modelo...' }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Preparando edición del modelo...').length).toBeGreaterThanOrEqual(1);

      rerender(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      expect(screen.getByRole('heading', { name: 'Editar modelo' })).toBeInTheDocument();
      expect(screen.getByLabelText('Marca')).toHaveValue('BMW');
      expect(screen.getByText(/^Editando BMW F 900 GS 2024$/)).toBeInTheDocument();
    });

    it('prefill los campos de identidad con los datos de la moto', () => {
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      expect(screen.getByLabelText('Marca')).toHaveValue('BMW');
      expect(screen.getByLabelText('Modelo')).toHaveValue('F 900 GS');
      expect(screen.getByDisplayValue('2024')).toBeInTheDocument();
    });

    it('prefill los campos de specs con los datos de la moto', () => {
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      expect(screen.getByLabelText('Segmento')).toHaveValue('trail');
      expect(screen.getByLabelText('Carnet')).toHaveValue('A');
      expect(screen.getByLabelText('Potencia (hp)')).toHaveValue(105);
    });

    it('muestra el preview hero con los datos de la moto existente', () => {
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      const previewHeading = screen.getByRole('heading', { name: 'BMW F 900 GS' });
      const previewSection = previewHeading.closest('section');
      expect(previewHeading).toBeInTheDocument();
      expect(previewSection).not.toBeNull();
      expect(within(previewSection as HTMLElement).getByText('105 CV')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Preview local de BMW F 900 GS' })).toBeInTheDocument();
    });

    it('el modal de imágenes en edit muestra el badge del modelo disponible', async () => {
      const user = userEvent.setup();
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      await user.click(screen.getByRole('button', { name: 'Gestionar imágenes' }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('BMW · F 900 GS · 2024')).toBeInTheDocument();
    });

    it('preserva las mismas cuatro acciones en el footer', () => {
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      expect(screen.getByRole('button', { name: 'Descartar cambios' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Vista previa' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Publicar modelo' })).toBeInTheDocument();
    });

    it('Descartar cambios resetea al estado original precargado', async () => {
      const user = userEvent.setup();
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      await user.clear(screen.getByLabelText('Marca'));
      await user.type(screen.getByLabelText('Marca'), 'Yamaha');
      expect(screen.getByLabelText('Marca')).toHaveValue('Yamaha');

      await user.click(screen.getByRole('button', { name: 'Descartar cambios' }));
      expect(screen.getByRole('status')).toHaveTextContent('Cambios descartados.');
      expect(screen.getByLabelText('Marca')).toHaveValue('BMW');
    });

    it('cambiar motorcycleId resetea el draft al nuevo modelo sin conservar edits previos', async () => {
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:switch-preview');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const user = userEvent.setup();
      const { rerender } = render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      await user.clear(screen.getByLabelText('Marca'));
      await user.type(screen.getByLabelText('Marca'), 'Marca temporal');
      expect(screen.getByLabelText('Marca')).toHaveValue('Marca temporal');

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'route-switch.jpg', { type: 'image/jpeg' })] },
      });

      expect(screen.getByText('Archivo seleccionado')).toBeInTheDocument();

      rerender(
        <AdminEditMotorcyclePage
          motorcycleId={secondBike.id}
          motorcycles={bikeCatalog}
          onMotorcyclesChange={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('Marca')).toHaveValue(secondBike.brand);
      expect(screen.getByLabelText('Modelo')).toHaveValue(secondBike.model);
      expect(screen.getByText(new RegExp(`^Editando ${secondBike.brand} ${secondBike.model} ${secondBike.year}$`))).toBeInTheDocument();
      expect(screen.queryByText('Archivo seleccionado')).not.toBeInTheDocument();
      expect(screen.queryByText(/route-switch\.jpg/)).not.toBeInTheDocument();

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('descartar cambios en edit limpia el archivo local pendiente y restaura el estado original', async () => {
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:edit-preview');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const user = userEvent.setup();

      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      await openImageManager(user);
      await user.click(screen.getByRole('radio', { name: 'Subir archivo' }));
      fireEvent.change(screen.getByLabelText('Seleccionar imagen del modelo'), {
        target: { files: [new File(['dummy'], 'edit-replacement.jpg', { type: 'image/jpeg' })] },
      });

      expect(screen.getByText('Archivo seleccionado')).toBeInTheDocument();
      expect(screen.getAllByText(/edit-replacement\.jpg/).length).toBeGreaterThan(0);

      await user.click(screen.getByRole('button', { name: 'Descartar cambios' }));

      expect(screen.getByRole('status')).toHaveTextContent('Cambios descartados.');
      expect(screen.queryByText('Archivo seleccionado')).not.toBeInTheDocument();
      expect(screen.getByText('Ningún archivo seleccionado')).toBeInTheDocument();
      expect(screen.getByLabelText('Marca')).toHaveValue('BMW');

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('unknown motorcycleId muestra estado not-found con CTA', () => {
      render(<AdminEditMotorcyclePage motorcycleId={unknownId} {...sharedProps} />);

      const headings = screen.getAllByRole('heading', { name: 'Modelo no encontrado' });
      expect(headings.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('No se encontró un modelo con el identificador especificado.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver a selección de modelos' })).toHaveAttribute('href', '#/admin/modelos/editar');
    });

    it('undefined motorcycleId muestra estado not-found con CTA', () => {
      render(<AdminEditMotorcyclePage motorcycleId={undefined} {...sharedProps} />);

      const headings = screen.getAllByRole('heading', { name: 'Modelo no encontrado' });
      expect(headings.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('link', { name: 'Volver a selección de modelos' })).toHaveAttribute('href', '#/admin/modelos/editar');
    });

    it('las acciones de borrador y vista previa son locales sin llamar servicios', async () => {
      const user = userEvent.setup();
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
      expect(screen.getByRole('status')).toHaveTextContent('Borrador local actualizado.');

      await user.click(screen.getByRole('button', { name: 'Vista previa' }));
      expect(screen.getByRole('status')).toHaveTextContent('Vista previa actualizada.');
    });

    it('publicar modelo llama a updateAdminMotorcycle y muestra éxito', async () => {
      const user = userEvent.setup();
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      updateAdminMotorcycleMock.mockResolvedValueOnce({
        id: existingId, brand: 'BMW', model: 'F 900 GS', year: 2024,
        segment: 'trail' as const, license: 'A' as const, engineType: 'parallel-twin' as const,
        displacementCc: 895, powerHp: 105, torqueNm: 92, wetWeightKg: 219, seatHeightMm: 815,
        fuelTankLiters: 15, priceEur: 12490, imageUrl: '/bmw.jpg', imageLocked: false,
        description: 'Test', descriptionLocked: false,
        specsSource: 'manual' as const, priceSource: 'manual' as const, imageSource: 'manual' as const,
        scoresSource: 'estimated' as const, prosConsSource: 'estimated' as const, reliabilitySource: 'estimated' as const,
        isA2Compatible: false, isA2LimitedVersion: false, limitedPowerHp: null, originalPowerHp: null,
        officialUrl: null,
        useScores: { beginner: 0, city: 0, funFactor: 0, offroad: 0, passenger: 0, sport: 0, touring: 0 },
        features: { absCornering: false, cruiseControl: false, heatedGrips: false, quickshifter: false, ridingModes: false, tractionControl: false, tubelessWheels: false },
        pros: [], cons: [],
        reliabilityReports: { commonIssues: [], reportCount: 0, reliabilityScore: 0 },
      });

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalledWith(
          existingId,
          expect.objectContaining({ brand: 'BMW', model: 'F 900 GS' }),
          'admin-token',
        );
      });
      expect(screen.getByRole('status')).toHaveTextContent('Modelo actualizado correctamente.');
    });

    it('edit publish success navega a la ficha del modelo editado', async () => {
      const user = userEvent.setup();
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      updateAdminMotorcycleMock.mockResolvedValueOnce({
        id: existingId, brand: 'BMW', model: 'F 900 GS', year: 2024,
        segment: 'trail' as const, license: 'A' as const, engineType: 'parallel-twin' as const,
        displacementCc: 895, powerHp: 105, torqueNm: 92, wetWeightKg: 219, seatHeightMm: 815,
        fuelTankLiters: 15, priceEur: 12490, imageUrl: '/bmw.jpg', imageLocked: false,
        description: 'Test', descriptionLocked: false,
        specsSource: 'manual' as const, priceSource: 'manual' as const, imageSource: 'manual' as const,
        scoresSource: 'estimated' as const, prosConsSource: 'estimated' as const, reliabilitySource: 'estimated' as const,
        isA2Compatible: false, isA2LimitedVersion: false, limitedPowerHp: null, originalPowerHp: null,
        officialUrl: null,
        useScores: { beginner: 0, city: 0, funFactor: 0, offroad: 0, passenger: 0, sport: 0, touring: 0 },
        features: { absCornering: false, cruiseControl: false, heatedGrips: false, quickshifter: false, ridingModes: false, tractionControl: false, tubelessWheels: false },
        pros: [], cons: [],
        reliabilityReports: { commonIssues: [], reportCount: 0, reliabilityScore: 0 },
      });

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(updateAdminMotorcycleMock).toHaveBeenCalled();
      });
      expect(window.location.hash).toBe(`#/motos/${existingId}`);
    });

    it('edit publish service failure no navega', async () => {
      const user = userEvent.setup();
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      updateAdminMotorcycleMock.mockRejectedValueOnce(new Error('permission denied'));

      await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('permission denied');
      });
      expect(window.location.hash).toBe('');
    });

    it('publicar modelo no se ejecuta si el admin guard no permite el render', () => {
      mockAuth({
        user: null,
        session: null,
        profile: null,
        isAuthenticated: false,
        isAdmin: false,
      });
      render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

      expect(screen.queryByRole('button', { name: 'Publicar modelo' })).not.toBeInTheDocument();
      expect(updateAdminMotorcycleMock).not.toHaveBeenCalled();
    });

    describe('edit publish con galería cargada sincroniza isPrimary', () => {
      const galleryFixtures: readonly import('../../../services/adminMotorcycleGalleryService').AdminMotorcycleGalleryImage[] = [
        {
          id: 'img-1', motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-1.webp',
          storagePath: 'bmw-1.webp', altText: 'BMW F 900 GS lateral',
          isPrimary: true, sortOrder: 0, source: 'api', createdBy: null,
          createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'img-2', motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-2.webp',
          storagePath: 'bmw-2.webp', altText: 'BMW F 900 GS trasera',
          isPrimary: false, sortOrder: 1, source: 'manual', createdBy: 'admin-1',
          createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ];

      it('seleccionar imagen de galería como portada y publicar sincroniza isPrimary', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);
        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        expect(within(galleryRegion).getAllByRole('article').length).toBeGreaterThanOrEqual(2);

        await user.click(screen.getByRole('button', { name: 'Usar como portada: BMW F 900 GS trasera' }));
        await screen.findByRole('button', { name: 'Portada actual: BMW F 900 GS trasera' });

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(updateAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith('img-1', { isPrimary: false }, 'admin-token');
        expect(updateAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith('img-2', { isPrimary: true }, 'admin-token');
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });

      it('publicar con portada que coincide con la imagen primaria actual no llama a update gallery', async () => {
        const bikeWithGalleryPrimary = {
          ...bikeCatalog[0],
          id: existingId,
          imageUrl: galleryFixtures[0].url,
        };
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(
          <AdminEditMotorcyclePage
            motorcycleId={existingId}
            motorcycles={[bikeWithGalleryPrimary]}
            onMotorcyclesChange={vi.fn()}
          />,
        );

        await openImageManager(user);
        await screen.findByRole('button', { name: 'Portada actual: BMW F 900 GS lateral' });

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(updateAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });

      it('publicar con portada NO en galería unsetea la primaria anterior', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);
        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        expect(within(galleryRegion).getAllByRole('article').length).toBeGreaterThanOrEqual(2);

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(updateAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith('img-1', { isPrimary: false }, 'admin-token');
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });

      it('fallo en sync de galería no navega y muestra error', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        updateAdminMotorcycleGalleryImageMock.mockRejectedValueOnce(new Error('primary sync failed'));
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);
        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        expect(within(galleryRegion).getAllByRole('article').length).toBeGreaterThanOrEqual(2);

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(screen.getByRole('alert')).toHaveTextContent('primary sync failed');
        });
        expect(window.location.hash).toBe('');
      });

      it('publicar sin abrir galería con registros existentes sincroniza isPrimary vía fallback fetch', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(getAdminMotorcycleGalleryImagesMock).toHaveBeenCalledWith(existingId, 'admin-token');
        expect(updateAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith('img-1', { isPrimary: false }, 'admin-token');
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });

      it('publicar sin abrir galería sin registros en servidor fallback fetch devuelve vacío y saltea sync', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(getAdminMotorcycleGalleryImagesMock).toHaveBeenCalledWith(existingId, 'admin-token');
        expect(updateAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });

      it('publicar sin abrir galería fallback fetch falla muestra error y no navega', async () => {
        getAdminMotorcycleGalleryImagesMock.mockRejectedValueOnce(new Error('gallery fetch failed'));
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(screen.getByRole('alert')).toHaveTextContent('gallery fetch failed');
        });
        expect(window.location.hash).toBe('');
      });

      it('fallback fetch revela respaldo en galería: portada con gallery record no elimina Storage', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
        const galleryUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/uuid.jpg';
        const newUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/new.jpg';

        const galleryRecord = {
          id: 'img-gallery-backed', motorcycleId: existingId,
          url: galleryUrl,
          storagePath: 'bmw-f-900-gs-2024/uuid.jpg', altText: null,
          isPrimary: true, sortOrder: 0, source: 'api', createdBy: null,
          createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
        } satisfies import('../../../services/adminMotorcycleGalleryService').AdminMotorcycleGalleryImage;

        const galleryBackedBike = {
          ...bikeCatalog[0],
          id: existingId,
          imageUrl: galleryUrl,
        };
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([galleryRecord]);

        const user = userEvent.setup();
        render(
          <AdminEditMotorcyclePage
            motorcycleId={existingId}
            motorcycles={[galleryBackedBike]}
            onMotorcyclesChange={vi.fn()}
          />,
        );

        await openImageManager(user);
        const urlInput = await screen.findByLabelText('Image URL');
        await user.clear(urlInput);
        await user.paste(newUrl);
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });

      it('fallback fetch vacío: portada sin respaldo en galería permite limpiar Storage anterior', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
        const oldUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/old.jpg';
        const newUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/new.jpg';

        const notGalleryBackedBike = {
          ...bikeCatalog[0],
          id: existingId,
          imageUrl: oldUrl,
        };
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);

        const user = userEvent.setup();
        render(
          <AdminEditMotorcyclePage
            motorcycleId={existingId}
            motorcycles={[notGalleryBackedBike]}
            onMotorcyclesChange={vi.fn()}
          />,
        );

        await openImageManager(user);
        const urlInput = await screen.findByLabelText('Image URL');
        await user.clear(urlInput);
        await user.paste(newUrl);
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(deleteMotorcycleImageMock).toHaveBeenCalledWith('bmw-f-900-gs-2024/old.jpg', 'admin-token');
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });

      it('fallback fetch tras update falla: no elimina Storage, no navega, muestra error', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
        const oldUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/old.jpg';

        const notGalleryBackedBike = {
          ...bikeCatalog[0],
          id: existingId,
          imageUrl: oldUrl,
        };
        getAdminMotorcycleGalleryImagesMock.mockRejectedValueOnce(new Error('fallback gallery fetch failed'));

        const user = userEvent.setup();
        render(
          <AdminEditMotorcyclePage
            motorcycleId={existingId}
            motorcycles={[notGalleryBackedBike]}
            onMotorcyclesChange={vi.fn()}
          />,
        );

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(screen.getByRole('alert')).toHaveTextContent('fallback gallery fetch failed');
        });
        expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
        expect(window.location.hash).toBe('');
      });

      it('fallback fetch con storagePath: portada respaldada no elimina Storage sin abrir modal', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
        const storageUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/uuid.jpg';
        const objectPath = 'bmw-f-900-gs-2024/uuid.jpg';

        const galleryRecord = {
          id: 'img-storage-path', motorcycleId: existingId,
          url: 'https://cdn.example.com/unrelated/different-url.webp',
          storagePath: objectPath, altText: null,
          isPrimary: true, sortOrder: 0, source: 'api', createdBy: null,
          createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
        } satisfies import('../../../services/adminMotorcycleGalleryService').AdminMotorcycleGalleryImage;

        const storageBike = {
          ...bikeCatalog[0],
          id: existingId,
          imageUrl: storageUrl,
        };

        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([galleryRecord]);

        const user = userEvent.setup();
        render(
          <AdminEditMotorcyclePage
            motorcycleId={existingId}
            motorcycles={[storageBike]}
            onMotorcyclesChange={vi.fn()}
          />,
        );

        await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));
        await waitFor(() => {
          expect(screen.getByRole('status')).toHaveTextContent('Imagen quitada del formulario.');
        });

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(getAdminMotorcycleGalleryImagesMock).toHaveBeenCalledWith(existingId, 'admin-token');
        expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
        expect(updateAdminMotorcycleGalleryImageMock).toHaveBeenCalledWith('img-storage-path', { isPrimary: false }, 'admin-token');
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });

      it('fallback fetch vacío con storagePath: portada sin respaldo permite limpiar Storage sin abrir modal', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
        const storageUrl = 'https://supabase.test/storage/v1/object/public/motorcycle-images/bmw-f-900-gs-2024/old.jpg';

        const storageBike = {
          ...bikeCatalog[0],
          id: existingId,
          imageUrl: storageUrl,
        };

        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);

        const user = userEvent.setup();
        render(
          <AdminEditMotorcyclePage
            motorcycleId={existingId}
            motorcycles={[storageBike]}
            onMotorcyclesChange={vi.fn()}
          />,
        );

        await user.click(screen.getByRole('button', { name: 'Quitar imagen del formulario' }));
        await waitFor(() => {
          expect(screen.getByRole('status')).toHaveTextContent('Imagen quitada del formulario.');
        });

        await user.click(screen.getByRole('button', { name: 'Publicar modelo' }));

        await waitFor(() => {
          expect(updateAdminMotorcycleMock).toHaveBeenCalled();
        });
        expect(getAdminMotorcycleGalleryImagesMock).toHaveBeenCalledWith(existingId, 'admin-token');
        expect(deleteMotorcycleImageMock).toHaveBeenCalledWith('bmw-f-900-gs-2024/old.jpg', 'admin-token');
        expect(window.location.hash).toBe(`#/motos/${existingId}`);
      });
    });

    describe('galería de imágenes', () => {
      const technicalPlaceholderImage = '/images/placeholders/motorcycle-technical-pending.jpg';
      const galleryFixtures: readonly import('../../../services/adminMotorcycleGalleryService').AdminMotorcycleGalleryImage[] = [
        {
          id: 'img-1',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-1.webp',
          storagePath: 'bmw-1.webp',
          altText: 'BMW F 900 GS lateral',
          isPrimary: true,
          sortOrder: 0,
          source: 'api',
          createdBy: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'img-2',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-2.webp',
          storagePath: 'bmw-2.webp',
          altText: 'BMW F 900 GS trasera',
          isPrimary: false,
          sortOrder: 1,
          source: 'manual',
          createdBy: 'admin-1',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 'img-3',
          motorcycleId: 'bmw-f-900-gs-2024',
          url: '/storage/v1/object/public/motorcycle-images/bmw-3.webp',
          storagePath: 'bmw-3.webp',
          altText: 'BMW F 900 GS detalle',
          isPrimary: false,
          sortOrder: 2,
          source: 'api',
          createdBy: null,
          createdAt: '2026-01-03T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
      ];

      it('al abrir modal en edit mode llama al servicio de galería', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        await waitFor(() => {
          expect(getAdminMotorcycleGalleryImagesMock).toHaveBeenCalledWith(
            existingId,
            expect.any(String),
          );
        });
      });

      it('renderiza las imágenes de galería cuando se cargan', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const gallery = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        expect(gallery).toBeInTheDocument();

        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        const cards = within(galleryRegion).getAllByRole('article');
        expect(cards.length).toBe(5);
        expect(screen.getByRole('article', { name: 'BMW F 900 GS lateral' })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'BMW F 900 GS trasera' })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'BMW F 900 GS detalle' })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'Portada guardada' })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'Placeholder técnico MotoAtlas' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Portada actual' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Placeholder técnico' })).toBeInTheDocument();
      });

      it('elimina labels ruidosos visibles pero mantiene estados accesibles en la galería', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        expect(within(galleryRegion).queryByText('Imagen actual')).not.toBeInTheDocument();
        expect(within(galleryRegion).queryByText('Imagen original')).not.toBeInTheDocument();
        expect(within(galleryRegion).queryByText('Catálogo local')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Portada actual: Portada guardada' })).toBeDisabled();
        expect(screen.getByRole('img', { name: 'Placeholder técnico' })).toBeInTheDocument();
      });

      it('renderiza el workspace del modal con portada, biblioteca y controles en ese orden', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        const { container } = render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const workspace = container.querySelector('.admin-model__image-modal-workspace');
        expect(workspace).not.toBeNull();
        expect(workspace?.children[0]).toHaveClass('admin-model__image-modal-primary-panel');
        expect(workspace?.children[1]).toHaveClass('admin-model__image-modal-library');
        expect(workspace?.children[2]).toHaveClass('admin-model__image-modal-controls');
      });

      it('incluye la imagen original persistida cuando difiere de la portada actual del borrador', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);
        await user.click(screen.getByRole('radio', { name: 'URL manual' }));
        await user.clear(screen.getByLabelText('Image URL'));
        await user.type(screen.getByLabelText('Image URL'), 'https://cdn.example.com/admin-cover.webp');

        expect(screen.getByRole('article', { name: 'Portada en edición' })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'Portada guardada' })).toBeInTheDocument();
      });

      it('deduplica URLs cuando la portada actual ya existe como registro de galería', async () => {
        const motorcycleWithGalleryCover = {
          ...bikeCatalog[0],
          id: existingId,
          imageUrl: galleryFixtures[0].url,
        };
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(
          <AdminEditMotorcyclePage
            motorcycleId={existingId}
            motorcycles={[motorcycleWithGalleryCover]}
            onMotorcyclesChange={vi.fn()}
          />,
        );

        await openImageManager(user);

        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        expect(within(galleryRegion).getAllByRole('article').length).toBe(4);
        expect(within(galleryRegion).getAllByRole('article', { name: 'BMW F 900 GS lateral' })).toHaveLength(1);
        expect(within(galleryRegion).getAllByRole('article', { name: 'BMW F 900 GS detalle' })).toHaveLength(1);
      });

      it('permite seleccionar una imagen de la biblioteca como portada actual sin crear registros nuevos', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        await user.click(screen.getByRole('button', { name: 'Usar como portada: Placeholder técnico MotoAtlas' }));

        expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
        expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
        expect(screen.getByAltText('Portada activa del modelo')).toHaveAttribute('src', technicalPlaceholderImage);
        expect(screen.getByRole('button', { name: 'Portada actual: Placeholder técnico MotoAtlas' })).toBeDisabled();
      });

      it('mantiene estable el orden de galería al seleccionar una portada existente', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        const getGalleryRecordOrder = () => within(galleryRegion)
          .getAllByRole('article')
          .map((card) => card.getAttribute('aria-label'))
          .filter((label): label is string => typeof label === 'string' && label.startsWith('BMW F 900 GS'));

        expect(getGalleryRecordOrder()).toEqual(['BMW F 900 GS lateral', 'BMW F 900 GS trasera', 'BMW F 900 GS detalle']);

        await user.click(screen.getByRole('button', { name: 'Usar como portada: BMW F 900 GS trasera' }));

        expect(getGalleryRecordOrder()).toEqual(['BMW F 900 GS lateral', 'BMW F 900 GS trasera', 'BMW F 900 GS detalle']);
        expect(screen.getByRole('button', { name: 'Portada actual: BMW F 900 GS trasera' })).toBeDisabled();
      });

      it('abre info al hacer click en Ver detalles de una card', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const infoButton = screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS lateral' });
        await user.click(infoButton);

        expect(screen.getByText('#0')).toBeInTheDocument();
        expect(infoButton).toHaveAttribute('aria-expanded', 'true');
      });

      it('permite tener dos cards con info abierta simultáneamente', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        await user.click(screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS lateral' }));
        await user.click(screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS trasera' }));

        expect(screen.getByText('#0')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      it('seleccionar portada NO reordena las cards de galería existentes', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        const getGalleryRecordOrder = () => within(galleryRegion)
          .getAllByRole('article')
          .map((card) => card.getAttribute('aria-label') ?? '')
          .filter((label) => label.startsWith('BMW F 900 GS'));

        expect(getGalleryRecordOrder()).toEqual([
          'BMW F 900 GS lateral',
          'BMW F 900 GS trasera',
          'BMW F 900 GS detalle',
        ]);

        await user.click(screen.getByRole('button', { name: 'Usar como portada: BMW F 900 GS trasera' }));

        expect(getGalleryRecordOrder()).toEqual([
          'BMW F 900 GS lateral',
          'BMW F 900 GS trasera',
          'BMW F 900 GS detalle',
        ]);
        expect(screen.getByRole('button', { name: 'Portada actual: BMW F 900 GS trasera' })).toBeDisabled();
        expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
      });

      it('seleccionar última imagen como portada no mueve ningún gallery record', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        const getGalleryRecordOrder = () => within(galleryRegion)
          .getAllByRole('article')
          .map((card) => card.getAttribute('aria-label') ?? '')
          .filter((label) => label.startsWith('BMW F 900 GS'));

        expect(getGalleryRecordOrder()).toEqual([
          'BMW F 900 GS lateral',
          'BMW F 900 GS trasera',
          'BMW F 900 GS detalle',
        ]);

        await user.click(screen.getByRole('button', { name: 'Usar como portada: BMW F 900 GS detalle' }));

        expect(getGalleryRecordOrder()).toEqual([
          'BMW F 900 GS lateral',
          'BMW F 900 GS trasera',
          'BMW F 900 GS detalle',
        ]);
        expect(screen.getByRole('button', { name: 'Portada actual: BMW F 900 GS detalle' })).toBeDisabled();
      });

      it('cierra solo la card cuyo info se clickea de nuevo', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        await user.click(screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS lateral' }));
        await user.click(screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS trasera' }));

        const card0CloseButton = screen.getByRole('button', { name: 'Ocultar detalles de BMW F 900 GS lateral' });
        const card1BackButton = screen.getByRole('button', { name: 'Ocultar detalles de BMW F 900 GS trasera' });

        expect(card0CloseButton).toHaveAttribute('aria-expanded', 'true');
        expect(card1BackButton).toHaveAttribute('aria-expanded', 'true');

        await user.click(card0CloseButton);

        expect(screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS lateral' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'Ocultar detalles de BMW F 900 GS trasera' })).toHaveAttribute('aria-expanded', 'true');
      });

      it('no abre info por hover — solo por click en botón explícito', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const card = screen.getByRole('article', { name: 'BMW F 900 GS lateral' });
        await user.hover(card);

        expect(screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS lateral' })).toHaveAttribute('aria-expanded', 'false');
      });

      it('no muta el sortOrder al seleccionar una imagen como portada', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        await user.click(screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS lateral' }));
        expect(screen.getByText('#0')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Ocultar detalles de BMW F 900 GS lateral' }));

        await user.click(screen.getByRole('button', { name: 'Usar como portada: BMW F 900 GS trasera' }));
        await user.click(screen.getByRole('button', { name: 'Ver detalles de BMW F 900 GS trasera' }));

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(galleryFixtures.map((image) => image.sortOrder)).toEqual([0, 1, 2]);
        expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
      });

      it('seleccionar portada NO reordena la librería completa (incluyendo no-gallery)', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        const getFullLibraryUrls = () => within(galleryRegion)
          .getAllByRole('article')
          .map((card) => card.getAttribute('data-library-image-url') ?? '');

        const initialUrls = getFullLibraryUrls();

        await user.click(screen.getByRole('button', { name: 'Usar como portada: BMW F 900 GS trasera' }));

        expect(getFullLibraryUrls()).toEqual(initialUrls);
        expect(screen.getByRole('button', { name: 'Portada actual: BMW F 900 GS trasera' })).toBeDisabled();
      });

      it('seleccionar placeholder como portada no reordena la librería completa', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const galleryRegion = await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
        const getFullLibraryUrls = () => within(galleryRegion)
          .getAllByRole('article')
          .map((card) => card.getAttribute('data-library-image-url') ?? '');

        const initialUrls = getFullLibraryUrls();

        const placeholderButton = screen.getByRole('button', { name: /Usar como portada: Placeholder técnico/ });
        await user.click(placeholderButton);

        expect(getFullLibraryUrls()).toEqual(initialUrls);
        expect(screen.getByRole('button', { name: /Portada actual: Placeholder técnico/ })).toBeDisabled();
      });

      it('no llama a servicios de galería al seleccionar portada desde la librería', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        await user.click(screen.getByRole('button', { name: 'Usar como portada: BMW F 900 GS trasera' }));

        expect(createAdminMotorcycleGalleryImageMock).not.toHaveBeenCalled();
        expect(getAdminMotorcycleGalleryImagesMock).toHaveBeenCalledTimes(1); // solo en apertura
      });

      it('muestra loading state de galería sin romper el modal', async () => {
        getAdminMotorcycleGalleryImagesMock.mockImplementationOnce(() => new Promise(() => undefined));
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        expect(screen.getByRole('status')).toHaveTextContent('Cargando galería de imágenes...');
        expect(screen.getByRole('radio', { name: 'URL manual' })).toBeInTheDocument();
      });

      it('muestra estado vacío cuando no hay imágenes', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([]);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        expect(screen.queryByText('Sin imágenes disponibles')).not.toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'Portada guardada' })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'Placeholder técnico MotoAtlas' })).toBeInTheDocument();
      });

      it('muestra estado de error sin bloquear el modal', async () => {
        getAdminMotorcycleGalleryImagesMock.mockRejectedValueOnce(new Error('Network error'));
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        await screen.findByText('Network error');
        expect(screen.getByRole('radio', { name: 'URL manual' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
      });

      it('introduce delete action para imágenes de galería pero no primary ni reorder', async () => {
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

        await openImageManager(user);

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).queryByRole('button', { name: /Establecer como principal/i })).not.toBeInTheDocument();
        expect(within(dialog).queryByRole('button', { name: /Reordenar/i })).not.toBeInTheDocument();
        expect(within(dialog).getAllByRole('button', { name: /Eliminar imagen de la galería/i }).length).toBe(galleryFixtures.length);
      });

      it('mantiene motorcycles.image_url como portada actual cuando coincide con una imagen de galería', async () => {
        const motorcycleWithGalleryCover = {
          ...bikeCatalog[0],
          id: existingId,
          imageUrl: '/storage/v1/object/public/motorcycle-images/bmw-1.webp',
        };
        getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
        const user = userEvent.setup();
        render(
          <AdminEditMotorcyclePage
            motorcycleId={existingId}
            motorcycles={[motorcycleWithGalleryCover]}
            onMotorcyclesChange={vi.fn()}
          />,
        );

        await openImageManager(user);

        expect(await screen.findByRole('button', { name: 'Portada actual: BMW F 900 GS lateral' })).toBeDisabled();
      });

      it('create mode no llama al servicio de galería', async () => {
        const user = userEvent.setup();
        render(<AdminNewModelPage />);

        await openImageManager(user);

        await screen.findByText('Galería persistente pendiente');
        expect(screen.getByRole('article', { name: 'Placeholder técnico MotoAtlas' })).toBeInTheDocument();
        expect(getAdminMotorcycleGalleryImagesMock).not.toHaveBeenCalled();
      });

      describe('pending delete de imágenes de galería', () => {
        it('muestra acción de eliminar solo para imágenes con registro de galería', async () => {
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          const dialog = await screen.findByRole('dialog');
          const deleteButtons = within(dialog).getAllByRole('button', { name: /Eliminar imagen de la galería/i });
          expect(deleteButtons.length).toBe(galleryFixtures.length);
        });

        it('placeholder y draft/persisted no tienen acción de eliminar', async () => {
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          const placeholder = screen.getByRole('article', { name: 'Placeholder técnico MotoAtlas' });
          expect(within(placeholder).queryByRole('button', { name: /Eliminar imagen de la galería/i })).not.toBeInTheDocument();

          const persisted = screen.getByRole('article', { name: 'Portada guardada' });
          expect(within(persisted).queryByRole('button', { name: /Eliminar imagen de la galería/i })).not.toBeInTheDocument();
        });

        it('abrir confirmación no dispara backend', async () => {
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[0].altText}` });
          await user.click(deleteBtn);

          expect(deleteAdminMotorcycleGalleryImageRecordMock).not.toHaveBeenCalled();
          expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
        });

        it('muestra modal de confirmación al clickear eliminar', async () => {
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[0].altText}` });
          await user.click(deleteBtn);

          expect(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).toBeInTheDocument();
        });

        it('cancelar en confirmación no elimina la imagen', async () => {
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[0].altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByText('Cancelar'));

          expect(screen.queryByRole('dialog', { name: 'Eliminar imagen de galería' })).not.toBeInTheDocument();
          expect(screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[0].altText}` })).toBeInTheDocument();
        });

        it('confirma eliminación y elimina registro de galería y storage', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockResolvedValue(undefined);
          deleteMotorcycleImageMock.mockResolvedValue(undefined);
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);

          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[0].altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          expect(deleteAdminMotorcycleGalleryImageRecordMock).toHaveBeenCalledWith('img-1', expect.any(String));
          expect(deleteMotorcycleImageMock).toHaveBeenCalledWith('bmw-1.webp', expect.any(String));
        });

        it('eliminar portada actual cae a placeholder técnico en el formulario', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockResolvedValue(undefined);
          deleteMotorcycleImageMock.mockResolvedValue(undefined);
          const motorcycle = { ...bikeCatalog[0], id: existingId, imageUrl: galleryFixtures[0].url };
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
          const user = userEvent.setup();
          render(
            <AdminEditMotorcyclePage
              motorcycleId={existingId}
              motorcycles={[motorcycle]}
              onMotorcyclesChange={vi.fn()}
            />,
          );

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[0].altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', technicalPlaceholderImage);
        });

        it('detecta portada por storagePath cuando URL no coincide exactamente', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockResolvedValue(undefined);
          deleteMotorcycleImageMock.mockResolvedValue(undefined);
          const supabaseOrigin = 'https://xxx.supabase.co';
          const storageObjectPath = 'test-bike/bmw-1.webp';
          const currentCoverUrl = `${supabaseOrigin}/storage/v1/object/public/motorcycle-images/${storageObjectPath}`;
          const motorcycle = { ...bikeCatalog[0], id: existingId, imageUrl: currentCoverUrl };
          const fixtureWithDiffUrl = {
            ...galleryFixtures[0], id: 'diff-img',
            url: `${supabaseOrigin}/storage/v1/object/public/motorcycle-images/other.webp`,
            storagePath: storageObjectPath,
            altText: 'BMW F 900 GS distinto',
          };
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([fixtureWithDiffUrl, galleryFixtures[1], galleryFixtures[2]]);
          vi.stubEnv('VITE_SUPABASE_URL', supabaseOrigin);
          const user = userEvent.setup();
          render(
            <AdminEditMotorcyclePage
              motorcycleId={existingId}
              motorcycles={[motorcycle]}
              onMotorcyclesChange={vi.fn()}
            />,
          );

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${fixtureWithDiffUrl.altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', technicalPlaceholderImage);
        });

        it('detecta portada por object path derivado de URL cuando storagePath no está presente', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockResolvedValue(undefined);
          deleteMotorcycleImageMock.mockResolvedValue(undefined);
          const supabaseOrigin = 'https://xxx.supabase.co';
          const storageObjectPath = 'test-bike/bmw-1.webp';
          const currentCoverUrl = `${supabaseOrigin}/storage/v1/object/public/motorcycle-images/${storageObjectPath}`;
          const motorcycle = { ...bikeCatalog[0], id: existingId, imageUrl: currentCoverUrl };
          const fixtureWithQueryParam = {
            ...galleryFixtures[0], id: 'qparam-img',
            url: `${currentCoverUrl}?t=999`,
            storagePath: null,
            altText: 'BMW F 900 GS query',
          };
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([fixtureWithQueryParam, galleryFixtures[1], galleryFixtures[2]]);
          vi.stubEnv('VITE_SUPABASE_URL', supabaseOrigin);
          const user = userEvent.setup();
          render(
            <AdminEditMotorcyclePage
              motorcycleId={existingId}
              motorcycles={[motorcycle]}
              onMotorcyclesChange={vi.fn()}
            />,
          );

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${fixtureWithQueryParam.altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', technicalPlaceholderImage);
        });

        it('no cambia la portada al eliminar una imagen de galería que no es la portada actual', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockResolvedValue(undefined);
          deleteMotorcycleImageMock.mockResolvedValue(undefined);
          const currentCoverUrl = galleryFixtures[0].url;
          const motorcycle = { ...bikeCatalog[0], id: existingId, imageUrl: currentCoverUrl };
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);
          const user = userEvent.setup();
          render(
            <AdminEditMotorcyclePage
              motorcycleId={existingId}
              motorcycles={[motorcycle]}
              onMotorcyclesChange={vi.fn()}
            />,
          );

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[1].altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          expect(screen.getByRole('img', { name: 'Imagen actual del modelo' })).toHaveAttribute('src', currentCoverUrl);
        });

        it('no elimina Storage cuando otro registro comparte storagePath', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockResolvedValue(undefined);
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce([
            { ...galleryFixtures[0] },
            { ...galleryFixtures[1], storagePath: galleryFixtures[0].storagePath },
          ]);

          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[0].altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          expect(deleteAdminMotorcycleGalleryImageRecordMock).toHaveBeenCalledWith('img-1', expect.any(String));
          expect(deleteMotorcycleImageMock).not.toHaveBeenCalled();
        });

        it('eliminar dos registros con mismo storagePath solo llama deleteMotorcycleImage una vez', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockResolvedValue(undefined);
          deleteMotorcycleImageMock.mockResolvedValue(undefined);
          const dedupFixtures: readonly import('../../../services/adminMotorcycleGalleryService').AdminMotorcycleGalleryImage[] = [
            { ...galleryFixtures[0] },
            { ...galleryFixtures[1], id: 'img-dupe', storagePath: galleryFixtures[0].storagePath, url: '/storage/v1/object/public/motorcycle-images/bmw-1-alt.webp' },
          ];
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(dedupFixtures);

          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const firstDelete = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${dedupFixtures[0].altText}` });
          await user.click(firstDelete);
          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          const secondDelete = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${dedupFixtures[1].altText}` });
          await user.click(secondDelete);
          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          expect(deleteAdminMotorcycleGalleryImageRecordMock).toHaveBeenCalledWith('img-1', expect.any(String));
          expect(deleteAdminMotorcycleGalleryImageRecordMock).toHaveBeenCalledWith('img-dupe', expect.any(String));
          expect(deleteMotorcycleImageMock).toHaveBeenCalledTimes(1);
          expect(deleteMotorcycleImageMock).toHaveBeenCalledWith(galleryFixtures[0].storagePath, expect.any(String));
        });

        it('fallo en delete muestra error en la galería', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockRejectedValueOnce(new Error('Delete gallery record failed'));
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);

          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${galleryFixtures[0].altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          await waitFor(() => {
            expect(screen.getByText(/Delete gallery record failed/i)).toBeInTheDocument();
          });
        });

        it('fallo de storage post-eliminación no bloquea la UI', async () => {
          deleteAdminMotorcycleGalleryImageRecordMock.mockResolvedValue(undefined);
          deleteMotorcycleImageMock.mockRejectedValueOnce(new Error('Storage cleanup failed'));
          getAdminMotorcycleGalleryImagesMock.mockResolvedValueOnce(galleryFixtures);

          const user = userEvent.setup();
          render(<AdminEditMotorcyclePage motorcycleId={existingId} {...sharedProps} />);

          await openImageManager(user);

          await screen.findByRole('region', { name: 'Galería de imágenes del modelo' });
          const altText = galleryFixtures[0].altText!;
          const article = screen.getByRole('article', { name: altText });
          expect(article).toBeInTheDocument();

          const deleteBtn = screen.getByRole('button', { name: `Eliminar imagen de la galería: ${altText}` });
          await user.click(deleteBtn);

          await user.click(within(screen.getByRole('dialog', { name: 'Eliminar imagen de galería' })).getByRole('button', { name: 'Eliminar' }));

          await waitFor(() => {
            expect(screen.queryByRole('article', { name: altText })).not.toBeInTheDocument();
          });
          expect(screen.queryByRole('dialog', { name: 'Eliminar imagen de galería' })).not.toBeInTheDocument();
          expect(screen.queryByText(/Storage cleanup failed/i)).not.toBeInTheDocument();
          expect(deleteAdminMotorcycleGalleryImageRecordMock).toHaveBeenCalledWith('img-1', expect.any(String));
          expect(deleteMotorcycleImageMock).toHaveBeenCalled();
        });
      });

      // gallery-order test moved to explicit upload describe block
    });
  });
});
