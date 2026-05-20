import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { getModelRequestsByUserId } from '../../../services/modelRequestService';
import { getReviewsByUserId, type MotorcycleReview } from '../../../services/motorcycleReviewService';
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

function mockAuth(overrides = {}) {
  useAuthMock.mockReturnValue({
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: signOutMock,
    refreshProfile: vi.fn(),
    ...overrides,
  } as never);
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
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(screen.getByRole('heading', { name: 'Rider Zero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Resumen de perfil/i })).toBeInTheDocument();
    expect(screen.getByText('rider@motoatlas.com')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mis reviews/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mis solicitudes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Mis reviews' })).toHaveAttribute('href', '#/cuenta/reviews');
    expect(screen.getByRole('link', { name: /Ver todas mis reviews/i })).toHaveAttribute('href', '#/cuenta/reviews');
    expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute('href', '#/cuenta/solicitudes');
  });

  it('muestra loading al cargar reviews propias', () => {
    getReviewsByUserIdMock.mockReturnValue(new Promise(() => undefined));
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(screen.getByText('Cargando tus reviews...')).toBeInTheDocument();
    expect(getReviewsByUserIdMock).toHaveBeenCalledWith({ accessToken: 'session-token', userId: 'user-1' });
  });

  it('muestra loading al cargar solicitudes propias', () => {
    getModelRequestsByUserIdMock.mockReturnValue(new Promise(() => undefined));
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(screen.getByText('Cargando tus solicitudes...')).toBeInTheDocument();
    expect(getModelRequestsByUserIdMock).toHaveBeenCalledWith({ accessToken: 'session-token', userId: 'user-1' });
  });

  it('muestra empty state si el usuario no tiene reviews', async () => {
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(await screen.findByRole('heading', { name: 'Aún no has enviado reviews' })).toBeInTheDocument();
    expect(screen.getByText(/Cuando compartas tu experiencia con una moto/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explorar motos/i })).toHaveAttribute('href', '#/buscador');
  });

  it('muestra empty state si el usuario no tiene solicitudes', async () => {
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(await screen.findByRole('heading', { name: 'Aún no has solicitado modelos.' })).toBeInTheDocument();
    expect(screen.getByText(/Solicita su ficha técnica/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Solicitar otro modelo/i })).toHaveAttribute('href', '#/solicitar-modelo');
  });

  it('mantiene Mis reviews funcionando con card unificada, status y enlaces', async () => {
    getReviewsByUserIdMock.mockResolvedValue([
      createOwnReview({ status: 'approved' }),
      createOwnReview({ id: 'review-other', userId: 'other-user', motorcycleId: 'yamaha-tenere-700-2024', status: 'rejected' }),
    ]);
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    const card = await screen.findByTestId('account-review-card');

    expect(within(card).getByText('Publicada')).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: /BMW F 900 GS 2024/i })).toBeInTheDocument();
    expect(within(card).getByText(/5\/5 rating/i)).toBeInTheDocument();
    expect(within(card).getByText('Viaje')).toBeInTheDocument();
    expect(within(card).getByText('10 meses')).toBeInTheDocument();
    expect(within(card).getByText('12.000 km')).toBeInTheDocument();
    expect(within(card).getByText(/Muy buena para viajar/i)).toBeInTheDocument();
    expect(within(card).getByText('+ Motor lleno')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/bmw-f-900-gs-2024');
    expect(within(card).getByRole('link', { name: /Ver comunidad/i })).toHaveAttribute('href', '#/comunidad/bmw-f-900-gs-2024');
    expect(screen.getByRole('link', { name: /Ver todas mis reviews/i })).toHaveAttribute('href', '#/cuenta/reviews');
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
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

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
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Revisada')).toBeInTheDocument();
    expect(screen.queryByText('Aprobada')).not.toBeInTheDocument();
    expect(screen.queryByText('Rechazada')).not.toBeInTheDocument();
  });

  it('muestra máximo 3 reviews y usa las más recientes', async () => {
    getReviewsByUserIdMock.mockResolvedValue([
      createOwnReview({ id: 'review-oldest', comment: 'Review más antigua', createdAt: '2026-05-10T10:00:00.000Z', motorcycle: { ...ownReview.motorcycle, id: 'old-bike', model: 'Old Bike' } }),
      createOwnReview({ id: 'review-newest', status: 'pending', createdAt: '2026-05-20T10:00:00.000Z', motorcycle: { ...ownReview.motorcycle, id: 'new-bike', model: 'Newest Bike' } }),
      createOwnReview({ id: 'review-second', status: 'approved', createdAt: '2026-05-19T10:00:00.000Z', motorcycle: { ...ownReview.motorcycle, id: 'second-bike', model: 'Second Bike' } }),
      createOwnReview({ id: 'review-third', status: 'rejected', createdAt: '2026-05-18T10:00:00.000Z', motorcycle: { ...ownReview.motorcycle, id: 'third-bike', model: 'Third Bike' } }),
      createOwnReview({ id: 'review-fourth', status: 'hidden', createdAt: '2026-05-17T10:00:00.000Z', motorcycle: { ...ownReview.motorcycle, id: 'fourth-bike', model: 'Fourth Bike' } }),
    ]);
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getAllByTestId('account-review-card')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: /BMW Newest Bike 2024/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /BMW Second Bike 2024/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /BMW Third Bike 2024/i })).toBeInTheDocument();
    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText('Rechazada')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /BMW Fourth Bike 2024/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /BMW Old Bike 2024/i })).not.toBeInTheDocument();
  });

  it('muestra error si falla la carga de reviews propias', async () => {
    getReviewsByUserIdMock.mockRejectedValue(new Error('RLS rejected'));
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se han podido cargar tus reviews.');
    expect(alert).toHaveTextContent('RLS rejected');
  });

  it('muestra error si falla la carga de solicitudes propias', async () => {
    getModelRequestsByUserIdMock.mockRejectedValue(new Error('RLS rejected'));
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se han podido cargar tus solicitudes.');
    expect(alert).toHaveTextContent('RLS rejected');
  });

  it('no consulta datos de cuenta si el usuario autenticado todavía no tiene userId', () => {
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: null,
      profile: null,
    });

    render(<AccountPage />);

    expect(getModelRequestsByUserIdMock).not.toHaveBeenCalled();
    expect(getReviewsByUserIdMock).not.toHaveBeenCalled();
  });

  it('cierra sesión y vuelve al inicio', async () => {
    mockAuth({
      isAuthenticated: true,
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: null, avatarUrl: null, role: 'user' },
    });
    const user = userEvent.setup();
    render(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/');
  });
});
