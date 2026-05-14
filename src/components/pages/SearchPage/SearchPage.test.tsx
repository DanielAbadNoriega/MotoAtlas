import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import realMotorcycleSeed from '../../../../data/import/motorcycles.json';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import type { Bike } from '../../../types/bike';
import { MOTORCYCLE_IMAGE_FALLBACK_URL } from '../../../shared/images/getMotorcycleImage';
import { initialSearchFilters } from '../../../utils/motorcycleSearch';
import { AdvancedFilters, BikeResultCard, CompareDrawer, SearchPage } from './SearchPage';

const realMotorcycles = realMotorcycleSeed as readonly Bike[];

function renderSearchPage() {
  return render(<SearchPage motorcycles={bikeFixtures} routeHash="#/buscador?browse=1" />);
}

function renderRealSearchPage() {
  return render(<SearchPage motorcycles={realMotorcycles} routeHash="#/buscador?browse=1" />);
}

describe('SearchPage', () => {
  it('renders motorcycles from fixtures', () => {
    renderSearchPage();

    expect(screen.getByRole('heading', { name: /F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Tuareg 660/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /MT-09/i })).toBeInTheDocument();
  });

  it('searches by brand', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/Buscar por marca o modelo/i), 'yamaha');

    expect(screen.getByRole('heading', { name: /MT-09/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /F 900 GS/i })).not.toBeInTheDocument();
  });

  it('searches by model', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/Buscar por marca o modelo/i), 'tuareg');

    expect(screen.getByRole('heading', { name: /Tuareg 660/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /MT-09/i })).not.toBeInTheDocument();
  });

  it('filters by segment', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.click(screen.getByRole('button', { name: 'Naked' }));

    expect(screen.getByRole('heading', { name: /MT-09/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Tuareg 660/i })).not.toBeInTheDocument();
  });

  it('filters by license', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.click(screen.getByRole('button', { name: 'Carnet A2' }));

    expect(screen.getByRole('heading', { name: /Tuareg 660/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /F 900 GS/i })).not.toBeInTheDocument();
  });

  it('filters by real A2 compatibility and shows A2 limitable badges', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.click(screen.getByRole('button', { name: 'Carnet A2' }));

    expect(screen.getAllByText('A2 LIMITABLE').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Tuareg 660/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /F 900 GS/i })).not.toBeInTheDocument();
  });

  it('sorts by price', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.selectOptions(screen.getByLabelText(/Ordenar por/i), 'price-desc');

    const resultHeadings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
      .filter((text) => ['F 900 GS', 'Tuareg 660', 'MT-09', 'NT1100'].includes(text ?? ''));
    expect(resultHeadings[0]).toBe('NT1100');
  });

  it('sorts by power', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.selectOptions(screen.getByLabelText(/Ordenar por/i), 'power-desc');

    const resultHeadings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
      .filter((text) => ['F 900 GS', 'Tuareg 660', 'MT-09', 'NT1100'].includes(text ?? ''));
    expect(resultHeadings[0]).toBe('MT-09');
  });

  it('shows an empty state when no results match', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/Buscar por marca o modelo/i), 'zzzz');

    expect(screen.getByRole('heading', { name: /No hay motos con esos filtros/i })).toBeInTheDocument();
  });

  it('does not allow selecting more than 3 motorcycles for comparison', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    await user.click(screen.getAllByRole('button', { name: /^Comparar$/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /^Comparar$/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /^Comparar$/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /^Comparar$/i })[0]);

    expect(screen.getByText('3/3 motos seleccionadas')).toBeInTheDocument();
    expect(screen.getByText(/Solo puedes seleccionar hasta 3 motos/i)).toBeInTheDocument();
  });

  it('renders the 20 current JSON motorcycles', () => {
    renderRealSearchPage();

    expect(screen.getByRole('heading', { name: /20 resultados encontrados/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /R 1300 GS/i })).toBeInTheDocument();
  });

  it('filters real motorcycles by trail segment', async () => {
    const user = userEvent.setup();
    renderRealSearchPage();

    await user.click(screen.getByRole('button', { name: 'Trail' }));

    expect(screen.getByRole('heading', { name: /9 resultados encontrados/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Ténéré 700/i })).toBeInTheDocument();
  });

  it('filters real motorcycles by naked segment', async () => {
    const user = userEvent.setup();
    renderRealSearchPage();

    await user.click(screen.getByRole('button', { name: 'Naked' }));

    expect(screen.getByRole('heading', { name: /6 resultados encontrados/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /MT-07/i })).toBeInTheDocument();
  });

  it('filters real motorcycles by sport-touring segment', async () => {
    const user = userEvent.setup();
    renderRealSearchPage();

    await user.click(screen.getByRole('button', { name: 'Sport Touring' }));

    expect(screen.getByRole('heading', { name: /5 resultados encontrados/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Tracer 9 GT/i })).toBeInTheDocument();
  });

  it('filters real motorcycles by A2 compatibility', async () => {
    const user = userEvent.setup();
    renderRealSearchPage();

    await user.click(screen.getByRole('button', { name: 'Carnet A2' }));

    expect(screen.getAllByText('A2 LIMITABLE').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Ténéré 700/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /R 1300 GS/i })).not.toBeInTheDocument();
  });
});

