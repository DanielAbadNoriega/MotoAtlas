import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { updateAdminReviewStatus } from '../../../services/adminReviewService';
import {
  getReviewsByMotorcycleId,
  getReviewAspectsByReviewIds,
  type MotorcycleReview,
} from '../../../services/motorcycleReviewService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { AdminMotorcycleReviewsPage } from './AdminMotorcycleReviewsPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/adminReviewService', () => ({
  updateAdminReviewStatus: vi.fn(),
}));

vi.mock('../../../services/motorcycleReviewService', () => ({
  getReviewsByMotorcycleId: vi.fn(),
  getReviewAspectsByReviewIds: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const updateAdminReviewStatusMock = vi.mocked(updateAdminReviewStatus);
const getReviewsByMotorcycleIdMock = vi.mocked(getReviewsByMotorcycleId);
const getReviewAspectsByReviewIdsMock = vi.mocked(getReviewAspectsByReviewIds);

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
    updateAdminReviewStatusMock.mockReset().mockResolvedValue(undefined);
    getReviewsByMotorcycleIdMock.mockReset();
    getReviewAspectsByReviewIdsMock.mockReset().mockResolvedValue([]);
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

  it('data-row-tone alterna even/odd', async () => {
    mockAuth();
    const reviews = [
      createReview({ id: 'r1' }),
      createReview({ id: 'r2' }),
    ];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const rows = screen.getAllByTestId('admin-moto-review-row');
      expect(rows).toHaveLength(2);
      expect(rows[0].getAttribute('data-row-tone')).toBe('even');
      expect(rows[1].getAttribute('data-row-tone')).toBe('odd');
    });
  });

  it('fila muestra riding style, ownership, kilometers, date', async () => {
    mockAuth();
    const reviews = [
      createReview({
        id: 'r1',
        ridingStyle: 'viaje',
        ownershipMonths: 12,
        kilometers: 15000,
        createdAt: '2026-05-21T10:00:00.000Z',
      }),
    ];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const row = screen.getByTestId('admin-moto-review-row');
      expect(row.textContent).toContain('Viaje');
      expect(row.textContent).toContain('12 meses');
      expect(row.textContent).toContain('15.000 km');
    });
  });

  it('admin fila muestra icono verificado junto al nombre', async () => {
    mockAuth();
    const reviews = [createReview({ id: 'r1', verified: true })];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const row = screen.getByTestId('admin-moto-review-row');
      expect(within(row).getByLabelText('Usuario verificado')).toBeTruthy();
    });
  });

  it('admin fila muestra icono no verificado junto al nombre', async () => {
    mockAuth();
    const reviews = [createReview({ id: 'r1', verified: false })];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const row = screen.getByTestId('admin-moto-review-row');
      expect(within(row).getByLabelText('Usuario no verificado')).toBeTruthy();
    });
  });

  it('badge muestra Verificada cuando verified es true', async () => {
    mockAuth();
    const reviews = [createReview({ id: 'r1', verified: true })];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const row = screen.getByTestId('admin-moto-review-row');
      expect(within(row).getByText('Verificada')).toBeTruthy();
      expect(within(row).getByLabelText('Review verificada')).toBeTruthy();
    });
  });

  it('badge muestra No verificada cuando verified es false', async () => {
    mockAuth();
    const reviews = [createReview({ id: 'r1', verified: false })];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const row = screen.getByTestId('admin-moto-review-row');
      expect(within(row).getByText('No verificada')).toBeTruthy();
      expect(within(row).getByLabelText('Review no verificada')).toBeTruthy();
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
    expect(within(firstRow).getByText('No verificada')).toBeTruthy();

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

  it('no renderiza pros/contras vacíos', async () => {
    mockAuth();
    const reviews = [
      createReview({
        id: 'r1',
        pros: [],
        cons: [],
      }),
    ];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    await waitFor(() => {
      const row = screen.getByTestId('admin-moto-review-row');
      expect(within(row).queryByText('Pros:')).toBeNull();
      expect(within(row).queryByText('Contras:')).toBeNull();
    });
  });

  it('filas aparecen plegadas inicialmente', async () => {
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([createReview({ id: 'r1' })]);
    renderPage();

    await waitFor(() => {
      const trigger = screen.getByRole('button', { name: /Expandir/ });
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('trigger expande/colapsa la fila', async () => {
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([createReview({ id: 'r1', comment: 'Review expandible' })]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Review expandible')).toBeTruthy();
    });

    const trigger = screen.getByRole('button', { name: /Expandir/ });
    await userEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('footer de acciones contiene Aprobar, Ocultar, Rechazar', async () => {
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([createReview({ id: 'r1', comment: 'Review con acciones' })]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Review con acciones')).toBeTruthy();
    });

    const trigger = screen.getByRole('button', { name: /Expandir/ });
    await userEvent.click(trigger);

    expect(screen.getByRole('button', { name: /Aprobar/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Ocultar/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Rechazar/i })).toBeTruthy();
    expect(screen.getByText('Gestionar review')).toBeTruthy();
  });

  it('admin puede aprobar review — status cambia y se refleja en UI', async () => {
    const user = userEvent.setup();
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([createReview({ id: 'r1' })]);
    renderPage();

    await screen.findByText('Review de prueba.');
    const row = screen.getByTestId('admin-moto-review-row');
    await user.click(within(row).getByRole('button', { name: /Expandir/ }));

    await user.click(within(row).getByRole('button', { name: /Aprobar/i }));

    expect(updateAdminReviewStatusMock).toHaveBeenCalledWith('r1', 'approved', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => {
      expect(within(row).getByText('Publicada')).toBeTruthy();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Publicada');
  });

  it('admin puede ocultar review — status cambia y se refleja en UI', async () => {
    const user = userEvent.setup();
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([createReview({ id: 'r1' })]);
    renderPage();

    await screen.findByText('Review de prueba.');
    const row = screen.getByTestId('admin-moto-review-row');
    await user.click(within(row).getByRole('button', { name: /Expandir/ }));

    await user.click(within(row).getByRole('button', { name: /Ocultar/i }));

    expect(updateAdminReviewStatusMock).toHaveBeenCalledWith('r1', 'hidden', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => {
      expect(within(row).getByText('Oculta')).toBeTruthy();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Oculta');
  });

  it('admin puede rechazar review — status cambia y se refleja en UI', async () => {
    const user = userEvent.setup();
    mockAuth();
    getReviewsByMotorcycleIdMock.mockResolvedValue([createReview({ id: 'r1' })]);
    renderPage();

    await screen.findByText('Review de prueba.');
    const row = screen.getByTestId('admin-moto-review-row');
    await user.click(within(row).getByRole('button', { name: /Expandir/ }));

    await user.click(within(row).getByRole('button', { name: /Rechazar/i }));

    expect(updateAdminReviewStatusMock).toHaveBeenCalledWith('r1', 'rejected', {
      accessToken: 'admin-token',
      userId: 'admin-1',
    });
    await waitFor(() => {
      expect(within(row).getByText('Rechazada')).toBeTruthy();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Rechazada');
  });

  it('botones redundantes se deshabilitan según estado actual', async () => {
    mockAuth();
    const reviews = [
      createReview({ id: 'r1', status: 'approved' }),
      createReview({ id: 'r2', status: 'hidden' }),
      createReview({ id: 'r3', status: 'rejected' }),
    ];
    getReviewsByMotorcycleIdMock.mockResolvedValue(reviews);
    renderPage();

    const rows = await screen.findAllByTestId('admin-moto-review-row');

    await userEvent.click(within(rows[0]).getByRole('button', { name: /Expandir/ }));
    expect(within(rows[0]).getByRole('button', { name: /Aprobar/i })).toBeDisabled();
    expect(within(rows[0]).getByRole('button', { name: /Ocultar/i })).not.toBeDisabled();
    expect(within(rows[0]).getByRole('button', { name: /Rechazar/i })).not.toBeDisabled();

    await userEvent.click(within(rows[1]).getByRole('button', { name: /Expandir/ }));
    expect(within(rows[1]).getByRole('button', { name: /Ocultar/i })).toBeDisabled();
    expect(within(rows[1]).getByRole('button', { name: /Aprobar/i })).not.toBeDisabled();
    expect(within(rows[1]).getByRole('button', { name: /Rechazar/i })).not.toBeDisabled();

    await userEvent.click(within(rows[2]).getByRole('button', { name: /Expandir/ }));
    expect(within(rows[2]).getByRole('button', { name: /Rechazar/i })).toBeDisabled();
    expect(within(rows[2]).getByRole('button', { name: /Aprobar/i })).not.toBeDisabled();
    expect(within(rows[2]).getByRole('button', { name: /Ocultar/i })).not.toBeDisabled();
  });

  it('fallo al actualizar review muestra mensaje de error', async () => {
    const user = userEvent.setup();
    mockAuth();
    updateAdminReviewStatusMock.mockRejectedValueOnce(new Error('permission denied'));
    getReviewsByMotorcycleIdMock.mockResolvedValue([createReview({ id: 'r1' })]);
    renderPage();

    await screen.findByText('Review de prueba.');
    await user.click(screen.getByRole('button', { name: /Expandir/ }));
    await user.click(screen.getByRole('button', { name: /Aprobar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo actualizar la review.');
    });
  });
});
