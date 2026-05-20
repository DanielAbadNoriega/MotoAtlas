import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReview, getApprovedReviewsByMotorcycleId, type MotorcycleReview } from '../../../services/motorcycleReviewService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import {
  createApprovedReviewFixture,
  createHiddenReviewFixture,
  createRejectedReviewFixture,
  createReviewFixture,
  createReviewFixtures,
} from '../../../test/fixtures/reviews';
import { MotorcycleCommunityPage } from './MotorcycleCommunityPage';

vi.mock('../../../services/motorcycleReviewService', () => ({
  createReview: vi.fn(),
  getApprovedReviewsByMotorcycleId: vi.fn(),
}));

const getApprovedReviewsMock = vi.mocked(getApprovedReviewsByMotorcycleId);
const createReviewMock = vi.mocked(createReview);

const approvedReviews: readonly MotorcycleReview[] = [
  {
    id: 'review-approved-1',
    motorcycleId: bikeFixtures[0].id,
    userName: 'Laura',
    rating: 5,
    ridingStyle: 'viaje',
    ownershipMonths: 14,
    kilometers: 12000,
    comment: 'Fantástica para viajar con equipaje.',
    pros: ['Motor lleno', 'Ergonomía cómoda'],
    cons: ['Precio alto'],
    verified: false,
    status: 'approved',
    createdAt: '2026-05-14T10:00:00.000Z',
    updatedAt: '2026-05-14T10:00:00.000Z',
  },
  {
    id: 'review-approved-2',
    motorcycleId: bikeFixtures[0].id,
    userName: '',
    rating: 4,
    ridingStyle: 'viaje',
    ownershipMonths: 10,
    kilometers: 8000,
    comment: 'Muy equilibrada, aunque alta para ciudad.',
    pros: ['Motor lleno'],
    cons: ['Altura de asiento'],
    verified: false,
    status: 'approved',
    createdAt: '2026-05-10T10:00:00.000Z',
    updatedAt: '2026-05-10T10:00:00.000Z',
  },
  {
    id: 'review-pending',
    motorcycleId: bikeFixtures[0].id,
    userName: 'Pendiente',
    rating: 1,
    ridingStyle: 'diario',
    ownershipMonths: null,
    kilometers: null,
    comment: 'No debería mostrarse todavía.',
    pros: [],
    cons: [],
    verified: false,
    status: 'pending',
    createdAt: '2026-05-09T10:00:00.000Z',
    updatedAt: '2026-05-09T10:00:00.000Z',
  },
];

