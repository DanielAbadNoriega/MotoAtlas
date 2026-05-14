import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { ComparePage } from './index';

describe('ComparePage', () => {
  it('allows comparing two motorcycles', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} />);

    expect(screen.getByRole('heading', { name: /Comparativa de selección/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(screen.getByText(/2 motos en la mesa/i)).toBeInTheDocument();
  });

  it('allows comparing three motorcycles', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 3)} />);

    expect(screen.getByRole('heading', { name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Yamaha MT-09/i })).toBeInTheDocument();
    expect(screen.getByText(/3 motos en la mesa/i)).toBeInTheDocument();
  });

  it('renders the technical table', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} />);

    const table = screen.getByRole('table');
    expect(within(table).getByText('Precio estimado')).toBeInTheDocument();
    expect(within(table).getByText('Potencia')).toBeInTheDocument();
    expect(within(table).getByText('Peso lleno')).toBeInTheDocument();
    expect(within(table).getByText('Carnet')).toBeInTheDocument();
  });

  it('renders use scores for the selected motorcycles', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} />);

    expect(screen.getByRole('heading', { name: /Dónde gana cada una/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ciudad' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Touring' })).toBeInTheDocument();
    expect(screen.getAllByText(/Gana Aprilia Tuareg 660/i).length).toBeGreaterThan(0);
  });

  it('asks for at least two motorcycles when comparison is empty', () => {
    render(<ComparePage bikes={[]} />);

    expect(screen.getByRole('heading', { name: /Seleccioná al menos 2 motos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al buscador/i })).toHaveAttribute('href', '#/buscador?browse=1');
  });
});
