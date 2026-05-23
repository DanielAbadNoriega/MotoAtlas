import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import {
  getReviewsByMotorcycleId,
  type MotorcycleReview,
} from '../../../services/motorcycleReviewService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { AdminMotorcycleReviewsPage } from './AdminMotorcycleReviewsPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/motorcycleReviewService', () => ({
  getReviewsByMotorcycleId: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const getReviewsByMotorcycleIdMock = vi.mocked(getReviewsByMotorcycleId);

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

const bike = bikeFixtures[0];

function createReview(overrides: Partial<MotorcycleReview> = {}): MotorcycleReview {
  const id = overrides.id ?? 'review-1';

  return {
    id,
    motorcycleId: overrides.motorcycleId ?? bike.id,
    userId: overrides.userId ?? null,
    motorcycle: overrides.motorcycle ?? {
      id: bike.id,
      brand: bike.brand,
      model: bike.model,
      year: bike.year,
      imageUrl: bike.imageUrl,
      license: bike.license,
      segment: bike.segment,
    },
    userName: overrides.userName ?? 'RiderAlias',
    rating: overrides.rating ?? 4,
    ridingStyle: overrides.ridingStyle ?? 'viaje',
    ownershipMonths: overrides.ownershipMonths ?? null,
    kilometers: overrides.kilometers ?? null,
    comment: overrides.comment ?? 'Review de prueba.',
    pros: overrides.pros ?? ['Bueno'],
    cons: overrides.cons ?? ['Malo'],
    verified: overrides.verified ?? false,
    status: overrides.status ?? 'pending',
    source: overrides.source ?? 'user',
    createdAt: overrides.createdAt ?? '2026-05-21T10:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-21T10:00:00.000Z',
  };
}

function mockAuth(overrides = {}) {
  useAuthMock.mockReturnValue({ ...adminAuth, ...overrides } as never);
}

function renderPage(overrides: { bike?: typeof bike; motorcycleId?: string } = {}) {
  return render(
    <AdminMotorcycleReviewsPage
      bike={overrides.bike ?? bike}
      motorcycleId={overrides.motorcycleId ?? bike.id}
    />,
  );
}

describe('AdminMotorcycleReviewsPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    getReviewsByMotorcycleIdMock.mockReset();
    cleanup();
  });

  it('bloquea acceso si no hay sesión', async () => {
    mockAuth({ isAuthenticated: false });
    renderPage();

    expect(screen.getByText('Inicia sesión para acceder al panel admin')).toBeTruthy();
    expect(screen.queryByTestId('admin-moto-review-row')).toBeNull();
  });

  it('bloquea acceso si el usuario no es admin', async () => {
    mockAuth({ isAdmin: false });
    renderPage();

    expect(screen.getByText('No tienes permisos para acceder a esta zona.')).toBeTruthy();
    expect(screen.queryByTestId('admin-moto-review-row')).toBeNull();
  });

  it('admin ve hero con CTAs Ver ficha y Ver reviews públicas', async () => {
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([]);
    renderPage();

    const heroActions = screen.getByLabelText('Acciones admin');
    const fichaLink = within(heroActions).getByText('Ver ficha');
    expect(fichaLink).toBeTruthy();
    expect(fichaLink.getAttribute('href')).toBe(`#/motos/${bike.id}`);

    const reviewsLink = within(heroActions).getByText('Ver reviews públicas');
    expect(reviewsLink).toBeTruthy();
    expect(reviewsLink.getAttribute('href')).toBe(`#/comunidad/${bike.id}`);
  });

  it('hero muestra publicadas y pendientes', async () => {
    mockAuth();
    const reviews = [
      createReview({ id: 'r1', status: 'approved' }),
      createReview({ id: 'r2', status: 'approved' }),
      createReview({ id: 'r3', status: 'pending' }),
    ];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('2 publicadas · 1 pendiente')).toBeTruthy();
    });
  });

  it('admin ve sidebar con navegación AdminSidebar', async () => {
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([]);
    renderPage();

    const sidebar = screen.getByLabelText('Navegación admin');
    expect(sidebar).toBeTruthy();

    const panelLink = within(sidebar).getByText('Panel admin');
    expect(panelLink).toBeTruthy();
    expect(panelLink.getAttribute('href')).toBe('#/admin');

    const modLink = within(sidebar).getByText('Moderación');
    expect(modLink).toBeTruthy();
    expect(modLink.getAttribute('href')).toBe('#/admin/moderacion');

    const reviewsLink = within(sidebar).getByText('Reviews');
    expect(reviewsLink).toBeTruthy();
    expect(reviewsLink.getAttribute('href')).toBe('#/admin/reviews');
    expect(reviewsLink.getAttribute('aria-current')).toBe('page');
  });

  it('existe título Reviews totales del modelo', async () => {
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([]);
    renderPage();

    expect(screen.getByText('Reviews totales del modelo')).toBeTruthy();
  });

  it('filtros status/orden funcionan', async () => {
    mockAuth();
    const reviews = [
      createReview({ id: 'r1', status: 'pending', comment: 'Pendiente review' }),
      createReview({ id: 'r2', status: 'approved', comment: 'Aprobada review' }),
      createReview({ id: 'r3', status: 'rejected', comment: 'Rechazada review' }),
    ];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByTestId('admin-moto-review-row')).toHaveLength(3);
    });

    const pendingChip = screen.getByRole('button', { name: /Pendientes/i });
    await userEvent.click(pendingChip);
    const applyButton = screen.getByRole('button', { name: /Aplicar filtros/i });
    await userEvent.click(applyButton);

    await waitFor(() => {
      const rows = screen.getAllByTestId('admin-moto-review-row');
      expect(rows).toHaveLength(1);
    });
  });

  it('listado muestra status, source, verified', async () => {
    mockAuth();
    const reviews = [
      createReview({ id: 'r1', status: 'pending', source: 'user', verified: false }),
      createReview({ id: 'r2', status: 'approved', source: 'mock', verified: true }),
    ];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const rows = screen.getAllByTestId('admin-moto-review-row');
      expect(rows).toHaveLength(2);
    });

    const firstRow = screen.getAllByTestId('admin-moto-review-row')[0];
    expect(within(firstRow).getByText('Pendiente')).toBeTruthy();
    expect(within(firstRow).getByText('user')).toBeTruthy();

    const secondRow = screen.getAllByTestId('admin-moto-review-row')[1];
    expect(within(secondRow).getByText('Publicada')).toBeTruthy();
    expect(within(secondRow).getByText('mock')).toBeTruthy();
    expect(within(secondRow).getByText('Verificada')).toBeTruthy();
  });

  it('no admin no accede', async () => {
    mockAuth({ isAdmin: false });
    renderPage();

    expect(screen.getByText('No tienes permisos para acceder a esta zona.')).toBeTruthy();
    expect(screen.queryByTestId('admin-moto-review-row')).toBeNull();
  });

  it('no se renderiza null', async () => {
    mockAuth();
    const reviews = [
      createReview({
        id: 'r1',
        status: 'approved',
        pros: ['Bueno', null as unknown as string, ''],
        cons: ['Malo', 'null' as unknown as string],
      }),
    ];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const row = screen.getByTestId('admin-moto-review-row');
      expect(within(row).getByText(/Bueno/)).toBeTruthy();
      expect(within(row).getByText(/Malo/)).toBeTruthy();
    });
  });
});
