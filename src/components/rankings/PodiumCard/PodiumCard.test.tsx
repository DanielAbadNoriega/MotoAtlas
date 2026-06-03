import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PodiumCard } from './PodiumCard';
import type { Bike } from '../../../types/bike';

const mockBike: Bike = {
  id: 'bike-1',
  brand: 'BMW',
  model: 'F 900 GS',
  year: 2024,
  segment: 'trail',
  license: 'A',
  displacementCc: 895,
  powerHp: 105,
  torqueNm: 93,
  wetWeightKg: 219,
  seatHeightMm: 870,
  fuelTankLiters: 14.5,
  priceEur: 13950,
  engineType: 'parallel-twin' as const,
  imageUrl: '/images/bmw-f900-gs.webp',
  description: 'Trail media con electrónica completa.',
  useScores: { city: 7, touring: 8, sport: 6, beginner: 5, funFactor: 7, offroad: 8, passenger: 6 },
  features: { absCornering: true, tractionControl: true, ridingModes: true, cruiseControl: false, quickshifter: true, heatedGrips: false, tubelessWheels: false },
  pros: ['Motor elástico', 'Buen equilibrio'],
  cons: ['Precio alto'],
  reliabilityReports: { commonIssues: ['Calor en ciudad'], reliabilityScore: 8.2, reportCount: 12 },
};

const defaultProps = {
  bike: mockBike,
  rank: 1,
  scoreLabel: '8.5',
  confidence: 'high' as const,
  confidenceTooltip: 'Alta confianza',
  stats: [
    { label: 'Reviews', value: '127' },
    { label: 'Potencia', value: '105 CV' },
  ],
  meta: '2024 · Trail · 895 cc',
  href: '#/comunidad/bmw-f900-gs',
};

describe('PodiumCard', () => {
  it('renders brand and model title', () => {
    render(<PodiumCard {...defaultProps} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('F 900 GS');
    expect(screen.getByText('BMW')).toBeInTheDocument();
  });

  it('renders rank badge with padded rank', () => {
    render(<PodiumCard {...defaultProps} rank={1} />);
    const badge = screen.getByText('01').closest('.podium-card__rank-badge');
    expect(badge).toBeInTheDocument();
  });

  it('renders rank 02 for rank 2', () => {
    render(<PodiumCard {...defaultProps} rank={2} />);
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('renders meta text', () => {
    render(<PodiumCard {...defaultProps} />);
    expect(screen.getByText('2024 · Trail · 895 cc')).toBeInTheDocument();
  });

  it('renders stats array', () => {
    render(<PodiumCard {...defaultProps} />);
    const stats = screen.getByText('Reviews').closest('.podium-card__stats') as HTMLElement;
    expect(stats).toBeInTheDocument();
    expect(within(stats).getByText('127')).toBeInTheDocument();
    expect(within(stats).getByText('105 CV')).toBeInTheDocument();
  });

  it('renders scoreLabel', () => {
    render(<PodiumCard {...defaultProps} />);
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('renders confidence shield with tooltip', () => {
    render(<PodiumCard {...defaultProps} />);
    const shield = screen.getByLabelText('Alta confianza');
    expect(shield).toBeInTheDocument();
    const tooltip = within(shield).getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Alta confianza');
  });

  it('renders CTA href', () => {
    render(<PodiumCard {...defaultProps} />);
    const cta = screen.getByRole('link', { name: /Ver reviews/i });
    expect(cta).toHaveAttribute('href', '#/comunidad/bmw-f900-gs');
  });

  it('applies large variant class by default', () => {
    render(<PodiumCard {...defaultProps} />);
    const card = screen.getByRole('article');
    expect(card.className).toContain('podium-card--large');
  });

  it('applies compact variant class when variant=compact', () => {
    render(<PodiumCard {...defaultProps} variant="compact" />);
    const card = screen.getByRole('article');
    expect(card.className).toContain('podium-card--compact');
  });

  it('uses eager loading when rank=1', () => {
    render(<PodiumCard {...defaultProps} rank={1} />);
    const img = screen.getByRole('img', { name: /Imagen de BMW F 900 GS/i });
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('uses lazy loading when rank > 1', () => {
    render(<PodiumCard {...defaultProps} rank={3} />);
    const img = screen.getByRole('img', { name: /Imagen de BMW F 900 GS/i });
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('does not render null or undefined visible text', () => {
    const { container } = render(
      <PodiumCard
        bike={mockBike}
        rank={1}
        scoreLabel="8.0"
        confidence="medium"
        confidenceTooltip="Media confianza"
        stats={[]}
        meta=""
        href="#"
      />,
    );
    expect(container).not.toHaveTextContent('null');
    expect(container).not.toHaveTextContent('undefined');
  });

  it('renders custom ctaLabel when provided', () => {
    render(<PodiumCard {...defaultProps} ctaLabel="Ver ranking" />);
    expect(screen.getByRole('link', { name: /Ver ranking/i })).toBeInTheDocument();
  });

  it('renders multiple stats correctly', () => {
    render(
      <PodiumCard
        {...defaultProps}
        stats={[
          { label: 'Reviews', value: '50' },
          { label: 'Potencia', value: '120 CV' },
          { label: 'Peso', value: '215 kg' },
        ]}
      />,
    );
    const stats = screen.getByText('Reviews').closest('.podium-card__stats') as HTMLElement;
    expect(stats).toBeInTheDocument();
    expect(within(stats).getByText('50')).toBeInTheDocument();
    expect(within(stats).getByText('120 CV')).toBeInTheDocument();
    expect(within(stats).getByText('215 kg')).toBeInTheDocument();
  });

  it('does not render stats section when stats is empty', () => {
    render(<PodiumCard {...defaultProps} stats={[]} />);
    expect(screen.queryByText('Reviews')).not.toBeInTheDocument();
  });
});