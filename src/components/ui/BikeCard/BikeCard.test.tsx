import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../../test/fixtures/bikes';
import { BikeCard } from './BikeCard';

describe('BikeCard', () => {
  it('renders a friendly segment label for hyphenated segments', () => {
    const bike = { ...bikeFixtures[0], id: 'test-bikecard-segment-label', segment: 'sport-touring' as const };
    const { container } = render(<BikeCard bike={bike} />);

    expect(screen.getByText('Sport Touring')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('sport-touring');
  });

  it('does not render undefined when segment label is shown', () => {
    const bike = { ...bikeFixtures[0], id: 'test-bikecard-segment-undefined', segment: 'neo-retro' as const };
    const { container } = render(<BikeCard bike={bike} />);

    expect(screen.getByText('Neo-retro')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('undefined');
  });
});
