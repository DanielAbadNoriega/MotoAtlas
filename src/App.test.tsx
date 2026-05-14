import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { getMotorcycles } from './services/motorcycleService';
import { bikeFixtures } from './test/fixtures/bikes';

vi.mock('./services/motorcycleService', () => ({
  getMotorcycles: vi.fn(),
}));

const getMotorcyclesMock = vi.mocked(getMotorcycles);

async function renderApp() {
  const view = render(<App />);
  await waitFor(() => expect(getMotorcyclesMock).toHaveBeenCalled());
  return view;
}

describe('App navigation with mocked motorcycleService', () => {
  beforeEach(() => {
    window.location.hash = '';
    getMotorcyclesMock.mockReset();
    getMotorcyclesMock.mockResolvedValue({ motorcycles: bikeFixtures, source: 'supabase' });
  });

  it('does not depend on real Supabase data', async () => {
    await renderApp();

    expect(getMotorcyclesMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: /La Enciclopedia del Motero Técnico/i })).toBeInTheDocument();
  });

  it('has a navigation link toward the search page', async () => {
    await renderApp();

    expect(screen.getByRole('link', { name: 'Buscador' })).toHaveAttribute('href', '#/buscador');
  });

  it('opens the search page from the main search button', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole('button', { name: /Buscar en MotoAtlas/i }));

    expect(await screen.findByRole('heading', { name: /Encuentra tu próxima moto/i })).toBeInTheDocument();
  });

  it('keeps the home hero search button functional without navigating unexpectedly', async () => {
    const user = userEvent.setup();
    await renderApp();

    const search = screen.getByRole('search');
    await user.type(within(search).getByLabelText(/Buscar modelos/i), 'BMW');
    await user.click(within(search).getByRole('button', { name: 'Buscar' }));

    expect(within(search).getByDisplayValue('BMW')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  it('has home card links toward search compare flow', async () => {
    await renderApp();

    expect(screen.getAllByRole('link', { name: 'Comparar' })[0]).toHaveAttribute('href', expect.stringContaining('#/buscador?compare='));
  });

  it('navigates from the home duel button to the detailed comparison', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole('button', { name: /Iniciar comparativa detallada/i }));

    expect(await screen.findByRole('heading', { name: /BMW F900GS vs Aprilia Tuareg 660/i })).toBeInTheDocument();
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
    await user.click(screen.getByRole('link', { name: /Comparar ahora \(2\)/i }));

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
});