describe('BikeResultCard', () => {
  it('renders motorcycle data and toggles compare selection', async () => {
    const user = userEvent.setup();
    const onToggleCompare = vi.fn();

    render(<BikeResultCard bike={bikeFixtures[0]} isSelected={false} onToggleCompare={onToggleCompare} />);

    expect(screen.getByRole('heading', { name: /F 900 GS/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/test-bmw-f-900-gs');

    await user.click(screen.getByRole('button', { name: /Comparar/i }));

    expect(onToggleCompare).toHaveBeenCalledWith(bikeFixtures[0]);
  });

  it('shows selected state with accessible button text', () => {
    render(<BikeResultCard bike={bikeFixtures[0]} isSelected onToggleCompare={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Seleccionada/i })).toBeInTheDocument();
  });

  it('uses the real motorcycle image when imageUrl is valid', () => {
    render(<BikeResultCard bike={bikeFixtures[0]} isSelected={false} onToggleCompare={vi.fn()} />);

    expect(screen.getByRole('img', { name: /Trail media con electrónica completa/i })).toHaveAttribute(
      'src',
      'https://example.com/bmw.jpg',
    );
    expect(screen.queryByText('TECHNICAL IMAGE PENDING')).not.toBeInTheDocument();
  });

  it('uses the fallback image and overlay when imageUrl is missing', () => {
    const bikeWithoutImage = { ...bikeFixtures[0], imageUrl: undefined } as unknown as Bike;

    render(<BikeResultCard bike={bikeWithoutImage} isSelected={false} onToggleCompare={vi.fn()} />);

    expect(screen.getByRole('img', { name: /Imagen técnica pendiente de BMW F 900 GS/i })).toHaveAttribute(
      'src',
      MOTORCYCLE_IMAGE_FALLBACK_URL,
    );
    expect(screen.getByText('TECHNICAL IMAGE PENDING')).toBeInTheDocument();
  });

  it('uses the fallback image and overlay when imageUrl is empty', () => {
    const bikeWithEmptyImage = { ...bikeFixtures[0], imageUrl: '' } as Bike;

    render(<BikeResultCard bike={bikeWithEmptyImage} isSelected={false} onToggleCompare={vi.fn()} />);

    expect(screen.getByRole('img', { name: /Imagen técnica pendiente de BMW F 900 GS/i })).toHaveAttribute(
      'src',
      MOTORCYCLE_IMAGE_FALLBACK_URL,
    );
    expect(screen.getByText('TECHNICAL IMAGE PENDING')).toBeInTheDocument();
  });
});

describe('AdvancedFilters', () => {
  it('emits filter changes for brand, segment, license and numeric filters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AdvancedFilters
        brandOptions={['BMW', 'Yamaha']}
        filters={initialSearchFilters}
        isOpen
        onChange={onChange}
        onClose={vi.fn()}
        onReset={vi.fn()}
        segmentOptions={['trail', 'naked']}
      />,
    );

    await user.click(screen.getByLabelText('BMW'));
    await user.click(screen.getByRole('button', { name: 'Naked' }));
    await user.click(screen.getByRole('button', { name: 'Carnet A2' }));
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '15000' } });
    fireEvent.change(screen.getByLabelText('Potencia mínima'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Peso máximo'), { target: { value: '220' } });

    expect(onChange).toHaveBeenCalledWith({ brands: ['BMW'] });
    expect(onChange).toHaveBeenCalledWith({ segments: ['naked'] });
    expect(onChange).toHaveBeenCalledWith({ licenses: ['A2'] });
    expect(onChange).toHaveBeenCalledWith({ minPrice: '10000' });
    expect(onChange).toHaveBeenCalledWith({ maxPrice: '15000' });
    expect(onChange).toHaveBeenCalledWith({ minPower: '90' });
    expect(onChange).toHaveBeenCalledWith({ maxWeight: '220' });
  });

  it('can reset and close filters', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const onClose = vi.fn();

    render(
      <AdvancedFilters
        brandOptions={['BMW']}
        filters={initialSearchFilters}
        isOpen
        onChange={vi.fn()}
        onClose={onClose}
        onReset={onReset}
        segmentOptions={['trail']}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Resetear/i }));
    await user.click(screen.getByRole('button', { name: /Cerrar filtros/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('CompareDrawer', () => {
  it('allows comparing two selected motorcycles', () => {
    render(<CompareDrawer selectedBikes={bikeFixtures.slice(0, 2)} onClear={vi.fn()} onRemove={vi.fn()} />);

    const compareLink = screen.getByRole('link', { name: /Comparar ahora \(2\)/i });

    expect(screen.getByText('2/3 motos seleccionadas')).toBeInTheDocument();
    expect(compareLink).toHaveAttribute(
      'href',
      '#/comparador/bmw-f-900-gs-vs-aprilia-tuareg-660?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660',
    );
  });

  it('allows comparing three selected motorcycles', () => {
    render(<CompareDrawer selectedBikes={bikeFixtures.slice(0, 3)} onClear={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText('3/3 motos seleccionadas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Comparar ahora \(3\)/i })).toHaveAttribute(
      'href',
      '#/comparador/bmw-f-900-gs-vs-aprilia-tuareg-660-vs-yamaha-mt-09?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660,test-yamaha-mt-09',
    );
  });

  it('removes and clears selected motorcycles', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onClear = vi.fn();

    render(<CompareDrawer selectedBikes={bikeFixtures.slice(0, 1)} onClear={onClear} onRemove={onRemove} />);

    expect(screen.getByText(/Elige al menos 2 motos/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Quitar BMW F 900 GS/i }));
    await user.click(screen.getByRole('button', { name: /Vaciar comparador/i }));

    expect(onRemove).toHaveBeenCalledWith('test-bmw-f-900-gs');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not render when no motorcycles are selected', () => {
    const { container } = render(<CompareDrawer selectedBikes={[]} onClear={vi.fn()} onRemove={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
