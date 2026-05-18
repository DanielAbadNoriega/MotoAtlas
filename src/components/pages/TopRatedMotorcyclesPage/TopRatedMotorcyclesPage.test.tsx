import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getApprovedReviewsByMotorcycleId } from '../../../services/motorcycleReviewService';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import {
  createApprovedReviewFixture,
  createHiddenReviewFixture,
  createPendingReviewFixture,
  createRejectedReviewFixture,
} from '../../../test/fixtures/reviews';
import { TopRatedMotorcyclesPage } from './TopRatedMotorcyclesPage';

vi.mock('../../../services/motorcycleReviewService', () => ({
  getApprovedReviewsByMotorcycleId: vi.fn(),
}));

const getApprovedReviewsMock = vi.mocked(getApprovedReviewsByMotorcycleId);

const reviewsById = {
  [bikeFixtures[0].id]: [
    createApprovedReviewFixture({ id: 'bmw-1', motorcycleId: bikeFixtures[0].id, rating: 4 }),
    createApprovedReviewFixture({ id: 'bmw-2', motorcycleId: bikeFixtures[0].id, rating: 5 }),
  ],
  [bikeFixtures[1].id]: [
    createApprovedReviewFixture({ id: 'aprilia-1', motorcycleId: bikeFixtures[1].id, rating: 5 }),
    createPendingReviewFixture({ id: 'aprilia-pending', motorcycleId: bikeFixtures[1].id, rating: 1 }),
    createRejectedReviewFixture({ id: 'aprilia-rejected', motorcycleId: bikeFixtures[1].id, rating: 1 }),
    createHiddenReviewFixture({ id: 'aprilia-hidden', motorcycleId: bikeFixtures[1].id, rating: 1 }),
  ],
  [bikeFixtures[2].id]: [
    createApprovedReviewFixture({ id: 'yamaha-1', motorcycleId: bikeFixtures[2].id, rating: 4 }),
    createApprovedReviewFixture({ id: 'yamaha-2', motorcycleId: bikeFixtures[2].id, rating: 4 }),
    createApprovedReviewFixture({ id: 'yamaha-3', motorcycleId: bikeFixtures[2].id, rating: 4 }),
  ],
  [bikeFixtures[3].id]: [createApprovedReviewFixture({ id: 'honda-1', motorcycleId: bikeFixtures[3].id, rating: 3 })],
};

function mockReviews(map: Record<string, unknown[]> = reviewsById) {
  getApprovedReviewsMock.mockImplementation(async (motorcycleId: string) => (map[motorcycleId] ?? []) as never);
}

async function renderPage() {
  render(<TopRatedMotorcyclesPage motorcycles={bikeFixtures} />);
  await waitFor(() => expect(getApprovedReviewsMock).toHaveBeenCalledTimes(bikeFixtures.length));
}

describe('TopRatedMotorcyclesPage', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    window.location.hash = '';
    window.localStorage.clear();
    getApprovedReviewsMock.mockReset();
    mockReviews();
  });

  it('renderiza la landing sin header/footer ficticios de Stitch', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: /Motos mejor valoradas/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Podium rankings/i })).toBeInTheDocument();
    expect(screen.queryByText(/TopAppBar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sign In/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/STATUS: ACQUIRING TELEMETRY/i)).not.toBeInTheDocument();
  });

  it('renderiza ranking con rating medio y número de reviews aprobadas', async () => {
    await renderPage();

    const firstRank = await screen.findByRole('article', { name: /Puesto 1: Aprilia Tuareg 660/i });

    expect(within(firstRank).getByLabelText(/Rating medio 5 de 5/i)).toBeInTheDocument();
    expect(within(firstRank).getByLabelText(/1 reviews aprobadas/i)).toBeInTheDocument();
    expect(within(firstRank).getByText('Mejor valorada')).toBeInTheDocument();
  });

  it('solo cuenta reviews approved y no pending/rejected/hidden', async () => {
    await renderPage();

    const firstRank = await screen.findByRole('article', { name: /Puesto 1: Aprilia Tuareg 660/i });

    expect(within(firstRank).getByLabelText(/1 reviews aprobadas/i)).toBeInTheDocument();
    expect(within(firstRank).getByLabelText(/Rating medio 5 de 5/i)).toBeInTheDocument();
  });

  it('filtra por segmento', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Segmento'), 'naked');

    expect(await screen.findByRole('article', { name: /Yamaha MT-09/i })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: /Aprilia Tuareg 660/i })).not.toBeInTheDocument();
  });

  it('filtra por carnet A2 compatible', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Carnet'), 'A2');

    expect(await screen.findByRole('article', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: /Yamaha MT-09/i })).not.toBeInTheDocument();
  });

  it('limpiar filtros restaura resultados', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Segmento'), 'naked');
    expect(await screen.findByRole('article', { name: /Yamaha MT-09/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    expect(await screen.findByRole('article', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /BMW F 900 GS/i })).toBeInTheDocument();
  });

  it('renderiza empty state si no hay resultados', async () => {
    mockReviews({});
    await renderPage();

    expect(await screen.findByRole('heading', { name: /Aún no hay suficientes datos de comunidad/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al buscador/i })).toHaveAttribute('href', '#/buscador');
    expect(screen.getByRole('link', { name: /Explorar comunidad/i })).toHaveAttribute('href', '#/comunidad');
  });

  it('incluye enlaces a ficha, comunidad y CTA de comparar', async () => {
    const user = userEvent.setup();
    await renderPage();

    const firstRank = await screen.findByRole('article', { name: /Puesto 1: Aprilia Tuareg 660/i });

    expect(within(firstRank).getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/test-aprilia-tuareg-660');
    expect(within(firstRank).getByRole('link', { name: /Ver comunidad/i })).toHaveAttribute('href', '#/comunidad/test-aprilia-tuareg-660');

    await user.click(within(firstRank).getByRole('button', { name: /Comparar Aprilia Tuareg 660/i }));

    expect(window.location.hash).toBe('#/comparador?bikes=test-aprilia-tuareg-660');
    expect(window.localStorage.getItem('motoatlas.compareQueue.v1')).toContain('test-aprilia-tuareg-660');
  });

  it('el CTA comparar respeta el máximo de 3 motos en cola', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      'motoatlas.compareQueue.v1',
      JSON.stringify([bikeFixtures[0].id, bikeFixtures[1].id, bikeFixtures[2].id]),
    );

    await renderPage();
    const hondaRank = await screen.findByRole('article', { name: /Honda NT1100/i });
    await user.click(within(hondaRank).getByRole('button', { name: /Comparar Honda NT1100/i }));

    expect(JSON.parse(window.localStorage.getItem('motoatlas.compareQueue.v1') ?? '[]')).toEqual([
      bikeFixtures[0].id,
      bikeFixtures[1].id,
      bikeFixtures[2].id,
    ]);
    expect(window.location.hash).toBe('#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09');
    expect(screen.getByRole('status')).toHaveTextContent(/ya tiene 3 motos/i);
  });
});
