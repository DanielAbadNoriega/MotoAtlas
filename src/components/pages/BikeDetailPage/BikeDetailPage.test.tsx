import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { BikeDetailPage } from './BikeDetailPage';

describe('BikeDetailPage', () => {
  it('renders the selected motorcycle detail without using Supabase', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByText(/Trail media con electrónica completa/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Comparar en buscador/i })).toHaveAttribute(
      'href',
      '#/buscador?compare=test-bmw-f-900-gs',
    );
    expect(screen.getByRole('link', { name: /Ver más motos/i })).toHaveAttribute('href', '#/buscador?browse=1');
    expect(screen.getByRole('heading', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
  });

  it('renders a not found state when the motorcycle is missing', () => {
    render(<BikeDetailPage motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Moto no encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al buscador/i })).toHaveAttribute('href', '#/buscador');
  });
});
