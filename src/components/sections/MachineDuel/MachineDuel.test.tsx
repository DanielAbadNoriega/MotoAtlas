import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MachineDuel } from './MachineDuel';

describe('MachineDuel', () => {
  it('usa las imágenes locales correctas para el duelo de máquinas', () => {
    render(<MachineDuel />);

    expect(screen.getByRole('img', { name: /Trail media-alta/i })).toHaveAttribute(
      'src',
      '/images/motorcycles/bmw-f-900-gs-2024.webp',
    );
    expect(screen.getByRole('img', { name: /Trail ligera/i })).toHaveAttribute(
      'src',
      '/images/motorcycles/aprilia-tuareg-660-2024.webp',
    );
  });
});
