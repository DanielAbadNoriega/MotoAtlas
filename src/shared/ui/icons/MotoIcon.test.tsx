import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MotoIcon } from './MotoIcon';

describe('MotoIcon', () => {
  it('renders an svg element with the correct viewBox for Material icons', () => {
    const { container } = render(<MotoIcon name="compare_arrows" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
  });

  it('renders sync with the official Material viewBox', () => {
    const { container } = render(<MotoIcon name="sync" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
  });

  it('is decorative by default with aria-hidden and focusable="false"', () => {
    const { container } = render(<MotoIcon name="motorcycle" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('exposes role="img" with aria-label when label prop is provided', () => {
    render(<MotoIcon name="star" label="Calificación" />);
    const svg = screen.getByRole('img', { name: 'Calificación' });
    expect(svg).toBeInTheDocument();
    expect(svg).not.toHaveAttribute('aria-hidden');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('accepts className and passes it to the svg element', () => {
    const { container } = render(<MotoIcon name="groups" className="custom-icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-icon');
  });

  it('falls back to motorcycle for unknown icon names without type cast', () => {
    const { container } = render(<MotoIcon name="nonexistent" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
  });

  it('prevents native svg props from overriding controlled decorative aria semantics', () => {
    const { container } = render(<MotoIcon name="motorcycle" aria-hidden={false} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('prevents native svg props from overriding controlled labeled aria semantics', () => {
    render(<MotoIcon name="star" label="Calificación" role="presentation" />);
    const svg = screen.getByRole('img', { name: 'Calificación' });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('renders text_ad icon', () => {
    const { container } = render(<MotoIcon name="text_ad" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
  });

  it('renders terminal icon', () => {
    const { container } = render(<MotoIcon name="terminal" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders search_off icon', () => {
    const { container } = render(<MotoIcon name="search_off" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
  });

  it('renders radar icon', () => {
    const { container } = render(<MotoIcon name="radar" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
  });

  it('renders vibration icon', () => {
    const { container } = render(<MotoIcon name="vibration" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
  });

  it('renders all registered icon names without error', () => {
    const names: Array<React.ComponentProps<typeof MotoIcon>['name']> = [
      'add',
      'adjust',
      'air',
      'analytics',
      'arrow_forward',
      'arrow_right_alt',
      'bike_lane',
      'block',
      'bolt',
      'build',
      'calendar_month',
      'check_circle',
      'chevron_left',
      'chevron_right',
      'close',
      'comment',
      'compare_arrows',
      'delete_forever',
      'edit',
      'expand_less',
      'expand_more',
      'filter_alt',
      'flag',
      'forum',
      'group',
      'groups',
      'height',
      'info',
      'keyboard_double_arrow_left',
      'keyboard_double_arrow_right',
      'local_gas_station',
      'logout',
      'manage_search',
      'memory',
      'motorcycle',
      'oil_barrel',
      'palette',
      'payments',
      'radar',
      'rate_review',
      'remove',
      'reply',
      'report',
      'route',
      'schedule',
      'search',
      'search_off',
      'settings',
      'settings_input_component',
      'shield',
      'speed',
      'sports_motorsports',
      'star',
      'star_half',
      'sync',
      'terminal',
      'text_ad',
      'thumb_down',
      'thumb_up',
      'tune',
      'verified',
      'vibration',
      'weight',
      'workspace_premium',
    ];

    for (const name of names) {
      const { container } = render(<MotoIcon name={name} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    }
  });
});
