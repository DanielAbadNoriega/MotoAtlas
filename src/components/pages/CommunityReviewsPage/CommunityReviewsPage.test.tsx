import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getApprovedCommunityReviews, type MotorcycleReview, type MotorcycleReviewRidingStyle, type MotorcycleReviewStatus } from '../../../services/motorcycleReviewService';
import { CommunityReviewsPage } from './CommunityReviewsPage';

vi.mock('../../../services/motorcycleReviewService', () => ({
  getApprovedCommunityReviews: vi.fn(),
}));

const getApprovedCommunityReviewsMock = vi.mocked(getApprovedCommunityReviews);

function createCommunityReview(overrides: Partial<MotorcycleReview> = {}): MotorcycleReview {
  const id = overrides.id ?? 'community-review-1';
  const index = Number(id.replace(/\D/g, '')) || 1;
  const motorcycleId = overrides.motorcycleId ?? `community-moto-${index}`;

  return {
    id,
    motorcycleId,
    userId: overrides.userId ?? null,
    motorcycle: overrides.motorcycle ?? {
      id: motorcycleId,
      brand: index % 2 === 0 ? 'Aprilia' : 'BMW',
      imageUrl: `/images/motorcycles/${motorcycleId}.webp`,
      license: index % 3 === 0 ? 'A2' : 'A',
      model: index % 2 === 0 ? `Tuareg ${index}` : `F 900 GS ${index}`,
      segment: index % 2 === 0 ? 'trail' : 'naked',
      year: 2024,
    },
    userName: overrides.userName ?? `Rider ${index}`,
    rating: overrides.rating ?? ((index % 5) + 1),
    ridingStyle: overrides.ridingStyle ?? ((['ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario'] as MotorcycleReviewRidingStyle[])[index % 6]),
    ownershipMonths: Object.prototype.hasOwnProperty.call(overrides, 'ownershipMonths') ? (overrides.ownershipMonths ?? null) : 12,
    kilometers: Object.prototype.hasOwnProperty.call(overrides, 'kilometers') ? (overrides.kilometers ?? null) : index * 1000,
    comment: overrides.comment ?? `Review pública aprobada ${index}`,
    pros: overrides.pros ?? ['Motor lleno'],
    cons: overrides.cons ?? ['Calor'],
    verified: overrides.verified ?? false,
    status: overrides.status ?? 'approved',
    source: overrides.source ?? 'user',
    createdAt: overrides.createdAt ?? `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T10:00:00.000Z`,
    updatedAt: overrides.updatedAt ?? `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T10:00:00.000Z`,
  };
}

function buildReviews(count: number) {
  return Array.from({ length: count }, (_, index) => createCommunityReview({ id: `community-review-${index + 1}` }));
}

async function renderPage(reviews: readonly MotorcycleReview[]) {
  getApprovedCommunityReviewsMock.mockResolvedValue(reviews);
  render(<CommunityReviewsPage />);
  await waitFor(() => expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(1));
  await screen.findByRole('heading', { name: /Reviews de la comunidad/i });
}

