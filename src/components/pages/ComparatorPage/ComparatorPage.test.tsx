import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { ComparePage } from './index';

describe('ComparePage', () => {
  it('renders a dynamic comparison for selected motorcycles', () => {
    render(<ComparePage bikes={bikeFixtures.slice(0, 2)} />);

    expect(screen.getByRole('heading', { name: /Comparativa de selección/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getByText('Precio estimado')).toBeInTheDocument();
    expect(within(table).getByText('Potencia')).toBeInTheDocument();
    expect(screen.getByText(/Dónde gana cada una/i)).toBeInTheDocument();
  });

  it('asks for at least two motorcycles when comparison is empty', () => {
    render(<ComparePage bikes={[]} />);

    expect(screen.getByRole('heading', { name: /Seleccioná al menos 2 motos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al buscador/i })).toHaveAttribute('href', '#/buscador?browse=1');
  });
});
