import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createReviewFixture } from '../../../test/fixtures/reviews';
import { MotorcycleReviewCard } from './MotorcycleReviewCard';

describe('MotorcycleReviewCard', () => {
  it('muestra alias y contenido sin renderizar el texto literal person', () => {
    render(<MotorcycleReviewCard review={createReviewFixture({ userName: 'MoteroViajero' })} />);

    expect(screen.getByRole('heading', { name: 'MoteroViajero' })).toBeInTheDocument();
    expect(screen.queryByText('person')).not.toBeInTheDocument();
  });

  it('muestra badge verificado solo cuando viene marcado', () => {
    const { rerender } = render(<MotorcycleReviewCard review={createReviewFixture({ verified: false })} />);
    expect(screen.queryByText('Review verificada')).not.toBeInTheDocument();

    rerender(<MotorcycleReviewCard review={createReviewFixture({ verified: true })} />);
    expect(screen.getByText('Review verificada')).toBeInTheDocument();
  });
});
