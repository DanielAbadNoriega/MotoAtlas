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
  const motorcycleId = overrides.motorcycleId ?? `moto-${index}`;

  return {
    id,
    motorcycleId,
    userId: overrides.userId ?? 'user-1',
    motorcycle: overrides.motorcycle ?? {
      id: motorcycleId,
      brand: 'BMW',
      model: `F 900 GS ${index}`,
      year: 2024,
      imageUrl: '/images/motorcycles/bmw-f-900-gs-2024.webp',
      license: 'A2',
      segment: 'trail',
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
      license: index % 2 === 0 ? 'A2' : 'A',
      segment: index % 2 === 0 ? 'trail' : 'naked',
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
  await screen.findByRole('heading', { name: 'Mi garaje de reviews' });
}

function getSummaryCards() {
  return screen.getAllByTestId('account-review-summary-card');
}

function getFiltersPanel() {
  return screen.getByLabelText('Filtros de reviews');
}

function getSearchbox() {
  return screen.getByRole('searchbox', { name: /Buscar por marca o modelo/i });
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

  it('muestra título, subtítulo, contadores y filtros en el sidebar antes del notice', async () => {
    await renderWithReviews([
      createReview({ id: 'review-1', status: 'pending' }),
      createReview({ id: 'review-2', status: 'approved' }),
      createReview({ id: 'review-3', status: 'approved', motorcycleId: 'moto-2' }),
    ]);

    expect(screen.getByRole('heading', { name: 'Mi garaje de reviews' })).toBeInTheDocument();
    expect(screen.getByText('Explora las motos sobre las que has compartido opiniones y revisa tus experiencias por modelo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Resumen de reviews')).toHaveTextContent(/Reviews\s*3/);
    expect(screen.getByLabelText('Resumen de reviews')).toHaveTextContent(/Motos\s*2/);
    expect(screen.getByLabelText('Resumen de reviews')).toHaveTextContent(/Publicadas\s*2/);
    expect(screen.getByRole('link', { name: 'Mis reviews' })).toHaveAttribute('aria-current', 'page');

    const sidebar = screen.getByLabelText('Resumen de perfil');
    const filters = within(sidebar).getByLabelText('Filtros de reviews');
    const notice = sidebar.querySelector('.account-page__notice');

    expect(filters).toBeInTheDocument();
    expect(notice).toBeInTheDocument();
    expect(filters.compareDocumentPosition(notice as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(filters.querySelector('.account-reviews-page__filters-header')).toBeInTheDocument();
    expect(filters.querySelector('.account-reviews-page__filters-body')).toBeInTheDocument();
    expect(filters.querySelector('.account-reviews-page__filters-footer')).toBeInTheDocument();
    expect(within(filters).getByRole('button', { name: 'Limpiar filtros de reviews' })).toBeInTheDocument();
    expect(within(filters).getByRole('button', { name: 'Aplicar filtros' })).toBeInTheDocument();
    expect(within(filters).queryAllByRole('combobox')).toHaveLength(0);
    expect(within(filters).getByRole('button', { name: 'Segmento: Trail' })).toBeInTheDocument();
    expect(within(filters).getByRole('button', { name: 'Carnet A2' })).toBeInTheDocument();
    expect(within(filters).getByRole('button', { name: '4 estrellas o más' })).toBeInTheDocument();
    expect(within(filters).getByRole('button', { name: 'Uso principal: Viaje' })).toBeInTheDocument();
    expect(within(filters).getByRole('button', { name: 'Orden: Más recientes' })).toBeInTheDocument();
  });

  it('agrupa reviews por motorcycleId y usa cards de resumen de garaje', async () => {
    await renderWithReviews([
      createReview({
        id: 'review-bmw-new',
        motorcycleId: 'bmw-f-900-gs-2024',
        rating: 5,
        ridingStyle: 'viaje',
        kilometers: 12000,
        comment: 'Comentario individual BMW nuevo',
        pros: ['Motor lleno'],
        status: 'approved',
        createdAt: '2026-05-19T10:00:00.000Z',
        motorcycle: { id: 'bmw-f-900-gs-2024', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', license: 'A2', segment: 'trail' },
      }),
      createReview({
        id: 'review-bmw-old',
        motorcycleId: 'bmw-f-900-gs-2024',
        rating: 3,
        ridingStyle: 'ciudad',
        kilometers: 4000,
        comment: 'Comentario individual BMW viejo',
        cons: ['Precio'],
        createdAt: '2026-05-10T10:00:00.000Z',
        motorcycle: { id: 'bmw-f-900-gs-2024', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', license: 'A2', segment: 'trail' },
      }),
      createReview({
        id: 'review-ducati',
        motorcycleId: 'ducati-monster-2025',
        rating: 5,
        createdAt: '2026-05-18T10:00:00.000Z',
        motorcycle: { id: 'ducati-monster-2025', brand: 'Ducati', model: 'Monster', year: 2025, imageUrl: '/ducati.webp', license: 'A', segment: 'naked' },
      }),
      createReview({ id: 'review-other-user', userId: 'other-user', motorcycleId: 'yamaha-r9-2026' }),
    ]);

    const cards = getSummaryCards();

    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveClass('account-page__review-summary-card');
    expect(within(cards[0]).getByRole('heading', { name: 'BMW F 900 GS 2024' })).toBeInTheDocument();
    expect(within(cards[0]).getByLabelText('Rating medio 4 de 5')).toBeInTheDocument();
    expect(within(cards[0]).getByText('2 reviews tuyas')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Última review: 19 may 2026')).toBeInTheDocument();
    expect(within(cards[0]).getByRole('link', { name: 'Ver mis reviews' })).toHaveAttribute('href', '#/cuenta/reviews');
    expect(within(cards[0]).getByRole('link', { name: 'Ver ficha' })).toHaveAttribute('href', '#/motos/bmw-f-900-gs-2024');
    expect(within(cards[1]).getByRole('heading', { name: 'Ducati Monster 2025' })).toBeInTheDocument();
    expect(screen.queryByText('Yamaha R9 2026')).not.toBeInTheDocument();
    expect(screen.queryByText('Comentario individual BMW nuevo')).not.toBeInTheDocument();
    expect(screen.queryByText('Comentario individual BMW viejo')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Motor lleno')).not.toBeInTheDocument();
    expect(screen.queryByText('- Precio')).not.toBeInTheDocument();
    expect(screen.queryByText('Publicada')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /borrar/i })).not.toBeInTheDocument();
  });

  it('filtra motos agrupadas por búsqueda, segmento, carnet, rating y uso', async () => {
    const user = userEvent.setup();
    await renderWithReviews([
      createReview({
        id: 'review-bmw-1',
        motorcycleId: 'bmw-filter-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'bmw-filter-bike', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', license: 'A2', segment: 'trail' },
      }),
      createReview({
        id: 'review-bmw-2',
        motorcycleId: 'bmw-filter-bike',
        rating: 3,
        ridingStyle: 'viaje',
        motorcycle: { id: 'bmw-filter-bike', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', license: 'A2', segment: 'trail' },
      }),
      createReview({
        id: 'review-ducati',
        motorcycleId: 'ducati-filter-bike',
        rating: 5,
        ridingStyle: 'ciudad',
        motorcycle: { id: 'ducati-filter-bike', brand: 'Ducati', model: 'Monster', year: 2025, imageUrl: '/ducati.webp', license: 'A', segment: 'naked' },
      }),
      createReview({
        id: 'review-yamaha',
        motorcycleId: 'yamaha-filter-bike',
        rating: 2,
        ridingStyle: 'offroad',
        motorcycle: { id: 'yamaha-filter-bike', brand: 'Yamaha', model: 'Ténéré 700', year: 2024, imageUrl: '/yamaha.webp', license: 'A2', segment: 'trail' },
      }),
    ]);

    await user.type(getSearchbox(), 'monster');
    expect(screen.getByText('Ducati Monster 2025')).toBeInTheDocument();
    expect(screen.queryByText('BMW F 900 GS 2024')).not.toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Limpiar filtros de reviews' }));
    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Segmento: Trail' }));
    expect(screen.getByText('BMW F 900 GS 2024')).toBeInTheDocument();
    expect(screen.getByText('Yamaha Ténéré 700 2024')).toBeInTheDocument();
    expect(screen.queryByText('Ducati Monster 2025')).not.toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Carnet A' }));
    expect(screen.getByRole('heading', { name: 'No hay motos con esos filtros' })).toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Limpiar filtros de reviews' }));
    await user.click(within(getFiltersPanel()).getByRole('button', { name: '4 estrellas o más' }));
    expect(screen.getByText('BMW F 900 GS 2024')).toBeInTheDocument();
    expect(screen.getByText('Ducati Monster 2025')).toBeInTheDocument();
    expect(screen.queryByText('Yamaha Ténéré 700 2024')).not.toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Uso principal: Ciudad' }));
    expect(screen.getByText('Ducati Monster 2025')).toBeInTheDocument();
    expect(screen.queryByText('BMW F 900 GS 2024')).not.toBeInTheDocument();
  });

  it('ordena por última review, rating medio, número de reviews y kilómetros', async () => {
    const user = userEvent.setup();
    await renderWithReviews([
      createReview({ id: 'review-bmw-1', motorcycleId: 'bmw', rating: 3, kilometers: 1000, createdAt: '2026-05-01T10:00:00.000Z', motorcycle: { id: 'bmw', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', license: 'A2', segment: 'trail' } }),
      createReview({ id: 'review-bmw-2', motorcycleId: 'bmw', rating: 3, kilometers: 1000, createdAt: '2026-05-02T10:00:00.000Z', motorcycle: { id: 'bmw', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', license: 'A2', segment: 'trail' } }),
      createReview({ id: 'review-ducati', motorcycleId: 'ducati', rating: 5, kilometers: 2000, createdAt: '2026-05-03T10:00:00.000Z', motorcycle: { id: 'ducati', brand: 'Ducati', model: 'Monster', year: 2025, imageUrl: '/ducati.webp', license: 'A', segment: 'naked' } }),
      createReview({ id: 'review-yamaha', motorcycleId: 'yamaha', rating: 2, kilometers: 9000, createdAt: '2026-05-02T12:00:00.000Z', motorcycle: { id: 'yamaha', brand: 'Yamaha', model: 'R9', year: 2026, imageUrl: '/yamaha.webp', license: 'A', segment: 'sport' } }),
    ]);

    expect(within(getSummaryCards()[0]).getByText('Ducati Monster 2025')).toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Orden: Mejor valoradas' }));
    expect(within(getSummaryCards()[0]).getByText('Ducati Monster 2025')).toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Orden: Más reviews' }));
    expect(within(getSummaryCards()[0]).getByText('BMW F 900 GS 2024')).toBeInTheDocument();

    await user.click(within(getFiltersPanel()).getByRole('button', { name: 'Orden: Más kilómetros' }));
    expect(within(getSummaryCards()[0]).getByText('Yamaha R9 2026')).toBeInTheDocument();
  });

  it('pagina 9 motos agrupadas por página y resetea a página 1 al filtrar', async () => {
    const user = userEvent.setup();
    await renderWithReviews(buildReviewSet(20));

    expect(getSummaryCards()).toHaveLength(9);
    expect(screen.getAllByRole('button', { name: /^Página \d+$/ })).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    expect(getSummaryCards()).toHaveLength(9);

    await user.type(getSearchbox(), 'moto');
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
    expect(getSummaryCards().length).toBeLessThanOrEqual(9);
  });

  it('usa AccountReviewsEmptyState si no hay reviews o no hay resultados', async () => {
    const user = userEvent.setup();
    await renderWithReviews([]);

    expect(await screen.findByRole('heading', { name: 'Aún no has valorado ninguna moto' })).toBeInTheDocument();
    expect(screen.getByText('Cuando compartas una experiencia, aparecerá aquí agrupada por modelo.')).toBeInTheDocument();
    expect(screen.getByText('search_off')).toBeInTheDocument();

    cleanup();
    mockAuth();
    await renderWithReviews([createReview({ motorcycle: { id: 'moto-1', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', license: 'A2', segment: 'trail' } })]);
    await user.type(getSearchbox(), 'ducati');

    expect(screen.getByRole('heading', { name: 'No hay motos con esos filtros' })).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar el segmento, el uso o la búsqueda para encontrar tus reviews.')).toBeInTheDocument();
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

    expect(await screen.findByTestId('account-review-summary-card')).toBeInTheDocument();
    expect(getReviewsByUserIdMock).toHaveBeenCalledTimes(2);
  });

  it('no consulta reviews si el usuario autenticado todavía no tiene userId', () => {
    mockAuth({ user: null, profile: null });

    render(<AccountReviewsPage />);

    expect(getReviewsByUserIdMock).not.toHaveBeenCalled();
  });
});
