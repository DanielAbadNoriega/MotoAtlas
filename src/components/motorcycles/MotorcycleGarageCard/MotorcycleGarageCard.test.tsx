import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MotorcycleGarageCard } from './MotorcycleGarageCard';

describe('MotorcycleGarageCard', () => {
  const defaultProps = {
    title: 'BMW F 900 GS 2024',
    imageSource: { brand: 'BMW', imageUrl: '/images/bmw-f900-gs.webp', model: 'F 900 GS', name: 'BMW F 900 GS 2024' },
    imageAlt: 'BMW F 900 GS 2024',
    rating: 4.5,
    reviewCount: 12,
    primaryUseLabel: 'Viaje',
    lastReviewDate: '2026-05-15T10:00:00.000Z',
    reviewsHref: '#/comunidad/bmw-f900-gs',
    detailHref: '#/motos/bmw-f900-gs',
  };

  it('renders title', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('BMW F 900 GS 2024');
  });

  it('renders rating /5 with star', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const rating = screen.getByLabelText(/Rating medio/i);
    expect(rating).toHaveTextContent('★');
    expect(rating).toHaveTextContent('4.5');
  });

  it('renders shield with confidence tooltip', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const shield = screen.getByRole('img', { name: /Alta confianza/i });
    expect(shield).toBeInTheDocument();
    const tooltip = within(shield).getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Alta confianza');
  });

  it('shield shows medium confidence for 5 reviews', () => {
    render(<MotorcycleGarageCard {...defaultProps} reviewCount={5} />);
    expect(screen.getByRole('img', { name: /Media confianza/i })).toBeInTheDocument();
  });

  it('shield shows low confidence for 1 review', () => {
    render(<MotorcycleGarageCard {...defaultProps} reviewCount={1} />);
    expect(screen.getByRole('img', { name: /Baja confianza/i })).toBeInTheDocument();
  });

  it('does not use native title attribute on shield', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const shield = screen.getByRole('img', { name: /Alta confianza/i });
    expect(shield).not.toHaveAttribute('title');
  });

  it('renders usage label with explore icon', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const usageMeta = screen.getByText('Viaje').closest('.motorcycle-garage-card__meta-item') as HTMLElement;
    expect(usageMeta).toBeInTheDocument();
    const icon = usageMeta.querySelector('.material-symbols-outlined');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders review count with rate_review icon', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const reviewMeta = screen.getByText('12 reviews').closest('.motorcycle-garage-card__meta-item') as HTMLElement;
    expect(reviewMeta).toBeInTheDocument();
    const icon = reviewMeta.querySelector('.material-symbols-outlined');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders last review date with schedule icon', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const card = screen.getByTestId('motorcycle-garage-card');
    const icons = card.querySelectorAll('.material-symbols-outlined');
    const scheduleIcon = Array.from(icons).find((icon) => icon.textContent === 'schedule');
    expect(scheduleIcon).toBeInTheDocument();
    expect(scheduleIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('hides date item when lastReviewDate is null', () => {
    render(<MotorcycleGarageCard {...defaultProps} lastReviewDate={null} />);
    expect(screen.queryByRole('presentation', { name: /schedule/i })).not.toBeInTheDocument();
  });

  it('hides date item when lastReviewDate is invalid', () => {
    render(<MotorcycleGarageCard {...defaultProps} lastReviewDate="invalid-date" />);
    expect(screen.queryByRole('presentation', { name: /schedule/i })).not.toBeInTheDocument();
  });

  it('renders Reviews CTA with correct href', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const cta = screen.getByRole('link', { name: /Reviews/i });
    expect(cta).toHaveAttribute('href', '#/comunidad/bmw-f900-gs');
  });

  it('renders compact Ficha CTA with technical aria label and correct href', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const cta = screen.getByRole('link', { name: /Ver ficha técnica/i });
    expect(cta).toHaveAttribute('href', '#/motos/bmw-f900-gs');
    expect(cta).toHaveTextContent('Ficha');
  });

  it('renders optional footer actions when provided', () => {
    render(
      <MotorcycleGarageCard
        {...defaultProps}
        footerActions={<button type="button">Comparar</button>}
      />,
    );

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('button', { name: 'Comparar' })).toBeInTheDocument();
  });

  it('does not render null literal text', () => {
    const { container } = render(<MotorcycleGarageCard {...defaultProps} primaryUseLabel={null} />);
    expect(container).not.toHaveTextContent('null');
  });

  it('uses fallback Uso mixto when primaryUseLabel is missing', () => {
    render(<MotorcycleGarageCard {...defaultProps} primaryUseLabel={undefined} />);
    expect(screen.getByText('Uso mixto')).toBeInTheDocument();
  });

  it('uses fallback Uso mixto when primaryUseLabel is null', () => {
    render(<MotorcycleGarageCard {...defaultProps} primaryUseLabel={null} />);
    expect(screen.getByText('Uso mixto')).toBeInTheDocument();
  });

  it('formats singular review correctly', () => {
    render(<MotorcycleGarageCard {...defaultProps} reviewCount={1} />);
    expect(screen.getByText('1 review')).toBeInTheDocument();
  });

  it('has correct aria-label on card', () => {
    render(<MotorcycleGarageCard {...defaultProps} />);
    const card = screen.getByTestId('motorcycle-garage-card');
    expect(card).toHaveAttribute('aria-label', 'BMW F 900 GS 2024: 12 reviews');
  });

  it('renders without imageSource', () => {
    render(<MotorcycleGarageCard {...defaultProps} imageSource={null} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('BMW F 900 GS 2024');
  });
});
