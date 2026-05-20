import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createReviewFixture } from '../../../test/fixtures/reviews';
import { AccountReviewCard } from './AccountReviewCard';

const review = createReviewFixture({
  motorcycleId: 'bmw-f-900-gs-2024',
  motorcycle: {
    id: 'bmw-f-900-gs-2024',
    brand: 'BMW',
    model: 'F 900 GS',
    year: 2024,
    imageUrl: '/images/motorcycles/bmw-f-900-gs-2024.webp',
  },
  status: 'approved',
});

describe('AccountReviewCard', () => {
  it('renderiza la variante full con datos técnicos y enlaces', () => {
    render(<AccountReviewCard review={review} />);

    const card = screen.getByTestId('account-review-card');
    const header = card.querySelector('.account-review-card__header');
    const footer = card.querySelector('.account-review-card__footer');

    expect(card).toHaveClass('account-review-card--full');
    expect(header).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: /BMW F 900 GS 2024/i })).toBeInTheDocument();
    expect(within(card).getByText('Publicada')).toBeInTheDocument();
    expect(within(header as HTMLElement).getByLabelText('Rating 5 de 5')).toBeInTheDocument();
    expect(within(header as HTMLElement).getByText('★')).toBeInTheDocument();
    expect(within(header as HTMLElement).getByText('5')).toBeInTheDocument();
    expect(within(card).queryByText(/5\/5 Rating/i)).not.toBeInTheDocument();
    expect(within(card).getByText('8500 km')).toBeInTheDocument();
    expect(within(card).getByText('speed')).toBeInTheDocument();
    expect(within(card).getByText('schedule')).toBeInTheDocument();
    expect(within(card).getByText('route')).toBeInTheDocument();
    expect(within(card).getByText('calendar_month')).toBeInTheDocument();
    expect(within(card).getByText('+ Motor lleno')).toBeInTheDocument();
    expect(within(card).getByText('- Precio alto')).toBeInTheDocument();
    expect(within(footer as HTMLElement).getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/bmw-f-900-gs-2024');
    expect(within(footer as HTMLElement).getByRole('link', { name: /Más reviews/i })).toHaveAttribute('href', '#/comunidad/bmw-f-900-gs-2024');
    expect(within(card).queryByText('@Laura')).not.toBeInTheDocument();
  });

  it('renderiza la variante compact sin requerir datos opcionales', () => {
    render(<AccountReviewCard headingLevel={3} review={createReviewFixture({ kilometers: null, ownershipMonths: null, pros: [], cons: [] })} variant="compact" />);

    const card = screen.getByTestId('account-review-card');

    expect(card).toHaveClass('account-review-card--compact');
    expect(within(card).getByRole('heading', { level: 3 })).toBeInTheDocument();
    expect(within(card).getAllByText('Sin dato')).toHaveLength(2);
    expect(within(card).queryByLabelText('Pros')).not.toBeInTheDocument();
    expect(within(card).queryByLabelText('Contras')).not.toBeInTheDocument();
  });

  it('renderiza la variante community con alias, estrella, metadatos y sin estado', () => {
    render(<AccountReviewCard review={{ ...review, userName: 'Apex Rider' }} variant="community" />);

    const card = screen.getByTestId('account-review-card');
    const footer = card.querySelector('.account-review-card__footer');

    expect(card).toHaveClass('account-review-card--community');
    expect(within(card).queryByText('Publicada')).not.toBeInTheDocument();
    expect(within(card).getByText('@Apex_Rider')).toBeInTheDocument();
    expect(card.querySelector('.account-review-card__author-avatar')).toBeInTheDocument();
    expect(card.querySelector('.account-review-card__author-name')).toBeInTheDocument();
    expect(card.querySelector('.account-review-card__author-badge')).not.toBeInTheDocument();
    expect(within(card).getByLabelText('Rating 5 de 5')).toBeInTheDocument();
    expect(within(card).getByText('speed')).toBeInTheDocument();
    expect(within(card).getByText('schedule')).toBeInTheDocument();
    expect(within(card).getByText('route')).toBeInTheDocument();
    expect(within(card).getByText('calendar_month')).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(within(footer as HTMLElement).getByText('@Apex_Rider')).toBeInTheDocument();
    expect(within(footer as HTMLElement).getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/bmw-f-900-gs-2024');
    expect(within(footer as HTMLElement).getByRole('link', { name: /Más reviews/i })).toHaveAttribute('href', '#/comunidad/bmw-f-900-gs-2024');
  });
});