describe('MotorcycleCommunityPage', () => {
  beforeEach(() => {
    getApprovedReviewsMock.mockReset();
    createReviewMock.mockReset();
    getApprovedReviewsMock.mockResolvedValue(approvedReviews);
    createReviewMock.mockResolvedValue({
      id: 'review-new',
      motorcycleId: bikeFixtures[0].id,
      userName: 'Dani',
      rating: 5,
      ridingStyle: 'viaje',
      ownershipMonths: null,
      kilometers: null,
      comment: 'Muy buena.',
      pros: [],
      cons: [],
      verified: false,
      status: 'pending',
      createdAt: '2026-05-15T10:00:00.000Z',
      updatedAt: '2026-05-15T10:00:00.000Z',
    });
  });

  it('renderiza la comunidad de una moto existente', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(screen.getByRole('heading', { name: /Reviews BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByText('Trail')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(await screen.findByText('Fantástica para viajar con equipaje.')).toBeInTheDocument();
    expect(getApprovedReviewsMock).toHaveBeenCalledWith(bikeFixtures[0].id);
  });

  it('muestra “Moto no encontrada” si el id es inválido', () => {
    render(<MotorcycleCommunityPage motorcycleId="id-invalido" />);

    expect(screen.getByRole('heading', { name: /Moto no encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al buscador/i })).toHaveAttribute('href', '#/buscador');
  });

  it('carga reviews approved y no muestra pending', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Fantástica para viajar con equipaje.')).toBeInTheDocument();
    expect(screen.getByText('Muy equilibrada, aunque alta para ciudad.')).toBeInTheDocument();
    expect(screen.queryByText('No debería mostrarse todavía.')).not.toBeInTheDocument();
    expect(screen.getByText('Usuario MotoAtlas')).toBeInTheDocument();
  });

  it('no muestra reviews rejected ni hidden aunque lleguen por error del servicio', async () => {
    getApprovedReviewsMock.mockResolvedValue([
      createApprovedReviewFixture({ comment: 'Review visible aprobada.' }),
      createRejectedReviewFixture({ comment: 'Review rechazada privada.' }),
      createHiddenReviewFixture({ comment: 'Review oculta privada.' }),
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Review visible aprobada.')).toBeInTheDocument();
    expect(screen.queryByText('Review rechazada privada.')).not.toBeInTheDocument();
    expect(screen.queryByText('Review oculta privada.')).not.toBeInTheDocument();
  });

  it('no rompe con reviews incompletas y usa fallbacks seguros', async () => {
    getApprovedReviewsMock.mockResolvedValue([
      createReviewFixture({
        comment: 'Review con campos parciales.',
        cons: [],
        createdAt: 'fecha-invalida',
        kilometers: null,
        ownershipMonths: null,
        pros: [],
        userName: '',
      }),
    ]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Review con campos parciales.')).toBeInTheDocument();
    expect(screen.getByText('Usuario MotoAtlas')).toBeInTheDocument();
    expect(screen.getByText(/Fecha pendiente/)).toBeInTheDocument();
    expect(screen.getAllByText('N/D').length).toBeGreaterThan(0);
  });

  it('no muestra badge verificado cuando la review no trae verificación real', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    await screen.findByText('Fantástica para viajar con equipaje.');

    expect(screen.queryByText('Review verificada')).not.toBeInTheDocument();
  });

  it('muestra badge verificado solo cuando la review viene marcada como verified', async () => {
    getApprovedReviewsMock.mockResolvedValue([{ ...approvedReviews[0], verified: true }]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByText('Review verificada')).toBeInTheDocument();
  });

  it('calcula rating medio y uso principal más común', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    await screen.findByText('Fantástica para viajar con equipaje.');
    expect(screen.getByText('4.5/5 · 2 reviews')).toBeInTheDocument();
    expect(screen.getAllByText('Viaje').length).toBeGreaterThan(0);
    expect(screen.getByText('10.000 km')).toBeInTheDocument();
    expect(screen.getByText('12 meses')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay reviews aprobadas', async () => {
    getApprovedReviewsMock.mockResolvedValue([]);

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    expect(await screen.findByRole('heading', { name: /Aún no hay reviews aprobadas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sé el primero en escribir una review/i })).toBeInTheDocument();
  });

  it('abre ReviewModal desde “Escribir review”', async () => {
    const user = userEvent.setup();
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    await user.click(screen.getAllByRole('button', { name: /Escribir review/i })[0]);

    expect(screen.getByRole('dialog', { name: /Comparte tu experiencia real/i })).toBeInTheDocument();
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it('mantiene un único botón “Escribir review” en la comunidad', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    await screen.findByText('Fantástica para viajar con equipaje.');

    expect(screen.getAllByRole('button', { name: /^Escribir review$/i })).toHaveLength(1);
  });

  it('renderiza las reviews aprobadas dentro del slider horizontal', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const slider = await screen.findByRole('region', { name: /Verified owner reports/i });

    expect(within(slider).getByText('Fantástica para viajar con equipaje.')).toBeInTheDocument();
    expect(within(slider).getByText('Muy equilibrada, aunque alta para ciudad.')).toBeInTheDocument();
    const previousButton = screen.getByRole('button', { name: /Ver reviews anteriores/i });
    const nextButton = screen.getByRole('button', { name: /Ver reviews siguientes/i });

    expect(within(previousButton).getByText('chevron_left')).toHaveClass('material-symbols-outlined');
    expect(within(nextButton).getByText('chevron_right')).toHaveClass('material-symbols-outlined');
  });

  it('el listado horizontal no crashea con muchas reviews aprobadas', async () => {
    getApprovedReviewsMock.mockResolvedValue(createReviewFixtures(12));

    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const slider = await screen.findByRole('region', { name: /Verified owner reports/i });

    expect(within(slider).getByText('Review aprobada 1')).toBeInTheDocument();
    expect(within(slider).getByText('Review aprobada 12')).toBeInTheDocument();
  });

  it('mantiene navegación hacia ficha y comparador', async () => {
    render(<MotorcycleCommunityPage bike={bikeFixtures[0]} motorcycleId={bikeFixtures[0].id} />);

    const page = screen.getByRole('main');
    expect(within(page).getByRole('link', { name: /Volver a ficha/i })).toHaveAttribute('href', '#/motos/test-bmw-f-900-gs');
    expect(within(page).getByRole('link', { name: /Comparar esta moto/i })).toHaveAttribute(
      'href',
      '#/comparador?bikes=test-bmw-f-900-gs',
    );
    await waitFor(() => expect(getApprovedReviewsMock).toHaveBeenCalled());
  });
});
