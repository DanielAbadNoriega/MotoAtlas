import { describe, expect, it } from 'vitest';
import { MOTORCYCLE_IMAGE_FALLBACK_URL, getMotorcycleImage } from './getMotorcycleImage';

describe('getMotorcycleImage', () => {
  it('usa la imagen real cuando imageUrl es válida', () => {
    const result = getMotorcycleImage({ brand: 'BMW', model: 'F 900 GS', imageUrl: 'https://example.com/bmw.jpg' });

    expect(result).toEqual({
      altText: 'Imagen de BMW F 900 GS',
      imageUrl: 'https://example.com/bmw.jpg',
      isFallback: false,
    });
  });

  it('usa fallback cuando imageUrl falta', () => {
    const result = getMotorcycleImage({ brand: 'Aprilia', model: 'Tuareg 660' });

    expect(result).toMatchObject({
      altText: 'Imagen técnica pendiente de Aprilia Tuareg 660',
      imageUrl: MOTORCYCLE_IMAGE_FALLBACK_URL,
      isFallback: true,
      reason: 'empty',
    });
  });

  it('usa fallback cuando imageUrl está vacía', () => {
    const result = getMotorcycleImage({ brand: 'Yamaha', model: 'Ténéré 700', imageUrl: '   ' });

    expect(result.imageUrl).toBe(MOTORCYCLE_IMAGE_FALLBACK_URL);
    expect(result.isFallback).toBe(true);
  });

  it('usa fallback cuando imageUrl contiene un placeholder inválido', () => {
    const result = getMotorcycleImage({ brand: 'CFMoto', model: '800MT-X', imageUrl: 'https://placehold.co/1200x800?text=sin+imagen' });

    expect(result).toMatchObject({
      altText: 'Imagen técnica pendiente de CFMoto 800MT-X',
      imageUrl: MOTORCYCLE_IMAGE_FALLBACK_URL,
      isFallback: true,
      reason: 'known-placeholder',
    });
  });
});
