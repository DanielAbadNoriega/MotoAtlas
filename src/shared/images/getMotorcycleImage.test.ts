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

  it('acepta blob: URLs para previews locales', () => {
    const result = getMotorcycleImage({ brand: 'Honda', model: 'CB750 Hornet', imageUrl: 'blob:https://example.com/550e8400-e29b-41d4-a716-446655440000' });

    expect(result).toEqual({
      altText: 'Imagen de Honda CB750 Hornet',
      imageUrl: 'blob:https://example.com/550e8400-e29b-41d4-a716-446655440000',
      isFallback: false,
    });
  });

  it('rechaza javascript: como protocolo inseguro', () => {
    const result = getMotorcycleImage({ brand: 'Kawasaki', model: 'Z900', imageUrl: 'javascript:alert(1)' });

    expect(result).toMatchObject({
      altText: 'Imagen técnica pendiente de Kawasaki Z900',
      imageUrl: MOTORCYCLE_IMAGE_FALLBACK_URL,
      isFallback: true,
      reason: 'invalid-url',
    });
  });

  it('acepta rutas locales comenzando con /', () => {
    const result = getMotorcycleImage({ brand: 'Yamaha', model: 'MT-07', imageUrl: '/images/motorcycles/yamaha-mt-07-2024.webp' });

    expect(result).toEqual({
      altText: 'Imagen de Yamaha MT-07',
      imageUrl: '/images/motorcycles/yamaha-mt-07-2024.webp',
      isFallback: false,
    });
  });

  it('acepta URLs https://', () => {
    const result = getMotorcycleImage({ brand: 'Ducati', model: 'Monster', imageUrl: 'https://example.com/monster.webp' });

    expect(result).toEqual({
      altText: 'Imagen de Ducati Monster',
      imageUrl: 'https://example.com/monster.webp',
      isFallback: false,
    });
  });
});
