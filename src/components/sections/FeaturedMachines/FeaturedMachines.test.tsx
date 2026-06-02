import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeaturedMachines } from './FeaturedMachines';

describe('FeaturedMachines', () => {
  it('renderiza el título Featured Machines', () => {
    render(<FeaturedMachines />);

    expect(screen.getByRole('heading', { level: 2, name: /featured machines/i })).toBeInTheDocument();
  });

  it('renderiza el slogan kicker', () => {
    render(<FeaturedMachines />);

    expect(screen.getByText('Built for riders, ranked by character')).toBeInTheDocument();
  });

  it('renderiza 3 cards con badges 01, 02, 03', () => {
    render(<FeaturedMachines />);

    const badges = screen.getAllByText(/^(01|02|03)$/);
    expect(badges).toHaveLength(3);
  });

  it('renderiza specs Engine, Power, Torque en cada card', () => {
    render(<FeaturedMachines />);

    const engineLabels = screen.getAllByText(/^engine$/i);
    const powerLabels = screen.getAllByText(/^power$/i);
    const torqueLabels = screen.getAllByText(/^torque$/i);

    expect(engineLabels).toHaveLength(3);
    expect(powerLabels).toHaveLength(3);
    expect(torqueLabels).toHaveLength(3);
  });

  it('cada card tiene CTAs Ver ficha y Reviews', () => {
    render(<FeaturedMachines />);

    const verFichaLinks = screen.getAllByRole('link', { name: /ver ficha/i });
    const reviewsLinks = screen.getAllByRole('link', { name: /^reviews$/i });

    expect(verFichaLinks).toHaveLength(3);
    expect(reviewsLinks).toHaveLength(3);
  });

  it('Ver ficha enlaza a #/motos/[id]', () => {
    render(<FeaturedMachines />);

    const verFichaLinks = screen.getAllByRole('link', { name: /ver ficha/i });
    verFichaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^#\/motos\//));
    });
  });

  it('Reviews enlaza a #/comunidad/[id]', () => {
    render(<FeaturedMachines />);

    const reviewsLinks = screen.getAllByRole('link', { name: /^reviews$/i });
    reviewsLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^#\/comunidad\//));
    });
  });

  it('no renderiza km/h, peso, PS ni segmento', () => {
    render(<FeaturedMachines />);

    const sections = screen.getAllByRole('article');
    sections.forEach((section) => {
      const text = section.textContent ?? '';
      expect(text.toLowerCase()).not.toContain('km/h');
      expect(text.toLowerCase()).not.toContain('kg');
      expect(text.toLowerCase()).not.toContain('ps');
      expect(text.toLowerCase()).not.toContain('segmento');
    });
  });

  it('no renderiza null ni undefined en specs', () => {
    render(<FeaturedMachines />);

    const sections = screen.getAllByRole('article');
    sections.forEach((section) => {
      const text = section.textContent ?? '';
      expect(text).not.toContain('null');
      expect(text).not.toContain('undefined');
    });
  });

  it('usa datos reales de las primeras 3 motos de bikes.ts', () => {
    render(<FeaturedMachines />);

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute(
      'src',
      '/images/motorcycles/bmw-f-900-gs-2024.webp',
    );
  });
});