import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { getReviewsByUserId, type MotorcycleReview, type MotorcycleReviewRidingStyle, type MotorcycleReviewStatus } from '../../../services/motorcycleReviewService';
import { AccountReviewsPage } from './AccountReviewsPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/motorcycleReviewService', () => ({
  getReviewsByUserId: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const getReviewsByUserIdMock = vi.mocked(getReviewsByUserId);
const signOutMock = vi.fn();

function createReview(overrides: Partial<MotorcycleReview> = {}): MotorcycleReview {
  const id = overrides.id ?? 'review-1';
  const index = Number(id.replace(/\D/g, '')) || 1;

  return {
    id,
    motorcycleId: overrides.motorcycleId ?? `moto-${index}`,
    userId: overrides.userId ?? 'user-1',
    motorcycle: overrides.motorcycle ?? {
      id: overrides.motorcycleId ?? `moto-${index}`,
      brand: 'BMW',
      model: `F 900 GS ${index}`,
      year: 2024,
      imageUrl: '/images/motorcycles/bmw-f-900-gs-2024.webp',
    },
    userName: overrides.userName ?? 'RiderAlias',
    rating: overrides.rating ?? 4,
    ridingStyle: overrides.ridingStyle ?? 'viaje',
    ownershipMonths: overrides.ownershipMonths ?? 12,
    kilometers: overrides.kilometers ?? 8500,
    comment: overrides.comment ?? 'La entrega de potencia es muy controlable y cómoda para viajes largos.',
    pros: overrides.pros ?? ['Motor lleno', 'Confort'],
    cons: overrides.cons ?? ['Precio'],
    verified: overrides.verified ?? false,
    status: overrides.status ?? 'pending',
    source: overrides.source ?? 'user',
    createdAt: overrides.createdAt ?? `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T10:00:00.000Z`,
    updatedAt: overrides.updatedAt ?? `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T10:00:00.000Z`,
  };
}

function buildReviewSet(count: number) {
  return Array.from({ length: count }, (_, index) => createReview({
    id: `review-${index + 1}`,
    motorcycleId: `moto-${index + 1}`,
    motorcycle: {
      id: `moto-${index + 1}`,
      brand: index % 2 === 0 ? 'BMW' : 'Ducati',
      model: index % 2 === 0 ? `F 900 GS ${index + 1}` : `Monster ${index + 1}`,
      year: 2024 + (index % 3),
      imageUrl: `/images/motorcycles/moto-${index + 1}.webp`,
    },
    rating: (index % 5) + 1,
    ridingStyle: (['viaje', 'ciudad', 'offroad', 'deportivo', 'pasajero', 'diario'] as MotorcycleReviewRidingStyle[])[index % 6],
    kilometers: index * 1000,
    status: (['pending', 'approved', 'rejected', 'hidden'] as MotorcycleReviewStatus[])[index % 4],
    createdAt: `2026-05-${String(Math.min(index + 1, 28)).padStart(2, '0')}T10:00:00.000Z`,
  }));
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
  render(<AccountReviewsPage />);
  await screen.findByRole('heading', { name: 'Todas mis reviews' });
}

describe('AccountReviewsPage', () => {
  beforeEach(() => {
    window.location.hash = '';
    signOutMock.mockReset().mockResolvedValue(undefined);
    getReviewsByUserIdMock.mockReset().mockResolvedValue([]);
    mockAuth();
  });

  it('mantiene estado controlado sin sesión y no consulta reviews', () => {
    mockAuth({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
    });

    render(<AccountReviewsPage />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para ver tus reviews/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
    expect(getReviewsByUserIdMock).not.toHaveBeenCalled();
  });

  it('muestra título, contadores y marca el sidebar activo', async () => {
    await renderWithReviews([
      createReview({ id: 'review-1', status: 'pending' }),
      createReview({ id: 'review-2', status: 'approved' }),
      createReview({ id: 'review-3', status: 'approved' }),
    ]);

    expect(screen.getByText(/Consulta tus opiniones enviadas/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Resumen de reviews')).toHaveTextContent(/Total\s*3/);
    expect(screen.getByLabelText('Resumen de reviews')).toHaveTextContent(/Pendientes\s*1/);
    expect(screen.getByLabelText('Resumen de reviews')).toHaveTextContent(/Publicadas\s*2/);
    expect(screen.getByRole('link', { name: 'Mis reviews' })).toHaveAttribute('aria-current', 'page');
  });

  it('muestra cards con moto, rating, uso, kilómetros, comentario, pros/contras y links', async () => {
    await renderWithReviews([createReview({ id: 'review-1', status: 'approved', rating: 5, ridingStyle: 'viaje', kilometers: 12500 })]);

    const card = screen.getByTestId('account-review-card');

    expect(within(card).getByRole('heading', { name: /BMW F 900 GS 1 2024/i })).toBeInTheDocument();
    expect(within(card).getByText('Publicada')).toBeInTheDocument();
    expect(within(card).getByText(/5\/5 rating/i)).toBeInTheDocument();
    expect(within(card).getByText('Viaje')).toBeInTheDocument();
    expect(within(card).getByText('12.500 km')).toBeInTheDocument();
    expect(within(card).getByText(/La entrega de potencia/i)).toBeInTheDocument();
    expect(within(card).getByText('+ Motor lleno')).toBeInTheDocument();
    expect(within(card).getByText('- Precio')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/moto-1');
    expect(within(card).getByRole('link', { name: /Ver comunidad/i })).toHaveAttribute('href', '#/comunidad/moto-1');
    expect(within(card).getByRole('img')).toHaveAttribute('src', '/images/motorcycles/bmw-f-900-gs-2024.webp');
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /borrar/i })).not.toBeInTheDocument();
  });

  it('filtra por estado, uso y búsqueda de marca/modelo', async () => {
    const user = userEvent.setup();
    await renderWithReviews([
      createReview({ id: 'review-1', status: 'pending', ridingStyle: 'viaje', motorcycle: { id: 'moto-1', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp' } }),
      createReview({ id: 'review-2', status: 'approved', ridingStyle: 'ciudad', motorcycle: { id: 'moto-2', brand: 'Ducati', model: 'Monster', year: 2025, imageUrl: '/ducati.webp' } }),
      createReview({ id: 'review-3', status: 'hidden', ridingStyle: 'offroad', motorcycle: { id: 'moto-3', brand: 'Yamaha', model: 'Ténéré 700', year: 2024, imageUrl: '/yamaha.webp' } }),
    ]);

    await user.selectOptions(screen.getByLabelText('Estado'), 'approved');
    expect(screen.getByText('Ducati Monster 2025')).toBeInTheDocument();
    expect(screen.queryByText('BMW F 900 GS 2024')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Uso'), 'offroad');
    expect(screen.getByRole('heading', { name: /No hay reviews con estos filtros/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'yamaha');
    expect(screen.getByText('Yamaha Ténéré 700 2024')).toBeInTheDocument();
    expect(screen.queryByText('Ducati Monster 2025')).not.toBeInTheDocument();
  });

  it('ordena por rating, fecha y kilómetros', async () => {
    const user = userEvent.setup();
    await renderWithReviews([
      createReview({ id: 'review-1', rating: 2, kilometers: 1000, createdAt: '2026-05-01T10:00:00.000Z', motorcycle: { id: 'moto-1', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp' } }),
      createReview({ id: 'review-2', rating: 5, kilometers: 3000, createdAt: '2026-05-03T10:00:00.000Z', motorcycle: { id: 'moto-2', brand: 'Ducati', model: 'Monster', year: 2025, imageUrl: '/ducati.webp' } }),
      createReview({ id: 'review-3', rating: 1, kilometers: 9000, createdAt: '2026-05-02T10:00:00.000Z', motorcycle: { id: 'moto-3', brand: 'Yamaha', model: 'R9', year: 2026, imageUrl: '/yamaha.webp' } }),
    ]);

    await user.selectOptions(screen.getByLabelText('Orden'), 'rating-desc');
    expect(within(screen.getAllByTestId('account-review-card')[0]).getByText('Ducati Monster 2025')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Orden'), 'rating-asc');
    expect(within(screen.getAllByTestId('account-review-card')[0]).getByText('Yamaha R9 2026')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Orden'), 'oldest');
    expect(within(screen.getAllByTestId('account-review-card')[0]).getByText('BMW F 900 GS 2024')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Orden'), 'kilometers-desc');
    expect(within(screen.getAllByTestId('account-review-card')[0]).getByText('Yamaha R9 2026')).toBeInTheDocument();
  });

  it('pagina 5 reviews por página, limita números visibles y navega primera/anterior/siguiente/última', async () => {
    const user = userEvent.setup();
    await renderWithReviews(buildReviewSet(26));

    expect(screen.getAllByTestId('account-review-card')).toHaveLength(5);
    expect(screen.queryByText('Ducati Monster 21 2026')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Página \d+$/ })).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Primera página' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Última página' }));
    expect(screen.getByRole('button', { name: 'Página 6' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Última página' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(screen.getByRole('button', { name: 'Página 5' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Primera página' }));
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('resetea a página 1 al cambiar filtros', async () => {
    const user = userEvent.setup();
    await renderWithReviews(buildReviewSet(12));

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'BMW');

    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('usa AccountReviewsEmptyState si no hay reviews o no hay resultados', async () => {
    const user = userEvent.setup();
    await renderWithReviews([]);

    expect(await screen.findByRole('heading', { name: 'Aún no has enviado reviews' })).toBeInTheDocument();
    expect(screen.getByText(/Cuando compartas tu experiencia/i)).toBeInTheDocument();
    expect(screen.getByText('search_off')).toBeInTheDocument();

    cleanup();
    mockAuth();
    await renderWithReviews([createReview({ motorcycle: { id: 'moto-1', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp' } })]);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'ducati');

    expect(screen.getByRole('heading', { name: 'No hay reviews con estos filtros' })).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar los filtros para encontrar lo que necesitas.')).toBeInTheDocument();
  });

  it('muestra loading y consulta con token de sesión', () => {
    getReviewsByUserIdMock.mockReturnValue(new Promise(() => undefined));

    render(<AccountReviewsPage />);

    expect(screen.getByLabelText('Cargando reviews')).toBeInTheDocument();
    expect(getReviewsByUserIdMock).toHaveBeenCalledWith({ accessToken: 'session-token', userId: 'user-1' });
  });

  it('muestra error y permite reintentar', async () => {
    const user = userEvent.setup();
    getReviewsByUserIdMock.mockRejectedValueOnce(new Error('RLS rejected')).mockResolvedValueOnce([createReview()]);

    render(<AccountReviewsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('RLS rejected');
    await user.click(screen.getByRole('button', { name: /Reintentar/i }));

    expect(await screen.findByTestId('account-review-card')).toBeInTheDocument();
    expect(getReviewsByUserIdMock).toHaveBeenCalledTimes(2);
  });

  it('no consulta reviews si el usuario autenticado todavía no tiene userId', () => {
    mockAuth({ user: null, profile: null });

    render(<AccountReviewsPage />);

    expect(getReviewsByUserIdMock).not.toHaveBeenCalled();
  });
});