describe('CommunityReviewsPage', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    window.location.hash = '';
    getApprovedCommunityReviewsMock.mockReset();
  });

  it('renderiza la landing pública y usa filtros responsive', async () => {
    await renderPage([createCommunityReview({ id: 'community-review-1' })]);

    expect(screen.getByRole('heading', { name: /Reviews de la comunidad/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtros de reviews' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /Buscar por marca o modelo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Segmento: Trail' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carnet A2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carnet A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A2 limitable' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uso principal: Viaje' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Orden: Más recientes' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Segmento|Carnet|Rating|Uso principal|Orden/i })).not.toBeInTheDocument();

    expect(within(screen.getByRole('button', { name: 'Segmento: Sport' })).getByText('speed')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: 'Segmento: Touring' })).getByText('explore')).toBeInTheDocument();

    const fiveStarsButton = screen.getByRole('button', { name: '5 estrellas' });
    expect(within(fiveStarsButton).getAllByText('star')).toHaveLength(5);
  });

  it('solo muestra reviews approved y oculta pending/rejected/hidden', async () => {
    await renderPage([
      createCommunityReview({ id: 'approved-1', status: 'approved', comment: 'Approved visible' }),
      createCommunityReview({ id: 'pending-1', status: 'pending' as MotorcycleReviewStatus, comment: 'Pending invisible' }),
      createCommunityReview({ id: 'rejected-1', status: 'rejected', comment: 'Rejected invisible' }),
      createCommunityReview({ id: 'hidden-1', status: 'hidden', comment: 'Hidden invisible' }),
    ]);

    expect(screen.getByText(/Approved visible/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pending invisible/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rejected invisible/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hidden invisible/i)).not.toBeInTheDocument();
  });

  it('ordena por fecha descendente por defecto', async () => {
    await renderPage([
      createCommunityReview({ id: 'old-1', comment: 'Review antigua', createdAt: '2026-05-01T10:00:00.000Z' }),
      createCommunityReview({ id: 'new-1', comment: 'Review reciente', createdAt: '2026-05-20T10:00:00.000Z' }),
    ]);

    expect(within(screen.getAllByTestId('account-review-card')[0]).getByText(/Review reciente/i)).toBeInTheDocument();
  });

  it('filtra por búsqueda, segmento, carnet, rating y uso', async () => {
    const user = userEvent.setup();
    await renderPage([
      createCommunityReview({
        id: 'review-1',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'moto-1', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', segment: 'trail', license: 'A' },
      }),
      createCommunityReview({
        id: 'review-2',
        rating: 3,
        ridingStyle: 'ciudad',
        motorcycle: { id: 'moto-2', brand: 'Yamaha', model: 'MT-07', year: 2024, imageUrl: '/yamaha.webp', segment: 'naked', license: 'A2' },
      }),
    ]);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por marca o modelo' }), 'yamaha');
    expect(screen.getByText('Yamaha MT-07 2024')).toBeInTheDocument();
    expect(screen.queryByText('BMW F 900 GS 2024')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros de reviews' }));
    await user.click(screen.getByRole('button', { name: 'Segmento: Trail' }));
    expect(screen.getByText('BMW F 900 GS 2024')).toBeInTheDocument();
    expect(screen.queryByText('Yamaha MT-07 2024')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Carnet A2' }));
    expect(screen.getByRole('heading', { name: /No hay reviews con estos filtros/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros de reviews' }));
    await user.click(screen.getByRole('button', { name: '3 estrellas o menos' }));
    expect(screen.getByText('Yamaha MT-07 2024')).toBeInTheDocument();
    expect(screen.queryByText('BMW F 900 GS 2024')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Uso principal: Viaje' }));
    expect(screen.getByRole('heading', { name: /No hay reviews con estos filtros/i })).toBeInTheDocument();
  });

  it('filtra por A2 limitable usando el catálogo cuando está disponible', async () => {
    const user = userEvent.setup();
    await renderPage([
      createCommunityReview({
        id: 'review-limitable-1',
        motorcycleId: 'aprilia-tuareg-660-2024',
        comment: 'A2 limitable visible',
        motorcycle: {
          id: 'aprilia-tuareg-660-2024',
          brand: 'Aprilia',
          model: 'Tuareg 660',
          year: 2024,
          imageUrl: '/aprilia.webp',
          segment: 'trail',
          license: 'A2',
        },
      }),
      createCommunityReview({
        id: 'review-a2-1',
        motorcycleId: 'unknown-a2-bike',
        comment: 'A2 directa visible',
        motorcycle: {
          id: 'unknown-a2-bike',
          brand: 'Honda',
          model: 'CB500X',
          year: 2024,
          imageUrl: '/honda.webp',
          segment: 'trail',
          license: 'A2',
        },
      }),
    ]);

    expect(await screen.findByText(/A2 limitable visible/i)).toBeInTheDocument();
    expect(screen.getByText(/A2 directa visible/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'A2 limitable' }));

    expect(await screen.findByText(/A2 limitable visible/i)).toBeInTheDocument();
    expect(screen.queryByText(/A2 directa visible/i)).not.toBeInTheDocument();
  });

  it('ordena por rating y por kilómetros', async () => {
    const user = userEvent.setup();
    await renderPage([
      createCommunityReview({ id: 'review-1', rating: 2, kilometers: 20000, comment: 'Más kilómetros' }),
      createCommunityReview({ id: 'review-2', rating: 5, kilometers: 3000, comment: 'Mejor rating' }),
    ]);

    await user.click(screen.getByRole('button', { name: 'Orden: Mejor valoradas' }));
    expect(within(screen.getAllByTestId('account-review-card')[0]).getByText(/Mejor rating/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Orden: Más kilómetros' }));
    expect(within(screen.getAllByTestId('account-review-card')[0]).getByText(/Más kilómetros/i)).toBeInTheDocument();
  });

  it('la card community muestra alias, estrella, metadatos, pros/contras y no muestra estado', async () => {
    await renderPage([
      createCommunityReview({ id: 'review-1', userName: 'Fromen 01', rating: 5, pros: ['Suspensión'], cons: ['Calor'] }),
    ]);

    const card = screen.getByTestId('account-review-card');

    expect(within(card).getByText('@Fromen_01')).toBeInTheDocument();
    expect(within(card).queryByText('Publicada')).not.toBeInTheDocument();
    expect(within(card).getByLabelText('Rating 5 de 5')).toBeInTheDocument();
    expect(within(card).getByText('speed')).toBeInTheDocument();
    expect(within(card).getByText('schedule')).toBeInTheDocument();
    expect(within(card).getByText('route')).toBeInTheDocument();
    expect(within(card).getByText('calendar_month')).toBeInTheDocument();
    expect(within(card).getByText('+ Suspensión')).toBeInTheDocument();
    expect(within(card).getByText('- Calor')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver ficha/i })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Más reviews/i })).toBeInTheDocument();
  });

  it('pagina 9 reviews por página y navega primera/anterior/siguiente/última con máximo 5 números', async () => {
    const user = userEvent.setup();
    await renderPage(buildReviews(55));

    expect(screen.getAllByTestId('account-review-card')).toHaveLength(9);
    expect(screen.getAllByRole('button', { name: /^Página \d+$/ })).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Primera página' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Última página' }));
    expect(screen.getByRole('button', { name: 'Página 7' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Última página' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(screen.getByRole('button', { name: 'Página 6' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Primera página' }));
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('no muestra paginación con una sola página y resetea a página 1 al cambiar filtros', async () => {
    const user = userEvent.setup();
    await renderPage(buildReviews(9));

    expect(screen.queryByRole('navigation', { name: /Paginación de reviews de comunidad/i })).not.toBeInTheDocument();

    cleanup();
    getApprovedCommunityReviewsMock.mockReset();
    await renderPage(buildReviews(20));
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por marca o modelo' }), 'BMW');
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('muestra empty state y permite limpiar filtros', async () => {
    const user = userEvent.setup();
    await renderPage([createCommunityReview({ motorcycle: { id: 'moto-1', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', segment: 'trail', license: 'A' } })]);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por marca o modelo' }), 'ducati');

    expect(screen.getByRole('heading', { name: 'No hay reviews con estos filtros' })).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar el segmento, el uso principal o la búsqueda para descubrir más opiniones.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByText('BMW F 900 GS 2024')).toBeInTheDocument();
  });

  it('muestra error y permite reintentar', async () => {
    const user = userEvent.setup();
    getApprovedCommunityReviewsMock.mockRejectedValueOnce(new Error('permission denied')).mockResolvedValueOnce([createCommunityReview()]);

    render(<CommunityReviewsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
    await user.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(await screen.findByTestId('account-review-card')).toBeInTheDocument();
    expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(2);
  });
});
