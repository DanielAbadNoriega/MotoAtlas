import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountReviewsEmptyState } from './AccountReviewsEmptyState';

describe('AccountReviewsEmptyState', () => {
  it('renderiza el mensaje sin resultados y el radar técnico sin scripts', () => {
    const { container } = render(<AccountReviewsEmptyState />);

    expect(screen.getByRole('heading', { name: 'No hay reviews con estos filtros' })).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar los filtros para encontrar lo que necesitas.')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-empty-radar')).toBeInTheDocument();
    expect(screen.getAllByTestId('reviews-empty-radar-ring')).toHaveLength(2);
    expect(screen.getByTestId('reviews-empty-radar-sweep')).toBeInTheDocument();
    expect(screen.getAllByTestId('reviews-empty-radar-marker')).toHaveLength(4);
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });

  it('ejecuta Limpiar filtros cuando se pasa callback', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    render(<AccountReviewsEmptyState onClearFilters={onClearFilters} />);

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
