import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeaturedBikes } from './FeaturedBikes';

describe('FeaturedBikes', () => {
  it('usa imágenes locales reales para las motos destacadas', () => {
    render(<FeaturedBikes />);

    expect(screen.getByRole('img', { name: /Trail media-alta/i })).toHaveAttribute(
      'src',
      '/images/motorcycles/bmw-f-900-gs-2024.webp',
    );
    expect(screen.getByRole('img', { name: /Trail ligera/i })).toHaveAttribute(
      'src',
      '/images/motorcycles/aprilia-tuareg-660-2024.webp',
    );
    expect(screen.getByRole('img', { name: /Trail sencilla/i })).toHaveAttribute(
      'src',
      '/images/motorcycles/yamaha-tenere-700-2024.webp',
    );
  });
});
