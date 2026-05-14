import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import realMotorcycleSeed from '../../../../data/import/motorcycles.json';
import { MOTORCYCLE_IMAGE_FALLBACK_URL } from '../../../shared/images/getMotorcycleImage';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import type { Bike } from '../../../types/bike';
import { ComparePage } from './index';

const realMotorcycles = realMotorcycleSeed as readonly Bike[];


function createBikeWithMissingData() {
  const bike = {
    ...bikeFixtures[0],
    id: 'test-no-data-bike',
    brand: 'NoData',
    model: 'Ghost',
    imageUrl: undefined,
    pros: undefined,
    cons: undefined,
    reliabilityReports: {
      commonIssues: undefined,
      reportCount: undefined,
      reliabilityScore: undefined,
    },
    useScores: undefined,
  };

  return bike as unknown as typeof bikeFixtures[number];
}

describe('ComparePage', () => {
  it('renders the Stitch visual comparator with dynamic data', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /BMW F 900 GS vs Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /¿Cuál elegirías/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Análisis en vídeo/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Veredicto final/i })).toBeInTheDocument();
  });

  it('allows comparing two motorcycles', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} motorcycles={bikeFixtures} />);

    expect(screen.getAllByRole('heading', { name: /BMW F 900 GS/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /Aprilia Tuareg 660/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/2 motos seleccionadas/i)).toBeInTheDocument();
  });

  it('allows comparing three motorcycles', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 3)} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Comparativa de 3 motos/i })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /BMW F 900 GS/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /Aprilia Tuareg 660/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /Yamaha MT-09/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/3 motos seleccionadas/i)).toBeInTheDocument();
  });

  it('warns when query params included more than 3 motorcycles', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 3)} ignoredBikeCount={1} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/Se ignoraron 1 moto/i);
  });

  it('removes a motorcycle and syncs the URL', async () => {
    const user = userEvent.setup();
    render(<ComparePage bikes={bikeFixtures.slice(0, 3)} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('button', { name: /Quitar Aprilia Tuareg 660 de la comparativa/i }));

    expect(window.location.hash).toBe('#/comparador?bikes=test-bmw-f-900-gs,test-yamaha-mt-09');
  });

  it('adds a motorcycle and syncs the URL', async () => {
    const user = userEvent.setup();
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('button', { name: /Añadir Yamaha MT-09/i }));

    expect(window.location.hash).toBe('#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09');
  });

  it('registers a vote action', async () => {
    const user = userEvent.setup();
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} motorcycles={bikeFixtures} />);

    await user.click(screen.getByRole('button', { name: /Votar ganadora/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Voto registrado/i);
  });

  it('renders best value badges in highlights', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} motorcycles={bikeFixtures} />);

    expect(screen.getByText('Best value')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mejor calidad\/precio/i })).toBeInTheDocument();
  });

  it('renders the technical registry table', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} motorcycles={bikeFixtures} />);

    const table = screen.getByRole('table');
    expect(within(table).getByText('Specification')).toBeInTheDocument();
    expect(within(table).getByText('Max Power')).toBeInTheDocument();
    expect(within(table).getByText('Wet Weight')).toBeInTheDocument();
    expect(within(table).getByText('Est. Price')).toBeInTheDocument();
  });

  it('renders performance bars for every selected motorcycle', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Rendimiento por categoría/i })).toBeInTheDocument();
    expect(screen.getByText('Road Comfort')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(14);
  });

  it('renders pros, cons and common issues dynamically', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} motorcycles={bikeFixtures} />);

    expect(screen.getByText('Motor elástico')).toBeInTheDocument();
    expect(screen.getByText('Precio alto')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Lo que los catálogos no cuentan/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Calor en ciudad' })).toBeInTheDocument();
  });



  it('shows a clear one-bike state and can add another motorcycle', async () => {
    const user = userEvent.setup();
    render(<ComparePage bikes={[bikeFixtures[0]]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Añade otra moto para comparar/i })).toBeInTheDocument();
    expect(screen.getByText(/BMW F 900 GS ya está en la cola/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Añadir Aprilia Tuareg 660 a la comparativa/i }));

    expect(window.location.hash).toBe('#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660');
  });

  it('renders clean fallbacks when a motorcycle has no pros, cons or common issues', () => {
    const noDataBike = createBikeWithMissingData();
    render(<ComparePage bikes={[noDataBike, bikeFixtures[1]]} motorcycles={[noDataBike, ...bikeFixtures]} />);

    expect(screen.getAllByText('Sin datos disponibles').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole('heading', { name: 'Sin datos disponibles' })).toBeInTheDocument();
  });

  it('uses a placeholder image when a motorcycle has no image', () => {
    const noDataBike = createBikeWithMissingData();
    render(<ComparePage bikes={[noDataBike, bikeFixtures[1]]} motorcycles={[noDataBike, ...bikeFixtures]} />);

    expect(screen.getAllByRole('img').some((image) => image.getAttribute('src') === MOTORCYCLE_IMAGE_FALLBACK_URL)).toBe(true);
    expect(screen.getByText('TECHNICAL IMAGE PENDING')).toBeInTheDocument();
  });

  it('uses score 0 when a motorcycle has no use scores', () => {
    const noDataBike = createBikeWithMissingData();
    render(<ComparePage bikes={[noDataBike, bikeFixtures[1]]} motorcycles={[noDataBike, ...bikeFixtures]} />);

    expect(screen.getByRole('progressbar', { name: /City Use NoData Ghost/i })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getAllByText('0.0/10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('N/D').length).toBeGreaterThan(0);
  });

  it('asks for at least two motorcycles when comparison is empty', () => {
    render(<ComparePage bikes={[]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Selecciona al menos 2 motos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al buscador/i })).toHaveAttribute('href', '#/buscador?browse=1');
  });

  it('compares BMW F 900 GS, Aprilia Tuareg 660 and Yamaha Ténéré 700 from the current JSON seed', () => {
    const selectedBikes = ['bmw-f-900-gs-2024', 'aprilia-tuareg-660-2024', 'yamaha-tenere-700-2024'].map((id) => {
      const bike = realMotorcycles.find((motorcycle) => motorcycle.id === id);

      if (!bike) {
        throw new Error(`Missing real motorcycle fixture: ${id}`);
      }

      return bike;
    });

    render(<ComparePage bikes={selectedBikes} motorcycles={realMotorcycles} />);

    expect(screen.getByRole('heading', { name: /Comparativa de 3 motos/i })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /BMW F 900 GS/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /Aprilia Tuareg 660/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /Yamaha Ténéré 700/i }).length).toBeGreaterThan(0);
  });

  it('can compare motorcycles with fallback images', () => {
    const noImageBike = { ...bikeFixtures[0], imageUrl: 'https://placehold.co/1200x800?text=sin+imagen' } as Bike;

    render(<ComparePage bikes={[noImageBike, bikeFixtures[1]]} motorcycles={[noImageBike, ...bikeFixtures.slice(1)]} />);

    expect(screen.getByText('TECHNICAL IMAGE PENDING')).toBeInTheDocument();
    expect(screen.getAllByRole('img').some((image) => image.getAttribute('alt') === 'Imagen técnica pendiente de BMW F 900 GS')).toBe(true);
  });
});
