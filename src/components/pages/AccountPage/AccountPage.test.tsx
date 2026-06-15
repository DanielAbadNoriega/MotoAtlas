import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthContextValue, useAuth } from '../../../features/auth';
import { getModelRequestsByUserId } from '../../../services/modelRequestService';
import { getReviewsByUserId, type MotorcycleReview } from '../../../services/motorcycleReviewService';
import { createAuthState, createAuthUser, createSession, createUserProfile, mockAdminAuthState, mockAuthenticatedAuthState, mockUnauthenticatedAuthState } from '../../../test/fixtures/auth';
import { AccountPage } from './AccountPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/motorcycleReviewService', () => ({
  getReviewsByUserId: vi.fn(),
}));

vi.mock('../../../services/modelRequestService', () => ({
  getModelRequestsByUserId: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const getModelRequestsByUserIdMock = vi.mocked(getModelRequestsByUserId);
const getReviewsByUserIdMock = vi.mocked(getReviewsByUserId);
const signOutMock = vi.fn();
const { signIn: _authenticatedSignIn, signUp: _authenticatedSignUp, signOut: _authenticatedSignOut, refreshProfile: _authenticatedRefreshProfile, ...authenticatedAuthState } = mockAuthenticatedAuthState;
const { signIn: _adminSignIn, signUp: _adminSignUp, signOut: _adminSignOut, refreshProfile: _adminRefreshProfile, ...adminAuthState } = mockAdminAuthState;

const ownReview = {
  id: 'review-1',
  motorcycleId: 'bmw-f-900-gs-2024',
  userId: 'user-1',
  motorcycle: {
    id: 'bmw-f-900-gs-2024',
    brand: 'BMW',
    model: 'F 900 GS',
    year: 2024,
    imageUrl: '/images/motorcycles/bmw-f-900-gs-2024.webp',
  },
  userName: 'RiderAlias',
  rating: 5,
  ridingStyle: 'viaje',
  ownershipMonths: 10,
  kilometers: 12000,
  comment: 'Muy buena para viajar y suficientemente cómoda para diario.',
  pros: ['Motor lleno'],
  cons: [],
  verified: false,
  status: 'pending',
  source: 'user',
  createdAt: '2026-05-14T10:00:00.000Z',
  updatedAt: '2026-05-14T10:00:00.000Z',
} as const;

function createOwnReview(overrides: Partial<MotorcycleReview> = {}): MotorcycleReview {
  return {
    ...ownReview,
    ...overrides,
    motorcycle: overrides.motorcycle ?? ownReview.motorcycle,
  } as MotorcycleReview;
}

const ownModelRequest = {
  id: 'request-1',
  userId: 'user-1',
  userName: null,
  brand: 'Ducati',
  model: 'Monster',
  year: 2026,
  segment: 'naked',
  contactEmail: 'rider@motoatlas.com',
  officialUrl: 'https://ducati.example/monster',
  comment:
    'Mercado: España\n\nMe interesa para comparar contra la competencia A2 y entender si el paquete técnico merece entrar en el catálogo para usuarios que buscan naked ligeras con enfoque de diario y rutas de fin de semana.',
  status: 'pending',
  source: 'user',
  createdAt: '2026-05-15T10:00:00.000Z',
  updatedAt: '2026-05-15T10:00:00.000Z',
} as const;

function mockAuth(overrides: Partial<AuthContextValue> = {}) {
  useAuthMock.mockReturnValue(createAuthState({
    ...mockUnauthenticatedAuthState,
    ...overrides,
    signIn: overrides.signIn ?? vi.fn(),
    signUp: overrides.signUp ?? vi.fn(),
    signOut: overrides.signOut ?? signOutMock,
    refreshProfile: overrides.refreshProfile ?? vi.fn(),
  }) as never);
}

function mockAuthenticatedAccount(overrides: Partial<AuthContextValue> = {}) {
  const authenticatedUser = createAuthUser({ id: 'user-1', email: 'rider@motoatlas.com' });

  mockAuth({
    ...authenticatedAuthState,
    user: authenticatedUser,
    session: createSession({ access_token: 'session-token', user: authenticatedUser }),
    profile: createUserProfile({ id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' }),
    isAdmin: false,
    isAuthenticated: true,
    ...overrides,
  });
}

function mockAdminAccount(overrides: Partial<AuthContextValue> = {}) {
  const adminUser = createAuthUser({
    id: 'admin-1',
    email: 'admin@motoatlas.com',
    user_metadata: { display_name: 'Admin Rider' },
  });

  mockAuth({
    ...adminAuthState,
    user: adminUser,
    session: null,
    profile: createUserProfile({ id: 'admin-1', displayName: 'Admin Rider', avatarUrl: null, role: 'admin' }),
    isAdmin: true,
    isAuthenticated: true,
    ...overrides,
  });
}

describe('AccountPage', () => {
  beforeEach(() => {
    window.location.hash = '';
    signOutMock.mockReset().mockResolvedValue(undefined);
    getModelRequestsByUserIdMock.mockReset().mockResolvedValue([]);
    getReviewsByUserIdMock.mockReset().mockResolvedValue([]);
    mockAuth();
  });

  it('muestra estado controlado si no hay sesión', () => {
    render(<AccountPage />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para ver Mi cuenta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
    expect(getModelRequestsByUserIdMock).not.toHaveBeenCalled();
    expect(getReviewsByUserIdMock).not.toHaveBeenCalled();
  });

  it('muestra email, alias, resumen y secciones principales si hay usuario', () => {
    mockAuthenticatedAccount();

    render(<AccountPage />);

    expect(screen.getByRole('heading', { name: 'Rider Zero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Resumen de perfil/i })).toBeInTheDocument();
    expect(screen.getByText('rider@motoatlas.com')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mis reviews/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mis solicitudes/i })).toBeInTheDocument();
    const accountNav = screen.getByRole('navigation', { name: 'Navegación de cuenta' });
    expect(within(accountNav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Resumen',
      'Mis reviews',
      'Mis solicitudes',
    ]);
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Mis reviews' })).toHaveAttribute('href', '#/cuenta/reviews');
    expect(screen.getByRole('link', { name: /Ver todas mis reviews/i })).toHaveAttribute('href', '#/cuenta/reviews');
    expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute('href', '#/cuenta/solicitudes');
  });

  it('muestra loading al cargar reviews propias', () => {
    getReviewsByUserIdMock.mockReturnValue(new Promise(() => undefined));
    mockAuthenticatedAccount();

    render(<AccountPage />);

    expect(screen.getByText('Cargando tus reviews...')).toBeInTheDocument();
    expect(getReviewsByUserIdMock).toHaveBeenCalledWith({ accessToken: 'session-token', userId: 'user-1' });
  });

  it('muestra loading al cargar solicitudes propias', () => {
    getModelRequestsByUserIdMock.mockReturnValue(new Promise(() => undefined));
    mockAuthenticatedAccount();

    render(<AccountPage />);

    expect(screen.getByText('Cargando tus solicitudes...')).toBeInTheDocument();
    expect(getModelRequestsByUserIdMock).toHaveBeenCalledWith({ accessToken: 'session-token', userId: 'user-1' });
  });

  it('muestra empty state si el usuario no tiene reviews', async () => {
    mockAuthenticatedAccount();

    render(<AccountPage />);

    expect(await screen.findByRole('heading', { name: 'Aún no has enviado reviews' })).toBeInTheDocument();
    expect(screen.getByText(/Cuando compartas tu experiencia con una moto/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explorar motos/i })).toHaveAttribute('href', '#/buscador');
  });

  it('muestra empty state si el usuario no tiene solicitudes', async () => {
    mockAuthenticatedAccount();

    render(<AccountPage />);

    expect(await screen.findByRole('heading', { name: 'Aún no has solicitado modelos.' })).toBeInTheDocument();
    expect(screen.getByText(/Solicita su ficha técnica/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Solicitar otro modelo/i })).toHaveAttribute('href', '#/solicitar-modelo');
  });

  it('muestra Mis reviews agrupadas por moto con resumen y enlaces', async () => {
    getReviewsByUserIdMock.mockResolvedValue([
      createOwnReview({ status: 'approved' }),
      createOwnReview({ id: 'review-other', userId: 'other-user', motorcycleId: 'yamaha-tenere-700-2024', status: 'rejected' }),
    ]);
    mockAuthenticatedAccount();

    render(<AccountPage />);

    const reviewsSection = screen.getByRole('region', { name: /Mis reviews/i });
    const card = await within(reviewsSection).findByTestId('account-review-summary-card');

    expect(within(card).getByRole('heading', { name: /BMW F 900 GS 2024/i })).toBeInTheDocument();
    expect(within(card).getByLabelText('Rating medio 5 de 5')).toBeInTheDocument();
    expect(within(card).getByText('1 review tuya')).toBeInTheDocument();
    expect(within(card).getByText('Última review: 14 may 2026')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver mis reviews/i })).toHaveAttribute('href', '#/cuenta/reviews/bmw-f-900-gs-2024');
    expect(within(card).getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/bmw-f-900-gs-2024');
    expect(screen.getByRole('link', { name: /Ver todas mis reviews/i })).toHaveAttribute('href', '#/cuenta/reviews');
    expect(within(reviewsSection).queryByText('Publicada')).not.toBeInTheDocument();
    expect(within(reviewsSection).queryByText('Viaje')).not.toBeInTheDocument();
    expect(within(reviewsSection).queryByText('10 meses')).not.toBeInTheDocument();
    expect(within(reviewsSection).queryByText('12.000 km')).not.toBeInTheDocument();
    expect(within(reviewsSection).queryByText(/Muy buena para viajar/i)).not.toBeInTheDocument();
    expect(within(reviewsSection).queryByText('+ Motor lleno')).not.toBeInTheDocument();
    expect(within(reviewsSection).queryByRole('link', { name: /Más reviews/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Yamaha Ténéré 700')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /borrar/i })).not.toBeInTheDocument();
  });

  it('muestra máximo 2 solicitudes reales, resumen técnico y skeleton CTA como tercera card', async () => {
    getModelRequestsByUserIdMock.mockResolvedValue([
      { ...ownModelRequest, status: 'reviewed' },
      { ...ownModelRequest, id: 'request-2', brand: 'Honda', model: 'CBR600RR', year: 2024, status: 'approved' },
      { ...ownModelRequest, id: 'request-3', brand: 'Kawasaki', model: 'Z900', year: 2025, status: 'pending' },
      { ...ownModelRequest, id: 'request-other', userId: 'other-user', brand: 'Yamaha', model: 'R9', status: 'approved' },
    ]);
    mockAuthenticatedAccount();

    render(<AccountPage />);

    expect(await screen.findByText('Ducati Monster')).toBeInTheDocument();
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument();
    expect(screen.getByText('Revisada')).toBeInTheDocument();
    expect(screen.getAllByText('Año 2026 · naked').length).toBeGreaterThan(0);
    expect(screen.getAllByText('España').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Página oficial/i })[0]).toHaveAttribute('href', 'https://ducati.example/monster');
    const summarizedComment = screen.getAllByText(/Me interesa para comparar/i)[0];
    expect(summarizedComment).toBeInTheDocument();
    expect(summarizedComment.textContent?.endsWith('...')).toBe(true);
    expect(screen.getAllByTestId('account-request-summary-card')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Ver todas mis solicitudes/i })).toHaveAttribute('href', '#/cuenta/solicitudes');
    expect(screen.getByRole('heading', { name: /Solicitar otro modelo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Solicitar otro modelo/i })).toHaveAttribute('href', '#/solicitar-modelo');
    expect(screen.queryByText('Kawasaki Z900')).not.toBeInTheDocument();
    expect(screen.queryByText('Yamaha R9')).not.toBeInTheDocument();
    expect(screen.queryByText(/Solicitud request/i)).not.toBeInTheDocument();
  });

  it('muestra status traducidos en el resumen compacto de solicitudes', async () => {
    getModelRequestsByUserIdMock.mockResolvedValue([
      { ...ownModelRequest, id: 'request-pending', status: 'pending' },
      { ...ownModelRequest, id: 'request-reviewed', status: 'reviewed' },
      { ...ownModelRequest, id: 'request-approved', status: 'approved' },
      { ...ownModelRequest, id: 'request-rejected', status: 'rejected' },
    ]);
    mockAuthenticatedAccount();

    render(<AccountPage />);

    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Revisada')).toBeInTheDocument();
    expect(screen.queryByText('Aprobada')).not.toBeInTheDocument();
    expect(screen.queryByText('Rechazada')).not.toBeInTheDocument();
  });

  it('muestra máximo 3 motos agrupadas y usa la última review más reciente', async () => {
    getReviewsByUserIdMock.mockResolvedValue([
      createOwnReview({
        id: 'review-kawasaki-newest',
        motorcycleId: 'kawasaki-z900-2024',
        rating: 5,
        comment: 'Comentario individual oculto 1',
        createdAt: '2026-05-20T10:00:00.000Z',
        motorcycle: { id: 'kawasaki-z900-2024', brand: 'Kawasaki', model: 'Z900', year: 2024, imageUrl: '/images/motorcycles/kawasaki-z900-2024.webp' },
      }),
      createOwnReview({
        id: 'review-ducati-second',
        motorcycleId: 'ducati-monster-2026',
        rating: 5,
        createdAt: '2026-05-19T10:00:00.000Z',
        motorcycle: { id: 'ducati-monster-2026', brand: 'Ducati', model: 'Monster', year: 2026, imageUrl: '/images/motorcycles/ducati-monster-2026.webp' },
      }),
      createOwnReview({
        id: 'review-kawasaki-older',
        motorcycleId: 'kawasaki-z900-2024',
        rating: 3,
        comment: 'Comentario individual oculto 2',
        createdAt: '2026-05-18T10:00:00.000Z',
        motorcycle: { id: 'kawasaki-z900-2024', brand: 'Kawasaki', model: 'Z900', year: 2024, imageUrl: '/images/motorcycles/kawasaki-z900-2024.webp' },
      }),
      createOwnReview({
        id: 'review-honda-third',
        motorcycleId: 'honda-transalp-2025',
        rating: 4,
        createdAt: '2026-05-17T10:00:00.000Z',
        motorcycle: { id: 'honda-transalp-2025', brand: 'Honda', model: 'Transalp', year: 2025, imageUrl: '/images/motorcycles/honda-transalp-2025.webp' },
      }),
      createOwnReview({
        id: 'review-bmw-fourth',
        motorcycleId: 'bmw-old-bike-2024',
        rating: 4,
        createdAt: '2026-05-10T10:00:00.000Z',
        motorcycle: { id: 'bmw-old-bike-2024', brand: 'BMW', model: 'Old Bike', year: 2024, imageUrl: '/images/motorcycles/bmw-old-bike-2024.webp' },
      }),
    ]);
    mockAuthenticatedAccount();

    render(<AccountPage />);

    const cards = await screen.findAllByTestId('account-review-summary-card');

    expect(cards).toHaveLength(3);
    expect(within(cards[0]).getByRole('heading', { name: /Kawasaki Z900 2024/i })).toBeInTheDocument();
    expect(within(cards[0]).getByLabelText('Rating medio 4 de 5')).toBeInTheDocument();
    expect(within(cards[0]).getByText('2 reviews tuyas')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Última review: 20 may 2026')).toBeInTheDocument();
    expect(within(cards[1]).getByRole('heading', { name: /Ducati Monster 2026/i })).toBeInTheDocument();
    expect(within(cards[2]).getByRole('heading', { name: /Honda Transalp 2025/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /BMW Old Bike 2024/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Comentario individual oculto 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Comentario individual oculto 2')).not.toBeInTheDocument();
  });

  it('muestra error si falla la carga de reviews propias', async () => {
    getReviewsByUserIdMock.mockRejectedValue(new Error('RLS rejected'));
    mockAuthenticatedAccount();

    render(<AccountPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se han podido cargar tus reviews.');
    expect(alert).toHaveTextContent('RLS rejected');
  });

  it('muestra error si falla la carga de solicitudes propias', async () => {
    getModelRequestsByUserIdMock.mockRejectedValue(new Error('RLS rejected'));
    mockAuthenticatedAccount();

    render(<AccountPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se han podido cargar tus solicitudes.');
    expect(alert).toHaveTextContent('RLS rejected');
  });

  it('no consulta datos de cuenta si el usuario autenticado todavía no tiene userId', () => {
    mockAuthenticatedAccount({
      user: null,
      profile: null,
    });

    render(<AccountPage />);

    expect(getModelRequestsByUserIdMock).not.toHaveBeenCalled();
    expect(getReviewsByUserIdMock).not.toHaveBeenCalled();
  });

  it('muestra Panel admin en el aside si el usuario es admin', () => {
    mockAdminAccount();

    render(<AccountPage />);

    expect(screen.getByText('Mi cuenta')).toBeInTheDocument();
    expect(screen.getByText('Panel Admin')).toBeInTheDocument();
    const adminLink = screen.getByRole('link', { name: 'Panel admin' });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '#/admin');
  });

  it('no muestra Panel admin si el usuario no es admin', () => {
    mockAuthenticatedAccount({ isAdmin: false, session: null });

    render(<AccountPage />);

    expect(screen.queryByRole('link', { name: 'Panel admin' })).not.toBeInTheDocument();
  });

  it('no muestra Panel admin si el usuario no está autenticado', () => {
    mockAuth({
      isAuthenticated: false,
      isAdmin: false,
    });

    render(<AccountPage />);

    expect(screen.queryByRole('link', { name: 'Panel admin' })).not.toBeInTheDocument();
  });

  it('cierra sesión y vuelve al inicio', async () => {
    mockAuthenticatedAccount({
      session: null,
      profile: createUserProfile({ id: 'user-1', displayName: null, avatarUrl: null, role: 'user' }),
    });
    const user = userEvent.setup();
    render(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/');
  });
});
