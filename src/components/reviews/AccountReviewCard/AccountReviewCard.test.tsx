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

    expect(card).toHaveClass('account-review-card--full');
    expect(within(card).getByRole('heading', { name: /BMW F 900 GS 2024/i })).toBeInTheDocument();
    expect(within(card).getByText('Publicada')).toBeInTheDocument();
    expect(within(card).getByText(/5\/5 rating/i)).toBeInTheDocument();
    expect(within(card).getByText('8500 km')).toBeInTheDocument();
    expect(within(card).getByText('+ Motor lleno')).toBeInTheDocument();
    expect(within(card).getByText('- Precio alto')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver ficha/i })).toHaveAttribute('href', '#/motos/bmw-f-900-gs-2024');
    expect(within(card).getByRole('link', { name: /Ver comunidad/i })).toHaveAttribute('href', '#/comunidad/bmw-f-900-gs-2024');
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
});
