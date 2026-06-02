import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { bikeCatalog } from './data/bikes';
import { getMotorcycles } from './services/motorcycleService';
import { getApprovedCommunityReviews, getApprovedReviewsByMotorcycleId } from './services/motorcycleReviewService';
import { bikeFixtures } from './test/fixtures/bikes';

vi.mock('./services/motorcycleService', () => ({
  getMotorcycles: vi.fn(),
}));

vi.mock('./services/motorcycleReviewService', () => ({
  createReview: vi.fn(),
  getApprovedCommunityReviews: vi.fn(),
  getApprovedReviewsByMotorcycleId: vi.fn(),
  getReviewsByUserId: vi.fn(),
}));

const getMotorcyclesMock = vi.mocked(getMotorcycles);
const getApprovedReviewsMock = vi.mocked(getApprovedReviewsByMotorcycleId);
const getApprovedCommunityReviewsMock = vi.mocked(getApprovedCommunityReviews);

async function renderApp() {
  const view = render(<App />);
  await waitFor(() => expect(getMotorcyclesMock).toHaveBeenCalled());
  return view;
}

describe('App navigation with mocked motorcycleService', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    window.location.hash = '';
    window.localStorage.clear();
    getMotorcyclesMock.mockReset();
    getApprovedReviewsMock.mockReset();
    getApprovedCommunityReviewsMock.mockReset();
    getMotorcyclesMock.mockResolvedValue({ motorcycles: bikeFixtures, source: 'supabase' });
    getApprovedReviewsMock.mockResolvedValue([]);
    getApprovedCommunityReviewsMock.mockResolvedValue([]);
  });

  it('does not depend on real Supabase data', async () => {
    await renderApp();

    expect(getMotorcyclesMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: /La Enciclopedia del Motero Técnico/i })).toBeInTheDocument();
  });

  it('has the simplified primary navigation links', async () => {
    await renderApp();
    const primaryNav = screen.getByRole('navigation', { name: 'Navegación principal' });

    expect(within(primaryNav).getByRole('link', { name: 'Buscador' })).toHaveAttribute('href', '#/buscador');
    expect(within(primaryNav).getByRole('link', { name: 'Comparador' })).toHaveAttribute('href', '#/comparador');
    expect(within(primaryNav).getByRole('link', { name: 'Noticias' })).toHaveAttribute('href', '#/noticias');
    expect(within(primaryNav).getByRole('link', { name: 'Comunidad' })).toHaveAttribute('href', '#/comunidad');
    expect(screen.queryByRole('link', { name: 'Rutas' })).not.toBeInTheDocument();
  });

  it('opens the search page from the main search button', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole('button', { name: /Buscar en MotoAtlas/i }));

    expect(await screen.findByRole('heading', { name: /Encuentra tu próxima moto/i })).toBeInTheDocument();
  });

  it('searches from the home hero by brand and opens the filtered catalog', async () => {
    const user = userEvent.setup();
    getMotorcyclesMock.mockResolvedValue({ motorcycles: bikeCatalog, source: 'supabase' });
    await renderApp();

    const search = screen.getByRole('search');
    await user.type(within(search).getByLabelText(/Buscar modelos/i), 'ducati');
    await user.click(within(search).getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('heading', { name: /Encuentra tu próxima moto/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar por marca o modelo/i)).toHaveValue('ducati');
    expect(screen.getByRole('heading', { name: /DesertX/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /F 900 GS/i })).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#/buscador?q=ducati');
  });

  it('has home card links toward search compare flow', async () => {
    await renderApp();
    const verFichaLinks = screen.getAllByRole('link', { name: 'Ver ficha' });

    expect(verFichaLinks.some((link) => link.getAttribute('href')?.includes('#/motos/'))).toBe(true);
  });

  it('navigates from the home duel button to the detailed comparison', async () => {
    const user = userEvent.setup();
    getMotorcyclesMock.mockResolvedValue({ motorcycles: bikeCatalog, source: 'supabase' });
    await renderApp();

    await user.click(screen.getByRole('button', { name: /Iniciar comparativa detallada/i }));

    expect(await screen.findByRole('heading', { name: /BMW F 900 GS vs Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Elige tu ganadora/i })).toBeInTheDocument();
    expect(window.location.hash).toContain('#/comparador/bmw-f-900-gs-vs-aprilia-tuareg-660?bikes=');
  });

  it('navigates from selected search motorcycles to the comparator page', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/buscador?browse=1';
    await renderApp();

    await screen.findByRole('heading', { name: /Encuentra tu próxima moto/i });
    const bmwCard = screen.getByRole('heading', { name: /F 900 GS/i }).closest('article');
    const apriliaCard = screen.getByRole('heading', { name: /Tuareg 660/i }).closest('article');

    expect(bmwCard).not.toBeNull();
    expect(apriliaCard).not.toBeNull();

    await user.click(within(bmwCard as HTMLElement).getByRole('button', { name: /^Comparar$/i }));
    await user.click(within(apriliaCard as HTMLElement).getByRole('button', { name: /^Comparar$/i }));
    await user.click(screen.getByRole('link', { name: /Comparar \(2\)/i }));

    expect(await screen.findByRole('heading', { name: /BMW F 900 GS vs Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /BMW F 900 GS/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /Aprilia Tuareg 660/i }).length).toBeGreaterThan(0);
  });



  it('renders comparator directly from query params', async () => {
    window.location.hash = '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660';

    await renderApp();

    expect(await screen.findByRole('heading', { name: /BMW F 900 GS vs Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Technical Registry/i })).toBeInTheDocument();
  });

  it('renders comparator from persisted selection when navbar opens #/comparador without query params', async () => {
    window.localStorage.setItem('motoatlas.compareQueue.v1', JSON.stringify(['test-bmw-f-900-gs', 'test-aprilia-tuareg-660']));
    window.location.hash = '#/comparador';

    await renderApp();

    expect(await screen.findByRole('heading', { name: /BMW F 900 GS vs Aprilia Tuareg 660/i })).toBeInTheDocument();
  });

  it('renders comparator from a clean SEO path', async () => {
    window.history.pushState(null, '', '/comparador/bmw-f-900-gs-vs-aprilia-tuareg-660');

    await renderApp();

    expect(await screen.findByRole('heading', { name: /BMW F 900 GS vs Aprilia Tuareg 660/i })).toBeInTheDocument();
  });



  it.each([
    ['#/metodologia', /Datos técnicos con contexto/i, 'Metodología | MotoAtlas'],
    ['#/fuentes-datos', /Sabe de dónde viene cada dato/i, 'Fuentes de datos | MotoAtlas'],
    ['#/solicitar-modelo', /¿Falta una moto\?/i, 'Solicitar modelo | MotoAtlas'],
    ['#/privacidad', /^Privacidad$/i, 'Privacidad | MotoAtlas'],
    ['#/terminos', /Términos de uso/i, 'Términos de uso | MotoAtlas'],
  ])('renderiza la ruta informativa %s', async (hash, heading, expectedTitle) => {
    window.location.hash = hash;

    await renderApp();

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(document.title).toBe(expectedTitle);
  });

  it('renderiza la landing principal de comunidad desde #/comunidad', async () => {
    window.location.hash = '#/comunidad';

    await renderApp();

    expect(await screen.findByRole('heading', { name: /Comunidad MotoAtlas/i })).toBeInTheDocument();
    expect(document.title).toBe('Comunidad MotoAtlas | Reviews y motos mejor valoradas');
  });

  it('renderiza el archivo público de reviews desde #/comunidad/reviews', async () => {
    window.location.hash = '#/comunidad/reviews';

    await renderApp();

    expect(await screen.findByRole('heading', { name: /Reviews de la comunidad/i })).toBeInTheDocument();
    expect(document.title).toBe('Reviews de la comunidad | MotoAtlas');
    expect(getApprovedCommunityReviewsMock).toHaveBeenCalledTimes(1);
    expect(getApprovedReviewsMock).not.toHaveBeenCalledWith('reviews');
  });

  it('mantiene #/motos-mejor-valoradas como alias sin SEO duplicado', async () => {
    window.location.hash = '#/motos-mejor-valoradas';

    await renderApp();

    expect(await screen.findByRole('heading', { name: /Comunidad MotoAtlas/i })).toBeInTheDocument();
    expect(document.title).toBe('Comunidad MotoAtlas | Reviews y motos mejor valoradas');
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://motoatlas.com/comunidad');
  });

  it.each([
    ['#/login', /Iniciar sesión/i, 'Iniciar sesión | MotoAtlas'],
    ['#/registro', /Crear cuenta/i, 'Crear cuenta | MotoAtlas'],
    ['#/cuenta', /Inicia sesión para ver Mi cuenta/i, 'Mi cuenta | MotoAtlas'],
    ['#/cuenta/reviews', /Inicia sesión para ver tus reviews/i, 'Mis reviews | MotoAtlas'],
    ['#/cuenta/reviews/test-bmw-f-900-gs', /Inicia sesión para ver tus reviews de esta moto/i, 'Mis reviews de esta moto | MotoAtlas'],
    ['#/cuenta/solicitudes', /Inicia sesión para ver tus solicitudes/i, 'Mis solicitudes | MotoAtlas'],
    ['#/admin', /Inicia sesión para acceder al panel admin/i, 'Panel de administración | MotoAtlas'],
    ['#/admin/moderacion', /Inicia sesión para acceder al panel admin/i, 'Moderación | MotoAtlas'],
    ['#/admin/reviews', /Inicia sesión para acceder al panel admin/i, 'Reviews por modelo | MotoAtlas'],
  ])('renderiza la ruta de auth %s', async (hash, heading, expectedTitle) => {
    window.location.hash = hash;

    await renderApp();

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(document.title).toBe(expectedTitle);
  });

  it('renders community page from a motorcycle route', async () => {
    window.location.hash = '#/comunidad/test-bmw-f-900-gs';

    await renderApp();

    expect(await screen.findByRole('heading', { name: /Reviews BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/test-bmw-f-900-gs');
    expect(getApprovedReviewsMock).toHaveBeenCalledWith('test-bmw-f-900-gs');
  });

  it('does not render more than 3 motorcycles from a comparator route', async () => {
    window.location.hash =
      '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09,test-honda-nt1100';

    await renderApp();

    expect(await screen.findByRole('heading', { name: /Comparativa de 3 motos/i })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /BMW F 900 GS/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /Aprilia Tuareg 660/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /Yamaha MT-09/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: /Honda NT1100/i })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Se ignoraron 1 moto/i);
  });

  it('preserves three comparator motorcycles when modifying the comparison from search', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09';

    await renderApp();

    expect(await screen.findByRole('heading', { name: /Comparativa de 3 motos/i })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Modificar comparativa/i }));

    expect(await screen.findByRole('heading', { name: /Encuentra tu próxima moto/i })).toBeInTheDocument();
    expect(screen.getAllByTestId('compare-slot-filled')).toHaveLength(3);
    expect(screen.queryByTestId('compare-slot-empty')).not.toBeInTheDocument();
    expect(screen.queryByText(/3\/3 motos seleccionadas/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Comparar \(3\)/i })).toBeInTheDocument();
  });

  it('shows a glass scroll-to-top action when scrolling down', async () => {
    const user = userEvent.setup();
    const scrollToMock = vi.fn();
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: scrollToMock });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 520 });

    await renderApp();
    fireEvent.scroll(window);

    const button = await screen.findByRole('button', { name: /Volver arriba/i });
    await user.click(button);

    expect(scrollToMock).toHaveBeenCalledWith({ behavior: 'smooth', left: 0, top: 0 });
  });
});
