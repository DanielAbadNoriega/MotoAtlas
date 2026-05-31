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

    expect(screen.getByRole('heading', { name: /Comunidad MotoAtlas/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Podium rankings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explorar comunidades/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Comparar motos/i })).toHaveAttribute('href', '#/comparador');
    expect(screen.queryByText(/TopAppBar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sign In/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/STATUS: ACQUIRING TELEMETRY/i)).not.toBeInTheDocument();
  });

  it('renderiza ranking con rating medio y número de reviews aprobadas', async () => {
    await renderPage();

    const firstRank = await screen.findByRole('article', { name: /Puesto 1: Aprilia Tuareg 660/i });

    expect(within(firstRank).getByText(/10/)).toBeInTheDocument();
    expect(within(firstRank).getByLabelText(/1 reviews aprobadas/i)).toBeInTheDocument();
    expect(within(firstRank).queryByText('star')).not.toBeInTheDocument();
    expect(within(firstRank).getByRole('link', { name: /Ver reviews/i })).toBeInTheDocument();
  });

  it('el botón Explorar comunidades hace scroll al podium sin romper la ruta hash', async () => {
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = '#/comunidad';
    const user = userEvent.setup();

    await renderPage();
    await user.click(screen.getByRole('button', { name: /Explorar comunidades/i }));

    expect(window.location.hash).toBe('#/comunidad');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('solo cuenta reviews approved y no pending/rejected/hidden', async () => {
    await renderPage();

    const firstRank = await screen.findByRole('article', { name: /Puesto 1: Aprilia Tuareg 660/i });

    expect(within(firstRank).getByLabelText(/1 reviews aprobadas/i)).toBeInTheDocument();
    expect(within(firstRank).getByText(/10/)).toBeInTheDocument();
  });

  it('filtra por segmento', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Segmento'), 'naked');

    const podium = screen.getByLabelText('Top 3 motos mejor valoradas');

    expect(await within(podium).findByRole('article', { name: /Yamaha MT-09/i })).toBeInTheDocument();
    expect(within(podium).queryByRole('article', { name: /Aprilia Tuareg 660/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Top Rated/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Aprilia Tuareg 660/i).length).toBeGreaterThan(0);
  });

  it('filtra por carnet A2 compatible', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Carnet'), 'A2');

    const podium = screen.getByLabelText('Top 3 motos mejor valoradas');

    expect(await within(podium).findByRole('article', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(within(podium).queryByRole('article', { name: /Yamaha MT-09/i })).not.toBeInTheDocument();
  });

  it('permite volver a todos los segmentos desde el select sin chips extra', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Segmento'), 'naked');
    let podium = screen.getByLabelText('Top 3 motos mejor valoradas');
    expect(await within(podium).findByRole('article', { name: /Yamaha MT-09/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Filtros activos/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Segmento'), 'all');

    podium = screen.getByLabelText('Top 3 motos mejor valoradas');
    expect(await within(podium).findByRole('article', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(within(podium).getByRole('article', { name: /BMW F 900 GS/i })).toBeInTheDocument();
  });

  it('renderiza empty state solo en el podium si sus filtros no tienen resultados', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Reviews mínimas'), '5');

    expect(await screen.findByRole('heading', { name: /Aún no hay suficientes datos de comunidad/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al buscador/i })).toHaveAttribute('href', '#/buscador');
    expect(screen.getByRole('link', { name: /^Explorar comunidad$/i })).toHaveAttribute('href', '#/comunidad');
    expect(screen.queryByRole('heading', { name: /Top Rated/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Trending/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Reviews recientes/i })).toBeInTheDocument();
  });

  it('renderiza empty state global si no hay reviews aprobadas', async () => {
    mockReviews({});
    await renderPage();

    expect(await screen.findByRole('heading', { name: /Aún no hay suficientes datos de comunidad/i })).toBeInTheDocument();
  });

  it('las cards del podium enlazan a las reviews de la moto', async () => {
    await renderPage();

    const firstRank = await screen.findByRole('article', { name: /Puesto 1: Aprilia Tuareg 660/i });

    expect(within(firstRank).getByRole('link', { name: /Ver reviews/i })).toHaveAttribute('href', '#/comunidad/test-aprilia-tuareg-660');
    expect(within(firstRank).queryByRole('link', { name: /Ver ficha/i })).not.toBeInTheDocument();
    expect(within(firstRank).queryByRole('button', { name: /Comparar/i })).not.toBeInTheDocument();
  });

  it('muestra shield de confianza en todas las cards del podium con tooltip', async () => {
    await renderPage();

    const podium = screen.getByLabelText('Top 3 motos mejor valoradas');

    const firstRank = await within(podium).findByRole('article', { name: /Puesto 1: Aprilia Tuareg 660/i });
    const secondRank = await within(podium).findByRole('article', { name: /Puesto 2: BMW F 900 GS/i });
    const thirdRank = await within(podium).findByRole('article', { name: /Puesto 3: Yamaha MT-09/i });

    const firstShield = within(firstRank).getByLabelText(/Baja confianza/i);
    expect(firstShield).toBeInTheDocument();
    expect(within(firstRank).getByRole('tooltip', { name: 'Baja confianza' })).toBeInTheDocument();

    const secondShield = within(secondRank).getByLabelText(/Baja confianza/i);
    expect(secondShield).toBeInTheDocument();

    const thirdShield = within(thirdRank).getByLabelText(/Media confianza/i);
    expect(thirdShield).toBeInTheDocument();

    expect(within(firstRank).queryByText('star')).not.toBeInTheDocument();
    expect(within(secondRank).queryByText('star')).not.toBeInTheDocument();
    expect(within(thirdRank).queryByText('star')).not.toBeInTheDocument();
  });

  it('renderiza la nueva jerarquía de comunidad sin Top Rated ni geolocalización', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: /Podium rankings/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Trending/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Comunidades activas/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Reviews recientes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver todas las reviews/i })).toHaveAttribute('href', '#/comunidad/reviews');
    expect(screen.queryByRole('heading', { name: /Top Rated/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/near you/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cerca de ti/i)).not.toBeInTheDocument();
  });

  it('renderiza labels internacionales en las cards de Trending', async () => {
    await renderPage();

    expect(screen.getByText('MÁS DISCUTIDO')).toBeInTheDocument();
    expect(screen.getByText('MEJOR VALORADO')).toBeInTheDocument();
    expect(screen.getByText('TENDENCIA A2')).toBeInTheDocument();
    expect(screen.queryByText('Más conversación')).not.toBeInTheDocument();
    expect(screen.queryByText('Mejor señal global')).not.toBeInTheDocument();
    expect(screen.queryByText('A2 en movimiento')).not.toBeInTheDocument();
  });

  it('renderiza el CTA doble final de participación', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: /¿No encuentras tu moto\?/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Solicitar modelo/i })).toHaveAttribute('href', '#/solicitar-modelo');
    expect(screen.getByRole('heading', { name: /Tu experiencia puede ayudar a otro motero/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buscar moto para opinar/i })).toHaveAttribute('href', '#/buscador');
  });

  it('renderiza el CTA Ver rankings completos debajo del podium', async () => {
    await renderPage();

    expect(screen.getByRole('link', { name: /Ver rankings completos/i })).toHaveAttribute('href', '#/comunidad/rankings');
  });

  it('RecentReviews renderiza FeaturedReviewCard con contenido principal y CTAs', async () => {
    const user = userEvent.setup();
    await renderPage();

    const recentSection = screen.getByRole('heading', { name: /Reviews recientes/i }).closest('section');

    expect(recentSection).not.toBeNull();

    const recentScope = within(recentSection as HTMLElement);
    expect(recentScope.getByRole('link', { name: /Ver todas las reviews/i })).toHaveAttribute('href', '#/comunidad/reviews');

    const cards = recentScope.getAllByTestId('featured-review-card');
    expect(cards).toHaveLength(3);

    const firstCard = cards[0] as HTMLElement;
    expect(within(firstCard).getByRole('heading', { level: 3, name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(within(firstCard).getByLabelText(/Rating 4 de 5/i)).toBeInTheDocument();
    expect(within(firstCard).queryByText('star')).not.toBeInTheDocument();
    expect(within(firstCard).getByText('★')).toBeInTheDocument();

    await user.click(within(firstCard).getByRole('button'));

    expect(within(firstCard).getByText(/Fantástica para viajar con equipaje\./i)).toBeInTheDocument();
    expect(within(firstCard).getByRole('link', { name: 'Más reviews' })).toHaveAttribute('href', '#/comunidad/test-bmw-f-900-gs');
    expect(within(firstCard).getByRole('link', { name: 'Ver ficha' })).toHaveAttribute('href', '#/motos/test-bmw-f-900-gs');
  });

  it('RecentReviews no muestra acciones comunitarias ni textos null/undefined', async () => {
    mockReviews({
      [bikeFixtures[0].id]: [
        createApprovedReviewFixture({
          id: 'bmw-null-values',
          motorcycleId: bikeFixtures[0].id,
          pros: ['null' as unknown as string],
          cons: ['undefined' as unknown as string],
        }),
      ],
      [bikeFixtures[1].id]: reviewsById[bikeFixtures[1].id] ?? [],
      [bikeFixtures[2].id]: reviewsById[bikeFixtures[2].id] ?? [],
      [bikeFixtures[3].id]: reviewsById[bikeFixtures[3].id] ?? [],
    });

    const user = userEvent.setup();
    await renderPage();

    const recentSection = screen.getByRole('heading', { name: /Reviews recientes/i }).closest('section');
    expect(recentSection).not.toBeNull();

    const firstCard = within(recentSection as HTMLElement).getAllByTestId('featured-review-card')[0] as HTMLElement;
    await user.click(within(firstCard).getByRole('button'));

    expect(within(firstCard).queryByRole('button', { name: /Útil/i })).not.toBeInTheDocument();
    expect(within(firstCard).queryByRole('button', { name: /No útil/i })).not.toBeInTheDocument();
    expect(within(firstCard).queryByRole('button', { name: /Reportar/i })).not.toBeInTheDocument();
    expect(within(firstCard).queryByRole('button', { name: /Responder/i })).not.toBeInTheDocument();
    expect(within(firstCard).queryByText(/^Pros:/)).not.toBeInTheDocument();
    expect(within(firstCard).queryByText(/^Contras:/)).not.toBeInTheDocument();
    expect(within(firstCard).queryByText(/\bnull\b/i)).not.toBeInTheDocument();
    expect(within(firstCard).queryByText(/\bundefined\b/i)).not.toBeInTheDocument();
  });
});
