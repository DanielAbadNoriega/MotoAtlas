import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TechnicalSpecCard } from './TechnicalSpecCard';

describe('TechnicalSpecCard', () => {
  it('renders label, value, unit and an accessible-hidden icon', () => {
    render(<TechnicalSpecCard icon="engine" label="MOTOR" value="895" unit="CC" />);

    const card = screen.getByText('MOTOR').closest('article');
    expect(card).not.toBeNull();
    expect(screen.getByText('895')).toBeInTheDocument();
    expect(screen.getByText('CC')).toBeInTheDocument();
    expect(screen.getByText('settings_input_component')).toBeInTheDocument();
    expect(screen.getByText('settings_input_component')).toHaveAttribute('aria-hidden', 'true');
  });

  it('omits optional unit when not provided', () => {
    render(<TechnicalSpecCard icon="license" label="CARNET" value="A2" />);

    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.queryByText('CC')).not.toBeInTheDocument();
  });

  it('hides optional meta when empty or whitespace', () => {
    const { rerender } = render(<TechnicalSpecCard icon="power" label="POTENCIA" value="105" meta="" />);
    expect(screen.queryByText(/./, { selector: '.bike-detail__spec-meta' })).not.toBeInTheDocument();

    rerender(<TechnicalSpecCard icon="power" label="POTENCIA" value="105" meta="   " />);
    expect(screen.queryByText('   ')).not.toBeInTheDocument();
  });

  it('renders meta when provided', () => {
    render(<TechnicalSpecCard icon="price" label="PRECIO" value="13.950" unit="€" meta="Pendiente" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('marks accent variant explicitly', () => {
    render(<TechnicalSpecCard icon="price" label="PRECIO" value="13.950" variant="accent" />);
    const card = screen.getByText('PRECIO').closest('article');
    expect(card).toHaveClass('bike-detail__spec-card--accent');
    expect(card).toHaveAttribute('data-spec-variant', 'accent');
  });

  it('does not render null/undefined for empty optional props', () => {
    render(<TechnicalSpecCard icon="weight" label="PESO" value="213" />);
    expect(screen.queryByText('null')).not.toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });
});
