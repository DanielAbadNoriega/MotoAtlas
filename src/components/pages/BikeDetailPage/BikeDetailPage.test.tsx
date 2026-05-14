import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import realMotorcycleSeed from '../../../../data/import/motorcycles.json';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import type { Bike } from '../../../types/bike';
import { MOTORCYCLE_IMAGE_FALLBACK_URL } from '../../../shared/images/getMotorcycleImage';
import { BikeDetailPage } from './BikeDetailPage';

const realMotorcycles = realMotorcycleSeed as readonly Bike[];

describe('BikeDetailPage', () => {
  it('renders name, brand, year and main specs from fixtures', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getAllByText('2024').length).toBeGreaterThan(0);
    expect(screen.getByText(/Trail media con electrónica completa/i)).toBeInTheDocument();

    const mainSpecs = screen.getByRole('group', { name: 'Datos principales' });
    expect(within(mainSpecs).getByText('Potencia')).toBeInTheDocument();
    expect(within(mainSpecs).getByText(/105/)).toBeInTheDocument();
    expect(within(mainSpecs).getByText('Peso')).toBeInTheDocument();
    expect(within(mainSpecs).getByText(/219/)).toBeInTheDocument();
    expect(within(mainSpecs).getByText('Motor')).toBeInTheDocument();
    expect(within(mainSpecs).getByText(/895/)).toBeInTheDocument();
  });

  it('shows pros, cons and common reliability issues', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByText('Motor elástico')).toBeInTheDocument();
    expect(screen.getByText('Buen equilibrio')).toBeInTheDocument();
    expect(screen.getByText('Precio alto')).toBeInTheDocument();
    expect(screen.getByText('Calor en ciudad')).toBeInTheDocument();
  });

  it('has a working add-to-comparator link without calling Supabase', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('link', { name: /Añadir al comparador/i })).toHaveAttribute(
      'href',
      '#/buscador?compare=test-bmw-f-900-gs',
    );
  });

  it('has working links back to the search page', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('link', { name: /Volver al catálogo/i })).toHaveAttribute('href', '#/buscador');
    expect(screen.getByRole('link', { name: /Ver más motos/i })).toHaveAttribute('href', '#/buscador?browse=1');
  });

  it('renders related motorcycles from local fixtures', () => {
    render(<BikeDetailPage bike={bikeFixtures[0]} motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Aprilia Tuareg 660/i })).toBeInTheDocument();
  });

  it('renders a not found state when the motorcycle is missing', () => {
    render(<BikeDetailPage motorcycles={bikeFixtures} />);

    expect(screen.getByRole('heading', { name: /Moto no encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al buscador/i })).toHaveAttribute('href', '#/buscador');
  });

  it('renders a real motorcycle from the current JSON seed', () => {
    const bmwF900Gs = realMotorcycles.find((bike) => bike.id === 'bmw-f-900-gs-2024');

    render(<BikeDetailPage bike={bmwF900Gs} motorcycles={realMotorcycles} />);

    expect(screen.getByRole('heading', { name: /BMW F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByText(/Trail media-alta con mucho par/i)).toBeInTheDocument();

    const mainSpecs = screen.getByRole('group', { name: 'Datos principales' });
    expect(within(mainSpecs).getByText(/105/)).toBeInTheDocument();
    expect(within(mainSpecs).getByText(/895/)).toBeInTheDocument();
  });

  it('renders a pending technical image overlay when detail image is missing', () => {
    const bikeWithoutImage = { ...bikeFixtures[0], imageUrl: '' } as Bike;

    const { container } = render(<BikeDetailPage bike={bikeWithoutImage} motorcycles={[bikeWithoutImage, ...bikeFixtures.slice(1)]} />);

    expect(screen.getByText('TECHNICAL IMAGE PENDING')).toBeInTheDocument();
    expect(container.querySelector(`img[src="${MOTORCYCLE_IMAGE_FALLBACK_URL}"]`)).toBeInTheDocument();
  });
});
