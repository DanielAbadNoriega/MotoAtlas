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

function getFeaturedSection() {
  return screen.getByRole('region', { name: 'Reviews destacadas' });
}

function getLatestSection() {
  return screen.getByRole('region', { name: 'Últimos reportes' });
}

function getGarageSection() {
  return screen.getByRole('region', { name: 'Garaje de la comunidad' });
}

function getGarageList() {
  return screen.getByRole('region', { name: 'Modelos con reviews de la comunidad' });
}

function getGarageCards() {
  return within(getGarageList()).getAllByTestId('motorcycle-garage-card');
}

describe('CommunityReviewsPage', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    window.location.hash = '';
    getApprovedCommunityReviewsMock.mockReset();
    vi.useRealTimers();
  });

  it('renderiza la landing pública y usa filtros responsive', async () => {
    await renderPage([createCommunityReview({ id: 'community-review-1' })]);

    expect(screen.getByRole('heading', { name: /Reviews de la comunidad/i })).toBeInTheDocument();
    expect(screen.getByText('Opiniones reales de propietarios: kilómetros, uso, pros, contras y experiencias para elegir mejor tu próxima moto.')).toBeInTheDocument();
    expect(screen.getByTestId('community-reviews-hero-image').getAttribute('src')).toContain('hero-community.png');
    expect(screen.getByRole('button', { name: 'Explorar reviews' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buscar moto para opinar' })).toHaveAttribute('href', '#community-reviews-garage-header');
    expect(screen.getByRole('region', { name: 'Bloque editorial de reviews' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reviews destacadas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Últimos reportes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Insights en vivo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Garaje de la comunidad' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Garaje de la comunidad' }).closest('header')).toHaveAttribute('id', 'community-reviews-garage-header');
    expect(screen.queryByRole('heading', { name: 'Explorar todas las reviews' })).not.toBeInTheDocument();
    expect(screen.getByText('Explora los modelos con opiniones reales de propietarios y entra en cada comunidad para leer todas sus reviews.')).toBeInTheDocument();
    expect(getGarageSection()).toBeInTheDocument();
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

  it('agrupa reviews por moto y muestra métricas calculadas en el garaje', async () => {
    await renderPage([
      createCommunityReview({
        id: 'garage-1',
        motorcycleId: 'kawasaki-z900-2024',
        rating: 4,
        ridingStyle: 'deportivo',
        kilometers: 50000,
        createdAt: '2026-05-10T10:00:00.000Z',
        motorcycle: { id: 'kawasaki-z900-2024', brand: 'Kawasaki', model: 'Z900', year: 2024, imageUrl: '/z900.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'garage-2',
        motorcycleId: 'kawasaki-z900-2024',
        rating: 5,
        ridingStyle: 'deportivo',
        kilometers: 70000,
        createdAt: '2026-05-19T10:00:00.000Z',
        motorcycle: { id: 'kawasaki-z900-2024', brand: 'Kawasaki', model: 'Z900', year: 2024, imageUrl: '/z900.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'garage-3',
        motorcycleId: 'yamaha-mt07-2024',
        rating: 3,
        ridingStyle: 'ciudad',
        kilometers: 10000,
        motorcycle: { id: 'yamaha-mt07-2024', brand: 'Yamaha', model: 'MT-07', year: 2024, imageUrl: '/mt07.webp', segment: 'naked', license: 'A2' },
      }),
    ]);

    const garageCards = getGarageCards();
    const kawasakiCard = within(getGarageList()).getByRole('article', { name: /Kawasaki Z900 2024: 2 reviews/i });

    expect(garageCards).toHaveLength(2);
    expect(within(kawasakiCard).getByText('Kawasaki Z900 2024')).toBeInTheDocument();
    expect(within(kawasakiCard).getByLabelText('Rating medio 4.5 de 5')).toBeInTheDocument();
    expect(within(kawasakiCard).getByText('2 reviews')).toBeInTheDocument();
    expect(within(kawasakiCard).getByText('Deportivo')).toBeInTheDocument();
    expect(within(kawasakiCard).queryByText('120.000 km')).not.toBeInTheDocument();
    expect(within(kawasakiCard).getByText('19/05/26')).toBeInTheDocument();
    expect(within(kawasakiCard).getByRole('link', { name: /Reviews/i })).toHaveAttribute('href', '#/comunidad/kawasaki-z900-2024');
    expect(within(kawasakiCard).getByRole('link', { name: /Ficha técnica/i })).toHaveAttribute('href', '#/motos/kawasaki-z900-2024');
  });

  it('la card del garaje muestra shield con tooltip según confidence', async () => {
    await renderPage([
      createCommunityReview({
        id: 'shield-high-1',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-2',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-3',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-4',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-5',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-6',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-7',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-8',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-9',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'shield-high-10',
        motorcycleId: 'high-conf-bike',
        rating: 5,
        ridingStyle: 'viaje',
        motorcycle: { id: 'high-conf-bike', brand: 'Ducati', model: 'High Conf', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
    ]);

    const card = getGarageCards()[0];
    const shield = within(card).getByRole('img', { name: 'Alta confianza' });
    expect(shield).toBeInTheDocument();
    expect(within(card).getByRole('tooltip')).toHaveTextContent('Alta confianza');
  });

  it('no muestra shield tooltip en cards sin usage label', async () => {
    await renderPage([
      createCommunityReview({
        id: 'no-usage-bike',
        motorcycleId: 'no-usage-bike',
        rating: 3,
        ridingStyle: 'ciudad',
        motorcycle: { id: 'no-usage-bike', brand: 'Honda', model: 'No Usage', year: 2024, imageUrl: '/honda.webp', segment: 'naked', license: 'A' },
      }),
    ]);

    const card = getGarageCards()[0];
    expect(within(card).queryByText('Uso más repetido')).not.toBeInTheDocument();
    expect(within(card).getByText('Ciudad')).toBeInTheDocument();
  });

  it('renderiza máximo 2 destacadas por kilómetros, rating, comentario y fecha', async () => {
    await renderPage([
      createCommunityReview({ id: 'featured-1', kilometers: 4000, rating: 5, comment: 'Kilómetros medios' }),
      createCommunityReview({ id: 'featured-2', kilometers: 9000, rating: 3, comment: 'Más kilómetros visible' }),
      createCommunityReview({ id: 'featured-3', kilometers: null, rating: 5, comment: 'Sin kilómetros pero buen rating' }),
      createCommunityReview({ id: 'featured-4', kilometers: 7000, rating: 4, comment: 'Tercera por kilómetros' }),
      createCommunityReview({ id: 'featured-5', kilometers: 8000, rating: 4, comment: 'Segunda por kilómetros' }),
    ]);

    const featuredSection = getFeaturedSection();
    const featuredCards = within(featuredSection).getAllByTestId('account-review-card');

    expect(featuredCards).toHaveLength(2);
    expect(featuredCards[0]).toHaveTextContent('Más kilómetros visible');
    expect(featuredCards[1]).toHaveTextContent('Segunda por kilómetros');
    expect(within(featuredSection).queryByText('Tercera por kilómetros')).not.toBeInTheDocument();
    expect(within(featuredCards[0]).getByRole('link', { name: /Ver ficha/i })).toBeInTheDocument();
    expect(within(featuredCards[0]).getByRole('link', { name: /Más reviews/i })).toBeInTheDocument();
  });

  it('renderiza máximo 2 últimos reportes ordenados por fecha descendente', async () => {
    await renderPage([
      createCommunityReview({ id: 'latest-1', comment: 'Reporte antiguo', createdAt: '2026-05-01T10:00:00.000Z' }),
      createCommunityReview({ id: 'latest-2', comment: 'Reporte intermedio', createdAt: '2026-05-10T10:00:00.000Z' }),
      createCommunityReview({ id: 'latest-3', comment: 'Reporte más reciente', createdAt: '2026-05-20T10:00:00.000Z' }),
      createCommunityReview({ id: 'latest-4', comment: 'Reporte cuarto', createdAt: '2026-05-15T10:00:00.000Z' }),
    ]);

    const latestCards = within(getLatestSection()).getAllByTestId('account-review-card');

    expect(latestCards).toHaveLength(2);
    expect(latestCards[0]).toHaveTextContent('Reporte más reciente');
    expect(latestCards[1]).toHaveTextContent('Reporte cuarto');
    expect(within(getLatestSection()).queryByText('Reporte intermedio')).not.toBeInTheDocument();
    expect(within(latestCards[0]).getByRole('link', { name: /Ver ficha/i })).toBeInTheDocument();
    expect(within(latestCards[0]).getByRole('link', { name: /Más reviews/i })).toBeInTheDocument();
  });

  it('calcula insights reales sin datos inventados', async () => {
    await renderPage([
      createCommunityReview({
        id: 'insight-1',
        motorcycleId: 'bmw-f900',
        rating: 4,
        ridingStyle: 'viaje',
        kilometers: 12000,
        motorcycle: { id: 'bmw-f900', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', segment: 'trail', license: 'A' },
      }),
      createCommunityReview({
        id: 'insight-2',
        motorcycleId: 'bmw-f900',
        rating: 5,
        ridingStyle: 'viaje',
        kilometers: 18000,
        motorcycle: { id: 'bmw-f900', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', segment: 'trail', license: 'A' },
      }),
      createCommunityReview({
        id: 'insight-3',
        motorcycleId: 'yamaha-mt07',
        rating: 3,
        ridingStyle: 'ciudad',
        kilometers: 30000,
        motorcycle: { id: 'yamaha-mt07', brand: 'Yamaha', model: 'MT-07', year: 2024, imageUrl: '/yamaha.webp', segment: 'naked', license: 'A2' },
      }),
      createCommunityReview({
        id: 'insight-4',
        motorcycleId: 'ducati-monster',
        rating: 5,
        ridingStyle: 'viaje',
        kilometers: null,
        motorcycle: { id: 'ducati-monster', brand: 'Ducati', model: 'Monster', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
    ]);

    const insights = screen.getByRole('complementary', { name: 'Insights en vivo' });
    const insightIcons = insights.querySelectorAll('.material-symbols-outlined[aria-hidden="true"]');

    expect(within(insights).getByText('Modelo con más reviews')).toBeInTheDocument();
    expect(within(insights).getByText('BMW F 900 GS 2024')).toBeInTheDocument();
    expect(within(insights).getByText('2 reviews')).toBeInTheDocument();
    expect(within(insights).getByText('Uso más repetido')).toBeInTheDocument();
    expect(within(insights).getByText('Viaje')).toBeInTheDocument();
    expect(within(insights).getByText('3 reportes')).toBeInTheDocument();
    expect(within(insights).getByText('Review con más kilómetros')).toBeInTheDocument();
    expect(within(insights).getByText('Yamaha MT-07 2024')).toBeInTheDocument();
    expect(within(insights).getByText('30.000 km')).toBeInTheDocument();
    expect(within(insights).getByText('Rating medio global')).toBeInTheDocument();
    expect(within(insights).getByText('4.3/5')).toBeInTheDocument();
    expect([...insightIcons].map((icon) => icon.textContent)).toEqual(['monitoring', 'forum', 'route', 'speed', 'star']);
    expect(insights).not.toHaveTextContent(/neumáticos|fallos/i);
  });

  it('los filtros solo afectan al listado general, no a destacadas ni últimos reportes', async () => {
    const user = userEvent.setup();
    await renderPage([
      createCommunityReview({
        id: 'filter-editorial-1',
        comment: 'BMW editorial permanece',
        motorcycle: { id: 'moto-1', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', segment: 'trail', license: 'A' },
      }),
      createCommunityReview({
        id: 'filter-editorial-2',
        comment: 'Yamaha listado filtrado',
        motorcycle: { id: 'moto-2', brand: 'Yamaha', model: 'MT-07', year: 2024, imageUrl: '/yamaha.webp', segment: 'naked', license: 'A2' },
      }),
    ]);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por marca o modelo' }), 'yamaha');

    expect(within(getFeaturedSection()).getByText(/BMW editorial permanece/i)).toBeInTheDocument();
    expect(within(getLatestSection()).getByText(/BMW editorial permanece/i)).toBeInTheDocument();
    expect(within(getGarageList()).getByText('Yamaha MT-07 2024')).toBeInTheDocument();
    expect(within(getGarageList()).queryByText('BMW F 900 GS 2024')).not.toBeInTheDocument();
  });

  it('solo agrupa reviews approved y oculta pending/rejected/hidden', async () => {
    await renderPage([
      createCommunityReview({
        id: 'approved-1',
        status: 'approved',
        motorcycle: { id: 'approved-bike', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', segment: 'trail', license: 'A' },
      }),
      createCommunityReview({
        id: 'pending-1',
        status: 'pending' as MotorcycleReviewStatus,
        motorcycle: { id: 'pending-bike', brand: 'Honda', model: 'Invisible Pending', year: 2024, imageUrl: '/honda.webp', segment: 'trail', license: 'A2' },
      }),
      createCommunityReview({
        id: 'rejected-1',
        status: 'rejected',
        motorcycle: { id: 'rejected-bike', brand: 'Ducati', model: 'Invisible Rejected', year: 2024, imageUrl: '/ducati.webp', segment: 'naked', license: 'A' },
      }),
      createCommunityReview({
        id: 'hidden-1',
        status: 'hidden',
        motorcycle: { id: 'hidden-bike', brand: 'Yamaha', model: 'Invisible Hidden', year: 2024, imageUrl: '/yamaha.webp', segment: 'naked', license: 'A2' },
      }),
    ]);

    expect(within(getGarageList()).getByText('BMW F 900 GS 2024')).toBeInTheDocument();
    expect(screen.queryByText(/Invisible Pending/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Invisible Rejected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Invisible Hidden/i)).not.toBeInTheDocument();
  });

  it('ordena el garaje por última review descendente por defecto', async () => {
    await renderPage([
      createCommunityReview({
        id: 'old-1',
        createdAt: '2026-05-01T10:00:00.000Z',
        motorcycle: { id: 'old-bike', brand: 'BMW', model: 'Old GS', year: 2024, imageUrl: '/old.webp', segment: 'trail', license: 'A' },
      }),
      createCommunityReview({
        id: 'new-1',
        createdAt: '2026-05-20T10:00:00.000Z',
        motorcycle: { id: 'new-bike', brand: 'Yamaha', model: 'New MT', year: 2024, imageUrl: '/new.webp', segment: 'naked', license: 'A2' },
      }),
    ]);

    expect(within(getGarageCards()[0]).getByText('Yamaha New MT 2024')).toBeInTheDocument();
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
    expect(within(getGarageList()).getByText('Yamaha MT-07 2024')).toBeInTheDocument();
    expect(within(getGarageList()).queryByText('BMW F 900 GS 2024')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros de reviews' }));
    await user.click(screen.getByRole('button', { name: 'Segmento: Trail' }));
    expect(within(getGarageList()).getByText('BMW F 900 GS 2024')).toBeInTheDocument();
    expect(within(getGarageList()).queryByText('Yamaha MT-07 2024')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Carnet A2' }));
    expect(screen.getByRole('heading', { name: /No hay motos con reviews para estos filtros/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros de reviews' }));
    await user.click(screen.getByRole('button', { name: '3 estrellas o menos' }));
    expect(within(getGarageList()).getByText('Yamaha MT-07 2024')).toBeInTheDocument();
    expect(within(getGarageList()).queryByText('BMW F 900 GS 2024')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Uso principal: Viaje' }));
    expect(screen.getByRole('heading', { name: /No hay motos con reviews para estos filtros/i })).toBeInTheDocument();
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

    expect(await within(getGarageList()).findByText('Aprilia Tuareg 660 2024')).toBeInTheDocument();
    expect(within(getGarageList()).getByText('Honda CB500X 2024')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'A2 limitable' }));

    expect(await within(getGarageList()).findByText('Aprilia Tuareg 660 2024')).toBeInTheDocument();
    expect(within(getGarageList()).queryByText('Honda CB500X 2024')).not.toBeInTheDocument();
  });

  it('ordena por rating, cantidad de reviews y kilómetros', async () => {
    const user = userEvent.setup();
    await renderPage([
      createCommunityReview({
        id: 'sort-km-1',
        motorcycleId: 'km-bike',
        rating: 2,
        kilometers: 20000,
        motorcycle: { id: 'km-bike', brand: 'BMW', model: 'Kilometers GS', year: 2024, imageUrl: '/km.webp', segment: 'trail', license: 'A' },
      }),
      createCommunityReview({
        id: 'sort-rating-1',
        motorcycleId: 'rating-bike',
        rating: 5,
        kilometers: 3000,
        motorcycle: { id: 'rating-bike', brand: 'Yamaha', model: 'Rating MT', year: 2024, imageUrl: '/rating.webp', segment: 'naked', license: 'A2' },
      }),
      createCommunityReview({
        id: 'sort-reviews-1',
        motorcycleId: 'reviews-bike',
        rating: 3,
        kilometers: 1000,
        motorcycle: { id: 'reviews-bike', brand: 'Honda', model: 'Reviews CB', year: 2024, imageUrl: '/reviews.webp', segment: 'naked', license: 'A2' },
      }),
      createCommunityReview({
        id: 'sort-reviews-2',
        motorcycleId: 'reviews-bike',
        rating: 4,
        kilometers: 1000,
        motorcycle: { id: 'reviews-bike', brand: 'Honda', model: 'Reviews CB', year: 2024, imageUrl: '/reviews.webp', segment: 'naked', license: 'A2' },
      }),
    ]);

    await user.click(screen.getByRole('button', { name: 'Orden: Mejor valoradas' }));
    expect(within(getGarageCards()[0]).getByText('Yamaha Rating MT 2024')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Orden: Más reviews' }));
    expect(within(getGarageCards()[0]).getByText('Honda Reviews CB 2024')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Orden: Más kilómetros' }));
    expect(within(getGarageCards()[0]).getByText('BMW Kilometers GS 2024')).toBeInTheDocument();
  });

  it('la card del garaje muestra rating, shield, métricas y CTAs sin datos de review individual', async () => {
    await renderPage([
      createCommunityReview({
        id: 'garage-card-1',
        userName: 'Fromen 01',
        rating: 5,
        pros: ['Suspensión'],
        cons: ['Calor'],
        ridingStyle: 'deportivo',
        motorcycle: { id: 'moto-1', brand: 'BMW', model: 'F 900 GS', year: 2024, imageUrl: '/bmw.webp', segment: 'trail', license: 'A' },
      }),
    ]);

    const card = getGarageCards()[0];

    expect(within(card).getByText('BMW F 900 GS 2024')).toBeInTheDocument();
    expect(within(card).getByLabelText('Rating medio 5 de 5')).toBeInTheDocument();
    expect(within(card).getByText('1 review')).toBeInTheDocument();
    expect(within(card).getByText('Deportivo')).toBeInTheDocument();
    expect(within(card).queryByText('Uso más repetido')).not.toBeInTheDocument();
    expect(within(card).queryByText('@Fromen_01')).not.toBeInTheDocument();
    expect(within(card).queryByText('Publicada')).not.toBeInTheDocument();
    expect(within(card).queryByText('+ Suspensión')).not.toBeInTheDocument();
    expect(within(card).queryByText('- Calor')).not.toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Reviews/i })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ficha técnica/i })).toBeInTheDocument();
  });

  it('pagina 9 motos agrupadas por página y navega primera/anterior/siguiente/última con máximo 5 números', async () => {
    const user = userEvent.setup();
    await renderPage(buildReviews(55));

    expect(getGarageList()).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Paginación del garaje de comunidad/i })).toBeInTheDocument();
    expect(getGarageCards()).toHaveLength(9);
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

    expect(screen.queryByRole('navigation', { name: /Paginación del garaje de comunidad/i })).not.toBeInTheDocument();

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

    expect(screen.getByRole('heading', { name: 'No hay motos con reviews para estos filtros' })).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar el segmento, el carnet o la búsqueda para encontrar modelos con opiniones de propietarios.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(within(getGarageList()).getByText('BMW F 900 GS 2024')).toBeInTheDocument();
  });

  it('muestra error y permite reintentar', async () => {
    const user = userEvent.setup();
    getApprovedCommunityReviewsMock.mockRejectedValueOnce(new Error('permission denied')).mockResolvedValueOnce([createCommunityReview()]);

    render(<CommunityReviewsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
    await user.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(await within(getGarageList()).findByTestId('motorcycle-garage-card')).toBeInTheDocument();
    expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(2);
  });

  it('configura interval de polling en mount y limpia en unmount', async () => {
    getApprovedCommunityReviewsMock.mockResolvedValue([createCommunityReview()]);
    vi.useFakeTimers();

    const { unmount } = render(<CommunityReviewsPage />);
    vi.advanceTimersByTime(0);
    expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(60_000);
    expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(3);

    unmount();
    vi.useRealTimers();
  });

  it('el polling llama al servicio de nuevo cada 60 segundos sin mostrar loading', () => {
    getApprovedCommunityReviewsMock.mockResolvedValue([createCommunityReview({ id: 'poll-1' })]);
    vi.useFakeTimers();

    const { rerender } = render(<CommunityReviewsPage />);
    vi.advanceTimersByTime(0);
    expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(1);

    getApprovedCommunityReviewsMock.mockResolvedValue([createCommunityReview({ id: 'poll-2' })]);
    vi.advanceTimersByTime(60_000);
    rerender(<CommunityReviewsPage />);
    expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('el fallo del polling no rompe la página y mantiene datos previos', async () => {
    getApprovedCommunityReviewsMock
      .mockResolvedValueOnce([createCommunityReview({ id: 'stable-1', motorcycle: { id: 'stable-1', brand: 'BMW', model: 'Stable GS', year: 2024, imageUrl: '/stable.webp', segment: 'trail', license: 'A' } })])
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce([createCommunityReview({ id: 'stable-1', motorcycle: { id: 'stable-1', brand: 'BMW', model: 'Stable GS', year: 2024, imageUrl: '/stable.webp', segment: 'trail', license: 'A' } })]);

    render(<CommunityReviewsPage />);
    await waitFor(() => expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(1));

    const garageBefore = within(getGarageList()).getByText('BMW Stable GS 2024');
    expect(garageBefore).toBeInTheDocument();

    vi.useFakeTimers();
    vi.advanceTimersByTime(60_000);
    vi.runAllTicks();
    vi.useRealTimers();

    await waitFor(() => {
      expect(within(getGarageList()).getByText('BMW Stable GS 2024')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra Actualizado ahora tras la carga inicial en insights', async () => {
    getApprovedCommunityReviewsMock.mockResolvedValue([createCommunityReview({ id: 'insights-ts-1' })]);
    render(<CommunityReviewsPage />);

    await waitFor(() => expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(1));

    const insights = screen.getByRole('complementary', { name: 'Insights en vivo' });
    expect(within(insights).getByText('Actualizado ahora')).toBeInTheDocument();
  });
});
