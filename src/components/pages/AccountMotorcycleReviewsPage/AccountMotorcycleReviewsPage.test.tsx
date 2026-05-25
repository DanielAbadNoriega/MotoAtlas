import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { createReview, getReviewsByUserId, type MotorcycleReview, type MotorcycleReviewRidingStyle, type MotorcycleReviewStatus } from '../../../services/motorcycleReviewService';
import { getReviewReactionSummary } from '../../../services/reviewReactionService';
import { getRepliesByReviewIds, type ReviewReply } from '../../../services/reviewReplyService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { AccountMotorcycleReviewsPage } from './AccountMotorcycleReviewsPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/motorcycleReviewService', () => ({
  createReview: vi.fn(),
  getReviewsByUserId: vi.fn(),
}));

vi.mock('../../../services/reviewReactionService', () => ({
  getReviewReactionSummary: vi.fn(),
}));

vi.mock('../../../services/reviewReplyService', () => ({
  getRepliesByReviewIds: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const getReviewsByUserIdMock = vi.mocked(getReviewsByUserId);
const createReviewMock = vi.mocked(createReview);
const getReviewReactionSummaryMock = vi.mocked(getReviewReactionSummary);
const getRepliesByReviewIdsMock = vi.mocked(getRepliesByReviewIds);
const signOutMock = vi.fn();
const bike = bikeFixtures[0];

function createPrivateReview(overrides: Partial<MotorcycleReview> = {}): MotorcycleReview {
  const id = overrides.id ?? 'review-1';
  const index = Number(id.replace(/\D/g, '')) || 1;

  return {
    id,
    motorcycleId: overrides.motorcycleId ?? bike.id,
    userId: overrides.userId ?? 'user-1',
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
    ownershipMonths: Object.prototype.hasOwnProperty.call(overrides, 'ownershipMonths') ? (overrides.ownershipMonths ?? null) : 12,
    kilometers: Object.prototype.hasOwnProperty.call(overrides, 'kilometers') ? (overrides.kilometers ?? null) : 8500,
    comment: overrides.comment ?? `Review privada ${index}`,
    pros: overrides.pros ?? ['Motor lleno', 'Confort'],
    cons: overrides.cons ?? ['Precio'],
    verified: overrides.verified ?? false,
    status: overrides.status ?? 'pending',
    source: overrides.source ?? 'user',
    createdAt: overrides.createdAt ?? `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T10:00:00.000Z`,
    updatedAt: overrides.updatedAt ?? `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T10:00:00.000Z`,
  };
}

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

async function renderWithReviews(reviews: readonly MotorcycleReview[]) {
  getReviewsByUserIdMock.mockResolvedValue(reviews);
  render(<AccountMotorcycleReviewsPage bike={bike} motorcycleId={bike.id} />);
  await screen.findByRole('heading', { name: 'Mis reviews de esta moto' });
}

function getFiltersPanel() {
  return screen.getByLabelText('Filtros de reviews');
}

function getRows() {
  return screen.getAllByTestId('account-motorcycle-review-row');
}

describe('AccountMotorcycleReviewsPage', () => {
  beforeEach(() => {
    window.location.hash = '';
    signOutMock.mockReset().mockResolvedValue(undefined);
    createReviewMock.mockReset();
    getReviewsByUserIdMock.mockReset().mockResolvedValue([]);
    getReviewReactionSummaryMock.mockReset();
    getReviewReactionSummaryMock.mockImplementation(async (reviewIds) =>
      reviewIds.map((reviewId) => ({
        helpfulCount: reviewId === 'review-approved' ? 5 : 0,
        hasReactedHelpful: false,
        hasReactedNotHelpful: false,
        reviewId,
      })),
    );
    getRepliesByReviewIdsMock.mockReset().mockResolvedValue([]);
    mockAuth();
  });

  it('mantiene estado privado sin sesión y no consulta reviews', () => {
    mockAuth({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
    });

    render(<AccountMotorcycleReviewsPage bike={bike} motorcycleId={bike.id} />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para ver tus reviews de esta moto/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
    expect(getReviewsByUserIdMock).not.toHaveBeenCalled();
  });

  it('renderiza hero privado, CTAs, sidebar de cuenta y solo reviews propias de esa moto', async () => {
    await renderWithReviews([
      createPrivateReview({ id: 'review-approved', rating: 5, status: 'approved', comment: 'Review propia publicada.', createdAt: '2026-05-14T10:00:00.000Z' }),
      createPrivateReview({ id: 'review-pending', rating: 4, status: 'pending', comment: 'Review propia pendiente.', createdAt: '2026-05-15T10:00:00.000Z' }),
      createPrivateReview({ id: 'review-other-user', userId: 'user-2', status: 'approved', comment: 'Review de otro usuario.' }),
      createPrivateReview({ id: 'review-other-bike', motorcycleId: 'other-bike', status: 'approved', comment: 'Review de otra moto.' }),
    ]);

    expect(screen.getByRole('heading', { name: 'BMW F 900 GS 2024' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mis reviews de esta moto' })).toBeInTheDocument();
    expect(screen.queryByText('Reportes de propietarios')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Resumen de tus reviews de esta moto')).toHaveTextContent('4.5');
    expect(screen.getByText('1 publicada · 1 pendiente')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver ficha' })).toHaveAttribute('href', '#/motos/test-bmw-f-900-gs');
    expect(screen.getByRole('button', { name: 'Escribir review' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver reviews públicas' })).toHaveAttribute('href', '#/comunidad/test-bmw-f-900-gs');

    const sidebar = screen.getByRole('complementary', { name: /Panel privado de reviews/i });
    expect(within(sidebar).getByLabelText('Filtros de reviews')).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'Tu distribución rating' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'Resumen de perfil' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('navigation', { name: 'Navegación de cuenta' })).toBeInTheDocument();
    expect(sidebar.querySelector('.account-page__notice')).toBeInTheDocument();
    expect(getReviewsByUserIdMock).toHaveBeenCalledWith({ accessToken: 'session-token', userId: 'user-1' });

    expect(screen.getByText('Review propia publicada.')).toBeInTheDocument();
    expect(screen.getByText('Review propia pendiente.')).toBeInTheDocument();
    expect(screen.queryByText('Review de otro usuario.')).not.toBeInTheDocument();
    expect(screen.queryByText('Review de otra moto.')).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Útil 5')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Útil 5/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reportar review/i })).not.toBeInTheDocument();
    expect(getReviewReactionSummaryMock).toHaveBeenCalledWith(['review-pending', 'review-approved'], {
      accessToken: 'session-token',
      userId: 'user-1',
    });
  });

  it('muestra estados traducidos y limpia pros/contras nulos o vacíos', async () => {
    getReviewsByUserIdMock.mockResolvedValue([
      {
        ...createPrivateReview({ id: 'review-approved', status: 'approved', comment: 'Tiene pros válidos.' }),
        pros: ['fiabilidad', null, '', 'consumo'] as unknown as readonly string[],
        cons: [null, 'peso', 'null'] as unknown as readonly string[],
      },
      {
        ...createPrivateReview({ id: 'review-pending', status: 'pending', comment: 'Sin pros visibles.' }),
        pros: [null, ''] as unknown as readonly string[],
        cons: null as unknown as readonly string[],
      },
      createPrivateReview({ id: 'review-rejected', status: 'rejected', comment: 'Review rechazada.' }),
      createPrivateReview({ id: 'review-hidden', status: 'hidden' as MotorcycleReviewStatus, comment: 'Review oculta.' }),
    ]);

    render(<AccountMotorcycleReviewsPage bike={bike} motorcycleId={bike.id} />);

    const firstRow = await screen.findByText('Tiene pros válidos.').then((element) => element.closest('[data-testid="account-motorcycle-review-row"]') as HTMLElement);
    const secondRow = screen.getByText('Sin pros visibles.').closest('[data-testid="account-motorcycle-review-row"]') as HTMLElement;

    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Rechazada')).toBeInTheDocument();
    expect(screen.getByText('Oculta')).toBeInTheDocument();
    expect(firstRow).toHaveTextContent('Pros: fiabilidad, consumo');
    expect(firstRow).toHaveTextContent('Contras: peso');
    expect(within(secondRow).queryByText(/Pros:/)).not.toBeInTheDocument();
    expect(within(secondRow).queryByText(/Contras:/)).not.toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument();
    expect(screen.queryByText('approved')).not.toBeInTheDocument();
  });

  it('filtra por rating, ordena y resetea a página 1', async () => {
    const user = userEvent.setup();
    await renderWithReviews([
      createPrivateReview({ id: 'review-1', rating: 3, kilometers: 1000, ownershipMonths: 2, comment: 'Más reciente.', createdAt: '2026-05-20T10:00:00.000Z' }),
      createPrivateReview({ id: 'review-2', rating: 5, kilometers: 2000, ownershipMonths: 6, comment: 'Mejor valorada.', createdAt: '2026-05-10T10:00:00.000Z' }),
      createPrivateReview({ id: 'review-3', rating: 4, kilometers: 45000, ownershipMonths: 8, comment: 'Más kilómetros.', createdAt: '2026-05-09T10:00:00.000Z' }),
      createPrivateReview({ id: 'review-4', rating: 4, kilometers: 3000, ownershipMonths: 84, comment: 'Más tiempo.', createdAt: '2026-05-08T10:00:00.000Z' }),
      ...Array.from({ length: 5 }, (_, index) => createPrivateReview({ id: `extra-${index + 1}`, rating: 4, comment: `Extra ${index + 1}`, createdAt: `2026-05-0${index + 1}T10:00:00.000Z` })),
    ]);

    expect(getRows()).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    await user.click(within(getFiltersPanel()).getByRole('button', { name: '4 estrellas o más' }));
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('Más reciente.')).not.toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: '5 estrellas' }));
    expect(screen.getByText('Mejor valorada.')).toBeInTheDocument();
    expect(screen.queryByText('Más reciente.')).not.toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Todas las valoraciones' }));
    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Orden: Mejor valoradas' }));
    expect(within(getRows()[0]).getByText('Mejor valorada.')).toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Orden: Más kilómetros' }));
    expect(within(getRows()[0]).getByText('Más kilómetros.')).toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Orden: Más tiempo con la moto' }));
    expect(within(getRows()[0]).getByText('Más tiempo.')).toBeInTheDocument();
  });

  it('pagina 5 reviews por página y oculta paginación con una sola página', async () => {
    const user = userEvent.setup();
    await renderWithReviews(Array.from({ length: 7 }, (_, index) => createPrivateReview({
      id: `page-${index + 1}`,
      comment: `Review paginada ${index + 1}`,
      createdAt: `2026-05-${String(28 - index).padStart(2, '0')}T10:00:00.000Z`,
    })));

    expect(getRows()).toHaveLength(5);
    expect(screen.queryByText('Review paginada 6')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Paginación de mis reviews de esta moto/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByText('Review paginada 6')).toBeInTheDocument();

    cleanup();
    mockAuth();
    await renderWithReviews([createPrivateReview({ id: 'single-review', comment: 'Única review privada.' })]);
    expect(screen.queryByRole('navigation', { name: /Paginación de mis reviews de esta moto/i })).not.toBeInTheDocument();
  });

  it('muestra empty state sin reviews de esa moto y empty filtrado con limpiar filtros', async () => {
    const user = userEvent.setup();
    await renderWithReviews([createPrivateReview({ motorcycleId: 'otra-moto', comment: 'Otra moto.' })]);

    expect(screen.getByRole('heading', { name: 'Aún no has valorado esta moto' })).toBeInTheDocument();
    expect(screen.getByText('Cuando escribas una review sobre este modelo, aparecerá aquí.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Escribir review' }).length).toBeGreaterThan(0);

    cleanup();
    mockAuth();
    await renderWithReviews([createPrivateReview({ id: 'review-low', rating: 2, comment: 'Review de dos estrellas.' })]);
    await user.click(within(getFiltersPanel()).getByRole('button', { name: '5 estrellas' }));

    expect(screen.getByRole('heading', { name: 'No hay reviews con esos filtros' })).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar el rating o el orden para revisar tus experiencias.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByText('Review de dos estrellas.')).toBeInTheDocument();
  });

  it('muestra respuestas del usuario bajo su review', async () => {
    getRepliesByReviewIdsMock.mockImplementation(async (reviewIds) =>
      reviewIds.map((reviewId) => ({
        id: `reply-${reviewId}`,
        reviewId,
        userId: 'user-1',
        comment: `Respuesta a ${reviewId}`,
        status: 'pending',
        createdAt: '2026-05-20T10:00:00.000Z',
        updatedAt: '2026-05-20T10:00:00.000Z',
      })) as readonly ReviewReply[],
    );

    await renderWithReviews([createPrivateReview({ id: 'review-1', status: 'approved', comment: 'Review con respuesta.' })]);

    await waitFor(() => {
      expect(screen.getByText('Respuesta a review-1')).toBeInTheDocument();
    });
    const replyItem = screen.getByText('Respuesta a review-1').closest('.account-motorcycle-reviews-page__reply-item') as HTMLElement;
    expect(within(replyItem).getByText('Pendiente')).toBeInTheDocument();
    expect(within(replyItem).getByText(/20 may/)).toBeInTheDocument();
  });

  it('no muestra bloque vacío de respuestas si no hay replies', async () => {
    await renderWithReviews([createPrivateReview({ id: 'review-no-replies', status: 'approved', comment: 'Review sin respuestas.' })]);

    await waitFor(() => {
      expect(screen.getByText('Review sin respuestas.')).toBeInTheDocument();
    });
    expect(screen.queryByText(/^Respuesta a/i)).not.toBeInTheDocument();
  });
});
