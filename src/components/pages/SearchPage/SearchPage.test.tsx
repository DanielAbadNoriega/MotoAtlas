import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { initialSearchFilters } from '../../../utils/motorcycleSearch';
import { AdvancedFilters, BikeResultCard, CompareDrawer } from './SearchPage';

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
});

describe('AdvancedFilters', () => {
  it('emits filter changes for brand, segment and license', async () => {
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

    expect(onChange).toHaveBeenNthCalledWith(1, { brands: ['BMW'] });
    expect(onChange).toHaveBeenNthCalledWith(2, { segments: ['naked'] });
    expect(onChange).toHaveBeenNthCalledWith(3, { licenses: ['A2'] });
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
  it('links to the comparator when at least two motorcycles are selected', () => {
    render(<CompareDrawer selectedBikes={bikeFixtures.slice(0, 2)} onClear={vi.fn()} onRemove={vi.fn()} />);

    const compareLink = screen.getByRole('link', { name: /Comparar ahora \(2\)/i });

    expect(screen.getByText('2/3 motos seleccionadas')).toBeInTheDocument();
    expect(compareLink).toHaveAttribute(
      'href',
      '#/comparador?bikes=test-bmw-f-900-gs,test-aprilia-tuareg-660',
    );
  });

  it('removes and clears selected motorcycles', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onClear = vi.fn();

    render(<CompareDrawer selectedBikes={bikeFixtures.slice(0, 1)} onClear={onClear} onRemove={onRemove} />);

    expect(screen.getByText(/Elegí al menos 2 motos/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Quitar BMW F 900 GS/i }));
    await user.click(screen.getByRole('button', { name: /Vaciar comparador/i }));

    expect(onRemove).toHaveBeenCalledWith('test-bmw-f-900-gs');
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
