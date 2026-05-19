import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../features/auth';
import { getReviewsByUserId } from '../../../services/motorcycleReviewService';
import { AccountPage } from './AccountPage';

vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../services/motorcycleReviewService', () => ({
  getReviewsByUserId: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
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
    getReviewsByUserIdMock.mockReset().mockResolvedValue([]);
    mockAuth();
  });

  it('muestra estado controlado si no hay sesión', () => {
    render(<AccountPage />);

    expect(screen.getByRole('heading', { name: /Inicia sesión para ver Mi cuenta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toHaveAttribute('href', '#/login');
    expect(getReviewsByUserIdMock).not.toHaveBeenCalled();
  });

  it('muestra email, alias, resumen y placeholders si hay usuario', () => {
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

    expect(screen.getByRole('status')).toHaveTextContent('Cargando tus reviews...');
    expect(getReviewsByUserIdMock).toHaveBeenCalledWith({ accessToken: 'session-token', userId: 'user-1' });
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

  it('muestra reviews del usuario con status traducido y enlaces', async () => {
    getReviewsByUserIdMock.mockResolvedValue([
      { ...ownReview, status: 'approved' },
      { ...ownReview, id: 'review-other', userId: 'other-user', motorcycleId: 'yamaha-tenere-700-2024', status: 'rejected' },
    ]);
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(await screen.findByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText('BMW F 900 GS')).toBeInTheDocument();
    expect(screen.getByText('RiderAlias')).toBeInTheDocument();
    expect(screen.getByText('Viaje')).toBeInTheDocument();
    expect(screen.getByText(/Muy buena para viajar/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/bmw-f-900-gs-2024');
    expect(screen.getByRole('link', { name: /Ver comunidad/i })).toHaveAttribute('href', '#/comunidad/bmw-f-900-gs-2024');
    expect(screen.queryByText('Yamaha Ténéré 700')).not.toBeInTheDocument();
  });

  it('muestra todos los status traducidos de reviews propias', async () => {
    getReviewsByUserIdMock.mockResolvedValue([
      { ...ownReview, id: 'review-pending', status: 'pending' },
      { ...ownReview, id: 'review-approved', status: 'approved' },
      { ...ownReview, id: 'review-rejected', status: 'rejected' },
      { ...ownReview, id: 'review-hidden', status: 'hidden' },
    ]);
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: { id: 'user-1', email: 'rider@motoatlas.com' },
      profile: { id: 'user-1', displayName: 'Rider Zero', avatarUrl: null, role: 'user' },
    });

    render(<AccountPage />);

    expect(await screen.findByText('Pendiente de revisión')).toBeInTheDocument();
    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText('Rechazada')).toBeInTheDocument();
    expect(screen.getByText('Oculta')).toBeInTheDocument();
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

  it('no consulta reviews si el usuario autenticado todavía no tiene userId', () => {
    mockAuth({
      isAuthenticated: true,
      session: { access_token: 'session-token' },
      user: null,
      profile: null,
    });

    render(<AccountPage />);

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
