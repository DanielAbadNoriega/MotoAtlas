import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { ComparePage } from './index';

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

  it('asks for at least two motorcycles when comparison is empty', () => {
    render(<ComparePage bikes={[]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Seleccioná al menos 2 motos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al buscador/i })).toHaveAttribute('href', '#/buscador?browse=1');
  });
});
