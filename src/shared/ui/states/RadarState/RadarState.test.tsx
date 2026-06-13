import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadarState } from './RadarState';

describe('RadarState', () => {
  it('renderiza defaults y no muestra acción cuando no hay onAction', () => {
    render(<RadarState />);

    expect(screen.getByRole('heading', { name: 'No hay reviews con estos filtros' })).toBeInTheDocument();
    expect(screen.getByText('Prueba a cambiar los filtros para encontrar lo que necesitas.')).toBeInTheDocument();
    expect(screen.getByText('search_off')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
    expect(screen.getByTestId('reviews-empty-radar')).toBeInTheDocument();
    expect(screen.getAllByTestId('reviews-empty-radar-ring')).toHaveLength(2);
    expect(screen.getByTestId('reviews-empty-radar-sweep')).toBeInTheDocument();
    expect(screen.getAllByTestId('reviews-empty-radar-marker')).toHaveLength(4);
  });

  it('ejecuta onAction y soporta textos/icono custom', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <RadarState
        actionLabel="Volver a intentar"
        description="Custom description"
        icon="radar"
        onAction={onAction}
        title="Custom title"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Custom title' })).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
    expect(screen.getByText('radar')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volver a intentar' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('usa aria-labelledby con titleId custom', () => {
    const { container } = render(<RadarState title="Estado radar" titleId="custom-radar-title" />);

    const section = container.querySelector('section');
    const heading = screen.getByRole('heading', { name: 'Estado radar' });

    expect(section).toHaveAttribute('aria-labelledby', 'custom-radar-title');
    expect(heading).toHaveAttribute('id', 'custom-radar-title');
  });
});
